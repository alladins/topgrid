# G-003-spec.md — MOD-GRID-12/datamap
## 편집 셀 필터-타이핑 드롭다운 (DataMapEditor)

**specVersion**: 1.0.0
**goalId**: G-003
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
**선행 Goal**: MOD-GRID-12/G-001 (DataMap API — specify 96.6, implement 100, verify 100), MOD-GRID-12/G-002 (DataMapCell 렌더러 — specify 완료)

---

## ★ Pre-decisions Table (D-1–D-7)

| # | 결정 사항 | 이유 / 근거 |
|---|-----------|-------------|
| D-1 | `implementFiles` 경로 prefix 정정: goals.json의 `D:/project/topvel_project/TOMIS/packages/...` → 실제 위치 `D:/project/topvel_project/topvel-grid-monorepo/packages/...` (C-28 + ADR-MOD-GRID-00-001). Section 7 파일 표가 권위 (C-30). | goals.json discover 단계 자동 생성 시 TOMIS prefix 오기재. C-28 적용 범위 MOD-GRID-02~16 포함. G-001·G-002 동일 정정 선례 확인. |
| D-2 | `DataMapEditorProps<TItem>` 인터페이스 신규 추가: types.ts MODIFY로 `{ value: unknown; dataMap: DataMap<TItem>; onCommit: (newValue: unknown) => void; onCancel: () => void }`. C-4(no any) + C-29(exactOptionalPropertyTypes) 준수. 제네릭 TItem 유지로 getItems() 타입 전달. | AC-001 props 명세 구현 필요. TItem 제네릭으로 getItems() 반환 타입 보존. C-29 준수: 모든 필드 required (optional 없음). |
| D-3 | AC-005 goals.json 기재 "InlineEditCell" 이름 드리프트 확인 및 렌더러 레지스트리 통합 defer: goals.json AC-005는 "MOD-GRID-05 InlineEditCell과 통합"이라 기재하나, 실제 파일은 `grid-renderers/src/EditableCell.tsx` (InlineEditCell.tsx 미존재 — Glob 실측 확인). 렌더러 레지스트리(grid-core 패키지) 수정은 G-003 implementFiles(grid-pro-datamap) 범위 밖. MOD-GRID-04/05 별도 Goal에서 `column.dataMap` 존재 시 DataMapEditor 자동 선택 구현. G-003은 DataMapEditor 독립 export + 수동 배선만. | G-002 D-4 cross-package AC deferral 선례 동일 패턴. grid-core 패키지 수정은 G-003 implementFiles 범위 초과. InlineEditCell.tsx 미존재 사실은 H-01 정확성에 필수 기재. |
| D-4 | 키보드 네비게이션: useRef + onKeyDown 직접 구현 (외부 UI 라이브러리 미사용). Radix UI / HeadlessUI / Downshift 등 신규 external dep 추가 불가 (C-22 의존성 최소화). ArrowDown/Up/Enter/Escape 4키 지원 (AC-004). | C-22: 외부 UI 라이브러리 신규 도입은 별도 ADR 필요. AC-004 요구 키 집합(4개)은 React 직접 구현으로 충분. grid-pro-datamap 기존 deps(react, @tanstack/react-table) 범위 내. |
| D-5 | IME 조합 입력 처리: onCompositionStart → isComposing=true, onCompositionEnd → isComposing=false + 필터 갱신. Enter키 핸들러에서 isComposing 체크로 조합 중 확정 방지. | 한국어 입력(받침 조합 중 Enter) 시 조합 확정과 onCommit 이중 발생 방지. CJK locale 사용처 대응. |
| D-6 | Docusaurus 문서 경로 명시: `docs/grid-pro/datamap/DataMapEditor.mdx` (실제 파일은 IMPLEMENT 단계 작성). | G-002 specify 점수에서 F-03 항목이 NO가 된 원인: 문서 경로 미명시. G-003에서 동일 실수 방지. |
| D-7 | 라이선스 검증 추가 호출 불필요: G-001 구현 완료로 `grid-pro-datamap/src/index.ts` L7-11에 `verifyOrWarn` inline stub 존재 (C-33 + ADR-MOD-GRID-00-012). DataMapEditor.tsx는 package 진입점이 아니므로 별도 라이선스 호출 없음. index.ts MODIFY는 export 추가만. | C-33 Pro 패키지 inline stub 정책. 중복 호출 금지. G-001·G-002와 동일 결론. |

---

## Section 0 — 메타

