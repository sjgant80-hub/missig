# missig — specification

## Purpose

Miss-signature — foldsig's shadow. Records a fold that did NOT take (a rejected attempt), content-addressed with why it missed, so a loop learns from failure and never re-attempts a known-doomed fold.

## Contract

- **MissMemory** — part of the missig public surface; deterministic, total (never throws).
- **address** — part of the missig public surface; deterministic, total (never throws).
- **default** — part of the missig public surface; deterministic, total (never throws).
- **miss** — part of the missig public surface; deterministic, total (never throws).
- **missFromWitness** — part of the missig public surface; deterministic, total (never throws).

## Guarantees

- **Deterministic** — the same input yields the same output on any machine, any run.
- **Total** — hostile or malformed input returns a defined value, never an exception.
- **Zero-dependency** — no third-party runtime code inside the trust boundary.

## Verification

The suite exercises the public surface directly and is mutation-checked: a change to any guarded line makes a
test fail. konomify admits missig only when both the structure rubric (acg-assessor) and the behaviour gate
(witness) pass.
