destroy_actions = require("../actions/destroy");

exports.command = "destroy <env>";
exports.desc = "Destroy Furnace stack";
exports.builder = {};
exports.handler = async (argv) => {
  await destroy_actions();
};
