# G-004-spec.md — MOD-GRID-12/datamap
## 동적 옵션 비동기 로드 + 캐싱 (createAsyncDataMap) + Pro 라이선스 런타임 완전 통합

**specVersion**: 1.0.0
**goalId**: G-004
**moduleId**: MOD-GRID-12
**area**: datamap
**rubricVersion**: 1.0.7
**priority**: P0
**migrationImpact**: medium
**threshold**: 90
**licenseTier**: Pro
**packageTarget**: packages/grid-pro-datamap
**createdAt**: 2026-05-15
**status**: draft
**선행 Goal**: MOD-GRID-12/G-001 (DataMap API — 완료), MOD-GRID-12/G-002 (DataMapCell — 완료), MOD-GRID-12/G-003 (DataMapEditor — 완료)

---

## ★ Pre-decisions Table (D-1–D-9)

| # | 결정 사항 | 이유 / 근거 |
|---|-----------|-------------|
| D-1 | `implementFiles` 경로 prefix 정정: goals.json의 `D:/project/topvel_project/TOMIS/packages/...` → 실제 위치 `D:/project/topvel_project/topvel-grid-monorepo/packages/...` (C-28 + ADR-MOD-GRID-00-001). Section 7 파일 표가 권위 (C-30). | goals.json discover 단계 자동 생성 시 TOMIS prefix 오기재. C-28 적용 범위 MOD-GRID-02~16 포함. G-001·G-002·G-003 동일 정정 선례 확인. |
| D-2 | `package.json` version `0.0.0` → `0.1.0` minor bump. G-004에서 새로운 public export(`createAsyncDataMap`, `AsyncDataMap`, `AsyncDataMapState`, `CreateAsyncDataMapOptions`) 추가 — semver minor 규칙 적용 (신규 API 추가, breaking 없음). | G-001·G-002·G-003까지 0.0.0 유지. G-004에서 최초 안정 Pro API 완성 → minor 0.1.0. C-23 호환성 정책: breaking = false. |
| D-3 | `EULA.md` 변경 없음 — goals.json L406 기재에도 불구하고 G-004 deliverable에서 제외. goals.json 자동 생성 artefact에 EULA.md가 잔존했으나 G-001에서 이미 완료된 파일. 수정 불필요. (Section 7 미포함, goals.json L406 잔존은 정상 — C-30: Section 7이 권위) | G-001 implement에서 EULA.md 작성 완료. G-004 scope는 createAsyncDataMap + asyncCache. 불필요한 파일 재기재는 rubric D-항목 오해 유발. |
| D-4 | 비동기 캐싱: 자체 `Map<string, { items: TItem[]; loadedAt: number }>` + `staleTime` ms 구현. SWR / react-query / tanstack-query 등 외부 캐싱 라이브러리 도입 금지 (C-22 의존성 최소화). 캐시 키 = 단일 AsyncDataMap 인스턴스당 1개 (`'__default__'` 고정). | C-22: 외부 라이브러리 신규 도입은 별도 ADR 필요. staleTime 기반 단순 Map 캐시로 AC-003 요구사항 완전 충족. AC-005 ADR에서 trade-off 기록. |
| D-5 | Race condition(concurrent load) de-dupe: `load()` 호출 시 state가 `'loading'`이면 진행 중인 `Promise<TItem[]>`를 공유 (`pendingPromise` ref). 새 `load()` 호출은 같은 Promise 반환 — 중복 HTTP 요청 없음. | 동일 AsyncDataMap 인스턴스에 여러 DataMapEditor가 동시 mount될 때 중복 loader() 호출 방지. 비동기 상태머신 정확성 보장. |
| D-6 | Docusaurus 문서 경로 명시: `docs/grid-pro/datamap/createAsyncDataMap.mdx` (실제 파일은 IMPLEMENT 단계 작성). G-003 spec 선례: F-03 항목 NO 방지용 명시적 경로 사전 선언. | G-002 specify에서 F-03 NO 발생 원인: 문서 경로 미명시. G-003·G-004 동일 실수 방지. 파일 생성은 IMPLEMENT 단계 책임. |
| D-7 | 라이선스 검증 추가 호출 불필요: G-001 구현 완료로 `grid-pro-datamap/src/index.ts` L7-11에 `verifyOrWarn` inline stub 존재 (C-33 + ADR-MOD-GRID-00-012). `createAsyncDataMap.ts`는 package 진입점이 아니므로 별도 라이선스 호출 없음. index.ts MODIFY는 export 추가만. AC-004 "Pro 패키지 전체 검증"은 기존 index.ts L7-11 stub 확인으로 충족. | C-33 Pro 패키지 inline stub 정책. 중복 호출 금지. G-001·G-002·G-003과 동일 결론. MOD-GRID-99-A/G-002 미구현 상태 유지 — 완료 후 실제 grid-license로 교체 예정. |
| D-8 | `internal/asyncCache.ts` C-31 Wiring Audit 명시: `createAsyncDataMap.ts`에서 `asyncCache`를 `import`하고 실제 `load()` 함수 내에서 호출하여 dead code 방지. spec Section 12 Wiring Audit 표에 import ↔ call-site 명시. | C-31: 기능 배선 감사 — 파일 존재 + import 선언만으로는 불충분. 실제 함수 내 invocation까지 명세해야 rubric E-02 Before/After + G-01 TBD=0 달성 가능. |
| D-9 | `decisions/MOD-GRID-12-decisions.md` NEW 파일 생성: AC-005 ADR 요구사항 "async 캐싱 전략 결정 (대안: SWR/react-query vs 자체 Map 캐시), trade-off 포함". goals.json implementFiles에 미포함이나 AC-005 충족을 위해 Section 7에 명시적 추가. G-001 AC-007 ADR(DataMap API 시그니처)와 동일 파일 — AC-005용 섹션 추가. | G-001 AC-007: decisions/MOD-GRID-12-decisions.md ADR DataMap API 시그니처 결정. G-004 AC-005: 동일 파일에 async 캐싱 ADR 섹션 추가. 파일 미존재 시 NEW, 존재 시 MODIFY. 실제 파일 확인은 IMPLEMENT 단계 책임. |

