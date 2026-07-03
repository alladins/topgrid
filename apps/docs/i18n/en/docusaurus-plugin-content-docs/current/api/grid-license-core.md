---
title: "@topgrid/grid-license-core"
sidebar_label: "grid-license-core"
sidebar_position: 11
---

# @topgrid/grid-license-core

> Framework-neutral license state + verification for TopGrid (no React/Vue). Source of the license singleton. · **Commercial (EULA)**

:::info Auto-generated
This page is auto-generated from TSDoc comments in the source code (internal markers scrubbed). For a curated getting-started summary, see the [API Reference](../api-reference).
:::

**10** public exports — 6 functions · 0 hooks · 0 components · 4 types · 0 constants.

## Functions

### `checkLicense`

Synchronously checks the current license state and returns a `LicenseCheckResult`.

- If valid=false, then `watermarkRequired=true`.
- If valid and less than 60 days remain until `expiresAt`, then `expiryWarning='soon-expiring'` + `console.warn` (once).
- If valid and there is ample margin before expiry, `{ valid: true, watermarkRequired: false }`.

```ts
checkLicense(): LicenseCheckResult
```

### `getCachedCheck`

Returns a cached `LicenseCheckResult` — computes via `compute` only on
the first call after a state change. Subsequent calls return the same
reference until `setLicenseState` invalidates the cache.

Used by `useLicenseStatus` (via `useSyncExternalStore`) to satisfy React's
snapshot-stability requirement.

```ts
getCachedCheck(compute: (…) => …): LicenseCheckResult
```

### `getLicenseState`

```ts
getLicenseState(): LicenseStatus
```

### `setLicenseKey`

The global license registration API for Pro packages.
Call once from the app entry (main.tsx / App.tsx).

```ts
setLicenseKey(key: string): LicenseStatus
```

| Parameter | Type | Description |
|---|---|---|
| `key` | `string` | A license key in the format Base64url(pubKey).Base64url(sig).Base64url(payload) |

**Returns** — LicenseStatus — returned immediately (a synchronous wrapper; the state is updated after internal async verification completes). Note: the return value is designed as a synchronous API so it can be used immediately without a Promise. Internally it stores the result of verifySignature (async). Calling getLicenseState before the async completion returns the default &#123;valid:false, reason:'invalid'}.

### `setLicenseState`

```ts
setLicenseState(s: LicenseState): void
```

### `subscribeLicense`

Subscribe to license state changes. Listener is invoked synchronously
after every `setLicenseState` call. Returns an unsubscribe function.

Used internally by `useLicenseStatus` (via `useSyncExternalStore`) and
by `useWatermarkEnforcement` (singleton portal re-render trigger).

```ts
subscribeLicense(listener: LicenseListener): (…) => …
```

## Types & Interfaces

### `LicenseCheckResult`

The return type of `checkLicense`.
watermarkRequired: true → the Pro grid watermark needs to be displayed.
expiryWarning: 'soon-expiring' → expires within 60 days (console.warn is emitted).

| Property | Type | Description |
|---|---|---|
| `expiresAt?` | `Date` |  |
| `expiryWarning?` | `"soon-expiring"` |  |
| `reason?` | `LicenseReason` |  |
| `valid` | `boolean` |  |
| `watermarkRequired` | `boolean` |  |

### `LicenseState`

| Property | Type | Description |
|---|---|---|
| `rawKey` | `string` |  |
| `setAt` | `number` |  |
| `status` | `LicenseStatus` |  |

### `LicenseStatus`

| Property | Type | Description |
|---|---|---|
| `domain?` | `string` |  |
| `expiresAt?` | `Date` |  |
| `reason?` | `LicenseReason` |  |
| `valid` | `boolean` |  |

### `LicenseReason`

```ts
type LicenseReason = "invalid" | "expired" | "domain-mismatch"
```
