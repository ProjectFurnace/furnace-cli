context_actions = require("../../actions/context")

exports.command = 'remove <name>'
exports.desc = 'Remove context <name>'
exports.builder = {}
exports.handler = async (argv) => {
  await context_actions.remove(argv.name);
}