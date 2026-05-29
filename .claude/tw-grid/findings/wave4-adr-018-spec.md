# ADR-018 Implementation Spec — registry slot 정책 (icon + 5 extras + alias)

**작성일**: 2026-05-17
**상태**: draft (사용자 D-1~D-5 결정 대기)
**원본 ADR**: `MOD-GRID-REFACTOR-2026-05-17-decisions.md` ADR-018
**작성자**: spec writer (Wave 4)
**probe typecheck**: PASS (EXIT=0) — `npx tsc --noEmit -p tsconfig.probe.json` (probe 파일 검증 후 즉시 삭제, default `pnpm typecheck` 무결성 유지)
**연관 ADR**: ADR-002 (cross-package wiring — 6 슬롯 wired), ADR-014 amendment (D-partial — 9 cell prop 유지)
**연관 findings**: refactor-analysis-2026-05-17.md §1.1, wave3-adr-002-spec.md §3+§4, wave3-adr-002-result.md §7

---

## 0. Executive Summary

ADR-002 implemented 후 미해결로 남은 **6 슬롯 (icon + 5 extras + 2 aliases)** 에 대한 정책 결정.

**probe 실증 결과 (구조적 차단 vs value-adapter 친화 분리)**:

| 슬롯 | TomisColumnType | grid-renderers cell | required non-value prop | value-adapter 가능? | 권고 처리 |
|------|----------------|---------------------|------------------------|--------------------|----------|
| `tag` | union 외 | TagCell | (none — `value: readonly string[]`) | **YES** | union 확장 + wire (D-2 X-A1) |
| `progress` | union 외 | ProgressCell | (none — `value: number\|null\|undefined`) | **YES** | union 확장 + wire (D-2 X-A1) |
| `button` | union 외 | ButtonCell | `onClick: () => void` | NO (cast 거짓말) | registry 외 (D-3 X-B) |
| `avatar` | union 외 | AvatarCell | `name: string` (value 아님) | NO (cast 거짓말) | registry 외 (D-3 X-B) |
| `icon` | union **내** | IconCell | `icon: ReactNode` | NO (F-2 구조적) | placeholder 유지 (D-1 I-A) |
| `statusBadge` | union 외 | StatusBadgeCell (alias of badge) | (none — adapter 가능하나 무가치) | YES but 가치 0 | status quo (D-4 A-A) |
| `check` | union 외 | CheckCell (alias of checkbox) | `checked: boolean` | NO + 우회 | status quo (D-4 A-A) |

**핵심 결론** (advisor 검증 + probe 실증):
- task description 이 5 extras 를 동질 그룹으로 묶었으나, **실 prop interface 검증 결과 2개 가족으로 분리**:
  - **value-adapter 친화** (`tag`, `progress`) → `adaptValueCell` 패턴 + union 확장 → 해소
  - **구조적 차단** (`button`, `avatar`, `icon`) → required non-value prop → registry 외 처리만 정직
- alias (`statusBadge` / `check`) 는 별도 가족 — grid-renderers 자체 Record 에만 존재, grid-core union 추가는 무가치.

**사용자 결정 지점 (5건, §6 상세)**:
- **D-1**: icon slot 정책 (I-A 권고)
- **D-2**: tag / progress 정책 (X-A1 권고)
- **D-3**: button / avatar 정책 (X-B 권고)
- **D-4**: alias 정책 (A-A status quo 권고)
- **D-5**: size-limit 한도 (S-A 10→12 KB 권고)

**예상 공수**: 2-3h (implementer 직진).

---

## 1. 슬롯별 prop interface 인벤토리 (사실 확인)

### 1.1 value-adapter 친화 (probe PASS)

#### `TagCell` (TomisColumnType 외 — D-2 union 확장 대상)

```ts
// packages/grid-renderers/src/TagCell.tsx:12-21
export interface TagCellProps {
  value: readonly string[];                   // ← cell value 가 array
  colorMap?: Record<string, string>;
  gapClassName?: string;                       // default 'gap-1'
  className?: string;
}
```

