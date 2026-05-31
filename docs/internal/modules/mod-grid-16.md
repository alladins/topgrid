# Master-Detail / Context Menu 모듈 (`@topgrid/grid-pro-master`)

행 확장(Master-Detail)·우클릭 컨텍스트 메뉴를 제공하는 Pro tier 그리드 컴포넌트
패키지. 두 개의 standalone 그리드 컴포넌트와 그 부속 훅·타입을 export 한다.

- 패키지: `@topgrid/grid-pro-master`
- 라이선스: **Pro** (`SEE LICENSE IN EULA`)
- 의존: `react` / `react-dom` / `@tanstack/react-table` / `@topgrid/grid-core` 는 모두
  peer dependency. `@topgrid/grid-license` 는 런타임 의존(라이선스 워터마크).
- 스타일: 전 컴포넌트 Tailwind className 전용(인라인 `style` 은 토글 컬럼 들여쓰기 등
  동적 폭/위치 소수 예외).

---

## 1. 개요 — 컴포넌트·export 카탈로그

| export | 종류 | 역할 |
|--------|------|------|
| `MasterDetailGrid` | 컴포넌트 | 행 확장 토글 + 확장 시 `renderDetailRow` 로 detail 행 렌더 |
| `ContextMenuGrid` | 컴포넌트 | 우클릭 컨텍스트 메뉴(커스텀 항목·키보드 단축키) |
| `useExpandedPersistence` | 훅 | expanded 상태를 Web Storage 에 영속화 |
| `TreeGrid` / `ColumnPinGrid` | 컴포넌트(re-export) | `@topgrid/grid-core` 의 하위호환 alias 재노출 |

타입 export: `MasterDetailGridProps` / `MasterDetailOptions` / `RenderDetailRow`,
`ContextMenuGridProps` / `ContextMenuItem`, `UseExpandedPersistenceOptions`,
`RowPinningOptions`, `TreeGridProps` / `ColumnPinGridProps`.

내부 전용(public 미노출): `useRowKeyboardNav` + `shouldToggleExpand`(키보드 접근성),
`ExpandToggleCell` / `DetailRow`(렌더 헬퍼), `useContextMenu` / `ContextMenuPortal`(메뉴
상태·렌더).

두 그리드 모두 자체 `useReactTable` 인스턴스를 직접 구성하는 **standalone** 컴포넌트로,
런타임에 `@topgrid/grid-core` 의 `<Grid>` 를 import 하지 않는다(설계 결정 §3.1).
prop 표면은 `GridProps<TData>` 를 그대로 extend 하므로 `data` / `columns` /
`onRowClick` / `onRowDoubleClick` / `onCellClick` / `getSubRows` / `emptyText` /
`className` / `debug` / `onAddRow` 등 기본 그리드 prop 을 모두 받는다. 아래 §2 는 각
컴포넌트가 추가하는 prop 만 기술한다.

---

## 2. 컴포넌트 prop 계약

표기: `?` 는 optional, 괄호 안은 기본값.

### 2.1 MasterDetailGrid

```ts
interface MasterDetailGridProps<TData> extends GridProps<TData> {
  renderDetailRow?: (row: Row<TData>) => ReactNode;
  masterDetail?: {
    expandedRowKeys?: string[];
    onExpandChange?: (expandedKeys: string[]) => void;
  };
}
```

- `renderDetailRow` 제공 시: 첫 컬럼 앞에 확장 토글 컬럼(`__expand__`, 폭 40px)이
  자동 prepend 된다. 토글을 누른 행 아래에 전체 폭(`colSpan`) detail `<tr>` 가
  렌더되고, 그 안에 `renderDetailRow(row)` 결과가 들어간다.
- `renderDetailRow` 미제공 시: 토글 컬럼 없이 평범한 평면 그리드로 동작한다.
- `renderDetailRow` 의 인자는 TanStack `Row<TData>` 전체로, `row.original` /
  `row.id` / `row.depth` / `row.getIsExpanded()` 등에 접근할 수 있다.
