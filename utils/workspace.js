const os = require("os")
    , path = require("path")
    , fsutils = require("@project-furnace/fsutils")
    ;



module.exports.getWorkspaceDir = () => {
    const homedir = os.homedir()
    , workspaceDir = path.join(homedir, ".furnace")
    ;

    return workspaceDir;
}

module.exports.initialize = () => {

    const workspaceDir = module.exports.getWorkspaceDir()
        , configFile = path.join(workspaceDir, "config.json")

    if (!fsutils.exists(workspaceDir)) {
        fsutils.mkdir(workspaceDir);

        console.log(`furnace workspace does not exist, creating at ${workspaceDir}`);
    }

    const directories = ["bootstrap", "templates"];

    for (let dir of directories) {
        const p = path.join(workspaceDir, dir);
        if (!fsutils.exists(p)) fsutils.mkdir(p);
    }

    if (!fsutils.exists(configFile)) fsutils.writeFile(configFile, JSON.stringify({}));

}

module.exports.getConfig = () => {
    const configFile = path.join(module.exports.getWorkspaceDir(), "config.json");
    const config = JSON.parse(fsutils.readFile(configFile))

    return config;
}

module.exports.saveConfig = (config) => {
    const configFile = path.join(module.exports.getWorkspaceDir(), "config.json");
    fsutils.writeFile(configFile, JSON.stringify(config));
}

module.exports.getContext = async () => {
    let remoteUrl, lastCommitRef, apiUrl;
    const config = module.exports.getConfig();

    const currentConfig = config[config.current];

    if (!currentConfig.apiUrl) throw new Error(`unable to get current config`);
    apiUrl = currentConfig.apiUrl;

    const currentPath = process.cwd();

    git = require("simple-git/promise")(currentPath);

    try {
        const remotesResponse = await git.listRemote(['--get-url']);
        let remotes = []
        if (remotesResponse) remotes = remotesResponse.split("\n");
        if (remotes.length === 0) throw new Error("can't get remote url");
        remoteUrl = remotes[0];

        const logs = await git.log();
        lastCommitRef = logs.latest.hash;
        if (!lastCommitRef) throw new Error("unable to get last commit");

    } catch (err) {
        throw new Error(`unable to get commit info: ` + err);
    }

    return {
        apiUrl, remoteUrl, lastCommitRef
    }

}