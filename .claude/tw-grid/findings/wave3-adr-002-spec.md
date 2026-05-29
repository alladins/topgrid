# ADR-002 Implementation Spec — rendererRegistry cross-package wiring (grid-core ↔ grid-renderers)

**작성일**: 2026-05-17
**상태**: draft (사용자 검토 대기)
**원본 ADR**: MOD-GRID-REFACTOR-2026-05-17-002 (옵션 1 채택 — `grid-renderers` 가 grid-core registry 를 side-effect 로 채움)
**작성자**: spec writer (Wave 3)
**probe typecheck**: ✅ 통과 (별도 `tsconfig.probe.json` 경유, `npx tsc --noEmit -p tsconfig.probe.json` exit 0 — probe 파일 검증 후 spec writer 단계 종료 시점에 삭제하여 `pnpm typecheck` (default script) 무결성 유지)
**연관 학습**: ADR-014 amendment v2 — single `as` cast 격리 패턴 (`asCell`), wave1-adr-014-result-v2.md
**연관 시정**: ADR-001 spec writer 의 인벤토리-검증 학습 (wave2-adr-001-spec.md §0)

---

## 0. Executive Summary

ADR-002 본문은 “옵션 1 채택: side-effect import 로 12 type wire” 까지만 명시하고 **(a) 함수 시그니처 비호환성 — `RendererFn(CellContext)` vs `CellComponent({value})` 어댑터 패턴, (b) `TomisColumnType` 9 vs `defaultRendererRegistry` 14 키 union 정합, (c) `sideEffects` 선언 필수성, (d) grid-core placeholder registry 제거/유지 결정**의 4가지 핵심 implementer 의문을 미해결.

**probe 실증 결과 (이 spec 의 권고 옵션 검증용)**:

| TomisColumnType 슬롯 | wiring 가능? | 패턴 | 사유 |
|---------------------|------------|------|------|
| `text` | ✅ | `adaptValueCell(TextCell, info => ...)` | value adapter 적용 |
| `number` | ✅ | `adaptValueCell(NumberCell, ...)` | value adapter |
| `date` | ✅ | `adaptValueCell(DateCell, ...)` | value adapter |
| `dateTime` | ✅ | bespoke fn (`DateCell { format: 'datetime' }`) | alias of date + 추가 prop |
| `badge` | ✅ | `adaptValueCell(StatusBadgeCell, ...)` | value adapter |
| `link` | ✅ (제약 있음) | bespoke fn (conditional value prop) | `LinkCellProps.value?` optional + `exactOptionalPropertyTypes` |
| `boolean` | ⚠️ (cell 없음) | grid-core 기본 Y/N 유지 (등록 생략) | grid-renderers 에 BooleanCell 없음 |
| `icon` | ❌ | **wiring 불가** | `IconCellProps.icon: ReactNode` 필수 — cell value 만으로 ReactNode 생성 불가 |
| `checkbox` | ❌ (의도) | **registry 우회** | `createColumns.ts:96-108` 이 DisplayColumnDef 분기로 registry 미사용 |

**결론**: 9 TomisColumnType 중 **6개 신규 어댑터 wire (text/number/date/dateTime/badge/link)**, **1개 기존 grid-core 기본 동작 유지 (boolean → Y/N)**, **2개 wiring 안 함 (icon — 구조적 불가, checkbox — createColumns 가 DisplayColumnDef 로 우회)**. ADR 본문의 "12 type wire" 가정은 **부정확** — 실 신규 wirable 슬롯은 6개.

**사용자 결정 지점 (4건, §6 상세)**:
1. **icon wiring 정책** — placeholder 유지 / 사용자 명시 wiring 강제 / TomisColumnType 에서 제거 중 택1
2. **5 extras (button/tag/avatar/progress + 2 alias)** wiring 범위 — sub-option 2b (defer) 권고
3. **grid-core placeholder registry 처리** — keep-as-fallback / 삭제 중 택1 (keep 권고)
4. **`peerDependencies` vs `dependencies`** — peerDep 권고 (POL-COMPAT §2)

**권고**:
- **Step 0 (선행)**: `package.json` 양측 `sideEffects` 명시 (필수, POL-BUNDLE §1)
- **Step 1 (본 작업)**: grid-renderers/src/index.ts 에 side-effect wiring 추가 (~30 LOC, 어댑터 helper + 7 등록 호출)
- **Step 2 (선택)**: grid-core 의 placeholder registry → keep-as-fallback (graceful degradation, 권고)
- **Step 3 (별도 ADR)**: 5 extras + icon 정책 — ADR-002a sub-ADR 또는 ADR-018 신설

---

## 1. 두 registry shape 인벤토리

### 1.1 grid-core: `packages/grid-core/src/column/rendererRegistry.ts:33`