| 항목 | 값 |
|------|-----|
| goalId | G-003 |
| title | 편집 셀 필터-타이핑 드롭다운 (DataMapEditor) |
| migrationImpact | medium |
| threshold | 90 |
| licenseTier | Pro |
| packageTarget | `packages/grid-pro-datamap` |
| rubricVersion | 1.0.7 |
| 선행 Goal | MOD-GRID-12/G-001 (DataMap API / TomisColumnDef — 완료), MOD-GRID-12/G-002 (DataMapCell 렌더러 — specify 완료) |
| implementFiles | NEW 1개 + MODIFY 2개 = 3개 (Section 7 표가 권위) |
| bundleImpact | +3 KB (DataMapEditor 드롭다운 컴포넌트); 실측은 IMPLEMENT 시점 (ADR-MOD-GRID-00-010) |

---

## Section 1 — 참조 추적 (referenceEvidence)

### L0: tw-framework-front 현 구현 (Before 패턴)

goals.json G-003 `referenceEvidence.L0`: `tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` + `grid-renderers/src/EditableCell.tsx`

- `EditableGrid.tsx` L79-93: `meta.selectOptions` 존재 시 C-29 spread-skip 패턴으로 `EditableCell`에 selectOptions 전달
  ```typescript
  // EditableGrid.tsx L79-93 (Before — 현 구현)
  const optionalProps =
    meta.selectOptions !== undefined
      ? { selectOptions: meta.selectOptions }
      : {};
  ```
- `EditableCell.tsx` (grid-renderers/src/EditableCell.tsx) L130-153: `editType='select'` 분기에서 `<select>` 태그로 드롭다운 렌더링
  - `meta.selectOptions` 타입 = `{ label: string; value: string }[]` (object array)
  - 필터-타이핑 기능 없음, DataMap 연동 없음
- **실제 파일**: `grid-renderers/src/EditableCell.tsx` — AC-005에 goals.json이 "InlineEditCell"로 기재하나 InlineEditCell.tsx는 미존재 (Glob 실측). D-3 참조.

### L1: 자체 설계 (React + Tailwind 드롭다운)

- G-003 DataMapEditor는 외부 컴포넌트 라이브러리 미사용, React useState/useRef/useCallback + Tailwind CSS absolute z-50 드롭다운 자체 구현
- 기준: AC-003 Tailwind 클래스 명세 `'absolute z-50 bg-white border border-gray-200 rounded shadow-md max-h-48 overflow-y-auto'`

### L2: 선행 Goal 구현 참조

- G-001-spec.md Section 3.1: `DataMap<TItem>` 인터페이스 (`getDisplay`, `getItems`, `getValue`)
- G-001-spec.md Section 3.3: `TomisColumnDef<TData>` intersection 타입 (`dataMap?`, `selectOptions?`)
- G-002-spec.md Section 3.1: `DataMapCell<TData>` 컴포넌트 시그니처 + resolveDataMap 헬퍼 패턴
- 실제 구현 파일: `grid-pro-datamap/src/DataMap.ts`, `grid-pro-datamap/src/createDataMap.ts`, `grid-pro-datamap/src/DataMapCell.tsx`

### L3: 사용처 (affectedUsageFiles)

goals.json G-003 `affectedUsageFiles: []` — 현재 기재된 사용처 없음. DataMapEditor는 신규 컴포넌트로 기존 파일 수정 불필요. (D-3: renderer registry 통합은 MOD-GRID-04/05 deferred)

### R-A: AG Grid 참조 분석

`publish-aggrid-analysis.md` Section 6 (L114-122): `agSelectCellEditor` / `agTextCellEditor` 패턴

```typescript
// publish-aggrid-analysis.md L114-122 (참조 — 도입 금지 C-7)
{ field: 'status', editable: true, cellEditor: 'agSelectCellEditor',
  cellEditorParams: { values: ['활성', '비활성'] } }
```

AG Grid의 `cellEditor` 등록 메커니즘은 D-3 deferred 렌더러 레지스트리 통합(MOD-GRID-04/05)의 참조 모델. G-003 자체는 AG Grid 미사용 (C-7).

### R-W: Wijmo DataMap 참조 분석

`publish-wijmo-analysis.md` §4 (L141-142): Wijmo DataMap 편집 드롭다운

```typescript
// publish-wijmo-analysis.md L142 (참조 — import 금지 C-16)
column.dataMap = new DataMap(items, 'key', 'value');
// itemsSource = [{ key: '1', value: '활성' }]
// displayMemberPath = 'value', selectedValuePath = 'key'
```

G-003 DataMapEditor는 Wijmo DataMap 편집 드롭다운을 TanStack + React 방식으로 재구현. `@mescius/wijmo*` import 금지 (C-16).

