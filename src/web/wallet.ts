import type { ConnectedAPI, InitialAPI, Configuration } from '@midnight-ntwrk/dapp-connector-api';
import { satisfies } from 'semver';

export type WalletChoice = { id: string; name: string; apiVersion: string; api: InitialAPI; compatible: boolean };
export type WalletSnapshot =
  | { status: 'disconnected' }
  | { status: 'connecting'; name: string }
  | { status: 'connected'; name: string; address: string }
  | { status: 'error'; reason: string };
export type WalletCapture = {
  api: ConnectedAPI; address: string; coinPublicKey: string; encryptionPublicKey: string;
  configuration: Configuration; guard: () => Promise<void>; isCurrent: () => boolean;
};

const REQUIRED_METHODS = [
  'getShieldedBalances', 'getUnshieldedBalances', 'getDustBalance', 'getShieldedAddresses',
  'getUnshieldedAddress', 'getDustAddress', 'getTxHistory', 'balanceUnsealedTransaction',
  'balanceSealedTransaction', 'makeTransfer', 'makeIntent', 'signData', 'submitTransaction',
  'getProvingProvider', 'getConfiguration', 'getConnectionStatus', 'hintUsage',
] as const satisfies ReadonlyArray<keyof ConnectedAPI>;
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
function initialApi(value: unknown): value is InitialAPI {
  return record(value) && nonempty(value.rdns) && nonempty(value.name) && typeof value.icon === 'string'
    && nonempty(value.apiVersion) && typeof value.connect === 'function';
}
function connectedApi(value: unknown): value is ConnectedAPI {
  return record(value) && REQUIRED_METHODS.every(method => typeof value[method] === 'function');
}
function supported(version: string): boolean {
  return satisfies(version, '>=4.0.1 <5.0.0', { includePrerelease: false });
}
export function discoverWallets(injected: unknown): WalletChoice[] {
  if (!record(injected)) return [];
  const choices: WalletChoice[] = [];
  for (const [id, candidate] of Object.entries(injected)) {
    if (!initialApi(candidate)) continue;
    choices.push({ id, name: candidate.name, apiVersion: candidate.apiVersion, api: candidate, compatible: supported(candidate.apiVersion) });
  }
  return choices;
}

type Identity = Awaited<ReturnType<ConnectedAPI['getShieldedAddresses']>>;
type Connection = { api: ConnectedAPI; name: string; identity: Identity; configuration: Configuration };
function validIdentity(value: unknown): value is Identity {
  return record(value) && nonempty(value.shieldedAddress)
    && nonempty(value.shieldedCoinPublicKey) && nonempty(value.shieldedEncryptionPublicKey);
}
function validConfiguration(value: unknown): value is Configuration {
  return record(value) && value.networkId === 'preprod' && nonempty(value.indexerUri)
    && nonempty(value.indexerWsUri) && nonempty(value.substrateNodeUri)
    && (value.proverServerUri === undefined || nonempty(value.proverServerUri));
}
function sameConfiguration(left: Configuration, right: Configuration): boolean {
  return left.networkId === right.networkId && left.indexerUri === right.indexerUri
    && left.indexerWsUri === right.indexerWsUri && left.substrateNodeUri === right.substrateNodeUri
    && left.proverServerUri === right.proverServerUri;
}
function sameIdentity(left: Identity, right: Identity): boolean {
  return left.shieldedAddress === right.shieldedAddress
    && left.shieldedCoinPublicKey === right.shieldedCoinPublicKey
    && left.shieldedEncryptionPublicKey === right.shieldedEncryptionPublicKey;
}
function reasonFor(error: unknown): string {
  if (error instanceof Error && error.message === 'Unsupported wallet API') return 'Unsupported wallet API';
  if (error instanceof Error && error.message === 'Wallet network changed') return 'Wallet network changed';
  if (error instanceof Error && error.message === 'Wallet account or configuration changed') return 'Wallet account or configuration changed';
  if (error instanceof Error && error.message === 'Wallet connection lost') return 'Wallet connection lost';
  return 'Wallet connection failed';
}

