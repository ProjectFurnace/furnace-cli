exports.command = 'stack <subcommand>'
exports.desc = 'Manage stack repos'
exports.builder = function (yargs) {
  return yargs.commandDir('stack')
}
exports.handler = function (argv) {}