- detail `<tr>` 에는 `data-detail-row` 속성이 부여되어 테스트 선택자·CSS 타겟이
  가능하다.
- **controlled 모드**: `masterDetail.expandedRowKeys`(확장된 `row.id` 배열) 제공 시
  외부가 확장 상태를 소유하고, 변경 시 `onExpandChange(keys)` 콜백이 호출된다.
- **uncontrolled 모드**: `expandedRowKeys` 미제공 시 내부 `useState<ExpandedState>`
  로 확장 상태를 관리한다.
- `getSubRows` 를 함께 주면 트리(sub-row) + detail 행을 동시에 구성할 수 있다.
  토글 셀은 `row.depth` 에 비례해 16px 씩 들여쓴다.

#### 명령형 핸들(GridHandle ref)

`ref` 로 `GridHandle<TData>` 를 받으며, 다음 메서드를 노출한다.

| 메서드 | 동작 |
|--------|------|
| `expandAll()` | 전체 행 펼침(`toggleAllRowsExpanded(true)`) |
| `collapseAll()` | 전체 행 접음 |
| `getSelection()` | 선택된 행의 `original` 배열 |
| `clearSelection()` / `refresh()` | 선택 상태 초기화 |
| `addRow` / `deleteRow` / `updateRow` | 대응 `onAddRow` / `onDeleteRow` / `onUpdateRow` prop 위임 |
| `scrollTo` | no-op(이 컴포넌트는 가상화 미지원) |

- `addRow` / `deleteRow` / `updateRow` 는 대응 콜백 prop 이 없으면 dev 모드에서
  경고를 출력하고 no-op 한다.

### 2.2 ContextMenuGrid

```ts
interface ContextMenuGridProps<TData> extends GridProps<TData> {
  contextMenuItems?: ContextMenuItem<TData>[];
}

interface ContextMenuItem<TData> {
  label: string;
  shortcut?: string;
  disabled?: boolean | ((row: TData) => boolean);
  separator?: boolean;
  onClick: (row: TData, cell: Cell<TData, unknown>, event: MouseEvent) => void;
}
```

- `contextMenuItems` 미제공(또는 빈 배열) 시: 우클릭이 브라우저 기본 동작으로
  떨어진다(`onContextMenu` 핸들러·`tabIndex` 미등록).
- `contextMenuItems` 제공 시: 셀 우클릭에서 `preventDefault()` 후 커스텀 메뉴를
  우클릭 좌표에 표시한다. 메뉴는 `createPortal` 로 `document.body` 에 마운트되어
  부모 `overflow`/스태킹 컨텍스트에 잘리지 않는다(`position: fixed`, `z-50`).
- `label`: 메뉴 항목 텍스트. `separator: true` 항목에서는 무시(빈 문자열 전달).
- `shortcut`: 단축키 힌트(항목 우측에 표시 + 기능). 문법 `"[Modifier+]Key"`,
  Modifier ∈ `Ctrl` / `Alt` / `Shift`(복합 가능: `"Ctrl+Shift+K"`), Key 는 단일 문자
  또는 `Delete` / `Enter` / `Escape` / `F1`–`F12`. 대소문자 무관 파싱. 문법 오류
  (예: `"Ctrl+"`, 알 수 없는 Modifier)는 dev 경고 1회 후 해당 항목의 단축키 무시.
- `disabled`: `boolean` 또는 `(row) => boolean`. 비활성 항목은 `opacity-50
  cursor-not-allowed` 스타일 + 클릭 불가(DOM `disabled` + `pointer-events-none`).
- `separator: true`: `<hr>` 구분선으로 렌더(다른 속성 무시).
- `onClick(row, cell, event)`: 우클릭된 행의 `original`, TanStack `Cell`, 네이티브
  `MouseEvent` 를 받는다. 메뉴 클릭과 단축키 양쪽에서 동일 시그니처로 호출되며,
  호출 후 메뉴는 닫힌다.

#### 단축키 동작

