const { handleResponse } = require("../../utils/command");
const actions = require("../../actions/create");

exports.command = "sink <name>";
exports.desc = "Create a Sink component <name>";
exports.builder = {};
exports.handler = async (argv) => {
  const response = await actions.sink(process.cwd(), argv.name);
  handleResponse(response);
};
