const program = require("commander")
    , cmd = require("../actions/ignite")

module.exports = (args) => {
    program
    .command("ignite")
    .action(async () => {
        await cmd();
    });

    program.parse(args);

}