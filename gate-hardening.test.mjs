// gate-hardening.test.mjs — pins the content address exactly: the same input must name the
// same 128-bit address in every session (kills the FNV loop-bound mutant: one extra
// charCodeAt(len) reads NaN and poisons every hash after it).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { address } from './missig.mjs';

test('ADDRESS — the exact 128-bit name, pinned forever', () => {
  assert.equal(address('konomi'), 'd4b0354d21b1610baff26bb8a3d6d289');
});
