const { Processor } = require("@project-furnace/stack-processor");
const workspace = require("./workspace");
const path = require("path");

module.exports.getProcessor = stackPath => {
  const workspaceDir = workspace.getWorkspaceDir(),
    templatesDir = path.join(workspaceDir, "function-templates");

  const processor = new Processor(stackPath, templatesDir);

  return processor;
};
