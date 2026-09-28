import { Phase, pureCircuits, type Ledger } from '../../managed/cat-bluff/contract/index.js';
import { assertPrivateState, type PrivateState } from './private-state.ts';

export type PackageScope = { network: 'preprod'; contractAddress: string; context: string; round: '1' };
export type OpenedPackage = { scope: PackageScope; state: PrivateState };
const FORMAT = 'cat-bluff-demo-private-state';
const VERSION = 1;
const ITERATIONS = 600_000;
const MAX_INPUT = 65_536;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const hex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
const fromHex = (value: string) => Uint8Array.from(value.match(/../g)!, (pair) => Number.parseInt(pair, 16));
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

function validScope(value: unknown): asserts value is PackageScope {
  const s = value as PackageScope;
  if (!s || s.network !== 'preprod' || typeof s.contractAddress !== 'string' ||
      !s.contractAddress || s.contractAddress.length > 256 || !/^[0-9a-f]{64}$/i.test(s.context) || s.round !== '1') {
    throw new Error('Invalid package scope');
  }
}
function validPassword(value: string): void {
  if (typeof value !== 'string' || value.length < 16) throw new Error('Invalid package password');
}
async function key(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: ITERATIONS },
    material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
}
function aad(scope: PackageScope): Uint8Array {
  return encoder.encode(JSON.stringify({ format: FORMAT, version: VERSION, scope }));
}

export async function encryptPackage(scope: PackageScope, state: PrivateState, password: string): Promise<string> {
  validScope(scope); assertPrivateState(state); validPassword(password);
  const plaintext = encoder.encode(JSON.stringify({ secret: hex(state.secret), rank: state.rank.toString(), salt: hex(state.salt) }));
  if (plaintext.length > MAX_INPUT) throw new Error('Package input too large');
  const kdfSalt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad(scope) as BufferSource }, await key(password, kdfSalt), plaintext,
  ));
  return JSON.stringify({ format: FORMAT, version: VERSION, scope, kdf: 'PBKDF2-SHA256', iterations: ITERATIONS,
    cipher: 'AES-256-GCM', kdfSalt: b64(kdfSalt), iv: b64(iv), ciphertext: b64(ciphertext) });
}

export async function decryptPackage(text: string, password: string): Promise<OpenedPackage> {
  validPassword(password);
  if (typeof text !== 'string' || encoder.encode(text).length > MAX_INPUT) throw new Error('Invalid package');
  try {
    const p = JSON.parse(text);
    if (!p || p.format !== FORMAT || p.version !== VERSION || p.kdf !== 'PBKDF2-SHA256' ||
        p.iterations !== ITERATIONS || p.cipher !== 'AES-256-GCM') throw new Error();
    validScope(p.scope);
    if (typeof p.kdfSalt !== 'string' || typeof p.iv !== 'string' || typeof p.ciphertext !== 'string') throw new Error();
    const kdfSalt = fromB64(p.kdfSalt), iv = fromB64(p.iv), ciphertext = fromB64(p.ciphertext);
    if (kdfSalt.length !== 16 || iv.length !== 12 || ciphertext.length < 16 || ciphertext.length > MAX_INPUT) throw new Error();
    const clear = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: aad(p.scope) as BufferSource }, await key(password, kdfSalt), ciphertext,
    );
    const decoded = JSON.parse(decoder.decode(clear));
    if (!decoded || !/^[0-9a-f]{64}$/.test(decoded.secret) ||
        !/^[0-9a-f]{64}$/.test(decoded.salt) || !/^(?:[1-9]|1[0-3])$/.test(decoded.rank)) throw new Error();
    const state = { secret: fromHex(decoded.secret), rank: BigInt(decoded.rank), salt: fromHex(decoded.salt) };
    assertPrivateState(state);
    return { scope: p.scope, state };
  } catch {
    throw new Error('Package could not be opened');
  }
}

const equal = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);
export function validatePackageState(opened: OpenedPackage, contractAddress: string, ledger: Ledger): void {
  validScope(opened.scope); assertPrivateState(opened.state);
  if (opened.scope.contractAddress !== contractAddress || opened.scope.context.toLowerCase() !== hex(ledger.gameContext) ||
      ledger.round !== 1n || ledger.phase < Phase.Empty || ledger.phase > Phase.Resolved) {
    throw new Error('Package does not match contract');
  }
  const player = pureCircuits.deriveRole(ledger.gameContext, 1n, opened.state.secret);
  if (!equal(player, ledger.player)) throw new Error('Package does not match player');
  if (ledger.phase !== Phase.Empty) {
    const commitment = pureCircuits.deriveCard(ledger.gameContext, ledger.round, ledger.player, opened.state.rank, opened.state.salt);
    if (!equal(commitment, ledger.commitment)) throw new Error('Package does not match card');
  }
}