---

## Section 0 — 메타

| 항목 | 값 |
|------|-----|
| goalId | G-004 |
| title | 동적 옵션 비동기 로드 + 캐싱 (createAsyncDataMap) + Pro 라이선스 런타임 완전 통합 |
| migrationImpact | medium |
| threshold | 90 |
| licenseTier | Pro |
| packageTarget | `packages/grid-pro-datamap` |
| rubricVersion | 1.0.7 |
| 선행 Goal | MOD-GRID-12/G-001 (완료), G-002 (완료), G-003 (완료) |
| implementFiles | NEW 4개 + NEW or MODIFY 1개 + MODIFY 4개 = 9개 (Section 7 표가 권위) |
| bundleImpact | +2 KB (createAsyncDataMap + asyncCache 추가); 실측은 IMPLEMENT 시점 (ADR-MOD-GRID-00-010) |

---

## Section 1 — 참조 추적 (referenceEvidence)

### L0: tw-framework-front 현 구현 (Before 패턴)

goals.json G-004 `referenceEvidence.L0`: `(N/A — 신규 기능)` — 비동기 DataMap은 기존 EditableGrid에 없음.

현재 `tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx`의 `meta.selectOptions`는 동기 배열만 지원:

```typescript
// Before: EditableGrid.tsx — 동기 selectOptions 배열만, 비동기 로드 없음
const meta = column.columnDef.meta as { selectOptions?: { label: string; value: string }[] } | undefined;
// meta.selectOptions가 undefined이면 드롭다운 항목 없음 — 런타임 비동기 로드 불가
```

비동기 옵션 로드(API 호출 → 드롭다운 항목 동적 생성)는 기존 EditableGrid에서 지원하지 않는 신규 기능.

### L1: 자체 설계 (Map 캐시 + staleTime)

- G-004 `createAsyncDataMap`은 `loader: () => Promise<TItem[]>` + `Map<string, CacheEntry<TItem>>` + `staleTime: number`(기본 300_000 ms = 5분) 자체 구현
- 상태 머신: `'idle' | 'loading' | 'loaded' | 'error'` (4-state)
- Race condition de-dupe: `pendingPromise: Promise<TItem[]> | null` shared ref (D-5)
- 캐시 키: `'__default__'` 고정 (단일 loader 기반 AsyncDataMap 인스턴스당 1 캐시 슬롯)

### L2: 선행 Goal 구현 참조

- G-001-spec.md Section 3.1: `DataMap<TItem>` 인터페이스 (`getDisplay`, `getItems`, `getValue`) — AsyncDataMap은 이를 구현
- G-001 구현: `grid-pro-datamap/src/createDataMap.ts`, `src/DataMap.ts`
- G-003-spec.md Section 3.1: `DataMapEditorProps<TItem>` — AsyncDataMap 인스턴스를 `dataMap` prop으로 수신 가능 (동기 DataMap과 동일 인터페이스)

### R-A: AG Grid 참조 (패턴 학습)

`publish-aggrid-analysis.md`: AG Grid Community `cellEditorParams.values` async 패턴 — `cellEditorParams: { values: ['A', 'B'] }` 또는 `cellEditorParams: () => Promise<string[]>`. G-004는 DataMap 인터페이스 준수로 다른 접근 (코드↔레이블 양방향 조회 유지).

### R-W: Wijmo 참조 (패턴 학습, C-16)

`publish-wijmo-analysis.md` §4: Wijmo DataMap `itemsSource` async 설정 — `dataMap.itemsSource = fetchFn()`. G-004는 loader 함수를 생성 시점에 주입하는 팩토리 패턴 채택 (Wijmo 코드 차용 X — C-16).

---

## Section 2 — 사용자 스토리 & 여정 (userStory + userJourneySteps)

