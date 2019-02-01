module_actions = require("../../actions/module")

exports.command = 'import <location>'
exports.desc = 'Import module from <location>'
exports.builder = {}
exports.handler = async (argv) => {
  await module_actions.import(argv.location);
}