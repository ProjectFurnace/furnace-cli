const gitutils = require("@project-furnace/gitutils")
    , fsutils = require("@project-furnace/fsutils")
    , workspace = require("../utils/workspace")
    , path = require("path")
    , AWS = require("aws-sdk")
    , inquirer = require("inquirer")
    , awsUtil = require("../utils/aws")
    , which = require("which")
    , ziputils = require("@project-furnace/ziputils")
    , s3utils = require("@project-furnace/s3utils")
    , chalk = require("chalk")
    , github = require("../utils/github")
    , randomstring = require("randomstring")
    , azureBootstrap = require("../bootstrap/azure")
    , commandLineArgs = require("command-line-args")
    ;

module.exports = async () => {

    let status = getIgniteStatus()
        , resume = false
        , answers = {}
        ;

    if (status && status.state !== "complete") {

        const resultQuestions = [
            { type: 'confirm', name: 'resume', message: "a previous ignite did not complete, resume?" },
            { type: 'confirm', name: 'clear', message: "clear previous attempt?", when: current => !current.resume }
        ]

        const resumeAnswers = await inquirer.prompt(resultQuestions);
        resume = resumeAnswers.resume;

        if (!resume) deleteIgniteStatus();
        else answers = status.answers;
    }

    if (!resume) {

        let passedOptions;

        const mainDefinitions = [
            { name: 'command', defaultOption: true },
            { name: 'platform', alias: 'p', type: String },
            { name: 'name', alias: 'i', type: String },
            { name: 'gitProvider', alias: 'g', type: String },
            { name: 'gitToken', alias: 't', type: String }
        ]
        const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true })
        const argv = mainOptions._unknown || []
        
        switch (mainOptions.platform) {
            case "azure":
                const azureDefinitions = [
                    { name: "subscriptionId", alias: "s", type: String },
                    { name: 'location', alias: 'l', type: String }
                ]
                const options = commandLineArgs(azureDefinitions, {argv});
                passedOptions = Object.assign({}, mainOptions, options);
                break;
        }

        const questions = [
            { type: 'input', name: 'name', message: "Name this Furnace Instance:", default: "furnace", validate: validateInstanceName },
            { type: 'list', name: 'platform', message: "Platform:", choices: ["aws", "azure"] },
            //{ type: 'input', name: 'bucket', message: "Artifact Bucket:", default: current => current.name + "-artifacts" },
            { type: 'password', name: 'gitToken', message: "GitHub Access Token:", default: "", validate: input => !input ? "GitHub Access Token is Required" : true },
            { type: 'password', name: 'npmToken', message: "NPM Access Token (enter to skip):", default: "" },
            //{ type: 'list', name: 'gitProvider', message: "Git Provider:", choices: ["github"] },
            { type: 'confirm', name: 'storeGitHubToken', message: "Store GitHub Token" } //, when: current => current.gitProvider === "github" }
        ];

        if (passedOptions) answers = passedOptions;
        else answers = await inquirer.prompt(questions);
    }

    // delete when we reenable git provider selection
    answers.gitProvider = 'github';

    switch (answers.platform) {
        case "aws":
            await ingiteAws(answers, resume, status ? status.awsAnswers : null);
            break;
        case "azure":
            await ingiteAzure(answers, resume);
            break;
        default:
            throw new Error(`platform ${answers.platform} is not currently supported`);
    }
}

async function initialiseIgnite(name, region, platform, platformTemplate, gitProvider, gitToken) {
    const bootstrapRemote = `https://github.com/ProjectFurnace/bootstrap`
        , workspaceDir = workspace.getWorkspaceDir()
        , bootstrapDir = path.join(workspaceDir, "bootstrap")
        , templateDir = path.join(bootstrapDir, platform)
        , templateFile = path.join(templateDir, "template", platformTemplate)
        , coreModulesRemote = "https://github.com/ProjectFurnace/modules-core"
        , coreModulesRepoDir = path.join(workspaceDir, "repo", "module", "core")
        , gitHookSecret = randomstring.generate(16)
        , apiKey = randomstring.generate(16)
        , bootstrapBucket = name + '-' + region + '-furnace-bootstrap-' + randomstring.generate({ length: 6, capitalization: 'lowercase' })
        , artifactBucket = name + '-' + region + '-furnace-artifacts-' + randomstring.generate({ length: 6, capitalization: 'lowercase' })
        ;

    if (!fsutils.exists(path.join(bootstrapDir, '.git'))) {
        console.debug(`cloning ${bootstrapRemote} to ${bootstrapDir}...`);
        if (!fsutils.exists(bootstrapDir)) {
            fsutils.mkdir(bootstrapDir);
        }
        await gitutils.clone(bootstrapDir, bootstrapRemote, "", "");
    } else {
        console.debug(`pulling latest bootstrap templates...`);
        await gitutils.pull(bootstrapDir);
    }

    if (!fsutils.exists(templateDir)) throw new Error(`unable to find bootstrap template at ${templateDir}`);

    if (!fsutils.exists(path.join(coreModulesRepoDir, '.git'))) {
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
            throw new Error(`unable to authenticate with GitHub with the provider token`)
        }
    }

    return {
        bootstrapRemote,
        workspaceDir,
        bootstrapDir,
        templateFile,
        coreModulesRemote,
        coreModulesRepoDir,
        gitProvider,
        gitHookSecret,
        apiKey,
        bootstrapBucket,
        artifactBucket,
        platformTemplate
    };
}