**사용자 스토리**: 페이지 개발자가 `createAsyncDataMap({ loader: () => fetchStatusList(), valuePath: 'code', displayPath: 'label' })`를 생성하고 `column.dataMap`에 지정하면, 최초 편집 진입 시 loader가 호출되어 items를 로드하고 이후 staleTime 내에는 캐시를 사용하여 DataMapEditor 드롭다운이 즉시 표시되어야 한다.

**여정 단계**:

1. `import { createAsyncDataMap } from '@tomis/grid-pro-datamap'`
2. `const statusMap = createAsyncDataMap({ loader: () => fetch('/api/status').then(r => r.json()), valuePath: 'code', displayPath: 'label', staleTime: 60_000 })`
3. `columns 정의: { id: 'status', header: '상태', dataMap: statusMap, cell: DataMapCell, ... }`
4. 표시 셀: `statusMap.getDisplay(value)` — idle/loading 상태이면 `undefined` → 호출자가 빈 문자열 fallback
5. 편집 진입: `DataMapEditor` mount → `statusMap.getItems()` 호출 → 내부 `load()` 트리거
6. `load()` → state `'loading'` → spinner 표시 (AC-002)
7. loader Promise resolve → items 캐시 저장 → state `'loading'` → `'loaded'` → `getItems()` 반환
8. staleTime 내 재편집: state `'loaded'` + 캐시 유효 → `getItems()` 즉시 반환 (loader 미호출)
9. `statusMap.invalidate()` 호출 → 캐시 초기화 + state `'idle'` → 다음 `getItems()` 시 재로드

---

## Section 3 — API 명세 (타입 + 시그니처)

### 3.1 신규 타입 (types.ts MODIFY)

```typescript
// packages/grid-pro-datamap/src/types.ts — G-004 추가분

/**
 * AsyncDataMap 내부 로딩 상태 머신.
 * 'idle': 초기 상태 (load 미호출)
 * 'loading': loader() Promise 실행 중
 * 'loaded': items 로드 완료 + 캐시 유효
 * 'error': loader() reject — fallback 빈 목록 반환 (F-12-05, AC-002)
 *
 * C-4: no any — string literal union
 */
export type AsyncDataMapState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * AsyncDataMap<TItem>: 비동기 DataMap 인터페이스.
 * DataMap<TItem>을 확장 — DataMapEditor/DataMapCell에 동기 DataMap과 동일하게 사용 가능.
 *
 * 추가 멤버:
 * - state: 현재 로딩 상태 (읽기 전용)
 * - load(): 비동기 로드 트리거 — Promise<void> (이미 loading 중이면 동일 Promise 공유)
 * - invalidate(): 캐시 무효화 → state 'idle' 리셋 → 다음 getItems() 시 재로드
 * - onStateChange: state 변경 콜백 등록 (DataMapEditor spinner 연동용)
 *
 * C-4: no any — TItem 상한 유지
 * C-29: exactOptionalPropertyTypes — onStateChange? 미제공 시 undefined 체크 필수
 */
export interface AsyncDataMap<TItem = unknown> extends DataMap<TItem> {
  readonly state: AsyncDataMapState;
  load(): Promise<void>;
  invalidate(): void;
  onStateChange?(callback: (state: AsyncDataMapState) => void): () => void;
}

/**
 * CreateAsyncDataMapOptions<TItem>: createAsyncDataMap 팩토리 옵션.
 *
 * C-4: no any
 * C-29: staleTime? optional — 미제공 시 내부 DEFAULT_STALE_TIME(300_000 ms) 사용.
 *       spread-skip 패턴: `...(options.staleTime !== undefined ? { staleTime: options.staleTime } : {})`
 */
export interface CreateAsyncDataMapOptions<TItem> {
  /** 옵션 항목 비동기 로더 — Promise<TItem[]> 반환 */
  loader: () => Promise<TItem[]>;
  /** 코드 값 경로 또는 accessor */
  valuePath: PathOrAccessor<TItem, unknown>;
  /** 표시 레이블 경로 또는 accessor */
  displayPath: PathOrAccessor<TItem, string>;
  /**
   * 캐시 유효 기간 (ms). 미제공 시 5분(300_000 ms).
   * C-29: optional — staleTime !== undefined 체크 후 내부 사용
   */
  staleTime?: number;
}
```

### 3.2 `createAsyncDataMap` 팩토리 시그니처

```typescript
// packages/grid-pro-datamap/src/createAsyncDataMap.ts

import type { CreateAsyncDataMapOptions, AsyncDataMap, AsyncDataMapState } from './types.js';
import { buildAsyncCache } from './internal/asyncCache.js'; // C-31: 명시적 import + invocation

/**
 * createAsyncDataMap<TItem>: AsyncDataMap 팩토리.
 *
 * AC-001: DataMap<TItem> 인터페이스 완전 구현
 * AC-003: staleTime 기반 Map 캐시 + invalidate()
 * AC-005: 상태머신 4-state (idle/loading/loaded/error)
 *
 * C-4: no any — TItem 제네릭
 * C-29: staleTime? spread-skip 패턴 적용
 * C-31: asyncCache import + 실제 load() 내 invocation (Section 12 Wiring Audit)
 *
 * @param options - CreateAsyncDataMapOptions<TItem>
 * @returns AsyncDataMap<TItem>
 */
export function createAsyncDataMap<TItem>(
  options: CreateAsyncDataMapOptions<TItem>,
): AsyncDataMap<TItem>;
```

