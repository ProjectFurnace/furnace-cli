promote_actions = require("../actions/promote")

exports.command = 'promote <environment>'
exports.desc = 'Promote environment <environment>'
exports.builder = {}
exports.handler = async (argv) => {
  await promote_actions(argv.environment);
}