# 변경 추적 모듈 (`@topgrid/grid-pro-tracking`)

행 단위 추가/수정/삭제를 추적하고, 화면 필드를 서버 필드로 매핑하고, 저장 직전
행 검증을 수행해 서버 payload 로 변환하는 Pro 패키지. 핵심은 단일 React 훅
`useChangeTracking` 이며, TanStack Table 과 **병렬**로 동작한다(훅이 반환하는
`rows` 를 그대로 `useReactTable({ data: rows })` 에 주입).

- 패키지: `@topgrid/grid-pro-tracking`
- 라이선스 tier: **Pro** (`package.json` `"license": "SEE LICENSE IN EULA"`)
- 의존:
  - peer — `react` / `react-dom` / `@tanstack/react-table` / `@topgrid/grid-core`
    (마지막은 `ChangeTrackingGrid` alias 가 `<Grid>` 를 합성하기 때문에 필요)
  - 런타임 dependency — `@topgrid/grid-license` (라이선스 검증/워터마크)
- 코어 로직은 **순수 함수**(React 비의존)로 `src/internal/` 에 격리하고, 훅은
  그 위에 `useReducer` shell 을 씌운다. 외부 변경 추적 라이브러리 의존 0.
- 내부 구현은 `Map<rowKey, …>` + `structuredClone` 스냅샷으로 자체 구현한다
  (외부 그리드 벤더 코드 차용 없음).

---

## 1. 개요 — 무엇을 추적하는가

`useChangeTracking` 은 마운트 시점의 `data` 를 스냅샷으로 잡고, 이후의 모든
변경을 행 키(`rowKey`) 기준으로 추적한다. 상태는 세 가지로 분류된다.

| 상태 | 의미 | 노출 위치 |
|------|------|-----------|
| `added` | `addRow(seed)` 로 새로 추가된 행 | `tracking.added` |
| `edited` | 기존 행을 `updateRow(key, patch)` 로 수정 — `__original`(수정 전 값) 보존 | `tracking.edited` |
| `deleted` | `deleteRow(key)` 로 삭제 표시된 기존 행 | `tracking.deleted` |

추가 제공 기능:

- **통합 뷰** `tracking.rows` — 추가/수정/삭제가 합쳐진 표시용 배열. 각 행에
  `__rowStatus` 마커가 붙어(unchanged 행은 생략) 렌더러가 상태별 색을 입힐 수 있다.
- **서버 payload 변환** `getChangeSet()` — `mapping`/`validator` 를 적용한
  `{ added, updated, removed, errors }` 형태(`ChangeSet`).
- **서버 전송** `commitChanges(endpoint, options?)` — fetch(또는 주입 fetcher)로
  payload 전송 + 성공 시 자동 리셋 + 낙관적 업데이트 시 실패 자동 rollback.
- **행 단위 취소** `undoRow(key)` / **전체 복원** `resetChanges()`.
- **상태별 Tailwind 클래스** `getRowStatusClassName` / `defaultRowStatusClassNames`.
- **셀 단위 편집 추적** `editedCellsMap`(`editedCells: true` 활성 시).
- **선언적 컴포넌트** `ChangeTrackingGrid` alias — 훅 + `<Grid>` 합성.

---

## 2. 핵심 타입 계약 (TypeScript)

모든 public 타입은 `@topgrid/grid-pro-tracking` barrel 로 노출된다. `any` 0.