async function ingiteAzure(answers, resume) {

    const { name, platform, gitToken, npmToken, gitProvider, storeGitHubToken } = answers;

    const questions = [
        { type: 'input', name: 'subscriptionId', message: "Azure Subscription Id:" },
        { type: 'input', name: 'location', message: "Location:" } //, default: current => getDefaultRegion(current.profile) }
    ];

    const azureAnswers = await getMissingOptions(questions, answers);
    const { location, subscriptionId } = azureAnswers;

    const {
        templateFile,
        gitHookSecret,
        apiKey,
        bootstrapBucket,
        artifactBucket
    } = await initialiseIgnite(name, location, platform, "template.json", gitProvider, gitToken);

    const deployResult = await azureBootstrap.ignite(name, location, subscriptionId, templateFile);

    if (deployResult && deployResult.properties && deployResult.properties.provisioningState) {
        console.log(`deployment result was ${deployResult.properties.provisioningState}`);
    } else {
        console.log(`unknown response from deployment: ${deployResult}`);
    }

    const config = {
        platform,
        location,
        artifactBucket,
        codeBucket: bootstrapBucket,
        gitToken: storeGitHubToken ? gitToken : null,
        gitHookSecret: gitHookSecret,
        // apiUrl,
        // apiKey,
        gitProvider,
        artifactBucketConnectionString: deployResult.properties.outputs.connectionString.value
    }

    completeIgnite(name, config);
}

async function ingiteAws(answers, resume, awsAnswers) {

    const { name, platform, gitToken, npmToken, gitProvider, storeGitHubToken } = answers;

    const profiles = awsUtil.getProfiles()
        , awsCli = which.sync("aws", { nothrow: true })
        , requireCredentials = !awsCli || profiles.length === 0
        ;

    if (!awsCli) console.log(chalk.red("warning: no AWS CLI installed"))

    if (!resume) {
        const awsQuestions = [
            { type: 'list', name: 'profile', message: "AWS Profile:", choices: profiles, when: !requireCredentials },
            { type: 'input', name: 'accessKeyId', message: "AWS Access Key:", when: requireCredentials },
            { type: 'password', name: 'secretAccessKey', message: "AWS Secret Access Key:", when: requireCredentials },
            { type: 'input', name: 'region', message: "Region:", default: current => getDefaultRegion(current.profile) }
        ]
        awsAnswers = await inquirer.prompt(awsQuestions);
    }

    const { profile, region, accessKeyId, secretAccessKey } = awsAnswers;

    if (requireCredentials && (!accessKeyId || !secretAccessKey)) throw new Error(`AWS Access Key and Secret Access Key must be defined`);
    if (!region) throw new Error(`aws region must be defined`);

    const {
        templateFile,
        gitHookSecret,
        apiKey,
        bootstrapBucket,
        artifactBucket
    } = await initialiseIgnite(name, region, platform, "furnaceIgnite.template", gitProvider, gitToken);

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

function completeIgnite(name, generatedConfig, answers) {
    const config = workspace.getConfig();
    config[name] = generatedConfig;

    config.current = name;

    workspace.saveConfig(config);

    saveIgniteStatus({
        state: "complete",
        answers
    })

    console.log(`furnace instance now complete.\nto create a new stack, please run:`);
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
    return 'Please enter a valid instance name. Maximum 8 chars [A-Za-z0-9-_] starting with a letter and ending with a letter or number';
}

function getDefaultRegion(profile) {
    let region = "";
    if (profile) {
        const p = awsUtil.getConfig()[profile];
        if (p) region = p.region;
    }
    return region;
}

function getIgniteStatus() {
    let state = null;

    const statusFilePath = getIgniteStatusPath();

    if (fsutils.exists(statusFilePath)) {
        state = JSON.parse(fsutils.readFile(statusFilePath));
    }

    return state;
}

function saveIgniteStatus(state) {
    const statusFilePath = getIgniteStatusPath();

    fsutils.writeFile(statusFilePath, JSON.stringify(state));
}

function deleteIgniteStatus() {
    const statusFilePath = getIgniteStatusPath();
    if (fsutils.exists(statusFilePath)) fsutils.rimraf(statusFilePath);
}

function getIgniteStatusPath() {
    return path.join(workspace.getWorkspaceDir(), "temp", `ignite-status.json`);
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