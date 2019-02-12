ignite_actions = require("../actions/ignite")

exports.command = 'ignite'
exports.desc = 'Initialize a new Furnace instance'
exports.builder = (yargs) => {
  return yargs.fail(function(msg,err) {
    console.error('furnace ignite failed:', err);
  });
}
exports.handler = async (argv) => {
  await ignite_actions();
}