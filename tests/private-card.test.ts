import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshCard } from '../src/witnesses.ts';

test('fresh private cards cover valid ranks with independent unpredictable salts', () => {
  const cards = Array.from({ length: 64 }, () => freshCard());
  for (const card of cards) {
    assert.ok(card.rank >= 1n && card.rank <= 13n);
    assert.equal(card.salt.length, 32);
  }
  // The all-equal probability for uniform ranks is 13^-63; this detects a
  // deterministic demo default without asserting a particular secret value.
  assert.ok(new Set(cards.map(card => card.rank)).size > 1);
  assert.equal(new Set(cards.map(card => Buffer.from(card.salt).toString('hex'))).size, cards.length);
});
