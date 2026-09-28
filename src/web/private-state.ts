import type { Witnesses } from '../../managed/cat-bluff/contract/index.js';
import type { PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types';

export type PrivateState = { secret: Uint8Array; rank: bigint; salt: Uint8Array };

export const copyPrivateState = (state: PrivateState): PrivateState => ({
  secret: new Uint8Array(state.secret), rank: state.rank, salt: new Uint8Array(state.salt),
});

export function assertPrivateState(state: PrivateState): void {
  if (!(state?.secret instanceof Uint8Array) || state.secret.length !== 32 ||
      !(state.salt instanceof Uint8Array) || state.salt.length !== 32 ||
      typeof state.rank !== 'bigint' || state.rank < 1n || state.rank > 13n) {
    throw new Error('Invalid private card state');
  }
}

export const playerWitnesses: Witnesses<PrivateState> = {
  secret: ({ privateState }) => [privateState, new Uint8Array(privateState.secret)],
  rank: ({ privateState }) => [privateState, privateState.rank],
  salt: ({ privateState }) => [privateState, new Uint8Array(privateState.salt)],
};

export type MemoryPrivateStateProvider = PrivateStateProvider<string, PrivateState>;

export function createMemoryPrivateStateProvider(initial: PrivateState, scope: string): {
  provider: MemoryPrivateStateProvider; dispose(): void;
} {
  assertPrivateState(initial);
  if (!scope) throw new Error('Invalid private state scope');
  const states = new Map<string, PrivateState>([['cat-bluff', copyPrivateState(initial)]]);
  const signingKeys = new Map<string, string>();
  let disposed = false;
  const guard = () => { if (disposed) throw new Error('Private state provider disposed'); };
  const wipe = (value: PrivateState | undefined) => {
    if (value) { value.secret.fill(0); value.salt.fill(0); value.rank = 0n; }
  };
  const provider: MemoryPrivateStateProvider = {
    setContractAddress(address) {
      guard();
      if (address !== scope) throw new Error('Private state scope mismatch');
    },
    async get(id) { guard(); return states.has(id) ? copyPrivateState(states.get(id)!) : null; },
    async set(id, value) {
      guard(); assertPrivateState(value);
      wipe(states.get(id));
      states.set(id, copyPrivateState(value));
    },
    async remove(id) { guard(); wipe(states.get(id)); states.delete(id); },
    async clear() {
      guard();
      for (const value of states.values()) wipe(value);
      states.clear();
    },
    async setSigningKey(address, signingKey) {
      guard();
      if (address !== scope) throw new Error('Private state scope mismatch');
      signingKeys.set(address, signingKey);
    },
    async getSigningKey(address) { guard(); return signingKeys.get(address) ?? null; },
    async removeSigningKey(address) { guard(); signingKeys.delete(address); },
    async clearSigningKeys() { guard(); signingKeys.clear(); },
    async exportPrivateStates() { guard(); throw new Error('Private state export unsupported'); },
    async importPrivateStates() { guard(); throw new Error('Private state import unsupported'); },
    async exportSigningKeys() { guard(); throw new Error('Signing key export unsupported'); },
    async importSigningKeys() { guard(); throw new Error('Signing key import unsupported'); },
  };
  return {
    provider,
    dispose() {
      if (disposed) return;
      for (const value of states.values()) wipe(value);
      states.clear();
      signingKeys.clear();
      disposed = true;
    },
  };
}
