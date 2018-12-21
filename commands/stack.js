const program = require("commander")
    , cmd = require("../actions/module")

module.exports = (args) => {

    program
    .command("update-weboook")
    .action(async () => {
        await cmd.import();
    });

    program.parse(args);
}