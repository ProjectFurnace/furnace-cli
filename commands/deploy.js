deploy_actions = require("../actions/deploy")

exports.command = 'deploy sandbox'
exports.desc = 'Deploy a sandbox stack'
exports.builder = {}
exports.handler = async (argv) => {
  await deploy_actions(argv);
}