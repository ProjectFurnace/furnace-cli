exports.command = 'connector <subcommand>'
exports.desc = 'Manage connectors'
exports.builder = function (yargs) {
  return yargs.commandDir('connector')
}
exports.handler = function (argv) {}