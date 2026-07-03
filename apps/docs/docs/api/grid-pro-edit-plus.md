---
title: "@topgrid/grid-pro-edit-plus"
sidebar_label: "grid-pro-edit-plus"
sidebar_position: 17
---

# @topgrid/grid-pro-edit-plus

> Pro: editing productivity — declarative validation rules (G-1), undo/redo, find&replace, cell comments · **상용 (EULA)**

:::info 자동 생성
이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.
:::

총 **21개** public export — 함수 10 · 훅 2 · 컴포넌트 0 · 타입 9 · 상수 0.

## 훅 (Hooks)

### `useCellComments`

셀 코멘트 + storage 영속 훅 — (AC ③).

마운트 시 storage 에서 hydrate, 변경 시 persist(버전 봉투). SSR/storage 비가용 시 in-memory
no-op(throw 없음). 순수 직렬화/키 로직은 `./commentStore`([[commentStore]], node 검증).

```ts
useCellComments(options: UseCellCommentsOptions): CellCommentsAPI
```

### `useUndoRedo`

제네릭 undo/redo 명령 스택 훅 —.

동작을 수행한 뒤 그 동작의 `{undo, redo}` 명령을 `push` 한다. tracking 연산 명령은
`makeUpdateCommand`/`makeAddCommand` 로 만든다([[bindings]]). tracking 은 연산 히스토리를
노출하지 않으므로 본 스택이 외부 히스토리 역할을 한다(Option B, advisor).

명령의 부작용은 **state updater 밖**(이벤트 핸들러)에서 실행한다 — ref 가 진실, `bump` 는
재렌더만 유발(StrictMode 이중 실행 회피).

```ts
useUndoRedo(): UndoRedoAPI
```

## 함수

### `buildValidationCellClass`

선언적 검증 룰 배열 → grid-core `CellClassNameCallback<TData>` 컴파일.

`field` 가 지정된 룰만 셀 표시에 참여한다 — 해당 컬럼(`ctx.columnId === rule.field`) 셀이
위반(`!validate(row)`)이면 룰의 `className`(기본 `topgrid-cell-invalid`)을 부여한다.
 `buildCellClassName` 과 **동일 계약·동형 패턴**(선언적 룰 → 기존 콜백). 순수 함수.
grid-core 1.0 : clean ctx — `cell.column.id`→`ctx.columnId`·`cell.row.original`→`ctx.row`.

```ts
buildValidationCellClass(rules: ValidationRule<TData>[]): CellClassNameCallback<TData>
```

**예시**

```ts
<Grid cellClassName={buildValidationCellClass<Row>([
  { field: 'age', validate: (r) => r.age >= 0, message: '', className: 'border-red-500' },
])} />
```

### `buildValidator`

선언적 검증 룰 배열 → `@topgrid/grid-pro-tracking` 의 `Validator<TData>` 컴파일.

반환 validator 를 tracking `ChangeTrackingConfig.validator` 로 주입하면 tracking 이 **기존 동작**
으로 invalid 행을 `added`/`updated` 에서 제외하고 `getChangeSet.errors` 에 수집한다 — 즉
**커밋 차단은 재구현 없이 tracking 계약 재사용**([[]]). 순수 함수.

```ts
buildValidator(rules: ValidationRule<TData>[]): Validator<TData>
```

**예시**

```ts
const tracking = useChangeTracking({
  data, rowKey: 'id',
  validator: buildValidator<Row>([
    { field: 'age', validate: (r) => r.age >= 0, message: '나이는 0 이상' },
  ]),
});
```

### `commentKey`

충돌 없는 셀 코멘트 키.

```ts
commentKey(rowKey: string, columnId: string): string
```

### `computeReplacements`

검색 결과를 치환 패치로 변환(AC ②). ** 조합**: 반환의 `{rowKey, columnId, prior, next}` 는
`tracking.updateRow(rowKey, {[columnId]: next})` + `makeUpdateCommand(...)` 로 바로 undo 가능하게 적용된다.

`'whole'` → `next = replacement`. `'substring'` → `String(value)` 의 모든 일치를 `replacement` 로
치환(대소문자 구분 시 단순 split/join, 비구분 시 `gi` 정규식). `next` 는 항상 문자열.

```ts
computeReplacements(matches: readonly CellMatch[], query: string, replacement: string, options: FindOptions): Replacement[]
```

