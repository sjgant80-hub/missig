// ════════════════════════════════════════════════════════════════
// The gate — does remembering misses earn its place? A miss-signature only matters if a loop that CONSULTS
// its misses wastes fewer cycles than one that doesn't. We run the same attempt stream two ways over a forge
// where some regions are doomed (never close), and count wasted cycles (rejections). The learner should
// re-attempt each doomed region at most once, then skip it forever.
// Run:  node examples/learn.mjs
// ════════════════════════════════════════════════════════════════

import { MissMemory, missFromWitness, KAPPA } from '../missig.mjs';

// a toy forge: seed → a fold with a forge/resolve. Seeds ≡ 3 (mod 7) never resolve — doomed territory.
function attemptFold(seed) {
  const forge = 6 + (seed % 5);
  const resolve = (seed % 7 === 3) ? 1 : 5 + (seed % 3);
  return { forge, resolve, stable: resolve >= KAPPA * forge };
}

// a deterministic stream that REVISITS regions (so learning can pay off) — cycles through 0..20
const stream = Array.from({ length: 300 }, (_, i) => (i * 3) % 21);
const doomed = [...new Set(stream)].filter((s) => !attemptFold(s).stable);

// 1 · naive loop — attempts everything, re-fails every doomed seed every time it comes round
let naiveWasted = 0, naiveStored = 0;
for (const seed of stream) { attemptFold(seed).stable ? naiveStored++ : naiveWasted++; }

// 2 · learning loop — consults miss-memory; a seed in known-doomed territory is skipped, not re-attempted
const mem = new MissMemory({ near: (a, b) => a === b });
let learnWasted = 0, learnStored = 0, skipped = 0;
for (const seed of stream) {
  if (mem.nearMiss(seed)) { skipped++; continue; }            // the shadow — already known to miss here
  const w = attemptFold(seed);
  if (w.stable) learnStored++;
  else { learnWasted++; mem.record(missFromWitness(seed, w)); }
}

console.log('missig · LEARN-FROM-MISSES GATE\n');
console.log(`  stream: ${stream.length} attempts · ${doomed.length} doomed regions (${doomed.join(', ')})\n`);
console.log(`  naive    : wasted ${naiveWasted} cycles re-attempting doomed folds · stored ${naiveStored}`);
console.log(`  learning : wasted ${learnWasted} cycles · skipped ${skipped} (avoided) · stored ${learnStored} · misses remembered ${mem.size}`);
console.log(`             reasons: ${JSON.stringify(mem.reasons())}`);
console.log('');
const pass = learnWasted < naiveWasted && learnStored === naiveStored && learnWasted <= doomed.length;
console.log(pass
  ? `✓ PASS — remembering misses earns its place: the learner wasted ${learnWasted} cycles vs the naive ${naiveWasted}\n` +
    `  (each doomed region re-attempted at most once, then skipped), and stored exactly the same ${learnStored} good\n` +
    `  folds. The estate now learns from failure, not just success — the shadow tilts its head, and it listens.`
  : `✗ the learner did not beat the naive loop — miss-memory is not paying off; check the nearness/record path.`);
