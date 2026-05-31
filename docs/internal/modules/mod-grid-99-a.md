# 라이선스 런타임 (`@topgrid/grid-license`)

Pro 패키지의 라이선스 키를 검증하고, 미인증 상태에서 워터마크를 표시하는
런타임 모듈. 전역 등록 API 1개와 동기 검사 함수, 그리고 React 통합용 hook /
컴포넌트를 제공한다. **소프트 인포스먼트** 방식 — 무효 라이선스에서도 그리드 렌더를
막지 않고, 워터마크 + `console.warn` 으로만 알린다.

- 패키지: `@topgrid/grid-license`
- 라이선스: **상용** (`SEE LICENSE IN EULA`)
- 의존: 외부 npm 의존 **0개**. 서명 검증은 런타임 빌트인 Web Crypto API 만 사용.
  `react` / `react-dom` 은 peer dependency (워터마크 컴포넌트/hook 용, 번들 미포함).
- 서명 알고리즘: **Ed25519** (비대칭 EdDSA).

---

## 1. 개요 — 표면 API

| export | 종류 | 역할 |
|--------|------|------|
| `setLicenseKey(key)` | 함수 | 앱 entry 에서 1회 호출하는 전역 라이선스 등록 API |
| `checkLicense()` | 함수 | 현재 라이선스 상태를 동기 검사 → `LicenseCheckResult` |
| `Watermark` | 컴포넌트 | 미인증 시 그리드 위에 표시하는 워터마크 |
| `useLicenseStatus()` | hook | 라이선스 상태 변화에 반응해 재렌더되는 React hook |
| `useWatermarkEnforcement()` | hook | per-cell 렌더러용 — `document.body` 싱글턴 portal 로 워터마크 강제 |
| `subscribeLicense(listener)` | 함수 | 라이선스 상태 변경 구독 primitive (unsubscribe 반환) |
| `setLicenseState(state)` | 함수 | `@internal` — 테스트/스토리에서 검증을 우회해 상태 직접 주입하는 seam |

타입 export: `LicenseStatus`, `LicenseReason`, `LicenseCheckResult`.

전형적인 흐름:

1. 앱 entry(`main.tsx` 등)에서 `setLicenseKey(key)` 1회 호출 → Ed25519 서명 + 만료 +
   도메인 검증을 비동기로 수행하고 결과를 모듈 전역 state 에 저장.
2. Pro 패키지가 import 시점(모듈 로드)에 `checkLicense()` 를 호출해 검증 상태를 읽음.
3. 미인증/만료/도메인 불일치 → `watermarkRequired: true` → 워터마크 표시.

---

## 2. 핵심 API 계약

### setLicenseKey

```ts
function setLicenseKey(key: string): LicenseStatus;
```

- Pro 패키지 전역 라이선스 등록 API. 앱 entry 최상단에서 1회 호출한다.
- `key` 형식: `Base64url(publicKey) . Base64url(signature) . Base64url(payload)` —
  점(`.`) 구분 3-part. payload 는 JSON `{ domain: string, expiresAt: number(Unix ms), tier: string }`.
- **동기 함수**다. 내부적으로 비동기 서명 검증을 fire-and-forget 으로 시작하고, 즉시
  `{ valid: false }`(pending) 를 반환한다. 검증이 끝나면 전역 state 가 갱신된다(§4.2 설계 결정).
- 중복 호출 시 마지막 호출 기준으로 state 를 덮어쓴다(경고 없음).

### checkLicense

```ts
function checkLicense(): LicenseCheckResult;
```

- 현재 라이선스 state 를 **동기**로 읽어 파생 결과를 계산한다. Promise 아님, React 의존 없음.
- 규칙:
  - `valid === false` → `{ valid: false, watermarkRequired: true }` (있으면 `reason`/`expiresAt` 동봉).
  - `valid === true` + 만료까지 60일 미만 → `{ valid: true, watermarkRequired: false,
    expiryWarning: 'soon-expiring', expiresAt }` + `console.warn` (프로세스당 최초 1회).
  - `valid === true` + 만료 여유 충분(또는 `expiresAt` 없음) → `{ valid: true, watermarkRequired: false }`.

