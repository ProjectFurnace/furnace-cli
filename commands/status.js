status_actions = require("../actions/status")

exports.command = 'status'
exports.desc = 'Show stack status'
exports.builder = {}
exports.handler = async (argv) => {
  await status_actions();
}