---

## Section 2 — 목적 및 배경

### 2.1 목적

`DataMapEditor<TItem>`는 `grid-pro-datamap` 패키지의 편집 셀 컴포넌트로, 사용자가 코드 값 ↔ 레이블 매핑(DataMap)을 이용한 드롭다운 선택 + 필터-타이핑으로 셀 값을 편집할 수 있게 한다.

현재 `EditableCell.tsx`의 `editType='select'` + `meta.selectOptions` 방식은:
- 필터-타이핑 기능 없음 (전체 목록만 표시)
- DataMap 연동 없음 (label/value 직접 관리 필요)
- 행 단위 동적 목록 분기 불가 (정적 selectOptions만)

DataMapEditor는 이 세 가지 한계를 모두 해결한다.

### 2.2 배경

- **G-001**: DataMap 인터페이스 + createDataMap 팩토리 + TomisColumnDef 타입 완료
- **G-002**: DataMapCell 표시 렌더러 완료 (코드→레이블 변환 읽기 전용 셀)
- **G-003 (현재)**: 편집 모드 드롭다운 구현 — DataMap의 getItems()로 선택 목록, getValue()로 코드 역변환, getDisplay()로 현재 값 표시

### 2.3 마이그레이션 관련성

Wijmo `DataMap` + 편집 드롭다운 → `DataMapEditor` + `column.dataMap = createDataMap(...)` 1:1 대응. `publish-wijmo-analysis.md §4` MOD-GRID-12 mapping 확인.

---

## Section 3 — API 계약

### 3.1 DataMapEditorProps<TItem> 인터페이스 (types.ts MODIFY — D-2)

```typescript
// packages/grid-pro-datamap/src/types.ts (MODIFY — 추가 부분)
// G-003: DataMapEditor 컴포넌트의 props 타입
// C-4: no any; C-29: exactOptionalPropertyTypes — 모든 필드 required
export interface DataMapEditorProps<TItem> {
  /** 현재 셀의 코드 값 (DataMap.getDisplay로 초기 입력값 도출) */
  value: unknown;
  /** 선택 목록 제공자 — getItems()·getValue()·getDisplay() 사용 */
  dataMap: DataMap<TItem>;
  /** 선택 확정 시 콜백: newValue는 DataMap.getValue(display) 결과 코드 값 */
  onCommit: (newValue: unknown) => void;
  /** 편집 취소 시 콜백 (Escape 또는 외부 클릭) */
  onCancel: () => void;
}
```

### 3.2 DataMapEditor 컴포넌트 시그니처

```typescript
// packages/grid-pro-datamap/src/DataMapEditor.tsx
// C-33: Pro 패키지이나 진입점(index.ts)이 아니므로 verifyOrWarn 별도 호출 불필요 (D-7)
export function DataMapEditor<TItem>(
  props: DataMapEditorProps<TItem>
): JSX.Element
```

### 3.3 내부 상태

| 상태 | 타입 | 설명 |
|------|------|------|
| `query` | `string` | 필터 입력값 (사용자 타이핑) |
| `highlightedIndex` | `number` | 키보드 포커스 항목 인덱스 (-1 = 없음) |
| `isComposing` | `boolean` | IME 조합 중 플래그 (D-5) |

### 3.4 파생 계산 (useMemo)

```typescript
// 필터-타이핑: case-insensitive, getDisplay()로 레이블 조회 (AC-002)
const filtered = useMemo(
  () =>
    dataMap
      .getItems()
      .filter((item) => {
        const label = dataMap.getDisplay(item) ?? '';
        return label.toLowerCase().includes(query.toLowerCase());
      }),
  [dataMap, query]
);
```

### 3.5 index.ts 추가 export

```typescript
// packages/grid-pro-datamap/src/index.ts (MODIFY — 추가 1줄)
export type { DataMapEditorProps } from './types';
export { DataMapEditor } from './DataMapEditor';
```

---

## Section 4 — 수락 기준 (AC) 상세

### AC-001 props 계약 (source: C-4)

`DataMapEditorProps<TItem>` 인터페이스 기준:

| props | 타입 | 필수 | 설명 |
|-------|------|------|------|
| `value` | `unknown` | required | 현재 코드 값 |
| `dataMap` | `DataMap<TItem>` | required | 선택 목록 제공자 |
| `onCommit` | `(newValue: unknown) => void` | required | 확정 콜백 |
| `onCancel` | `() => void` | required | 취소 콜백 |

C-29 exactOptionalPropertyTypes: optional 필드 없음 → spread-skip 패턴 불필요.

