# ADR-006 실행 결과 — TomisColumnDef rename + deprecation alias

**실행일**: 2026-05-17
**Wave**: 2 (옵션 B: deprecation alias)
**상태**: completed

## 사용처 인벤토리

| 위치 | 건수 | 분류 |
|------|------|------|
| 패키지 내부 (`packages/grid-pro-datamap/src/`) | 4건 | production |
| 타 패키지 (monorepo 내) | 0건 | — |
| tw-framework-front | 0건 | — |
| stories | 0건 (`DataMap.stories.tsx` 는 DataMapCell/createDataMap만 import) | — |

내부 4건 모두 `DataMapCell.tsx`: import 선언, `@param` JSDoc, `@doc` JSDoc, `as` cast. 모두 `DataMapColumnDef` 로 갱신 완료.

## ADR-MOD-GRID-12 rationale 비교

MOD-GRID-12 ADR-002 는 intersection 패턴 (`ColumnDef & { dataMap?; selectOptions? }`) 채택 + 이름 `TomisColumnDef` 유지를 결정했다. 해당 결정은 **shape 선택** (intersection vs 독립 타입) 이 핵심이었으며, rename 을 검토하지 않았다. 본 ADR-006 의 rename 근거는 **cross-package name collision** (grid-core 의 동명 custom-shape 타입과 충돌) 해소로, ADR-002 와 독립적이며 상충하지 않는다.

## 변경 파일

| 파일 | 변경 |
|------|------|
| `packages/grid-pro-datamap/src/types.ts` | `DataMapColumnDef<TData>` primary 정의 추가; `TomisColumnDef<TData>` = `DataMapColumnDef<TData>` deprecation alias; 구 standalone 정의 제거 |
| `packages/grid-pro-datamap/src/DataMapCell.tsx` | import + JSDoc 2건 + as cast — `TomisColumnDef` → `DataMapColumnDef` 4건 갱신 |
| `packages/grid-pro-datamap/src/index.ts` | `DataMapColumnDef` primary export 추가; `TomisColumnDef` 별도 deprecated re-export 분리 |
| `packages/grid-pro-datamap/CHANGELOG.md` | `## 0.2.0` 항목 추가 (Added / Deprecated / BREAKING 예고) |
| `.changeset/adr-006-tomis-column-def-rename.md` | `minor` changeset 생성 |
| `.claude/tw-grid/decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md` | ADR-006 Implementation Note 추가; 결과 체크리스트 갱신 |

## 검증 결과

| 검증 | 결과 |
|------|------|
| `pnpm -F @tomis/grid-pro-datamap typecheck` | PASS (0 errors) |
| `pnpm -r typecheck` (14 패키지) | PASS (0 errors) |
| `pnpm -F @tomis/grid-pro-datamap build` | PASS (dist 재생성) |
| `grep DataMapColumnDef packages/grid-pro-datamap/src/` | 정의 (types.ts) + 내부 사용처 (DataMapCell.tsx × 4) + index.ts re-export |
| `grep TomisColumnDef packages/grid-pro-datamap/src/` | 2 hits: alias 정의 (types.ts:66) + re-export (index.ts:8) — 의도된 값 |

## 결과 체크리스트

- [x] `grid-pro-datamap` `DataMapColumnDef` primary export
- [x] `TomisColumnDef` deprecation alias 유지 (types.ts + index.ts)
- [x] CHANGELOG.md MINOR (`## 0.2.0`) + BREAKING 예고
- [x] Changeset minor (`.changeset/adr-006-tomis-column-def-rename.md`)
- [x] `pnpm -r typecheck` PASS (0 errors, 14 packages)
- [x] `pnpm -F @tomis/grid-pro-datamap build` PASS

## 알려진 한계

1. **CHANGELOG vs changeset 이중 기록**: CHANGELOG `## 0.2.0` 수동 작성 + changeset 둘 다 존재. `changeset version` 실행 시 changeset 이 새 항목을 prepend — 릴리즈 시 수동 정리 필요.
2. **package.json 버전 미변경**: `private: true` 패키지이므로 changeset 이 `changeset version` 시 자동 bump. 수동으로 `0.1.0 → 0.2.0` 변경하지 않음.
3. **dist 갱신**: `pnpm -F @tomis/grid-pro-datamap build` 실행으로 `dist/index.d.ts` 에 `DataMapColumnDef` + `TomisColumnDef` 모두 포함됨. 단, dist 는 git-ignore 권장 대상. 릴리즈 빌드는 별도 CI 에서 fresh build.