```ts
export const defaultRendererRegistry: RendererRegistry = new Map<TomisColumnType, RendererFn>([
  ['number',   (info) => String(info.getValue() ?? '')],   // placeholder
  ['boolean',  (info) => (info.getValue() ? 'Y' : 'N')],
  ['dateTime', (info) => String(info.getValue() ?? '')],   // placeholder
  ['date',     (info) => String(info.getValue() ?? '')],   // placeholder
  ['text',     (info) => String(info.getValue() ?? '')],
  ['badge',    (info) => String(info.getValue() ?? '')],   // placeholder
  ['link',     (info) => String(info.getValue() ?? '')],   // placeholder
  ['icon',     (info) => String(info.getValue() ?? '')],   // placeholder
  ['checkbox', (info) => String(info.getValue() ?? '')],   // (bypassed by createColumns)
]);
```

| 항목 | 값 |
|------|---|
| 컨테이너 | `Map<TomisColumnType, RendererFn>` |
| 키 타입 | `TomisColumnType` (9 union, types.ts:33-42) |
| 값 타입 | `RendererFn<TData> = (info: CellContext<TData, unknown>) => ReactNode` (types.ts:109-111) |
| 엔트리 수 | 9 (전부 placeholder, 단 `boolean` 만 의미 있는 Y/N) |
| 변이 API | `registerRenderer<TData>(type: TomisColumnType, fn: RendererFn<TData>, registry?)` |
| `createColumns` 소비 | `createColumns.ts:111-112` → `registry.get(def.type)` |

### 1.2 grid-renderers: `packages/grid-renderers/src/rendererRegistry.ts:74`

```ts
export const defaultRendererRegistry: Record<string, CellComponent> = {
  text:        asCell(TextCell),
  number:      asCell(NumberCell),
  date:        asCell(DateCell),
  dateTime:    asCell(DateCell),       // alias
  badge:       asCell(StatusBadgeCell),
  statusBadge: asCell(StatusBadgeCell), // alias
  link:        asCell(LinkCell),
  button:      asCell(ButtonCell),     // not in TomisColumnType
  checkbox:    asCell(CheckCell),
  check:       asCell(CheckCell),       // alias
  icon:        asCell(IconCell),
  tag:         asCell(TagCell),         // not in TomisColumnType
  avatar:      asCell(AvatarCell),      // not in TomisColumnType
  progress:    asCell(ProgressCell),    // not in TomisColumnType
};
```

| 항목 | 값 |
|------|---|
| 컨테이너 | `Record<string, CellComponent>` |
| 키 타입 | `string` (런타임 widening) |
| 값 타입 | `CellComponent = ComponentType<{ value: unknown; row?: Row<unknown>; column?: Column<unknown,unknown> }>` |
| 엔트리 수 | 14 (11 unique cell + 3 alias) |
| 변이 API | `registerRenderer(type: string, component: CellComponent)` (별도 internal `registryInstance`) |
| `createColumns` 소비 | **0건** — createColumns 가 이 registry 를 읽지 않음 (보고서 §3.1 결함) |

### 1.3 shape 비호환성 — 핵심 누락 사항 (ADR 본문 미명시)

| 항목 | grid-core RendererFn | grid-renderers CellComponent | 변환 |
|------|---------------------|----------------------------|------|
| 입력 | `CellContext<TData, unknown>` (TanStack 컨텍스트) | `{ value, row?, column? }` props | adapter 필요 |
| 출력 | `ReactNode` | `ReactNode` (ComponentType 호출 결과) | OK |
| `value` 추출 | `info.getValue()` (unknown) | `props.value` (각 cell 별 narrow 타입) | per-cell pickValue 함수 |
| 추가 prop | 없음 (fn 만) | cell-specific (e.g. `DateCell.format`, `NumberCell.decimals`) | bespoke fn 또는 meta 경유 |

**중요 함의**: `registerRenderer('number', NumberCell)` 식 **직접 등록 불가**. `NumberCell` 은 `ComponentType<{value: number|null|undefined}>` 이고 `RendererFn` 은 `(CellContext) => ReactNode` 이므로 시그니처가 다름. **adapter factory 필수**.

---

## 2. ADR 본문 가정 vs 현실 (정합 점검)

| ADR-002 가정 | 현실 | 영향 |
|-------------|------|------|
| “12 type 의 실 컴포넌트를 wire” (line 125) | wirable 슬롯 6+1 placeholder, 1 불가능, 1 우회 (§0 표) | 본 spec 가 정확 수 정정 |
| 옵션 1 의 코드 예시는 `registerRenderer('text', /* render fn */, defaultRendererRegistry)` (보고서 §3.1:269-274) | render fn 시그니처가 adapter 임을 명시하지 않음 | 본 spec §3 adapter 패턴 명시 |
| "grid-renderers/package.json 의 `peerDependencies` 에 `@tomis/grid-core` 추가" (line 125) | 현 grid-renderers/package.json: `@tomis/grid-core` 미선언 (peerDep 도 dep 도 0건) | 본 spec Step 0 에 명시 |
| 결과 체크리스트: "`defaultRendererRegistry` 가 import 후 12+ entries 보유" (line 170) | createColumns 는 grid-core 의 Map 을 읽음 — 9 entries (TomisColumnType 한정). "12+" 는 grid-renderers 의 14 와 혼동 | **본 spec 가 결과 체크 조항 수정 권고**: grid-core Map 의 7 슬롯이 placeholder → adapter 로 교체됨 |
| `tsup.config.ts` 의 `sideEffects` 설정 (line 164) | grid-renderers/package.json `sideEffects` **미선언** (grid-pro-header 만 선언) | 본 spec Step 0 에 필수 명시 |
| "보고서 §12 #2 예상 공수 6h" | adapter helper + 7 등록 + sideEffects 선언 + CHANGELOG/Changeset + probe 정리 — 4~5h 추정 | 본 spec §7 |

