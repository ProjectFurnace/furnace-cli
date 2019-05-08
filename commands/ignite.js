ignite_actions = require("../actions/ignite")

exports.command = 'ignite'
exports.desc = 'Initialize a new Furnace instance'
exports.builder = (yargs) => {
  return yargs.fail(function(msg, err, yargs) {
    if( err )
      console.error('furnace ignite failed:', err);
    else {
      console.log(yargs.help());
      console.log(msg);
    }
    process.exit(1)
  });
}
exports.handler = async (argv) => {
  await ignite_actions();
}