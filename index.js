#! /usr/bin/env node

const program = require("yargs");
const workspace = require("./utils/workspace");

process.env.NODE_ENV = "production";

(async () => {
  workspace.initialize();
    
  program.commandDir('commands').completion().demandCommand().argv
})();

function commandFailed(msg, err, yargs) {
  if( !err )
    console.error(yargs.help());
  else {
    console.log(err);
  }
}






