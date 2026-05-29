# MOD-GRID-99-A — Architecture Decision Records

> 모든 ADR은 다음을 포함: 결정 / 사유 / 대안 2개+ / trade-off / 결과.
> Source: G-001 "setLicenseKey global API + key 알고리즘 결정 ADR"

---

## 의사결정 요약 (D1–D8)

| 결정 ID | 내용 | Section |
|---------|------|---------|
| D1 | implementFiles prefix 정정 (`TOMIS/packages/` → `topvel-grid-monorepo/packages/`) | C-28 |
| D2 | 서명 알고리즘 = Ed25519 (Web Crypto API, 외부 패키지 0개) | ADR-001 |
| D3 | 스코프 = `grid-license` 단독 패키지 (다른 패키지 변경 없음) | Section 3 |
| D4 | `getLicenseState` = internal (index.ts 미노출, G-002 직접 import) | Section 5.3 |
| D5 | SSR 환경(`typeof window === 'undefined'`) → domain check skip, sig+expiry 유지 | ADR-002 |
| D6 | `setLicenseKey` 미호출 시 `getLicenseState()` → `{valid:false, reason:'invalid'}` | EC-01 |
| D7 | C-32 준수: `verifySignature.ts` = pure async, React/DOM 의존 없음 | ADR-003 |
| D8 | F-03(git diff) N/A — 외부 모노레포 디렉토리 (ADR-MOD-GRID-00-001 상속) | N/A |

---

## ADR-MOD-GRID-99-A-001: 서명 알고리즘 선택 — Ed25519

**결정일**: 2026-05-15 (G-001 implement)
**상태**: accepted
**연관 Goal**: MOD-GRID-99-A/license/G-001
**연관 constraint**: C-14 (외부 패키지 추가 시 trade-off 문서화), C-20 (zero external dep 원칙)

### 결정

라이선스 키 서명 알고리즘으로 **Ed25519 (EdDSA)** 를 채택한다.
구현체는 브라우저/Node 19+ 빌트인 **Web Crypto API** (`crypto.subtle.verify('Ed25519', ...)`) 단독 사용.
외부 npm 패키지 추가 없음.

### 사유

- **번들 영향 최소**: 외부 라이브러리 0개 추가. bundle impact +0 KB (Web Crypto는 런타임 빌트인).
- **성능**: Ed25519 서명 검증은 RSA-2048보다 ~10× 빠름. 키 크기도 32 bytes (RSA: 256 bytes).
- **현대 브라우저 지원**: Chrome 113+, Firefox 130+, Safari 17+, Node 19+에서 네이티브 지원.
- **키 포맷 단순**: `Base64url(pubKey).Base64url(sig).Base64url(payload)` — 3-part 점 구분자, URL 안전.

### 대안