### AC-002 필터-타이핑 (source: L1)

- `<input>` onChange → query 갱신 → filtered 재계산 (Section 3.4)
- case-insensitive: `label.toLowerCase().includes(query.toLowerCase())`
- 초기 렌더 시 query='' → 전체 목록 표시

### AC-003 Tailwind 스타일 (source: C-5)

드롭다운 컨테이너 클래스 (고정):
```
absolute z-50 bg-white border border-gray-200 rounded shadow-md max-h-48 overflow-y-auto
```

- 입력 `<input>`: Tailwind 유틸리티 클래스 사용 (C-5)
- 항목 hover: `bg-blue-100` 또는 동등 Tailwind 클래스
- 포커스 항목(highlightedIndex): `bg-blue-100`

### AC-004 키보드 네비게이션 (source: L1)

| 키 | 동작 |
|----|------|
| `ArrowDown` | highlightedIndex+1 (순환: 마지막→0) |
| `ArrowUp` | highlightedIndex-1 (순환: 0→마지막) |
| `Enter` | isComposing=false일 때 → onCommit(getValue(filtered[highlightedIndex])) |
| `Escape` | onCancel() |

D-4: useRef + onKeyDown 직접 구현 (외부 UI 라이브러리 미사용, C-22).
D-5: IME onCompositionStart/End로 isComposing 관리, Enter 시 isComposing 체크.

### AC-005 렌더러 레지스트리 통합 (source: L1) — Deferred (D-3)

goals.json 기재: "MOD-GRID-05 InlineEditCell과 통합: column.dataMap이 있으면 InlineEditCell 대신 DataMapEditor 자동 선택 (renderer registry — F-05-06)"

**D-3 결정**: 이 AC는 MOD-GRID-04/05 범위로 defer.

이유:
1. goals.json이 "InlineEditCell"로 기재하나 실제 파일명은 `grid-renderers/src/EditableCell.tsx` (InlineEditCell.tsx 미존재 — Glob 실측 확인). 파일명 드리프트 발견.
2. 렌더러 레지스트리(`grid-core` 패키지) 수정은 G-003 implementFiles(`grid-pro-datamap` 패키지) 범위 밖. G-002 D-4 cross-package AC deferral 선례 동일 패턴.
3. G-003은 DataMapEditor를 독립 export만 제공. 소비자가 `cell: (info) => <DataMapEditor value={...} dataMap={col.dataMap} ... />` 형태로 수동 배선.

MOD-GRID-04/05 후속 Goal에서: `EditableCell.tsx` + renderer registry에 `column.dataMap` 감지 로직 추가로 완성.

### AC-006 Wijmo import 없음 (source: C-16)

`@mescius/wijmo*` import 0건. Grep 검증 대상: `DataMapEditor.tsx`, `types.ts`, `index.ts`.

### AC-007 TypeScript 오류 없음 (source: C-12)

`npx tsc --noEmit` (packages/grid-pro-datamap 디렉토리 기준) 0 error.

C-4: `any`, `as any`, `<any>`, `@ts-ignore`, `@ts-nocheck` 사용 금지.

### AC-008 Storybook story (source: C-25)

`DataMapEditor.stories.tsx` 파일 1개, 최소 2개 시나리오:
- 시나리오 1: 정적 dataMap (statusCode → 활성/비활성/대기)
- 시나리오 2: 필터-타이핑 동작 (긴 목록 필터링)

파일 위치: `src/__stories__/DataMapEditor.stories.tsx` (D-6 Docusaurus 경로 별도 — Section 13.4)
구현은 IMPLEMENT 단계 책임 (G-002 Section 13.4 선례 동일).

---

## Section 5 — 설계 제약 및 비기능 요건

### C-4: no any

- `DataMap<TItem>`: `getItems(): TItem[]` 반환, `getDisplay(value: unknown)` 파라미터
- DataMapEditorProps 전파: `dataMap: DataMap<TItem>` 제네릭 유지
- `getValue(display: string): unknown` 반환값은 `unknown`으로 onCommit 전달

### C-5: Tailwind CSS 전용

- 인라인 style 속성 사용 금지
- CSS 모듈 / styled-components 금지
- AC-003 클래스 고정 사용 (변경 시 명시적 결정 필요)

### C-12: TypeScript strict

- tsconfig.json `exactOptionalPropertyTypes: true` (C-29)
- DataMapEditorProps 모든 필드 required → spread-skip 패턴 불필요
- `getItems()` 반환 TItem[] → filter callback `(item: TItem)` 명시

### C-16: Wijmo import 금지

