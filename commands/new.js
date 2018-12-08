const workspace = require("../utils/workspace")
    , path = require("path")
    , fsutils = require("@project-furnace/fsutils")
    , gitutils = require("@project-furnace/gitutils")
    , templateUtil = require("../utils/template")
    , inquirer = require("inquirer")
    , yaml = require("yamljs")
    , githubUtil = require("../utils/github")
    ;

module.exports = async (directory) => {

    const currentDir = directory ? path.join(process.cwd(), directory) : process.cwd();
    if (!fsutils.exists(currentDir)) fsutils.mkdir(currentDir);
    
    const currentDirectoryFiles = fsutils.listDirectory(currentDir)
        , config = await workspace.getConfig()
        , currentConfig = config[config.current]
        ;
    
    if (currentDirectoryFiles.length > 0) throw new Error(`furnace new must be done in an empty directory`);

    const defaultStackName = path.basename(currentDir)
        , isGitHub = currentConfig.gitProvider
        , gitHubOrgs = isGitHub ? await githubUtil.getOrgs(currentConfig.gitToken) : []
        ;

    const questions = [
        { type: 'input', name: 'template', message: "Template:", default: "starter-template" },
        { type: 'input', name: 'remoteUrl', message: "Stack Remote Git URL:", default: "", when: !isGitHub },
        { type: 'input', name: 'stateRemoteUrl', message: "State Remote Git URL:", default: getStateRemoteGitUrl, when: !isGitHub },
        { type: 'input', name: 'stackName', message: "Stack Name:", default: defaultStackName },
        { type: 'list', name: 'org', message: "GitHub Org:", choices: gitHubOrgs, when: isGitHub },
        { type: 'input', name: 'repo', message: "GitHub Repository:", default: defaultStackName, when: isGitHub },
        { type: 'input', name: 'stateRepo', message: "Repository:", default: current => current.repo + "-state" },
        { type: 'confirm', name: 'createRepos', message: "Create GitHub Repositories?", when: isGitHub && currentConfig.gitToken },
        { type: 'confirm', name: 'privateRepo', message: "Private Repository?", when: current => current.createRepos },
        { type: 'confirm', name: 'createHook', message: "Create GitHub Webhook", when: () => isGitHub && currentConfig.gitToken },
        { type: 'password', name: 'hookSecret', message: "Webhook Secret:", when: current => current.createHook },
    ];

    const answers = await inquirer.prompt(questions);
    let { template, remoteUrl, stateRemoteUrl, stackName, createRepos, privateRepo, createHook, hookSecret, org, repo, stateRepo } = answers;

    if (isGitHub) {
        remoteUrl = `https://github.com/${org}/${repo}`;
        stateRemoteUrl = `https://github.com/${org}/${stateRepo}`;
    }

    const workspaceDir = workspace.getWorkspaceDir()
        , templateDir = path.join(workspaceDir, "templates", template)
        ;

    if (!fsutils.exists(templateDir)) {
        if (template === "starter-template") {
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
    stackConfig.name = stackName;
    stackConfig.state.repo = stateRemoteUrl;
    fsutils.writeFile(stackFile, yaml.stringify(stackConfig));

    await gitutils.init(currentDir);

    git = require("simple-git/promise")(currentDir);
    await git.addRemote("origin", remoteUrl);

    if (createRepos) {
        const currentRepo = await githubUtil.getRepository(currentConfig.gitToken, remoteUrl);
        if (currentRepo) console.log(`repository ${remoteUrl} already exists.`);
        else {
            await githubUtil.createRepository(currentConfig.gitToken, remoteUrl, privateRepo);
        }

        const currentStateRepo = await githubUtil.getRepository(currentConfig.gitToken, stateRemoteUrl);
        if (currentRepo) console.log(`repository ${stateRemoteUrl} already exists.`);
        else {
            await githubUtil.createRepository(currentConfig.gitToken, stateRemoteUrl, privateRepo);
        }

        console.log(`created repositories`);

    } else {
        console.log(`please ensure you create the remote repositories.\nstack repository: ${remoteUrl}\nstate repository: ${stateRemoteUrl}`);
    }

    if (createHook) {
        githubUtil.createRepoHook(currentConfig.gitToken, remoteUrl, currentConfig.apiUrl + "/hook", hookSecret)
        console.log(`created repository hook`)
    }

    console.log(`created new furnace stack`);

}

function getStateRemoteGitUrl(current) {
    return current.remoteUrl + "-state"
}