- value 가 명시적 `readonly string[]`. `info.getValue()` 가 array 이면 직접 대입. 비-array 면 빈 array 로 변환 (EC-08 정합 — empty → dash placeholder).
- 추가 prop (colorMap/gapClassName) 은 모두 optional + default 보유 → adapter 시 누락 OK.

#### `ProgressCell` (TomisColumnType 외 — D-2 union 확장 대상)

```ts
// packages/grid-renderers/src/ProgressCell.tsx:12-21
export interface ProgressCellProps {
  value: number | null | undefined;            // ← cell value 가 숫자
  showLabel?: boolean;                          // default true
  barColorClassName?: string;                   // default 'bg-blue-600'
  className?: string;
}
```

- value 가 명시적 `number | null | undefined`. `info.getValue()` 그대로 대입 (clampPercent 가 EC-10/EC-11 내부 처리).
- 추가 prop 모두 optional + default → adapter 시 누락 OK.

### 1.2 구조적 차단 (probe FAIL — required non-value prop)

#### `ButtonCell` (D-3 대상)

```ts
// packages/grid-renderers/src/ButtonCell.tsx:19-36
export interface ButtonCellProps {
  value?: ReactNode;                            // ← optional (ADR-014 amendment)
  label?: ReactNode;                            // ← deprecated alias (ADR-014 amendment)
  onClick: () => void;                          // ← REQUIRED — registry 의 row context 외 정보
  variant?: 'default' | 'destructive' | 'ghost';
  disabled?: boolean;
  size?: 'sm' | 'xs';
  className?: string;
}
```

- ADR-014 D-partial 로 `value?` 추가됨 — value-adapter 의 typecheck 통과는 가능.
- **그러나 `onClick: () => void` 가 required**. registry adapter `(info: CellContext) => ReactNode` 는 onClick 공급 채널 없음.
- 사용자가 `onClick` 을 column 별 정의하려면 column.cell 직접 wiring 필수 — registry 사용 불가.
- widening cast (`as unknown as ComponentType<{value: ReactNode}>`) 로 컴파일 통과 가능하나 **런타임 onClick=undefined → TypeError on click**.

#### `AvatarCell` (D-3 대상)

```ts
// packages/grid-renderers/src/AvatarCell.tsx:13-22
export interface AvatarCellProps {
  name: string;                                 // ← REQUIRED, value 가 아닌 name
  src?: string;
  sizeClassName?: string;                       // default 'w-7 h-7'
  className?: string;
}
```

- value prop 자체가 없음. 의미적으로는 `name` 이 value 이나, **ADR-014 D-partial 로 rename 거부됨** (`memory/feedback-tw-grid` 의미 명료성 우려).
- adapter 시도 시 `ComponentType<{name: string}>` vs `ComponentType<{value: V}>` 시그니처 불일치 → widening cast 필요 → 런타임 name=undefined → `getInitials('')` → `'?'` placeholder.

#### `IconCell` (D-1 대상 — ADR-002 F-2 재진)

```ts
// packages/grid-renderers/src/IconCell.tsx:12-23
export interface IconCellProps {
  icon: ReactNode;                              // ← REQUIRED, ReactNode (e.g., <HomeIcon />)
  label?: string;
  onClick?: () => void;
  color?: string;                               // default 'text-gray-500'
  className?: string;
}
```

- ADR-002 F-2 그대로. icon mapping 은 column 정의 시점에 결정되어야 함 — cell value 만으로 ReactNode 합성 불가.

### 1.3 alias (가치 0 / 구조적 차단)

#### `statusBadge` (badge 동의어)

- grid-renderers `rendererRegistry.ts:80`: `statusBadge: asCell(StatusBadgeCell)` — 이미 `getRenderer('statusBadge')` 로 접근 가능.
- `badge` 는 ADR-002 로 이미 wired. union 추가는 동일 컴포넌트 두 번 등록 → 무가치.

