---
title: "@topgrid/grid-license-core"
sidebar_label: "grid-license-core"
sidebar_position: 11
---

# @topgrid/grid-license-core

> Framework-neutral license state + verification for TopGrid (no React/Vue). Source of the license singleton. · **상용 (EULA)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **10개** public export — 함수 6 · 훅 0 · 컴포넌트 0 · 타입 4 · 상수 0.

## 함수

### `checkLicense`

현재 라이선스 상태를 동기 검사하여 `LicenseCheckResult`를 반환한다.

- valid=false 이면 `watermarkRequired=true`.
- 유효하고 `expiresAt`까지 60일 미만이면 `expiryWarning='soon-expiring'` + `console.warn` (1회).
- 유효하고 만료 여유가 충분하면 `{ valid: true, watermarkRequired: false }`.

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

Pro 패키지 전역 라이선스 등록 API.
앱 entry(main.tsx / App.tsx)에서 1회 호출.

```ts
setLicenseKey(key: string): LicenseStatus
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `key` | `string` | Base64url(pubKey).Base64url(sig).Base64url(payload) 형식 라이선스 키 |

**반환** — LicenseStatus — 즉시 반환 (동기 wrapper, 내부 비동기 검증 완료 후 상태 갱신) 주의: 반환값은 Promise 없이 즉시 사용 가능하도록 동기 API로 설계. 내부적으로 verifySignature (async) 결과를 저장. 비동기 완료 전 getLicenseState 호출 시 기본값 &#123;valid:false, reason:'invalid'} 반환.

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

## 타입 · 인터페이스

### `LicenseCheckResult`

`checkLicense` 반환 타입.
watermarkRequired: true → Pro grid 워터마크 표시 필요.
expiryWarning: 'soon-expiring' → 60일 이내 만료 (console.warn 발생).

| 속성 | 타입 | 설명 |
|---|---|---|
| `expiresAt?` | `Date` |  |
| `expiryWarning?` | `"soon-expiring"` |  |
| `reason?` | `LicenseReason` |  |
| `valid` | `boolean` |  |
| `watermarkRequired` | `boolean` |  |

### `LicenseState`

| 속성 | 타입 | 설명 |
|---|---|---|
| `rawKey` | `string` |  |
| `setAt` | `number` |  |
| `status` | `LicenseStatus` |  |

### `LicenseStatus`

| 속성 | 타입 | 설명 |
|---|---|---|
| `domain?` | `string` |  |
| `expiresAt?` | `Date` |  |
| `reason?` | `LicenseReason` |  |
| `valid` | `boolean` |  |

### `LicenseReason`

```ts
type LicenseReason = "invalid" | "expired" | "domain-mismatch"
```

