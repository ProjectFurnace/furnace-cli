exports.command = 'stack <subcommand>'
exports.desc = 'Various stack operations'
exports.builder = function (yargs) {
  return yargs.commandDir('stack')
}
exports.handler = function (argv) {}