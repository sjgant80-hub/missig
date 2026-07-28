import { test } from 'node:test';
import assert from 'node:assert/strict';
import { miss, missFromWitness, MissMemory, address, REASONS, KAPPA } from './missig.mjs';

test('address is a deterministic 128-bit content hash', () => {
  assert.match(address('x'), /^[0-9a-f]{32}$/);
  assert.equal(address('el niño'), address('el niño'));
  assert.notEqual(address('el niño'), address('el nina'));
});

test('a miss-signature is content-addressed; same attempt+reason → same name', () => {
  const a = miss({ seed: 3 }, REASONS.BELOW_KAPPA, 2);
  const b = miss({ seed: 3 }, REASONS.BELOW_KAPPA, 99);   // deficit differs, identity does not
  assert.equal(a.hash, b.hash, 'the miss identity is attempt + reason, not the deficit');
  assert.notEqual(a.hash, miss({ seed: 4 }, REASONS.BELOW_KAPPA).hash);
  assert.match(a.hash, /^[0-9a-f]{32}$/);
});

test('an unknown reason is recorded as MALFORMED; a negative deficit clamps to 0', () => {
  assert.equal(miss('x', 'nonsense').reason, REASONS.MALFORMED);
  assert.equal(miss('x', REASONS.BELOW_KAPPA, -5).deficit, 0);
  assert.equal(miss('x', REASONS.BELOW_KAPPA, 3).deficit, 3);
});

test('missFromWitness: a stable fold is NOT a miss; a runaway is, with its κ-deficit', () => {
  assert.equal(missFromWitness('s', { stable: true, forge: 10, resolve: 8 }), null, 'it took — no miss');
  const m = missFromWitness('r', { stable: false, forge: 10, resolve: 1 });
  assert.equal(m.reason, REASONS.BELOW_KAPPA);
  assert.ok(Math.abs(m.deficit - (KAPPA * 10 - 1)) < 1e-9, 'deficit = how far resolve fell below κ·forge');
  assert.equal(missFromWitness('empty', { stable: false, forge: 0, resolve: 0 }).reason, REASONS.MALFORMED);
});

test('MissMemory dedups by content address — a repeated miss is remembered once', () => {
  const mem = new MissMemory();
  mem.record(miss({ seed: 3 }, REASONS.BELOW_KAPPA));
  mem.record(miss({ seed: 3 }, REASONS.BELOW_KAPPA));   // same identity
  mem.record(miss({ seed: 9 }, REASONS.BELOW_KAPPA));
  assert.equal(mem.size, 2, 'two distinct misses');
  assert.equal(mem.has(miss({ seed: 3 }, REASONS.BELOW_KAPPA)), true);
  assert.equal(mem.record(null), null, 'a non-miss is ignored');
});

test('nearMiss finds known-doomed territory — injected nearness, and exact fallback', () => {
  const fuzzy = new MissMemory({ near: (a, b) => Math.abs(a - b) <= 1 });
  fuzzy.record(miss(10, REASONS.BELOW_KAPPA));
  assert.ok(fuzzy.nearMiss(11), 'within the nearness band → a near-miss');
  assert.equal(fuzzy.nearMiss(50), null, 'far away → clear');
  const exact = new MissMemory();
  exact.record(miss({ seed: 3 }));
  assert.ok(exact.nearMiss({ seed: 3 }), 'exact fallback matches the same attempt');
  assert.equal(exact.nearMiss({ seed: 4 }), null);
});

test('reasons() tallies why the misses happened', () => {
  const mem = new MissMemory();
  mem.record(miss('a', REASONS.BELOW_KAPPA));
  mem.record(miss('b', REASONS.BELOW_KAPPA));
  mem.record(miss('c', REASONS.MALFORMED));
  assert.deepEqual(mem.reasons(), { 'below-κ': 2, malformed: 1 });
});

test('KAPPA is 1/φ', () => { assert.ok(Math.abs(KAPPA - 0.6180339887) < 1e-9); });
