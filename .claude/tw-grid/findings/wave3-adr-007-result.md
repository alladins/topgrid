# ADR-007 실행 결과 — storage adapter 추출

**실행일**: 2026-05-17
**Wave**: 3 (ADR-009 옵션 A 완료 후 — `useColumnOrderPersist` 가 grid-features → grid-core/internal/column-drag 이동된 상태에서 진행)
**상태**: completed (4 hook 모두 adapter 경유; typecheck/build PASS; 단위 test baseline 부재 — 본 ADR 실행조건 미충족 알려진 한계)

## 변경 요약

1. **`grid-core/src/internal/storage/`** 신설 — SSR-safe Web Storage primitive 함수 세트
   - `storageAdapter.ts` — `getStorage` / `readJson` / `readRaw` / `writeJson` / `writeRaw` / `removeKey` + `type StorageType`
   - `index.ts` — barrel + `@internal` JSDoc (애플리케이션 코드 import 금지 명시)
2. **`grid-core/package.json`** — `./internal/storage` subpath export 추가 (`./legacy` 와 동일 convention)
3. **`grid-core/tsup.config.ts`** — `src/internal/storage/index.ts` multi-entry 추가
4. **4 hook 내부 구현 변경** (외부 API 0 변경):
   - `useStoragePersist` (grid-core) — `{v, p}` URLSearchParams envelope 유지, SSR + try/catch + JSON I/O 만 adapter 경유
   - `useColumnPersistence` (grid-core, @deprecated ADR-013) — `{v, data}` JSON envelope 유지, adapter 경유. deprecation marker 보존
   - `useColumnOrderPersist` (grid-core/internal/column-drag, ADR-009 이동 완료) — raw array envelope 유지, adapter 경유
   - `useExpandedPersistence` (grid-pro-master) — `@tomis/grid-core/internal/storage` deep import 경유. `[expanded, setExpanded]` tuple + in-memory fallback + dev warning 보존
5. **CHANGELOG + Changeset** — minor (internal refactor + new internal-only subpath export)
6. **ADR 본문 amendment** — Implementation Note 추가 (`useTypedLocalStorage` → 함수 primitive 조정 이유 + cross-package internal sharing 결정 + LOC framing 정직화)

## 변경 파일 목록

| 파일 | 변경 | 비고 |
|------|------|------|
| `packages/grid-core/src/internal/storage/storageAdapter.ts` | **신설** 150 LOC | 6 primitive helper + `StorageType` type |
| `packages/grid-core/src/internal/storage/index.ts` | **신설** 26 LOC | barrel + `@internal` JSDoc |
| `packages/grid-core/src/useStoragePersist.ts` | 147 → 146 LOC | adapter 경유. 외부 API 0 변경 |
| `packages/grid-core/src/column/useColumnPersistence.ts` | 153 → 151 LOC | adapter 경유. `@deprecated` ADR-013 보존 |
| `packages/grid-core/src/internal/column-drag/useColumnOrderPersist.ts` | 87 → 76 LOC | adapter 경유 |
| `packages/grid-pro-master/src/internal/useExpandedPersistence.ts` | 198 → 165 LOC | `@tomis/grid-core/internal/storage` deep import |
| `packages/grid-core/package.json` | exports + 1 entry | `./internal/storage` subpath |
| `packages/grid-core/tsup.config.ts` | entry +1 | `src/internal/storage/index.ts` |
| `packages/grid-core/CHANGELOG.md` | + ADR-007 entry | Wave 3 헤더 |
| `packages/grid-pro-master/CHANGELOG.md` | + ADR-007 entry | Internal 변경 |
| `.changeset/adr-007-storage-adapter.md` | **신설** | minor: grid-core + grid-pro-master |
| `.claude/tw-grid/decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md` | ADR-007 amendment | 결과 체크리스트 + Implementation Note |

## LOC 측정 (정직 framing)

```
4 hook (before): 147 + 153 +  87 + 198 = 585 LOC
4 hook (after):  146 + 151 +  76 + 165 = 538 LOC  (−47 LOC across hooks)
Adapter added:                            176 LOC  (150 + 26)
Net total:                              +129 LOC
```

- ADR 본문 §8.3 예상 절감 ~80 LOC 는 boilerplate 라인 기준 (단일 hook 의 SSR+try/catch+JSON 보일러플레이트만). 실 측정은 adapter 자체 LOC 포함 net 거의 중립.
- **본 ADR 의 실 가치는 LOC golf 아닌 drift 방지**:
  - `localStorage.getItem` / `setItem` / `removeItem` 직접 호출 = 4 site → 1 site (production code grep)
  - `sessionStorage.*` 직접 호출 = 4 site → 1 site
  - `typeof window === 'undefined'` SSR guard = 4 site → 1 site
  - `try { JSON.parse } catch` 패턴 = 4 site → 1 site
  - `QuotaExceededError` 처리 = 4 site → 1 site

## 검증 결과

| 항목 | 결과 | 비고 |
|------|------|------|
| `pnpm -r typecheck` | **PASS** | 14 packages (Scope: 14 of 15 workspace projects) |
| `pnpm -r --filter './packages/*' build` | **PASS** | 13 packages — grid-core dist 에 `dist/internal/storage/index.{mjs,cjs,d.ts,d.cts}` 생성 확인 |
| `pnpm -r build` (전체) | **PARTIAL** | apps/docs 의 docusaurus `customCss` validation 에러 — **사전 환경 문제, 본 ADR 무관** (다른 wave 변경에서도 동일 발생) |
| production `localStorage.(getItem\|setItem\|removeItem)` grep | **0 hit** | 4 hook source 내 직접 호출 0 — adapter 경유. test/stories 의 verification/demo 코드 + JSDoc 주석만 잔존 |
| production `sessionStorage.(getItem\|setItem\|removeItem)` grep | **0 hit** | 동일 |
| `internal/storage` import grep | **5 hit** | adapter 정의 + 4 hook 사용 |
| 4 hook 외부 API 변경 | **0** | 시그니처/반환 shape/옵션/envelope 모두 보존 |

