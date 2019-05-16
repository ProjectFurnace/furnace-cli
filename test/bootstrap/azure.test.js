const azureBootstrap = require("../../bootstrap/azure")
    , azureUtils = require("../../utils/azure")
    , Azure = require('azure')
    , util = require("util")
    ;

describe('bootstrap/azure', () => {
  describe.skip('buildAndUploadFunctions', () => {
    it('should successfully process functions', async () => {
      const result = await azureBootstrap.buildFunctions("./test/fixtures/bootstrap/azure");

      console.log("result was", result);
    });
  });

  describe('upload', () => {
    it('should work', async () => {
      jest.setTimeout(100000);
      const subscriptionId = "836eaf85-82b8-4c2d-a4d1-2082104c7362";
      const credentials = await azureUtils.interactiveLogin();
  
      storageClient = Azure.createStorageManagementClient(credentials, subscriptionId);

      console.log(util.inspect(storageClient, { depth: null }));

      storageClient.storageAccounts.listKeys("temprg", "dannytestaccount", (err, result) => {
        console.log("response", err, result);
      } )

    });

      
  });
});