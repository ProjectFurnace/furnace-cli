const { getProcessor } = require("../utils/config");
const chalk = require("chalk");
const Table = require("cli-table3");

module.exports.get = async (stackPath, component, name) => {
  const config = getConfig(stackPath);

  switch (component) {
    case "source":
      return getSource(name, config);
  }
};

async function getSource(name, config) {
  let sources = config.sources;
  if (name) sources = sources.filter(s => s.name === name);

  console.log(sources);
}

function getConfig(stackPath) {
  const processor = getProcessor(stackPath);

  return processor.getConfig();
}
