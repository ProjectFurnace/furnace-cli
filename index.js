#! /usr/bin/env node

const program = require("commander")
    , workspace = require("./utils/workspace")
    , ignite = require("./commands/ignite")
    , _new = require("./commands/new")
    , deploy = require("./commands/deploy")
    ;

workspace.initialize();

program
  .command("ignite <name> <platform> <region>")
  .action(async (name, platform, region) => {
    await ignite(name, platform, region);
});

program
  .command("new [template]")
  .action(async (template, cmd) => {
    await _new(template);
});

program
  .command("deploy")
  .action(async (template, cmd) => {
    await deploy();
});

program.parse(process.argv);