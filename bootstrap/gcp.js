const gcpUtils = require("../utils/gcp"),
  path = require("path"),
  zipUtils = require("@project-furnace/ziputils"),
  util = require("util"),
  {google} = require("googleapis"),
  fsutils = require("@project-furnace/fsutils"),
  {Storage} = require('@google-cloud/storage'),
  process = require('process'),
  yamljs = require('yamljs'),
  kms = require('@google-cloud/kms')


const SUCCESS_STATES = ["SUCCESS", "DONE"];
const FAILURE_STATES = ["FAILURE", "CANCELLED"];
const COMPLETE_STATES = SUCCESS_STATES.concat(FAILURE_STATES);

module.exports.ignite = config => {

  //const { name, templateDir, projectId, location, bootstrapBucket, artifactBucket } = config;

  let deploymentManager;

  return gcpUtils.login().then(async auth => {
      deploymentManager = google.deploymentmanager({
        version: "v2",
        auth
      });

      await buildAndUploadFunctions(config.functionsDir, config.bootstrapBucket);
    
      config.secretsBucket = config.artifactBucket.replace("artifacts", "secrets");

      const artifactBits = config.artifactBucket.split("-");
      config.rand = artifactBits[artifactBits.length - 1];

      //return createDeployment(deploymentManager, name, templateDir, projectId, location);
      return createDeployment(deploymentManager, config);
    }).then(result => {
      process.stdout.write('waiting for bootstrap template to finish. this may take a few minutes, so feel free to grab a cup of tea..');

      startTimer(() => {
        const filter = {
          project: config.projectId,
          deployment: `${config.name}-initial`
        };

        return deploymentManager.deployments.get(filter).then(async response => {
          let op = response.data.operation;
          process.stdout.write('.');
          if (COMPLETE_STATES.includes(op.status)) {
            if (op.error) {
              console.log(op.error);
              throw new Error(`unable to bootstrap platform: ${op.error}`)
            } else {
              const manifestBits = response.data.manifest.split('/');
              filter.manifest = manifestBits[manifestBits.length - 1];

              return processOutputsAndSecrets(deploymentManager, config, filter);
            }
            return false; // stop
          }
          return true; // continue
        }).catch(err => {
          //TODO detect and ignore temporary failures
          throw new Error(`unable to bootstrap platform: ${err}`);
        })
      }, timer, 5000);
    }).catch(err => {
      console.log(`error igniting GCP`, util.inspect(err, {
        depth: null
      }));
    });
}

function processOutputsAndSecrets(deploymentManager, config, filter) {
  return deploymentManager.manifests.get(filter).then(response => {
    if( response.data && response.data.layout ) {
      const layout = yamljs.parse(response.data.layout);

      console.log('');
      //console.log("Deployment completed with status", op.status);
      return layout.outputs;
    } else {
      throw new Error('deployment failed');
    }
  }).then(async outputs => {
    const secrets = ['GitToken', 'ApiKey', 'GitHookSecret'];

    // create a KMS client
    const client = new kms.KeyManagementServiceClient();

    const name = client.cryptoKeyPath(
      config.projectId,
      config.location,
      `${config.projectId}-${config.name}-initial-secrets-key-ring-${config.rand}`,
      `${config.projectId}-${config.name}-initial-secrets-key-${config.rand}`
    );

    for( const secret of secrets ){
      const configSecretVar = secret.charAt(0).toLowerCase() + secret.slice(1);
      if( config[configSecretVar] ) { 
        const b64secret = Buffer.from(config[configSecretVar]).toString('base64');
        // Encrypts the file using the specified crypto key
        const [result] = await client.encrypt({name, plaintext: b64secret});

        if (result.ciphertext) {
          const storage = new Storage();
          var bucket = storage.bucket(config.secretsBucket);

          await bucket.file(secret).save(result.ciphertext);
        } else {
          throw new Error(result);
        }
      }
    }

    let returnValues = {}
    for( const param of outputs ) {
      returnValues[param.name] = param.finalValue;
    }
    
    return returnValues;
  }).catch(err => {
    console.log(`error igniting GCP`, util.inspect(err, {
      depth: null
    }));
  });
}

const startTimer = (func, timer, period) => {
  let caller = () => {
    func().then(repeat => {
      if (repeat) {
        timer.handle = setTimeout(caller, period);
      }
    });
  };
  timer.handle = setTimeout(caller, period);
};

let timer = {
  handle: null
};

async function buildAndUploadFunctions(functionsDir, bucket) {
  //const functionsDir = path.join(templateDir, "functions")
  const functionsList = fsutils.listDirectory(functionsDir);

  const storage = new Storage();

  const [buckets] = await storage.getBuckets();
  if (!buckets || (buckets && !buckets.includes(bucket))) {
    console.log("creating bootstrap bucket...");
    await storage.createBucket(bucket, {});
  }

  for (let fn of functionsList) {
    console.log(`building function ${fn}`);
    let functionBuildDir = fsutils.createTempDirectory();
    const functionDir = path.join(functionsDir, fn),
              zipPath = path.join(functionBuildDir, `${fn}.zip`);

    // fsutils.cp does not copy the whole folder so to avoid issues with 
    // zip packaged inside zip we need to put contents in a subfolder
    functionBuildDir = path.join(functionBuildDir, '/', fn);
    fsutils.mkdir(functionBuildDir)
    fsutils.cp(functionDir, functionBuildDir);
    const execResult = await execPromise("npm install --production", {
      cwd: functionBuildDir,
      env: process.env
    });

    if (execResult.stderr) {
      throw new Error(`npm install returned an error:\n${execResult.stdout}\n${execResult.stderr}`);
    }

    await zipUtils.compress(functionBuildDir, zipPath);

    await upload(bucket, fn, zipPath, storage);
  }
}

function upload(bucket, fn, zipPath, storage) {
  return new Promise((resolve, reject) => {

    storage.bucket(bucket).upload(zipPath, {
      destination: fn
    }, (error, file, result) => {
      if (error) reject(error)
      else resolve(result);
    });
  });
}

//function createDeployment(deploymentManager, name, templateDir, projectId, location) {
function createDeployment(deploymentManager, config) {
  return new Promise((resolve, reject) => {

    const definitionFile = path.join(config.templateDir, "bootstrap.yaml"),
      templateFile = path.join(config.templateDir, "bootstrap.jinja"),
      definition = fsutils.readFile(definitionFile);

    let template = fsutils.readFile(templateFile);

    const replacements = {
      location: config.location,
      project_id: config.projectId,
      bootstrap_bucket: config.bootstrapBucket,
      artifact_bucket: config.artifactBucket,
      secrets_bucket: config.secretsBucket,
      rand: config.rand
    };

    for (const [key, value] of Object.entries(replacements)) {
      template = template.replace(`env["${key}"]`, `"${value}"`);
    };

    const request = {
      project: config.projectId,
      resource: {
        name: `${config.name}-initial`,
        target: {
          config: {
            content: definition
          },
          imports: [{
            name: "bootstrap.jinja",
            content: template
          }]
        }
      }
    };

    deploymentManager.deployments.insert(request, function (err, response) {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

function execPromise(command, options) {
  const exec = require("child_process").exec;

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