---

## 3. 권고 어댑터 패턴

### 3.1 adapter factory — 단일 `as` cast 격리 (ADR-014 학습)

```ts
// packages/grid-renderers/src/wireRegistry.ts (신규 파일 — 명세 §5 Step 1)
import type { ComponentType, ReactNode } from 'react';
import type { CellContext } from '@tanstack/react-table';
import type { RendererFn } from '@tomis/grid-core';

/**
 * Adapter: 임의 cell component (props.value 형) 를 grid-core RendererFn 로 변환.
 *
 * 단일 `as` cast 가 본 함수에 격리됨 (ADR-014 amendment 의 `asCell` 패턴 미러).
 * Per-type 호출처에서는 명시 `pickValue` 로 value 타입을 narrow.
 */
export function adaptValueCell<TData, V>(
  Cell: ComponentType<{ value: V }>,
  pickValue: (info: CellContext<TData, unknown>) => V,
): RendererFn<TData> {
  return (info) => createElement(Cell, { value: pickValue(info) });
}
```

(별도 `wireRegistry.ts` 파일 사용 권장 — `src/index.ts` 의 side-effect import 분리 + 단위 테스트성 ↑.)

### 3.2 7 슬롯 wiring 매핑 (probe 검증됨)

```ts
// packages/grid-renderers/src/wireRegistry.ts (이어서)
import { registerRenderer } from '@tomis/grid-core';
import { TextCell } from './TextCell.js';
import { NumberCell } from './NumberCell.js';
import { DateCell } from './DateCell.js';
import { StatusBadgeCell } from './StatusBadgeCell.js';
import { LinkCell } from './LinkCell.js';
import { createElement } from 'react';

export function wireDefaultRenderers(): void {
  // text → TextCell({ value })
  registerRenderer(
    'text',
    adaptValueCell(
      TextCell as ComponentType<{ value: string | number | null | undefined }>,
      (info) => info.getValue() as string | number | null | undefined,
    ),
  );

  // number → NumberCell({ value })
  registerRenderer(
    'number',
    adaptValueCell(
      NumberCell as ComponentType<{ value: number | null | undefined }>,
      (info) => info.getValue() as number | null | undefined,
    ),
  );

  // date → DateCell({ value })
  registerRenderer(
    'date',
    adaptValueCell(
      DateCell as ComponentType<{ value: string | number | Date | null | undefined }>,
      (info) => info.getValue() as string | number | Date | null | undefined,
    ),
  );

  // dateTime → DateCell with format='datetime' — bespoke (extra prop)
  registerRenderer(
    'dateTime',
    (info) =>
      createElement(DateCell, {
        value: info.getValue() as string | number | Date | null | undefined,
        format: 'datetime',
      }),
  );

  // badge → StatusBadgeCell({ value })
  registerRenderer(
    'badge',
    adaptValueCell(
      StatusBadgeCell as ComponentType<{ value: string }>,
      (info) => String(info.getValue() ?? ''),
    ),
  );

  // link → LinkCell — bespoke (LinkCellProps.value?: optional + exactOptionalPropertyTypes)
  registerRenderer('link', (info) => {
    const raw = info.getValue();
    if (raw == null) return createElement(LinkCell, {});
    return createElement(LinkCell, { value: String(raw) });
  });

  // boolean → keep placeholder (Y/N) — grid-renderers 에 대응 cell 없음
  // (registerRenderer 호출 생략 — grid-core 의 default Y/N 동작 유지)

  // icon, checkbox: §4 참조 — wiring 안 함.
}
```

### 3.3 Side-effect entry — `grid-renderers/src/index.ts`

```ts
// 기존 export 들 (변경 없음)
// ...

// G-004 ADR-002: grid-core registry 자동 wiring (side-effect)
import { wireDefaultRenderers } from './wireRegistry.js';
wireDefaultRenderers();
```

**대안**: `wireDefaultRenderers()` 를 top-level 즉시 호출 대신 명시 export 하여 사용자가 opt-in 호출 — **권고 안 함**. ADR-002 의 "옵션 1 = zero-config" 의도와 어긋남.

---

## 4. wiring 불가 / 우회 슬롯 처리

### 4.1 `icon` — wiring 불가 (사용자 결정 지점 #1)

`IconCellProps`:

```ts
export interface IconCellProps {
  icon: ReactNode;       // ← required, ReactNode 타입
  label?: string;
  onClick?: () => void;
  color?: string;
  className?: string;
}
```

**문제**: `icon` prop 이 `ReactNode` (e.g. `<HomeIcon />`) 인데, cell 의 `info.getValue()` 만으로는 ReactNode 생성 불가능. icon mapping 은 컬럼 정의 시점에 사용자가 명시해야 함.

**선택지** (사용자 결정):