- wrapper `<div>` 에 `tabIndex={0}` 가 부여되어 포커스 가능하고, 단축키는 그
  `onKeyDown`(전역 `window` 리스너 아님)에서 처리된다. 그리드가 포커스를 가질 때만
  활성.
- 단축키는 메뉴가 닫혀 있어도 발화하나, 직전 우클릭으로 target 행/셀이 설정된
  상태에서만 의미를 가진다(target 이 `null` 이면 무시).
- `Esc` 키 또는 메뉴 외부 클릭(`mousedown`) 시 메뉴가 닫힌다.

### 2.3 RowPinningOptions (타입 전용)

```ts
interface RowPinningOptions {
  pinTop?: string[];     // 상단 고정 row.id
  pinBottom?: string[];  // 하단 고정 row.id
}
```

행 고정의 기반 타입만 정의된 상태로, 실제 고정 UI 구현은 별도 범위다. 향후 행 고정
컴포넌트에 전달할 형태로 export 만 제공한다.

---

## 3. 핵심 설계 결정과 근거

### 3.1 standalone wrapper(Option B) — MIT↔Pro 경계 보존
`MasterDetailGrid` / `ContextMenuGrid` 는 `@topgrid/grid-core` 의 `<Grid>` 를 런타임에
import 하지 않고, 동일한 `GridProps<TData>` 표면을 받아 자체 `useReactTable` 로
독립 렌더한다. MIT 패키지(`grid-core`)에 Pro 개념(detail/context-menu)을 주입하지
않으므로 MIT↔Pro 경계가 유지되고, `grid-core/Grid.tsx` 의 prop·DOM 구조는 변경되지
않는다.

특히 컨텍스트 메뉴의 경우, `ContextMenuItem.onClick(row, cell, event)` 시그니처가
TanStack row/cell 객체를 요구한다. 외곽 `<div>` 의 `onContextMenu` 핸들러는
`MouseEvent` 만 받고 그리드 내부 row/cell 컨텍스트가 없으므로, 그리드가 자체 테이블
인스턴스를 소유하는 standalone 구조가 이 시그니처를 만족하는 유일한 형태다.

### 3.2 GridHandle 확장 — optional 메서드
`expandAll?()` / `collapseAll?()` 는 공유 `GridHandle<TData>` 타입에 **optional** 로
추가된다. 기본 `<Grid>` 등 확장을 지원하지 않는 구현체의 타입을 깨지 않으면서
(하위호환), `MasterDetailGrid` 같은 확장 지원 컴포넌트만 `useImperativeHandle` 에서
구현한다.

### 3.3 controlled/uncontrolled expanded — 문자열 키 표면
공개 API 는 `expandedRowKeys: string[]`(확장된 `row.id` 목록)로, TanStack 내부 타입
`ExpandedState`(`Record<string, boolean> | true`)를 노출하지 않는다. 문자열 배열이
가장 단순한 외부 계약이고, 내부에서 `ExpandedState` 와 양방향 변환한다.

### 3.4 MasterRow 추출 — 컴포넌트 타입 안정성·포커스 유지
각 master 행은 모듈 스코프의 `MasterRow` 서브컴포넌트로 렌더한다. 키보드 접근성
훅(`useRowKeyboardNav`)을 행 단위로 호출해야 하는데, 훅을 `rows.map()` 루프 내부에서
직접 호출하면 Rules of Hooks 위반이다. 또한 서브컴포넌트를 부모 렌더 함수 *안*에서
정의하면 매 렌더마다 새 함수 참조가 생겨 React 가 전체 행을 unmount/remount 하고
키보드 토글 시 포커스를 잃는다(WCAG 위반). 따라서 `MasterRow` 를 모듈 스코프에 두어
컴포넌트 타입을 안정화한다.

### 3.5 컨텍스트 메뉴 — createPortal + disabled 이중 평가
- 메뉴를 `document.body` 에 portal 렌더해 부모 `overflow: hidden`/`transform` 으로
  인한 클리핑을 회피한다(`position: fixed`).
