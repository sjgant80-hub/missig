# missig

Miss-signature — foldsig's shadow. Records a fold that did NOT take (a rejected attempt), content-addressed with why it missed, so a loop learns from failure and never re-attempts a known-doomed fold.

## What it is

missig is a deterministic, zero-dependency estate tool. Miss-signature — foldsig's shadow. Records a fold that did NOT take (a rejected attempt), content-addressed with why it missed, so a loop learns from failure and never re-attempts a known-doomed fold. It never throws on hostile input and
produces the same result on every machine.

## API

- `MissMemory`
- `address`
- `default`
- `miss`
- `missFromWitness`

## Verify

```bash
npm test
```

Every source line is guarded by a test (mutation-checked with witness). Structure and behaviour are gated by
konomify before this build joins the mesh.

## License

MIT © 2026 sjgant80-hub
