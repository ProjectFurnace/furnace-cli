exports.command = 'repo <type>'
exports.desc = 'Manage repos'
exports.builder = function (yargs) {
  return yargs.commandDir('repo')
}
exports.handler = function (argv) {}