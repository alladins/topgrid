# 신 ADR-2 (MOD-GRID-05 G-004 ADR-003) 실행 결과

작성일: 2026-05-18
담당: G-004 implementer

---

## 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `topvel-grid-monorepo/packages/grid-renderers/src/EditableCell.tsx` | EditableCellProps 3 prop 추가 + alignToClass 헬퍼 + handleKey D3 wiring |
| `.claude/tw-grid/decisions/MOD-GRID-05-decisions.md` | ADR-MOD-GRID-05-003 본문 신설 (append) |
| `.claude/tw-grid/state.json` | MOD-GRID-05 goalsIndex G-004 추가, lastUpdated 갱신 |
| `.claude/tw-grid/decisions/ID-LEDGER.md` | §7 MOD-GRID-05 G-004 행 추가, lastIssued G-003 → G-004 |
| `topvel-grid-monorepo/.changeset/g-004-editable-cell-3prop.md` | Changeset 신설 (minor) |

## probe 결과

- 파일: `packages/grid-renderers/src/__probe__/g-004-editable-3prop.probe.tsx` (생성 → 검증 → 삭제)
- `pnpm -F @tomis/grid-renderers typecheck` (probe 포함): **PASS**
- probe 삭제 후 재검증: **PASS**

## 검증

| 검증 항목 | 결과 |
|----------|------|
| `pnpm -F @tomis/grid-renderers typecheck` | PASS |
| `pnpm -F @tomis/grid-renderers build` | success — dist/index.mjs 15.62 KB |
| `pnpm -r typecheck` | 14 packages PASS (regression 0) |

## 3 prop 적용 확인

| prop | 위치 | 구현 방식 |
|------|------|---------|
| `maxLength?: number` | `<input>` + `<textarea>` | C-29 conditional spread `{...(maxLength !== undefined ? { maxLength } : {})}` |
| `align?: 'left' \| 'center' \| 'right'` | 전 editType 브랜치 (select/textarea/input) | `alignToClass()` 헬퍼 → Tailwind class (`text-center` / `text-right`) — C-5 준수 |
| `stopPropagationOnKeyDown?: boolean` | `handleKey` (useCallback) | Enter/Esc/Tab 처리 완료 후 `e.stopPropagation()` 추가 호출. deps 배열에 추가 |

### select 분기 maxLength 비적용 (의도적)
`HTMLSelectElement` 에는 `maxLength` attribute 가 존재하지 않으므로 select 브랜치에는 전달하지 않음.
코드 주석으로 명시: `// maxLength is NOT forwarded to <select> — HTMLSelectElement has no maxLength.`

## Advisor 지적사항 반영

| 항목 | advisor 지적 | 반영 |
|------|------------|------|
| align C-5 위반 | inline style 금지, Tailwind only | `alignToClass()` 함수로 class mapping 구현 |
| stopPropagation 순서 | handleKey 처리 완료 후 호출 | Enter/Esc/Tab 분기 이후에 `if (stopPropagationOnKeyDown) e.stopPropagation()` |
| maxLength on select | HTMLSelectElement 미지원 | select 브랜치 완전 제외 |
| C-29 spread | conditional spread 패턴 | `{...(maxLength !== undefined ? { maxLength } : {})}` 적용 |

## ID-LEDGER 갱신 확인

- MOD-GRID-05 ADR lastIssued: 002 → **003** (MOD-GRID-05-decisions.md ADR-003 신설)
- MOD-GRID-05 Goal lastIssued: G-003 → **G-004** (ID-LEDGER §7 + state.json 갱신)

## 알려진 한계

1. **단위 테스트 부재**: `stopPropagationOnKeyDown` + `align` + `maxLength` 의 런타임 동작 검증 없음. Storybook stories (C-25 의무 — 선택) 는 본 cycle 범위 외.
2. **G-7 연관**: `stopPropagationOnKeyDown` prop 은 MOD-GRID-01 G-007 (`onCellKeyDown` + `GridHandle.startEditing`) implement 후 use case 재확인 권장. G-7 채택 시 host-level 분리 의도 자체가 무의미할 수 있음 (canonical-gap-supplementation-spec §8 L-4 참조).
3. **MOD-GRID-10 ChangeTrackingGrid**: EditableCell 재사용 구조이므로 신 prop 자동 노출 가능하나, column.meta.editConfig 에 매핑 여부는 별도 cycle 결정.
