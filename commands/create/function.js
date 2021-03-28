const { handleResponse } = require("../../utils/command");
const actions = require("../../actions/create");

exports.command = "function <name>";
exports.desc = "Create a Function component <name>";
exports.builder = {};
exports.handler = async (argv) => {
  const response = await actions.function(
    process.cwd(),
    argv.name,
    argv.source
  );
  handleResponse(response);
};
