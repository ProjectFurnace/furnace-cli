#! /usr/bin/env node

const program = require("yargs")
    , w = require("./utils/workspace")
    ;

process.env.NODE_ENV = "production";

(async () => {
  try
  {
    w.initialize();
    
    program.commandDir('commands').completion().demandCommand().help().argv
    
  } catch (err){
    console.log('error',err);
    process.exit(1);
  }
})();