#### `check` (checkbox 동의어)

- grid-renderers `rendererRegistry.ts:84`: `check: asCell(CheckCell)` — 이미 접근 가능.
- `CheckCell` 의 `checked: boolean` (required) 으로 구조적 차단.
- 게다가 `checkbox` 는 `createColumns.ts:96-108` 의 DisplayColumnDef 분기로 registry 우회 — 호출 자체 의미 없음.

---

## 2. ADR 본문 가정 vs 현실 (사실 확인 — task description 정정)

| task 가정 | 실제 코드 | 출처 |
|----------|----------|------|
| "5 extras (button/tag/avatar/progress)" 동질 | 2개 (tag/progress) value-adapter 친화 + 2개 (button/avatar) 구조적 차단 | wave1-adr-014-result-v2.md:15 + IconCell/ButtonCell/AvatarCell/TagCell/ProgressCell prop 직접 확인 |
| "AvatarCell: `value: string` (ADR-014 후) → adapter 가능" | AvatarCell `name: string` 유지 (D-partial 변경 0) | wave1-adr-014-result-v2.md:15 ("9 cell 변경 0 (... AvatarCell)") + :80 ("CheckCell/IconCell/AvatarCell: D-partial 결정으로 변경 0") |
| "wireRegistry.ts 에 6 + 3 alias = 9 hits 있음" | 현 6 hits (text/number/date/dateTime/badge/link) | `wireRegistry.ts` grep 검증, wave3-adr-002-result.md §4.3 "사용자 task 의 9 hits 와의 차이" |
| "statusBadge / check 의 F-3 union 외 차단" | grid-renderers 자체 Record (`registerRenderer(type: string, ...)`) 에는 이미 존재. F-3 차단은 grid-core Map (`Map<TomisColumnType, RendererFn>`) 에만 적용 | rendererRegistry.ts:80,84 + 102 ("registerRenderer(type: string, ...)") |
| "Map key loosen (breaking)" 의 영향 미상 | RendererRegistry type 의 `Map<TomisColumnType, RendererFn>` → `Map<string, RendererFn>` 시 grid-core/column/types.ts:120 의 RendererRegistry generic 변경 — 사용자가 `TomisColumnType` narrowing 으로 type-guard 작성한 코드 깨짐 | grid-core/column/types.ts:113-120 RendererRegistry 정의 |

---

## 3. probe 결과

### 3.1 probe 파일 (검증 후 즉시 삭제)

`packages/grid-renderers/src/__probe__/adr-018-extras.probe.ts` + `tsconfig.probe.json` — spec writer 단계에서 작성 후 검증 즉시 삭제 (default `pnpm typecheck` 무결성 유지).

probe 의 핵심 구조 (재현 가능):

