const workspace = require("../utils/workspace")
    , context = workspace.getCurrentContext()
    , stackUtils = require("../utils/stack")
    , fsUtils = require("@project-furnace/fsutils")
    , path = require("path")
    , chalk = require("chalk")
    , CWLogFilterEventStream = require("smoketail").CWLogFilterEventStream
    ;

module.exports = async (env, name) => {

  const stackFile = path.join(process.cwd(), "stack.yaml");
  if (!fsUtils.exists(stackFile)) {
    console.error("you must be inside a furance stack directory");
    return;
  }

  let dateOffset = (60*1000) // 1 minute
      , startTime = new Date()
      ;

  startTime.setTime(startTime.getTime() - dateOffset);
  startTime = startTime.getTime();

  const stack = stackUtils.getConfig("stack")
      , logGroupName = `/aws/lambda/${stack.name}-${name}-${env}`
      , filterOpts = {
          logGroupName,
          follow: true,
          startTime
        }
      , awsOpts = { region : context.region  }
      ;

  const eventStream = new CWLogFilterEventStream(filterOpts,awsOpts);
  eventStream.on('error', function(err){
      console.log(chalk.red(err));
      eventStream.close();
  });

  eventStream.on('data',function(eventObject){
      console.log(
        chalk.cyan(new Date(eventObject.timestamp)),
        chalk.white(eventObject.message)
      );
  });

}