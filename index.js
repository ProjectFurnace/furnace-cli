#! /usr/bin/env node

const program = require("commander")
    , w = require("./utils/workspace")
    , ignite = require("./commands/ignite")
    , _new = require("./commands/new")
    , promote = require("./commands/promote")
    , template = require("./commands/template")
    , status = require("./commands/status")
    , context = require("./commands/context")
    , destroy = require("./commands/destroy")
    , _module = require("./commands/module")
    , repo = require("./commands/repo")
    ;

try
{ 
  w.initialize();
  
  const initialCommand = program.parse(process.argv);
  
  if (initialCommand.args.length == 0) return program.help();

  const args = [""].concat(initialCommand.args);

  switch (initialCommand.args[0]) {
    case "ignite":
      ignite(process.argv);
      break;
    case "module":
      _module(args);
      break;
    case "repo":
      repo(args)
      break;
    case "new":
      _new(process.argv)
      break;
    case "promote":
      promote(process.argv);
      break;
    case "template":
      template(args);
      break;
    case "context":
      context(args);
      break;
    case "status":
      status(process.argv);
      break;
    case "destroy":
      destroy(process.argv);
      break;

  }
  
} catch (err){
  console.log(err);
  process.exit(1);
}