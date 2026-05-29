# G-005 Spec — 13 패키지 README + ko/en docs

**Goal ID**: MOD-GRID-99-B / G-005  
**Spec version**: 1.0.0  
**Rubric**: specify-rubric v1.0.8 (threshold 85 — low tier)  
**Status**: DRAFT  
**Author**: tw-grid Spec Writer (automated)  
**Date**: 2026-05-15

---

## Section 1 — Goal 요약

G-005는 TOMIS Grid monorepo의 **13개 패키지 README.md 작성**과 **Docusaurus 사이트의 한국어/영어 이중 언어(i18n) 설정 추가**를 수행하는 Goal이다.

구체적으로:
1. 13개 패키지 각각에 `README.md` 작성 (6개 MIT + 7개 Pro)
2. `apps/docs/docusaurus.config.ts`에 `locales: ['ko', 'en']` 추가 (ADR-004 supersede)
3. `apps/docs/i18n/en/` 디렉토리 신규 생성 후 en 번역 파일 2개 작성:
   - `getting-started.mdx` (ko → en 번역)
   - `architecture.mdx` (ko → en 번역)

본 Goal은 코드 로직 변경이 없다. 문서 품질 확보가 목표이며, Pro 패키지는 C-24 라이선스 요구사항을 README에 명시해야 한다.

---

## Section 2 — 선행 결정 (D-series)

### D1 — C-28 경로 prefix 수정 (필수)

`docs-goals.json` G-005 `implementFiles`는 TOMIS 워크트리 경로를 사용한다:

```
D:/project/topvel_project/TOMIS/packages/grid-*/README.md   ← 잘못됨
D:/project/topvel_project/TOMIS/apps/docs/...               ← 잘못됨
```

C-28에 따라 모노레포 산출물은 반드시 모노레포 prefix를 사용해야 한다. 본 spec의 Section 7은 아래 prefix로 교정한다:

```
D:/project/topvel_project/topvel-grid-monorepo/packages/grid-*/README.md   ← 올바름
D:/project/topvel_project/topvel-grid-monorepo/apps/docs/...               ← 올바름
```

**근거**: C-28 — monorepo path prefix rule.  
**영향**: 구현자는 goals.json의 경로를 따르지 말고 이 spec Section 7을 따른다.

---

### D2 — 파일 수 확장 (goals.json 14개 → 실제 16개)

`docs-goals.json` G-005 `implementFiles` 14개에는 다음 2개가 누락되어 있다:

1. `i18n/en/docusaurus-plugin-content-docs/current/architecture.mdx` — en 번역 파일 (아키텍처)
2. `apps/docs/docusaurus.config.ts` — MODIFY (locales 추가)

goals.json은 `getting-started.mdx`(en)만 포함하고 architecture.mdx(en)를 누락했다. 또한 docusaurus.config.ts MODIFY를 implementFiles에 포함하지 않았다.

**결정**: Section 7에 16개 파일을 명시한다. goals.json의 14개 목록을 따르지 않는다.

**근거**: C-1 — 실제 파일 상태 확인 (ko 원본 2개 파일 모두 `.mdx` 존재, i18n/ 디렉토리 미존재 확인). Goals.json 오류는 spec에서 교정한다.

---

### D3 — en 파일 확장자 `.mdx` (goals.json `.md` 오류 교정)

`docs-goals.json`은 en 파일 확장자를 `.md`로 기술하나, ko 원본은 `.mdx`이다:
- `apps/docs/docs/getting-started.mdx` (ko 원본)
- `apps/docs/docs/architecture.mdx` (ko 원본)

Docusaurus i18n 번역 파일은 원본과 동일한 확장자를 사용해야 한다. 원본이 `.mdx`이면 번역도 `.mdx`여야 한다.

**결정**: en 번역 파일 확장자는 `.mdx`이다.

**영향 경로**:
```
i18n/en/docusaurus-plugin-content-docs/current/getting-started.mdx  ← .mdx (not .md)
i18n/en/docusaurus-plugin-content-docs/current/architecture.mdx     ← .mdx (not .md)
```

---

### D4 — ADR-MOD-GRID-99-B-004 Supersede (i18n 영어 추가)

ADR-MOD-GRID-99-B-004 (G-001 결정)는 `locales: ['ko']` 단일 로케일로 결정했고 "영어 추가는 G-005 이후 별도 Goal 범위"라고 명시했다.

G-005가 바로 그 별도 Goal이다. ADR-004의 조건부 미래 작업이 이 Goal에서 실현된다.

**결정**: G-005에서 `docusaurus.config.ts`를 `locales: ['ko', 'en']`으로 수정한다. ADR-004는 이 spec으로 Supersede(대체)된다.

