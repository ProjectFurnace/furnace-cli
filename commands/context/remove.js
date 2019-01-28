cmd = require("../../actions/context")

exports.command = 'remove <name>'
exports.desc = 'Remove context <name>'
exports.builder = {}
exports.handler = async (argv) => {
  await cmd.remove(argv.name);
}