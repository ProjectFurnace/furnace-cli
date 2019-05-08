export const command = 'provider <subcommand>';
export const desc = 'Manage providers';

export function builder(yargs: any) {
  yargs.commandDir('provider');
}

export function handler(argv: any) {
  //
}
