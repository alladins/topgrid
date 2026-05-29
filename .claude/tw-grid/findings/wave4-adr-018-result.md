# ADR-018 실행 결과 — registry slot 정책

**실행일**: 2026-05-17
**Wave**: 4
**상태**: completed
**원본 ADR**: `MOD-GRID-REFACTOR-2026-05-17-decisions.md` ADR-MOD-GRID-REFACTOR-2026-05-17-018
**원본 spec**: `.claude/tw-grid/findings/wave4-adr-018-spec.md`
**채택 조합**: I-A + X-A1 + X-B + A-A + S-A (spec 권고 조합 전체 채택)

---

## 변경 요약

| 영역 | 변경 |
|------|------|
| **grid-core types.ts** | `TomisColumnType` union +2 (`'tag'` | `'progress'`). 9 → 11 멤버. JSDoc 갱신 (`9종` → `11종`). |
| **grid-core rendererRegistry.ts** | `defaultRendererRegistry` Map 에 `'tag'` / `'progress'` placeholder 2 entry 추가. JSDoc 갱신 (6→8 wired, 9→11 placeholder). |
| **grid-renderers wireRegistry.ts** | +2 import (TagCell / ProgressCell). +2 adapter (tag / progress). 상단 주석 `Wired slots (6)` → `(8)` 갱신. NOT wired 절 정비 (5 extras 문구 → button/avatar/aliases 분리). JSDoc 갱신. |
| **grid-renderers README.md** | "Action / Avatar Column Pattern (ADR-018 X-B)" 섹션 신규 추가 (button/avatar column.cell 패턴). |
| **.size-limit.json** | grid-renderers `"limit"` `"10 KB"` → `"12 KB"` (ADR-018 S-A). |
| **grid-core CHANGELOG.md** | Unreleased ADR-018 entry (minor — union 확장 + placeholder). |
| **grid-renderers CHANGELOG.md** | 0.3.0 ADR-018 entry (minor — 2 wired slots + README + size-limit). |
| **.changeset/adr-018-tag-progress-wiring.md** | NEW — grid-core minor + grid-renderers minor. |
| **ADR-018 본문** | 상태 `accepted → implemented`. 결과 체크박스 12건 mark. Implementation Note 추가. |

---

## 변경 파일 목록

| 파일 | 변경 유형 |
|------|----------|
| `packages/grid-core/src/column/types.ts` | MODIFIED (+3 lines — 2 union 멤버 + JSDoc) |
| `packages/grid-core/src/column/rendererRegistry.ts` | MODIFIED (+5 lines — 2 placeholder entry + JSDoc 갱신) |
| `packages/grid-renderers/src/wireRegistry.ts` | MODIFIED (+30 lines — 2 import + 2 adapter + comment 갱신) |
| `packages/grid-renderers/README.md` | MODIFIED (+35 lines — X-B 가이드 섹션) |
| `.size-limit.json` | MODIFIED (1 line — 10 KB → 12 KB) |
| `packages/grid-core/CHANGELOG.md` | MODIFIED (+10 lines — ADR-018 Unreleased entry) |
| `packages/grid-renderers/CHANGELOG.md` | MODIFIED (+20 lines — 0.3.0 ADR-018 entry) |
| `.changeset/adr-018-tag-progress-wiring.md` | NEW |
| `.claude/tw-grid/decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md` | MODIFIED (ADR-018 status flip + checkbox mark + Implementation Note) |

순 LOC 추가: ~100 (대부분 adapter 25 + README 35 + CHANGELOG 30 + changeset 10).

---

## probe 결과

```powershell
# 재현 절차 (spec §3.1+§3.2 코드 기준):
# 1. packages/grid-renderers/src/__probe__/adr-018-extras.probe.ts 생성
# 2. packages/grid-renderers/tsconfig.probe.json 생성
cd D:/project/topvel_project/topvel-grid-monorepo/packages/grid-renderers
npx tsc --noEmit -p tsconfig.probe.json
# EXIT=0  (errors: 0)
# 3. probe 파일 + tsconfig.probe.json 즉시 삭제
```

**결과: PASS (EXIT=0)** — tag/progress adaptValueCell 패턴 컴파일 통과. F-A1/F-A2/F-B1/F-B2/F-B3/F-B4 모두 spec §3.4 그대로 재현됨.

---

## 검증 결과