## 결과 체크리스트

- [x] `grid-core/internal/storage/` 신설 (`useTypedLocalStorage` → 함수 primitive 세트로 조정 — 4 hook 의 이질 envelope/setter 패턴 호환)
- [x] 4 hook 통합 (외부 API 보존 — typecheck PASS)
- [x] **Public API 미승격** (ADR 본문 alternative #3 결정 존중 — `src/index.ts` main barrel 변경 0)
- [x] `./internal/storage` subpath export 만 추가 (`./legacy` 와 동일 convention) + `@internal` JSDoc
- [x] CHANGELOG (grid-core + grid-pro-master) + Changeset minor
- [x] typecheck/build PASS (apps/docs 사전 환경 문제 제외)
- [x] ADR-013 `useColumnPersistence` `@deprecated` JSDoc 유지
- [x] ADR-009 `useColumnOrderPersist` grid-core/internal/column-drag 위치 유지
- [x] ADR 본문 amendment (Implementation Note)

## 다른 Wave 3 agent 와의 conflict 검증

| Agent | 영역 | 본 ADR 과 충돌? |
|-------|------|------------------|
| ADR-002 (column/rendererRegistry) | `grid-core/src/column/rendererRegistry.ts` + grid-renderers | **No** — 다른 파일 |
| ADR-008 + ADR-016 (types.ts + legacy + tw-front) | `grid-core/src/types.ts` + `legacy/` + `tw-framework-front/src/types/tomis/grid.ts` | **No** — types.ts + tw-framework-front 측, 본 ADR 은 hook 내부 구현 + internal/storage 신설. 단 `grid-core/CHANGELOG.md` 헤더 영역에서 동시 편집 — 본 agent 가 ADR-016+008 entry 위에 ADR-007 entry 를 추가하는 형태로 merge 충돌 회피 |
| ADR-013 (deprecation) | `grid-core/src/index.ts` 의 `@deprecated` JSDoc + types.ts | **No** — ADR-013 의 `useColumnPersistence` deprecation marker 는 본 ADR 의 body 변경과 호환 (Read → Edit 패턴으로 deprecation alias 보존) |

CHANGELOG.md 헤더 영역의 timing race 만 한 번 발생 — Edit 재시도로 해소.

## 알려진 한계

1. **단위 test baseline 부재** — ADR 본문 실행조건 (4 hook 의 단위 테스트 baseline 확보) 미충족. `pnpm vitest run` 시 4 test file (`useStoragePersist.test.ts` / `useUrlSync.test.ts` / `ColumnVisibilityMenu.test.tsx` / `useColumnPersistence.test.ts`) 이 `Cannot find package '@testing-library/react'` 로 fail — 본 ADR 시작 이전부터 환경 상태 (사전 baseline 없음). 별도 후속 cycle 에서 `@testing-library/react` 설치 + 단위 test baseline 확보 필요.
2. **Runtime behavioural parity 미검증** — typecheck/build PASS 는 시그니처 보존만 보장. debounce timing, mount-restore 순서, `useStoragePersist` 의 `{v, p}` envelope 파싱 분기 (raw JSON.parse 실패 vs 구조 검증 실패), `useExpandedPersistence` 의 `warnedUnavailable` 일회성 dev warning 누적, QuotaExceededError 의 `quotaWarnLabel` 분기 — 모두 runtime test 부재. 코드 read 기반 시각 검증 + adapter 의 silent-skip semantic 보존 확인만 완료.
3. **Cross-package `@internal` 강제 부재** — `@tomis/grid-core/internal/storage` 는 subpath 노출이라 외부 사용자가 deep import 가능. `@internal` JSDoc 은 lint 룰 없으면 강제력 없음. eslint-plugin-jsdoc + `no-restricted-imports` 룰 또는 별도 ADR 후속 권장.
4. **`useColumnPersistence` 의 SSR 조건 미세 변화** — 원본은 `isEnabled = storageKey !== '' && typeof window !== 'undefined'` 로 effect 자체 skip; 본 변경은 `isEnabled = storageKey !== ''` + adapter null 반환 으로 effect 실행 + I/O no-op. **결과는 동등** (server 에서 read/write 0; runtime 차이 없음), 단 effect 의 deps 가 SSR/CSR 사이에서 동일하게 평가됨. React strict mode 의 effect re-run 패턴엔 영향 없음.
5. **ADR-013 `useColumnPersistence` 다음 major 제거 시기** — 본 ADR 의 adapter 가 superseder. 다음 major (1.0.0) 에서 public export 제거 권고 ADR-013 결정 유지.
6. **`useStoragePersist` 의 미래 public API 진화 가능성** — 본 ADR 은 `useStoragePersist` 의 외부 API 를 보존. GridState envelope hook 자체는 public 으로 유지 (사용자 사용 0 이지만 deprecation 결정 없음). 후속 cycle 에서 deprecation 또는 generic primitive (`useTypedLocalStorage<T>`) public 승격 여부 별도 결정 필요.

## Status

`completed` — typecheck/build PASS, production code 의 localStorage 직접 호출 0건 grep 검증, 4 hook 외부 API 변경 0. ADR 본문 결정의 핵심 (drift 단일 지점 + 사용자 영향 0 + internal 한정) 충족. 단위 test runtime parity 검증은 baseline 부재 후속 cycle 위임.
