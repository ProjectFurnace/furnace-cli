secret_actions = require("../../actions/secret")

exports.command = 'add <env> <name> <secret>'
exports.desc = 'Add secret <name> with value <secret> for environment <env> to currently selected stack'
exports.builder = {}
exports.handler = async (argv) => {
  await secret_actions.add(argv.env, argv.name, argv.secret.toString());
}