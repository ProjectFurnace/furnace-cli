const workspace = require("../utils/workspace")
    , github = require("../utils/github")
    , stack = require("../utils/stack")
    , chalk = require("chalk")
    , stackUtil = require("../utils/stack")
    , Table = require("cli-table3")
    , path = require("path")
    , util = require("util")
    ;

module.exports.add = async () => {

    console.log(chalk.green.bold("It's working"))

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