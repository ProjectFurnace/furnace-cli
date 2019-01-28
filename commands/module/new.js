cmd = require("../../actions/module")

exports.command = 'new <name> <template>'
exports.desc = 'Create a module called <name> based on <template>'
exports.builder = {}
exports.handler = async (argv) => {
  await cmd.new(argv.name, argv.template);
}