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