### Watermark

```ts
function Watermark(props: { required: boolean }): React.ReactElement | null;
```

- `required === false` → `null`(렌더 없음). `true` → 우상단 워터마크 div.
- 텍스트: `Unlicensed @topgrid/grid`. 스타일은 Tailwind className 전용
  (`absolute top-0 right-0 opacity-40 pointer-events-none select-none …`).
- `pointer-events-none` 으로 아래 그리드 상호작용을 가리지 않는다. SSR-safe(클래스만 의존).
- 전형적으로 `checkLicense()`/`useLicenseStatus()` 의 `watermarkRequired` 를 `required` 로 넘긴다.

### useLicenseStatus

```ts
function useLicenseStatus(): LicenseCheckResult;
```

- 현재 `LicenseCheckResult` 를 반환하는 React hook. 라이선스 state 가 바뀌면(예: 비동기
  `setLicenseKey` 검증 완료) 재렌더된다.
- `useSyncExternalStore` 기반 — React 18 concurrent 모드에서 tearing 없음.
- 호스트 DOM 을 감쌀 수 있는 컴포넌트에서 워터마크를 선언적으로 붙일 때 사용:

```tsx
function MyGrid() {
  const lic = useLicenseStatus();
  return (
    <div className="relative">
      <table>{/* … */}</table>
      {lic.watermarkRequired && <Watermark required />}
    </div>
  );
}
```

### useWatermarkEnforcement

```ts
function useWatermarkEnforcement(): void;
```

- 반환값 없는 등록 hook. `document.body` 에 마운트되는 **싱글턴 portal** 을 통해 워터마크를
  강제한다.
- ref-count 동작: 마운트마다 모듈 레벨 카운트 증가, **최초** 마운트가 portal + React root 생성,
  **마지막** 언마운트(카운트 0)가 portal 을 해제한다.
- 라이선스 state 변경(`setLicenseKey` 검증 완료 등) 시 `subscribeLicense` 를 통해 portal 이
  재렌더된다.
- 용도: 자체 host DOM 이 없어 wrapper 기반 워터마킹이 불가능한 **per-cell 렌더러**
  (예: 셀 단위로 수백 개 마운트되는 데이터맵 셀). 같은 hook 을 수백 번 호출해도 portal 은 1개만 생긴다.
- SSR-safe: `document` 가 없으면 portal 설정을 건너뛴다.

```tsx
function DataMapCell(info) {
  useWatermarkEnforcement(); // void — 반환값 없음
  return <span>{/* … */}</span>;
}
```

### subscribeLicense

```ts
function subscribeLicense(listener: () => void): () => void;
```

- 라이선스 state 변경 구독 primitive. `listener` 는 매 state 변경 직후 동기 호출된다.
- unsubscribe 함수를 반환한다. `useLicenseStatus`/`useWatermarkEnforcement` 가 내부적으로 사용한다.

### setLicenseState (`@internal`)

```ts
function setLicenseState(state: LicenseState): void;
```

- 정식 검증 경로(`verifySignature`)를 우회해 라이선스 상태를 직접 주입하는 테스트/스토리 seam.
- 프로덕션 앱 코드는 `setLicenseKey()` 를 사용해야 한다.

---

## 3. 타입

`LicenseStatus` 와 `LicenseCheckResult` 는 역할이 다르므로 혼동하지 않는다.

