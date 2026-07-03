---
title: "@topgrid/grid-license"
sidebar_label: "grid-license"
sidebar_position: 10
---

# @topgrid/grid-license

> Pro license validation runtime · **상용 (EULA)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **10개** public export — 함수 4 · 훅 2 · 컴포넌트 1 · 타입 3 · 상수 0.

## 컴포넌트

### `Watermark`

Pro 라이선스가 없을 때 그리드 위에 표시되는 워터마크 컴포넌트.

`required=false` 이면 `null` 반환 (렌더링 없음).

```ts
Watermark(__namedParameters: WatermarkProps): null | ReactElement<any, string | JSXElementConstructor<any>>
```

## 훅 (Hooks)

### `useLicenseStatus`

React hook returning the current license check result. Re-renders when the
license state changes (e.g. async `setLicenseKey` resolution).

Backed by `useSyncExternalStore` — no tearing under React 18 concurrent mode.

```ts
useLicenseStatus(): LicenseCheckResult
```

**예시**

```tsx
function MyGrid() {
  const lic = useLicenseStatus();
  return (
    <div className="relative">
      <table>{ ... }</table>
      {lic.watermarkRequired && <Watermark required />}
    </div>
  );
}
```

### `useWatermarkEnforcement`

Void registration hook for license watermark enforcement via a singleton
portal mounted at `document.body`.

- Each mount increments a module-level ref-count.
- First mount creates the singleton portal + React root.
- License state changes (`setLicenseKey`) re-render the portal via
 `subscribeLicense`.
- Last unmount (ref-count → 0) tears down the portal.

Use case: per-cell renderers (e.g. `DataMapCell`) where the component
itself has no host DOM suitable for wrapper-based watermarking.

SSR-safe: portal setup is skipped when `document` is undefined.

```ts
useWatermarkEnforcement(): void
```

**예시**

```tsx
export function DataMapCell(info) {
  useWatermarkEnforcement(); // void — no return value
  return <span>{...}</span>;
}
```

## 함수

### `checkLicense`

현재 라이선스 상태를 동기 검사하여 `LicenseCheckResult`를 반환한다.

- valid=false 이면 `watermarkRequired=true`.
- 유효하고 `expiresAt`까지 60일 미만이면 `expiryWarning='soon-expiring'` + `console.warn` (1회).
- 유효하고 만료 여유가 충분하면 `{ valid: true, watermarkRequired: false }`.

```ts
checkLicense(): LicenseCheckResult
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

