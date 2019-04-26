const Azure = require('azure')
    , azureUtils = require("../utils/azure")
    , fs = require("fs")
    , path = require("path")
    , ResourceManagementClient = require("azure-arm-resource").ResourceManagementClient
    , fsUtils = require("@project-furnace/fsutils")
    , exec = require("child_process").exec
    , zipUtils = require("@project-furnace/ziputils")
    , azureStorage = require("azure-storage")
    , util = require("util")
    ;

module.exports.ignite = config => {

  const { name, location, subscriptionId, templateDir, functionsDir } = config;
  const resourceGroupName = `${name}rg`
      , bootstrapStorageAccountName = `${name}bootstrap`
      , bootstrapStorageContainerName = `${name}bootstrapc`
      , artifactsStorageAccountName = `${name}artifacts`
      , artifactsStorageContainerName = `${name}artifactsc`
      ;

  let resourceClient, storageClient, artifactPath, restClient, deploymentContainerExecRoleId;

  return azureUtils.login().then(credentials => {
    resourceClient = new ResourceManagementClient(credentials, subscriptionId);
    storageClient = Azure.createStorageManagementClient(credentials, subscriptionId);

    const accessToken = credentials.tokenCache._entries[credentials.tokenCache._entries.length - 1].accessToken;

    restClient = azureUtils.getHttpClient(`https://management.azure.com/subscriptions/${subscriptionId}`, accessToken);

    return createResourceGroup(resourceClient, resourceGroupName, location);
  }).then(() => {
    return createDeploymentContainerExecRole(restClient, location, templateDir);
  }).then((createDeploymentContainerExecRoleResult) => {
    deploymentContainerExecRoleId = createDeploymentContainerExecRoleResult.properties.parameters.roleDefName.value;
    return createDeploymentUserIdentity(resourceClient, resourceGroupName, templateDir);
  }).then((createDeploymentUserIdentityResult) => {
    const principalId = createDeploymentUserIdentityResult.properties.outputs.principalId.value;
    return assignRoleToDeploymentUserIdentity(restClient, location, templateDir, principalId);
  }).then(() => {
    return deployInitialTemplate(resourceClient, resourceGroupName, name, location, bootstrapStorageAccountName, bootstrapStorageContainerName, templateDir);
  }).then(() => {
    return buildFunctions(functionsDir, resourceGroupName);
  }).then((artifact) => {
    artifactPath = artifact;
    return getStorageKey(storageClient, resourceGroupName, bootstrapStorageAccountName);
  }).then((storageKey) => {
    return upload(storageKey, bootstrapStorageAccountName, bootstrapStorageContainerName, artifactPath)
  }).then((blobUrl) => {
    return deployBootstrapTemplate(resourceClient, resourceGroupName, name, artifactsStorageAccountName, artifactsStorageContainerName, templateDir, config, deploymentContainerExecRoleId, blobUrl);
  }).then(deployResult => {
    // return here any values that should be stored in the local context
    return Promise.resolve({
      artifactBucketConnectionString: deployResult.properties.outputs.connectionString.value
    })
  }).catch(error => {
    throw new Error(`got error whilst deploying azure bootstrap: ${util.inspect(error, { depth: null })}`);
  })
}

function deployInitialTemplate(resourceClient, resourceGroupName, instanceName, location, storageAccountName, storageContainerName, templateDir) {
  const initialDeploymentName = `${instanceName}Initial`
      , initialTemplate = path.join(templateDir, "base.json")
      , initialTemplateParameters = {
          "storageAccountName": {
            "value": storageAccountName
          },
          "containerName": {
            "value": storageContainerName
          },
          "location": {
            "value": location
          }
      }
  
  return deployResourceGroupTemplate(resourceClient, resourceGroupName, initialDeploymentName, initialTemplate, initialTemplateParameters);
}

function deployBootstrapTemplate(resourceClient, resourceGroupName, instanceName, storageAccountName, storageContainerName, templateDir, igniteConfig, deploymentContainerExecRoleId, blobUrl) {
  
  const bootstrapTemplate = path.join(templateDir, "bootstrap.json")
      , bootstrapDeploymentName = `${instanceName}Bootstrap`
      , bootstrapTemplateParameters = {
      "storageAccountName": {
        "value": storageAccountName
      },
      "containerName": {
        "value": storageContainerName
      },
      "ApiKey": {
        "value": igniteConfig.apiKey
      },
      "GitToken": {
        "value": igniteConfig.gitToken
      },
      "GitHookSecret": {
        "value": igniteConfig.gitHookSecret
      },
      "deploymentContainerExecRoleId": {
        "value": deploymentContainerExecRoleId
      },
      "blobUrl": {
        "value": blobUrl
      }
    }
  
  return deployResourceGroupTemplate(resourceClient, resourceGroupName, bootstrapDeploymentName, bootstrapTemplate, bootstrapTemplateParameters);
}

