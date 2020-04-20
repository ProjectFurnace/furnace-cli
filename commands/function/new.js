const actions = require("../../actions/function");

exports.command = "new <name> <template>";
exports.desc = "Create a module called <name> based on <template>";
exports.builder = {};
exports.handler = async argv => {
  await actions.new(argv.name, argv.template);
};