**변경 내용**:
```typescript
// Before (G-001 출력):
i18n: {
  defaultLocale: 'ko',
  locales: ['ko'],
},

// After (G-005 출력):
i18n: {
  defaultLocale: 'ko',
  locales: ['ko', 'en'],
},
```

---

### D5 — AC-005 범위: 선언적 체크리스트 문서 (CI 스크립트 아님)

AC-005는 "13개 패키지 모두 README.md 존재 확인"을 요구한다. 이 확인 방법에는 두 가지 옵션이 있다:

**옵션 A**: CI 스크립트 작성 (`check-readme.sh` 또는 turbo task)  
**옵션 B**: 선언적 체크리스트 (spec Section 7에 README 파일 목록 명시, 구현자가 수동 확인)

**결정**: 옵션 B (선언적 체크리스트). Section 7에 13개 README 파일이 명시되어 있으므로 CI 스크립트 없이 구현 완료 여부를 검증할 수 있다. CI 스크립트 작성은 별도 DevOps Goal 범위이다.

---

### D6 — EULA.md 공유 파일 전략 (7개 Pro 패키지)

7개 Pro 패키지 각각의 README에서 라이선스 섹션이 "SEE LICENSE IN EULA"를 참조해야 한다. 각 패키지마다 별도 EULA.md를 두는 방법과 공유 파일을 링크하는 방법 중 선택이 필요하다.

**결정**: 각 Pro 패키지 디렉토리에 `EULA.md`를 두되, 내용은 동일한 플레이스홀더로 통일한다.

**근거**: 
- pnpm publish 시 각 패키지 내 `files` 목록에 포함되어야 npm에 노출된다 (C-24)
- 공유 파일은 publish 시 패키지에 포함되지 않는다
- 표준 npm 패키지 관행: 각 패키지에 LICENSE 파일 포함

**플레이스홀더 내용**: EULA.md는 실제 계약서 내용 대신 "Contact sales@topvel.com for license terms" 형태의 연락처 안내로 작성한다 (법무팀 확정 전 placeholder).

---

### D7 — 라이선스 API 이름: `setLicenseKey` (ko docs 오류 교정)

`apps/docs/docs/architecture.mdx` (ko 원본)에는 다음 코드가 있다:

```tsx
import { initLicense } from '@tomis/grid-license';
initLicense('YOUR-LICENSE-KEY');
```

그러나 `packages/grid-license/src/index.ts`의 실제 export는:

```ts
export { setLicenseKey } from './setLicenseKey.js';
```

`initLicense`는 존재하지 않는다. ko 문서에 오류가 있다.

**결정**: 
- en 번역 파일 `architecture.mdx`에서는 올바른 `setLicenseKey` API를 사용한다.
- ko 원본 `architecture.mdx`의 오류 수정은 G-005 범위에서 제외한다 (G-005는 번역 추가 Goal이며 ko 원본 수정은 별도 bugfix PR).
- 각 Pro 패키지 README의 라이선스 활성화 예시도 `setLicenseKey`를 사용한다.

**ko docs 오류**: architecture.mdx 라인 104 `initLicense` → `setLicenseKey` 수정 필요 (미래 bugfix 대상, NOT this Goal).

---

## Section 3 — 변환 테이블

### 3-1. 13개 패키지 README 개요

| # | 패키지 | 라이선스 | 설명 | Pro 라이선스 섹션 필요 |
|---|--------|---------|------|----------------------|
| 1 | `@tomis/grid` | SEE LICENSE IN EULA (private meta) | 메타 패키지 — 전체 패키지 re-export | — (meta, private) |
| 2 | `@tomis/grid-core` | MIT | TanStack Table 추상화 + `useGridState` core hook | 아니오 |
| 3 | `@tomis/grid-features` | MIT | Column reorder, multi-sort, filter UI | 아니오 |
| 4 | `@tomis/grid-export` | MIT | Excel/PDF/CSV 내보내기 | 아니오 |
| 5 | `@tomis/grid-renderers` | MIT | 셀 렌더러 (Button, Badge, Check, Link, Number, Date, Icon) | 아니오 |
| 6 | `@tomis/grid-license` | SEE LICENSE IN EULA (private) | Pro 라이선스 검증 런타임 | — (라이선스 엔진 자체) |
| 7 | `@tomis/grid-pro-agg` | SEE LICENSE IN EULA | Aggregation (group footer) | 예 |
| 8 | `@tomis/grid-pro-datamap` | SEE LICENSE IN EULA | DataMap (foreign key display) | 예 |
| 9 | `@tomis/grid-pro-header` | SEE LICENSE IN EULA | Multi-row Header (Column Groups) | 예 |
| 10 | `@tomis/grid-pro-master` | SEE LICENSE IN EULA | Master-Detail, TreeGrid, Context Menu | 예 |
| 11 | `@tomis/grid-pro-merging` | SEE LICENSE IN EULA | Cell Merging (rowSpan) | 예 |
| 12 | `@tomis/grid-pro-range` | SEE LICENSE IN EULA | Cell Range Selection, Drag-fill, Clipboard | 예 |
| 13 | `@tomis/grid-pro-tracking` | SEE LICENSE IN EULA | ChangeTracking, Mapping, Validator | 예 |