1. **HMAC-SHA256 (대칭키)**: 구현 단순, Node 18 호환성 우수. **각하 이유**: 검증 측에 secret key 노출 필요. 클라이언트 번들에 비밀 키 포함 = 보안 취약점. 라이선스 키를 누구나 생성 가능.
2. **RS256 (RSA-PKCS#1 v1.5, JWT 표준)**: 비대칭, JWT 에코시스템 호환. **각하 이유**: 공개키 크기 2048bit = Base64 346 chars (Ed25519: 43 chars). 번들에 `jose` 또는 `jsonwebtoken` 추가 필요 (~45 KB). C-14/C-20 위반.
3. **ES256 (ECDSA P-256)**: Web Crypto 지원, 비대칭. **각하 이유**: Ed25519보다 키/서명 크기 크고, 구현 복잡도 유사. 차별점 없음 대비 spec 이미 Ed25519 결정.

### Trade-off

| Pro | Con |
|-----|-----|
| 외부 npm 0개 — C-14/C-20 완전 준수 | Node 18에서 `--experimental-global-webcrypto` 플래그 필요 |
| 키 크기 최소 (~213 chars 총) | `atob` 없는 SSR(Node 순수) 환경 별도 처리 필요 |
| Web Crypto API는 브라우저 표준 (W3C) | Ed25519 Web Crypto = Chrome 113 미만 미지원 (2022년 이전 브라우저 구식) |
| 서명 위조 불가 (비대칭) | 키 배포 인프라(서명 생성 CLI) 별도 필요 — G-003 범위 |

### 결과

- `verifySignature.ts`: `crypto.subtle.importKey('raw', ..., {name:'Ed25519'}, ...)` + `crypto.subtle.verify('Ed25519', ...)` 사용.
- Node 18 fallback: `crypto.subtle` 접근 실패 시 `{valid:false, reason:'invalid'}` 반환 (EC-10).
- 키 생성 CLI는 G-003 범위. 이 ADR은 검증 알고리즘만 다룸.

---

## ADR-MOD-GRID-99-A-002: 도메인 검증 전략 — hostname 매칭 + localhost dev 허용

**결정일**: 2026-05-15 (G-001 implement)
**상태**: accepted
**연관 Goal**: MOD-GRID-99-A/license/G-001
**연관 constraint**: C-29 (exactOptionalPropertyTypes spread-skip)

### 결정

도메인 검증은 `window.location.hostname`과 라이선스 payload의 `domain` 필드를 **정확히 일치** 비교한다.
예외: `localhost` 및 `127.0.0.1`은 개발 환경으로 자동 허용 (EC-07).
SSR 환경(`typeof window === 'undefined'`)에서는 도메인 검증을 **skip** — 서명/만료 검증만 수행 (D5).

### 사유

- **개발자 경험**: localhost 허용 없으면 로컬 개발 시 매번 라이선스 키 재발급 필요 → 개발 생산성 저하.
- **SSR 안전성**: 서버에서 `window` 없음 → TypeError 방지. 서명+만료 검증은 서버에서도 의미 있음.
- **단순 구현**: subdomain/wildcard 매칭 대신 exact match → 모호성 없음. 와일드카드 `*.example.com` 지원은 G-001 범위 외.

### 대안

1. **Wildcard 도메인 지원** (`*.example.com`): 엔터프라이즈 다중 서브도메인에 유용. **각하 이유**: G-001 AC-005 명세 없음. 도메인 파싱 복잡도 증가. G-003 확장 범위로 연기.
2. **SSR에서 도메인 검증 실패 처리**: `window` 없으면 `{valid:false, reason:'domain-mismatch'}`. **각하 이유**: SSR 렌더링 시 항상 실패 → Next.js/Remix 사용 불가. spec D5 명시적으로 skip 결정.
3. **IP 화이트리스트**: 도메인 대신 IP 기반 검증. **각하 이유**: 클라이언트 IP는 NAT/CDN으로 검증 불가. 브라우저에서 신뢰할 수 없는 값.

### Trade-off

| Pro | Con |
|-----|-----|
| localhost 자동 허용 → DX 우수 | 개발-운영 도메인 검증 동작 차이 (개발 시 도메인 불일치 버그 미노출) |
| SSR safe — window 없는 환경 정상 동작 | 서버 렌더에서 도메인 검증 무력화 (서버 측 인증은 별도 필요) |
| 구현 단순 (정확 일치) | subdomain 지원 없음 → `www.example.com` ≠ `example.com` |

### 결과

- `verifySignature.ts` L68-86: `typeof window !== 'undefined'` 가드 후 hostname 추출.
- `isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'` — IPv6 `::1` 미지원 (G-001 scope 외).
- domain-mismatch 시 `expiresAt`, `domain` 포함 반환 (EC-09).

---

## ADR-MOD-GRID-99-A-003: 동기 API 설계 — setLicenseKey + fire-and-forget async

**결정일**: 2026-05-15 (G-001 implement)
**상태**: accepted
**연관 Goal**: MOD-GRID-99-A/license/G-001
**연관 constraint**: C-32 (pure helper + React shell 분리)

### 결정

`setLicenseKey(key: string): LicenseStatus` 는 **동기 함수**로 설계한다.
내부적으로 `verifySignature(key)` (async)를 fire-and-forget 방식으로 호출하고, 결과를 모듈-정적 state에 저장.
호출 시 즉시 `{valid: false}` 반환. 비동기 검증 완료 후 state가 갱신되며, G-002의 `checkLicense()`가 mount 시점에 `getLicenseState()`로 최종값 조회.

### 사유

- **호출 편의**: `main.tsx` 최상단에서 `await` 없이 호출 가능. React Suspense/ErrorBoundary 연동 불필요.
- **타이밍 보장**: 앱 기동(setLicenseKey) → 첫 컴포넌트 mount(checkLicense) 사이 시간 간격에서 Ed25519 검증 완료 가능 (~2ms).
- **C-32 준수**: `verifySignature`는 순수 async 함수, `setLicenseKey`는 Promise caller. React 의존 없음.

### 대안

1. **`async setLicenseKey(key): Promise<LicenseStatus>`**: await 가능, 결과 즉시 확인. **각하 이유**: `main.tsx`에서 `await` 필요 → top-level await 미지원 환경 문제. React 렌더 전 async 블록 처리 복잡도 증가.
2. **callback 기반**: `setLicenseKey(key, (status) => {...})`. **각하 이유**: 구식 패턴. Promise 체인과 불일치. G-002 통합 복잡도 증가.
3. **useEffect 내부에서만 호출 (React hook)**: `useLicense(key)`. **각하 이유**: hook 형태는 컴포넌트 트리 최상단에서만 호출 강제. 앱 entry에서 전역 1회 호출 패턴과 불일치. C-32 위반 (React 의존성).

### Trade-off

| Pro | Con |
|-----|-----|
| 동기 API → 호출 단순, await 불필요 | 반환값 `{valid:false}` = 검증 완료 전 상태 (즉시 결과 사용 불가) |
| C-32 준수 — verifySignature 완전 분리 | fire-and-forget → 검증 실패를 외부에서 catch 불가 (state 통해서만 확인) |
| mount 타이밍 내 Ed25519 완료 현실적 | EC-11 중복 호출 시 마지막 상태만 유효 (경고 없음) |

### 결과

- `setLicenseKey.ts`: `verifySignature(key).then(...).catch(...)` pattern.
- G-002 `checkLicense()`: mount 시점에 `getLicenseState()` 호출로 최종 상태 확인.
- EC-11 중복 호출: 마지막 호출 기준 state 덮어쓰기. 경고 미발생 (spec EC-11 명시).

---

## ADR-MOD-GRID-99-A-004: React peerDependency 추가

**결정일**: 2026-05-15 (G-002 specify)
**상태**: accepted
**연관 Goal**: MOD-GRID-99-A/license/G-002
**연관 constraint**: C-14 (외부 패키지 trade-off 문서화), C-20 (zero external dep), C-22 (React = peer)

### 결정

`@tomis/grid-license` package.json에 React `peerDependencies` 추가:
```json
"peerDependencies": {
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
```
`peerDependenciesMeta` 없음 (mandatory).

### 사유

- G-002 `<Watermark />` React 컴포넌트 도입으로 runtime React 의존성 발생.
- grid-core 패턴 동일 적용 — mandatory peer (peerDependenciesMeta 없음): Pro 패키지 소비자는 React를 항상 보유.
- C-20: React를 `dependencies`에 넣으면 번들에 중복 포함 위험 → peer로 선언하여 소비자 React 재사용.
- C-22: React는 peerDependencies 강제.

### 대안

1. **dependencies에 React 추가**: 번들에 React 중복 포함 → C-20 위반, 번들 크기 급증. 각하.
2. **peerDependenciesMeta optional: true**: `grid-license`가 React 없는 환경에서도 동작한다는 의미. `<Watermark />`는 React 필수이므로 optional 부적합. 각하.
3. **Watermark를 별도 패키지로 분리**: 추가 패키지 관리 오버헤드. G-002 scope 내 단순화 우선. 각하.

### Trade-off

| Pro | Con |
|-----|-----|
| bundle 내 React 중복 없음 — C-20 완전 준수 | 소비자가 React 별도 설치 필요 (사실상 항상 설치됨) |
| grid-core 패턴 일관성 | peerDependencies 버전 충돌 시 소비자 resolve 필요 |
| React 18/19 모두 지원 | |

### 결과

`package.json` peerDependencies 추가. `tsup.config.ts` 기존 `external: ['react', 'react-dom']` 이미 포함 — NO CHANGE.

---

## ADR-MOD-GRID-99-A-005: grid-pro-master 계단식 결함 수정 방법 (G-003)

**결정일**: 2026-05-15 (G-003 implement)  
**상태**: accepted  
**연관 Goal**: MOD-GRID-99-A/license/G-003  
**연관 constraint**: C-14, C-31 (Functional Wiring Audit)

### 결정

Option A: `grid-pro-master` 두 서브파일(`MasterDetailGrid.tsx`, `ContextMenuGrid.tsx`)에서 `verifyLicense` import + 호출을 제거하고, 라이선스 검증 책임을 `grid-pro-master/src/index.ts` 모듈 레벨 `checkLicense()` 단일 호출로 통합한다.

### 배경

G-001이 `verifyLicense`를 `@tomis/grid-license`에서 export 제거할 때 alias를 제공하지 않았다. `grid-pro-master` 두 서브파일이 stale import를 보유한 채 G-002 review까지 발견되지 않아 "계단식 결함(cascading defect)"으로 분류, G-003에서 수정한다.

### 대안

| 옵션 | 결과 | 거부 이유 |
|------|------|----------|
| **Option A (채택)** | 서브파일 stale import + 호출 제거; index.ts 단일 지점 통합 | — |
| Option B | `verifyLicense` alias를 grid-license에 다시 추가 export | G-001 COMPLETED 재오픈; export surface 최소화 ADR 위반 |
| Option C | 서브파일에서 `verifyLicense` → `checkLicense` 직접 교체 | 서브파일마다 중복 호출; 모듈 진입점 단일 책임 원칙 위반 |

### Trade-off

| 장점 | 단점 |
|------|------|
| G-001/G-002 이미 완료된 결정 존중; 코드베이스 일관성 유지 | 서브파일 내 "자체 검증" 없음 |
| 검증 지점 단일화 (index.ts 모듈 레벨) | ES 모듈 로드 순서 보장에 의존 (실용적으로 문제없음) |

### 결과

`MasterDetailGrid.tsx` + `ContextMenuGrid.tsx`의 stale `verifyLicense` import, 호출 라인, 관련 주석 제거. `grid-pro-master/src/index.ts`에 `import { checkLicense } from '@tomis/grid-license'; checkLicense();` 추가. stale JSDoc도 제거.

---

## ADR-MOD-GRID-99-A-006: 릴리스 검증 스크립트 위치 (G-003)

**결정일**: 2026-05-15 (G-003 implement)  
**상태**: accepted  
**연관 Goal**: MOD-GRID-99-A/license/G-003  
**연관 constraint**: C-9 (라이선스 정책), C-14

### 결정

Option B: monorepo 루트 `scripts/verify-license.mjs` — 단일 스크립트가 `packages/` 하위 전체를 순회.

### 배경

AC-005는 릴리스 CI 단계에서 license + EULA/LICENSE 파일 자동 검증을 요구한다. 스크립트 위치(패키지별 vs 루트 통합)를 결정해야 한다.

### 대안

| 옵션 | 결과 | 거부 이유 |
|------|------|----------|
| Option A | 패키지별 스크립트 × 7+ | 중복 7배; 패키지 추가 시 누락 위험 |
| **Option B (채택)** | 루트 단일 스크립트 | — |
| Option C | `package.json` prepublishOnly 인라인 셸 커맨드 | 복잡한 검증 로직 인라인 불가; 가독성/유지보수 불량 |

### Trade-off

| 장점 | 단점 |
|------|------|
| 단일 유지보수 지점; 새 패키지 자동 포함 | monorepo 루트에 `scripts/` 디렉토리 추가 |
| CI 연결 단순 (`node scripts/verify-license.mjs`) | 수동 실행 필요 (CI 파이프라인 연결은 DevOps 범위) |

### 결과

`topvel-grid-monorepo/scripts/verify-license.mjs` 신규 생성. CI에서 `node scripts/verify-license.mjs` 실행. 누락 시 exit(1), 통과 시 exit(0).
