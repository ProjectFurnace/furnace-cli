aws_actions = require("../../actions/aws")

exports.command = 'subscribe-cloudwatchlogs-source <logGroupName> <source> <filterType> [filterPattern]'
exports.desc = 'Subscribe CloudWatch <logGroupName> to <source> with a specified <filterType> or [filterPattern]'
exports.builder = {}
exports.handler = async (argv) => {
  await aws_actions.subscribeCloudWatchLogsSource(argv.logGroupName, argv.source, argv.filterType, argv.filterPattern);
}