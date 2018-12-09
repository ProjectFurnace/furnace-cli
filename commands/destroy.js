const workspace = require("../utils/workspace")
    , config = require("../utils/config")
    , AWS = require("aws-sdk")
    ;

module.exports = async () => {
    const stack = config.getConfig("stack")
        , stackName = stack.name
        , currentConfig = workspace.getCurrentConfig()
        , region = currentConfig.region
        ;

    AWS.config.region = region;
    //TODO: ensure we're using correct AWS profile

    console.log(`current stack is ${stackName}`);

    const lambda = new AWS.Lambda()
        , kinesis = new AWS.Kinesis()
        ;

    let functionsToDelete = [];
    const functionList = await lambda.listFunctions().promise();

    for (let fn of functionList.Functions) {
        if (fn.FunctionName.startsWith(stackName)) functionsToDelete.push(fn.FunctionName);
    }

    for (let fn of functionsToDelete) {
        console.log(`deleting function ${fn}`);
        const deleteResult = await lambda.deleteFunction({
            FunctionName: fn
           }).promise()
    }

    let streamsToDelete = []
    const streamList = await kinesis.listStreams().promise();

    for (let stream of streamList.StreamNames) {
        if (stream.startsWith(stackName)) streamsToDelete.push(stream);
    }

    for (let stream of streamsToDelete) {
        console.log(`deleting stream ${stream}`);
        const deleteResult = await kinesis.deleteStream({
            StreamName: stream,
            EnforceConsumerDeletion: true
          }).promise()
    }

    let mappingsToDelete = []
    const mappingList = await lambda.listEventSourceMappings().promise();

    for (let mapping of mappingList.EventSourceMappings) {
        const fnName = mapping.FunctionArn.split(":").pop();
        if (fnName.startsWith(stackName)) mappingsToDelete.push(mapping.UUID);
    }

    for (let mapping of mappingsToDelete) {
        console.log(`deleting mapping ${mapping}`);
        const deleteResult = await lambda.deleteEventSourceMapping({
            UUID: mapping
          }).promise()
    }

}