### 3.3 `asyncCache` 내부 모듈 API

```typescript
// packages/grid-pro-datamap/src/internal/asyncCache.ts

/**
 * CacheEntry<TItem>: 캐시 슬롯 구조체.
 * C-4: no any
 */
export interface CacheEntry<TItem> {
  items: TItem[];
  loadedAt: number; // Date.now() 기준 ms timestamp
}

/**
 * AsyncCache<TItem>: 단일 AsyncDataMap 인스턴스용 캐시 관리자.
 *
 * - get(staleTime): 캐시 유효 시 items 반환, stale/미존재 시 null
 * - set(items): 캐시 저장 (loadedAt = Date.now())
 * - invalidate(): 캐시 초기화
 *
 * C-4: no any — TItem 제네릭
 */
export interface AsyncCache<TItem> {
  get(staleTime: number): TItem[] | null;
  set(items: TItem[]): void;
  invalidate(): void;
}

/**
 * buildAsyncCache<TItem>(): AsyncCache<TItem> 인스턴스 생성.
 * C-31: createAsyncDataMap.ts가 이 함수를 import + load() 내 실제 호출 (Wiring Audit 대상)
 *
 * @returns AsyncCache<TItem>
 */
export function buildAsyncCache<TItem>(): AsyncCache<TItem>;
```

### 3.4 `AsyncDataMapEditorProps` 확장 (DataMapEditor 로딩 상태 연동)

`DataMapEditor<TItem>`는 기존 `DataMapEditorProps<TItem>`을 유지하되, `dataMap` 필드가 `AsyncDataMap<TItem>`인 경우 `state` 속성을 런타임 체크하여 스피너 렌더링. 별도 prop 추가 없음 — duck typing으로 `'state' in dataMap` 판별.

```typescript
// DataMapEditor.tsx 내부 로딩 판별 패턴 (spec code template — no @ts-ignore, no as any)
const isAsync = 'state' in props.dataMap && 'load' in props.dataMap;
const asyncState = isAsync ? (props.dataMap as AsyncDataMap<TItem>).state : 'loaded';
```

---

## Section 4 — 범위 (scope)

### In Scope

| 항목 | 파일 | 비고 |
|------|------|------|
| `createAsyncDataMap` 팩토리 | `src/createAsyncDataMap.ts` NEW | AC-001, AC-003 |
| `internal/asyncCache` 캐시 모듈 | `src/internal/asyncCache.ts` NEW | C-31 Wiring |
| `AsyncDataMap`, `AsyncDataMapState`, `CreateAsyncDataMapOptions` 타입 | `src/types.ts` MODIFY | AC-001, 3.1 |
| 신규 export 추가 | `src/index.ts` MODIFY | AC-004 license stub 확인 |
| package.json version bump | `package.json` MODIFY | D-2 (0.0.0 → 0.1.0) |
| async 캐싱 ADR | `decisions/MOD-GRID-12-decisions.md` NEW or MODIFY | AC-005 |
| Storybook stories 2개 | `src/__stories__/AsyncDataMap.stories.tsx` NEW | AC-008 |
| Docusaurus 문서 경로 명시 | `docs/grid-pro/datamap/createAsyncDataMap.mdx` | D-6 |
| `DataMapEditor.tsx` spinner 분기 추가 | `src/DataMapEditor.tsx` MODIFY | AC-002: duck typing으로 AsyncDataMap 판별 + `animate-spin` 스피너 렌더링 (Section 3.4) |

### Out of Scope

| 항목 | 이유 |
|------|------|
| SWR / react-query 통합 | C-22: 외부 의존성 신규 도입 금지. AC-005 ADR에서 reject 이유 기록 |
| `EULA.md` 수정 | D-3: G-001에서 완료. G-004 범위 외 |
| `grid-license` 실제 검증 로직 | MOD-GRID-99-A/G-002 미완료. G-004는 기존 inline stub 확인만 (D-7) |
| `DataMapCell.tsx` 비동기 상태 표시 | G-002 범위 파일. AsyncDataMap.getDisplay()가 'idle'/'loading' 시 undefined 반환 → 호출자 빈 문자열 fallback으로 처리 |

---

## Section 5 — 구현 제약 (constraints)