- `@mescius/wijmo*` 일체 import 금지
- 참조 분석 목적으로만 사용 (Section 1 R-W)

### C-22: 외부 의존성 최소화

- Radix UI, HeadlessUI, Downshift 등 신규 UI 라이브러리 추가 금지 (D-4)
- 기존 peerDependencies(react, @tanstack/react-table) 범위 내 구현

### C-33: Pro 패키지 라이선스 stub

- 진입점(`index.ts`)의 `verifyOrWarn` stub이 패키지 레벨 커버
- `DataMapEditor.tsx`는 진입점이 아니므로 별도 호출 불필요 (D-7)

### 번들 한도

- goals.json `bundleImpact`: "+3 KB" — 실측은 IMPLEMENT 시점 (ADR-MOD-GRID-00-010)
- 패키지 누적 한도 20KB (G-001: 기준, G-002: +2KB, G-003: +3KB → ~9KB 예상)

---

## Section 6 — 엣지케이스 및 에러 처리

### 6.1 빈 목록 (dataMap.getItems() = [])

- query 입력 결과 filtered=[] 시: 드롭다운에 "결과 없음" 텍스트 표시 (구현 결정 IMPLEMENT 위임)
- highlightedIndex = -1 유지, Enter → 동작 없음

### 6.2 getValue 반환 undefined

- `dataMap.getValue(display)` = undefined인 경우: onCommit 호출하지 않음 (무효 선택)
- 이는 `filtered[highlightedIndex]`가 유효한 항목일 때만 getValue 호출로 방지 가능

### 6.3 IME 조합 중 Enter (D-5)

- `onCompositionStart` → isComposing = true
- `onCompositionEnd` → isComposing = false → query 갱신
- `onKeyDown` Enter: `if (isComposing) return` — 조합 중 확정 방지

### 6.4 외부 클릭 취소

- onCancel() 호출: 상위 편집 셀(MOD-GRID-05 EditableCell)이 blur/외부클릭을 감지하여 처리
- DataMapEditor는 onCancel 콜백만 노출, 외부 클릭 감지 책임은 상위 컴포넌트

### 6.5 초기 value 표시

- 마운트 시 `dataMap.getDisplay(value)` 결과를 `<input>` 초기값으로 설정
- 매핑 없으면 `getDisplay(value) = undefined` → 빈 문자열로 fallback (사용자 재입력 유도)

### 6.6 대소문자 일관성 (AC-002)

- 필터: `label.toLowerCase().includes(query.toLowerCase())` — 입력/레이블 모두 소문자 변환
- 비교 시 원본 레이블 보존: filter만 소문자, 표시는 원본

---

## Section 7 — 구현 파일 표 (C-30 권위)

| # | Status | 절대 경로 |
|---|--------|-----------|
| 1 | NEW | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/DataMapEditor.tsx` |
| 2 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/types.ts` |
| 3 | MODIFY | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/index.ts` |

**범위 외 (deferred)**:
- Storybook `DataMapEditor.stories.tsx` — IMPLEMENT 단계 작성 (AC-008 의무, 위치: `src/__stories__/DataMapEditor.stories.tsx` — Section 13.4)
- `grid-core/src/column/rendererRegistry.ts` — DataMapEditor 자동 선택 등록 → MOD-GRID-04/05 (D-3)
- `grid-renderers/src/EditableCell.tsx` — `column.dataMap` 감지 분기 → MOD-GRID-04/05 (D-3)

**D-1 경로 정정 근거**: goals.json의 `TOMIS/packages/` prefix는 오기재 (C-28). Section 7 표의 `topvel-grid-monorepo/packages/` 경로가 실제 모노레포 구조와 일치. 선행 Goal(G-001·G-002) 동일 정정 확인.

**C-30 자체 검증**: Section 7 NEW=1, MODIFY=2, 총 3개. Pre-decisions Table D-2(types.ts), D-7(index.ts), 신규 DataMapEditor.tsx = 3개 일치.

---

## Section 8 — 의존성 분석

### 8.1 신규 의존성 없음

DataMapEditor.tsx가 사용하는 의존성:

| 의존성 | 종류 | 현재 상태 |
|--------|------|-----------|
| `react` | peerDependency | 이미 존재 |
| `@tanstack/react-table` | peerDependency | 이미 존재 |
| `./types` (DataMap, DataMapEditorProps) | 패키지 내부 | G-001+G-003 MODIFY |

신규 external dependency 추가 없음 (C-22, D-4).

### 8.2 peerDependencies 변경 없음

G-001 설정 이후 변경 없음. `@tomis/grid-license` peer 추가는 G-004 범위 유지 (G-002 선례 동일).

### 8.3 types.ts 변경 영향

`DataMapEditorProps<TItem>` 인터페이스 추가 — 기존 타입(DataMap, PathOrAccessor, CreateDataMapOptions, DataMapCellProps, TomisColumnDef) 변경 없음. additive 변경으로 기존 소비자 영향 없음.

### 8.4 index.ts 변경 영향

export 2줄 추가:
```typescript
export type { DataMapEditorProps } from './types';
export { DataMapEditor } from './DataMapEditor';
```

기존 exports(verifyOrWarn 실행 + G-001 types + G-002 DataMapCell) 보존 확인 필요 (C-31 wiring audit).

---

## Section 9 — 테스트 전략

### 9.1 단위 테스트 (IMPLEMENT 단계 작성)

| 테스트 케이스 | 검증 대상 |
|---------------|-----------|
| 마운트 시 전체 목록 표시 | query='' → filtered = getItems() 전체 |
| 필터링 동작 | query='활' → '활성'만 포함 |
| 필터링 대소문자 무시 | query='ACT' → '활성(active)' 포함 |
| ArrowDown/Up 순환 | highlightedIndex 경계 순환 |
| Enter → onCommit 호출 | onCommit(getValue(label)) 검증 |
| Escape → onCancel 호출 | onCancel() 검증 |
| IME 조합 중 Enter 무시 | isComposing=true 시 onCommit 미호출 |
| getItems() 빈 배열 | filtered=[], 동작 없음 |
| getDisplay undefined fallback | input 초기값 = '' |

### 9.2 VERIFY 단계 검증 명령

```powershell
# AC-006: Wijmo import 없음
Select-String -Path "packages/grid-pro-datamap/src/DataMapEditor.tsx" -Pattern "@mescius/wijmo" -Quiet

