logs_actions = require("../actions/logs")

exports.command = 'logs <env> <name>'
exports.desc = 'tails logs'
exports.builder = (yargs) => {
  return yargs.fail(function(msg,err) {
    console.error('unable to tail log:', err);
  });
}
exports.handler = async (argv) => {
    await logs_actions(argv.env, argv.name);
}