export const command = 'module <subcommand>'
export const desc = 'Manage modules'

export function builder (yargs: any) {
  yargs.commandDir('module')
}

export function handler (argv: any) {
  // 
}