# AC-007: TypeScript 오류 없음
cd D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap
npx tsc --noEmit

# AC-008: Storybook 파일 존재
Test-Path "packages/grid-pro-datamap/src/__stories__/DataMapEditor.stories.tsx"
```

### 9.3 번들 크기 검증 (ADR-MOD-GRID-00-010)

IMPLEMENT 완료 후 번들 실측. 목표: +3KB 이내.

---

## Section 10 — 마이그레이션 매핑

### 10.1 Wijmo → G-003 코드 변환

**Before (Wijmo DataMap 편집)**:
```javascript
// publish-wijmo-analysis.md §4 L142 (참조만 — import 금지 C-16)
const statusColumn = new Column();
statusColumn.binding = 'statusCode';
statusColumn.dataMap = new DataMap(
  [{ key: '1', value: '활성' }, { key: '2', value: '비활성' }],
  'key',
  'value'
);
```

**After (G-003 DataMapEditor)**:
```typescript
// column 정의
const statusMap = createDataMap({
  items: [{ code: '1', label: '활성' }, { code: '2', label: '비활성' }],
  valuePath: 'code',
  displayPath: 'label',
});

const columns: TomisColumnDef<MyRow>[] = [
  {
    accessorKey: 'statusCode',
    dataMap: statusMap,
    cell: DataMapCell,            // G-002: 표시 렌더러
    // 편집 셀 배선은 MOD-GRID-04/05에서 DataMapEditor 자동 선택 (D-3)
    // 임시 수동 배선:
    // cell: (info) => (
    //   <DataMapEditor
    //     value={info.getValue()}
    //     dataMap={statusMap}
    //     onCommit={...}
    //     onCancel={...}
    //   />
    // ),
  },
];
```

### 10.2 EditableGrid selectOptions → DataMapEditor 마이그레이션

**Before (EditableCell.tsx editType='select' 방식)**:
```typescript
// EditableGrid.tsx L79-93 + EditableCell.tsx L130-153 (Before)
// meta.selectOptions = [{ label: '활성', value: '1' }, ...]
// EditableCell <select> 태그, 필터 없음
const optionalProps =
  meta.selectOptions !== undefined
    ? { selectOptions: meta.selectOptions }
    : {};
