const program = require("commander")
    , cmd = require("../actions/destroy")

module.exports = (args) => {
    program
    .command("destroy")
    .action(async () => {
        await cmd();
    });

    program.parse(args);

}