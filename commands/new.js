const workspace = require("../utils/workspace")
    , path = require("path")
    , fsutils = require("@project-furnace/fsutils")
    , gitutils = require("@project-furnace/gitutils")
    , templateUtil = require("../utils/template")
    , inquirer = require("inquirer")
    , yaml = require("yamljs")
    ;

module.exports = async () => {

    const currentDir = process.cwd()
        , currentDirectoryFiles = fsutils.listDirectory(currentDir)
        , config = await workspace.getConfig()
        , currentConfig = config[config.current]
        ;
    
    if (currentDirectoryFiles.length > 0) throw new Error(`furnace new must be done in an empty directory`);

    const defaultStackName = path.basename(process.cwd());
    const questions = [
        { type: 'input', name: 'template', message: "Template:", default: "starter-template" },
        { type: 'input', name: 'remoteUrl', message: "Stack Remote Git URL:", default: "" },
        { type: 'input', name: 'stateRemoteUrl', message: "State Remote Git URL:", default: getStateRemoteGitUrl },
        { type: 'input', name: 'stackName', message: "Stack Name:", default: defaultStackName },
    ];

    const answers = await inquirer.prompt(questions);

    const workspaceDir = workspace.getWorkspaceDir()
        , templateDir = path.join(workspaceDir, "templates", answers.template)
        ;

    if (!fsutils.exists(templateDir)) {
        if (answers.template === "starter-template") {
            await templateUtil.addTemplate("starter-template", "https://github.com/ProjectFurnace/starter-template");
            console.debug("downloading starter template...")
        } else {
            throw new Error(`unable to find template ${name}, use 'furnace template add'`);
        }
    }

    const stackFile = path.join(currentDir, "stack.yaml");

    fsutils.cp(templateDir, currentDir);
    fsutils.rimraf(path.join(currentDir, ".git"));

    const modulesPath = path.join(currentDir, "modules");
    if (!fsutils.exists(modulesPath)) fsutils.mkdir(modulesPath);

    const stackConfig = yaml.load(stackFile);
    stackConfig.name = answers.stackName;
    stackConfig.state.repo = answers.stateRemoteUrl;
    fsutils.writeFile(stackFile, yaml.stringify(stackConfig));

    await gitutils.init(currentDir);

    git = require("simple-git/promise")(currentDir);
    await git.addRemote("origin", answers.remoteUrl);

    console.log(`created new furnace stack\nstack repository: ${answers.remoteUrl}\nstate repository: ${answers.stateRemoteUrl}\nplease ensure you create the remote repositories.`);

}

function getStateRemoteGitUrl(current) {
    return current.remoteUrl + "-state"
}