### `deserializeComments`

버전 봉투 JSON → 코멘트 Map. `null`/파싱 실패/버전 불일치/형식 오류 → **빈 Map**(throw 없음).

```ts
deserializeComments(raw: null | string, version: number): Map<string, string>
```

### `findMatches`

`columnIds` 컬럼에서 `query` 와 일치하는 셀을 찾는다(범위 한정 = columnIds 스코핑, AC ②).
빈 query → `[]`. `null`/`undefined` 셀 skip.

```ts
findMatches(rows: readonly TData[], getRowKey: (…) => …, columnIds: readonly string[], query: string, options: FindOptions): CellMatch[]
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `rows` | `readonly TData[]` | 검색 대상 행(예: `tracking.rows`) |
| `getRowKey` | `(…) => …` | 행→rowKey 추출(tracking 의 rowKey 와 동일) |
| `columnIds` | `readonly string[]` | 검색할 컬럼 id 목록(범위 한정) |
| `query` | `string` |  |
| `options` | `FindOptions` |  |

### `makeAddCommand`

`addRow` 의 undo/redo 명령. **포착한 `key` 를 redo 시 seed 의 `rowKeyField` 에 강제 주입**한다
— 그렇지 않으면 tracking 이 redo 때 새 UUID 를 발급해 후속 스택 항목의 키 참조가 깨진다
(advisor 지적). undo = `deleteRow(key)`(added 행은 제거됨).

**제약**: 문자열 `rowKey` 필드 전용. 함수형 `rowKey` 는 커스텀 명령을 `push` 하라.

```ts
makeAddCommand(tracking: Pick<ChangeTrackingAPI<TData>, "addRow" | "deleteRow">, key: string, seed: Partial<TData>, rowKeyField: keyof TData & string): UndoRedoCommand
```

**예시**

```ts
const key = tracking.addRow(seed);
undoRedo.push(makeAddCommand(tracking, key, seed, 'id'));
```

### `makeDeleteCommand`

`deleteRow` 의 undo/redo 명령. undo 경로는 행이 **세션에서 추가된 행인지(`'added'`)** vs
**기존 행인지(`'existing'`)** 에 따라 다르다:
- `'added'`: undo = 포착한 행+키로 **재추가**(`addRow`), redo = `deleteRow`.
- `'existing'`: undo = `undoRow(key)`(마운트 스냅샷 복원), redo = `deleteRow`.

**한계([[]], §5.2 P23-1)**: `'existing'` 의 undo 는 *마운트 스냅샷* 복원이므로 삭제 전
세션 편집이 있었다면 그 편집은 **손실**된다(편집되지 않은 기존 행에서만 충실). 편집된 기존 행의
충실한 삭제-undo 는 tracking 의 새 seam 이 필요하다.

```ts
makeDeleteCommand(tracking: Pick<ChangeTrackingAPI<TData>, "addRow" | "deleteRow" | "undoRow">, key: string, deletedRow: TData, kind: "added" | "existing", rowKeyField: keyof TData & string): UndoRedoCommand
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `tracking` | `Pick<ChangeTrackingAPI<TData>, "addRow" \| "deleteRow" \| "undoRow">` |  |
| `key` | `string` |  |
| `deletedRow` | `TData` | `'added'` 재추가용 행 값(삭제 시점). `'existing'` 에서는 미사용. |
| `kind` | `"added" \| "existing"` | 삭제 전 행 종류. |
| `rowKeyField` | `keyof TData & string` | `'added'` 재추가 시 키 강제 주입 필드. |

### `makeUpdateCommand`

`updateRow` 의 undo/redo 명령. `priorRow` = **업데이트 직전** 행 값(patch 대상 필드의 이전
값을 포착) → undo 는 그 이전 값으로 `updateRow`.

```ts
makeUpdateCommand(tracking: Pick<ChangeTrackingAPI<TData>, "updateRow">, key: string, priorRow: TData, patch: Partial<TData>): UndoRedoCommand
```

**예시**

```ts
const prior = tracking.rows.find((r) => r.id === key)!; // 업데이트 전 값
tracking.updateRow(key, patch);
undoRedo.push(makeUpdateCommand(tracking, key, prior, patch));
```

### `serializeComments`

코멘트 Map → 버전 봉투 JSON 문자열.

```ts
serializeComments(comments: ReadonlyMap<string, string>, version: number): string
```

