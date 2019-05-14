actions = require("../../actions/stack")

exports.command = 'describe'
exports.desc = 'Describe the current stack'
exports.builder = {}
exports.handler = async (argv) => {
  await actions.describe(argv);
}