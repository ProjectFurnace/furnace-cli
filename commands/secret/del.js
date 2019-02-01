secret_actions = require("../../actions/secret")

exports.command = 'del <env> <name>'
exports.desc = 'Delete secret <name> from environment <env> for currently selected stack'
exports.builder = {}
exports.handler = async (argv) => {
  await secret_actions.del(argv.env, argv.name);
}