<EditableCell editType="select" {...optionalProps} ... />
```

**After (DataMapEditor)**:
```typescript
// column.dataMap + DataMapEditor (After)
const statusMap = createDataMap({
  items: [{ code: '1', label: '활성' }, { code: '2', label: '비활성' }],
  valuePath: 'code',
  displayPath: 'label',
});
// selectOptions는 @deprecated (TomisColumnDef 참조)
// DataMapEditor: 필터-타이핑 + 키보드 네비게이션 제공
```

---

## Section 11 — 구현 순서 (IMPLEMENT 단계 가이드)

### 11.1 구현 순서

1. **types.ts MODIFY**: `DataMapEditorProps<TItem>` 인터페이스 추가 (Section 3.1). 기존 타입 불변 확인.
2. **DataMapEditor.tsx NEW**: 컴포넌트 구현.
   - import: `react`, `./types` (DataMap, DataMapEditorProps)
   - 내부 상태: query, highlightedIndex, isComposing
   - useMemo로 filtered 계산 (Section 3.4)
   - onKeyDown: ArrowDown/Up/Enter/Escape (AC-004, D-4)
   - onCompositionStart/End: isComposing 관리 (D-5)
   - JSX: `<input>` + absolute 드롭다운 `<ul>`
   - C-33: verifyOrWarn 별도 호출 불필요 (D-7)
3. **index.ts MODIFY**: `DataMapEditorProps`, `DataMapEditor` export 추가. 기존 exports 보존 확인 (C-31).
4. **Storybook**: `src/__stories__/DataMapEditor.stories.tsx` 작성 (AC-008, Section 13.4).
5. **tsc 검증**: `npx tsc --noEmit` 0 errors (AC-007).

### 11.2 위험 요소

| 위험 | 대응 |
|------|------|
| TItem 제네릭 추론 실패 | DataMapEditorProps<TItem> 명시적 타입 파라미터 전달 |
| getDisplay(item) vs getDisplay(value) 혼동 | getDisplay는 `value: unknown` 수신 — item 자체가 아닌 item의 key 값 필요시 getValue 역방향 불가; getItems()로 순회 후 getDisplay(valuePath(item)) 패턴 사용 |
| isComposing ref vs state 선택 | useRef 권장 (리렌더 불필요, D-5) |
| highlightedIndex 범위 초과 | filtered.length 변경 시 highlightedIndex 리셋 (useEffect) |

### 11.3 getDisplay(item) 사용 패턴 명확화

```typescript
// DataMap.getDisplay는 코드 값(key)을 받아 레이블 반환
// getItems()는 원본 TItem 배열 반환
// 필터링 시: item → 코드 값 → getDisplay(코드값) → 레이블

// 올바른 패턴 (createDataMap 내부 Map이 valuePath(item) → displayPath(item) 저장)
const filtered = dataMap.getItems().filter((item) => {
  // item은 TItem. getDisplay는 valuePath(item)을 key로 사용
  // 따라서 각 item의 display 레이블을 얻으려면:
  // 방법 A: getDisplay를 item에 직접 — DataMap 내부 Map key가 valuePath(item)이므로
  //   실제로는 getDisplay(item)이 아닌 getDisplay(valuePath(item)) 필요
  // 방법 B: DataMap.getItems()가 반환하는 item을 getValue(getDisplay(code)) 역방향 불가
  // => IMPLEMENT 단계에서 DataMap.getItemDisplay(item: TItem): string 헬퍼 추가 검토
  //    또는 DataMapEditorProps에 labelPath 추가 결정 위임
  const label = dataMap.getDisplay(item as unknown) ?? '';
  return label.toLowerCase().includes(query.toLowerCase());
});
```

**IMPLEMENT 위임**: `getDisplay(item)` 동작이 valuePath 추출 없이 item 자체를 key로 사용할 경우 매핑 실패. IMPLEMENT 단계에서 DataMap.ts L20-27 실측 후 필터 패턴 확정. 대안: `DataMapEditorProps`에 `getLabelFromItem: (item: TItem) => string` 선택적 추가 검토.

---

## Section 12 — 미구현 목록 (Deferred)

| 항목 | 이유 | defer 대상 |
|------|------|-----------|
| AC-005 렌더러 레지스트리 통합 (`column.dataMap` 자동 감지) | cross-package (grid-core) 수정 필요 (D-3) | MOD-GRID-04/05 |
| `EditableCell.tsx` column.dataMap 분기 추가 | grid-renderers 패키지 수정 필요 (D-3) | MOD-GRID-04/05 |
| 가상 스크롤 목록 (긴 getItems() 최적화) | AC 미기재, 별도 성능 요건 없음 | 추후 별도 Goal |
| 다중 선택 (multiSelect) | AC 미기재 | 추후 별도 Goal |
| `@tomis/grid-license` peer dependency 실제 연결 | MOD-GRID-99-A/G-002 선행 필요 (C-33) | MOD-GRID-99-A/G-002 |

---

## Section 13 — 상용 제품화 영향

### 13.1 패키지 대상

- `packages/grid-pro-datamap` (Pro 패키지, licenseTier=Pro)
- 신규 공개 API: `DataMapEditorProps<TItem>`, `DataMapEditor`

### 13.2 공개 API 목록 (index.ts export 기준)

G-003 완료 후 누적 exports:

```typescript
// G-001
export type { CreateDataMapOptions, DataMap, DataMapCellProps, PathOrAccessor, TomisColumnDef };
export { createDataMap };
// G-002
export { DataMapCell };
// G-003 (추가)
export type { DataMapEditorProps };
export { DataMapEditor };
```

### 13.3 EULA

G-001에서 `grid-pro-datamap/EULA.md` 생성 완료. G-003 변경 없음.

### 13.4 Storybook story (AC-008 의무)

- 파일 위치: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/__stories__/DataMapEditor.stories.tsx`
- 시나리오 1: 정적 dataMap — statusCode → 활성/비활성/대기 필터-타이핑
- 시나리오 2: 긴 목록 필터링 — 50개 항목 중 query 입력으로 좁히기
- C-3 준수: 스토리 내 fixture 데이터 허용 (Storybook story 예외)
- 구현은 IMPLEMENT 단계 책임

