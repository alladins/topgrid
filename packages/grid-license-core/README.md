# @topgrid/grid-license-core

Framework-neutral license state + verification for TopGrid Pro packages. **No React, no Vue** — this
is the single source of the license-state singleton and the Ed25519 key verification.

- `@topgrid/grid-license` (React) re-exports this and adds the React `Watermark` + hooks.
- Vue (and any non-React) consumers import straight from here — so they inherit no React peers.

```ts
import { setLicenseKey, checkLicense, subscribeLicense } from '@topgrid/grid-license-core';

setLicenseKey(myKey);                  // app entry, once
const { watermarkRequired } = checkLicense();
const unsub = subscribeLicense(() => { /* re-read on change */ });
```

## License

Commercial — see [EULA](./EULA.md).