```ts
export type RowStatus = 'added' | 'edited' | 'deleted';

/** 수정된 행 shape — TData + 첫 updateRow 시점의 structuredClone 스냅샷 */
export type OriginalSnapshot<TData> = TData & { __original: TData };

/** 화면→BE 필드 매핑. 값은 BE 가 가져갈 원본 필드명(string) 또는 동적 계산 함수 */
export type Mapping<TData> = Record<string, string | ((row: TData) => unknown)>;

/** 행 단위 검증기 — valid=false 면 added/updated 에서 제외되고 errors[] 진입 */
export type Validator<TData> = (row: TData) => { valid: boolean; errors?: string[] };

/** 매핑 결과 — BE 필드명 기반 평면 객체 */
export interface MappedRow { readonly [key: string]: unknown; }

export interface CommitOptions {
  method?: string;        // (POST)
  fetcher?: (url: string, init?: RequestInit) => Promise<unknown>;  // (globalThis.fetch)
  autoReset?: boolean;    // (true) 성공 시 자동 resetChanges
  optimistic?: boolean;   // config.optimistic 를 이번 호출에 한해 override
}

export interface ChangeSet {
  added: MappedRow[];
  updated: MappedRow[];
  removed: MappedRow[];
  errors: Array<{ index: number; message: string; type: 'added' | 'updated' }>;
}
```

### 2.1 입력 config — `ChangeTrackingConfig<TData>`

```ts
interface ChangeTrackingConfig<TData> {
  data: TData[];                                       // required — 마운트 시 스냅샷
  rowKey: keyof TData | ((row: TData) => string);      // required — PK 추출
  mapping?: Mapping<TData>;
  validator?: Validator<TData>;
  optimistic?: boolean;                                // (false) commit 실패 시 auto-rollback
  onSnapshotInit?: (snapshot: ReadonlyMap<string, TData>) => void;  // 마운트 1회
  editedCells?: boolean;                               // (false) 셀 단위 편집 추적 활성
}
```

| 필드 | required | 기본값 / 동작 |
|------|----------|--------------|
| `data` | required | 마운트 시점 1회 스냅샷. 참조가 바뀌면 §6.5 재구축 |
| `rowKey` | required | 필드명 또는 `(row) => string` |
| `mapping` | optional | 미제공 시 원본 필드 그대로 직렬화 (pass-through) |
| `validator` | optional | 미제공 시 모든 행 통과 |
| `optimistic` | optional | `false` |
| `onSnapshotInit` | optional | 첫 마운트 후 1회 호출(이후 재구축에서는 미호출) |
| `editedCells` | optional | `false` |

### 2.2 반환 API — `ChangeTrackingAPI<TData>`

훅이므로 ref/imperative handle 없이 반환 객체가 직접 명령형 API 를 노출한다.

```ts
interface ChangeTrackingAPI<TData> {
  // 읽기 뷰 (reactive)
  rows: ReadonlyArray<TData & { __rowStatus?: RowStatus }>;
  added: ReadonlyArray<TData>;
  edited: ReadonlyArray<OriginalSnapshot<TData>>;
  deleted: ReadonlyArray<TData>;
  editedCellsMap: ReadonlyMap<string, boolean>;   // key = `${rowKey}_${columnId}`

  // 명령형 메서드
  addRow(seed: Partial<TData>): string;           // 할당된 key 반환
  updateRow(key: string, patch: Partial<TData>): void;
  deleteRow(key: string): void;                   // added 면 즉시 제거, 아니면 'deleted' 마킹
  undoRow(key: string): void;                     // 행 단위 취소
  hasChanges(): boolean;
  getChangeSet(): ChangeSet;
  resetChanges(): void;                           // 초기 스냅샷 복원
  commitChanges(endpoint: string, options?: CommitOptions): Promise<unknown>;
}
```

`rows`/`added`/`edited`/`deleted` 는 상태가 바뀌지 않은 리렌더에서 참조가
안정적으로 유지된다(`materialize` 결과를 `useMemo([state])` 로 캐시). `addRow` 는
할당된 key 를 **동기적으로** 반환하므로 호출자가 새 행을 즉시 참조할 수 있다.

### 2.3 사용 예시

기본 사용:

```tsx
import { useChangeTracking } from '@topgrid/grid-pro-tracking';

interface Employee { empId: string; name: string; deptCode: string; }

function PayrollPage({ initialData }: { initialData: Employee[] }) {
  const tracking = useChangeTracking<Employee>({ data: initialData, rowKey: 'empId' });

  return (
    <>
      <button onClick={() => tracking.addRow({ name: '신규' })}>행 추가</button>
      <button
        disabled={!tracking.hasChanges()}
        onClick={() => tracking.commitChanges('/api/employees/batch')}
      >
        저장 ({tracking.added.length + tracking.edited.length + tracking.deleted.length} 건)
      </button>
      <Grid data={tracking.rows} columns={columns} />
    </>
  );
}
```

