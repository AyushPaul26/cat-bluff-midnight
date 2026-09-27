import type { Witnesses } from '../managed/cat-bluff/contract/index.js';
import { randomBytes } from 'node:crypto';

export type PrivateState = { secret: Uint8Array; rank: bigint; salt: Uint8Array };
export const freshSecret = (): Uint8Array => new Uint8Array(randomBytes(32));
export const witnesses: Witnesses<PrivateState> = {
  secret: ({ privateState }) => [privateState, privateState.secret],
  rank: ({ privateState }) => [privateState, privateState.rank],
  salt: ({ privateState }) => [privateState, privateState.salt],
};
