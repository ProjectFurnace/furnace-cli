const gitutils = require("@project-furnace/gitutils"),
  fsutils = require("@project-furnace/fsutils"),
  workspace = require("../utils/workspace"),
  path = require("path"),
  inquirer = require("inquirer"),
  chalk = require("chalk"),
  github = require("../utils/github"),
  randomstring = require("randomstring"),
  commandLineArgs = require("command-line-args"),
  awsBootstrap = require("../bootstrap/aws"),
  azureBootstrap = require("../bootstrap/azure"),
  gcpBootstrap = require("../bootstrap/gcp"),
  awsUtil = require("../utils/aws"),
  azureUtil = require("../utils/azure"),
  gcpUtil = require("../utils/gcp"),
  igniteUtil = require("../utils/ignite"),
  which = require("which");
module.exports = async argv => {
  const doBootstrap = argv.bootstrap === undefined ? true : argv.bootstrap;
  let resume = false;

  if (doBootstrap) {
    let status = igniteUtil.getIgniteStatus(),
      resume = false,
      initialisedConfig = {};
    if (status && status.state !== "complete") {
      const resultQuestions = [
        {
          type: "confirm",
          name: "resume",
          message: "a previous ignite did not complete, resume?"
        },
        {
          type: "confirm",
          name: "clear",
          message: "clear previous attempt?",
          when: current => !current.resume
        }
      ];

      const resumeAnswers = await inquirer.prompt(resultQuestions);
      resume = resumeAnswers.resume;

      if (!resume) igniteUtil.deleteIgniteStatus();
      else initialisedConfig = status.answers;
    }
  }

  if (!resume) {
    const mainDefinitions = [
      { name: "command", defaultOption: true },
      { name: "platform", alias: "p", type: String },
      { name: "name", alias: "i", type: String },
      { name: "gitProvider", alias: "g", type: String },
      { name: "gitToken", alias: "t", type: String },
      { name: "storeGitHubToken", defaultValue: true, type: Boolean },
      { name: "location", alias: "l", type: String }
    ];
    const mainOptions = commandLineArgs(mainDefinitions, {
      stopAtFirstUnknown: true
    });

    let argv = mainOptions._unknown || [];
    argv = argv.filter(a => a !== "--no-bootstrap");

    let passedOptions = [];
    let platformDefinitions = [];

    switch (mainOptions.platform) {
      case "aws":
        platformDefinitions = [
          { name: "profile", alias: "x", type: String, defaultValue: null },
          { name: "accessKeyId", alias: "a", type: String, defaultValue: null },
          {
            name: "secretAccessKey",
            alias: "p",
            type: String,
            defaultValue: null
          }
        ];
        break;
      case "azure":
        platformDefinitions = [
          { name: "subscriptionId", alias: "s", type: String }
        ];
        break;
      case "gcp":
        platformDefinitions = [{ name: "projectId", alias: "j", type: String }];
        break;
    }

    const options = commandLineArgs(platformDefinitions, { argv });
    passedOptions = Object.assign({}, mainOptions, options);

    if (passedOptions._unknown) {
      delete passedOptions._unknown;
    }

    questions = [];

    if (passedOptions.name) config = passedOptions;
    else {
      questions = [
        {
          type: "input",
          name: "name",
          message: "Name this Furnace Instance:",
          default: "furnace",
          validate: validateInstanceName
        },
        {
          type: "list",
          name: "platform",
          message: "Platform:",
          choices: ["aws", "azure", "gcp"]
        },
        //{ type: 'input', name: 'bucket', message: "Artifact Bucket:", default: current => current.name + "-artifacts" },
        {
          type: "password",
          name: "gitToken",
          message: "GitHub Access Token:",
          default: "",
          mask: "*",
          validate: input => (!input ? "GitHub Access Token is Required" : true)
        },
        {
          type: "password",
          name: "npmToken",
          message: "NPM Access Token (enter to skip):",
          default: "",
          mask: "*"
        },
        //{ type: 'list', name: 'gitProvider', message: "Git Provider:", choices: ["github"] },
        {
          type: "confirm",
          name: "storeGitHubToken",
          message: "Store GitHub Token"
        } //, when: current => current.gitProvider === "github" }
      ];

      config = await inquirer.prompt(questions);
    }

    let platformQuestions = [];

    // get platform specific properties
    switch (config.platform) {
      case "aws":
        const profiles = awsUtil.getProfiles();
        const awsCli = which.sync("aws", { nothrow: true });
        const requireCredentials = !awsCli || profiles.length === 0;

        platformQuestions = [
          {
            type: "list",
            name: "profile",
            message: "AWS Profile:",
            choices: profiles,
            when: !requireCredentials
          },
          {
            type: "input",
            name: "accessKeyId",
            message: "AWS Access Key:",
            when: requireCredentials
          },
          {
            type: "password",
            name: "secretAccessKey",
            message: "AWS Secret Access Key:",
            mask: "*",
            when: requireCredentials
          },
          {
            type: "list",
            name: "location",
            message: "Region:",
            choices: awsUtil.getRegions(),
            default: current => awsUtil.getDefaultRegion(current.profile)
          }
        ];
        break;

      case "azure":
        platformQuestions = [
          {
            type: "input",
            name: "subscriptionId",
            message: "Azure Subscription Id:"
          },
          {
            type: "list",
            name: "location",
            message: "Location:",
            choices: azureUtil.getRegions()
          } //, default: current => getDefaultRegion(current.profile) }
        ];
        break;

      case "gcp":
        platformQuestions = [
          {
            type: "input",
            name: "projectId",
            message: "Google Cloud Project Id:"
          },
          {
            type: "list",
            name: "location",
            message: "Location:",
            choices: gcpUtil.getRegions()
          } //, default: current => getDefaultRegion(current.profile) }
        ];
        break;
    }

    config = await getMissingOptions(platformQuestions, config);

    // delete when we reenable git provider selection
    config.gitProvider = "github";
    config.doBootstrap = doBootstrap;

    delete config.command;

    initialisedConfig = Object.assign(
      {},
      config,
      await initialiseIgnite(config)
    );
  }

  let deployResult;

  if (doBootstrap) {
    switch (initialisedConfig.platform) {
      case "aws":
        // await igniteAws(config, resume, status ? status.awsAnswers : null);
        deployResult = await awsBootstrap.ignite(initialisedConfig, resume);
        break;
      case "azure":
        deployResult = await azureBootstrap.ignite(initialisedConfig);
        break;
      case "gcp":
        deployResult = await gcpBootstrap.ignite(initialisedConfig);
        break;
      default:
        throw new Error(
          `platform ${config.platform} is not currently supported`
        );
    }
  }

  completeIgnite(
    initialisedConfig.name,
    Object.assign({}, initialisedConfig, deployResult)
  );
};

