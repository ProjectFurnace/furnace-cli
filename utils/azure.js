const msrestazure = require("ms-rest-azure")
    // , moment = require("moment")
    // , graph = require("azure-graph")
    // , Azure = require('azure')
    , axios = require("axios")
    ;

module.exports.login = () => {
  if (process.env.ARM_CLIENT_ID) {
    return module.exports.servicePrincipalLogin();
  } else {
    return module.exports.interactiveLogin();
  }
}
  
module.exports.servicePrincipalLogin = () => {
  return new Promise((resolve, reject) => {
    const clientId = process.env.ARM_CLIENT_ID
      , password = process.env.ARM_CLIENT_SECRET
      , tenantId = process.env.ARM_TENANT_ID
      ;

      msrestazure.loginWithServicePrincipalSecret(clientId, password, tenantId, (err, credentials) => {
        if (err) reject(err);
        else (resolve(credentials));
      });
  });
}

module.exports.interactiveLogin = () => {
  return new Promise((resolve, reject) => {
    msrestazure.interactiveLogin((err, credentials) => {
      if (err) reject(err);
      else resolve(credentials);
    })
  });
}

module.exports.getHttpClient = (baseURL, accessToken) => {
  return axios.create({
    baseURL,
    headers: {
      "authorization": "Bearer " + accessToken,
      "content-type": "application/json"
    }
  });
}

module.exports.getRegions = () => {
  return [{ name: "East Asia", value: "eastasia"},
          {name: "Southeast Asia", value: "southeastasia"},
          {name: "Central US", value: "centralus"},
          {name: "East US", value: "eastus"},
          {name: "East US 2", value: "eastus2"},
          {name: "West US", value: "westus"},
          {name: "North Central US", value: "northcentralus"},
          {name: "South Central US", value: "southcentralus"},
          {name: "North Europe", value: "northeurope"},
          {name: "West Europe", value: "westeurope"},
          {name: "Japan West", value: "japanwest"},
          {name: "Japan East", value: "japaneast"},
          {name: "Brazil South", value: "brazilsouth"},
          {name: "Australia East", value: "australiaeast"},
          {name: "Australia Southeast", value: "australiasoutheast"},
          {name: "South India", value: "southindia"},
          {name: "Central India", value: "centralindia"},
          {name: "West India", value: "westindia"},
          {name: "Canada Central", value: "canadacentral"},
          {name: "Canada East", value: "canadaeast"},
          {name: "UK South", value: "uksouth"},
          {name: "UK West", value: "ukwest"},
          {name: "West Central US", value: "westcentralus"},
          {name: "West US 2", value: "westus2"},
          {name: "Korea Central", value: "koreacentral"},
          {name: "Korea South", value: "koreasouth"},
          {name: "France Central", value: "francecentral"},
          {name: "France South", value: "francesouth"},
          {name: "Australia Central", value: "australiacentral"},
          {name: "Australia Central 2", value: "australiacentral2"},
          {name: "South Africa North", value: "southafricanorth"},
          {name: "South Africa West", value: "southafricawest"}];
}