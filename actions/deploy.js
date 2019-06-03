const which = require("which")
  , gitUtils = require("@project-furnace/gitutils")
  , fsUtils = require("@project-furnace/fsutils")
  , workspace = require("../utils/workspace")
  , awsUtil = require("../utils/aws")
  , path = require("path")
  , yaml = require('yamljs')
  , { spawn } = require('child_process')
  ;

module.exports = async (argv) => {
  const workspaceDir = workspace.getWorkspaceDir()
      , context = workspace.getCurrentContext()
      , deployDir = path.join(workspaceDir, "deploy")
      , functionTemplatesDir = path.join(workspaceDir, "function-templates")
      , deployUrl = "https://github.com/ProjectFurnace/deploy.git"
      , functionTemplatesUrl = "https://github.com/ProjectFurnace/function-templates.git"
      , stackPath = argv._.length > 1 ? argv._[1] : process.cwd()
      , stackFilePath = path.join(stackPath, "stack.yaml")
      ;

  const platformEnv = getPlatformVariables(context);

  const execProcess = (cmd, throwError = true) => {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, {
        stdio: 'inherit',
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
          FURNACE_INSTANCE: context.name
        },
      });

      child.on('close', (code) => {
        if (code !== 0 && throwError) {
          reject();
        } else {
          resolve();
        }
      });
    });
  }

  if (!context) {
    console.error("unable to load current furnace context, ignite a furnace instance or import a context from file.");
    return;
  }

  const hasPulumi = which.sync('pulumi', { nothrow: true });
  if (!hasPulumi) {
    console.error("pulumi is missing, to install visit https://pulumi.io/quickstart/install.html");
    return;
  }

  if (!fsUtils.exists(deployDir)) {
    console.log("cloning deploy source...");
    fsUtils.mkdir(deployDir);
    await gitUtils.clone(deployDir, deployUrl, "", "");
  }

  if (!fsUtils.exists(path.join(deployDir, "node_modules"))) {
    await execProcess(`npm install`);
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

  const commands = [
    { command: `pulumi stack init ${stackName}`, errors: false }
  ]

  switch (context.platform) {
    case "aws":
      commands.push({ command: `pulumi config set --plaintext aws:region ${context.region}`, errors: true });
      break;
    case "azure":
      commands.push({ command: `pulumi config set --plaintext aws:region ${context.location}`, errors: true });
      //commands.push({ command: `pulumi config set --plaintext azure:location ${context.location}`, errors: true })
      break;
    case "gcp":
      commands.push({ command: `pulumi config set --plaintext gcp:project ${context.projectId}`, errors: true });
      commands.push({ command: `pulumi config set --plaintext gcp:region ${context.location}`, errors: true });
      break;
  }

  commands.push({ command: `pulumi stack select ${stackName}`, errors: true });
  commands.push({ command: `pulumi up`, errors: false });

  for (let command of commands) {
    await execProcess(command.command, command.errors);
  }
}

function getPlatformVariables(context) {

  switch (context.platform) {
    case "aws":
      if (!context.awsProfile) throw new Error("context has no aws profile specified");

      let awsProfile = context && context.awsProfile ? context.awsProfile : "default";
      const credentials = awsUtil.getCredentials(awsProfile);
      if (!credentials || !(credentials.aws_access_key_id && credentials.aws_secret_access_key)) {
        throw new Error(`unable to get credentials for aws profile ${context.awsProfile}`);
      }

      return {
        AWS_ACCESS_KEY_ID: credentials.aws_access_key_id,
        AWS_SECRET_ACCESS_KEY: credentials.aws_secret_access_key,
      };

    case "azure":
      return {
        STACK_REGION: context.location,
        STORAGE_CONNECTION_STRING: context.artifactBucketConnectionString
      };

    case "gcp":
      return {
        GCP_PROJECT: context.projectId,
        GOOGLE_APPLICATION_CREDENTIALS: "/Users/danny/Downloads/furnace-scratch-4d7da774a0e8.json"
      };
  }
}