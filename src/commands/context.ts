export const command = 'context <subcommand>'
export const desc = 'Manage contexts'

export function builder (yargs: any) {
  yargs.commandDir('context')
}

export function handler (argv: any) {
  // 
}
