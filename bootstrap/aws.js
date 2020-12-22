const AWS = require("aws-sdk"),
  which = require("which"),
  ziputils = require("@project-furnace/ziputils"),
  s3utils = require("@project-furnace/s3utils"),
  fsutils = require("@project-furnace/fsutils"),
  awsUtil = require("../utils/aws"),
  igniteUtil = require("../utils/ignite"),
  path = require("path");
module.exports.ignite = async (config, resume, doBootstrap) => {
  const profiles = awsUtil.getProfiles(),
    awsCli = which.sync("aws", { nothrow: true }),
    requireCredentials = !awsCli || profiles.length === 0;
  if (!awsCli) console.log(chalk.red("warning: no AWS CLI installed"));

  if (!doBootstrap) {
    const { artifactBucket } = config;

    const artifactBucketExists = await s3utils.bucketExists(artifactBucket);
    if (!artifactBucketExists) {
      console.log(`creating artifact bucket ${artifactBucket}...`);
      await s3utils.createBucket(artifactBucket, config.location);
    }

    return;
  }

  //const { profile, region, accessKeyId, secretAccessKey } = awsAnswers;

  if (requireCredentials && (!config.accessKeyId || !config.secretAccessKey))
    throw new Error(`AWS Access Key and Secret Access Key must be defined`);
  if (!config.location) throw new Error(`aws region must be defined`);

  const templateFile = path.join(config.templateDir, "furnaceIgnite.template");

  AWS.config.region = config.location;

  if (requireCredentials) {
    if (!AWS.config.credentials) AWS.config.credentials = {};

    AWS.config.credentials.accessKeyId = config.accessKeyId;
    AWS.config.credentials.secretAccessKey = config.secretAccessKey;
    // process.env.AWS_ACCESS_KEY_ID = accessKeyId;
    // process.env.AWS_SECRET_ACCESS_KEY = secretAccessKey;
    s3utils.setCredentials(AWS.config.credentials);
  } else if (config.profile !== "default") {
    AWS.config.credentials = new AWS.SharedIniFileCredentials({
      profile: config.profile,
    });
    s3utils.setCredentials(AWS.config.credentials);
  }

  const bucketExists = await s3utils.bucketExists(config.bootstrapBucket);
  if (!bucketExists) {
    console.log("creating bootstrap bucket...");
    await s3utils.createBucket(config.bootstrapBucket, config.location);
  }

  // build bootstrap functions
  try {
    await buildAndUploadFunctions(config.functionsDir, config.bootstrapBucket);
  } catch (err) {
    throw new Error(`unable to build bootstrap functions: ${err}`);
  }

  const cloudformation = new AWS.CloudFormation({ apiVersion: "2010-05-15" });

  const stackParams = {
    StackName: config.name,
    //OnFailure: 'DELETE',
    Capabilities: ["CAPABILITY_NAMED_IAM"],
    TemplateBody: fsutils.readFile(templateFile),
    Parameters: [
      {
        ParameterKey: "ArtifactBucketName",
        ParameterValue: config.artifactBucket,
      },
      {
        ParameterKey: "BootstrapCodeBucketName",
        ParameterValue: config.bootstrapBucket,
      },
      {
        ParameterKey: "GitUsername",
        ParameterValue: "unknown",
      },
      {
        ParameterKey: "GitToken",
        ParameterValue: config.gitToken,
      },
      {
        ParameterKey: "NpmToken",
        ParameterValue: config.npmToken,
      },
      {
        ParameterKey: "GitHookSecret",
        ParameterValue: config.gitHookSecret,
      },
      {
        ParameterKey: "ApiKey",
        ParameterValue: config.apiKey,
      },
    ],
  };

  try {
    let stackExists = false,
      apiUrl;

    const stackList = await cloudformation.listStacks().promise();

    for (let stack of stackList.StackSummaries) {
      // we need to check both the name and the status
      if (
        stack.StackName === config.name &&
        stack.StackStatus !== "DELETE_COMPLETE"
      ) {
        stackExists = true;
        break;
      }
    }

    if (stackExists && !resume) {
      console.log("stack already exists, refreshing config...");
    } else {
      igniteUtil.saveIgniteStatus({
        state: "creating",
        answers: Object.assign({}, config),
      });

      const createStackResponse = await cloudformation
        .createStack(stackParams)
        .promise();
    }

    console.log(
      "waiting for bootstrap template to finish. this may take a few minutes, so feel free to grab a cup of tea..."
    );

    // TODO: allow waiting for stackUpdateComplete
    const result = await cloudformation
      .waitFor("stackCreateComplete", { StackName: config.name })
      .promise();
    // const result = await cloudformation.waitFor('stackUpdateComplete', { StackName: name }).promise();

    for (let stack of result.Stacks) {
      for (let output of stack.Outputs) {
        if (output.OutputKey === "apiURL") apiUrl = output.OutputValue;
      }
    }

    if (!apiUrl) throw new Error(`unable to retrieve url from aws stack`);

    const outputConfig = {
      apiUrl,
    };

    return outputConfig;
  } catch (err) {
    // the stack creation timed out
    if (err.code && err.code === "ResourceNotReady") {
      const stackEventsPromise = await cloudformation
        .describeStackEvents({ StackName: config.name })
        .promise();

      //loop through the events of stack creation to find the first one that failed
      const errorEvent = stackEventsPromise.StackEvents.reverse().find(
        (elem) => {
          if (elem.ResourceStatus === "CREATE_FAILED") return elem;
        }
      );

      throw errorEvent.ResourceStatusReason;
    }
    throw err;
  }
};

async function buildAndUploadFunctions(functionsDir, bucket) {
  const functionsList = fsutils.listDirectory(functionsDir);

  for (let fn of functionsList) {
    console.log(`building function ${fn}...`);
    const functionDir = path.join(functionsDir, fn),
      functionBuildDir = fsutils.createTempDirectory(),
      zipPath = path.join(functionBuildDir, `${fn}.zip`);
    fsutils.cp(functionDir, functionBuildDir);
    const execResult = await igniteUtil.execPromise(
      "npm install --production",
      { cwd: functionBuildDir, env: process.env }
    );

    if (execResult.stderr) {
      throw new Error(
        `npm install returned an error:\n${execResult.stdout}\n${execResult.stderr}`
      );
    }

    await ziputils.compress(functionBuildDir, zipPath);
    await s3utils.upload(bucket, fn, zipPath);
  }
}
