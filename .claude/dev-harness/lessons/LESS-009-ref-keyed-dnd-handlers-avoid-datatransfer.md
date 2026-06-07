---
id: LESS-009
signature: ref-keyed-dnd-handlers-must-not-touch-datatransfer-directly
first_seen: MOD-GRID-64 G-2 (grid-pro-pivot PivotPanel DnD) 2026-06-08
status: lesson (N=2 with MOD-GRID-33 row-reorder) → DnD 클러스터 표준 패턴
related: ["MOD-GRID-33 G-3 (row reorder, ref-keyed)", "GroupPanel (dataTransfer-first, 비-dispatchEvent)", LESS-006]
---

# LESS-009 — dispatchEvent 로 검증할 HTML5 DnD 핸들러는 `e.dataTransfer` 를 직접 만지지 말고 React ref 를 1차로 써라

## 맥락
HTML5 native DnD(`draggable` + `dataTransfer`)는 Playwright 의 마우스 기반 `dragTo` 로 시뮬레이션되지
않는다. 이 레포에서 **유일하게 신뢰성 입증된** DnD 테스트 형태는 `dispatchEvent('dragstart'/'dragover'/'drop')`
(MOD-33 row-reorder). 그런데 합성 `dispatchEvent` 로 만든 drag 이벤트에는 **`dataTransfer` 가 없다**(null).

GroupPanel 패턴(`const id = e.dataTransfer.getData('columnId') || ref.current`)을 그대로 베끼면:
- `onDragStart` 의 `e.dataTransfer.setData(...)` 가 throw(합성 이벤트 = null) — ref 설정을 그 *전*에 해도,
- `onDrop` 의 `e.dataTransfer.getData(...)` 가 `|| ref.current` 폴백에 **도달하기 전에** throw → 드롭 전체 실패.

MOD-64 에서 정확히 이 형으로 첫 시도가 통과(node)했으나 chromium 드롭이 no-op(`rows-zone` 0)이었다.

## 통찰 (검증된 사실)
작동하는 MOD-33 핸들러는 **`e.dataTransfer` 를 전혀 접근하지 않는다** — `onDragStart` 는 ref/state 만 세팅,
`onDrop` 은 ref/state 만 읽는다. 즉 **드래그 소스의 진실은 React ref 에 있고, `dataTransfer` 는 (있으면)
Safari 폴백일 뿐**이다. 합성 이벤트엔 dataTransfer 가 없으므로 ref 가 유일 경로다.

## 올바른 형 (how to apply)
```ts
// onDragStart: ref 먼저, dataTransfer 는 try-guard 안에서만.
dragField.current = field;
try { e.dataTransfer?.setData(KEY, field); if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'; } catch {}

// onDrop: ref 를 1차 source 로, dataTransfer 는 가드된 보강.
let field = dragField.current;
try { const dt = e.dataTransfer?.getData(KEY); if (dt) field = dt; } catch {}
```
- **ref = 1차 진실**(real drag + 합성 dispatchEvent 양쪽 작동), **dataTransfer = optional 폴백**(try-guard 필수).
- 절대 `e.dataTransfer.getData(...)` 를 폴백 `|| ref` 의 *왼쪽*에 두지 말 것 — throw 가 폴백을 가린다.

## 탐지 (체크리스트)
- DnD 핸들러가 `e.dataTransfer.getData/setData` 를 try 없이 직접 호출하는가? → 합성 dispatchEvent 에서 throw.
- 드롭이 chromium 에서 no-op 인데 node/순수 spine 은 통과하는가? → dataTransfer throw 로 핸들러가 죽은 것(LESS-006 의 자매: node-blind).
- 검증 발산이 "chip/요소가 이동했다" 인가? → 부족. **소비 컴포넌트(그리드 재-피벗 등)가 실제 반응**하는지로 발산(advisor).

## 출처
MOD-GRID-64 G-2(`PivotPanel.tsx` handleDrop/onDragStart, `tests/visual/pivot-panel-dnd.spec.ts`) +
MOD-GRID-33 G-3(`Grid.tsx` rowDragProps, `grid-row-reorder.spec.ts`)의 일반화. DnD 클러스터(잔여: tool-panel
drag·drag-between-grids)의 표준 핸들러 형. [[LESS-006]](node-blind to browser-gated) 군.
