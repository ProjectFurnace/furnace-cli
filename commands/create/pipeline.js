const { handleResponse } = require("../../utils/command");
const actions = require("../../actions/create");

exports.command = "pipeline <name>";
exports.desc = "Create a Pipeline component <name>";
exports.builder = {};
exports.handler = async argv => {
  const response = await actions.pipeline(
    process.cwd(),
    argv.name,
    argv.functions
  );
  handleResponse(response);
};
