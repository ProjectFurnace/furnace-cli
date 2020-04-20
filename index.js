#! /usr/bin/env node

const program = require("yargs");
const workspace = require("./utils/workspace");

process.env.NODE_ENV = "production";

(async () => {
  workspace.initialize();

  program
    .completion()
    .commandDir("commands")
    .demandCommand().argv;
})();
