exports.command = 'aws <subcommand>'
exports.desc = 'Manage AWS specific configurations'
exports.builder = function (yargs) {
  return yargs.commandDir('aws')
}
exports.handler = function (argv) {}