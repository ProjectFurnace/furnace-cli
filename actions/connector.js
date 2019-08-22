const workspace = require("../utils/workspace")
    , github = require("../utils/github")
    , stack = require("../utils/stack")
    , chalk = require("chalk")
    , stackUtil = require("../utils/stack")
    , Table = require("cli-table3")
    , path = require("path")
    , util = require("util")
    , fluentd = require("../utils/connectors/fluentd/fluentd")
    ;

module.exports.add = async (name) => {

   

    const connectors = stack.getConfig("connectors");
    const connector = connectors.find(c => c.name === name);
    if(connector.type == "FluentConnector"){    
        try {
            fluentd.get_template(connector)
        } catch (error) {
            console.log(error);
        }
    }

}

function stateToColour(state) {
    switch (state) {
        case "success":
        return chalk.green(state);
        case "in_progress":
            return chalk.yellow(state);
        case "failed":
            return chalk.red(state);
        default:
            return chalk.red(state);
    }
}