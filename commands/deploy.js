const program = require("commander")
    , cmd = require("../actions/deploy")

module.exports = (args) => {
    program
    .command("deploy")
    .action(async () => {
        await cmd();
    });

    program.parse(args);

}