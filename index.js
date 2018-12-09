#! /usr/bin/env node

const program = require("commander")
    , w = require("./utils/workspace")
    , ignite = require("./commands/ignite")
    , _new = require("./commands/new")
    , deploy = require("./commands/deploy")
    , promote = require("./commands/promote")
    , template = require("./commands/template")
    , github = require("./commands/github")
    , instance = require("./commands/instance")
    , status = require("./commands/status")
    , context = require("./commands/context")
    , destroy = require("./commands/destroy")
    ;

try
{ 
  w.initialize();

  program
    .command("ignite")
    .action(async (name, platform, region) => {
      await ignite(name, platform, region);
  });

  program
    .command("new [directory]")
    .action(async (directory) => {
      await _new(directory);
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
    .command("github-hook-create-repo [token] [secret]")
    .action(async (token, secret) => {
      await github.createHook(token, secret);
  });

  program
    .command("instance-list")
    .action(async () => {
      instance.list();
  });

  program
    .command("instance-import [file]")
    .action(async (file) => {
      await instance.import(file);
  });

  program
    .command("instance-export [name] [file]")
    .action(async (name, file) => {
      await instance.export(name, file);
  });

  program
    .command("instance-select [name]")
    .action(async (name) => {
      await instance.select(name);
  });

  program
    .command("instance-remove [name]")
    .action(async (name) => {
      await instance.remove(name);
  });

  program
    .command("status")
    .action(async () => {
      await status();
  });

  program
    .command("context")
    .action(async () => {
      await context();
  });

  program
    .command("destroy")
    .action(async () => {
      await destroy();
  });

  program.parse(process.argv);
  
} catch (err){
  console.log(err);
  process.exit(1);
}