const AWS = require("../utils/aws").getInstance();

module.exports.createCloudWatchLogsGroup = async (logGroupName) => {
    const cwl = new AWS.CloudWatchLogs({apiVersion: '2014-03-28'});

    const result = await cwl.createLogGroup({
        logGroupName
    });

    const resultDescribe = await cwl.describeLogGroups().promise()
    console.log(resultDescribe)
}

module.exports.subscribeCloudWatchLogsSource = async (logGroupName, source, filterType, filterPattern) => {
    const sts = new AWS.STS()
        , cwl = new AWS.CloudWatchLogs({apiVersion: '2014-03-28'})
        , iam = new AWS.IAM()
        , identity = await sts.getCallerIdentity().promise()
        , account = identity.Account
        ;

    const roleName = `${source}-source-role`
        , policyName = `${source}-source-policy`
        ;

    const iamRole = {
        "Statement": {
            "Effect": "Allow",
            "Principal": { "Service": `logs.${AWS.config.region}.amazonaws.com` },
            "Action": "sts:AssumeRole"
          }
    }

    const iamPolicy = {
        "Statement": [
            {
              "Effect": "Allow",
              "Action": "kinesis:PutRecord",
              "Resource": `arn:aws:kinesis:${AWS.config.region}:${account}:stream/${source}`
            },
            {
              "Effect": "Allow",
              "Action": "iam:PassRole",
              "Resource": `arn:aws:iam::${account}:role/$`
            }
          ]
    }

    const roleParams = {
        AssumeRolePolicyDocument: JSON.stringify(iamRole),
        RoleName: roleName
    };
    // await iam.createRole(roleParams).promise();

    const policyParams = {
        PolicyName: policyName, 
        RoleName: roleName,
        PolicyDocument: JSON.stringify(iamPolicy),
    };
    // await iam.putRolePolicy(policyParams).promise();

    const role = await iam.getRole({ RoleName: roleName }).promise();

    const destinationArn = `arn:aws:kinesis:${AWS.config.region}:${account}:stream/${source}`
        , filterName = `${source}-filter`
        , roleArn = role.Role.Arn;
        ;

    if (filterType = "vpcflowlogs") {
        filterPattern = "[version, account_id, interface_id, srcaddr != -, dstaddr != -, srcport != -, dstport != -, protocol, packets, bytes, start, end, action, log_status]";
    }

    if (!filterPattern) throw new Error(`you must specify a filterType or filterPattern`);
    
    const params = {
        logGroupName,
        destinationArn,
        roleArn,
        filterName,
        filterPattern
      };

      console.log("params", params);
      
      const putResult = await cwl.putSubscriptionFilter(params).promise();
      console.log("resp", putResult);
}