cmd = require("../../actions/context")

exports.command = 'select <name>'
exports.desc = 'Select context <name>'
exports.builder = {}
exports.handler = async (argv) => {
  await cmd.select(argv.name);
}