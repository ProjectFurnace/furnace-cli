cmd = require("../../actions/context")

exports.command = 'status'
exports.desc = 'Show current context status'
exports.builder = {}
exports.handler = async (argv) => {
  await cmd.status();
}