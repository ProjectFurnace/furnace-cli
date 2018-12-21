const program = require("commander")
    , cmd = require("../actions/aws")

module.exports = (args) => {

    program
        .command("subscribe-cloudwatchlogs-source <logGroupName> <source> <filterType> [filterPattern]")
        .action(async (logGroupName, source, filterType, filterPattern) => {
            await cmd.subscribeCloudWatchLogsSource(logGroupName, source, filterType, filterPattern);
    });

    program
        .command("create-cloudwatchlogs-group <logGroupName>")
        .action(async (logGroupName) => {
            await cmd.createCloudWatchLogsGroup(logGroupName);
    });

    program.parse(args);
}