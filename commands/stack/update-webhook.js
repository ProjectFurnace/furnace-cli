actions = require("../../actions/stack");

exports.command = "update-webhook";
exports.desc = "Updates the Git Repo Build Webhook";
exports.builder = {};
exports.handler = async (argv) => {
  await actions.updateWebhook(argv);
};
