const { handleResponse } = require("../../utils/command");
const actions = require("../../actions/create");

exports.command = "tap <name>";
exports.desc = "Create a Tap component <name>";
exports.builder = {};
exports.handler = async argv => {
  const response = await actions.tap(process.cwd(), argv.name, argv.source);
  handleResponse(response);
};
