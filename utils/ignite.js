const fsutils = require("@project-furnace/fsutils");
const workspace = require("../utils/workspace");
const path = require("path");

module.exports.getIgniteStatus = () => {
  let state = null;

  const statusFilePath = module.exports.getIgniteStatusPath();

  if (fsutils.exists(statusFilePath)) {
    state = JSON.parse(fsutils.readFile(statusFilePath));
  }

  return state;
}

module.exports.saveIgniteStatus = (state) => {
  const statusFilePath = module.exports.getIgniteStatusPath();

  fsutils.writeFile(statusFilePath, JSON.stringify(state, undefined, 2));
}

module.exports.deleteIgniteStatus = () => {
  const statusFilePath = getIgniteStatusPath();
  if (fsutils.exists(statusFilePath)) fsutils.rimraf(statusFilePath);
}

module.exports.getIgniteStatusPath = () => {
  return path.join(workspace.getWorkspaceDir(), "temp", `ignite-status.json`);
}

module.exports.execPromise = (command, options) => {
  const exec = require("child_process").exec;

  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout + stderr);
    });
  });
}