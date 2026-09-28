// Human-only export of the existing demo card capability. This module never creates secrets.
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { ledger as decodeLedger } from '../managed/cat-bluff/contract/index.js';
import { decryptPackage, encryptPackage, validatePackageState, type PackageScope } from './web/private-package.ts';
import type { PrivateState } from './web/private-state.ts';

const SOURCE = resolve('.private/local.json');
const RECEIPT = resolve('docs/evidence/deployment.json');
const OUTPUT = resolve('.private/cat-bluff-demo.enc.json');
const INDEXER = 'https://indexer.preprod.midnight.network/api/v4/graphql';
const INDEXER_WS = 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws';
const hex32 = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const decode32 = (value: string) => Uint8Array.from(value.match(/../g)!, (pair) => Number.parseInt(pair, 16));

type ExistingPrivateRecord = {
  network: 'preprod'; context: string; playerSecret: string; salt: string; rank: string;
};

export function parseExistingPrivateRecord(text: string): ExistingPrivateRecord {
  try {
    if (typeof text !== 'string' || text.length > 65_536) throw new Error();
    const saved = JSON.parse(text) as Record<string, unknown>;
    if (!saved || saved.network !== 'preprod' || !hex32(saved.context) || !hex32(saved.playerSecret) ||
        !hex32(saved.salt) || typeof saved.rank !== 'string' || !/^(?:[1-9]|1[0-3])$/.test(saved.rank)) {
      throw new Error();
    }
    return {
      network: 'preprod', context: saved.context as string, playerSecret: saved.playerSecret as string,
      salt: saved.salt as string, rank: saved.rank,
    };
  } catch {
    throw new Error('Invalid existing private card record');
  }
}

function promptHidden(label: string): Promise<string> {
  return new Promise((resolveInput, rejectInput) => {
    const input = process.stdin;
    let answer = '';
    process.stdout.write(label);
    input.setRawMode(true);
    input.resume();
    input.setEncoding('utf8');
    const done = (error?: Error) => {
      input.off('data', onData);
      input.setRawMode(false);
      input.pause();
      process.stdout.write('\n');
      if (error) rejectInput(error); else resolveInput(answer);
    };
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') { done(); return; }
        if (char === '\u0003' || char === '\u0004') { done(new Error('Export cancelled')); return; }
        if (char === '\u007f' || char === '\b') answer = answer.slice(0, -1);
        else if (char >= ' ' && answer.length < 1024) answer += char;
      }
    };
    input.on('data', onData);
  });
}

export async function exportDemoPackage(): Promise<string> {
  if (!process.stdin.isTTY || !process.stdout.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('An interactive terminal is required');
  }
  if (process.argv.length > 2) throw new Error('Command line arguments are not accepted');
  let receipt: Record<string, unknown>;
  try { receipt = JSON.parse(await readFile(RECEIPT, 'utf8')) as Record<string, unknown>; }
  catch { throw new Error('Invalid public deployment receipt'); }
  if (receipt.network !== 'preprod' || !hex32(receipt.contractAddress) || receipt.indexer !== INDEXER ||
      receipt.status !== 'SucceedEntirely') throw new Error('Invalid public deployment receipt');
  const saved = parseExistingPrivateRecord(await readFile(SOURCE, 'utf8'));
  const contractAddress = receipt.contractAddress as string;
  const context = saved.context as string;
  const playerSecret = saved.playerSecret as string;
  const salt = saved.salt as string;
  const scope: PackageScope = { network: 'preprod', contractAddress, context, round: '1' };
  const state: PrivateState = { secret: decode32(playerSecret), rank: BigInt(saved.rank), salt: decode32(salt) };
  setNetworkId('preprod');
  const provider = indexerPublicDataProvider(INDEXER, INDEXER_WS);
  let indexed;
  try { indexed = await provider.queryContractState(scope.contractAddress); }
  catch { throw new Error('Preprod contract query failed'); }
  if (!indexed) throw new Error('Contract is unavailable on Preprod');
  const publicLedger = decodeLedger(indexed.data);
  validatePackageState({ scope, state }, scope.contractAddress, publicLedger);

  const password = await promptHidden('Package password (at least 16 characters): ');
  const confirmation = await promptHidden('Confirm package password: ');
  if (password.length < 16 || password !== confirmation) throw new Error('Password confirmation failed');
  const encrypted = await encryptPackage(scope, state, password);
  const opened = await decryptPackage(encrypted, password);
  validatePackageState(opened, scope.contractAddress, publicLedger);
  await writeFile(OUTPUT, encrypted, { flag: 'wx', mode: 0o600 });
  try {
    const checked = await decryptPackage(await readFile(OUTPUT, 'utf8'), password);
    validatePackageState(checked, scope.contractAddress, publicLedger);
  } catch {
    await unlink(OUTPUT);
    throw new Error('Saved package verification failed');
  }
  return OUTPUT;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  exportDemoPackage().then(
    (path) => process.stdout.write(`Encrypted demo package saved: ${path}\n`),
    () => { process.stderr.write('Export failed; check the existing record, public contract, and terminal.\n'); process.exitCode = 1; },
  );
}
