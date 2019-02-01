repo_actions = require("../../../actions/repo")

exports.command = 'add <name> <url>'
exports.desc = 'Add repo <name> from <url>'
exports.builder = {}
exports.handler = async (argv) => {
  await repo_actions.add('repo/'+argv._[1], argv.name, argv.url);
}