const workspace = require("./workspace"),
  path = require("path"),
  fsutils = require("@project-furnace/fsutils"),
  repository = require("../utils/repository"),
  yaml = require("yamljs"),
  gitutils = require("@project-furnace/gitutils");

module.exports.createFunction = async (name, runtime) => {
  const templatesDir = path.join(
      workspace.getWorkspaceDir(),
      "module-templates"
    ),
    templateDir = path.join(templatesDir, runtime),
    destinationDir = path.join(process.cwd(), "src", name),
    destinationDefFile = path.join(destinationDir, "function.yaml");

  if (!fsutils.exists(templatesDir)) {
    await repository.add(
      ".",
      "module-templates",
      "https://github.com/ProjectFurnace/module-templates"
    );
  }

  if (!fsutils.exists(templateDir))
    throw new Error(`unable to find template ${runtime}`);

  fsutils.cp(templateDir, destinationDir);

  if (!fsutils.exists(destinationDefFile)) throw new Error(`invalid template`);

  const templateDef = yaml.load(destinationDefFile);

  templateDef.id = name;
  templateDef.runtime = runtime;
  templateDef.meta.name = name;

  fsutils.writeFile(destinationDefFile, yaml.stringify(templateDef));
};

module.exports.importFunction = async name => {
  const repoModuleDir = path.join(
      workspace.getWorkspaceDir(),
      "repo",
      "module",
      location
    ),
    stackModuleDir = path.join(process.cwd(), "module"),
    repoModule = location.split("/");
  if (!fsutils.exists(repoModuleDir)) {
    console.log(
      "the specified module does not exist, make sure you have added the repository to your workspace"
    );
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

  await gitutils.pull(
    path.join(workspace.getWorkspaceDir(), "repo", "module", repoModule[0])
  );

  fsutils.cp(repoModuleDir, path.join(process.cwd(), "src", repoModule[1]));
  console.log(`module ${location} imported successfully`);
};
