import { Workspace } from '@project-furnace/sdk';
import * as yargs from 'yargs';

(async () => {
  Workspace.initialize();
  yargs
    .commandDir('commands')
    .demandCommand()
    .argv;
})();

function commandFailed(message: any, error: any, yargs: any) {
  if (!error) {
    console.error(yargs.help());
  } else {
    console.log(error);
  }
}