- `disabled` 함수는 **메뉴 렌더 시점**(현재 target 행 기준)과 **단축키 발화 시점**
  양쪽에서 평가된다. 단축키는 메뉴가 닫힌 상태에서도 발화할 수 있어, 렌더 시점
  평가만으로는 비활성 항목의 단축키를 막을 수 없기 때문이다.
- 단축키는 wrapper `<div>` 의 React `onKeyDown` 으로만 처리하고 전역 `window` 리스너를
  쓰지 않는다. 전역 단축키의 다른 컴포넌트와의 충돌을 피하고, 언마운트 시 핸들러가
  자동 정리된다.

### 3.6 확장 상태 영속화 — 독립 훅(외부 합성)
`useExpandedPersistence` 는 grid-core 의 상태 훅을 수정하지 않는 독립 훅이다(Pro 기능을
MIT 패키지 표면에 주입하지 않기 위함). 반환된 `[expanded, setExpanded]` 를
`MasterDetailGrid` 의 `masterDetail.expandedRowKeys` + `onExpandChange` 에 외부에서
연결(composition)하는 방식으로 협조한다.

### 3.7 가상화 미지원
두 그리드 모두 가상 스크롤을 구현하지 않는다. `GridHandle.scrollTo` 는 의도된 no-op
stub 이며, 대용량 행에서의 가상화는 별도 범위다.

### 3.8 하위호환 alias 재노출
`TreeGrid` / `ColumnPinGrid` 는 `@topgrid/grid-core` 에서 이미 deprecation 경고와 함께
구현된 alias 컴포넌트를 그대로 re-export 한다(신규 wrapper 미생성, 번들 영향 0 —
tree-shake). Pro 패키지에서도 동일 컴포넌트를 import 할 수 있도록 진입점만 추가한다.

---

## 4. 부속 훅

### 4.1 useExpandedPersistence

```ts
interface UseExpandedPersistenceOptions {
  storageKey: string;
  storageType?: 'localStorage' | 'sessionStorage';  // ('localStorage')
  initialExpanded?: ExpandedState;                    // ({})
}

function useExpandedPersistence(
  options: UseExpandedPersistenceOptions,
): [ExpandedState, (updated: ExpandedState | ((prev: ExpandedState) => ExpandedState)) => void];
```

- 마운트 시 `storageKey` 로 저장된 값을 읽어 초기 expanded 로 복원하고, `setExpanded`
  호출 시마다 Web Storage 에 직렬화 저장한다.
- 스토리지를 쓸 수 없는 환경(예: 일부 브라우저의 사생활 모드), JSON 파싱 오류,
  용량 초과(QuotaExceededError) 는 모두 안전하게 처리되어 **in-memory 상태로
  fallback** 한다(앱이 죽지 않음). 스토리지 미가용 시 dev 모드 경고 1회.
- 동일 `storageKey` 를 두 그리드가 공유하면 마지막 unmount 가 값을 덮어쓰므로, 인스턴스
  별 고유 키 사용을 권장한다.

### 4.2 useRowKeyboardNav (내부)

```ts
function shouldToggleExpand(key: string): boolean;  // 'Enter' || ' '
function useRowKeyboardNav<TData>(
  row: Row<TData>, enabled?: boolean,
): { tabIndex: 0; onKeyDown: (e) => void } | {};
```

- WCAG 2.1 AA 키보드 접근성. 행에 `tabIndex=0` 을 주고 `Enter`/`Space` 로
  `row.toggleExpanded()` 를 호출한다.
- `enabled === false` 이거나 `!row.getCanExpand()` 이면 빈 객체 `{}` 를 반환해 그대로
  spread 해도 무해하다(비확장 행·비활성 케이스). 순수 판별 헬퍼 `shouldToggleExpand`
  를 React 셸과 분리.

---

## 5. 엣지 케이스 동작 요약

