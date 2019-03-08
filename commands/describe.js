describe_actions = require("../actions/describe")

exports.command = 'describe <env>'
exports.desc = 'Describes your current stack'
exports.builder = {}
exports.handler = async (argv) => {
  await describe_actions(argv);
}