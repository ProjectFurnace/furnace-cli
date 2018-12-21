const program = require("commander")
    , cmd = require("../actions/repo")

module.exports = (args) => {

    const type = args[2];
    args.splice(0,1);

    let baseDir;
    switch (type) {
        case "module":
            baseDir = "repo/module";
            break;
        case "stack":
            baseDir = "repo/stack";
            break;
        default:
            throw new Error(`unknown repo type ${type}`);
    }

    program
    .command("add [name] [url]")
    .action(async (name, url) => {
        await cmd.add(baseDir, name, url);
    });

    program
    .command("list")
    .action(async () => {
        await cmd.list(baseDir)
    });

    program
    .command("remove [name]")
    .action(async (name) => {
        await cmd.remove(baseDir, name);
    });

    program.parse(args);
}