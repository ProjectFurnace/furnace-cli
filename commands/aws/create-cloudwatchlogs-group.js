cmd = require("../../actions/aws")

exports.command = 'create-cloudwatchlogs-group <logGroupName>'
exports.desc = 'Create CloudWatch logs group <logGroupName>'
exports.builder = {}
exports.handler = async (argv) => {
  await cmd.createCloudWatchLogsGroup(argv.logGroupName);
}