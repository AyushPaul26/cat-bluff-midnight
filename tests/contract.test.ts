import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { Contract, ledger, pureCircuits } from '../managed/cat-bluff/contract/index.js';
import { createConstructorContext, QueryContext, sampleContractAddress, CostModel } from '@midnight-ntwrk/compact-runtime';

const bytes = () => new Uint8Array(randomBytes(32));

function game(actualRank = 7n) {
  const context = bytes(), playerSecret = bytes(), challengerSecret = bytes(), salt = bytes();
  const player = pureCircuits.deriveRole(context, 1n, playerSecret);
  const challenger = pureCircuits.deriveRole(context, 2n, challengerSecret);
  const contract = new Contract({
    secret: ({ privateState }: any) => [privateState, privateState.secret],
    rank: ({ privateState }: any) => [privateState, privateState.rank],
    salt: ({ privateState }: any) => [privateState, privateState.salt],
  });
  const initial = contract.initialState(createConstructorContext({ secret: playerSecret, rank: actualRank, salt }, '0'.repeat(64)), context, player, challenger);
  let ctx: any = {
    currentPrivateState: initial.currentPrivateState,
    currentZswapLocalState: initial.currentZswapLocalState,
    currentQueryContext: new QueryContext(initial.currentContractState.data, sampleContractAddress()),
    costModel: CostModel.initialCostModel(),
  };
  return {
    context, player, challenger, playerSecret, challengerSecret, salt,
    state: () => ledger(ctx.currentQueryContext.state),
    private: (changes: Record<string, unknown>) => { ctx.currentPrivateState = { ...ctx.currentPrivateState, ...changes }; },
    call: (name: string, ...args: any[]) => {
      const result = (contract.impureCircuits as any)[name](ctx, ...args);
      ctx = result.context;
      return result.result;
    },
  };
}

test('initial public state is Empty with no card disclosure', () => {
  const g = game();
  assert.equal(g.state().phase, 0);
  assert.equal(g.state().round, 1n);
  assert.equal(g.state().claimedRank, 0n);
  assert.equal(g.state().revealedRank, 0n);
  assert.deepEqual(g.state().commitment, new Uint8Array(32));
});

test('player commits a private valid rank while publicly bluffing', () => {
  const g = game(7n);
  assert.deepEqual(g.call('commit', 12n), []);
  const s = g.state();
  assert.equal(s.phase, 1);
  assert.equal(s.claimedRank, 12n);
  assert.equal(s.revealedRank, 0n);
  assert.deepEqual(s.commitment, pureCircuits.deriveCard(g.context, 1n, g.player, 7n, g.salt));
  assert.deepEqual(Object.keys(s).sort(), ['gameContext', 'round', 'phase', 'player', 'challenger', 'commitment', 'claimedRank', 'revealedRank', 'truthful'].sort());
  for (const value of Object.values(s)) {
    for (const hidden of [g.salt, g.playerSecret, g.challengerSecret]) assert.notDeepEqual(value, hidden);
  }
});

test('incorrect player capability rejects without changing ledger', () => {
  const g = game();
  const before = g.state();
  g.private({ secret: bytes() });
  assert.throws(() => g.call('commit', 7n), /player authorization/);
  assert.deepEqual(g.state(), before);
});

for (const rank of [0n, 14n]) {
  test(`rejects hidden rank ${rank}`, () => assert.throws(() => game(rank).call('commit', 7n), /rank out of range/));
  test(`rejects public claim ${rank}`, () => assert.throws(() => game().call('commit', rank), /claim out of range/));
}

test('a second commitment is rejected and cannot replace the first', () => {
  const g = game();
  g.call('commit', 7n);
  const before = g.state();
  assert.throws(() => g.call('commit', 8n), /phase/);
  assert.deepEqual(g.state(), before);
});