| 코드 | 내용 | G-004 적용 |
|------|------|-----------|
| C-2 | TanStack react-table v8 표준 API만 | AsyncDataMap은 DataMap 인터페이스 구현 — TanStack 직접 변경 없음 |
| C-4 | no any | 모든 제네릭 TItem 상한 유지. `as AsyncDataMap<TItem>` 캐스트는 duck typing 판별 이후만 |
| C-5 | Tailwind CSS only | spinner: `animate-spin` 클래스. 인라인 style 금지 |
| C-12 | tsc --noEmit 0 error | AC-007: packages/grid-pro-datamap 전체 타입 검사 통과 |
| C-14 | ADR 기록 | AC-005: decisions/MOD-GRID-12-decisions.md async 캐싱 전략 ADR |
| C-16 | @mescius/wijmo* import 0건 | createAsyncDataMap.ts + asyncCache.ts: Wijmo import 없음 |
| C-18 | 가상화 호환 | `getItems()` O(n) 반환. 캐시 히트 시 O(1). 드롭다운 가상화는 DataMapEditor 범위 (G-003) |
| C-21 | size-limit ≤ 20 KB | AC-004 검증. +2 KB 추가로 G-001~G-003 합계 ~6 KB → 전체 ≤ 20 KB 유지 예상 |
| C-22 | 외부 의존성 최소화 | SWR / react-query 도입 금지. 자체 Map 캐시 구현 (D-4) |
| C-23 | 호환성 유지 | breaking = false. 신규 API 추가만. 기존 G-001~G-003 export 불변 |
| C-24 | Pro 패키지 라이선스 | 기존 index.ts L7-11 `verifyOrWarn` inline stub 확인 (D-7). 중복 추가 금지 |
| C-25 | Storybook story | AC-008: 2개 story (AsyncDataMap.stories.tsx) |
| C-28 | 모노레포 경로 정정 | D-1: Section 7 파일 표에서 topvel-grid-monorepo 경로 사용 |
| C-29 | exactOptionalPropertyTypes | `staleTime?: number` 내부 소비 시 `!== undefined` 체크 + spread-skip 패턴 |
| C-30 | spec code template 권위 | Section 7 파일 표가 구현 파일 목록 권위. goals.json EULA.md 잔존 무시 |
| C-31 | Functional Wiring Audit | `buildAsyncCache` import + load() 내 실제 invocation 명시 (Section 12) |
| C-33 | Pro inline stub | index.ts 기존 stub 재사용. G-004에서 추가 stub 불필요 |

---

## Section 6 — 허용 기준 전체 (AC-001~AC-008)

| AC | 기준 | 소스 | 충족 방법 |
|----|------|------|----------|
| AC-001 | `createAsyncDataMap<TItem>({ loader, valuePath, displayPath, staleTime? }): AsyncDataMap<TItem>` — `DataMap<TItem>` 완전 구현 (getDisplay/getItems/getValue). C-4 no any | C-4 | `createAsyncDataMap.ts`: DataMap 인터페이스 완전 구현 + TItem 제네릭 유지 |
| AC-002 | AsyncDataMap 내부 상태 4-state `'idle'|'loading'|'loaded'|'error'`. 로딩 중 DataMapEditor → Tailwind `animate-spin` 스피너 (C-5). 에러 시 빈 목록 fallback (F-12-05) | C-5 | `AsyncDataMapState` 타입 + DataMapEditor duck typing 연동 + 에러 시 `[]` 반환 |
| AC-003 | 캐싱: `staleTime`(ms, 기본 5분) 내 재호출 시 캐시 반환. `invalidate()` → 캐시 초기화 + 다음 접근 시 재로드 | L1 | `asyncCache.ts` `get(staleTime)/set(items)/invalidate()` + createAsyncDataMap 통합 |
| AC-004 | Pro 패키지 전체 검증: import 시 grid-license 검증 호출 확인 (C-24). `@mescius/wijmo* 0건` (C-16). size-limit `grid-pro-datamap ≤ 20 KB` (C-21) | C-24 | index.ts L7-11 기존 stub 확인 (D-7). Grep으로 wijmo import 0건. bundle ≤ 20 KB |
| AC-005 | `decisions/MOD-GRID-12-decisions.md` ADR — async 캐싱 전략 결정 (대안: SWR/react-query vs 자체 Map), trade-off 포함 (C-14) | C-14 | decisions 파일 ADR 섹션 추가 (D-9). SWR reject 이유, Map 선택 근거 기록 |
| AC-006 | `@mescius/wijmo* import 0건` (C-16) | C-16 | createAsyncDataMap.ts + asyncCache.ts: Wijmo 미사용. AC-004와 중복 확인 |
| AC-007 | C-12: `tsc --noEmit 0 error` (packages/grid-pro-datamap 전체) | C-12 | AsyncDataMap 타입 C-29 exactOptional 준수 + TItem 제네릭 상한 |
| AC-008 | C-25: Storybook story 2개 — (a) createAsyncDataMap 로딩/캐시 시나리오, (b) 전체 통합 시나리오 (정적 + 동적 DataMap 혼합) | C-25 | `AsyncDataMap.stories.tsx` 2 named export (CSF3) |

