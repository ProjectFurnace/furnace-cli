const path = require("path")
  , fsUtils = require("@project-furnace/fsutils")
  , workspace = require("../utils/workspace")
  , stackUtil = require("../utils/stack")
  , Table = require("cli-table3")
  ;

module.exports = async (argv) => {
  const aws = require("../utils/aws").getInstance();

  const components = [];
  const { env } = argv;

  const stack = stackUtil.getConfig("stack")
      , sources = stackUtil.getConfig("sources")
      , taps = stackUtil.getConfig("taps")
      , pipelines = stackUtil.getConfig("pipelines")
      , sinks = stackUtil.getConfig("sinks")
      , pipes = stackUtil.getConfig("pipes")
      ;

  processElements(sources, "Source", components, null, stack.name, env);
  processElements(taps, "Tap", components, null, stack.name, env);
  processElements(pipelines, "Pipeline", components, null, stack.name, env, pipes);

  for (let pipeline of pipelines) {
      processElements(pipeline.modules, "Pipeline/Module", components, pipeline.name, stack.name, env);
  }

  processElements(sinks, "Sink", components, null, stack.name, env, pipes);

  const lambda = new aws.Lambda()
      , kinesis = new aws.Kinesis()
      ;

  for(let component of components) {
    switch (component.type) {
      case "Module":
      
        try {
          const lambdaResource = await lambda.getFunction({ FunctionName: component.resource }).promise()
          component.status = "Created";
        } catch (err) {
          component.status = "Not Found";
        }
        break;

      case "Pipeline":
        component.status = "N/A";
        break;

      case "KinesisStream":
        try {
          const kinesisResource = await kinesis.describeStream({ StreamName: component.resource }).promise()
          component.status = "Created";
        } catch (err) {
          component.status = "Not Found";
        }
        break;
      
      default:
        component.status = "Unknown";
        break;
    }
  }

  const table = new Table({ head: ["Element", "Type", "Name", "Parent", "Resource", "Status"] });

  for (let component of components) {
    const { element, type, name, parent, resource, status } = component;
    table.push([ element, type, name, parent, resource, status ]);
  };

  console.log(table.toString());
}

function processElements(list, element, components, parent, stackName, env, pipes) {
  for (let obj of list) {
    const name = obj.name;

    if (!parent) {
      switch (element) {
        case "Tap":
          parent = obj.source;
          break;
        case "Pipeline":
          const pp = pipes.filter(p => p.pipeline === obj.name && p.tap);
          if (pp.length === 1) parent = pp[0].tap;
          break;
        case "Sink":
          const ps = pipes.filter(p => p.sink === obj.name && p.pipeline);
          if (ps.length === 1) parent = ps[0].pipeline;
          break;
      }
    }

    let type;
    if (obj.type) type = obj.type;
    else if (element == "Pipeline") type = "Pipeline";
    else type = "Module";

    const resource = `${stackName}-${obj.name}-${env}`;
    components.push({ element, type, name, parent, resource });
  }
}