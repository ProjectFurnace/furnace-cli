secret_actions = require("../../actions/secret")

exports.command = 'get <env> <name>'
exports.desc = 'get secret for env/name'
exports.builder = {}
exports.handler = async (argv) => {
  await secret_actions.get(argv.env, argv.name);
}