import type { WalletConnectedAPI, InitialAPI, Configuration } from '@midnight-ntwrk/dapp-connector-api';
import { MidnightBech32m, UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { satisfies } from 'semver';

export type WalletChoice = { id: string; name: string; apiVersion: string; api: InitialAPI; compatible: boolean };
type DiagnosticStage = 'connect.authorize' | 'connect.api' | 'connect.status' | 'connect.configuration' | 'connect.address'
  | 'revalidate.status' | 'revalidate.configuration' | 'revalidate.address';
const CONNECTOR_ERROR_CODES = ['InternalError', 'Rejected', 'InvalidRequest', 'PermissionRejected', 'Disconnected'] as const;
type WalletDiagnostic = `${DiagnosticStage}/${typeof CONNECTOR_ERROR_CODES[number] | 'Unknown'}`;
export type WalletSnapshot =
  | { status: 'disconnected' }
  | { status: 'connecting'; name: string }
  | { status: 'connected'; name: string; address: string }
  | { status: 'error'; reason: string; diagnostic?: WalletDiagnostic };
export type WalletCapture = {
  api: WalletConnectedAPI; address: string; coinPublicKey: string; encryptionPublicKey: string;
  configuration: Configuration; guard: () => Promise<void>; isCurrent: () => boolean;
};

// Validate the wallet operations, not the unused HintUsage extension. Lace 2.4
// does not register hintUsage in its remote transport, so connect returns it
// as undefined. The other methods and all session/network guards remain required.
const REQUIRED_METHODS = [
  'getShieldedBalances', 'getUnshieldedBalances', 'getDustBalance', 'getShieldedAddresses',
  'getUnshieldedAddress', 'getDustAddress', 'getTxHistory', 'balanceUnsealedTransaction',
  'balanceSealedTransaction', 'makeTransfer', 'makeIntent', 'signData', 'submitTransaction',
  'getProvingProvider', 'getConfiguration', 'getConnectionStatus',
] as const satisfies ReadonlyArray<keyof WalletConnectedAPI>;
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
function connectedApi(value: unknown): value is WalletConnectedAPI {
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

type Identity = Awaited<ReturnType<WalletConnectedAPI['getShieldedAddresses']>>;
type Connection = { api: WalletConnectedAPI; name: string; identity: Identity; configuration: Configuration };
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
  try {
    if (error instanceof Error && error.message === 'Unsupported wallet API') return 'Unsupported wallet API';
    if (error instanceof Error && error.message === 'Wallet network changed') return 'Wallet network changed';
    if (error instanceof Error && error.message === 'Wallet account or configuration changed') return 'Wallet account or configuration changed';
    if (error instanceof Error && error.message === 'Wallet connection lost') return 'Wallet connection lost';
  } catch { /* A wallet error can have untrusted property getters. */ }
  return 'Wallet connection failed';
}
function diagnosticFor(stage: DiagnosticStage, error: unknown): WalletDiagnostic {
  // Only fixed operation names and the API 4.0.1 code allowlist may leave this
  // boundary. Never render, log or persist a wallet error's free-form fields.
  try {
    if (record(error) && error.type === 'DAppConnectorAPIError') {
      const code = error.code;
      const allowed = CONNECTOR_ERROR_CODES.find(candidate => candidate === code);
      if (allowed) return `${stage}/${allowed}`;
    }
  } catch { /* Ignore untrusted property getters as well as unknown codes. */ }
  return `${stage}/Unknown`;
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
      this.publish({ status: 'error', reason: 'Unsupported wallet API', diagnostic: 'connect.api/Unknown' });
      return Promise.resolve();
    }
    this.publish({ status: 'connecting', name: choice.name });
    const pending = this.establish(choice, generation);
    this.pending = pending;
    void pending.finally(() => { if (this.pending === pending) this.pending = undefined; });
    return pending;
  }
  private async establish(choice: WalletChoice, generation: number): Promise<void> {
    let stage: DiagnosticStage = 'connect.authorize';
    try {
      const api: unknown = await choice.api.connect('preprod');
      if (generation !== this.generation) return;
      stage = 'connect.api';
      if (!connectedApi(api)) throw new Error('Unsupported wallet API');
      stage = 'connect.status';
      const status = await api.getConnectionStatus();
      if (generation !== this.generation) return;
      if (status.status !== 'connected') throw new Error('Wallet connection lost');
      if (status.networkId !== 'preprod') throw new Error('Wallet network changed');
      stage = 'connect.configuration';
      const configuration = await api.getConfiguration();
      if (generation !== this.generation) return;
      if (!validConfiguration(configuration)) throw new Error('Wallet network changed');
      stage = 'connect.address';
      const identity = await api.getShieldedAddresses();
      if (generation !== this.generation) return;
      if (!validIdentity(identity)) throw new Error('Wallet connection failed');
      this.current = { api, name: choice.name, configuration, identity };
      this.publish({ status: 'connected', name: choice.name, address: identity.shieldedAddress });
    } catch (error) {
      if (generation !== this.generation) return;
      this.current = undefined;
      this.publish({ status: 'error', reason: reasonFor(error), diagnostic: diagnosticFor(stage, error) });
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
    let stage: DiagnosticStage = 'revalidate.status';
    try {
      const status = await connection.api.getConnectionStatus();
      if (generation !== this.generation || validation !== this.validation) return;
      if (status.status !== 'connected') throw new Error('Wallet connection lost');
      if (status.networkId !== 'preprod') throw new Error('Wallet network changed');
      stage = 'revalidate.configuration';
      const configuration = await connection.api.getConfiguration();
      if (generation !== this.generation || validation !== this.validation) return;
      if (!validConfiguration(configuration)) throw new Error('Wallet network changed');
      if (!sameConfiguration(connection.configuration, configuration)) throw new Error('Wallet account or configuration changed');
      stage = 'revalidate.address';
      const identity = await connection.api.getShieldedAddresses();
      if (generation !== this.generation || validation !== this.validation) return;
      if (!validIdentity(identity) || !sameIdentity(connection.identity, identity)) throw new Error('Wallet account or configuration changed');
    } catch (error) {
      if (generation !== this.generation || validation !== this.validation) return;
      ++this.generation;
      this.current = undefined;
      this.publish({ status: 'error', reason: reasonFor(error), diagnostic: diagnosticFor(stage, error) });
    }
  }
  async getFaucetAddress(): Promise<string> {
    try {
      const capture = this.capture();
      await capture.guard();
      const { unshieldedAddress } = await capture.api.getUnshieldedAddress();
      await capture.guard();
      UnshieldedAddress.codec.decode('preprod', MidnightBech32m.parse(unshieldedAddress));
      return unshieldedAddress;
    } catch {
      // Wallet and codec errors may include response data. Keep the UI error static.
      throw new Error('Faucet address unavailable. Reconnect Lace on Preprod and try again.');
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
