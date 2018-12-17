const workspace = require("../utils/workspace")
    , path = require("path")
    , fsutils = require("@project-furnace/fsutils")
    ;


module.exports.import = (location) => {
    const repoModuleDir = path.join(workspace.getWorkspaceDir(), "repo", location)
        , stackModuleDir = path.join(process.cwd(), "modules")
        , repoModule = location.split("/")
        ;

    if (!fsutils.exists(repoModuleDir)) {
        console.log("the specified module does not exist, make sure you have added the repository to your workspace");
        return;
    }

    if (!fsutils.exists(path.join(process.cwd(), "stack.yaml"))) {
        console.log("you must be inside a furnace stack");
        return;
    }
    
    if (repoModule.length != 2) {
        console.log("location must be represented by 'repo/module'");
        return;
    }

    if (fsutils.exists(path.join(stackModuleDir, repoModule[1]))) {
        console.log("module currently exists in stack");
        return;
    }

    fsutils.cp(repoModuleDir, path.join(process.cwd(), "modules", repoModule[1]));
}