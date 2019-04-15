const azureUtils = require("../utils/azure")
  , util = require("util")
  , fs = require("fs")
  , ResourceManagementClient = require("azure-arm-resource").ResourceManagementClient
  , StorageManagementClient = require("azure-asm-storage").StorageManagementClient.StorageManagementClient
  ;

module.exports.ignite = (location, subscriptionId, templateFile) => {
  const resourceGroupName = "temprg"
      , deploymentName = "tempdeploy"
      , parameters = {
        "storageAccountName": {
          "value": "furnacetempsa"
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
    storageClient = new StorageManagementClient(credentials);
    return createResourceGroup(resourceClient, resourceGroupName, location);
  }).then(() => {
    return loadTemplateAndDeploy(resourceClient, resourceGroupName, deploymentName, templateFile, parameters);
  }).then(deployResult => {
    return deployResult;
  }).catch(error => {
    throw new Error(`got error whilst deploying azure bootstrap: ${error}`);
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

    resourceClient.deployments.createOrUpdate(resourceGroupName, deploymentName, deploymentParameters, (err, result) => {
      if (err) reject(err);
      else (resolve(result));
    });
  })
}