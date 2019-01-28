cmd = require("../../../actions/repo")

exports.command = 'list'
exports.desc = 'List repos'
exports.builder = {}
exports.handler = async (argv) => {
  console.log(argv._[1])
  await cmd.list('repo/'+argv._[1]);
}