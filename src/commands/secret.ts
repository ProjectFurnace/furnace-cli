export const command = 'secret <subcommand>'
export const desc = 'Manage secrets for currently selected stack'

export function builder (yargs: any) {
  yargs.commandDir('secret')
}

export function handler (argv: any) {
  // 
}