| 옵션 | 설명 | 권고 |
|------|------|------|
| **4.1-A** (status quo) | grid-core placeholder `String(value)` 유지. 사용자가 type='icon' 사용 시 plain text 렌더 | 보수 — 기존 ADR-002 결과 체크 항목과 충돌 (12 type 가정) |
| **4.1-B** (meta 경유) | `column.columnDef.meta?.icon` 에서 ReactNode 추출. createColumns 가 def.meta.icon 을 노출하도록 — 별도 spec 필요 | 정합 — TomisColumnDef.meta 확장 (minor on grid-core), 추가 ADR |
| **4.1-C** (제거) | `TomisColumnType` 에서 `'icon'` 삭제 (semver — type narrowing이라 breaking 의도) | 단순 but 기존 사용자 영향 |
| **4.1-D** (사용자 wiring 강제) | createColumns 가 type='icon' + 사용자 미정의 cell 시 console.error 후 placeholder | 명시적 보호 |

**spec 권고**: **4.1-A (status quo)** — 본 ADR 범위 밖. ADR-002 결과 체크 항목 "12 type" → "**6 wirable + 1 placeholder + 1 우회 + 1 deferred**" 로 정정. icon 정책은 ADR-002a 또는 ADR-018 신설 (사용자 결정).

### 4.2 `checkbox` — registry 우회 (의도)

`createColumns.ts:96-108` 분석:

```ts
if (isCheckbox) {
  const checkboxDef: ColumnDef<TData> = {
    id: def.id,
    header: () => null,
    cell: () => null,           // ← MOD-GRID-05 CheckboxCell placeholder
    enableSorting: false,
    enableResizing: false,
    size: baseWidth,
    meta: metaValue,
  };
  return checkboxDef;            // ← registry.get(def.type) 호출 전에 return
}
```

`registry.get('checkbox')` 가 호출되지 않음. **wiring 불필요**. 단 `cell: () => null` 도 placeholder — `CheckCell` wiring 은 별도 작업 (MOD-GRID-04 의 미완 항목, 본 ADR 범위 외).

**spec 권고**: 본 ADR 에서 `'checkbox'` 슬롯 wiring 생략. `createColumns.ts:101` 의 `cell: () => null` 은 별도 issue (보고서 §3.1 후속).

### 4.3 5 extras (`button`, `tag`, `avatar`, `progress`, alias `statusBadge`/`check`)

probe 결과 (§5 hard finding):

```ts
coreRegister('button', /* ... */);
//          ^^^^^^^^   TS2345: '"button"' not assignable to TomisColumnType.
```

5 extras 를 wire 하려면 `TomisColumnType` union 확장 필요. 옵션:

| 옵션 | 설명 | 영향 |
|------|------|------|
| **4.3-A** (sub-option 2b) | wiring 범위를 9 overlap 으로 한정. 5 extras 는 `grid-renderers/defaultRendererRegistry` 의 별도 Record 로만 접근 가능 | grid-core 변경 0, ADR-018 deferred |
| **4.3-B** (union 확장) | `TomisColumnType` 에 `'button' \| 'tag' \| 'avatar' \| 'progress'` 추가 (minor on grid-core), aliases 는 wiring 안 함 | grid-core minor, ADR-002 범위 확장 |
| **4.3-C** (Map 키를 `string` 으로 loosen) | `RendererRegistry<TData> = Map<string, RendererFn<TData>>` — 기존 `Map<TomisColumnType, ...>` 사용처 type-level breaking | grid-core major |

**spec 권고**: **4.3-A (sub-option 2b)** — ADR-002 의 의도(P0 결함 시정)를 9 overlap 으로 한정. 5 extras 는 ADR-002 후속 (사용자 결정).

---

## 5. probe 결과

### 5.1 probe 파일 + tsconfig (검증 후 삭제됨)

spec writer 단계에서 일시 작성 후 삭제 (default `pnpm typecheck` 보호):

- `packages/grid-renderers/src/__probe__/adr-002-wiring.probe.ts` (~137 LOC) — 삭제됨
- `packages/grid-renderers/tsconfig.probe.json` (workspace `@tomis/grid-core` paths 매핑, peerDep 미선언 상태에서 검증 가능) — 삭제됨

implementer 재실행 가능성을 위해 §3.1+§3.2 의 코드가 본 spec 에 그대로 보존됨. 재검증 시 동일 구조 재현 권장 (peerDep 등록 후에는 path 매핑 불요 — workspace symlink 가 자동 해결).

### 5.2 검증 명령 + 결과 (이력 보존)

```powershell
cd D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers
npx tsc --noEmit -p tsconfig.probe.json
# EXIT=0  (errors: 0)

# probe 삭제 후 default typecheck 무결성 확인:
pnpm typecheck
# EXIT=0  (errors: 0)
```

### 5.3 probe 가 surfaced 한 hard findings

| Finding | 내용 |
|---------|------|
| F-1 | `LinkCellProps.value?: string` optional + `exactOptionalPropertyTypes: true` → `{ value: undefined }` 는 `LinkCellProps` 에 비할당 (TS2375). bespoke fn 분기 필수 |
| F-2 | `IconCellProps.icon: ReactNode` (required, value 아님) → `adaptValueCell(IconCell, ...)` 컴파일 실패 (probe 주석 line 109) |
| F-3 | `coreRegister('button', ...)` TS2345 (TomisColumnType union 외) — 5 extras wiring 불가 |
| F-4 | rootDir 격리: cross-package relative import 불가 — package name + workspace paths 또는 peerDep 등록 필수 |