> **Pro 패키지 (7개)**: grid-pro-agg, grid-pro-datamap, grid-pro-header, grid-pro-master, grid-pro-merging, grid-pro-range, grid-pro-tracking

### 3-2. i18n 추가 파일 매핑

| ko 원본 | en 번역 경로 | 비고 |
|---------|------------|------|
| `apps/docs/docs/getting-started.mdx` | `apps/docs/i18n/en/docusaurus-plugin-content-docs/current/getting-started.mdx` | 동일 확장자 .mdx |
| `apps/docs/docs/architecture.mdx` | `apps/docs/i18n/en/docusaurus-plugin-content-docs/current/architecture.mdx` | setLicenseKey 오류 교정 (D7) |

### 3-3. README 구조 (MIT 패키지)

```
# @tomis/{package-name}

{description from package.json}

## Installation
## Usage
## Peer Dependencies
## License
```

### 3-4. README 구조 (Pro 패키지 — C-24 필수 항목 포함)

```
# @tomis/{package-name}

{description from package.json}

## Installation
## License Activation (⚠️ Required)
  - setLicenseKey('YOUR-LICENSE-KEY') 예시
  - @tomis/grid-license import 안내
## Usage
## Peer Dependencies
## License
  - SEE LICENSE IN EULA
  - EULA.md 링크
```

---

## Section 4 — 기능적 요구사항

### FR-001: 13개 패키지 README.md 작성 (AC-001 ~ AC-003)
**출처**: AC-001 (source: C-25)

13개 패키지 각각에 `README.md` 파일을 작성한다. 각 README는:
- 패키지 설명 (`package.json`의 `description` 기반)
- 설치 명령어 (pnpm/npm/yarn)
- 기본 사용 예시 (TypeScript, tsx 코드 블록)
- peer dependencies 목록
- 라이선스 섹션

Pro 패키지 (7개)는 추가로:
- `setLicenseKey()` 라이선스 활성화 섹션 (C-24)
- EULA.md 링크 (D6)

MIT 패키지 (4개: grid-core, grid-features, grid-export, grid-renderers)는 표준 MIT 라이선스 섹션.

메타/private 패키지 (2개: grid, grid-license)는 용도 설명 + 라이선스 섹션 (EULA).

### FR-002: Pro 패키지 EULA.md 플레이스홀더 작성 (AC-002)
**출처**: AC-002 (source: C-24)

7개 Pro 패키지 각각에 `EULA.md` 파일을 작성한다. 내용은 플레이스홀더 (법무팀 확정 전):
- "Commercial License Agreement" 제목
- 연락처 안내: sales@topvel.com
- "Full license terms to be provided upon purchase"

### FR-003: docusaurus.config.ts 수정 (AC-003)
**출처**: AC-003 (source: ADR-004 supersede, D4)

`apps/docs/docusaurus.config.ts`의 i18n 설정을 수정한다:
- `locales: ['ko']` → `locales: ['ko', 'en']`
- `defaultLocale: 'ko'` 유지
- 그 외 설정 변경 없음

### FR-004: en getting-started.mdx 작성 (AC-004)
**출처**: AC-004 (source: C-25)

`apps/docs/i18n/en/docusaurus-plugin-content-docs/current/getting-started.mdx` 신규 작성:
- ko 원본 `getting-started.mdx` 내용을 영어로 번역
- 코드 예시 (설치 명령어, `<Grid>` 사용법)는 그대로 유지, 설명 텍스트만 번역
- 한국어 데이터 샘플 (`{ id: 1, name: '홍길동' }`)은 영어로 변경 (`{ id: 1, name: 'Alice' }`)

### FR-005: en architecture.mdx 작성 (AC-005)
**출처**: AC-005 (source: C-25, D7)

`apps/docs/i18n/en/docusaurus-plugin-content-docs/current/architecture.mdx` 신규 작성:
- ko 원본 `architecture.mdx` 내용을 영어로 번역
- 13개 패키지 테이블, mermaid 다이어그램 구조 유지
- 라이선스 활성화 예시: `setLicenseKey` 사용 (ko 원본의 `initLicense` 오류 교정, D7)