---

## Section 7 — 파일 목록 (implementFiles)

**주의**: goals.json `implementFiles`의 경로 prefix `D:/project/topvel_project/TOMIS/packages/...`는 오기재 (C-28). 아래 표가 권위 (C-30). EULA.md는 D-3 결정으로 미포함 (goals.json L406 잔존 — Section 7 미포함).

| 파일 경로 | 상태 | AC 연결 |
|-----------|------|---------|
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/createAsyncDataMap.ts` | **NEW** | AC-001, AC-002, AC-003 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/internal/asyncCache.ts` | **NEW** | AC-003, C-31 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/__stories__/AsyncDataMap.stories.tsx` | **NEW** | AC-008 |
| `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-12-decisions.md` | **NEW or MODIFY** | AC-005 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/DataMapEditor.tsx` | **MODIFY** | AC-002 (duck typing + animate-spin 스피너 분기 추가 — Section 3.4) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/types.ts` | **MODIFY** | AC-001 (AsyncDataMap, AsyncDataMapState, CreateAsyncDataMapOptions 추가) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/index.ts` | **MODIFY** | AC-004 (신규 export 추가; D-7: 기존 verifyOrWarn stub 재확인) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/package.json` | **MODIFY** | D-2 (version 0.0.0 → 0.1.0) |
| `D:/project/topvel_project/topvel-grid-monorepo/docs/grid-pro/datamap/createAsyncDataMap.mdx` | **NEW** | D-6 (Docusaurus 문서) |

**총 파일**: NEW 4개 + NEW or MODIFY 1개 + MODIFY 4개 = 9개

---

## Section 8 — 엣지 케이스 & 리스크 (edgeCases)

### EC-001: 동시 `load()` 호출 (Race Condition)

- **상황**: 여러 DataMapEditor 인스턴스가 동일 AsyncDataMap에 동시 mount → 복수의 `load()` 동시 호출
- **처리**: D-5: `pendingPromise: Promise<TItem[]> | null` ref 공유. state `'loading'` 중 새 `load()` → 기존 `pendingPromise` 반환 (중복 loader() 미호출)
- **코드**:
  ```typescript
  // createAsyncDataMap.ts 내부 (spec code template)
  let pendingPromise: Promise<TItem[]> | null = null;
  // ...
  async function load(): Promise<void> {
    if (state === 'loading' && pendingPromise !== null) {
      await pendingPromise; // 동일 Promise 공유 — loader 중복 호출 없음
      return;
    }
    // ... loader() 호출 및 캐시 저장
  }
  ```

### EC-002: loader() reject (에러 상태)

- **상황**: 네트워크 오류, 서버 500 등으로 loader() Promise reject
- **처리**: state `'error'` 전환. `getItems()` → `[]` 반환 (F-12-05 빈 목록 fallback). `getDisplay()` → `undefined`. DataMapEditor 드롭다운 빈 목록 표시
- **주의**: state `'error'`에서 `load()` 재시도 가능 (`invalidate()` 불필요 — `load()` 호출 자체가 retry)

### EC-003: staleTime 경과 후 접근

- **상황**: 캐시 저장 후 `staleTime` ms 경과. `getItems()` 재호출
- **처리**: `asyncCache.get(staleTime)` → `null` 반환. `load()` 자동 트리거 → state `'loading'` → 재로드
- **주의**: state는 `'loaded'` → `'loading'`으로 전환. 이전 캐시 items는 `'loading'` 중 `getItems()` 호출 시 stale items 반환 vs 빈 배열 선택 → **spec 결정**: stale 중에도 이전 items 유지 (UX 연속성)

### EC-004: `invalidate()` 후 즉각적 `getItems()` 호출

- **상황**: `invalidate()` 호출 직후 DataMapEditor가 `getItems()` 요청
- **처리**: state `'idle'`. `getItems()` → `load()` 자동 트리거 → `[]` 반환 (로딩 중). spinner 표시. loader resolve 시 items 갱신
- **주의**: `invalidate()` 는 동기 — 기존 `pendingPromise` 초기화 포함

### EC-005: C-29 `staleTime` optional 전달 (exactOptionalPropertyTypes)

- **상황**: 상위 코드가 `staleTime: undefined`를 명시적으로 전달
- **처리**: C-29 spread-skip 패턴:
  ```typescript
  // createAsyncDataMap.ts 내부 — C-29 exactOptionalPropertyTypes 준수
  const effectiveStaleTime =
    options.staleTime !== undefined ? options.staleTime : DEFAULT_STALE_TIME;
  ```

### EC-006: `AsyncDataMap`을 `DataMap` 타입으로 수신하는 코드

- **상황**: `DataMapCell` / `DataMapEditor`가 `dataMap: DataMap<TItem>` 타입으로 선언 — AsyncDataMap 전달 시 타입 호환
- **처리**: `AsyncDataMap<TItem> extends DataMap<TItem>` → 타입 호환 보장. spinner 연동은 duck typing (`'state' in dataMap`) 런타임 판별

### EC-007: `decisions/MOD-GRID-12-decisions.md` 파일 기존재 여부

- **상황**: G-001 AC-007에서 이미 생성되었을 수 있음
- **처리**: IMPLEMENT 단계에서 파일 존재 확인 후 기존재 시 MODIFY (섹션 추가), 미존재 시 NEW 생성 (D-9)

---

## Section 9 — 마이그레이션 영향 (migrationImpact)

- **migrationImpact**: medium
- **상세**: G-004는 신규 API 추가 (breaking = false). 기존 G-001~G-003 export 불변.
- **EditableGrid 마이그레이션**: 기존 `selectOptions` 동기 배열 → `createAsyncDataMap` 전환 시 `loader: () => Promise.resolve(items)` 패턴으로 하위 호환 가능
- **package.json version**: 0.0.0 → 0.1.0 (D-2). 소비 패키지의 lockfile 갱신 필요

### 마이그레이션 Before/After

**Before**: 기존 EditableGrid 동기 selectOptions

```typescript
// Before: EditableGrid.tsx — 동기 배열, 비동기 미지원
const column = {
  id: 'status',
  meta: {
    selectOptions: [
      { label: '활성', value: 'ACTIVE' },
      { label: '비활성', value: 'INACTIVE' },
    ],
  },
};
// 런타임 API 호출로 options 동적 로드 불가
```

**After**: createAsyncDataMap 비동기 로드

```typescript
// After: createAsyncDataMap — 비동기 loader + 5분 캐시
import { createAsyncDataMap, DataMapCell } from '@tomis/grid-pro-datamap';

