import version from '../actions/version';

export const command = 'version';
export const desc = 'Show the current Furnace CLI version';

export function handler(argv: any) {
  version();
}
