const { handleResponse } = require("../../utils/command");
const actions = require("../../actions/create");

exports.command = "pipe from <fromType> <fromName> to <toType> <toName>";
exports.desc = "Create a Pipe between components";
exports.builder = {};
exports.handler = async argv => {
  const { fromType, fromName, toType, toName } = argv;
  const response = await actions.pipe(
    process.cwd(),
    fromType,
    fromName,
    toType,
    toName
  );
  handleResponse(response);
};
