# ADR-014 (Amendment v2) 실행 결과 — D-partial

**실행일**: 2026-05-17
**Wave**: 1 (amendment 후속)
**상태**: completed
**v1 BLOCKED 보고서**: wave1-adr-014-result.md (보존)

---

## 변경 요약

- `rendererRegistry.ts`: `asCell<P>()` helper 추가, 14 entry `as unknown as CellComponent` → `asCell(Cell)` 변환 (cast 14→1)
- `LinkCell.tsx`: `value?: string` 추가 + `label?: string` deprecated alias 보존 (additive shim)
- `ButtonCell.tsx`: `value?: ReactNode` 추가 + `label?: ReactNode` deprecated alias 보존 (additive shim)
- 9 cell 변경 0 (TextCell/NumberCell/DateCell/StatusBadgeCell/TagCell/ProgressCell/CheckCell/IconCell/AvatarCell)
- Stories sweep: LinkCell/ButtonCell `__stories__` 각 `label:` → `value:` + deprecated 검증 story 1개씩 추가
- `stories/Cells.stories.tsx`: LinkCell/ButtonCell 사용처 sweep + 잠재 regression 수정
- README: LinkCell/ButtonCell 예제 + Migration Notes 섹션 추가
- CHANGELOG: v0.1.0 MINOR entry 추가
- Changeset: `.changeset/adr-014-d-partial.md` 추가

---

## 변경 파일 목록

| 파일 | 변경 내용 | 비고 |
|------|---------|------|
| `packages/grid-renderers/src/rendererRegistry.ts` | asCell helper 추가 (~16 LOC), 14 cast → asCell(Cell) | Step 1 |
| `packages/grid-renderers/src/LinkCell.tsx` | LinkCellProps value? + label? @deprecated, displayValue 로직 | Step 2 |
| `packages/grid-renderers/src/ButtonCell.tsx` | ButtonCellProps value? + label? @deprecated, displayValue 로직 | Step 2 |
| `packages/grid-renderers/src/__stories__/LinkCell.stories.tsx` | label: → value:, WithDeprecatedLabel 추가 | Step 4 |
| `packages/grid-renderers/src/__stories__/ButtonCell.stories.tsx` | label: → value:, WithDeprecatedLabel 추가 | Step 4 |
| `packages/grid-renderers/stories/Cells.stories.tsx` | LinkCellDefault: value+href 수정, ButtonCell label→value, @ts-expect-error 주석 | Step 4 |
| `packages/grid-renderers/README.md` | 예제 추가, Migration Notes 섹션 | Step 5 |
| `packages/grid-renderers/CHANGELOG.md` | v0.1.0 MINOR entry | Step 6 |
| `.changeset/adr-014-d-partial.md` | Changeset MINOR | Step 7 |
| `.claude/tw-grid/decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md` | ADR-014 상태 갱신 + Amendment 절 추가 | Step 9 |
| `.claude/tw-grid/findings/refactor-analysis-2026-05-17.md` | §9.3 amendment footnote 추가 | Step 10 |

---

## 검증 결과

- **typecheck (packages/grid-renderers)**: PASS (0 errors)
- **typecheck (pnpm -r typecheck, 14 packages)**: PASS (0 errors)
- **build**: PASS (dist/index.cjs 14.56 KB, dist/index.mjs 13.79 KB, dist/index.d.ts 19.65 KB)
- **grep `as unknown as CellComponent` in src/**: 2 hits
  - 1건: JSDoc 주석 (렌더링 안 됨)
  - 1건: `asCell` 함수 내부 `return c as unknown as CellComponent` (의도된 잔존)
- **grep `asCell(` in rendererRegistry.ts**: 14 hits (의도)
- **tw-framework-front `<LinkCell label=` / `<ButtonCell label=`**: 0 hits (deprecation surface 0건)

---

## ADR-014 amendment 적용 확인

- [x] ADR 본문 amendment 섹션 추가 (`MOD-GRID-REFACTOR-2026-05-17-decisions.md`)
- [x] ADR 상태 갱신: `accepted` → `accepted (D-partial — amendment 2026-05-17)`
- [x] 분석 보고서 §9.3 footnote 추가 (`refactor-analysis-2026-05-17.md`)

---

## 결과 체크리스트 (ADR-014 amendment D-partial)

- [x] asCell helper 추가 + 14 cast 격리 (14→1)
- [x] LinkCell/ButtonCell value prop 추가 (additive)
- [x] label deprecated alias 보존 (1 cycle)
- [x] 9 cell 변경 0 (의미 명료성 보존)
- [x] CHANGELOG MINOR (v0.1.0)
- [x] Changeset 추가 (minor)
- [x] typecheck PASS (패키지 + 전체 모노레포)
- [x] build PASS (dist 갱신)

---

## 알려진 한계 / 미수행 항목

1. **`Cells.stories.tsx:115` `variant: 'danger'`**: 원본의 pre-existing TS 오류 (D2 rename: `'danger'` → `'destructive'`). `@ts-expect-error` 주석으로 격리. ADR-014 범위 외 — 별도 추적 필요.
2. **단위 테스트 부재**: grid-renderers 테스트 0건 — additive shim 의 런타임 fallback (both undefined → empty span/button) 을 컴파일타임 보호만 의존. Storybook 부트스트랩 후 시각 검증 권고 (MOD-GRID-99-B).
3. **CheckCell/IconCell/AvatarCell**: D-partial 결정으로 변경 0. `checked`/`icon`/`name` prop 유지. 향후 cycle 에서 registry 통일 재논의 가능.
4. **next major 에서 deprecated label 제거**: CHANGELOG + Changeset 에 명시. 다음 cycle changeset 에 major entry 예약 필요.

---

## 다음 단계

- deprecated `label` prop 제거 (다음 major cycle) — changeset major entry 예약
- Storybook 부트스트랩 후 WithDeprecatedLabel story 시각 검증 (MOD-GRID-99-B)
- CheckCell/IconCell/AvatarCell rename 재논의 (별도 ADR, 의미 명료성 trade-off 검토)
