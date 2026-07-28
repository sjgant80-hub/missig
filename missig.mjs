// ════════════════════════════════════════════════════════════════
// missig · miss-signature — foldsig's shadow. The signature of a fold that DIDN'T take.
//
// A system that only remembers its successes is blind to its failures — it re-attempts the same doomed
// thing forever (the "confidently wrong, retry anyway" pattern). foldsig records what took; missig records
// what didn't: a rejected/failed attempt, content-addressed, with WHY it missed and how far below the line
// it fell. So the loop learns from failure — it never wastes a cycle re-attempting a fold it already knows
// won't close. It is the negative space made first-class: the record of the not-taken.
//
// Pairs with foldsig (the κ-gate's two outcomes: a stable fold → a foldsig; a runaway → a miss-signature)
// and with si-didy-loop (a rejected build becomes a durable miss, so EXPLORE avoids re-seeding near it).
// Zero dependencies. Deterministic. Never throws.
// ════════════════════════════════════════════════════════════════

export const KAPPA = (Math.sqrt(5) - 1) / 2;                     // 1/φ — the closure threshold
export const REASONS = { BELOW_KAPPA: 'below-κ', RUNAWAY: 'runaway', DRIFTED: 'drifted', MALFORMED: 'malformed' };
const REASON_SET = new Set(Object.values(REASONS));

function canon(v) { try { return v == null ? '' : typeof v === 'string' ? v : JSON.stringify(v); } catch { return String(v); } }

// 128-bit content address (FNV-1a ×4 + fmix), inlined so this file is self-contained.
export function address(s) {
  s = canon(s); let out = '';
  for (const seed of [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35]) {
    let h = seed;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
    out += (h >>> 0).toString(16).padStart(8, '0');
  }
  return out;
}

// A miss-signature: the content-addressed record of an attempt that did not take. `attempt` is whatever was
// tried (a fold-signature, a seed, a descriptor); `reason` says why; `deficit` says how far below the line.
export function miss(attempt, reason = REASONS.BELOW_KAPPA, deficit = 0) {
  const r = REASON_SET.has(reason) ? reason : REASONS.MALFORMED;
  return { attempt, reason: r, deficit: Number.isFinite(deficit) && deficit > 0 ? deficit : 0, hash: address(canon(attempt) + '|' + r) };
}

// Derive a miss from a κ-gate verdict. A stable fold TOOK → no miss (null). An unstable one is a miss whose
// deficit is exactly how far its resolution fell below κ·forge (the closure it never reached).
export function missFromWitness(attempt, witness) {
  if (!witness || witness.stable === true) return null;
  const forge = Number(witness.forge) || 0, resolve = Number(witness.resolve) || 0;
  if (forge <= 0) return miss(attempt, REASONS.MALFORMED, 0);        // generated nothing — malformed
  return miss(attempt, REASONS.BELOW_KAPPA, KAPPA * forge - resolve);
}

// A memory of misses — dedups by content address, and answers "have we missed at/near here before?" so a
// loop can skip known-doomed territory. `near(a, b)` is an optional domain nearness; default is exact attempt.
export class MissMemory {
  constructor({ near } = {}) { this.byHash = new Map(); this.list = []; this._near = typeof near === 'function' ? near : null; }

  record(m) { if (!m || !m.hash) return null; if (!this.byHash.has(m.hash)) { this.byHash.set(m.hash, m); this.list.push(m); } return m; }
  has(m) { return !!(m && this.byHash.has(m.hash)); }               // exact, by content address

  // the shadow tilts its head: is this new attempt in known-doomed territory?
  nearMiss(attempt) {
    if (this._near) return this.list.find((m) => this._near(m.attempt, attempt)) || null;
    const c = canon(attempt);
    return this.list.find((m) => canon(m.attempt) === c) || null;
  }

  reasons() { const c = {}; for (const m of this.list) c[m.reason] = (c[m.reason] || 0) + 1; return c; }
  get size() { return this.list.length; }
}

export default MissMemory;