```ts
import { createElement, type ComponentType } from 'react';
import type { CellContext } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { TagCell } from '../TagCell.js';
import { ProgressCell } from '../ProgressCell.js';
import { StatusBadgeCell } from '../StatusBadgeCell.js';

// Simulated extended union (probe-local, no grid-core 변경)
type TomisColumnTypeExtended =
  | 'checkbox' | 'number' | 'boolean' | 'dateTime' | 'date' | 'text'
  | 'badge' | 'link' | 'icon'
  | 'button' | 'tag' | 'avatar' | 'progress' | 'statusBadge' | 'check';

type RendererFn<TData = unknown> = (info: CellContext<TData, unknown>) => ReactNode;

function probeRegisterRenderer<TData>(
  _type: TomisColumnTypeExtended,
  _fn: RendererFn<TData>,
): void { /* simulated registry.set */ }

function adaptValueCell<TData, V>(
  Cell: ComponentType<{ value: V }>,
  pickValue: (info: CellContext<TData, unknown>) => V,
): RendererFn<TData> {
  return (info) => createElement(Cell, { value: pickValue(info) });
}

// (a) clean value-adapter extras (PASS)
probeRegisterRenderer('tag',
  adaptValueCell(
    TagCell as ComponentType<{ value: readonly string[] }>,
    (info) => {
      const raw = info.getValue();
      return Array.isArray(raw) ? (raw as readonly string[]) : [];
    },
  ),
);

probeRegisterRenderer('progress',
  adaptValueCell(
    ProgressCell as ComponentType<{ value: number | null | undefined }>,
    (info) => info.getValue() as number | null | undefined,
  ),
);

// (b) statusBadge alias — would PASS but value 0 (badge duplicate)
probeRegisterRenderer('statusBadge',
  adaptValueCell(
    StatusBadgeCell as ComponentType<{ value: string }>,
    (info) => String(info.getValue() ?? ''),
  ),
);

// (c) structurally blocked (commented — would fail without widening cast):
//   - 'button': onClick required → adapter signature mismatch + 런타임 onClick=undefined
//   - 'avatar': name required (not value) → 런타임 name=undefined → '?' fallback
//   - 'icon':  icon required (ReactNode) → 런타임 icon=undefined → 무 glyph
//   - 'check': checked required (boolean) → createColumns 우회로 academic
```

### 3.2 probe tsconfig

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": false,
    "noEmit": true
  },
  "include": ["src/**/*"]
}
```

### 3.3 검증 명령 + 결과

```powershell
cd D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers
npx tsc --noEmit -p tsconfig.probe.json
# EXIT=0  (errors: 0)

# probe 삭제 후 default typecheck 무결성 확인:
npx tsc --noEmit
# EXIT=0  (errors: 0)
```

### 3.4 probe hard findings

| Finding | 내용 | 정합 ADR |
|---------|------|---------|
| **F-A1** | `tag` + `progress` 의 `adaptValueCell` PASS — 기존 ADR-002 패턴 재사용 가능 | D-2 X-A1 |
| **F-A2** | `statusBadge` alias 도 동일 패턴 PASS 하나 grid-core Map 에 추가 가치 0 (badge 와 동일 컴포넌트) | D-4 A-A |
| **F-B1** | `button` widening cast 없이 컴파일 실패. 캐스트 추가 시 런타임 onClick=undefined → TypeError on click | D-3 X-B (Y-A 함정 검증) |
| **F-B2** | `avatar` `as unknown as` 없이 컴파일 실패 (name vs value 시그니처 불일치) | D-3 X-B |
| **F-B3** | `icon` ADR-002 F-2 재진 — 변경 0 권고 | D-1 I-A |
| **F-B4** | `check` `checked` required + createColumns 우회 — 본 ADR 범위 외 | D-4 A-A |

---

## 4. 사용자 결정 지점 (5건)

### D-1: icon slot 정책 (§4.1 of ADR)

| 옵션 | 설명 | 영향 |
|------|------|------|
| **A (권고)**: placeholder 유지 | 0 LOC | UX 동일 (`String(value)` text fallback) |
| B: meta 경유 wiring | createColumns + TomisColumnDef.meta.icon 확장 | grid-core minor + grid-renderers minor + 별도 createColumns 분기 |
| C: TomisColumnType 에서 `'icon'` 제거 | union narrowing | grid-core **major** (breaking) |
| D: createColumns 분기로 cell 미주입 시 console.error | 명시적 보호 | grid-core patch (런타임 추가) |

### D-2: tag / progress 정책

| 옵션 | 설명 | 영향 |
|------|------|------|
| **A1 (권고)**: union 에 `'tag' \| 'progress'` 추가 + wire | 2 어댑터 추가 | grid-core minor + grid-renderers minor |
| A2: 4개 (`'tag' \| 'progress' \| 'button' \| 'avatar'`) 추가 | button/avatar 거짓 약속 | grid-core minor + 함정 |
| B: Map key 를 `string` 으로 loosen | RendererRegistry type 변경 | grid-core **major** |
| C: union 변경 0 — 사용자 column.cell 직접 wiring | boilerplate ↑ | none |

### D-3: button / avatar 정책

| 옵션 | 설명 | 영향 |
|------|------|------|
| **X-B (권고)**: registry 외 — column.cell 직접 wiring | sample 코드 README 추가 | none |
| Y-A: union 추가 + `as unknown as` cast adapter | 런타임 broken | grid-core minor + 함정 |
| Y-B: ButtonCellProps.onClick optional 화 + AvatarCell `name` deprecate + `value` alias | 의미 명료성 손실 | grid-renderers minor (additive — ADR-014 D-partial 재논의) |

### D-4: alias (statusBadge / check) 정책

| 옵션 | 설명 | 영향 |
|------|------|------|
| **A-A (권고)**: status quo — grid-renderers Record 만 (이미 wired) | 0 LOC | UX 동일 |
| A-B: union 에 추가 | 무가치 (badge 동의어 / checkbox 우회) | grid-core minor |

### D-5: size-limit 한도

| 옵션 | 한도 | 여유 (예상 +0.5 KB 후) |
|------|------|----------------------|
| **A (권고)**: 12 KB | +2 KB | ~2.5 KB |
| B: 10 KB 유지 | 0 | ~0.5 KB (POL-BUNDLE §1 sub-clause 미달) |
| C: 11 KB | +1 KB | ~1.5 KB |

---

## 5. 구현 단계 (implementer 직진용)

### Step 0 — 결정 게이트 확인

사용자 D-1~D-5 결정 완료 확인. 본 spec 은 권고 조합 (I-A + X-A1 + X-B + A-A + S-A) 기준으로 작성.

### Step 1 — TomisColumnType union 확장

`packages/grid-core/src/column/types.ts:33`:

```diff
 export type TomisColumnType =
   | 'checkbox'
   | 'number'
   | 'boolean'
   | 'dateTime'
   | 'date'
   | 'text'
   | 'badge'
   | 'link'
