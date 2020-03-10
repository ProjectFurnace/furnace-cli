const which = require("which"),
  gitUtils = require("@project-furnace/gitutils"),
  fsUtils = require("@project-furnace/fsutils"),
  workspace = require("../utils/workspace"),
  awsUtil = require("../utils/aws"),
  path = require("path"),
  yaml = require("yamljs"),
  execute = require("../utils/execute"),
  { spawn } = require("child_process"),
  { Processor } = require("@project-furnace/stack-processor"),
  util = require("util");

module.exports = async argv => {
  const workspaceDir = workspace.getWorkspaceDir(),
    context = workspace.getCurrentContext(),
    deployDir = path.join(workspaceDir, "deploy"),
    functionTemplatesDir = path.join(workspaceDir, "function-templates"),
    deployUrl = "https://github.com/ProjectFurnace/deploy.git",
    functionTemplatesUrl =
      "https://github.com/ProjectFurnace/function-templates.git",
    stackPath = argv._.length > 1 ? argv._[1] : process.cwd(),
    stackFilePath = path.join(stackPath, "stack.yaml"),
    homedir = require("os").homedir();

  const platformEnv = getPlatformVariables(context);

  // attempt to parse config before sending to deploy
  const processor = new Processor(stackPath, functionTemplatesDir);
  try {
    const flows = processor.getFlows();
  } catch (error) {
    console.error(`unable to process stack`);
    console.error(error);
    process.exit(1);
  }

  const execInteractiveProcess = (cmd, throwError = true, output = true) => {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, {
        stdio: output
          ? ["inherit", "inherit", "ignore"]
          : ["pipe", "pipe", "ignore"],
        shell: true,
        cwd: deployDir,
        env: {
          ...platformEnv,
          PLATFORM: context.platform,
          FURNACE_LOCAL: "true",
          REPO_DIR: stackPath,
          TEMPLATE_REPO_DIR: functionTemplatesDir,
          PATH: process.env.PATH,
          BUILD_BUCKET: context.artifactBucket,
          FURNACE_INSTANCE: context.name,
          PULUMI_CONFIG_PASSPHRASE: "abc"
        }
      });

      child.on("close", code => {
        if (code !== 0 && throwError) {
          reject(`error code ${code} running '${cmd}' in ${deployDir}`);
        } else {
          resolve();
        }
      });
    });
  };

  const execSilentProcess = cmd => {
    return execute.execPromise(cmd, {
      cwd: deployDir,
      env: { PULUMI_CONFIG_PASSPHRASE: "abc" }
    });
  };

  if (!context) {
    console.error(
      "unable to load current furnace context, ignite a furnace instance or import a context from file."
    );
    return;
  }

  const hasPulumi = which.sync("pulumi", { nothrow: true });
  if (!hasPulumi) {
    console.error(
      "pulumi is missing, to install visit https://pulumi.io/quickstart/install.html"
    );
    return;
  }

  if (!fsUtils.exists(deployDir)) {
    console.log("cloning deploy source...");
    fsUtils.mkdir(deployDir);
    await gitUtils.clone(deployDir, deployUrl, "", "");
  }

  if (!fsUtils.exists(path.join(deployDir, "node_modules"))) {
    await execSilentProcess(`npm install`);
  }

  if (!fsUtils.exists(functionTemplatesDir)) {
    fsUtils.mkdir(functionTemplatesDir);
    await gitUtils.clone(functionTemplatesDir, functionTemplatesUrl, "", "");
    return;
  }

  if (!fsUtils.exists(stackFilePath)) {
    console.error("unable to find stack.yaml in current directory");
    return;
  }

  const stackDef = yaml.load(stackFilePath);
  if (!stackDef.name) {
    console.error("no stack name defined in stack.yaml");
    return;
  }

  if (!context.artifactBucket) {
    console.error("context has no artifact bucket specified");
    return;
  }

  const stackName = `${stackDef.name}-sandbox`;

  const commands = [];

  let stackExists = false;

  try {
    let localLogin = true;
    const pulumiConfigLocation = homedir + "/.pulumi/credentials.json";

    if (fsUtils.exists(pulumiConfigLocation)) {
      const pulumiConfig = require(pulumiConfigLocation);

      localLogin = pulumiConfig.current && pulumiConfig.current === "file://~";
    }

    if (localLogin) {
      await execSilentProcess("pulumi login --local");
      console.log("logged in locally");
    }
  } catch (error) {
    throw new Error("unable to login");
  }

  try {
    const stackList = JSON.parse(
      await execSilentProcess("pulumi --non-interactive stack ls --json")
    );
    stackExists = stackList.find(s => s.name === stackName) !== undefined;
  } catch (error) {
    throw new Error("unable to get stack list");
  }

  if (!stackExists) {
    // commands.push({
    //   command: `pulumi stack init ${stackName}`,
    //   errors: false,
    //   output: false
    // });
    await execSilentProcess(`pulumi --non-interactive stack init ${stackName}`);
  }

  switch (context.platform) {
    case "aws":
      commands.push({
        command: `pulumi --non-interactive -s ${stackName} config set --plaintext aws:region ${context.location}`,
        errors: true,
        output: false
      });
      break;
    case "azure":
      commands.push({
        command: `pulumi --non-interactive -s ${stackName} config set --plaintext aws:region ${context.location}`,
        errors: true,
        output: false
      });
      //commands.push({ command: `pulumi -s ${stackName} config set --plaintext azure:location ${context.location}`, errors: true })
      break;
    case "gcp":
      commands.push({
        command: `pulumi --non-interactive -s ${stackName} config  set --plaintext gcp:project ${context.projectId}`,
        errors: true,
        output: false
      });
      commands.push({
        command: `pulumi --non-interactive -s ${stackName} config set --plaintext gcp:region ${context.location}`,
        errors: true,
        output: false
      });
      break;
  }

  // commands.push({
  //   command: `pulumi stack select ${stackName}`,
  //   errors: true,
  //   output: false
  // });

  commands.push({
    command: `pulumi -s ${stackName} up`,
    errors: false,
    output: true
  });

  try {
    for (let command of commands) {
      await execInteractiveProcess(
        command.command,
        command.errors,
        command.output
      );
    }
  } catch (error) {
    console.error("error running deploy");
    console.error(error);
  }
};

function getPlatformVariables(context) {
  switch (context.platform) {
    case "aws":
      if (!context.profile)
        throw new Error("context has no aws profile specified");

      let awsProfile = context && context.profile ? context.profile : "default";
      const credentials = awsUtil.getCredentials(awsProfile);
      if (
        !credentials ||
        !(credentials.aws_access_key_id && credentials.aws_secret_access_key)
      ) {
        throw new Error(
          `unable to get credentials for aws profile ${context.awsProfile}`
        );
      }

      return {
        AWS_ACCESS_KEY_ID: credentials.aws_access_key_id,
        AWS_SECRET_ACCESS_KEY: credentials.aws_secret_access_key
      };

    case "azure":
      return {
        STACK_REGION: context.location,
        STORAGE_CONNECTION_STRING: context.artifactBucketConnectionString
      };

    case "gcp":
      return {
        GCP_PROJECT: context.projectId,
        GOOGLE_APPLICATION_CREDENTIALS:
          "/Users/danny/Downloads/furnace-scratch-4d7da774a0e8.json"
      };
  }
}
