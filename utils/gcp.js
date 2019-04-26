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