```ts
type LicenseReason = 'invalid' | 'expired' | 'domain-mismatch';

// 저장되는 원본 검증 상태 — setLicenseKey 가 반환, 내부 state 에 저장
interface LicenseStatus {
  valid: boolean;
  reason?: LicenseReason;
  expiresAt?: Date;
  domain?: string;
}

type ExpiryWarning = 'soon-expiring'; // 현재는 60일 이내 만료 단일 값

// 파생 결과 — checkLicense() / useLicenseStatus() 가 반환
interface LicenseCheckResult {
  valid: boolean;
  watermarkRequired: boolean;        // !valid 와 동치
  expiryWarning?: ExpiryWarning;     // 만료 60일 이내 유효 라이선스
  expiresAt?: Date;
  reason?: LicenseReason;
}
```

- `LicenseStatus` = "유효한가"라는 raw 사실. `LicenseCheckResult` = 거기서 파생한
  `watermarkRequired`/`expiryWarning` 을 포함한 소비용 결과.
- 모든 optional 필드는 `undefined` 직접 할당 대신 conditional spread 로 채워
  `exactOptionalPropertyTypes` 와 호환한다. `any` 미사용.

---

## 4. 핵심 설계 결정과 근거

### 4.1 서명 알고리즘 — Ed25519 (비대칭)
라이선스 키는 서버가 발급하고 클라이언트(브라우저)가 검증한다. 따라서 검증 측에 들어가는
재료가 곧 공개 노출 대상이 된다.

- **HMAC-SHA256(대칭키) 각하** — 단순 trade-off 가 아니라 **암호학적 거부**다. 대칭키는 검증에
  쓰는 secret 이 JS 번들에 포함되어야 하고, DevTools/소스맵으로 추출 가능하다. secret 이 새면
  공격자가 임의의 domain + expiry 로 유효한 MAC 을 만들어 라이선스 검증을 무력화할 수 있다.
- **RSA/JWT(RS256) 각하** — 비대칭이라 보안성은 충족하나, 공개키 2048bit ≈ Base64 346자로
  키 문자열이 과대하고 `jose`/`jsonwebtoken` 같은 외부 패키지(~45KB)가 필요하다. PKCS1v15 도
  deprecation 부담이 있다.
- **Ed25519 채택** — 비대칭이므로 클라이언트 번들에는 공개키만 들어가고(비밀키는 서버 전용),
  공개키 노출만으로는 서명을 위조할 수 없다. 서명 64 bytes / 공개키 32 bytes 로 compact 하고,
  검증 속도가 RSA-2048 대비 약 10배 빠르다. 구현은 런타임 빌트인 Web Crypto API
  (`crypto.subtle.importKey('raw', …, {name:'Ed25519'})` + `crypto.subtle.verify('Ed25519', …)`)
  단독으로, 외부 npm 의존 0개를 유지한다.

키 포맷: `Base64url(pubKey 32B) . Base64url(sig 64B) . Base64url(payloadJSON)` — 총 ≈213자.

### 4.2 동기 `setLicenseKey` + fire-and-forget 비동기 검증
Web Crypto 검증은 비동기지만, `setLicenseKey` 는 **동기** API 로 설계했다. `main.tsx` 최상단에서
`await` 없이 호출할 수 있게 하기 위함이다(top-level await / Suspense / ErrorBoundary 연동 불필요).
내부적으로 `verifySignature(key).then(...).catch(...)` 로 검증을 시작하고 즉시 pending
(`{ valid: false }`)을 반환한 뒤, 검증이 끝나면 전역 state 를 갱신한다.

타이밍 근거: 앱 기동(`setLicenseKey`) 시점과 첫 그리드 컴포넌트 mount(`checkLicense`) 시점 사이의
간격(~2ms)에 Ed25519 검증이 현실적으로 완료된다. 만약 검증 완료 전에 Pro 그리드가 mount 되면
순간적으로 워터마크가 노출될 수 있는데(~2ms), 이는 **설계상 허용된 동작이며 버그가 아니다**.
방어 코드를 추가하지 않는다.

이 설계의 비용: 반환값은 검증 완료 전 상태라 즉시 결과로 쓸 수 없고(상태는 `checkLicense`/
`useLicenseStatus`로 조회), fire-and-forget 이므로 검증 실패를 외부에서 `catch` 할 수 없다(state 로만 확인).