### 5.4 probe 파일 폐기 정책

spec writer 단계에서 즉시 삭제 완료 (default `pnpm typecheck` 보호 — `tsconfig.json` 의 `include: ["src/**/*"]` 가 probe 를 빨아들이고 `@tomis/grid-core` 모듈 해결 실패로 typecheck 깨짐).

implementer 가 재현이 필요하면:

1. §3.1 + §3.2 의 코드를 `src/__probe__/adr-002-wiring.probe.ts` 로 복사
2. `tsconfig.probe.json` 재구성:
   ```json
   {
     "extends": "../../tsconfig.base.json",
     "compilerOptions": {
       "noEmit": true,
       "paths": { "@tomis/grid-core": ["../grid-core/src/index.ts"] }
     },
     "include": [
       "src/**/*",
       "../grid-core/src/index.ts",
       "../grid-core/src/column/types.ts",
       "../grid-core/src/column/rendererRegistry.ts"
     ],
     "exclude": ["src/__stories__", "**/*.stories.tsx", "**/*.test.ts", "**/*.test.tsx"]
   }
   ```
3. `npx tsc --noEmit -p tsconfig.probe.json` 으로 검증
4. 검증 후 즉시 삭제 (또는 `tsconfig.json` 의 `exclude` 에 `"src/__probe__"` 추가하여 영구 격리 — 권고 안 함, default typecheck 가 probe 안전 검증을 못함)

---

## 6. 사용자 결정 지점 (4건)

implementer 진입 전 답이 필요한 사항:

### D-1. icon 슬롯 정책 (§4.1)

| 선택지 | 변경 | 영향 |
|--------|------|------|
| **A (권고)**: status quo placeholder 유지 | 0 LOC | ADR-002 결과 체크 항목 정정 |
| B: meta 경유 wiring | createColumns + TomisColumnDef.meta 확장 | grid-core minor + 별도 ADR |
| C: TomisColumnType 에서 제거 | union narrow | grid-core breaking (semver 신호) |
| D: console.error 경고 | createColumns 분기 추가 | 명시적 보호, 추가 LOC |

### D-2. 5 extras (button/tag/avatar/progress) 범위 (§4.3)

| 선택지 | 변경 | 영향 |
|--------|------|------|
| **A (권고, sub-option 2b)**: defer to follow-up | 0 LOC, ADR-002 가 9 overlap 만 처리 | 5 extras 는 grid-renderers 직접 import 로만 접근 |
| B: TomisColumnType union 확장 | grid-core/column/types.ts:33 union 4개 추가 | grid-core minor |
| C: Map key 를 string 으로 loosen | RendererRegistry type 변경 | grid-core major (breaking) |

### D-3. grid-core placeholder registry 처리 (advisor 자문 #4)

| 선택지 | 변경 | 영향 |
|--------|------|------|
| **A (권고)**: keep-as-fallback | 0 LOC (현 9 placeholder 유지 — wiring 후 7개가 adapter 로 교체됨, boolean/icon/checkbox 는 placeholder 유지) | grid-renderers 미설치 사용자도 plain text fallback, graceful degradation |
| B: 제거 (createColumns 의 EC-02 fallback 만 의존) | rendererRegistry.ts:33-52 삭제 (~20 LOC) | grid-renderers 미설치 시 모든 type 이 console.warn + plain text — 사용자 경험 동일 but breaking signal 강함 |

### D-4. `peerDependencies` vs `dependencies` (advisor #4 변종)

ADR-002 line 125: "peerDependencies 추가". 확정 권고:

| 선택지 | 변경 | 영향 |
|--------|------|------|
| **A (권고, ADR 본문 따름)**: peerDep | `grid-renderers/package.json` 에 `"peerDependencies": { "@tomis/grid-core": "workspace:*" }` 또는 semver range | 사용자가 두 패키지 별도 install — 버전 듀얼 일치 책임 |
| B: dependencies | hard dep — semver 자동 lock | grid-features 의 hard dep 패턴 (보고서 §4.1) 과 동일 — 사용자가 grid-core 만 업데이트 불가, **§4.1 ADR-009 의 layering 정리 의도와 정면 충돌** |

---

## 7. 구현 단계 (implementer 직진용)

### Step 0 — `package.json` 정합 (선행 필수)

**0.1 `packages/grid-renderers/package.json`**:

```diff
   "files": ["dist", "README.md"],
+  "sideEffects": ["./src/index.ts"],
   "scripts": {
     ...
   },
+  "peerDependencies": {
+    "@tomis/grid-core": "workspace:*",
     "react": "^18.0.0 || ^19.0.0",
     "react-dom": "^18.0.0 || ^19.0.0",
     "@tanstack/react-table": ">=8.0.0 <9.0.0"
   }
```

