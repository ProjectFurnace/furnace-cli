status_actions = require("../actions/status")

exports.command = 'status'
exports.desc = 'Show stack status'
exports.builder = (yargs) => {
  return yargs.fail(function(msg,err) {
    if( err && err.name === 'HttpError' && err.status === 401 )
      console.error('GitHub authentication failed. You may want to check your GitHub token.')
    else if( err )
      console.error('Please make sure to run the stack command inside a stack folder', err.name)
  });
}
exports.handler = async (argv) => {
  await status_actions();
}