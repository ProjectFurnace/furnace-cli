const { handleResponse } = require("../../utils/command");
const actions = require("../../actions/create");

exports.command = "source <name>";
exports.desc = "Create a Source component <name>";
exports.builder = {};
exports.handler = async argv => {
  const response = await actions.source(process.cwd(), argv.name, argv.type);
  handleResponse(response);
};
