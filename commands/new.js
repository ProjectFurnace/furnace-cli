const program = require("commander")
    , cmd = require("../actions/new")

module.exports = () => {
    program
    .command("new [directory]")
    .action(async (directory) => {
        await cmd(directory);
    });

    program.parse(process.argv);

}