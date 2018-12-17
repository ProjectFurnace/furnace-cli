const program = require("commander")
    , cmd = require("../actions/status")

module.exports = (args) => {
    program
    .command("status")
    .action(async () => {
        await cmd();
    });

    program.parse(args);

}