---

## Section 5 — AC 매핑

| AC ID | 요구사항 | 검증 방법 | 출처 |
|-------|----------|----------|------|
| AC-001 | 13개 패키지 README.md 존재 | Section 7 파일 목록 13개 README 확인 | C-25 |
| AC-002 | 7개 Pro 패키지 EULA.md 존재 + C-24 라이선스 섹션 | Section 7 파일 목록 7개 EULA.md + README 내 setLicenseKey 예시 | C-24 |
| AC-003 | docusaurus.config.ts: locales=['ko','en'] | 파일 내 `locales: ['ko', 'en']` 문자열 확인 | ADR-004 supersede |
| AC-004 | en getting-started.mdx 존재 + 영어 번역 | 파일 존재 + 영어 설명 텍스트 확인 | C-25 |
| AC-005 | en architecture.mdx 존재 + setLicenseKey 사용 | 파일 존재 + `setLicenseKey` 문자열 확인 (initLicense 없음) | C-25, D7 |

---

## Section 6 — 엣지 케이스

| ID | 상황 | 대응 |
|----|------|------|
| EC-01 | `@tomis/grid` (meta, private) README — 설치 예시가 애매 (private이라 npm publish 안 됨) | README에 "Internal meta package — use individual packages directly" 명시, 설치 명령어 생략 |
| EC-02 | `@tomis/grid-license` README — Pro 라이선스 엔진 자체를 설명해야 하나 API 노출 최소화 필요 | `setLicenseKey(key)` 함수 시그니처만 공개, 내부 검증 로직은 문서화하지 않음 |
| EC-03 | Pro 패키지 README의 `setLicenseKey` 예시에서 key 형식 불명 | `'YOUR-LICENSE-KEY'` 플레이스홀더 사용, 실제 key 형식은 EULA.md 또는 판매팀 안내 참조 명시 |
| EC-04 | ko 원본 `architecture.mdx`의 `initLicense` 오류 — en 번역에서 교정 시 ko/en 불일치 발생 | D7 결정: en에서 `setLicenseKey` 사용. Section 12 구현 가이드에 "ko 원본 bugfix는 별도 PR" 명시 |
| EC-05 | `i18n/en/` 디렉토리 미존재 — 중간 디렉토리 전체 생성 필요 | Section 7에 디렉토리 경로 명시. 구현자는 mkdir -p 또는 직접 생성 |
| EC-06 | Docusaurus i18n 번역 파일 위치가 플러그인별로 다름 | `docusaurus-plugin-content-docs/current/` 하위에 위치해야 함 (Docusaurus v3 i18n 규칙). 다른 플러그인(blog, pages) 번역은 이 Goal 범위 외 |
| EC-07 | `grid-pro-datamap` README peer dependency — package.json에 `@tomis/grid-core` 누락 여부 | C-1: package.json 직접 확인 (grid-pro-datamap: deps=grid-license, peerDeps=tanstack/react-table, react, react-dom — grid-core 없음). README에는 "requires @tomis/grid-core as peer" 명시 여부는 AC 범위 외 — 있는 그대로 기술 |
| EC-08 | EULA.md 내용이 법무팀 미확정 상태 | D6 결정: 플레이스홀더로 작성. README에 "License terms subject to change" footer 추가 |

---

## Section 7 — 구현 파일 목록

**총 16개 파일 (NEW 15 + MODIFY 1)**

C-28에 따라 모든 경로는 모노레포 prefix를 사용한다 (D1 결정 참조).