### pnpm -r typecheck

**14 packages PASS** (grid-core / grid-renderers / grid / grid-license / grid-export / grid-features / grid-pro-agg / grid-pro-datamap / grid-pro-header / grid-pro-master / grid-pro-merging / grid-pro-range / grid-pro-tracking + apps/docs 자체 typecheck 제외).

EXIT=0.

> 참고: grid-renderers 의 `@tomis/grid-core` 타입은 `packages/grid-core/dist/index.d.ts` 를 경유. typecheck 전 `pnpm --filter "@tomis/grid-core" build` 로 dist 재생성 필요 (dist 가 stale 하면 TS2345 발생).

### pnpm --filter "./packages/*" build

**13 packages PASS** (모든 grid 패키지).

EXIT=0.

- `apps/docs` 는 pre-existing docusaurus customCss validation 이슈로 제외 (본 ADR 무관).

### pnpm size-limit

```
@tomis/grid-core      Size:  9 kB    / 30 kB limit  ✔
@tomis/grid-renderers Size:  9.07 kB / 12 kB limit  ✔  (여유 ~2.9 KB)
... (other 10 packages 모두 PASS)
```

EXIT=0. grid-renderers **9.07 kB / 12 kB** — 여유 ~2.9 KB (POL-BUNDLE §1 sub-clause ≥20% = 9.6 KB 기준 충족).

### grep registerRenderer 8 hits 확인

```powershell
grep -c "registerRenderer(" packages/grid-renderers/src/wireRegistry.ts
# → 8 hits (text/number/date/dateTime/badge/link/tag/progress)
```

**결과: 8** ✔

---

## 결과 체크리스트

- [x] D-1 icon placeholder 유지 (변경 0)
- [x] D-2 tag/progress union 확장 + wireRegistry adapter 2건
- [x] D-3 button/avatar README column.cell 가이드 추가 (X-B)
- [x] D-4 alias status quo (변경 0)
- [x] D-5 size-limit 12 KB 상향 + 실측 9.07 kB PASS
- [x] defaultRendererRegistry placeholder +2 (spec §5 Step 2 — task brief 누락분)
- [x] CHANGELOG grid-core (Unreleased ADR-018 minor)
- [x] CHANGELOG grid-renderers (0.3.0 ADR-018 minor)
- [x] Changeset adr-018-tag-progress-wiring.md (grid-core minor + grid-renderers minor)
- [x] ADR-018 본문 상태 accepted → implemented
- [x] probe PASS (EXIT=0)
- [x] typecheck 14 packages PASS
- [x] build 13 packages PASS
- [ ] (선택) Storybook 시각 검증 — MOD-GRID-99-B 부트스트랩 후

---

## Spec divergence (task brief vs spec)

| 항목 | task brief | spec §5 Step 2 | 적용 |
|------|-----------|---------------|------|
| defaultRendererRegistry placeholder | 누락 (Step 0→1→2→3 에서 건너뜀) | 명시 필수 (spec checklist 13개 중 2번째) | **spec 기준 적용** — graceful-fallback 대칭 유지 |
| wireRegistry 함수명 | `coreRegister(...)` (오탈) | `registerRenderer(...)` (실제 함수명) | 실제 함수명 사용 |
| size-limit path format | 배열 (`["...{mjs,cjs}"]`) | 단일 문자열 (`"...index.mjs"`) | 기존 파일 형식 유지 |

---

## 알려진 한계

1. **단위 테스트 부재**: `wireRegistry.test.ts` 8 슬롯 lookup 검증 — ADR-002 follow-up 과 묶어 처리 권고.
2. **Storybook 시각 검증**: MOD-GRID-99-B 부트스트랩 후 가능 (현 storybook 미부트).
3. **D-1B (icon meta-경유) 향후 ADR**: 사용자가 `type:'icon'` zero-config 요구 시 별도 ADR 신설.
4. **D-3 X-B button/avatar boilerplate**: 사용자가 `column.cell` 에 직접 `<ButtonCell onClick={...} />` 작성 필요. README 예시 추가로 안내.
5. **dist stale typecheck 주의**: grid-renderers 의 `@tomis/grid-core` 타입 해석이 dist 기반이므로, grid-core 소스 변경 후 typecheck 실행 전 반드시 `pnpm --filter "@tomis/grid-core" build` 선행 필요.
