import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum Phase { Empty = 0, Committed = 1, Challenged = 2, Resolved = 3 }

export type Witnesses<PS> = {
  secret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  rank(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  salt(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  commit(context: __compactRuntime.CircuitContext<PS>, claim_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  commit(context: __compactRuntime.CircuitContext<PS>, claim_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  deriveRole(context_0: Uint8Array, role_0: bigint, key_0: Uint8Array): Uint8Array;
  deriveCard(context_0: Uint8Array,
             roundId_0: bigint,
             owner_0: Uint8Array,
             card_0: bigint,
             opening_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  deriveRole(context: __compactRuntime.CircuitContext<PS>,
             context_0: Uint8Array,
             role_0: bigint,
             key_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  deriveCard(context: __compactRuntime.CircuitContext<PS>,
             context_0: Uint8Array,
             roundId_0: bigint,
             owner_0: Uint8Array,
             card_0: bigint,
             opening_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  commit(context: __compactRuntime.CircuitContext<PS>, claim_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly gameContext: Uint8Array;
  readonly round: bigint;
  readonly phase: Phase;
  readonly player: Uint8Array;
  readonly challenger: Uint8Array;
  readonly commitment: Uint8Array;
  readonly claimedRank: bigint;
  readonly revealedRank: bigint;
  readonly truthful: boolean;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               context_0: Uint8Array,
               playerRole_0: Uint8Array,
               challengerRole_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
