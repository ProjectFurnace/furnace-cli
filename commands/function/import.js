const actions = require("../../actions/function");

exports.command = "import <location>";
exports.desc = "Import module from <location>";
exports.builder = {};
exports.handler = async argv => {
  await actions.import(argv.location);
};
