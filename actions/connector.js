const workspace = require("../utils/workspace")
    , github = require("../utils/github")
    , stack = require("../utils/stack")
    , chalk = require("chalk")
    , stackUtil = require("../utils/stack")
    , Table = require("cli-table3")
    , path = require("path")
    , util = require("util")
    , fluentd = require("../utils/connectors/fluentd/fluentd")
    , AWS = require("aws-sdk");
;

module.exports.add = async (name) => {

    const context = workspace.getCurrentContext();
    const connectors = stack.getConfig("connectors");
    const connector = connectors.find(c => c.name === name);
    if (connector.type == "FluentConnector") {
        if (context.platform == "aws") {
            try {
                await buildAWSOutputs(connector, context);
            } catch (error) {
                console.log(chalk.red(error));
            }
        } else {
            console.log(chalk.red("No definition template for " + context.platform))
        }
    }

}

async function buildAWSOutputs(connector, context) {
    AWS.config.update({ region: context.region })
    const stack_info = stack.getConfig("stack");
    const sources = stack.getConfig("sources");
    const envs = stack_info.environments;
    const sts = new AWS.STS();
    let account_id = "";
    let account_promise = sts.getCallerIdentity({}).promise();
    await account_promise.then(
        function (data) {
            account_id = data.Account;
        },
        function (error) {
            console.log(chalk.red(error));
        }

    )
    const url_base = "https://sqs." + context.region + ".amazonaws.com/" + account_id + "/"
    envs.forEach(env => {
        connector.config.outputs.forEach(output => {
            const source = sources.find(s => s.name === output.source);
            const queuename = stack_info.name + '-' + output.source + '-' + env;
            if (!source) {
                console.log(chalk.red("No source found for source name: " + output.source));
            }
            else {
                if (!("options" in output)) {
                    output.options = {}
                }

                if (!("match" in output.options)) {
                    output.options.match = []
                }

                switch (source.type) {
                    case "aws.sqs.Queue":

                        const queueUrl = url_base + queuename

                        const sqs_match = {
                            'match_pattern': output.name,
                            '@type': "sqs",
                            'sqs_url': queueUrl,
                            'region': context.region,
                            'aws_key_id': '[REPLACE WITH AWS KEY]',
                            'aws_sec_key': '[REPLACE WITH AWS SECRET]',
                            'include_tag': true,
                            'tag_property_name': 'tag',
                        }
                        if (output.options.match[0]) {
                            Object.assign(output.options.match[0], sqs_match);
                        } else {
                            output.options.match.push(sqs_match);
                        }
                        break;

                    default:
                        const kinesis_match = {
                            'match_pattern': output.name,
                            '@type': 'kinesis_streams',
                            'stream_name': queuename,
                            'region': context.region,
                            'aws_key_id': '[REPLACE WITH AWS KEY]',
                            'aws_sec_key': '[REPLACE WITH AWS SECRET]'
                        }
                        if (output.options.match[0]) {
                            Object.assign(output.options.match[0], kinesis_match);
                        } else {
                            output.options.match.push(kinesis_match);
                        }
                        break;
                }

            }

        })
        fluentd.get_template(connector, connector.name, env);
    })

}


