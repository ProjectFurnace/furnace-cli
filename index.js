const program = require("commander")
    , ignite = require("./commands/ignite")
    , workspace = require("./utils/workspace")
    ;

workspace.initialize();

program
  .command("ignite <platform> <region>")
  .action(async (platform, region) => {
    await ignite(platform, region);
});

program
  .command("new <template>")
  .action((template, cmd) => {
    console.log(template, cmd);
});

program.parse(process.argv);