function createDeploymentContainerExecRole(restClient, location, templateDir) {
  console.log("creating deployment container exec role...");

  const templateFile = path.join(templateDir, "deployExecRole.json");

  return deploySubscriptionTemplate(restClient, location, "FurnaceDeploymentContainerExecRole", templateFile, {}); 
}

function createDeploymentUserIdentity(resourceClient, resourceGroupName, templateDir) {
  console.log("creating deployment user identity...");

  const deploymentName = "DeploymentUserIdentity"
      , templateFile = path.join(templateDir, "userAssignedIdentity.json")
      , parameters = {
        "resourceName": {
          "value": "FurnaceDeployUserIdentity"
        }
      }

  return deployResourceGroupTemplate(resourceClient, resourceGroupName, deploymentName, templateFile, parameters); 
}

function assignRoleToDeploymentUserIdentity(restClient, location, templateDir, principalId) {
  const templateFile = path.join(templateDir, "assignRoleToDeploymentUserIdentity.json")
  , parameters = {
    "principalId": {
      "value": principalId
    }
  }

  return deploySubscriptionTemplate(restClient, location, "DeploymentRoleAssignment", templateFile, parameters); 
}

function deploySubscriptionTemplate(restClient, location, deploymentName, templateFile, parameters) {
  const url = `/providers/Microsoft.Resources/deployments/${deploymentName}?api-version=2018-05-01`
      , template = JSON.parse(fsUtils.readFile(templateFile))
      , data = {
        location,
          properties: {
            mode: "Incremental",
            template,
            parameters
          }
        }
      ; 

  return restClient({
    method: "put",
    url,
    data
  }).then(response => response.data);
}

function getStorageKey(storageClient, resourceGroupName, storageAccountName) {
  return new Promise((resolve, reject) => {
    storageClient.storageAccounts.listKeys(resourceGroupName, storageAccountName, (err, result) => {
      if (err) reject(err);
      else {
        if (!result.keys || !result.keys.length > 0) reject(new Error("unable to get storage key"));
        else {
          resolve(result.keys[0].value);
        }
      }
    })
  });
}

function buildFunctions(functionsDir, resourceGroupName) {
      console.log("building functions...");

      const tempDir = fsUtils.createTempDirectory()
          , uploadPackage = path.join(tempDir, "bootstrapFunctions.zip")
          , execPath = path.join(functionsDir, 'deploy-exec/function.json')
          , triggerPath = path.join(functionsDir, 'deploy-trigger/function.json');


      const triggerraw = fsUtils.readFile(triggerPath)
          , triggerjson = JSON.parse(triggerraw);

      const execraw = fsUtils.readFile(execPath)
          , execjson = JSON.parse(execraw);
    
      const triggerBindings = [{
          type: 'httpTrigger',
          direction: 'in',
          name: 'request',
          authLevel: 'anonymous',
          route: 'deploy-trigger/hook'
      },
      {
          type: 'eventHub',
          direction: 'out',
          name: 'eventOutput',
          eventHubName: resourceGroupName + '-deployHub',
          connection: 'eventPullConnectionString'
      },
      {
          type: "http",
          direction: "out",
          name: "$return"
      }];  

      const execBindings = [{
          type: 'eventHubTrigger',
          direction: 'in',
          name: 'eventInput',
          eventHubName: resourceGroupName + '-deployHub',
          connection: 'eventPullConnectionString'
      },
      {
          type: "http",
          direction: "out",
          name: "$return"
      }];      
    
      triggerjson.bindings = triggerBindings;
      execjson.bindings = execBindings;

      fsUtils.writeFile(triggerPath, JSON.stringify(triggerjson));
      fsUtils.writeFile(execPath, JSON.stringify(execjson));

      fsUtils.cp(functionsDir, tempDir);
      fsUtils.writeFile(path.join(tempDir, "host.json"), JSON.stringify({ version: "2.0" }));
      fsUtils.writeFile(path.join(tempDir, "extensions.csproj"), `
<Project Sdk="Microsoft.NET.Sdk">
<PropertyGroup>
  <TargetFramework>netstandard2.0</TargetFramework>
<WarningsAsErrors></WarningsAsErrors>
<DefaultItemExcludes>**</DefaultItemExcludes>
</PropertyGroup>
<ItemGroup>
  <PackageReference Include="Microsoft.Azure.WebJobs.Extensions.EventHubs" Version="3.0.3" />
  <PackageReference Include="Microsoft.Azure.WebJobs.Script.ExtensionsMetadataGenerator" Version="1.0.2" />
</ItemGroup>
</Project>
`
      );

        return execPromise("npm install --production", { cwd: path.join(tempDir, "deploy-trigger"), env: process.env
      }).then(() => {
        return execPromise("npm install --production", { cwd: path.join(tempDir, "deploy-exec"), env: process.env })
      }).then(() => {
        return execPromise("func extensions install", { cwd: tempDir, env: process.env});
      }).then(() => {
        return zipUtils.compress(tempDir, uploadPackage);
      }).then(() => {
        return Promise.resolve(uploadPackage);
      })
}

