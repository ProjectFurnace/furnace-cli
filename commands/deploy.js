cmd = require("../actions/deploy")

exports.command = 'deploy'
exports.desc = 'Deploy new Furnace stack'
exports.builder = {}
exports.handler = async (argv) => {
  await cmd();
}