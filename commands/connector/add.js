actions = require("../../actions/connector")

exports.command = 'add'
exports.desc = 'Adds a new connector to the stack'
exports.builder = {}
exports.handler = async (argv) => {
  await actions.add();
}