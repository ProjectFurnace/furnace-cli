extinguish_actions = require("../actions/extinguish")

exports.command = 'extinguish'
exports.desc = 'Destroy the currently selected Furnace instance'
exports.builder = (yargs) => {
  return yargs.fail(function(msg,err) {
    console.error('furnace extinguish failed:', err);
  });
}
exports.handler = async (argv) => {
  await extinguish_actions();
}