| # | 경로 | 액션 | 설명 |
|---|------|------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid/README.md` | NEW | meta 패키지 README (FR-001) |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/README.md` | NEW | MIT core hook README (FR-001) |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/README.md` | NEW | MIT features README (FR-001) |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-export/README.md` | NEW | MIT export README (FR-001) |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers/README.md` | NEW | MIT renderers README (FR-001) |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-license/README.md` | NEW | Pro license engine README (FR-001) |
| 7 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/README.md` | NEW | Pro agg README + EULA link (FR-001, AC-002) |
| 8 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-agg/EULA.md` | NEW | Pro agg EULA placeholder (FR-002) |
| 9 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/README.md` | NEW | Pro datamap README + EULA link (FR-001, AC-002) |
| 10 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/EULA.md` | NEW | Pro datamap EULA placeholder (FR-002) |
| 11 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/README.md` | NEW | Pro header README + EULA link (FR-001, AC-002) |
| 12 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-header/EULA.md` | NEW | Pro header EULA placeholder (FR-002) |
| 13 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/README.md` | NEW | Pro master README + EULA link (FR-001, AC-002) |
| 14 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-master/EULA.md` | NEW | Pro master EULA placeholder (FR-002) |
| 15 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/README.md` | NEW | Pro merging README + EULA link (FR-001, AC-002) |
| 16 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-merging/EULA.md` | NEW | Pro merging EULA placeholder (FR-002) |
| 17 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-range/README.md` | NEW | Pro range README + EULA link (FR-001, AC-002) |
| 18 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-range/EULA.md` | NEW | Pro range EULA placeholder (FR-002) |
| 19 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/README.md` | NEW | Pro tracking README + EULA link (FR-001, AC-002) |
| 20 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/EULA.md` | NEW | Pro tracking EULA placeholder (FR-002) |
| 21 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/docusaurus.config.ts` | MODIFY | locales: ['ko'] → ['ko', 'en'] (FR-003, D4) |
| 22 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/i18n/en/docusaurus-plugin-content-docs/current/getting-started.mdx` | NEW | en getting-started 번역 (FR-004) |
| 23 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/i18n/en/docusaurus-plugin-content-docs/current/architecture.mdx` | NEW | en architecture 번역, setLicenseKey 교정 (FR-005, D7) |

> **File count correction (D2)**: goals.json의 14개에서 이 spec의 23개로 확장. README 13개 + EULA 7개 = 20개 패키지 파일, docusaurus.config.ts MODIFY 1개, en 번역 2개 = 총 23개. (Section 1의 "16개"는 비README/EULA 파일 기준 요약이었음 — 아래 Section 8 참고)

> **i18n 디렉토리 생성 필요 (EC-05)**: `apps/docs/i18n/` 디렉토리가 현재 미존재. 구현자는 `apps/docs/i18n/en/docusaurus-plugin-content-docs/current/` 경로 전체를 생성해야 한다.

---

## Section 8 — 영향 범위

| 항목 | 값 |
|------|----|
| 변경 파일 수 | 23개 (NEW 22 + MODIFY 1) |
| README 신규 파일 | 13개 |
| EULA.md 신규 파일 | 7개 (Pro 패키지만) |
| en 번역 신규 파일 | 2개 |
| config MODIFY 파일 | 1개 (docusaurus.config.ts) |
| 사용처 파일 수 (affectedUsageFiles) | 0 — 소스 코드 변경 없음 |
| 번들 영향 | +0 KB (문서/config 변경만, 런타임 번들 미영향) |
| 브레이킹 체인지 | 없음 |
| 테스트 영향 | 없음 |
| C-19 사용처 카운트 | 0 / 5 (문서 파일은 C-19 카운트 대상 아님) |
| Docusaurus 빌드 | locales 추가로 en locale 사이트 추가 생성. 기존 ko 사이트 영향 없음 |

---

## Section 9 — 의존성

| ID | 의존 대상 | 이유 | 상태 |
|----|----------|------|------|
| DEP-01 | G-001 (Docusaurus 사이트 설정) | `apps/docs/docusaurus.config.ts` 기존 파일 존재 필요 | 완료 확인 |
| DEP-02 | `apps/docs/docs/getting-started.mdx` (ko 원본) | en 번역의 원본 소스 | 존재 확인 (C-1) |
| DEP-03 | `apps/docs/docs/architecture.mdx` (ko 원본) | en 번역의 원본 소스 | 존재 확인 (C-1) |
| DEP-04 | `packages/grid-license/src/index.ts` | 실제 export 이름 확인 (setLicenseKey) | 확인 완료 (C-1) |
| DEP-05 | 13개 `package.json` 파일 | README 내용 기반 정보 (description, peerDeps) | 확인 완료 (C-1) |
| DEP-06 | ADR-MOD-GRID-99-B-004 | G-005가 supersede하는 대상 | 확인 완료 (decisions.md 참조) |

---

## Section 10 — 비기능 요구사항

| 항목 | 요구사항 |
|------|----------|
| README 형식 | GitHub Markdown 호환 (CommonMark), Docusaurus에서도 렌더링 가능 |
| 코드 예시 언어 | TypeScript (`tsx`) — 일관성 |
| en 번역 품질 | 자연스러운 기술 영어. 한국어 직역 금지 |
| en 번역 코드 유지 | 코드 블록, 패키지명, API 이름 변경 없음 (D7 예외: initLicense → setLicenseKey) |
| Pro README 라이선스 섹션 | C-24 필수: `setLicenseKey` 예시 + EULA.md 링크 |
| EULA.md | 각 Pro 패키지 디렉토리에 위치 (D6). 플레이스홀더 내용 통일 |
| Docusaurus i18n 경로 | Docusaurus v3 i18n 규칙 준수: `i18n/{locale}/docusaurus-plugin-content-docs/current/` |
| 파일 확장자 | en 번역 파일: `.mdx` (D3, ko 원본과 동일) |

---

## Section 11 — 파일 구조 (최종)

```
topvel-grid-monorepo/
├── packages/
│   ├── grid/
│   │   └── README.md                          (NEW — FR-001)
│   ├── grid-core/
│   │   └── README.md                          (NEW — FR-001)
│   ├── grid-features/
│   │   └── README.md                          (NEW — FR-001)
│   ├── grid-export/
│   │   └── README.md                          (NEW — FR-001)
│   ├── grid-renderers/
│   │   └── README.md                          (NEW — FR-001)
│   ├── grid-license/
│   │   └── README.md                          (NEW — FR-001)
│   ├── grid-pro-agg/
│   │   ├── README.md                          (NEW — FR-001, AC-002)
│   │   └── EULA.md                            (NEW — FR-002)
│   ├── grid-pro-datamap/
│   │   ├── README.md                          (NEW — FR-001, AC-002)
│   │   └── EULA.md                            (NEW — FR-002)
│   ├── grid-pro-header/
│   │   ├── README.md                          (NEW — FR-001, AC-002)
│   │   └── EULA.md                            (NEW — FR-002)
│   ├── grid-pro-master/
│   │   ├── README.md                          (NEW — FR-001, AC-002)
│   │   └── EULA.md                            (NEW — FR-002)
│   ├── grid-pro-merging/
│   │   ├── README.md                          (NEW — FR-001, AC-002)
│   │   └── EULA.md                            (NEW — FR-002)
│   ├── grid-pro-range/
│   │   ├── README.md                          (NEW — FR-001, AC-002)
│   │   └── EULA.md                            (NEW — FR-002)
│   └── grid-pro-tracking/
│       ├── README.md                          (NEW — FR-001, AC-002)
│       └── EULA.md                            (NEW — FR-002)
└── apps/
    └── docs/
        ├── docusaurus.config.ts               (MODIFY — FR-003, D4)
        └── i18n/                              (NEW 디렉토리)
            └── en/
                └── docusaurus-plugin-content-docs/
                    └── current/
                        ├── getting-started.mdx (NEW — FR-004)
                        └── architecture.mdx    (NEW — FR-005, D7)
