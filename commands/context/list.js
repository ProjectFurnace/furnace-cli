cmd = require("../../actions/context")

exports.command = 'list'
exports.desc = 'List contexts'
exports.builder = {}
exports.handler = async (argv) => {
  await cmd.list();
}