-  | 'icon';
+  | 'icon'
+  | 'tag'
+  | 'progress';
```

JSDoc (line 13-32) 갱신:

```diff
- * 9종 자동 renderer 분기 type union.
+ * 11종 자동 renderer 분기 type union.
   ...
+ * - `'tag'`: TagCell (ADR-002+018 wired — readonly string[]).
+ * - `'progress'`: ProgressCell (ADR-002+018 wired — number|null|undefined).
```

### Step 2 — grid-core defaultRendererRegistry placeholder 추가

`packages/grid-core/src/column/rendererRegistry.ts:43`:

```diff
 export const defaultRendererRegistry: RendererRegistry = new Map<TomisColumnType, RendererFn>([
   // ... 9 기존 entries ...
   ['checkbox', (info) => String(info.getValue() ?? '')],
+  // ADR-018 wired → TagCell adapter (fallback: plain text).
+  ['tag', (info) => String(info.getValue() ?? '')],
+  // ADR-018 wired → ProgressCell adapter (fallback: plain text).
+  ['progress', (info) => String(info.getValue() ?? '')],
 ]);
```

D-3A graceful fallback 정책 미러 — grid-renderers 미import 시 placeholder text.

### Step 3 — grid-renderers wireRegistry 확장

`packages/grid-renderers/src/wireRegistry.ts`:

```diff
 import { TextCell } from './TextCell.js';
 import { NumberCell } from './NumberCell.js';
 import { DateCell } from './DateCell.js';
 import { StatusBadgeCell } from './StatusBadgeCell.js';
 import { LinkCell } from './LinkCell.js';
+import { TagCell } from './TagCell.js';
+import { ProgressCell } from './ProgressCell.js';
```

`wireDefaultRenderers()` 함수 끝에 2 registerRenderer 추가:

```ts
  // tag → TagCell({ value })
  registerRenderer(
    'tag',
    adaptValueCell(
      TagCell as ComponentType<{ value: readonly string[] }>,
      (info) => {
        const raw = info.getValue();
        return Array.isArray(raw) ? (raw as readonly string[]) : [];
      },
    ),
  );

  // progress → ProgressCell({ value })
  registerRenderer(
    'progress',
    adaptValueCell(
      ProgressCell as ComponentType<{ value: number | null | undefined }>,
      (info) => info.getValue() as number | null | undefined,
    ),
  );
