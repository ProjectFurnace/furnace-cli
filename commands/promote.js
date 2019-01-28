cmd = require("../actions/promote")

exports.command = 'promote <environment>'
exports.desc = 'Promote environment <environment>'
exports.builder = {}
exports.handler = async (argv) => {
  await cmd(argv.environment);
}