mapping + validator + optimistic:

```tsx
const mapping: Mapping<Employee> = {
  empCode: 'empId',                          // string entry — row.empId 그대로 forward
  salaryAmount: (r) => r.salaryGrade * 1000, // function entry — 동적 계산
  updatedAt: () => new Date().toISOString(),
};

const validator: Validator<Employee> = (r) => ({
  valid: r.name.length > 0,
  errors: r.name.length === 0 ? ['이름 필수'] : undefined,
});

const tracking = useChangeTracking<Employee>({
  data, rowKey: 'empId', mapping, validator, optimistic: true,
});

const cs = tracking.getChangeSet();
if (cs.errors.length > 0) { /* 검증 실패 행 강조 */ }
else await tracking.commitChanges('/api/payroll/batch', { method: 'POST' });
```

---

## 3. `getChangeSet` — payload 변환 파이프라인

`getChangeSet()` 은 순수 함수 `buildChangeSet(state, { mapping, validator })` 를
호출한다(훅 외부에서도 단독 호출 가능 — 테스트 친화). 알고리즘:

1. `removed` — `'deleted'` 행. **validator 미호출**(삭제는 PK 만 필요), mapping 적용.
2. `added` — `'added'` 행. validator 호출 → `valid=false` 면 `added[]` 에서 제외 +
   `errors[{ index, message, type: 'added' }]` push. 통과 행만 mapping 적용.
3. `updated` — `'edited'` 행. validator 호출, 위와 동일 정책(`type: 'updated'`).
4. `{ added, updated, removed, errors }` 반환.

`errors[].index` 는 그룹(added/updated) 내 0-based 순서(검증 제외 전 시퀀스 기준).

### 3.1 `applyMapping` 시맨틱

- `mapping` 미제공 또는 빈 객체 → `{ ...row }` 얕은 복사(pass-through, 원본 mutation 방지).
- `mapping[beField] = 'sourceField'`(string) → `result[beField] = row.sourceField`.
- `mapping[beField] = (row) => value`(function) → 호출 결과를 `result[beField]` 에.
- 헬퍼 자체는 try/catch 0 — 함수 entry 의 throw 는 호출자(`buildChangeSet`)가 행
  단위로 잡아 `errors[]` 로 변환(`'(mapping threw: …)'`).

### 3.2 `runValidator` 시맨틱

- `validator` 미제공 → 빈 배열(전부 통과).
- 검증 함수가 throw → `'(validator threw: …)'` 로 실패 처리(방어적 — 검증기가
  `buildChangeSet` 를 깨뜨리지 않음).
- `valid=false` → `message = errors?.[0] ?? '(unknown error)'`(첫 메시지만 보관).

---

## 4. `commitChanges` — 전송 + 롤백

```
1) cs = getChangeSet()
2) result = await fetcher(endpoint, { method, body: JSON.stringify(cs),
                                      headers: { 'Content-Type': 'application/json' } })
3) 성공 → autoReset !== false 면 dispatch RESET; return result
4) 실패(throw/reject) → optimistic 면 dispatch RESET(rollback); 두 경우 모두 re-throw
```

| 분기 | 조건 | 동작 |
|------|------|------|
| B1 성공 + autoReset | fetcher resolve, `autoReset ?? true` | RESET 후 result 반환 (`autoReset:false` 면 RESET skip) |
| B2 실패 + optimistic | fetcher reject, `optimistic ?? config.optimistic` | RESET(전체 변경 폐기) 후 re-throw |
| B3 실패 + !optimistic | fetcher reject, optimistic false/undefined | state 유지한 채 re-throw(사용자 수정 후 재시도 가능) |