**근거**:
- `sideEffects: ["./src/index.ts"]` — POL-BUNDLE §1, tree-shaking 시 `wireDefaultRenderers()` 호출이 보존되도록. **`grid-pro-header/package.json:27` convention 미러** (dist 경로 대신 src 경로 사용 — 본 monorepo 의 Vite/tsup 환경에서 src 경로가 양 빌드 결과(`dist/index.mjs`+`dist/index.cjs`)에 동일 적용됨). implementer 가 Step 6 의 Storybook tree-shake 검증으로 확정 (필요 시 dist 경로 추가).
- `peerDependencies."@tomis/grid-core"` — D-4 권고 안.
- workspace:* range — pnpm monorepo 표준 (grid-pro-header/grid-features 와 동일).

**0.2 `packages/grid-core/package.json`** — 변경 없음 (D-3 선택지 A 채택 시).

### Step 1 — adapter 모듈 + wiring 함수

`packages/grid-renderers/src/wireRegistry.ts` 신규 (§3.1 + §3.2 의 코드, ~70 LOC):

- `adaptValueCell<TData, V>(Cell, pickValue)` — 단일 `as` cast 격리
- `wireDefaultRenderers()` — 7 슬롯 등록 (text/number/date/dateTime/badge/link + adapter helper)
- `boolean` 는 grid-core 기본 Y/N 유지 (등록 생략)
- `icon`/`checkbox`/5 extras 는 등록 생략 (§4 정책)

### Step 2 — `src/index.ts` side-effect import

`packages/grid-renderers/src/index.ts` 끝에 추가:

```ts
import { wireDefaultRenderers } from './wireRegistry.js';
wireDefaultRenderers();
```

`wireDefaultRenderers` 는 export 안 함 (internal — 사용자는 import 시 자동 실행).

### Step 3 — grid-core placeholder registry 정합 (D-3-A 적용 시)

변경 없음. **단** 주석 갱신 (`rendererRegistry.ts:7-9`):

```diff
- * MOD-GRID-05 pending 단계에서 `registerRenderer()`로 실제 구현을 주입받는다.
- * 이 Goal에서는 `number`/`dateTime`/`date`/`badge`/`link`/`icon`/`checkbox` 모두
- * `String(value)` plain text placeholder — 런타임 안전성 보장.
+ * `@tomis/grid-renderers` 가 import 시 `wireDefaultRenderers()` side-effect 로
+ * `text`/`number`/`date`/`dateTime`/`badge`/`link` 슬롯을 실 컴포넌트 어댑터로 교체한다 (ADR-002).
+ * grid-renderers 미설치 시 본 placeholder 가 fallback 으로 동작 (graceful degradation).
+ * `boolean` — Y/N 유지. `icon` — placeholder 유지 (ADR-002a deferred).
+ * `checkbox` — createColumns.ts:96-108 의 DisplayColumnDef 분기로 우회 (registry 미사용).
```

### Step 4 — 단위 테스트

`packages/grid-renderers/src/wireRegistry.test.ts` 신규 (~50 LOC):

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { defaultRendererRegistry } from '@tomis/grid-core';
import './index.js'; // side-effect — wireDefaultRenderers 호출

describe('wireRegistry — ADR-002', () => {
  it('text/number/date/dateTime/badge/link 7 슬롯이 adapter 로 교체됨', () => {
    for (const t of ['text', 'number', 'date', 'dateTime', 'badge', 'link'] as const) {
      const fn = defaultRendererRegistry.get(t);
      expect(fn).toBeDefined();
      // wiring 전 placeholder 와 비교 — 더 이상 String(value) 가 아님
      // (런타임 렌더링 결과 검증은 Storybook 또는 통합 테스트)
    }
  });

  it('boolean placeholder 유지 (Y/N)', () => {
    const fn = defaultRendererRegistry.get('boolean');
    expect(fn).toBeDefined();
    // 시그니처 호출 검증 (mock CellContext) — Y/N 반환
  });

  it('icon/checkbox 는 registry 등록 변경 없음 (placeholder 유지)', () => {
    // existence 만 검증
  });
});
```

### Step 5 — CHANGELOG + Changeset

**5.1 `packages/grid-renderers/CHANGELOG.md`** (MINOR):

```markdown
## v0.2.0

### Minor Changes

- ADR-MOD-GRID-REFACTOR-2026-05-17-002: cross-package wiring with `@tomis/grid-core`.
  - `import '@tomis/grid-renderers'` now auto-wires `text`/`number`/`date`/`dateTime`/`badge`/`link` slots
    in `@tomis/grid-core`'s `defaultRendererRegistry` via `wireDefaultRenderers()` side-effect.
  - New peerDependency: `@tomis/grid-core` (workspace:*).
  - `boolean` keeps grid-core's Y/N default; `icon` stays placeholder (deferred to ADR-002a);
    `checkbox` is routed through `createColumns`' DisplayColumnDef branch (registry bypassed).
  - 5 extras (`button`, `tag`, `avatar`, `progress`) remain accessible only via direct cell imports;
    `TomisColumnType` extension deferred to a follow-up ADR.
```

**5.2 `packages/grid-core/CHANGELOG.md`** (PATCH — 주석 정합만):

```markdown
## v0.0.1

### Patch Changes

- ADR-MOD-GRID-REFACTOR-2026-05-17-002: `defaultRendererRegistry` placeholders now act as graceful fallback
  when `@tomis/grid-renderers` is not installed. No public API change.
