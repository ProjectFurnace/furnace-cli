cmd = require("../../actions/module")

exports.command = 'import <location>'
exports.desc = 'Import module from <location>'
exports.builder = {}
exports.handler = async (argv) => {
  await cmd.import(argv.location);
}