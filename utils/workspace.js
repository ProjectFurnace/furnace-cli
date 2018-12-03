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

    const workspaceDir = module.exports.getWorkspaceDir();

    if (!fsutils.exists(workspaceDir)) {
        fsutils.mkdir(workspaceDir);

        console.log(`furnace workspace does not exist, creating at ${workspaceDir}`);
    }

    const directories = ["bootstrap", "templates"];

    for (let dir of directories) {
        const p = path.join(workspaceDir, dir);
        if (!fsutils.exists(p)) fsutils.mkdir(p);
    }
}