- 기본 fetcher = `globalThis.fetch`. 내장 fetcher 는 `!res.ok` 면 throw,
  성공 시 `res.json()` 반환. 커스텀 `fetcher`(axios 호환) 주입 가능.
- 실패 시 **항상 re-throw** — 토스트/로그 정책은 호출자 책임. B2 는 rollback 이
  re-throw **이전**에 일어나므로 catch 블록은 이미 리셋된 tracker 를 본다.

---

## 5. 시각 표시와 셀 단위 추적

### 5.1 행 상태 Tailwind 클래스

```ts
const defaultRowStatusClassNames = {
  added:   'bg-green-50 border-l-2 border-green-400',
  edited:  'bg-yellow-50 border-l-2 border-yellow-400',
  deleted: 'bg-red-50 line-through opacity-60',
};

function getRowStatusClassName(status: RowStatus, classNames?: RowStatusClassNames): string;
```

- `classNames` 를 주면 `{ ...default, ...classNames }` 로 머지(부분 override).
- 인식 불가 status → `''`(방어적). 인라인 `style` 미사용, Tailwind className 만.

### 5.2 `editedCellsMap` — 셀 단위 편집 추적

`config.editedCells: true` 일 때만 동작한다(성능 게이트). `updateRow(key, patch)`
호출 시 `patch` 의 각 key 에 대해 `editedCellsMap.set('${rowKey}_${columnId}', true)`.

- **columnId 가정**: TanStack `ColumnDef.id ?? accessorKey` 컨벤션에서
  `patch` 의 key(= field name) 가 `accessorKey` 와 일치한다고 본다. column 에
  `id` 를 명시 override 한 셀은 추적되지 않는다(문서화된 한계).
- purge 규칙: `undoRow`(added/edited/deleted 브랜치) + `deleteRow` net-zero(원래
  'added') + `resetChanges` + 재구축 시 해당 행의 `${rowKey}_*` entry 제거.
- `editedCells=false`(기본) 면 `editedCellsMap` 은 항상 비어 있다.

---

## 6. 엣지 케이스 동작

| 케이스 | 동작 |
|--------|------|
| add 후 즉시 delete | `added` 에서 즉시 제거(net-zero) — `deleted` 진입 X, `hasChanges()` false 가능 |
| 같은 행 두 번 수정 | `originalMap` 스냅샷은 **첫 수정 시점 1회만** 저장 — `edited[i].__original` = 최초값 |
| `deleted` 행을 다시 `updateRow` | `'edited'` 로 승격(삭제 표시 해제 효과) + 현재값 스냅샷 |
| `undoRow` — added | 완전 제거(statusMap/currentMap/originalMap/insertionOrder/editedCells 모두 scrub) |
| `undoRow` — edited | `originalMap` 값으로 `currentMap` 복원 + statusMap/originalMap 에서 제거 |
| `undoRow` — deleted | 삭제 표시만 해제. `currentMap` 불변 + `originalMap` 도 제거(아래 leak fix) |
| `undoRow`/`updateRow`/`deleteRow` — unknown key | `console.warn` + state 불변(throw 없음) |
| rowKey collision (동일 key 2건) | `console.warn` + last-wins(deterministic). throw X — 페이지 crash 회피 |
| `addRow(seed)` 에 key 필드 없음 | `globalThis.crypto.randomUUID()` 자동 부여. 함수형 rowKey 가 throw/비문자열 반환 시도 동일 fallback |

`undoRow` 'deleted' 브랜치의 `originalMap.delete(key)` 는 leak 방지용이다.
`unchanged→updateRow→deleteRow→undoRow→updateRow` 시퀀스에서 `originalMap` 잔존
엔트리가 남으면 후속 `updateRow` 가 "스냅샷 1회" 불변식을 위반하므로 함께 제거한다.

### 6.5 `data` prop 참조 변경 시 재구축

`config.data` 의 **참조**가 바뀌면(예: 페이지가 새 데이터셋으로 교체, `useQuery`
완료) 훅은 진행 중인 added/edited/deleted 를 모두 폐기하고 스냅샷을 재구축한다.
진행 중 변경이 있던 경우에만 `console.warn('… pending changes discarded')` 출력.

