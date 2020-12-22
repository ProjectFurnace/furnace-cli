const { Processor } = require("@project-furnace/stack-processor");
const path = require("path");
const fsUtils = require("@project-furnace/fsutils");
const yaml = require("yaml");
const workspace = require("../utils/workspace");
const { createFunction } = require("../utils/function");

module.exports.source = async (stackPath, name, type) => {
  if (!name || !type) {
    return { code: 1, message: "name and type must be passed." };
  }

  return process(stackPath, name, "source", { type });
};

module.exports.tap = async (stackPath, name, source) => {
  if (!name || !source) {
    return { code: 1, message: "name and source must be passed." };
  }

  return process(stackPath, name, "tap", { source });
};

module.exports.pipeline = async (stackPath, name, functions) => {
  if (!name || !functions) {
    return { code: 1, message: "name and functions must be passed." };
  }

  return process(stackPath, name, "pipeline", { functions });
};

module.exports.pipe = async (stackPath, fromType, fromName, toType, toName) => {
  return process(stackPath, null, "pipe", {
    fromType,
    fromName,
    toType,
    toName,
  });
};

module.exports.sink = async (stackPath, name) => {
  if (!name) {
    return { code: 1, message: "name must be passed." };
  }

  return process(stackPath, name, "sink", {});
};

async function process(stackPath, name, componentType, options) {
  let config;

  try {
    const processor = getProcessor(stackPath);
    config = processor.getConfig();
  } catch (error) {
    return {
      code: 2,
      message:
        "unable to get stack config, check that you're in a stack directory",
    };
  }

  let listName;

  try {
    listName = getListName(componentType);
  } catch (error) {
    return { code: 3, message: "unable to get component list" };
  }

  if (checkExists(config, name, listName)) {
    return { code: 4, message: "component already exists" };
  }

  let template;

  try {
    const definition = createComponent(name, componentType, options);
    template = definition.template;

    for (let fn of definition.functions || []) {
      if (fn.name.includes("/")) {
        importFunction(fn.name, config);
      } else {
        await createFunction(fn.name, fn.runtime);
      }
    }
  } catch (error) {
    return {
      code: 5,
      message: "unable to get component template: " + error.message,
    };
  }

  try {
    config[listName].push({
      ...(name && { name }), // add name if set
      ...template,
    });

    fsUtils.writeFile(
      path.join(stackPath, listName + ".yaml"),
      yaml.stringify(config[listName])
    );

    return { success: true };
  } catch (error) {
    return { code: 6, message: "unable to write config" };
  }
}

function createComponent(name, componentType, options) {
  let definition = {};
  let defaultRuntime = "nodejs12.x";

  switch (componentType) {
    case "source":
      const { type } = options;
      switch (type) {
        case "timer":
        case "restapi":
        case "stream":
        case "queue":
          const template = require(`../templates/components/${componentType}.${type}.json`);
          template.type = getRealComponentType(type);
          definition = { template };

          break;
        default:
          throw new Error("unknown source type " + type);
      }

      break;
    case "tap":
      const { source } = options;
      // TODO: check source exists
      definition = {
        template: { source },
        functions: [{ name, runtime: options.runtime || defaultRuntime }],
      };

      break;
    case "pipeline":
      const { functions } = options;

      const functionsList = functions.split(",");

      let template = { functions: [] };
      for (let fn of functionsList) {
        template.functions.push({ name: fn.trim() });
      }
      definition = {
        template,
        functions: template.functions.map((f) => ({
          name: f.name,
          runtime: options.runtime || defaultRuntime,
        })),
      };

      break;
    case "pipe":
      const { fromType, fromName, toType, toName } = options;

      definition = {
        template: {
          from: {
            [fromType]: fromName,
          },
          to: {
            [toType]: toName,
          },
        },
      };

      break;

    case "sink":
      definition = {
        template: {},
        functions: [{ name, runtime: options.runtime || defaultRuntime }],
      };

      break;
    default:
      throw new Error("unknown component " + componentType);
  }

  definition.template = transformTemplate(
    name,
    componentType,
    options,
    definition.template
  );

  return definition;
}

function getListName(componentType) {
  switch (componentType) {
    case "source":
      return "sources";
    case "tap":
      return "taps";
    case "pipeline":
      return "pipelines";
    case "pipe":
      return "pipes";
    case "sink":
      return "sinks";
    default:
      throw new Error("unknown componentType " + componentType);
  }
}

function checkExists(config, name, collection) {
  return config[collection].find((c) => c.name === name) ? true : false;
}

function getRealComponentType(type) {
  switch (type) {
    case "timer":
      return "Timer";
    case "stream":
      return "Stream";
    case "restapi":
      return "RestApi";
    case "queue":
      return "Queue";
    default:
      return type;
  }
}

function importFunction(name, config) {
  const [repo, fn] = name.split("/");
  const repositories = config.stack.repositories || [];

  if (!repositories.find((r) => r.name === repo)) {
    throw new Error(`unable to find repository ${repo} in stack config`);
  }
}

function transformTemplate(name, componentType, options, template) {
  switch (componentType) {
    case "source":
      const { type } = options;
      switch (type) {
        case "restapi":
          template.config.pathPart = name;
          return template;
        default:
          return template;
      }
    default:
      return template;
  }
}

function getProcessor(stackPath) {
  const workspaceDir = workspace.getWorkspaceDir(),
    templatesDir = path.join(workspaceDir, "function-templates");

  const processor = new Processor(stackPath, templatesDir);

  return processor;
}
