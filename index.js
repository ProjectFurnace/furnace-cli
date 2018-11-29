var program = require("commander");

program
  .command("ignite <platform>")
  .action((platform, cmd) => {
    console.log(platform, cmd)
});

program
  .command("new <template>")
  .action((template, cmd) => {
    console.log(template, cmd)
});

program.parse(process.argv)