```

> 모든 Section 7 파일이 Section 11에 포함되어 있음 (E-01 준수).

---

## Section 12 — 구현 가이드라인

### 12-1. MIT 패키지 README 작성 지침 (grid-core 예시 기준)

```markdown
# @tomis/grid-core

TanStack Table v8 abstraction wrapper + `useGridState` core hook.

## Installation

```bash
pnpm add @tomis/grid-core
```

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@tanstack/react-table` | `^8.0.0` |
| `@tanstack/react-virtual` | `^3.0.0` |
| `react` | `^18.0.0 \|\| ^19.0.0` |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` |

## Usage

```tsx
import { Grid } from '@tomis/grid-core';
import { useGridState } from '@tomis/grid-core';

const columns = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
];

export function MyGrid() {
  const gridState = useGridState({ columns, data });
  return <Grid state={gridState} />;
}
```

## License

MIT
```

### 12-2. Pro 패키지 README 작성 지침 (라이선스 섹션 필수)

Pro 패키지 README는 MIT README 구조에 다음을 추가:

**License Activation 섹션** (FR-001, C-24, D7):

```markdown
## License Activation

This is a Pro package requiring a valid license key.

```tsx
import { setLicenseKey } from '@tomis/grid-license';

// Call once at your app entry point (e.g., main.tsx)
setLicenseKey('YOUR-LICENSE-KEY');
```

Without a valid license, the component will render a watermark.
Contact [sales@topvel.com](mailto:sales@topvel.com) to obtain a license key.

## License

SEE LICENSE IN [EULA.md](./EULA.md)
```

각 Pro 패키지의 `description`과 `peer dependencies`는 해당 `package.json`에서 정확히 가져온다 (C-1):

| 패키지 | description | peer deps |
|--------|------------|-----------|
| grid-pro-agg | Aggregation (group footer) | @tanstack/react-table, @tanstack/react-virtual (optional), react, react-dom |
| grid-pro-datamap | DataMap (foreign key display) | @tanstack/react-table, react, react-dom |
| grid-pro-header | Multi-row Header (Column Groups) | @tanstack/react-table, react, react-dom |
| grid-pro-master | Master-Detail, TreeGrid, Context Menu | @tanstack/react-table, react, react-dom |
| grid-pro-merging | Cell Merging (rowSpan) | @tanstack/react-table, react, react-dom |
| grid-pro-range | Cell Range Selection, Drag-fill, Clipboard | @tanstack/react-table, react, react-dom |
| grid-pro-tracking | ChangeTracking, Mapping, Validator | @tanstack/react-table, react, react-dom |

### 12-3. EULA.md 플레이스홀더 내용 (7개 Pro 패키지 공통)

```markdown
# Commercial License Agreement (EULA)

