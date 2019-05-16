actions = require("../../actions/stack")

exports.command = 'dump'
exports.desc = 'Dumps the configuration from the current stack'
exports.builder = {}
exports.handler = async (argv) => {
  await actions.dump(argv);
}