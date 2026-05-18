# @topgrid/grid-license

Pro license validation runtime

## Overview

`@topgrid/grid-license` is the runtime license validation module for TOMIS Grid Pro packages.
All Pro packages (`@topgrid/grid-pro-*`) depend on this module to verify a valid license at runtime.

> **Note**: This is an internal package. It is not published to npm separately. You do not need to install it directly — Pro packages include it as a dependency.

## Usage (for Pro package consumers)

Call `setLicenseKey` once at your application entry point (e.g., `main.tsx`) before rendering any Pro grid component:

```tsx
import { setLicenseKey } from '@topgrid/grid-license';

// Call once at app startup
setLicenseKey('YOUR-LICENSE-KEY');
```

Without a valid license key, Pro components will render with a watermark overlay.

## API

| Export | Signature | Description |
|--------|-----------|-------------|
| `setLicenseKey` | `(key: string) => void` | Registers your Pro license key |
| `checkLicense` | `() => LicenseCheckResult` | Validates the registered key (called internally) |
| `Watermark` | React component | Rendered when no valid license is detected |
| `LicenseStatus` | type | `'valid' \| 'invalid' \| 'missing'` |

## Peer Dependencies

| Package | Version |
|---------|---------|
| `react` | `^18.0.0 \|\| ^19.0.0` |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` |

## License

SEE LICENSE IN EULA

Contact [sales@topvel.com](mailto:sales@topvel.com) to obtain a license key.

---

[Documentation](https://grid.tomis.dev) | [Pricing](https://topvel.com/grid/pricing)
