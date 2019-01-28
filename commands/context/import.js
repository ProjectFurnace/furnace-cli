cmd = require("../../actions/context")

exports.command = 'import <file>'
exports.desc = 'Import context information from  <file>'
exports.builder = {}
exports.handler = async (argv) => {
  await cmd.import(argv.file);
}