```

상단 주석 (line 5-11) 갱신:

```diff
-// Wired slots (6): text / number / date / dateTime (bespoke +format) / badge / link (bespoke +null).
+// Wired slots (8): text / number / date / dateTime (bespoke +format) / badge / link (bespoke +null) / tag / progress.
 // NOT wired (intentional):
 //   - boolean : grid-core keeps Y/N default (no BooleanCell in grid-renderers).
 //   - icon    : IconCellProps.icon is ReactNode (required), no value-only adapter possible (D-1A).
 //   - checkbox: createColumns.ts:96-108 returns a DisplayColumnDef branch — registry bypassed.
-//   - 5 extras (button/tag/avatar/progress + aliases statusBadge/check): not in TomisColumnType
-//     union — wiring would TS2345. Deferred to ADR-018 (D-2A).
+//   - button/avatar: required non-value prop (onClick/name) — registry adapter pattern unsuitable
+//     (widening cast would lie at runtime). Use column.cell direct wiring instead (ADR-018 D-3 X-B).
+//   - aliases (statusBadge/check): accessible via grid-renderers' own Record<string, CellComponent>
+//     (getRenderer/registerRenderer with string key). grid-core Map keyed by TomisColumnType
+//     intentionally excludes alias keys — they're synonyms with zero added value (ADR-018 D-4 A-A).
```

### Step 4 — size-limit 한도 상향

`.size-limit.json:15-25`:

```diff
   {
     "name": "@tomis/grid-renderers",
     "path": "packages/grid-renderers/dist/index.mjs",
-    "limit": "10 KB",
+    "limit": "12 KB",
     "brotli": true,
     "ignore": [
       "react",
       "react-dom",
       "@tanstack/react-table",
       "@tanstack/react-virtual"
     ]
   },
```

### Step 5 — CHANGELOG + Changeset

**`packages/grid-core/CHANGELOG.md`** — Unreleased 에 ADR-018 entry 추가:

```md
### Minor Changes (ADR-018)

- `TomisColumnType` union 에 `'tag'`, `'progress'` 추가 (`column/types.ts:33`).
- `defaultRendererRegistry` 에 placeholder 2 entries 추가 (`column/rendererRegistry.ts` — graceful fallback).
- 사용자가 `<Grid columns={createColumns([{type:'tag',...}])} />` 사용 가능.
- breaking 없음 — 새 union 멤버 추가 (additive). 자세한 내용은 ADR-018 참조.
```

**`packages/grid-renderers/CHANGELOG.md`** — 새 minor entry:

```md
## 0.3.0 — 2026-XX-XX (ADR-018)

### Minor Changes

- `wireRegistry.ts` 에 `tag` + `progress` 슬롯 추가 (6 → 8 wired slots).
- `import '@tomis/grid-renderers'` 만으로 `type:'tag'` / `type:'progress'` 가 실 TagCell / ProgressCell 렌더.
- `button` / `avatar` / `icon` 은 registry 외 처리 — column.cell 직접 wiring 사용 (README 예시 참조).
```

**Changeset**: `.changeset/adr-018-tag-progress-wiring.md`:

```md
---
"@tomis/grid-core": minor
"@tomis/grid-renderers": minor
---

ADR-018: registry slot 정책 — tag / progress 슬롯 wiring + TomisColumnType union 확장.