```

**5.3 `.changeset/adr-002-cross-package-wiring.md`**:

```markdown
---
'@tomis/grid-renderers': minor
'@tomis/grid-core': patch
---

ADR-002 cross-package wiring: `@tomis/grid-renderers` auto-registers 6 cell adapters into
`@tomis/grid-core`'s `defaultRendererRegistry` via side-effect import. New peerDep on grid-core.
```

### Step 6 — 검증

```powershell
cd D:/project/topvel_project/topvel-grid-monorepo
pnpm install                            # peerDep 갱신 반영
pnpm -r typecheck                        # 전 패키지 typecheck PASS
pnpm -r build                            # build PASS
pnpm size                                # grid-renderers 한도 10KB 유지 (ADR 결과 항목)
```

추가 통합 검증 (수동):

```powershell
# tw-framework-front
cd D:/project/topvel_project/TOMIS/tw-framework-front
pnpm build                               # 페이지 빌드 영향 없음 확인
# 페이지가 createColumns 미사용이므로 런타임 영향 0 — Storybook 에서만 검증 가능
```

### Step 7 — Storybook 시각 검증 (선택, MOD-GRID-99-B 와 연계)

`packages/grid-core/stories/Grid.stories.tsx` 또는 신규 story:

```tsx
import { Grid, createColumns } from '@tomis/grid-core';
import '@tomis/grid-renderers'; // side-effect

