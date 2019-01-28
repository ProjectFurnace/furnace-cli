exports.command = 'context <subcommand>'
exports.desc = 'Manage contexts'
exports.builder = function (yargs) {
  return yargs.commandDir('context')
}
exports.handler = function (argv) {}