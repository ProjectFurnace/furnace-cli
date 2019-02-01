context_actions = require("../../actions/context")

exports.command = 'export <name> <file>'
exports.desc = 'Export context <name> to <file>'
exports.builder = {}
exports.handler = async (argv) => {
  await context_actions.export(argv.name, argv.file);
}