const gitutils = require("@project-furnace/gitutils")
    , fsutils = require("@project-furnace/fsutils")
    , workspace = require("../utils/workspace")
    , path = require("path")
    , AWS = require("aws-sdk")
    ;

module.exports = async (platform, region) => {
    const bootstrapRemote = `https://github.com/ProjectFurnace/bootstrap`
        , workspaceDir = workspace.getWorkspaceDir()
        , bootstrapDir = path.join(workspaceDir, "bootstrap")
        , templateDir = path.join(bootstrapDir, platform)
        , templateFile = path.join(templateDir, "template", "furnaceIgnite.template")
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
        StackName: "furnaceTest2",
        Capabilities: ["CAPABILITY_NAMED_IAM"],
        TemplateBody: fsutils.readFile(templateFile)
    }

    try {
        const createStackResponse = await cloudformation.createStack(stackParams).promise();
    } catch(err) {
        throw new Error("unable to create furnace stack\n" + err);
    }

}