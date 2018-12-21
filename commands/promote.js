const program = require("commander")
    , cmd = require("../actions/promote")

module.exports = (args) => {
    program
    .command("promote <environment>")
    .action(async (environment) => {
        await cmd(environment);
    });

    program.parse(args);

}