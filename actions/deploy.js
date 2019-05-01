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

  if (!context.awsProfile) {
    console.error("context has no aws profile specified");
    return;
  }

  const credentials = awsUtil.getCredentials(context.awsProfile);
  if (!credentials || !(credentials.aws_access_key_id && credentials.aws_secret_access_key)) {
    console.error(`unable to get credentials for aws profile ${context.awsProfile}`);
    return;
  }

  

  const stackName = `${stackDef.name}-sandbox`;

  await execProcess(`pulumi stack init ${stackName}`, false);
  await execProcess(`pulumi config set --plaintext aws:region ${context.region}`);
  await execProcess(`pulumi stack select ${stackName}`);
  await execProcess(`pulumi up`, false);
}

function execProcess(cmd, throwError = true) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, {
      stdio: 'inherit',
      shell: true,
      cwd: deployDir,
      env: {
        FURNACE_LOCAL: "true",
        REPO_DIR: stackPath,
        TEMPLATE_REPO_DIR: functionTemplatesDir,
        PLATFORM: "aws",
        PATH: process.env.PATH,
        AWS_ACCESS_KEY_ID: credentials.aws_access_key_id,
        AWS_SECRET_ACCESS_KEY: credentials.aws_secret_access_key,
        BUILD_BUCKET: context.artifactBucket
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