const stack = require("../utils/stack"),
  AWS = require("../utils/aws").getInstance;

module.exports = async (env) => {
  const aws = AWS();

  const currentStack = stack.getConfig("stack"),
    stackName = currentStack.name;

  console.log(`current stack is ${stackName} env ${env}`);

  const lambda = new aws.Lambda(),
    kinesis = new aws.Kinesis(),
    elastic = new aws.ES(),
    redshift = new aws.Redshift(),
    firehose = new aws.Firehose(),
    iam = new aws.IAM(),
    dynamodb = new aws.DynamoDB(),
    sqs = new aws.SQS();

  let functionsToDelete = [];
  const functionList = await lambda.listFunctions().promise();

  for (let fn of functionList.Functions) {
    if (fn.FunctionName.startsWith(stackName) && fn.FunctionName.endsWith(env))
      functionsToDelete.push(fn.FunctionName);
  }

  for (let fn of functionsToDelete) {
    console.log(`deleting function ${fn}`);
    const deleteResult = await lambda
      .deleteFunction({
        FunctionName: fn,
      })
      .promise();
  }

  let streamsToDelete = [];
  const streamList = await kinesis.listStreams().promise();

  for (let stream of streamList.StreamNames) {
    if (stream.startsWith(stackName) && stream.endsWith(env))
      streamsToDelete.push(stream);
  }

  for (let stream of streamsToDelete) {
    console.log(`deleting stream ${stream}`);
    const deleteResult = await kinesis
      .deleteStream({
        StreamName: stream,
        EnforceConsumerDeletion: true,
      })
      .promise();
  }

  let mappingsToDelete = [];
  const mappingList = await lambda.listEventSourceMappings().promise();

  for (let mapping of mappingList.EventSourceMappings) {
    const fnName = mapping.FunctionArn.split(":").pop();
    if (fnName.startsWith(stackName) && fnName.endsWith(env))
      mappingsToDelete.push(mapping.UUID);
  }

  for (let mapping of mappingsToDelete) {
    console.log(`deleting mapping ${mapping}`);
    const deleteResult = await lambda
      .deleteEventSourceMapping({
        UUID: mapping,
      })
      .promise();
  }

  let rolesToDelete = [];
  let policiesToDelete = [];
  const rolesList = await iam.listRoles({ MaxItems: 200 }).promise();

  for (let role of rolesList.Roles) {
    if (role.RoleName.startsWith(stackName) && role.RoleName.endsWith(env)) {
      rolesToDelete.push(role.RoleName);

      const policiesList = await iam
        .listRolePolicies({ MaxItems: 200, RoleName: role.RoleName })
        .promise();

      for (let policy of policiesList.PolicyNames) {
        policiesToDelete.push([policy, role.RoleName]);
      }
    }
  }

  for (let policy of policiesToDelete) {
    console.log(`deleting policy ${policy[0]}`);
    const deleteResult = await iam
      .deleteRolePolicy({
        PolicyName: policy[0],
        RoleName: policy[1],
      })
      .promise();
  }

  for (let role of rolesToDelete) {
    console.log(`deleting role ${role}`);
    const deleteResult = await iam
      .deleteRole({
        RoleName: role,
      })
      .promise();
  }

  let elasticsToDelete = [];
  const elasticList = await elastic.listDomainNames().promise();

  for (let domain of elasticList.DomainNames) {
    if (
      domain.DomainName.startsWith(stackName) &&
      domain.DomainName.endsWith(env)
    )
      elasticsToDelete.push(domain.DomainName);
  }

  for (let domain of elasticsToDelete) {
    console.log(`deleting elasticsearch ${domain}`);
    const deleteResult = await elastic
      .deleteElasticsearchDomain({
        DomainName: domain,
      })
      .promise();
  }

  let redshiftsToDelete = [];
  const redshiftList = await redshift.describeClusters().promise();

  for (let cluster of redshiftList.Clusters) {
    if (
      cluster.ClusterIdentifier.startsWith(stackName) &&
      cluster.ClusterIdentifier.endsWith(env)
    )
      redshiftsToDelete.push(cluster.ClusterIdentifier);
  }

  for (let cluster of redshiftsToDelete) {
    console.log(`deleting redshift ${cluster}`);
    const deleteResult = await redshift
      .deleteCluster({
        ClusterIdentifier: cluster,
        SkipFinalClusterSnapshot: true,
      })
      .promise();
  }

  let firehosesToDelete = [];
  const firehoseList = await firehose.listDeliveryStreams().promise();

  for (let stream of firehoseList.DeliveryStreamNames) {
    if (stream.startsWith(stackName) && stream.endsWith(env))
      firehosesToDelete.push(stream);
  }

  for (let streamName of firehosesToDelete) {
    console.log(`deleting firehose ${streamName}`);
    const deleteResult = await firehose
      .deleteDeliveryStream({
        DeliveryStreamName: streamName,
      })
      .promise();
  }

  let dynamoTablesToDelete = [];
  const tablesList = await dynamodb.listTables().promise();

  for (let table of tablesList.TableNames) {
    if (table.startsWith(stackName) && table.endsWith(env))
      dynamoTablesToDelete.push(table);
  }

  for (let tableName of dynamoTablesToDelete) {
    console.log(`deleting dynamodb table ${tableName}`);
    const deleteResult = await dynamodb
      .deleteTable({
        TableName: tableName,
      })
      .promise();
  }

  let queuesToDelete = [];
  const queuesList = await sqs.listQueues().promise();

  for (let queue of queuesList.QueueUrls) {
    if (queue.includes(`${stackName}-`) && queue.includes(`-${env}`))
      queuesToDelete.push(queue);
  }

  for (let queue of queuesToDelete) {
    console.log(`deleting sqs queue ${queue}`);
    const deleteResult = await sqs.deleteQueue({ QueueUrl: queue }).promise();
  }
};
