module_actions = require("../../actions/module")

exports.command = 'new <name> <template>'
exports.desc = 'Create a module called <name> based on <template>'
exports.builder = {}
exports.handler = async (argv) => {
  await module_actions.new(argv.name, argv.template);
}