export class WalletSession {
  private state: WalletSnapshot = { status: 'disconnected' };
  private current?: Connection;
  private generation = 0;
  private validation = 0;
  private pending?: Promise<void>;
  private readonly onChange?: (snapshot: WalletSnapshot) => void;
  constructor(onChange?: (snapshot: WalletSnapshot) => void) { this.onChange = onChange; }
  get snapshot(): WalletSnapshot { return { ...this.state }; }
  private publish(state: WalletSnapshot): void {
    this.state = state;
    this.onChange?.(this.snapshot);
  }
  connect(choice: WalletChoice): Promise<void> {
    if (this.pending) return this.pending;
    this.current = undefined;
    const generation = ++this.generation;
    ++this.validation;
    if (!choice.compatible || !initialApi(choice.api) || !supported(choice.api.apiVersion)) {
      this.publish({ status: 'error', reason: 'Unsupported wallet API' });
      return Promise.resolve();
    }
    this.publish({ status: 'connecting', name: choice.name });
    const pending = this.establish(choice, generation);
    this.pending = pending;
    void pending.finally(() => { if (this.pending === pending) this.pending = undefined; });
    return pending;
  }
  private async establish(choice: WalletChoice, generation: number): Promise<void> {
    try {
      const api: unknown = await choice.api.connect('preprod');
      if (generation !== this.generation) return;
      if (!connectedApi(api)) throw new Error('Unsupported wallet API');
      const status = await api.getConnectionStatus();
      if (generation !== this.generation) return;
      if (status.status !== 'connected') throw new Error('Wallet connection lost');
      if (status.networkId !== 'preprod') throw new Error('Wallet network changed');
      const configuration = await api.getConfiguration();
      if (generation !== this.generation) return;
      if (!validConfiguration(configuration)) throw new Error('Wallet network changed');
      const identity = await api.getShieldedAddresses();
      if (generation !== this.generation) return;
      if (!validIdentity(identity)) throw new Error('Wallet connection failed');
      this.current = { api, name: choice.name, configuration, identity };
      this.publish({ status: 'connected', name: choice.name, address: identity.shieldedAddress });
    } catch (error) {
      if (generation !== this.generation) return;
      this.current = undefined;
      this.publish({ status: 'error', reason: reasonFor(error) });
    }
  }
  disconnect(): void {
    ++this.generation;
    ++this.validation;
    this.current = undefined;
    this.pending = undefined;
    this.publish({ status: 'disconnected' });
  }
  async revalidate(): Promise<void> {
    const connection = this.current;
    if (!connection) return;
    const generation = this.generation;
    const validation = ++this.validation;
    try {
      const status = await connection.api.getConnectionStatus();
      if (generation !== this.generation || validation !== this.validation) return;
      if (status.status !== 'connected') throw new Error('Wallet connection lost');
      if (status.networkId !== 'preprod') throw new Error('Wallet network changed');
      const configuration = await connection.api.getConfiguration();
      if (generation !== this.generation || validation !== this.validation) return;
      if (!validConfiguration(configuration)) throw new Error('Wallet network changed');
      if (!sameConfiguration(connection.configuration, configuration)) throw new Error('Wallet account or configuration changed');
      const identity = await connection.api.getShieldedAddresses();
      if (generation !== this.generation || validation !== this.validation) return;
      if (!validIdentity(identity) || !sameIdentity(connection.identity, identity)) throw new Error('Wallet account or configuration changed');
    } catch (error) {
      if (generation !== this.generation || validation !== this.validation) return;
      ++this.generation;
      this.current = undefined;
      this.publish({ status: 'error', reason: reasonFor(error) });
    }
  }
  capture(): WalletCapture {
    const connection = this.current;
    if (!connection) throw new Error('Wallet is not connected');
    const generation = this.generation;
    const isCurrent = () => this.generation === generation && this.current === connection;
    return {
      api: connection.api,
      address: connection.identity.shieldedAddress,
      coinPublicKey: connection.identity.shieldedCoinPublicKey,
      encryptionPublicKey: connection.identity.shieldedEncryptionPublicKey,
      configuration: { ...connection.configuration },
      isCurrent,
      guard: async () => {
        if (!isCurrent()) throw new Error('Wallet session changed');
        const previousValidation = this.validation;
        await this.revalidate();
        if (!isCurrent() || this.validation !== previousValidation + 1) throw new Error('Wallet session changed');
      },
    };
  }
}
