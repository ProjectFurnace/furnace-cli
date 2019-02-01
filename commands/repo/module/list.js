repo_actions = require("../../../actions/repo")

exports.command = 'list'
exports.desc = 'List repos'
exports.builder = {}
exports.handler = async (argv) => {
  await repo_actions.list('repo/'+argv._[1]);
}