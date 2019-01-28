cmd = require("../../actions/context")

exports.command = 'export <name> <file>'
exports.desc = 'Export context <name> to <file>'
exports.builder = {}
exports.handler = async (argv) => {
  await cmd.export(argv.name, argv.file);
}