const statusMap = createAsyncDataMap({
  loader: async () => {
    const res = await fetch('/api/codes/status');
    return res.json() as Promise<StatusItem[]>;
  },
  valuePath: 'code',
  displayPath: 'label',
  // staleTime: 60_000, // 선택적 — 미제공 시 5분
});

const column = {
  id: 'status',
  header: '상태',
  dataMap: statusMap,
  cell: DataMapCell,
};
// 최초 편집 시 loader() 호출 → 이후 staleTime 내 캐시 재사용
```

---

## Section 10 — 번들 영향 (bundleImpact)

- **예상 추가**: +2 KB (createAsyncDataMap.ts + asyncCache.ts 합산, ESM minified)
- **근거**: G-001 실측 1 KB (DataMap + createDataMap). G-002 DataMapCell ~1 KB. G-003 DataMapEditor ~3 KB. G-004 asyncCache 단순 Map 래퍼 + 상태머신 ~2 KB 예상
- **누적**: G-001~G-004 합계 ~7 KB — C-21 ≤ 20 KB 한도 충족
- **실측**: IMPLEMENT 단계 (`pnpm build` ESM/CJS 출력 확인)
- **size-limit 설정**: AC-004 검증 시 `grid-pro-datamap` 패키지 전체 ≤ 20 KB 확인

---

## Section 11 — 리스크 & 미결 사항 (risks)

### Risk #1: DataMapEditor.tsx 수정 범위 (G-003 완료 파일)

- **리스크**: DataMapEditor는 G-003에서 완료된 파일. G-004에서 MODIFY 추가 시 G-003 구현 의도와 충돌 가능성
- **완화**: Section 3.4 duck typing 패턴으로 최소 수정 — 기존 DataMapEditor 로직은 변경 없음. spinner 분기만 추가 (`isAsync` 판별 + `state === 'loading'` 시 `animate-spin` div 렌더링)
- **결정**: DataMapEditor.tsx는 Section 7 MODIFY 파일로 확정 (AC-002 충족 필수). 추가되는 코드는 Section 3.4 duck typing 블록 + 조건부 spinner 렌더링 2행 이내

### Risk #2: `decisions/MOD-GRID-12-decisions.md` 파일 충돌

- **리스크**: G-001 구현 시 파일 이미 존재. G-004가 NEW로 생성 시 덮어쓰기 위험
- **완화**: D-9 결정 — IMPLEMENT 단계에서 파일 존재 확인 후 MODIFY (섹션 추가). spec Section 7은 "NEW or MODIFY" 표시

### Risk #3: `AsyncDataMap extends DataMap` 타입 호환성

- **리스크**: `TomisColumnDef<TData>.dataMap?: DataMap<unknown>` 타입에 `AsyncDataMap<TItem>` 할당 시 TypeScript 타입 오류
- **완화**: `AsyncDataMap<TItem> extends DataMap<TItem>` → `DataMap<unknown>` 상한 타입에 할당 가능 (TItem = unknown). tsc 검사로 확인 (AC-007)

### Risk #4: onStateChange 콜백 메모리 누수

- **리스크**: DataMapEditor unmount 시 `onStateChange` 콜백 미정리 → 클로저 보존 → 메모리 누수
- **완화**: `onStateChange()` 반환값 = unsubscribe 함수. DataMapEditor에서 `useEffect` cleanup으로 반환값 호출

---

## Section 12 — 구현 메모 (implementationNotes)

### 상태머신 전환 다이어그램

```
idle --[getItems() 호출]--> loading --[loader resolve]--> loaded
idle --[load() 직접 호출]--> loading --[loader reject]--> error
loading --[이미 loading 중 load() 호출]--> loading (pendingPromise 공유)
loaded --[staleTime 경과 + getItems()]--> loading
loaded --[invalidate()]--> idle
error --[load() 재시도]--> loading
```

### C-31 Wiring Audit 표

| 모듈 | import | call-site | 검증 방법 |
|------|--------|-----------|----------|
| `createAsyncDataMap.ts` | `import { buildAsyncCache } from './internal/asyncCache.js'` | `load()` 함수 내 `const cache = buildAsyncCache<TItem>()` (인스턴스 생성) + `cache.get(staleTime)`, `cache.set(items)`, `cache.invalidate()` | tsc --noEmit + grep으로 호출 확인 |
| `asyncCache.ts` | (외부 의존성 없음) | `buildAsyncCache<TItem>(): AsyncCache<TItem>` 구현체 — `Map<'__default__', CacheEntry<TItem>>` 내부 사용 | 단위 테스트 또는 수동 확인 |

### DEFAULT_STALE_TIME 상수

```typescript
// createAsyncDataMap.ts
const DEFAULT_STALE_TIME = 300_000; // 5분 (ms) — C-29 optional staleTime 미제공 시 적용
```

### index.ts export 추가 (D-7: verifyOrWarn stub 재확인)

```typescript
// packages/grid-pro-datamap/src/index.ts — G-004 추가분 (기존 L7-11 stub 변경 없음)
// G-004: AsyncDataMap API public exports
export type {
  AsyncDataMap,
  AsyncDataMapState,
  CreateAsyncDataMapOptions,
} from './types.js';
export { createAsyncDataMap } from './createAsyncDataMap.js';
```

### package.json version bump (D-2)

```json
// Before (packages/grid-pro-datamap/package.json)
{ "version": "0.0.0" }

