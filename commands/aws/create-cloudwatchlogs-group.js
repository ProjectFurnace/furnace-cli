aws_actions = require("../../actions/aws")

exports.command = 'create-cloudwatchlogs-group <logGroupName>'
exports.desc = 'Create CloudWatch logs group <logGroupName>'
exports.builder = {}
exports.handler = async (argv) => {
  await aws_actions.createCloudWatchLogsGroup(argv.logGroupName);
}