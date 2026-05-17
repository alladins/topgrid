# @tomis/grid-pro-range Changelog

## v0.3.0 (2026-05-17) — License watermark enforcement

### Added
- License enforcement — `RangeSelectGrid` now reads `useLicenseStatus()` and renders `<Watermark required />` inside its existing `relative` wrapper when the license is invalid or `watermarkRequired === true`. (ADR-MOD-GRID-REFACTOR-2026-05-17-001)

## v0.2.0 (2026-05-15) — G-006 RangeSelectGrid 완전 통합

### 신규 기능

- `RangeSelectGridAllProps<TData, TCell>`: 5개 enable 플래그 + 7개 callback props 확장
  - `enableRangeSelection?: boolean` (default: true)
  - `enableKeyboardNav?: boolean` (default: true)
  - `enableDragFill?: boolean` (default: false)
  - `enableClipboard?: boolean` (default: false)
  - `enableKeyboardEdit?: boolean` (default: false)
  - `enableVirtualization?: boolean` (default: false)
- `RangeSelectGrid` 컴포넌트: 5-hook 완전 통합 (useCellRange + useKeyboardNav + DragFillHandle + useClipboard + useKeyboardEdit)
- Pro 라이선스 런타임 stub (MOD-GRID-99-A 완료 후 실 검증으로 교체 예정)
- @tanstack/react-virtual 1000-row 가상화 지원 (`enableVirtualization=true`)

### 하위 호환

- v0.1.x `RangeSelectGridProps` 6-prop 인터페이스 완전 유지 (C-6)
- 기존 사용 코드 변경 불필요:
  ```tsx
  // v0.1.x — 그대로 동작
  <RangeSelectGrid data={data} columns={columns} />
  ```

### 마이그레이션 (선택적 신규 기능 활성화)

```tsx
// v0.2.0 — Drag-fill + Clipboard 활성화 예시
<RangeSelectGrid<MyData, string>
  data={data}
  columns={columns}
  enableDragFill
  enableClipboard
  getCellValue={(row, col) => getMyValue(row, col)}
  onFillComplete={(cells) => applyUpdates(cells)}
  onPaste={(cells) => applyUpdates(cells)}
/>
```

## v0.1.x (G-001~G-005)

- G-001: CellRange 모델 + 마우스 드래그/Shift+Click
- G-002: Arrow/Ctrl+Arrow 키보드 내비게이션
- G-003: DragFillHandle + fillRange + detectSeriesStep
- G-004: useClipboard (Ctrl+C/V + TSV)
- G-005: useKeyboardEdit (Delete/F2/Enter/printable)

## 0.0.0

Initial scaffold.
