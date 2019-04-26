const gcpUtils = require("../utils/gcp")
  , fs = require("fs")
  , path = require("path")
  , fsUtils = require("@project-furnace/fsutils")
  , exec = require("child_process").exec
  , zipUtils = require("@project-furnace/ziputils")
  , util = require("util")
  , { google } = require("googleapis")
  ;

module.exports.ignite = config => {

  const { name, templateDir, projectId } = config;

  let deploymentManager;

  return gcpUtils.login()
    .then(auth => {
      deploymentManager = google.deploymentmanager({
        version: "v2",
        auth
      });

      return createDeployment(deploymentManager, name, templateDir, projectId);
    })
    .catch(err => {
      console.log(`error igniting GCP`, util.inspect(err, { depth: null }));
    })
    ;
}

function createDeployment(deploymentManager, name, templateDir, projectId) {
  return new Promise((resolve, reject) => {
    const definitionFile = path.join(templateDir, "bootstrap.yaml")
        , templateFile = path.join(templateDir, "bootstrap.jinja")
        , definition = fsUtils.readFile(definitionFile)
        , template = fsUtils.readFile(templateFile)
        , request = {
            project: projectId,
            resource: {
              name: `${name}-initial`,
              target: {
                config: {
                  content: definition
                },
                imports: [
                  { name: "bootstrap.jinja", content: template }
                ]
              }
            }
          }
        ;

    deploymentManager.deployments.insert(request, function (err, response) {
      if (err) reject(err);
      else resolve(response);
    });
  });
}