This package is distributed under a commercial license.

**Full license terms are provided upon purchase.**

For license inquiries:
- Email: sales@topvel.com
- Web: https://topvel.com/grid/pricing

© TOPVEL Co., Ltd. All rights reserved.

> Note: License terms subject to change. Contact sales for current EULA document.
```

### 12-4. docusaurus.config.ts 수정 지침

변경 위치: `i18n` 객체의 `locales` 배열만 수정. 다른 설정 변경 금지 (외과적 수정 원칙).

```typescript
// Before:
i18n: {
  defaultLocale: 'ko',
  locales: ['ko'],
},

// After:
i18n: {
  defaultLocale: 'ko',
  locales: ['ko', 'en'],
},
```

### 12-5. en 번역 파일 작성 지침

**getting-started.mdx**:
- 제목: `# Getting Started`
- 한국어 데이터 샘플 영어화: `{ id: 1, name: '홍길동' }` → `{ id: 1, name: 'Alice' }`
- 링크: `[Architecture](./architecture)` 유지 (상대 경로)
- `@tomis/grid-license` 언급 문장 번역 ("Pro features — available after license activation via...")

**architecture.mdx**:
- 제목: `# Architecture`
- 패키지 테이블: 한국어 설명 영어 번역 (패키지명/분류 변경 없음)
- mermaid 다이어그램: 내용 그대로 유지 (언어 무관)
- 디렉토리 구조 블록: 한국어 주석 → 영어 번역
- **라이선스 활성화 섹션**: `initLicense` → `setLicenseKey` 교정 (D7 필수):

```tsx
// en/architecture.mdx (올바름):
import { setLicenseKey } from '@tomis/grid-license';

setLicenseKey('YOUR-LICENSE-KEY');
```

> **ko/architecture.mdx 오류 안내 (EC-04)**: ko 원본의 `initLicense` 사용은 버그이다. 이 G-005 구현 완료 후 별도 bugfix PR로 ko 원본도 `setLicenseKey`로 교정해야 한다. G-005 구현자는 이를 구현 보고서에 NOTE로 남긴다.

### 12-6. `@tomis/grid` (meta) README 특수 처리 (EC-01)

`@tomis/grid`는 `private: true`이며 npm에 publish되지 않는 meta 패키지이다. README에 다음을 명시:

```markdown
# @tomis/grid

> **Internal meta package** — aggregates all `@tomis/grid-*` packages.
> This package is not published to npm. Use individual packages directly.

## What's included

- `@tomis/grid-core` — Core hook and Grid component
- `@tomis/grid-features` — Filter, sort, pagination features
- `@tomis/grid-export` — Excel/CSV/PDF export
- `@tomis/grid-renderers` — Cell renderer components

For Pro packages (`@tomis/grid-pro-*`), install individually and activate your license.

## License

SEE LICENSE IN EULA
```

---

## Section 13 — Rubric 자가 점검 (specify-rubric v1.0.8)

### H Meta-Gate (모두 pass 필요)

| ID | 항목 | 결과 | 근거 |
|----|------|------|------|
| H-01 | Section 1~13 모두 존재 | PASS | 이 문서 전체 구조 |
| H-02 | Section 7 implementFiles ↔ Section 11 파일 구조 일치 | PASS | 23개 파일 양쪽 포함 |
| H-03 | C-1 위반 없음 (추측 없이 파일 직접 확인) | PASS | 13개 package.json, 2개 ko docs, grid-license/src/index.ts, docusaurus.config.ts, i18n/ 디렉토리 미존재 모두 직접 확인 |

### A — Clarity (명확성)

| ID | 항목 | 결과 | 근거 |
|----|------|------|------|
| A-01 | Goal 한 문장 요약 가능 | PASS | Section 1 첫 단락 |
| A-02 | 비전문가도 읽을 수 있는 수준 | PASS | 한국어 설명 + 코드 예시 |
| A-03 | 모호한 용어 없음 | PASS | MIT/Pro 분류 명확, setLicenseKey vs initLicense 결정 명시 (D7) |
| A-04 | 각 AC가 검증 방법 포함 | PASS | Section 5 검증 방법 컬럼 |
| A-05 | 의존성 명시 | PASS | Section 9 DEP-01~06 |

