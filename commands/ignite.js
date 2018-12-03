const gitutils = require("@project-furnace/gitutils")
    , fsutils = require("@project-furnace/fsutils")
    , workspace = require("../utils/workspace")
    , path = require("path")
    , AWS = require("aws-sdk")
    ;

module.exports = async (name, platform, region) => {
    await ingiteAws(name, platform, region);
}

async function ingiteAws(name, platform, region) {
    const bootstrapRemote = `https://github.com/ProjectFurnace/bootstrap`
        , workspaceDir = workspace.getWorkspaceDir()
        , bootstrapDir = path.join(workspaceDir, "bootstrap")
        , templateDir = path.join(bootstrapDir, platform)
        , templateFile = path.join(templateDir, "template", "furnaceIgnite.template")//"simple.template")
        ;

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
        TemplateBody: fsutils.readFile(templateFile)
    }

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
            apiUrl
        }

        config.current = name;

        workspace.saveConfig(config);

    } catch (err) {
        throw new Error(`unable to ignite furnace: ${err}`)
    }
}