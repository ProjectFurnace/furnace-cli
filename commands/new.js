new_actions = require("../actions/new")

exports.command = 'new <directory>'
exports.desc = 'Create new furnace stack in <directory>'
exports.builder = {}
exports.handler = async (argv) => {
  await new_actions(argv.directory);
}