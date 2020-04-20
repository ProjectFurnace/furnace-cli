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
  util = require("util"),
  inquirer = require("inquirer"),
  chalk = require("chalk"),
  Table = require("cli-table3"),
  ora = require("ora");

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
    console.log("installing node modules...");
    await execInteractiveProcess(`npm install`);
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

  const preCommands = [];

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
      preCommands.push({
        command: `pulumi --non-interactive -s ${stackName} config set --plaintext aws:region ${context.location}`,
        errors: true,
        output: false
      });
      break;
    case "azure":
      preCommands.push({
        command: `pulumi --non-interactive -s ${stackName} config set --plaintext aws:region ${context.location}`,
        errors: true,
        output: false
      });
      //commands.push({ command: `pulumi -s ${stackName} config set --plaintext azure:location ${context.location}`, errors: true })
      break;
    case "gcp":
      preCommands.push({
        command: `pulumi --non-interactive -s ${stackName} config  set --plaintext gcp:project ${context.projectId}`,
        errors: true,
        output: false
      });
      preCommands.push({
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

  // preCommands.push({
  //   command: `pulumi -s ${stackName} up`,
  //   errors: false,
  //   output: true
  // });
  const spinner = ora("preparing environment").start();

  try {
    for (let command of preCommands) {
      await execInteractiveProcess(
        command.command,
        command.errors,
        command.output
      );
    }
  } catch (error) {
    spinner.fail("error initialising deploy operation");
    console.error(error);
    return 1;
  }
  try {
    spinner.text = "running preview";
    const previewResult = await execSilentProcess(
      `pulumi --non-interactive -s ${stackName} preview --json`
    );
    processDeployDefinition(JSON.parse(previewResult));
  } catch (error) {
    if (error.stdout) {
      const result = JSON.parse(error.stdout);

      if (result.diagnostics) {
        for (let diag of result.diagnostics) {
          if (diag.severity === "error") console.log(chalk.red(diag.message));
        }
      }
    }

    if (process.env.DEBUG) {
      console.log(error);
    }

    spinner.fail("unable to preview deployment");
    return 1;
  }

  try {
    spinner.stop();
    const { doDeploy } = await inquirer.prompt({
      type: "confirm",
      name: "doDeploy",
      message: "Continue",
      default: false
    });

    if (doDeploy) {
      spinner.text = "running deployment";
      spinner.start();

      const updateResult = await execSilentProcess(
        `pulumi --non-interactive up --skip-preview`
      );

      spinner.succeed("deployment successful");
    } else {
      spinner.stop();
    }
  } catch (error) {
    spinner.fail("unable to process deployment");
    console.log(error);
  }
};

function processDeployDefinition(output) {
  let results = [];

  if (!output.steps) return;

  const steps = output.steps.filter(step => {
    const state = step.newState || step.oldState;
    if (state.type !== "pulumi:pulumi:Stack") return step;
  });

  if (steps.length === 0) {
    console.log("\nno changes");
    return;
  }

  for (let step of steps) {
    const { op, urn } = step;

    let type;
    if (step.newState) {
      type = step.newState.type;
    } else if (step.oldState) {
      type = step.oldState.type;
    }

    const urnParts = urn.split("::");
    const name = urnParts[urnParts.length - 1];

    const typeParts = type.split(":");
    type = typeParts[typeParts.length - 1];

    if (type !== "pulumi:pulumi:Stack") {
      results.push({
        name,
        op,
        type
      });
    }
  }

  const table = new Table({
    head: ["operation", "name", "type"]
  });

  for (let result of results) {
    const { name, op, type } = result;
    table.push([getOperationColor(op), name, type]);
  }
  console.log();
  console.log(table.toString());
}

function getOperationColor(op) {
  switch (op) {
    case "create":
      return chalk.green(op);
    case "delete":
      return chalk.red(op);
    case "update":
      return chalk.rgb(255, 136, 0).bold(op);
    default:
      return op;
  }
}

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
        GOOGLE_APPLICATION_CREDENTIALS: "/tmp/furnace-scratch.json"
      };
  }
}
