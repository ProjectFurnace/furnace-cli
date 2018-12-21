const program = require("commander")
    , cmd = require("../actions/secret");

module.exports = (args) => {
    program
    .command("add <env> <name> <secret>")
    .action(async (environment, name, secret) => {
        await cmd.add(environment, name, secret);
    });

    program
    .command("del <env> <name>")
    .action(async (environment, name) => {
        await cmd.del(environment, name);
    });

    program.parse(args);

}