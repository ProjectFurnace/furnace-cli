exports.command = 'secret <subcommand>'
exports.desc = 'Manage secrets for currently selected stack'
exports.builder = function (yargs) {
  return yargs.commandDir('secret')
}
exports.handler = function (argv) {}