> 매 렌더마다 새 배열을 만들면(`data: rows.filter(...)`) 변경이 매번 지워진다.
> `useMemo` 로 안정 참조를 유지하는 것이 canonical 패턴이다.

---

## 7. `ChangeTrackingGrid` alias

훅 + `<Grid>`(grid-core peer) 를 합성한 선언적 컴포넌트. 신규 코드 권장 경로는
훅(`useChangeTracking`) + `<Grid>` 직접 사용이며, alias 는 편의용이다.

```tsx
interface ChangeTrackingGridProps<TData> extends Omit<GridProps<TData>, 'data'> {
  data: TData[];
  rowKey: keyof TData | ((row: TData) => string);
  mapping?: Mapping<TData>;
  validator?: Validator<TData>;
  optimistic?: boolean;
  editedCells?: boolean;
  onSave?: (cs: ChangeSet) => void | Promise<void>;  // 자동 호출 X — 호출자 책임
}
```

- `<Grid>` 에는 `tracking.rows` 를 `data` 로 넘긴다(이것이 추가/수정/삭제 오버레이를
  렌더 그리드에 바인딩한다). 나머지 `GridProps` 는 그대로 forward.
- optional 필드는 `exactOptionalPropertyTypes` 호환을 위해 conditional spread 로
  config 를 조립한다(`...(mapping !== undefined ? { mapping } : {})`).
- `onSave` 는 **자동 호출하지 않는다** — alias 가 commit 정책(endpoint/네트워크)을
  소유하지 않고 명시성을 유지하기 위함. commit 은 소비자가 `commitChanges` 로 수행.
- ref 로 `GridHandle<TData> & ChangeTrackingAPI<TData>` 결합 handle 을 노출한다.
  `GridHandle` 전용 메서드(`scrollTo`/`getSelection`/`clearSelection`/`refresh`)는
  alias 레벨 no-op(+dev warn) — 가상화 스크롤 등은 `<Grid>` 에 직접 ref 를 주는 편이 낫다.
- 라이선스 미등록 시 `useLicenseStatus()` 결과에 따라 `<Watermark>` 를 함께 렌더한다.

---

## 8. 핵심 설계 결정과 근거

### 8.1 단일 훅 + plain object config (외부 store/클래스 거부)
상태를 React `useReducer` + 순수 헬퍼로 구현하고 zustand 같은 외부 store 나
CollectionView 식 OOP 래퍼를 쓰지 않는다. zustand 는 새 런타임 의존성(~3 KB)과
별도 state idiom 학습을 강요해 zero-runtime 약속과 "drop-in 훅" UX 를 해친다.
OOP 래퍼는 React 18 동시성 렌더링과 충돌하고 렌더마다 할당이 두 배가 된다.

### 8.2 순수 헬퍼 / React shell 분리
`createChangeMap`/`applyAdd`/`applyUpdate`/`applyDelete`/`applyUndo`/`materialize`/
`resetChangeMap` + `buildChangeSet`/`applyMapping`/`runValidator` 는 모두 React 비의존
순수 함수다(`src/internal/`, `buildChangeSet.ts`). 훅은 그 위에 `useReducer` 를
씌운 얇은 shell. 덕분에 트리쉐이킹과 단위 테스트가 쉽고, reducer 가 state 참조를
변경하는 단일 지점이 되어 참조 동등성 기반 리렌더가 정확하다.

### 8.3 `Mapping` 방향 — BE 필드명을 키로 (string forward / function 계산)
`mapping[BE필드] = 원본필드명 | (row) => 값` 형태. 원본→BE 방향(역방향)은 function
entry 로 새 필드를 만들 수 없어 동적 계산(timestamp, 합산 등)을 표현하지 못하므로
거부했다. Zod 스키마 통합도 거부 — Zod 런타임만으로 Pro 번들 예산(20 KB)을 거의
소진하고 특정 검증 라이브러리를 강제한다.