async function initialiseIgnite(config) {
  const { name, location, platform, gitProvider, gitToken } = config;

  const bootstrapRemote = `https://github.com/ProjectFurnace/bootstrap`,
    workspaceDir = workspace.getWorkspaceDir(),
    bootstrapDir = path.join(workspaceDir, "bootstrap"),
    templateDir = path.join(bootstrapDir, platform, "template"),
    functionsDir = path.join(bootstrapDir, platform, "functions"),
    coreModulesRemote = "https://github.com/ProjectFurnace/modules-core",
    coreModulesRepoDir = path.join(workspaceDir, "repo", "module", "core"),
    gitHookSecret = randomstring.generate(16),
    apiKey = randomstring.generate(16),
    bootstrapBucket =
      name +
      "-" +
      location +
      "-furnace-bootstrap-" +
      randomstring.generate({ length: 6, capitalization: "lowercase" }),
    artifactBucket =
      name +
      "-" +
      location +
      "-furnace-artifacts-" +
      randomstring.generate({ length: 6, capitalization: "lowercase" });
  if (!fsutils.exists(path.join(bootstrapDir, ".git"))) {
    console.debug(`cloning ${bootstrapRemote} to ${bootstrapDir}...`);
    if (!fsutils.exists(bootstrapDir)) {
      fsutils.mkdir(bootstrapDir);
    }
    await gitutils.clone(bootstrapDir, bootstrapRemote, "", "");
  } else {
    console.debug(`pulling latest bootstrap templates...`);
    console.log(bootstrapDir);
    // await gitutils.pull(bootstrapDir);
  }

  if (!fsutils.exists(templateDir))
    throw new Error(`unable to find bootstrap template at ${templateDir}`);

  if (!fsutils.exists(path.join(coreModulesRepoDir, ".git"))) {
    console.debug(`cloning ${coreModulesRemote} to ${coreModulesRepoDir}...`);
    if (!fsutils.exists(coreModulesRepoDir)) {
      fsutils.mkdir(coreModulesRepoDir);
    }
    await gitutils.clone(coreModulesRepoDir, coreModulesRemote, "", "");
  } else {
    console.debug(`pulling latest modules...`);
    await gitutils.pull(coreModulesRepoDir);
  }

  if (gitProvider === "github") {
    try {
      github.authenticateWithToken(gitToken);
    } catch (err) {
      console.log(err);
      throw new Error(
        `unable to authenticate with GitHub with the provider token`
      );
    }
  }

  return {
    bootstrapRemote,
    workspaceDir,
    bootstrapDir,
    templateDir,
    coreModulesRemote,
    coreModulesRepoDir,
    gitProvider,
    gitHookSecret,
    apiKey,
    bootstrapBucket,
    artifactBucket,
    functionsDir
  };
}

function completeIgnite(name, generatedConfig) {
  //remove non-required fields in the config
  delete generatedConfig.bootstrapRemote;
  delete generatedConfig.workspaceDir;
  delete generatedConfig.bootstrapDir;
  delete generatedConfig.templateDir;
  delete generatedConfig.coreModulesRemote;
  delete generatedConfig.coreModulesRepoDir;
  delete generatedConfig.functionsDir;
  delete generatedConfig.name;
  delete generatedConfig.storeGitHubToken;
  delete generatedConfig.bootstrapBucket;
  if (generatedConfig.npmToken == "") delete generatedConfig.npmToken;

  const config = workspace.getConfig();
  config[name] = generatedConfig;

  config.current = name;

  workspace.saveConfig(config);

  igniteUtil.saveIgniteStatus({
    state: "complete",
    generatedConfig
  });

  console.log(
    `furnace instance now complete.\nto create a new stack, please run:`
  );
  console.log(chalk.green(`\nfurnace new [stack_name]`));
}

async function getMissingOptions(questions, answers) {
  const missing = [];

  for (let q of questions) {
    if (!answers[q.name]) {
      missing.push(q);
    }
  }
  const missingAnswers = await inquirer.prompt(missing);
  return Object.assign({}, answers, missingAnswers);
}

function validateInstanceName(value) {
  if (value.match(/^([A-Za-z][A-Za-z0-9-_]{1,6}[A-Za-z0-9])$/i)) {
    return true;
  }
  return "Please enter a valid instance name. Maximum 8 chars [A-Za-z0-9-_] starting with a letter and ending with a letter or number";
}