대안인 `async setLicenseKey(): Promise<…>`, callback 기반, React hook 형태(`useLicense`)는
모두 entry 에서의 전역 1회 호출 패턴과 맞지 않거나 호출 복잡도를 키워 각하했다.

### 4.3 도메인 검증 — exact match + localhost 허용 + SSR skip
payload 의 `domain` 과 `window.location.hostname` 을 **정확히 일치** 비교한다.

- **localhost / 127.0.0.1 자동 허용** — 로컬 개발마다 키를 재발급하지 않도록 dev 환경으로 통과.
  (단 IPv6 `::1` 은 미지원.)
- **SSR(`typeof window === 'undefined'`) → 도메인 검증 skip** — 서버에는 `window` 가 없으므로
  도메인만 건너뛰고 서명 + 만료 검증은 그대로 수행한다. 이렇게 하지 않으면 Next.js/Remix 등에서
  서버 렌더가 항상 실패한다.
- **subdomain/wildcard 미지원** — exact match 로 모호성을 없앤다. 따라서
  `www.example.com ≠ example.com`. 와일드카드는 향후 확장 대상.

### 4.4 만료 60일 경고 — 단일 `console.warn`
유효하지만 만료까지 60일 미만이면 `expiryWarning: 'soon-expiring'` 을 반환하고
`console.warn` 으로 남은 일수를 알린다. 모듈 레벨 `warned` 플래그로 **프로세스당 최초 1회만**
경고한다(여러 Pro 패키지가 각자 `checkLicense()` 를 호출해도 콘솔이 도배되지 않음).
경계값은 strict `<` — 정확히 60일이면 경고하지 않는다.

### 4.5 워터마크 강제의 두 경로 — wrapper vs 싱글턴 portal
워터마크를 붙이는 방식이 두 가지다.

- **wrapper 방식** (`useLicenseStatus` + `<Watermark required />`) — 그리드처럼 `position:relative`
  컨테이너를 가진 컴포넌트는 그 위에 워터마크를 선언적으로 얹는다.
- **싱글턴 portal 방식** (`useWatermarkEnforcement`) — 셀 단위 렌더러처럼 감쌀 host DOM 이 없는
  경우, `document.body` 에 마운트되는 단 1개의 portal 로 워터마크를 강제한다. 수백 개의 셀이
  같은 hook 을 호출해도 ref-count 로 portal 인스턴스는 1개만 유지하고, 마지막 셀이 사라지면 해제한다.

### 4.6 `useSyncExternalStore` 스냅샷 캐싱
`useLicenseStatus` 는 `useSyncExternalStore` 로 외부(모듈 전역) state 를 구독한다. 이 API 는
`getSnapshot` 이 state 가 실제로 바뀌지 않는 한 **동일 참조**를 반환할 것을 요구한다. 그런데
`checkLicense()` 는 호출마다 새 `LicenseCheckResult` 객체를 만든다. 그래서 state 모듈이 마지막
결과를 캐시(`getCachedCheck`)하고, state 가 실제로 변경될 때만 캐시를 무효화한다. 이 캐싱이 없으면
Strict 모드에서 "getSnapshot should be cached" 무한 렌더 루프가 발생한다.

### 4.7 소프트 인포스먼트 — 그리드는 절대 막지 않는다
무효/만료/도메인 불일치 라이선스라도 그리드 렌더링을 차단하지 않는다. 결과는 워터마크 표시와
`console.warn` 뿐이다. Pro 패키지는 모듈 로드 시점에 `checkLicense()` 를 1회 호출해 검증을
트리거하는 것으로 통합되며, 별도의 렌더 중단 로직은 두지 않는다.

---

## 5. 엣지 케이스 동작 요약

### 5.1 키 검증 (`setLicenseKey` / 내부 서명 검증)