### 8.4 검증은 동기(sync) 한정 + 행 단위 격리
`Validator` 는 `buildChangeSet` 시점에 added/updated 행마다 1회 동기 호출된다
(removed 는 미호출 — 삭제는 PK 만 필요). async validator 는 거부했다: 비동기 검증이
필요하면 commit 전 호출자가 pre-validate 한다. 매핑/검증 함수의 throw 는 행 단위
try/catch 로 격리해 어느 행이 실패했는지 `errors[].index` 로 정확히 추적한다.

### 8.5 rowKey collision/missing — warn-and-continue (throw 거부)
중복 key 는 `console.warn` + last-wins, `addRow` 의 누락 key 는
`crypto.randomUUID()` fallback. 렌더 중 throw 는 페이지 전체를 crash 시켜 사용자가
UI 로 문제를 고칠 길을 막으므로 거부했다. 자동 키를 `Date.now()+counter` 대신
UUID 로 한 이유는 결정적 테스트(매 실행 동일성) 보존 + 숨은 전역 카운터 제거.
함수형 rowKey 는 try/catch 로 감싸 throw/비문자열 시 UUID fallback.

### 8.6 `data` 참조 변경 → 자동 재구축 (merge/manual 거부)
참조가 바뀌면 진행 중 변경을 폐기하고 스냅샷을 재구축한다. manual-only(소비자가
직접 `resetChanges`)는 React Query/SWR/loader 통합을 거칠게 만드는 footgun 이라
거부했고, deep-merge 는 "사라진 행 = 삭제? 새 행 = 추가?" 의미가 모호해 사용자가
하지 않은 서버 편집을 날조할 위험 때문에 거부했다. 추후 `'preserve'|'merge'` 옵션은
additive 로 확장 가능.

### 8.7 commitChanges 롤백 — RESET 재활용 (별도 public API 거부)
optimistic 실패 시 rollback 은 `resetChanges` 와 동일한 RESET dispatch(전체 폐기)다.
별도 `rollback()` public 메서드는 API 표면 비대로 거부했고, batch별 preCommit
스냅샷은 commit 마다 전체 Map 복제로 할당이 두 배가 되어 거부했다. batch 격리가
필요한 호출자는 변경을 chunk 로 나눠 여러 번 `commitChanges` 한다.

### 8.8 alias 는 commit 정책을 소유하지 않음
`ChangeTrackingGrid` alias 는 훅 + `<Grid>` 합성만 하고 `onSave` 를 자동 호출하지
않는다. endpoint/네트워크 정책을 컴포넌트가 숨기면 명시성이 떨어지므로, commit 은
소비자가 `commitChanges` 로 직접 수행하게 한다.

### 8.9 셀 단위 추적은 accessorKey 기반 + opt-in
`editedCells: true` 일 때만 `editedCellsMap` 을 채운다(기본 off — 성능). 합성 키는
`${rowKey}_${columnId}` 이고 columnId 는 accessorKey 로 가정한다. 명시 `id` override
컬럼은 미추적(문서화된 한계) — per-column-id API 는 `updateRow` 시그니처를 바꿔야
해서 보류했다. purge 는 전체 맵을 1회 스캔(O(N))하며 일반적 변경 규모(<1000 셀)에서
충분하다.

---

## 9. 패키징·사용 요약

```tsx
import {
  useChangeTracking,
  buildChangeSet,
  getRowStatusClassName,
  defaultRowStatusClassNames,
  ChangeTrackingGrid,
  type ChangeTrackingConfig,
  type Mapping,
  type Validator,
  type ChangeSet,
} from '@topgrid/grid-pro-tracking';
```

- 훅 직접 사용: `useChangeTracking(config)` → `tracking.rows` 를 그리드에 주입.
- 선언적: `<ChangeTrackingGrid data={...} rowKey="id" columns={...} />`.
- 빌드는 tsup CJS+ESM dual + `.d.ts`. 외부 그리드 벤더 코드 차용 0, 추가 런타임
  의존성 0(라이선스 패키지 제외).