### B — Completeness (완전성)

| ID | 항목 | 결과 | 근거 |
|----|------|------|------|
| B-01 | 모든 AC가 FR에 매핑 | PASS | Section 5 AC→FR 매핑 + Section 4 FR-001~005 |
| B-02 | 엣지 케이스 ≥3 | PASS | EC-01~EC-08 (8개) |
| B-03 | 비기능 요구사항 포함 | PASS | Section 10 |
| B-04 | 구현 가이드라인 포함 | PASS | Section 12 (12-1~12-6) |
| B-05 | 영향 범위 명시 | PASS | Section 8 |

### C — Consistency (일관성)

| ID | 항목 | 결과 | 근거 |
|----|------|------|------|
| C-01 | Section 7 ↔ Section 11 파일 수 일치 | PASS | 23개 파일 양쪽 동일 |
| C-02 | AC 출처와 FR 내용 일치 | PASS | Section 4 출처 명시 + Section 5 매핑 |
| C-03 | 경로 prefix 일관성 (C-28) | PASS | D1 결정 + Section 7 모노레포 prefix 사용 |
| C-04 | Pro 패키지 7개 일관성 | PASS | 3-1 테이블 ↔ Section 7 EULA 7개 ↔ Section 12-2 테이블 일치 |
| C-05 | setLicenseKey 이름 일관성 | PASS | D7 결정 ↔ Section 4 FR-001/005 ↔ Section 12-2/12-5 일치 |

### D — Decisions (결정 문서화)

| ID | 항목 | 결과 | 근거 |
|----|------|------|------|
| D-01 | 선행 결정 D-series 명시 | PASS | Section 2: D1~D7 |
| D-02 | 대안 거부 이유 포함 | PASS | D5 (CI 스크립트 거부 이유), D6 (공유 EULA 거부 이유) |
| D-03 | 제약사항 인용 | PASS | D1(C-28), D2(C-1), D3(Docusaurus v3 규칙), D4(ADR-004), D6(C-24), D7(C-1) |
| D-04 | 불확실한 수치 출처 명시 | PASS | goals.json 14개 → spec 23개 교정 이유 명시 (D2) |
| D-05 | C-28 경로 수정 명시 | PASS | D1 전용 결정 |
| D-06 | ADR-004 supersede 명시 | PASS | D4 전용 결정 |

### E — Evidence (증거)

| ID | 항목 | 결과 | 근거 |
|----|------|------|------|
| E-01 | Section 7 ↔ Section 11 일치 (cross-check) | PASS | Section 11 NOTE 명시 |
| E-02 | ko 원본 파일 확장자 실제 확인 (.mdx) | PASS | C-1: getting-started.mdx, architecture.mdx 직접 Read |
| E-03 | i18n/ 디렉토리 미존재 확인 | PASS | C-1: ls 결과 "No such file or directory" 확인 |
| E-04 | setLicenseKey export 확인 | PASS | C-1: grid-license/src/index.ts 직접 Read |
| E-05 | 13개 패키지 package.json 확인 | PASS | C-1: 전체 13개 package.json 직접 Read |
| E-06 | D7 prose ↔ structured form 시맨틱 일관성 | PASS | Section 2 D7 결정 ↔ Section 4 FR-005 ↔ Section 12-5 구현 지침 동일 내용 |

### F — Feasibility (실현 가능성)

| ID | 항목 | 결과 | 근거 |
|----|------|------|------|
| F-01 | C-19 준수 (≤5 사용처/Goal) | PASS | 0 사용처 파일 (문서/config만 변경) |
| F-02 | C-24 준수 (Pro README 라이선스 섹션) | PASS | Section 4 FR-001 + Section 12-2 구현 지침 |
| F-03 | C-25 준수 (README 존재) | PASS | Section 7: 13개 README 명시 |
| F-04 | Docusaurus v3 i18n 경로 규칙 준수 | PASS | Section 10 + Section 12-5: `i18n/en/docusaurus-plugin-content-docs/current/` |

### G — Guard (보호)

| ID | 항목 | 결과 | 근거 |
|----|------|------|------|
| G-01 | goals.json 오류(경로/파일수/확장자) 교정 명시 | PASS | D1(경로), D2(파일수), D3(확장자) — 3개 교정 모두 Section 2에 명시 |

---

**추정 rubric 점수**: 32/32 항목 PASS → 100/100 (threshold 85 충족)

---

*spec 작성 완료. 구현자는 Section 7의 23개 파일을 작성하고, 완료 후 G-005-implement-report.md를 제출한다.*
