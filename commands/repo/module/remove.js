repo_actions = require("../../../actions/repo")

exports.command = 'remove <name>'
exports.desc = 'Remove repo <name>'
exports.builder = {}
exports.handler = async (argv) => {
  await repo_actions.remove('repo/'+argv._[1], argv.name);
}