#! /usr/bin/env node

const program = require("commander")
    , workspace = require("./utils/workspace")
    , ignite = require("./commands/ignite")
    , _new = require("./commands/new")
    , deploy = require("./commands/deploy")
    , promote = require("./commands/promote")
    , template = require("./commands/template")
    , github = require("./commands/github")
    , instance = require("./commands/instance")
    ;

try
{ 
  workspace.initialize();

  program
    .command("ignite")
    .action(async (name, platform, region) => {
      await ignite(name, platform, region);
  });

  program
    .command("new")
    .action(async (cmd) => {
      await _new();
  });

  program
    .command("deploy")
    .action(async (template, cmd) => {
      await deploy();
  });

  program
    .command("promote <environment>")
    .action(async (environment, cmd) => {
      await promote(environment);
  });

  program
    .command("template [rm] [name]")
    .action(async (subCommand, name) => {
      await template(subCommand, name);
  });

  program
    .command("github-hook-create-repo [secret] [token]")
    .action(async (secret, token) => {
      await github.createHook(secret, token);
  });

  program
    .command("instance-list")
    .action(async () => {
      instance.list();
  });

  program.parse(process.argv);
  
} catch (err){
  console.log(err);
  process.exit(1);
}