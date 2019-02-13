new_actions = require("../actions/new")

exports.command = 'new <directory>'
exports.desc = 'Create new furnace stack in <directory>'
exports.builder = (yargs) => {
  return yargs.fail(function(msg,err) {
    if( err && err.name === 'HttpError' && err.status === 401 )
      console.error('GitHub authentication failed. You may want to check your GitHub token.')
    else
      console.error(err);
  });
}
exports.handler = async (argv) => {
    await new_actions(argv.directory);
}