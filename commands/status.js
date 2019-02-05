status_actions = require("../actions/status")

exports.command = 'status'
exports.desc = 'Show stack status'
exports.builder = (yargs) => {
  return yargs.fail(function(msg,err) {
    if( err )
      console.error('Please make sure to run the stack command inside a stack folder')
  });
}
exports.handler = async (argv) => {
  await status_actions();
}