// function createStorageAccount(storageClient, resourceGroup, location, name) {
//   return new Promise((resolve, reject) => {
//     storageAccountExists(storageClient, name).then(exists => {
//       const createParameters = {
//         location,
//         sku: {
//           name: 'Standard_LRS'
//         },
//         kind: 'Storage'
//       };

//       if (exists) {
//         console.log(`storage account ${name} already exists, not creating`);
//         resolve();
//       } else {
//         console.log(`creating storage account ${name}`);
//         storageClient.storageAccounts.create(resourceGroup, name, createParameters, (err, result) => {
//           if (err) reject(err);
//           else resolve(result);
//         });
//       }
//     })
//   })
// }

// function storageAccountExists(storageClient, name) {
//   return new Promise((resolve, reject) => {
//     storageClient.storageAccounts.checkNameAvailability(name, (err, result) => {
//       if (err) reject(err);
//       else resolve(!result.nameAvailable);
//     });
//   })
// }

function createResourceGroup(resourceClient, resourceGroupName, location) {
  return new Promise((resolve, reject) => {
    const groupParameters = { location, tags: { origin: 'furnace' } };
    resourceClient.resourceGroups.createOrUpdate(resourceGroupName, groupParameters, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    })
  })
}

function deployResourceGroupTemplate(resourceClient, resourceGroupName, deploymentName, templateFile, parameters) {
  return new Promise((resolve, reject) => {
    let template;
    try {
      template = JSON.parse(fs.readFileSync(templateFile, "utf8"));
    } catch (err) { reject(err) }

    const deploymentParameters = {
      "properties": {
        "parameters": parameters,
        "template": template,
        "mode": "Incremental"
      }
    };

    console.log(`commiting template for deployment ${deploymentName}...`);
    resourceClient.deployments.createOrUpdate(resourceGroupName, deploymentName, deploymentParameters, (err, result) => {
      if (err) reject(err);
      else (resolve(result));
    });
  })
}

function upload(storageKey, storageAccountName, storageContainerName, artifactPath) {
  return new Promise((resolve, reject) => {
    const artifactKey = "bootstrapFunctions.zip"
        , connectionString = `DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${storageKey};EndpointSuffix=core.windows.net`
        , blobService = azureStorage.createBlobService(connectionString)
        ;

    blobService.createBlockBlobFromLocalFile(storageContainerName, artifactKey, artifactPath, (error, result) => {
      if (error) reject(error);
      else {
        var startDate = new Date();
        var expiryDate = new Date(startDate);
        expiryDate.setFullYear(startDate.getFullYear() + 100);
        startDate.setMinutes(startDate.getMinutes() - 100);
  
        var sharedAccessPolicy = {
          AccessPolicy: {
            Permissions: azureStorage.BlobUtilities.SharedAccessPermissions.READ,
            Start: startDate,
            Expiry: expiryDate
          }
        };

        var token = blobService.generateSharedAccessSignature(storageContainerName, artifactKey, sharedAccessPolicy);
        var sasUrl = blobService.getUrl(storageContainerName, artifactKey, token);
        resolve(sasUrl);
      }
    });
  });
}

function execPromise(command, options) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

module.exports.buildFunctions = buildFunctions;