const workspace = require("./workspace")
    , gitutils = require("@project-furnace/gitutils")
    , fsutils = require("@project-furnace/fsutils")
    , path = require("path")
    ;

const workspaceDir = workspace.getWorkspaceDir();

module.exports.add = async (basedir, name, url) => {
    const repoDir = path.join(workspaceDir, basedir, name);

    if (fsutils.exists(repoDir)) throw new Error(`repository ${name} already exists`);
    else fsutils.mkdir(repoDir);

    await gitutils.clone(repoDir, url);
}

module.exports.list = basedir => {

    const repos = fsutils.listDirectory(path.join(workspaceDir, basedir));

    for (let repo of repos) {
        console.log(repo);
    }
}

module.exports.remove = (basedir, name) => {
    const repoDir = path.join(workspaceDir, basedir, name);

    if (fsutils.exists(repoDir)) fsutils.rimraf(repoDir);
    else console.log("unable to find repo");
}