| 영역 | 입력/상황 | 동작 |
|------|-----------|------|
| MasterDetail | `renderDetailRow` 미제공 | 토글 컬럼·detail 행 없음(평면 그리드) |
| MasterDetail | `renderDetailRow` 가 `null` 반환 | 빈 `data-detail-row` 행 렌더(허용) |
| MasterDetail | controlled keys 에 미존재 `row.id` 포함 | TanStack 이 unknown id 무시 |
| MasterDetail | `getSubRows` + `renderDetailRow` 동시 | 트리 + detail 복합, depth 16px 들여쓰기 |
| ContextMenu | `contextMenuItems` 미제공/빈 배열 | 우클릭 시 브라우저 기본 메뉴 |
| ContextMenu | 우클릭이 뷰포트 우/하단 경계 근처 | 메뉴 위치를 뷰포트 안으로 클램프 |
| ContextMenu | 모든 항목 disabled | 메뉴는 표시, 클릭 불가 |
| ContextMenu | 단축키 문법 오류 | dev 경고 1회 + 해당 단축키 무시 |
| ContextMenu | target 미설정 상태에서 단축키 입력 | 무시(우클릭 이전) |
| ContextMenu | 빠른 연속 우클릭 | 직전 메뉴 닫고 새 위치/target 으로 재표시 |
| 영속화 | 스토리지 미가용/파싱오류/용량초과 | in-memory fallback, 경고 1회 |
| 키보드 | 비확장 행 또는 `enabled=false` | `{}` 반환(tabIndex/onKeyDown 미부여) |

---

## 6. 라이선스·패키징

- `@topgrid/grid-pro-master` 를 import 하면 패키지 진입점에서 `checkLicense()` 가 1회
  실행된다. `MasterDetailGrid` 는 `useLicenseStatus()` 결과에 따라 워터마크 필요 시
  `<Watermark required />` 를 렌더한다.
- 라이선스: `SEE LICENSE IN EULA`(Pro tier).

---

## 7. 사용 예시

```tsx
import { useRef, useState } from 'react';
import type { GridHandle } from '@topgrid/grid-core';
import {
  MasterDetailGrid,
  ContextMenuGrid,
  useExpandedPersistence,
  type ContextMenuItem,
} from '@topgrid/grid-pro-master';

// Master-Detail — uncontrolled + 명령형 펼치기
function Orders({ orders, columns }) {
  const gridRef = useRef<GridHandle<Order>>(null);
  return (
    <>
      <button onClick={() => gridRef.current?.expandAll()}>전체 펼치기</button>
      <MasterDetailGrid<Order>
        ref={gridRef}
        data={orders}
        columns={columns}
        renderDetailRow={(row) => <OrderItems items={row.original.items} />}
      />
    </>
  );
}

// Master-Detail — controlled + 확장 상태 영속화
function PersistedOrders({ orders, columns }) {
  const [expanded, setExpanded] = useExpandedPersistence({
    storageKey: 'orders-grid-expanded',
  });
  return (
    <MasterDetailGrid<Order>
      data={orders}
      columns={columns}
      renderDetailRow={(row) => <OrderItems items={row.original.items} />}
      masterDetail={{
        expandedRowKeys: Object.keys(expanded).filter(
          (k) => (expanded as Record<string, boolean>)[k],
        ),
        onExpandChange: (keys) => {
          const next: Record<string, boolean> = {};
          keys.forEach((k) => { next[k] = true; });
          setExpanded(next);
        },
      }}
    />
  );
}

// 우클릭 컨텍스트 메뉴
function MenuGrid({ rows, columns }) {
  const items: ContextMenuItem<Order>[] = [
    { label: '수정', shortcut: 'E', onClick: (row) => openEdit(row) },
    { separator: true, label: '', onClick: () => {} },
    {
      label: '삭제',
      shortcut: 'Delete',
      disabled: (row) => row.status === 'completed',
      onClick: (row) => deleteOrder(row),
    },
  ];
  return <ContextMenuGrid<Order> data={rows} columns={columns} contextMenuItems={items} />;
}
```
