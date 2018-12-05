const gitutils = require("@project-furnace/gitutils")
    , fsutils = require("@project-furnace/fsutils")
    , workspace = require("../utils/workspace")
    , path = require("path")
    , AWS = require("aws-sdk")
    , inquirer = require("inquirer")
    , awsUtil = require("../utils/aws")
    ;

module.exports = async () => {

    const questions = [
        { type: 'input', name: 'name', message: "Name this Furnace Instance:", default: "furnace" },
        { type: 'list', name: 'platform', message: "Platform:", choices: ["aws"] },
        { type: 'input', name: 'bucket', message: "Artifact Bucket:", default: "" },
        { type: 'password', name: 'gitToken', message: "Git Access Token:", default: "" },
        { type: 'list', name: 'gitProvider', message: "Git Provider:", choices: ["github", "git"] },
        { type: 'confirm', name: 'storeGitHubToken', message: "Store GitHub Token", when: current => current.gitProvider === "github" }
    ];

    const answers = await inquirer.prompt(questions);

    switch (answers.platform) {
        case "aws":
            await ingiteAws(answers);
            break;
        default:
            throw new Error(`platform ${answers.platform} is not currently supported`);
    }
    
}

async function ingiteAws(answers) {

    const { name, platform, region, bucket, gitToken, gitProvider, storeGitHubToken } = answers;

    const bootstrapRemote = `https://github.com/ProjectFurnace/bootstrap`
        , workspaceDir = workspace.getWorkspaceDir()
        , bootstrapDir = path.join(workspaceDir, "bootstrap")
        , templateDir = path.join(bootstrapDir, platform)
        , templateFile = path.join(templateDir, "template", "simple.template") // "furnaceIgnite.template"
        ;

    let defaultRegion, defaultAccessKey, secret;

    const awsConfig = awsUtil.getConfig()
        , awsDefaultConfig = awsConfig ? awsConfig.default : null
        , awsDefaultCreds = awsDefaultConfig ? awsUtil.getCredentials("default") : null
        ;

    if (awsConfig && awsDefaultConfig && awsDefaultCreds) {
        
        defaultRegion = awsDefaultConfig.region;
        defaultAccessKey = awsDefaultCreds.aws_access_key_id;
        secret = awsDefaultCreds.aws_secret_access_key;
    }

    const awsQuestions = [
        { type: 'input', name: 'region', message: "Region:", default: defaultRegion },
        { type: 'input', name: 'accessKey', message: "AWS Access Key:", default: defaultAccessKey },
        { type: 'password', name: 'secret', message: "AWS Secret Access Key:", when: !awsDefaultCreds },
    ]

    const awsAnswers = await inquirer.prompt(awsQuestions);

    if (!secret) secret = awsAnswers.secret;

    if (!fsutils.exists(bootstrapDir)) {
        console.debug(`cloning ${bootstrapRemote} to ${bootstrapDir}...`)
        fsutils.mkdir(bootstrapDir);
        await gitutils.clone(bootstrapDir, bootstrapRemote, "", "");
    } else {
        console.debug(`pulling latest bootstrap templates...`);
        await gitutils.pull(bootstrapDir);
    }

    if (!fsutils.exists(templateDir)) throw new Error(`unable to find bootstrap template at ${templateDir}`);

    AWS.config.region = region;

    const cloudformation = new AWS.CloudFormation({ apiVersion: '2010-05-15'} );

    const stackParams = {
        StackName: name,
        Capabilities: ["CAPABILITY_NAMED_IAM"],
        TemplateBody: fsutils.readFile(templateFile),
        Parameters: [
            {
                ParameterKey: 'ArtifactBucketName',
                ParameterValue: bucket,
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
                ParameterKey: 'AWS_ACCESS_KEY_ID',
                ParameterValue: awsAnswers.accessKey,
            },
            {
                ParameterKey: 'AWS_SECRET_ACCESS_KEY',
                ParameterValue: secret,
            },
          ]
    }
    console.log(stackParams);
    return;
    try {

        let stackExists = false;
        const stackList = await cloudformation.listStacks().promise();
        
        for (let stack of stackList.StackSummaries) {
            if (stack.StackName === name) {
                stackExists = true;
                break;
            }
        }
        
        if (stackExists) {
            console.log("stack already exists, refreshing config...");
        } else {
            const createStackResponse = await cloudformation.createStack(stackParams).promise();
        }
        
        console.log("waiting for bootstrap template to finish...")
        
        // TODO: allow waiting for stackUpdateComplete
        const result = await cloudformation.waitFor('stackCreateComplete', { StackName: name }).promise();
        // const result = await cloudformation.waitFor('stackUpdateComplete', { StackName: name }).promise();

        let apiUrl;

        for (let stack of result.Stacks) {
            for (let output of stack.Outputs) {
                if (output.OutputKey === "apiURL") apiUrl = output.OutputValue;
            }
        }

        if (!apiUrl) throw new Error(`unable to retrieve url from aws stack`);
        const config = workspace.getConfig();

        config[name] = {
            platform,
            region,
            bucket,
            gitToken: storeGitHubToken ? gitToken : null,
            apiUrl,
            gitProvider
        }

        config.current = name;

        workspace.saveConfig(config);

    } catch (err) {
        throw new Error(`unable to ignite furnace: ${err}`)
    }
}