import { readFile, writeFile, rename } from 'node:fs/promises';

export type WalletCheckpoint = { network: 'preprod'; address: string; shielded: string; dust: string; unshielded: string };
export async function readCheckpoint(file: string, address: string): Promise<WalletCheckpoint | undefined> {
  let raw: string;
  try { raw = await readFile(file, 'utf8'); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return; throw new Error('Cannot read wallet checkpoint'); }
  let state: WalletCheckpoint;
  try { state = JSON.parse(raw); } catch { throw new Error('Invalid wallet checkpoint; contents withheld'); }
  if (state?.network !== 'preprod' || state?.address !== address) throw new Error('Wallet checkpoint account or network mismatch');
  if (![state.shielded, state.dust, state.unshielded].every(value => typeof value === 'string' && value.length > 0)) {
    throw new Error('Invalid wallet checkpoint; contents withheld');
  }
  return state;
}
export async function writeCheckpoint(file: string, state: WalletCheckpoint) {
  await writeFile(`${file}.tmp`, JSON.stringify(state), { mode: 0o600 });
  await rename(`${file}.tmp`, file);
}
