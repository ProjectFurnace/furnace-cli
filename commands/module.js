exports.command = 'module <subcommand>'
exports.desc = 'Manage modules'
exports.builder = function (yargs) {
  return yargs.commandDir('module')
}
exports.handler = function (argv) {}