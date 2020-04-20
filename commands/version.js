status_actions = require("../actions/version");

exports.command = "version";
exports.desc = "Show current Furnace CLI Version";
exports.handler = async argv => {
  status_actions();
};
