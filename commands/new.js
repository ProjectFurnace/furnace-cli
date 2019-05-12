new_actions = require("../actions/new")

exports.command = 'new <directory>'
exports.desc = 'Create new furnace stack in <directory>'
exports.builder = (yargs) => {
  return yargs.fail(function(msg, err, yargs) {
    if( err && err.name === 'HttpError' && err.status === 401 )
      console.error('GitHub authentication failed. You may want to check your GitHub token.')
    else if( err ) {
      console.log(err)
    } else {
      console.log(yargs.help());
      console.log(msg);
    }
    process.exit(1);
  });
}
exports.handler = async (argv) => {
    await new_actions(argv.directory);
}