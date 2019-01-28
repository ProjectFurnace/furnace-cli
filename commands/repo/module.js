exports.command = 'module <subcommand>'
exports.desc = 'Manage module repos'
exports.builder = function (yargs) {
  return yargs.commandDir('module')
}
exports.handler = function (argv) {}