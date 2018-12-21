const program = require("commander")
    , cmd = require("../actions/ignite")

module.exports = async (args) => {

    await program
        .command("ignite")
        .action(async () => {
            await cmd();
        });


    program.parse(args);
    
}