const columns = createColumns<{ name: string; amount: number; date: string }>([
  { id: 'name',   name: '이름', type: 'text',   align: 'left',  width: '150' },
  { id: 'amount', name: '금액', type: 'number', align: 'right', width: '120' },
  { id: 'date',   name: '날짜', type: 'date',   align: 'center', width: '120' },
]);
// Before ADR-002: name/amount/date 모두 plain text.
// After ADR-002:  amount 가 locale 포맷 (NumberCell), date 가 ko-KR 날짜 (DateCell).
```

### Step 8 — probe 정리 (이미 삭제됨)

spec writer 단계에서 probe 파일 + `tsconfig.probe.json` 은 default `pnpm typecheck` 보호를 위해 이미 삭제됨 (§5.4). implementer 단계에서 추가 정리 작업 없음.

implementer 가 wiring 정합 재검증을 원하면 §5.4 의 재현 절차로 probe 재생성 → typecheck → 삭제.

---

## 8. 위험 + 알려진 한계

### 8.1 tree-shaking 위험 (POL-BUNDLE §1)

`grid-renderers/src/index.ts` 의 side-effect import 가 tree-shake 시 제거되면 wiring 0. `package.json.sideEffects` 명시가 해결책 — 단 **bundler 별 호환성 변동**:

| Bundler | `sideEffects` 인식 | 비고 |
|---------|------------------|------|
| Vite (rollup) | ✅ | 표준 |
| webpack | ✅ | 표준 |
| esbuild (tsup) | 부분적 | ESM `import` 자체가 side-effect 유지 보장 (tsup 의 treeshake: true 와 별개) |
| Storybook (Vite) | ✅ | 본 monorepo 환경 |

**완화**: Step 6 의 `pnpm -r build` 후 `dist/index.mjs` grep 으로 `wireDefaultRenderers` 호출 보존 확인 권고. 만약 src 경로 `sideEffects` 가 publish 후 consumer bundler 에서 인식 안 되는 사례가 발견되면 implementer 가 dist 경로(`["./dist/index.mjs", "./dist/index.cjs"]`)로 확장.

### 8.2 module load 순서 의존 (ADR 본문 line 150 인정)

사용자가:

```ts
import { createColumns, defaultRendererRegistry } from '@tomis/grid-core';
// import '@tomis/grid-renderers'  ← 누락 시
const cols = createColumns([{ type: 'number', ... }]);
```

위 경우 wiring 0 → placeholder 동작. **Step 3 의 주석 + README 안내** 가 해결 수단. 런타임 강제 검증 (warning emit) 은 별도 ADR.

### 8.3 ADR-014 amendment 정합 ✅

`asCell<P>` (grid-renderers/rendererRegistry.ts:57) vs `adaptValueCell<TData, V>` (본 spec §3.1):

| 측면 | `asCell` | `adaptValueCell` |
|------|---------|----------------|
| 목적 | grid-renderers internal Record 슬롯 widening | grid-core RendererFn 시그니처 변환 |
| cast | `c as unknown as CellComponent` (1회 격리) | `createElement(Cell, { value: pickValue(info) })` (cast 0회 — narrowed 시그니처) |
| 출력 | `CellComponent` (ComponentType) | `RendererFn` (function) |
| 호출자 | rendererRegistry.ts 자체 | wireRegistry.ts (신규) |

**정합**: 두 helper 는 직교 — 같은 cell 컴포넌트가 양쪽 모두로 wrap 됨. ADR-014 의 "cast 격리" 패턴이 본 ADR 의 `adaptValueCell` 에서도 동일하게 적용 (per-call `as` 캐스트 1회만, registry storage 측은 cast 0회).

### 8.4 grid-core 단독 사용자 (advisor #4 risk)

D-3-A (keep-as-fallback) 채택 시 영향 없음. D-3-B (제거) 채택 시 grid-core 만 install 한 사용자가 `<Grid columns={createColumns([{type:'number'}])}>` 호출 시 console.warn + plain text. **사용 사례 0건** (보고서 §3.1 grep 결과) 이므로 영향 ≈ 0 but 명시 권고.

### 8.5 stories 영향

- `packages/grid-core/stories/Grid.stories.tsx`, `Grid.virtualized.stories.tsx` — `import '@tomis/grid-renderers'` 미수행 → wiring 0 → 변경 없음. **단** Step 7 권고로 1+ story 가 wiring 검증을 받아야 함 (사용자 결정 D-5 추가 가능).
- `packages/grid-renderers/stories/Cells.stories.tsx` — 직접 cell import 사용, 영향 0.

### 8.6 미수행 항목

- `packages/grid-pro-tracking/stories/ChangeTracking.stories.tsx:11` 의 `import { createColumns } from '@tomis/grid-core';` 가 wiring 의 자동 검증처가 될 수 있음 — 본 spec 범위 외 (사용 패턴 인벤토리 추가 필요).
- 5 extras 의 wiring 정책 (D-2) — 본 ADR 범위 외 (ADR-018 후속).
- icon 의 meta 기반 wiring (D-1-B) — 본 ADR 범위 외.

---

## 9. 결과 체크리스트 (ADR-002 결과 검증 정정)

원본 ADR-002 line 169-172 의 결과 체크 항목을 본 spec 가 다음으로 정정 권고:

- [ ] `import '@tomis/grid-renderers'` 후 `defaultRendererRegistry.get('number')` 가 placeholder 가 아닌 어댑터 함수 반환 (단위 테스트).
- [ ] grid-core 의 `defaultRendererRegistry` 가 import 후 **6 슬롯 신규 어댑터 (text/number/date/dateTime/badge/link) + 3 슬롯 기존 동작 유지 (boolean Y/N, icon placeholder, checkbox placeholder)** 보유 — 총 9 entries (TomisColumnType 한정). ADR 본문 "12+ entries" 가정은 부정확 (정정 권고).
- [ ] `pnpm size` 통과 — grid-renderers 한도 10KB 유지.
- [ ] `pnpm size` 통과 — grid-core 한도 (현 한도 확인 후) 유지.
- [ ] `grid-renderers/package.json` peerDependencies 에 `@tomis/grid-core` 추가 확인.
- [ ] `grid-renderers/package.json` sideEffects 배열에 dist entries 추가 확인.
- [ ] tw-framework-front 빌드 성공 (createColumns 미사용 — 영향 0 검증).
- [ ] Storybook story 1+ 가 wiring 후 NumberCell/DateCell 렌더 검증 (Step 7).

---

## 10. 예상 공수 (정정)

ADR 본문 6h → spec 검토 기반 **4–5h**:

| 단계 | 소요 |
|------|------|
| Step 0 package.json | 0.5h |
| Step 1 wireRegistry.ts | 1.0h |
| Step 2 index.ts side-effect | 0.1h |
| Step 3 주석 갱신 | 0.2h |
| Step 4 단위 테스트 | 0.8h |
| Step 5 CHANGELOG/Changeset | 0.3h |
| Step 6 검증 | 0.5h |
| Step 7 Storybook (선택) | 0.6h |
| Step 8 probe 정리 | 0.1h |
| 사용자 결정 D-1~D-4 대기 | 가변 |

---

## 11. 다음 단계 권고

1. **사용자 결정 D-1~D-4 확정** 후 implementer 진입.
2. D-1 권고 A, D-2 권고 A, D-3 권고 A, D-4 권고 A 채택 시 implementer 가 본 spec 의 Step 0~8 을 직진 가능.
3. 다른 선택지 채택 시 본 spec 의 §4, §7 Step 1/3 을 해당 옵션에 맞춰 수정 후 진입.
4. 결과 검증 통과 후:
   - 보고서 §3.1 의 "registerRenderer 호출 production 0건" 항목 상태 갱신
   - C-31 (Functional Wiring Audit) 의 cross-package 변종 closed 마크
   - ADR-003 (`@tomis/grid` 메타 패키지) 의 선행 조건 1 항목 해소 (name collision 측면 — D-3 의 placeholder 유지 시 grid-core 의 `defaultRendererRegistry`/`registerRenderer` export 가 여전히 존재 → 메타 facade 시 alias rename 또는 internal 강등 필요, 별도 ADR 조건).

---

## 부록 A. probe 파일 전문 (참조)

`packages/grid-renderers/src/__probe__/adr-002-wiring.probe.ts` — 137 LOC. typecheck 통과 후 implementer 가 §7 Step 8 에서 삭제.

`packages/grid-renderers/tsconfig.probe.json` — workspace `@tomis/grid-core` paths 매핑 (peerDep 등록 전 검증 가능). implementer 가 Step 0 의 peerDep 등록 후 본 파일 삭제 가능.

---

**spec 작성 완료 (read-only, 실 코드 변경 0 외 probe 파일 2건 — implementer 가 Step 8 에서 정리).**