// After
{ "version": "0.1.0" }
```

---

## Section 13 — Storybook 시나리오 (AC-008)

### Story 1: AsyncDataMap 로딩/캐시 시나리오

```typescript
// src/__stories__/AsyncDataMap.stories.tsx
// AC-008 시나리오 1: createAsyncDataMap 로딩 상태 + staleTime 캐시 동작
export const AsyncDataMapLoading = {
  args: {
    scenario: 'async-datamap-loading',
    description: 'createAsyncDataMap({ loader: fetchStatusList, valuePath: "code", displayPath: "label", staleTime: 5000 })',
    initialState: 'idle',
    loaderDelayMs: 1000, // 로딩 1초 지연 시뮬레이션
    staleTime: 5000, // 5초 캐시
    dataMapItems: [
      { code: 'ACTIVE', label: '활성' },
      { code: 'INACTIVE', label: '비활성' },
      { code: 'PENDING', label: '대기' },
    ],
    expectedBehavior: [
      '최초 getItems() → state idle → load() 트리거 → animate-spin 스피너',
      '1초 후 loader resolve → state loaded → 드롭다운 3개 항목',
      '5초 내 재편집 → 캐시 hit → 즉시 드롭다운 표시 (loader 미호출)',
      '5초 경과 후 재편집 → stale → 재로드',
    ],
    spec: 'MOD-GRID-12/G-004 AC-001~AC-003 + AC-008',
  },
} as const;
```

### Story 2: 정적 + 동적 DataMap 혼합 통합 시나리오

```typescript
// src/__stories__/AsyncDataMap.stories.tsx
// AC-008 시나리오 2: 정적 DataMap + AsyncDataMap 혼합 컬럼 구성
export const MixedDataMapIntegration = {
  args: {
    scenario: 'mixed-datamap-integration',
    description: '정적 createDataMap + 동적 createAsyncDataMap 혼합 column.dataMap 설정',
    columns: [
      {
        id: 'status',
        header: '상태',
        dataMapType: 'static',
        items: [{ code: 'A', label: '활성' }, { code: 'B', label: '비활성' }],
      },
      {
        id: 'country',
        header: '국가',
        dataMapType: 'async',
        loaderDelayMs: 800,
        items: [{ code: 'KR', label: '대한민국' }, { code: 'US', label: '미국' }],
      },
    ],
    expectedBehavior: [
      'status 컬럼: 정적 DataMap → 즉시 드롭다운',
      'country 컬럼: AsyncDataMap → 최초 로딩 spinner 800ms → 이후 캐시',
      'invalidate() 후 country 재편집 → 재로드',
      'Pro 라이선스 stub: verifyOrWarn 호출 확인 (index.ts L7-11)',
    ],
    spec: 'MOD-GRID-12/G-004 AC-004 + AC-008 전체 통합',
  },
} as const;
```

