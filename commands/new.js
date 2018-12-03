const workspace = require("../utils/workspace")
    , path = require("path")
    , fsutils = require("@project-furnace/fsutils")
    , gitutils = require("@project-furnace/gitutils")
    , templateUtil = require("../utils/template")
    ;

module.exports = async (template) => {
    template = template || "starter-template";

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
    const currentDir = __dirname //"/Users/danny/Dev/Projects/falanx/furnace/temp/furnace-test";
    const currentDirectoryFiles = fsutils.listDirectory(currentDir);
    
    if (currentDirectoryFiles.length > 0) throw new Error(`furnace new must be done in an empty directory`);

    fsutils.cp(templateDir, currentDir);
    fsutils.rimraf(path.join(currentDir, ".git"));

    const modulesPath = path.join(currentDir, "modules");
    if (!fsutils.exists(modulesPath)) fsutils.mkdir(modulesPath);

    await gitutils.init(currentDir);

    console.log(`created new furnace stack in ${currentDir}\nplease add git remote`);

}