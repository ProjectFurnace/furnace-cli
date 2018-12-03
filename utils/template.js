const workspace = require("../utils/workspace")
    , gitutils = require("@project-furnace/gitutils")
    , fsutils = require("@project-furnace/fsutils")
    , path = require("path")
    ;

const workspaceDir = workspace.getWorkspaceDir()
    , templatesDir = path.join(workspaceDir, "templates")
    ;

module.exports.addTemplate = async (name, url) => {
    const templateDir = path.join(templatesDir, name)
        ;

    if (fsutils.exists(templateDir)) throw new Error(`template ${name} already exists`);
    else fsutils.mkdir(templateDir);

    await gitutils.clone(templateDir, url);

}
