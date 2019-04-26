const AWS = require("aws-sdk")
    , which = require("which")
    , ziputils = require("@project-furnace/ziputils")
    , s3utils = require("@project-furnace/s3utils")
    , awsUtil = require("../utils/aws")
    ;

module.exports.ignite = async config => {

  const { name, platform, gitToken, npmToken, gitProvider, storeGitHubToken } = config;

  const profiles = awsUtil.getProfiles()
    , awsCli = which.sync("aws", { nothrow: true })
    , requireCredentials = !awsCli || profiles.length === 0
    ;

  if (!awsCli) console.log(chalk.red("warning: no AWS CLI installed"))

  const { profile, region, accessKeyId, secretAccessKey } = awsAnswers;

  if (requireCredentials && (!accessKeyId || !secretAccessKey)) throw new Error(`AWS Access Key and Secret Access Key must be defined`);
  if (!region) throw new Error(`aws region must be defined`);

  const templateFile = path.join(templateDir, "template", "furnaceIgnite.template");

  AWS.config.region = region;

  if (requireCredentials) {
    if (!AWS.config.credentials) AWS.config.credentials = {};

    AWS.config.credentials.accessKeyId = accessKeyId;
    AWS.config.credentials.secretAccessKey = secretAccessKey;
    // process.env.AWS_ACCESS_KEY_ID = accessKeyId;
    // process.env.AWS_SECRET_ACCESS_KEY = secretAccessKey;
    s3utils.setCredentials(AWS.config.credentials);
  } else if (profile !== "default") {
    AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
    s3utils.setCredentials(AWS.config.credentials);
  }

  const bucketExists = await s3utils.bucketExists(bootstrapBucket);
  if (!bucketExists) {
    console.log("creating bootstrap bucket...");
    await s3utils.createBucket(bootstrapBucket, region);
  }

  // build bootstrap functions
  try {
    await buildAndUploadFunctions(templateDir, bootstrapBucket)
  } catch (err) {
    throw new Error(`unable to build bootstrap functions: ${err}`)
  }

  const cloudformation = new AWS.CloudFormation({ apiVersion: '2010-05-15' });

  const stackParams = {
    StackName: name,
    //OnFailure: 'DELETE',
    Capabilities: ["CAPABILITY_NAMED_IAM"],
    TemplateBody: fsutils.readFile(templateFile),
    Parameters: [
      {
        ParameterKey: 'ArtifactBucketName',
        ParameterValue: artifactBucket,
      },
      {
        ParameterKey: 'BootstrapCodeBucketName',
        ParameterValue: bootstrapBucket,
      },
      {
        ParameterKey: 'GitUsername',
        ParameterValue: "unknown"
      },
      {
        ParameterKey: 'GitToken',
        ParameterValue: gitToken,
      },
      {
        ParameterKey: 'NpmToken',
        ParameterValue: npmToken,
      },
      {
        ParameterKey: 'GitHookSecret',
        ParameterValue: gitHookSecret,
      },
      {
        ParameterKey: 'ApiKey',
        ParameterValue: apiKey,
      },
    ]
  }

  try {
    let stackExists = false
      , apiUrl
      ;

    const stackList = await cloudformation.listStacks().promise();

    for (let stack of stackList.StackSummaries) {
      // we need to check both the name and the status
      if (stack.StackName === name && stack.StackStatus !== 'DELETE_COMPLETE') {
        stackExists = true;
        break;
      }
    }

    if (stackExists && !resume) {
      console.log("stack already exists, refreshing config...");
    } else {
      saveIgniteStatus({
        state: "creating",
        answers: Object.assign({}, answers, awsAnswers)
      });

      const createStackResponse = await cloudformation.createStack(stackParams).promise();
    }

    console.log("waiting for bootstrap template to finish. this may take a few minutes, so feel free to grab a cup of tea...")

    // TODO: allow waiting for stackUpdateComplete
    const result = await cloudformation.waitFor('stackCreateComplete', { StackName: name }).promise();
    // const result = await cloudformation.waitFor('stackUpdateComplete', { StackName: name }).promise();

    for (let stack of result.Stacks) {
      for (let output of stack.Outputs) {
        if (output.OutputKey === "apiURL") apiUrl = output.OutputValue;
      }
    }

    if (!apiUrl) throw new Error(`unable to retrieve url from aws stack`);

    const config = {
      platform,
      region,
      artifactBucket,
      codeBucket: bootstrapBucket,
      gitToken: storeGitHubToken ? gitToken : null,
      gitHookSecret: gitHookSecret,
      apiUrl,
      apiKey,
      gitProvider,
      awsProfile: profile ? profile : null,
    }

    completeIgnite(name, config, answers);

  } catch (err) {
    // the stack creation timed out
    if (err.code && err.code === 'ResourceNotReady') {
      const stackEventsPromise = await cloudformation.describeStackEvents({ StackName: name }).promise();

      //loop through the events of stack creation to find the first one that failed
      const errorEvent = stackEventsPromise.StackEvents.reverse().find(elem => {
        if (elem.ResourceStatus === 'CREATE_FAILED')
          return elem;
      });

      throw errorEvent.ResourceStatusReason;
    }
    throw err
  }
}

async function buildAndUploadFunctions(templateDir, bucket) {
  const functionsDir = path.join(templateDir, "functions")
    , functionsList = fsutils.listDirectory(functionsDir)
    ;

  for (let fn of functionsList) {
    console.log(`building function ${fn}`);
    const functionDir = path.join(functionsDir, fn)
      , functionBuildDir = fsutils.createTempDirectory()
      , zipPath = path.join(functionBuildDir, `${fn}.zip`)
      ;

    fsutils.cp(functionDir, functionBuildDir);
    const execResult = await execPromise("npm install --production", { cwd: functionBuildDir, env: process.env });

    if (execResult.stderr) {
      throw new Error(`npm install returned an error:\n${execResult.stdout}\n${execResult.stderr}`);
    }

    await ziputils.compress(functionBuildDir, zipPath);
    await s3utils.upload(bucket, fn, zipPath);
  }
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