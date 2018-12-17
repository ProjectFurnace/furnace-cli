const program = require("commander")
    , cmd = require("../actions/module")

module.exports = (args) => {

    program
    .command("import [location]")
    .action(async (location) => {
        await cmd.import(location);
    });

    program.parse(args);
}