- grid-core: TomisColumnType union 에 'tag', 'progress' 추가 (additive — backward-compat).
- grid-renderers: wireRegistry 에 TagCell / ProgressCell 어댑터 2건 추가.
- button / avatar / icon 은 registry 외 처리 정책 (구조적 차단 — required non-value prop).
- aliases statusBadge / check 은 grid-renderers Record 에서 status quo.
```

### Step 6 — 검증

```powershell
# 1. typecheck
cd D:/project/topvel_project/topvel-grid-monorepo
pnpm -r typecheck
# 기대: 14 packages PASS, EXIT=0

# 2. build
pnpm --filter "./packages/*" build
# 기대: 13 packages PASS, EXIT=0

# 3. size-limit
pnpm size-limit
# 기대: grid-renderers ≤ 12 KB PASS

# 4. wireRegistry hits 검증
grep -c "registerRenderer(" packages/grid-renderers/src/wireRegistry.ts
# 기대: 8 hits (text/number/date/dateTime/badge/link/tag/progress)

# 5. dist 산출물 검증
grep -E "wireDefaultRenderers|registerRenderer" packages/grid-renderers/dist/index.mjs | head -15
# 기대: 8 registerRenderer$1 호출 + wireDefaultRenderers() top-level invocation
```

### Step 7 — ADR 본문 상태 갱신

`MOD-GRID-REFACTOR-2026-05-17-decisions.md` ADR-018:
- 상태 `proposed → implemented`
- 결과 체크박스 (총 13개) 모두 mark
- Implementation Note 추가 (실 변경 위치 + LOC + 검증 결과)

### Step 8 — (선택) Storybook 시각 검증

MOD-GRID-99-B 부트스트랩 후 수행 가능. `Grid.stories.tsx` 또는 신규 story:
- `createColumns([{type:'tag', ...}])` 결과 → TagCell 칩 렌더링 확인.
- `createColumns([{type:'progress', ...}])` 결과 → ProgressCell bar 렌더링 확인.

본 cycle 범위 외 (POL-MIG-STAGE 미달 가능).

---

## 6. 위험 + 한계

### 6.1 tree-shaking 위험 (ADR-002 § 8.1 미러)

ADR-002 의 `sideEffects: ["./src/index.ts", "./dist/index.mjs", "./dist/index.cjs"]` 가 유효한 동안 본 ADR 의 2 추가 어댑터도 보존됨. 별도 조치 불필요.

### 6.2 D-3 X-B 채택 시 사용자 boilerplate

`button` / `avatar` 사용 페이지 패턴:

```tsx
// 사용자 측 — column.cell 직접 wiring 필요
const columns = createColumns<User>([
  {
    id: 'action',
    name: '액션',
    type: 'text', // ← type='button' 사용 불가 (D-3 X-B)
    cell: ({ row }) => (
      <ButtonCell value="삭제" variant="destructive" onClick={() => handleDelete(row.original.id)} />
    ),
    // ...
  },
]);
```

README 의 "Migration Notes" 또는 "Action Column Pattern" 섹션에 위 예시 추가 권고.

### 6.3 D-1B (icon meta-경유) 향후 ADR

사용자가 `type:'icon'` zero-config 요구 시 별도 ADR 작성:
- `TomisColumnDef.meta.icon: ReactNode` 추가 (grid-core minor)
- `createColumns` 가 type='icon' 시 meta.icon 추출 → IconCell adapter 호출
- grid-renderers wireRegistry 에 icon adapter 추가 (meta.icon 의존)

본 ADR 범위 외 — Wave 5+ follow-up.

### 6.4 단위 테스트 부재 (ADR-002 와 동일)

`wireRegistry.test.ts` 가 6/8 슬롯 lookup 검증 — ADR-002 의 follow-up 과 묶어서 처리 권고. 별도 작업.

### 6.5 size-limit 12 KB 정당화 (POL-BUNDLE §1)

POL-BUNDLE §1 sub-clause: "버블링 룸 ≥ 20%". 12 KB × 0.8 = 9.6 KB → 9.49 KB (예상치) 가 미달. 12 KB 채택은 향후 D-1B / D-3 추가 옵션 cycle 대비.

대안: 11 KB (S-C) — sub-clause 경계 안전. 단 향후 cycle 마다 +1 KB 재상향 패턴 발생 가능.

---

## 7. 결과 체크리스트 (impementer 진행용)

- [ ] `grid-core/src/column/types.ts:33` TomisColumnType union 에 `'tag' | 'progress'` 추가 + JSDoc 갱신
- [ ] `grid-core/src/column/rendererRegistry.ts:43` defaultRendererRegistry Map 에 `'tag'` / `'progress'` placeholder 2 entry 추가
- [ ] `grid-renderers/src/wireRegistry.ts` 에 `tag` / `progress` 어댑터 2건 추가 + 상단 주석 갱신
- [ ] `.size-limit.json` grid-renderers `"limit"` `"10 KB"` → `"12 KB"`
- [ ] `pnpm -r typecheck` 14 packages PASS (EXIT=0)
- [ ] `pnpm --filter "./packages/*" build` 13 packages PASS (EXIT=0)
- [ ] `pnpm size-limit` grid-renderers ≤ 12 KB PASS
- [ ] `dist/index.mjs` 가 `wireDefaultRenderers()` top-level invocation 포함 (tree-shake 보존 검증)
- [ ] `grid-renderers/src/wireRegistry.ts` `grep -c "registerRenderer("` = 8
- [ ] `grid-core/CHANGELOG.md` Unreleased ADR-018 entry (minor)
- [ ] `grid-renderers/CHANGELOG.md` 0.3.0 ADR-018 entry (minor)
- [ ] `.changeset/adr-018-tag-progress-wiring.md` (grid-core minor + grid-renderers minor)
- [ ] ADR 본문 결과 체크박스 mark + Implementation Note 추가 + 상태 `proposed → implemented`
- [ ] (선택) Storybook 시각 검증 — MOD-GRID-99-B 부트스트랩 후

---

## 8. 알려진 한계 / 미수행 항목

1. **단위 테스트**: spec §5 Step 6 의 검증은 컴파일 + size 만. registry slot lookup 의 실제 adapter fn 반환 검증은 ADR-002 follow-up (`wireRegistry.test.ts`) 과 묶어 처리 권고.
2. **Storybook 시각 검증**: MOD-GRID-99-B 부트스트랩 후 가능 (현 storybook 미부트, documented-deviation G-001 참조).
3. **D-3 X-B README 예시**: 본 ADR 범위 외. `grid-renderers/README.md` 의 "Action Column / Avatar Column Pattern" 섹션 추가는 별도 docs 작업.
4. **D-1B (icon meta-경유) 향후 ADR**: 현 ADR-018 은 D-1A (placeholder 유지) 권고. 사용자가 D-1B 채택 시 별도 ADR 신설.
5. **AvatarCell `value` rename 거부 결정 유지**: ADR-014 D-partial 의 의미 명료성 우선 결정 미러. 향후 ADR-014 follow-up cycle 에서 재논의 가능.

---

## 9. 다음 단계 권고

1. **사용자 D-1 ~ D-5 결정** — 5건. 본 spec 의 권고 조합 (I-A + X-A1 + X-B + A-A + S-A) 검토.
2. **implementer 위임** — `tw-grid` 하네스의 main implementer agent 가 §5 Step 0~8 직진 (예상 2-3h).
3. **ADR-002 + ADR-018 통합 follow-up** — 단위 테스트 (`wireRegistry.test.ts` 6/8 슬롯) + Storybook 시각 검증.
4. **D-3 X-B 사용자 패턴 docs**: `grid-renderers/README.md` 에 "Action Column / Avatar Column Pattern" 섹션 추가 권고 (별도 작업).
5. **D-1B (icon meta-경유) 향후 ADR 작성 여부 사용자 검토**: type='icon' 사용자 요구 빈도 + meta 확장 비용 평가.

---

**본 spec 은 사용자 검토 대기 — D-1~D-5 결정 후 implementer 위임 가능.**
