const program = require("commander")
    , cmd = require("../actions/context")

module.exports = (args) => {

    program
        .command("list")
        .action(async () => {
            cmd.list();
    });

    program
        .command("status")
        .action(async () => {
            cmd.status();
    });

    program
        .command("import [file]")
        .action(async (file) => {
        await cmd.import(file);
    });

    program
        .command("export [name] [file]")
        .action(async (name, file) => {
        await cmd.export(name, file);
    });

    program
        .command("select [name]")
        .action(async (name) => {
        await cmd.select(name);
    });

    program
        .command("remove [name]")
        .action(async (name) => {
        await cmd.remove(name);
    });

    program.parse(args);
}