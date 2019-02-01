context_actions = require("../../actions/context")

exports.command = 'list'
exports.desc = 'List contexts'
exports.builder = {}
exports.handler = async (argv) => {
  await context_actions.list();
}