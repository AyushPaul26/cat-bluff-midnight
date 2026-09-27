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

function challenged(actual = 7n, claim = 12n) {
  const g = game(actual);
  g.call('commit', claim);
  g.private({ secret: g.challengerSecret });
  g.call('challenge');
  g.private({ secret: g.playerSecret });
  return g;
}

test('authorized challenge and resolution reveal only rank and detect a bluff', () => {
  const g = challenged();
  assert.equal(g.state().phase, 2);
  assert.equal(g.state().revealedRank, 0n);
  assert.deepEqual(g.call('resolve'), []);
  assert.equal(g.state().phase, 3);
  assert.equal(g.state().revealedRank, 7n);
  assert.equal(g.state().truthful, false);
  for (const v of Object.values(g.state())) for (const hidden of [g.salt, g.playerSecret, g.challengerSecret]) assert.notDeepEqual(v, hidden);
});

test('truthful claim resolves as truthful', () => {
  const g = challenged(13n, 13n);
  g.call('resolve');
  assert.equal(g.state().truthful, true);
});

test('player cannot act as challenger', () => {
  const g = game(); g.call('commit', 7n);
  const before = g.state();
  assert.throws(() => g.call('challenge'), /challenger authorization/);
  assert.deepEqual(g.state(), before);
});

test('challenger cannot resolve with its capability', () => {
  const g = challenged(); g.private({ secret: g.challengerSecret });
  assert.throws(() => g.call('resolve'), /player authorization/);
});

for (const altered of ['rank', 'salt'] as const) {
  test(`wrong ${altered} opening rejects and leaves state unchanged`, () => {
    const g = challenged(); const before = g.state();
    g.private(altered === 'rank' ? { rank: 8n } : { salt: bytes() });
    assert.throws(() => g.call('resolve'), /opening mismatch/);
    assert.deepEqual(g.state(), before);
  });
}

test('rejects every out-of-phase or replayed action', () => {
  const g = game();
  assert.throws(() => g.call('challenge'), /phase/);
  assert.throws(() => g.call('resolve'), /phase/);
  g.call('commit', 7n);
  assert.throws(() => g.call('resolve'), /phase/);
  g.private({ secret: g.challengerSecret }); g.call('challenge');
  assert.throws(() => g.call('challenge'), /phase/);
  assert.throws(() => g.call('commit', 7n), /phase/);
  g.private({ secret: g.playerSecret }); g.call('resolve');
  for (const action of ['commit', 'challenge', 'resolve']) assert.throws(() => g.call(action, ...(action === 'commit' ? [7n] : [])), /phase/);
});

test('commitments bind context, role, round, player, rank and salt', () => {
  const g = game();
  assert.notDeepEqual(pureCircuits.deriveRole(g.context, 2n, g.playerSecret), g.player);
  assert.notDeepEqual(pureCircuits.deriveRole(bytes(), 1n, g.playerSecret), g.player);
  const card = pureCircuits.deriveCard(g.context, 1n, g.player, 7n, g.salt);
  const variants: Parameters<typeof pureCircuits.deriveCard>[] = [
    [bytes(), 1n, g.player, 7n, g.salt], [g.context, 2n, g.player, 7n, g.salt],
    [g.context, 1n, g.challenger, 7n, g.salt], [g.context, 1n, g.player, 8n, g.salt],
    [g.context, 1n, g.player, 7n, bytes()],
  ];
  for (const values of variants) assert.notDeepEqual(pureCircuits.deriveCard(...values), card);
});
