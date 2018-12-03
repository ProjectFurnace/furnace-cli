const program = require("commander")
    , workspace = require("./utils/workspace")
    , ignite = require("./commands/ignite")
    , _new = require("./commands/new")
    ;

workspace.initialize();

program
  .command("ignite <platform> <region>")
  .action(async (platform, region) => {
    await ignite(platform, region);
});

program
  .command("new [template]")
  .action(async (template, cmd) => {
    await _new(template);
});

program.parse(process.argv);