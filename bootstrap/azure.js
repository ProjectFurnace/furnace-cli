const Azure = require('azure')
    , azureUtils = require("../utils/azure")
    , fs = require("fs")
    , ResourceManagementClient = require("azure-arm-resource").ResourceManagementClient
    ;

module.exports.ignite = (instanceName, location, subscriptionId, templateFile) => {
  const resourceGroupName = `${instanceName}rg`
      , storageAccountName = `${instanceName}sa`
      , deploymentName = `${instanceName}deploy`
      , templateParameters = {
        "storageAccountName": {
          "value": storageAccountName
        },
        "containerName": {
          "value": "tempc"
        },
        "location": {
          "value": location
        }
      };

  let resourceClient;
  let storageClient;

  return azureUtils.interactiveLogin().then(credentials => {
    resourceClient = new ResourceManagementClient(credentials, subscriptionId);
    storageClient = Azure.createStorageManagementClient(credentials, subscriptionId);

    return createResourceGroup(resourceClient, resourceGroupName, location);
  }).then(() => {
    return createStorageAccount(storageClient, storageAccountName, resourceGroupName, location);
  }).then(() => {
    return buildAndUploadFunctions();
  }).then(() => {
    return loadTemplateAndDeploy(resourceClient, resourceGroupName, deploymentName, templateFile, templateParameters);
  }).then(deployResult => {
    return deployResult;
  }).catch(error => {
    throw new Error(`got error whilst deploying azure bootstrap: ${error}`);
  })
}

function buildAndUploadFunctions() {
  return new Promise((resolve, reject) => {
    console.log("building functions...");
    resolve();
  });
}

function createStorageAccount(storageClient, name, resourceGroup, location) {
  return new Promise((resolve, reject) => {
    storageAccountExists(storageClient, name).then(exists => {
      const createParameters = {
        location,
        sku: {
          name: 'Standard_LRS'
        },
        kind: 'Storage'
      };
  
      if (exists) {
        console.log(`storage account ${name} already exists, not creating`);
        resolve();
      } else {
        console.log(`creating storage account ${name}`);
        storageClient.storageAccounts.create(resourceGroup, name, createParameters, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      }
    })
  })
}

function storageAccountExists(storageClient, name) {
  return new Promise((resolve, reject) => {
    storageClient.storageAccounts.checkNameAvailability(name, (err, result) => {
      if (err) reject(err);
      else resolve(!result.nameAvailable);
    });
  })
}

function createResourceGroup(resourceClient, resourceGroupName, location) {
  return new Promise((resolve, reject) => {
    const groupParameters = { location, tags: { origin: 'furnace' } };
    resourceClient.resourceGroups.createOrUpdate(resourceGroupName, groupParameters, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    })
  })
}

function loadTemplateAndDeploy(resourceClient, resourceGroupName, deploymentName, templateFile, parameters) {
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

    console.log("deploying bootstrap template...");
    resourceClient.deployments.createOrUpdate(resourceGroupName, deploymentName, deploymentParameters, (err, result) => {
      if (err) reject(err);
      else (resolve(result));
    });
  })
}