const program = require("commander")
    , cmd = require("../actions/repo")

module.exports = (args) => {
    program
    .command("add [name] [url]")
    .action(async (name, url) => {
        await cmd.add(name, url);
    });

    program
    .command("list")
    .action(async () => {
        await cmd.list()
    });

    program
    .command("remove [name]")
    .action(async (name) => {
        await cmd.remove(name);
    });

    program.parse(args);
}