context_actions = require("../../actions/context")

exports.command = 'select <name>'
exports.desc = 'Select context <name>'
exports.builder = {}
exports.handler = async (argv) => {
  await context_actions.select(argv.name);
}