const workspace = require("../utils/workspace"),
  github = require("../utils/github"),
  stack = require("../utils/stack"),
  chalk = require("chalk"),
  stackUtil = require("../utils/stack"),
  Table = require("cli-table3"),
  path = require("path"),
  util = require("util"),
  { Processor } = require("@project-furnace/stack-processor");

module.exports.status = async () => {
  const remoteUrl = await workspace.getRemoteUrl(),
    context = workspace.getCurrentContext(),
    stackConfig = stack.getConfig("stack"),
    environments = stackConfig.environments;
  if (!environments) throw new Error(`unable to load environments from stack.`);

  console.log(chalk.green.bold("deployments:"));
  for (let environment of environments) {
    console.log(`environment ${chalk.blue(environment)}`);
    const deployments = await github.listDeployments(
      context.gitToken,
      remoteUrl,
      environment
    );

    for (let deployment of deployments) {
      console.log(
        `  timestamp ${chalk.green(deployment.created_at)} ref ${chalk.green(
          deployment.ref
        )} sha ${chalk.green(deployment.sha.substring(0, 8))}`
      );

      const statuses = await github.listDeploymentStatuses(
        context.gitToken,
        remoteUrl,
        deployment.id
      );
      for (let status of statuses) {
        console.log(`    ${stateToColour(status.state)}`);
      }
      break;
    }
  }
};

function stateToColour(state) {
  switch (state) {
    case "success":
      return chalk.green(state);
    case "in_progress":
      return chalk.yellow(state);
    case "failed":
      return chalk.red(state);
    default:
      return chalk.red(state);
  }
}

module.exports.updateWebhook = async () => {
  await github.updateHook();
};

module.exports.describe = async argv => {
  const aws = require("../utils/aws").getInstance();

  const components = [];
  let { env } = argv;
  if (!env) env = "sandbox";

  const stack = stackUtil.getConfig("stack"),
    sources = stackUtil.getConfig("sources"),
    taps = stackUtil.getConfig("taps"),
    pipelines = stackUtil.getConfig("pipelines"),
    sinks = stackUtil.getConfig("sinks"),
    pipes = stackUtil.getConfig("pipes");

  processElements(sources, "Source", components, null, stack.name, env);
  processElements(taps, "Tap", components, null, stack.name, env);
  processElements(
    pipelines,
    "Pipeline",
    components,
    null,
    stack.name,
    env,
    pipes
  );

  for (let pipeline of pipelines || []) {
    processElements(
      pipeline.functions,
      "Pipeline/Function",
      components,
      pipeline.name,
      stack.name,
      env
    );
  }

  processElements(sinks, "Sink", components, null, stack.name, env, pipes);

  const lambda = new aws.Lambda(),
    kinesis = new aws.Kinesis();
  for (let component of components) {
    switch (component.type) {
      case "Function":
        try {
          const lambdaResource = await lambda
            .getFunction({ FunctionName: component.resource })
            .promise();
          component.status = "Created";
        } catch (err) {
          component.status = "Not Found";
        }
        break;

      case "Pipeline":
        component.status = "N/A";
        break;

      case "KinesisStream":
        try {
          const kinesisResource = await kinesis
            .describeStream({ StreamName: component.resource })
            .promise();
          component.status = "Created";
        } catch (err) {
          component.status = "Not Found";
        }
        break;

      default:
        component.status = "Unknown";
        break;
    }
  }

  const table = new Table({
    head: ["Element", "Type", "Name", "Parent", "Resource", "Status"]
  });

  for (let component of components) {
    const { element, type, name, parent, resource, status } = component;
    table.push([element, type, name, parent, resource, status]);
  }

  console.log(table.toString());
};

function processElements(
  list,
  element,
  components,
  parent,
  stackName,
  env,
  pipes
) {
  for (let obj of list || []) {
    const name = obj.name;

    if (!parent) {
      switch (element) {
        case "Tap":
          parent = obj.source;
          break;
        case "Pipeline":
          const pp = pipes.filter(p => p.pipeline === obj.name && p.tap);
          if (pp.length === 1) parent = pp[0].tap;
          break;
        case "Sink":
          const ps = pipes.filter(p => p.sink === obj.name && p.pipeline);
          if (ps.length === 1) parent = ps[0].pipeline;
          break;
      }
    }

    let type;
    if (obj.type) type = obj.type;
    else if (element == "Pipeline") type = "Pipeline";
    else type = "Function";

    const resource = `${stackName}-${obj.name}-${env}`;
    components.push({ element, type, name, parent, resource });
  }
}

module.exports.dump = argv => {
  const stackProcessor = require("@project-furnace/stack-processor");

  const workspaceDir = workspace.getWorkspaceDir(),
    templatesDir = path.join(workspaceDir, "function-templates");
  const processor = new stackProcessor.Processor(process.cwd(), templatesDir);
  const flows = processor.getFlows("sandbox");

  if (argv._.length === 3) {
    // find specific flow
    const flow = flows.find(r => r.name === argv._[2]);
    if (!flow) console.log("not found");
    else {
      console.log(util.inspect(flow, { depth: null, colors: true }));
    }
  } else {
    console.log(util.inspect(flows, { depth: null, colors: true }));
  }
};

module.exports.destroy = argv => {
  const execProcess = (cmd, throwError = true) => {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, {
        stdio: "inherit",
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
          BUILD_BUCKET: context.artifactBucket,
          FURNACE_INSTANCE: context.name
        }
      });
    });
  };
};
