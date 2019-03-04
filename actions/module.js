const workspace = require("../utils/workspace")
    , path = require("path")
    , fsutils = require("@project-furnace/fsutils")
    , repository = require("../utils/repository")
    , yaml = require("yamljs")
    , gitutils = require("@project-furnace/gitutils")
    ;


module.exports.import = async (location) => {
    const repoModuleDir = path.join(workspace.getWorkspaceDir(), "repo", "module", location)
        , stackModuleDir = path.join(process.cwd(), "module")
        , repoModule = location.split("/")
        ;

    if (!fsutils.exists(repoModuleDir)) {
        console.log("the specified module does not exist, make sure you have added the repository to your workspace");
        return;
    }

    if (!fsutils.exists(path.join(process.cwd(), "stack.yaml"))) {
        console.log("you must be inside a furnace stack folder");
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

    await gitutils.pull(path.join(workspace.getWorkspaceDir(), "repo", "module", repoModule[0]));

    fsutils.cp(repoModuleDir, path.join(process.cwd(), "modules", repoModule[1]));
    console.log(`module ${location} imported successfully`)
}

module.exports.new = async (name, moduleTemplate) => {
    const templatesDir = path.join(workspace.getWorkspaceDir(), "module-templates")
        , templateDir = path.join(templatesDir, moduleTemplate)
        , destinationDir = path.join(process.cwd(), "modules", name)
        , destinationDefFile = path.join(destinationDir, "module.yaml")
        ;

    if (!fsutils.exists(templatesDir)) {
        await repository.add(".", "module-templates", "https://github.com/ProjectFurnace/module-templates");
    }

    if (!fsutils.exists(templateDir)) throw new Error(`unable to find template ${moduleTemplate}`);

    fsutils.cp(templateDir, destinationDir);

    if (!fsutils.exists(destinationDefFile)) throw new Error(`invalid template`); 
    
    const templateDef = yaml.load(destinationDefFile);

    templateDef.id = name;
    templateDef.runtime = moduleTemplate
    templateDef.meta.name = name;

    fsutils.writeFile(destinationDefFile, yaml.stringify(templateDef));
    
}