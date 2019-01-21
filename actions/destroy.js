const stack = require("../utils/stack")
    , AWS = require("../utils/aws").getInstance
    ;

module.exports = async () => {
    const aws = AWS();

    const currentStack = stack.getConfig("stack")
        , stackName = currentStack.name
        ;


    console.log(`current stack is ${stackName}`);

    const lambda = new aws.Lambda()
        , kinesis = new aws.Kinesis()
        , elastic = new aws.ES()
        , redshift = new aws.Redshift()
        , firehose = new aws.Firehose()
        , iam = new aws.IAM()
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

    let rolesToDelete = []
    let policiesToDelete = []
    const rolesList = await iam.listRoles({MaxItems:200}).promise();

    for (let role of rolesList.Roles) {
        if (role.RoleName.startsWith(stackName)) {
            rolesToDelete.push(role.RoleName);

            const policiesList = await iam.listRolePolicies({MaxItems:200, RoleName: role.RoleName}).promise();

            for (let policy of policiesList.PolicyNames) {
                policiesToDelete.push([policy,role.RoleName]);
            }
        }
    }

    for (let policy of policiesToDelete) {
        console.log(`deleting policy ${policy[0]}`);
        const deleteResult = await iam.deleteRolePolicy({
            PolicyName: policy[0],
            RoleName: policy[1]
          }).promise()
    }

    for (let role of rolesToDelete) {
        console.log(`deleting role ${role}`);
        const deleteResult = await iam.deleteRole({
            RoleName: role
          }).promise()
    }

    let elasticsToDelete = [];
    const elasticList = await elastic.listDomainNames().promise();

    for (let domain of elasticList.DomainNames) {
        if (domain.DomainName.startsWith(stackName)) elasticsToDelete.push(domain.DomainName);
    }

    for (let domain of elasticsToDelete) {
        console.log(`deleting elasticsearch ${domain}`);
        const deleteResult = await elastic.deleteElasticsearchDomain({
            DomainName: domain
           }).promise()
    }

    let redshiftsToDelete = [];
    const redshiftList = await redshift.describeClusters().promise();

    for (let cluster of redshiftList.Clusters) {
        if (cluster.ClusterIdentifier.startsWith(stackName)) redshiftsToDelete.push(cluster.ClusterIdentifier);
    }

    for (let cluster of redshiftsToDelete) {
        console.log(`deleting redshift ${cluster}`);
        const deleteResult = await redshift.deleteCluster({
            ClusterIdentifier: cluster,
            SkipFinalClusterSnapshot: true
           }).promise()
    }

    let firehosesToDelete = [];
    const firehoseList = await firehose.listDeliveryStreams().promise();

    for (let stream of firehoseList.DeliveryStreamNames) {
        if (stream.startsWith(stackName)) firehosesToDelete.push(stream);
    }

    for (let streamName of firehosesToDelete) {
        console.log(`deleting firehose ${streamName}`);
        const deleteResult = await firehose.deleteDeliveryStream({
            DeliveryStreamName: streamName
           }).promise()
    }

}