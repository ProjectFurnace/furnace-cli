exports.command = "create <subcommand>";
exports.desc = "Create components";
exports.builder = function(yargs) {
  return yargs.commandDir("create");
};
exports.handler = function(argv) {};
