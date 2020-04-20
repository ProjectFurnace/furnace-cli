const actions = require("../actions/get");

exports.command = "get <component> [name]";
exports.desc = "get details on Furnace components";
exports.builder = {};
exports.handler = async ({ component, name }) => {
  await actions.get(process.cwd(), component, name);
};
