stack_actions = require("../actions/stack")

exports.command = 'update-webhook'
exports.desc = 'Update '
exports.builder = {}
exports.handler = async (argv) => {
  await stack_actions.updateWebhook();
}