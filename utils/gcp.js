const { google } = require("googleapis");

module.exports.login = () => {
  return new Promise((resolve, reject) => {
    google.auth.getApplicationDefault((err, authClient) => {
      if (err) reject(err);
      else {
        if (authClient.createScopedRequired && authClient.createScopedRequired()) {
          const scopes = ['https://www.googleapis.com/auth/cloud-platform'];
          authClient = authClient.createScoped(scopes);
        }
        resolve(authClient);
      }
    });
  });
};

module.exports.getRegions = () => {
return [{name: "Americas (Iowa)", value: "us-central1"},
        {name: "Americas (S. Carolina)", value: "us-east1"},
        {name: "Europe (Belgium)", value: "europe-west1"},
        //{name: "Europe (London)", value: "europe-west2"},
        //{name: "Asia Pacific (Hong Kong)", value: "asia-east2"},
        {name: "Asia Pacific (Tokyo)", value: "asia-northeast1"}];
}