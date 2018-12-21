const workspace = require("./workspace")
    , gitutils = require("@project-furnace/gitutils")
    , fsutils = require("@project-furnace/fsutils")
    , path = require("path")
    , chalk = require("chalk")
    ;

const workspaceDir = workspace.getWorkspaceDir();

module.exports.add = async (basedir, name, url) => {
    const repoDir = path.join(workspaceDir, basedir, name);

    if (fsutils.exists(repoDir)) throw new Error(`repository ${name} already exists`);
    else fsutils.mkdir(repoDir);

    await gitutils.clone(repoDir, url);
}

module.exports.list = basedir => {

    const repoDir = path.join(workspaceDir, basedir);
    const repos = fsutils.listDirectory(repoDir);

    for (let repo of repos) {
        console.log(chalk.green(repo));
        const items = fsutils.listDirectory(path.join(repoDir, repo));

        for (let item of items) {
            if (!item.startsWith(".") && item.toLowerCase() !== "readme.md") console.log(`  ${item}`);
        }
        console.log();
        
    }
}

module.exports.remove = (basedir, name) => {
    const repoDir = path.join(workspaceDir, basedir, name);

    if (fsutils.exists(repoDir)) fsutils.rimraf(repoDir);
    else console.log("unable to find repo");
}