## 타입 · 인터페이스

### `CellCommentsAPI`

`useCellComments` 반환 표면.

| 속성 | 타입 | 설명 |
|---|---|---|
| `clear` | `(…) => …` | 전체 삭제. |
| `comments` | `ReadonlyMap<string, string>` | 현 코멘트 Map(`commentKey` → text). 렌더 간 안정 참조(미변경 시). |
| `deleteComment` | `(…) => …` | 셀 코멘트 삭제. |
| `getComment` | `(…) => …` | 셀 코멘트 조회(없으면 undefined). |
| `setComment` | `(…) => …` | 셀 코멘트 설정(빈 문자열도 저장 — 삭제는 deleteComment). |

### `CellMatch`

검색 결과 1건. `value` = 원본 셀 값(타입 보존).

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnId` | `string` |  |
| `rowKey` | `string` |  |
| `value` | `unknown` |  |

### `CommandStackState`

순수 command 스택 상태(불변).

| 속성 | 타입 | 설명 |
|---|---|---|
| `redoStack` | `readonly UndoRedoCommand[]` |  |
| `undoStack` | `readonly UndoRedoCommand[]` |  |

### `FindOptions`

검색 옵션.

| 속성 | 타입 | 설명 |
|---|---|---|
| `caseSensitive?` | `boolean` | 대소문자 구분. |
| `matchMode?` | `"substring" \| "whole"` | `'substring'`=부분일치(기본) · `'whole'`=셀 전체 일치. |

### `Replacement`

치환 1건. ** 와 조합용**: `{rowKey, columnId}` + `prior`(undo 용 원본 값) + `next`(치환 결과).
`next` 는 **항상 문자열**(아래 의미 참조).

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnId` | `string` |  |
| `next` | `string` | 치환 후 값(문자열). |
| `prior` | `unknown` | 치환 전 원본 값(타입 보존) — undo 명령 구성에 사용. |
| `rowKey` | `string` |  |

### `UndoRedoAPI`

`useUndoRedo` 반환 표면.

| 속성 | 타입 | 설명 |
|---|---|---|
| `canRedo` | `boolean` | redo 가능 여부(redo 스택 비어있지 않음). |
| `canUndo` | `boolean` | undo 가능 여부(undo 스택 비어있지 않음). |
| `clear` | `(…) => …` | 양 스택을 비운다(예: commit 후). |
| `push` | `(…) => …` | 이미 수행된 동작의 명령을 기록한다. redo 스택을 비운다(새 분기). |
| `redo` | `(…) => …` | 되돌린 명령을 다시 적용한다(`redo` 실행 후 undo 스택으로 이동). no-op if 비어있음. |
| `undo` | `(…) => …` | 최근 명령을 되돌린다(`undo` 실행 후 redo 스택으로 이동). no-op if 비어있음. |

### `UndoRedoCommand`

undo/redo 단위 명령. `undo`/`redo` 는 부작용(보통 tracking mutator 호출).

| 속성 | 타입 | 설명 |
|---|---|---|
| `label?` | `string` | 디버깅/UI 라벨(선택). |
| `redo` | `(…) => …` | 이 명령을 다시 적용한다. |
| `undo` | `(…) => …` | 이 명령을 되돌린다. |

### `UseCellCommentsOptions`

`useCellComments` 옵션.

| 속성 | 타입 | 설명 |
|---|---|---|
| `storage?` | `"local" \| "session"` | `'local'`(기본) \| `'session'`. |
| `storageKey` | `string` | storage 키(필수). |
| `version?` | `number` | 봉투 버전 — 불일치 시 기존 데이터 무시. |

### `ValidationRule`

행/필드 단위 검증 룰.

| 속성 | 타입 | 설명 |
|---|---|---|
| `className?` | `string` | 위반 셀에 부여할 className (`field` 지정 룰에서만 사용). |
| `field?` | `keyof TData & string` | 위반 셀 시각 표시용 컬럼 id. 지정 시 `buildValidationCellClass` 가 이 컬럼 셀에만 className 을 부여한다. 미지정이면 행-수준 룰(셀 표시 없음, 메시지/커밋차단만). |
| `message` | `string` | 위반 시 `errors` 에 수집할 메시지 |
| `validate` | `(…) => …` | 순수 술어 — `true` = 통과, `false` = 위반 |