| 상황 | 결과 |
|------|------|
| `setLicenseKey` 미호출 | `{ valid: false, reason: 'invalid' }` (기본값) |
| 키 형식 오류(`.` 3-part 아님) | `{ valid: false, reason: 'invalid' }` |
| Base64url 디코드 실패 / payload JSON 파싱 실패 | `{ valid: false, reason: 'invalid' }` |
| Ed25519 서명 검증 실패 | `{ valid: false, reason: 'invalid' }` |
| 만료됨(`expiresAt < now`) | `{ valid: false, reason: 'expired', expiresAt, domain }` |
| 도메인 불일치(비 localhost) | `{ valid: false, reason: 'domain-mismatch', expiresAt, domain }` |
| localhost / 127.0.0.1 | dev 모드 자동 허용 |
| SSR(`window` undefined) | 도메인 검증 skip, 서명 + 만료는 정상 검증 |
| `crypto.subtle` 미지원 환경 | `{ valid: false, reason: 'invalid' }` fallback |
| `setLicenseKey` 중복 호출 | 마지막 호출 기준 state 덮어쓰기(경고 없음) |

### 5.2 상태 검사 (`checkLicense`)

| 상황 | 결과 |
|------|------|
| state 무효 | `{ valid: false, watermarkRequired: true }` (+ `reason`/`expiresAt` 있으면 동봉) |
| 유효 + 만료 60일 초과 | `{ valid: true, watermarkRequired: false }` (경고 없음) |
| 유효 + 만료 60일 이내 | `{ valid: true, watermarkRequired: false, expiryWarning: 'soon-expiring', expiresAt }` + `console.warn` 1회 |
| 유효 + `expiresAt` 없음 | `{ valid: true, watermarkRequired: false }` (영구 유효) |
| 정확히 만료 60일 = 경계 | 경고 미발생(strict `<`) |
| 60일 이내 상태에서 `checkLicense()` 2회+ | `console.warn` 최초 1회만 |
| 비동기 검증 완료 전 Pro 그리드 mount | 순간 워터마크 노출(~2ms) — 설계상 허용, 버그 아님 |

---

## 6. 환경/브라우저 호환성

Ed25519 `crypto.subtle` 지원 기준:

| 환경 | 지원 | 처리 |
|------|------|------|
| Chrome 113+ / Firefox 130+ / Safari 17+ | ✅ | 정상 |
| Node 19+ | ✅ | 정상 |
| Node 18 (no flag) / 그 외 `crypto.subtle` 미지원 | ⚠️ | `{ valid: false, reason: 'invalid' }` fallback |
| SSR(`window` undefined) | — | 도메인 검증 skip, 서명 + 만료는 정상 |

레거시 브라우저(2022년 이전, Ed25519 Web Crypto 미지원)는 Pro 패키지 진입 요건으로 문서화한다.

---

## 7. 사용

```tsx
// main.tsx — 앱 entry 최상단 1회
import { setLicenseKey } from '@topgrid/grid-license';

setLicenseKey('eyJwdWIiOiJ...Base64url형식라이선스키...');
```

```tsx
// 그리드 컨테이너에서 워터마크 표시 (wrapper 방식)
import { useLicenseStatus, Watermark } from '@topgrid/grid-license';

function MyGrid() {
  const lic = useLicenseStatus();
  return (
    <div className="relative">
      <table>{/* … */}</table>
      {lic.watermarkRequired && <Watermark required />}
    </div>
  );
}
```

```tsx
// per-cell 렌더러에서 워터마크 강제 (싱글턴 portal 방식)
import { useWatermarkEnforcement } from '@topgrid/grid-license';

function DataMapCell(info) {
  useWatermarkEnforcement();
  return <span>{/* … */}</span>;
}
```

Pro 패키지는 자신의 `src/index.ts` 모듈 레벨에서 `checkLicense()` 를 1회 호출해, 패키지 로드
시점에 라이선스 검증을 트리거하는 형태로 통합된다.
