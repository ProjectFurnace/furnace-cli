const msrestazure = require("ms-rest-azure")
    , moment = require("moment")
    , graph = require("azure-graph")
    , Azure = require('azure')
    ;

module.exports.interactiveLogin = () => {
  return new Promise((resolve, reject) => {
    msrestazure.interactiveLogin((err, credentials) => {
      if (err) reject(err);
      else resolve(credentials);
    })
  });
}

// module.exports.login = () => {
//   var credsForGraph = new msrestazure.DeviceTokenCredentials(options);
//   var graphClient = new graph(credsForGraph, tenantId);
// }

// module.exports.loginWithServicePrincipalSecret = () => {
//   return new Promise((resolve, reject) => {
//     msrestazure.loginWithServicePrincipalSecret(clientId, secret, domain, (err, credentials) => {
//       if (err) reject(err);
//       else resolve(credentials);
//       // resourceClient = new ResourceManagementClient(credentials, subscriptionId);
//     });
//   });
// }

// module.exports.createApplication = () => {
//   return new Promise((resolve, reject) => {
    
//     const homepage = "furnace.org";
    
//     let endDate = new Date(startDate.toISOString());
//     var m = moment(endDate);
//     m.add(1, "years");
//     endDate = new Date(m.toISOString());
    
//     const parameters = {
//       availableToOtherTenants: false,
//       displayName: "Furnace Bootstrap",
//       homepage,
//       identifierUris: [ homepage ],
//       passwordCredentials: [{
//         startDate: new Date(Date.now()),
//         endDate: new Date(startDate.toISOString()),
//         keyId: msrestazure.generateUuid(),
//         value: msrestazure.generateUuid()
//       }]
//     };
    
//     console.log("application params", parameters);
    
//     graphClient.applications.create(parameters, function (err, application, req, res) {
//       if (err) reject(err);
//       else resolve(application);
//     });
//   })
// }