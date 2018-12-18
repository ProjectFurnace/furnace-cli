const program = require("commander")
    , cmd = require("../actions/secret")

module.exports = (args) => {
    program
    .command("add [name] [secret]")
    .action(async (name, secret) => {
        await cmd.add(name, secret);
    });

    program.parse(args);

}