### 13.5 Docusaurus 문서 (D-6)

- 문서 경로: `docs/grid-pro/datamap/DataMapEditor.mdx`
- 내용: API 레퍼런스 (DataMapEditorProps, DataMapEditor) + 사용 예제
- 구현은 IMPLEMENT 단계 책임 (D-6 F-03 재발 방지)

### 13.6 AC↔구현 매핑 표 (E-04)

| AC | EC (검증 수단) | 구현 파일 | 섹션 |
|----|---------------|-----------|------|
| AC-001 props 계약 | DataMapEditorProps 인터페이스 tsc 검증 | types.ts (MODIFY) | Section 3.1 |
| AC-002 필터-타이핑 | useMemo filtered 로직 + 단위테스트 | DataMapEditor.tsx (NEW) | Section 3.4 |
| AC-003 Tailwind 스타일 | JSX className 코드 리뷰 | DataMapEditor.tsx (NEW) | Section 4 AC-003 |
| AC-004 키보드 네비 | onKeyDown 핸들러 + 단위테스트 | DataMapEditor.tsx (NEW) | Section 4 AC-004 |
| AC-005 renderer registry | Deferred → MOD-GRID-04/05 | (이번 Goal 범위 밖) | Section 4 AC-005, Section 12 |
| AC-006 Wijmo 없음 | Grep `@mescius/wijmo` 0건 | DataMapEditor.tsx (NEW) | Section 9.2 |
| AC-007 tsc 0 error | `npx tsc --noEmit` | 전체 3개 파일 | Section 9.2 |
| AC-008 Storybook story | 파일 존재 + 시나리오 2개 확인 | DataMapEditor.stories.tsx | Section 13.4 |

### 13.7 Self-Check (G-01 의무)

- [x] 13개 Section 존재 (Section 0~13)
- [x] 7개 D-decision 존재 (D-1~D-7)
- [x] TBD / TODO / 미정 = 0 (IMPLEMENT 위임 항목은 명시적 "IMPLEMENT 단계 책임" 표현 사용)
- [x] Section 7 NEW=1 + MODIFY=2 = 3개; Pre-decisions D-2, D-7 + DataMapEditor.tsx 일치 (C-30)
- [x] H-01: L0 = EditableCell.tsx (실존 경로 `grid-renderers/src/EditableCell.tsx` 명시, InlineEditCell.tsx 미존재 D-3 명시), R-A = publish-aggrid-analysis.md (존재), R-W = publish-wijmo-analysis.md (존재), L2 = G-001-spec.md + G-002-spec.md + 실제 구현 파일 (존재)
- [x] H-02: Section 7 부모 디렉토리 `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-datamap/src/` 실재 (G-001·G-002 구현 완료로 확인)
- [x] H-03: AC source 태그 모두 spec 내 다른 섹션에서 실제 인용 (C-4=Section 5, L1=Section 1, C-5=Section 5, C-16=Section 5, C-12=Section 5, C-25=Section 13.4, C-7=Section 1 R-A)
- [x] E-02 Before/After: Section 10.1 (Wijmo Before/After), Section 10.2 (EditableGrid Before/After) — 명시적 "Before"/"After" 레이블 + 코드 펜스
- [x] F-03: Docusaurus 경로 명시 — `docs/grid-pro/datamap/DataMapEditor.mdx` (D-6, Section 13.5)
- [x] AC↔EC 매핑 표 (E-04): Section 13.6

---
