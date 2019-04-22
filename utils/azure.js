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