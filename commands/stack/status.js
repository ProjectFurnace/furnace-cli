actions = require("../../actions/stack")

exports.command = 'status'
exports.desc = 'Show current stack deployment status'
exports.builder = {}
exports.handler = async (argv) => {
  await actions.status();
}