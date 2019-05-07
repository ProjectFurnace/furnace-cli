import * as yargs from 'yargs'
import * as workspace from './utils/workspace'

(async () => {
  workspace.initialize()
  yargs
    .commandDir('commands')
    .demandCommand()
    .argv
})()

function commandFailed (message: any, error: any, yargs: any) {
  if (!error) {
    console.error(yargs.help())
  } else {
    console.log(error)
  }
}
