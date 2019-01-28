cmd = require("../../../actions/repo")

exports.command = 'remove <name>'
exports.desc = 'Remove repo <name>'
exports.builder = {}
exports.handler = async (argv) => {
  await cmd.remove('repo/'+argv._[1], argv.name);
}