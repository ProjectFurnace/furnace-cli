context_actions = require("../../actions/context")

exports.command = 'import <file>'
exports.desc = 'Import context information from  <file>'
exports.builder = {}
exports.handler = async (argv) => {
  await context_actions.import(argv.file);
}