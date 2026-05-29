# ADR-005 실행 결과 — grid-export entry 2개 + tw-front 마이그레이션

**실행일**: 2026-05-17
**Wave**: 2 (옵션 A 조합 E-1 + F-1 + C-1 + M-2)
**상태**: completed

---

## 변경 요약

- `exportRowsToExcel(rows, columns, options?)` 신 entry 추가 — `@tomis/grid-export`
- `ExcelColumn`, `ExportRowsOptions` 타입 추가 — `src/types.ts`
- `columnsToExcel` 삭제 — tw-front util 파일과 함께 자연 소멸 (C-1)
- `BscEval01ListPage.tsx` 호출자 변경 (import + call site, M-2 + F-1)
- tw-front `excelExport.ts` 67 LOC 삭제 (M-2)
- tsconfig.app.json paths 에 `@tomis/grid-export` 추가 (Step 0)

---

## 변경 파일 목록

| 파일 | 변경 종류 |
|------|---------|
| `topvel-grid-monorepo/packages/grid-export/src/exportRowsToExcel.ts` | 신규 (약 80 LOC) |
| `topvel-grid-monorepo/packages/grid-export/src/types.ts` | 추가 (+42 LOC — ExcelColumn + ExportRowsOptions) |
| `topvel-grid-monorepo/packages/grid-export/src/index.ts` | 추가 (3줄 — exportRowsToExcel + 2 type exports) |
| `topvel-grid-monorepo/packages/grid-export/CHANGELOG.md` | 추가 (0.2.0 entry) |
| `topvel-grid-monorepo/packages/grid-export/README.md` | 추가 (exportRowsToExcel 사용 예제 + API 표) |
| `topvel-grid-monorepo/.changeset/adr-005-grid-export-entry.md` | 신규 (minor changeset) |
| `tw-framework-front/tsconfig.app.json` | 추가 (@tomis/grid-export path alias 2줄) |
| `tw-framework-front/src/pages/tomis/bsc/BscEval01ListPage.tsx` | 변경 (import line:10 + call line:200) |
| `tw-framework-front/src/utils/tomis/excelExport.ts` | **삭제** (67 LOC) |

---

## 거동 패리티 (spec §3 B1/B2/B3)

| # | 거동 | 구현 상태 | 비고 |
|---|------|---------|-----|
| B1 | 컬럼 width (`ws['!cols']`) | **구현 완료** | `columns.map(c => ({ wch: c.width ?? 15 }))` — 원본과 동일 |
| B2 | 헤더 styling (굵게 + 회색 fill) | **구현 완료** | `{ font: { bold: true }, fill: { fgColor: { rgb: 'F3F4F6' } } }` — 원본과 동일. xlsx community edition 한계 상속. |
| B3 | `formatValue` (date/datetime/number/currency) | **구현 완료** | ko-KR locale + NaN guard — 원본과 동일 로직 이식 |
| B4 | empty-row 동작 | **구현 완료** | 원본 = 항상 파일 생성. 신 함수 기본값 `emptyBehavior: 'skip'`. 호출자에 `emptyBehavior: 'empty'` 명시하여 원본 패리티 보존. |

**주의**: B4 는 spec §3 의 공식 패리티 항목이 아니었으나 advisor 검토 후 명시. 호출자에 `emptyBehavior: 'empty'` 추가하여 silent behavior change 방지.

---

## 검증 결과

| 항목 | 결과 |
|------|-----|
| typecheck (grid-export) | **PASS** — `npx tsc --noEmit` 0 errors |
| typecheck (tw-front) | **PASS** (ADR-005 범위 내 0 errors) — `PayReal01EditModal.tsx` JSDoc 구문 오류 7건은 기존 pre-existing (untracked file, ADR-005 무관) |
| build (grid-export) | **PASS** — `pnpm build` success. index.cjs 13.45 KB / index.mjs 12.72 KB (size-limit 20KB 이내) |
| grep `columnsToExcel` in packages/ | **0 hits** (CHANGELOG 제외 시 0) |
| grep `columnsToExcel` in tw-front/src | **0 hits** |
| grep `exportRowsToExcel` in BscEval01ListPage | **1 hit** (line:10 import + line:200 call) |
| grep `excelExport` in tw-front/src | **0 hits** (파일 삭제 확인) |
| grep `@tomis/grid-export` in tw-front/src | **≥ 1 hit** (ADR 결과 체크리스트 충족) |

---

## 결과 체크리스트

- [x] tsconfig path 정합 (tw-front tsconfig.app.json) — @tomis/grid-export + @tomis/grid-export/* 추가
- [x] exportRowsToExcel 신 entry 추가 (packages/grid-export/src/exportRowsToExcel.ts)
- [x] ExcelColumn type export (src/types.ts + index.ts)
- [x] ExportRowsOptions type export (src/types.ts + index.ts)
- [x] columnsToExcel 삭제 (C-1 — tw-front util 파일 삭제로 자연 소멸)
- [x] BscEval01ListPage 호출자 변경 (import + call, F-1 options 객체)
- [x] tw-front excelExport.ts 67 LOC 삭제 (M-2)
- [x] CHANGELOG 0.2.0 entry
- [x] Changeset minor (.changeset/adr-005-grid-export-entry.md)
- [x] README 사용 예제 + API 표 업데이트
- [x] ADR-005 본문 상태 갱신 (implemented 2026-05-17 + 결과 체크리스트 check)
- [ ] 수동 시각 검증 (BscEval01ListPage Excel 다운로드 B1/B2/B3 패리티) — 서버 부팅 + 브라우저 수동 확인 필요

---

## 알려진 한계

1. **수동 시각 검증 미수행** — B1/B2/B3 거동 패리티 실증 한계. 다음 cycle 또는 Storybook 부트스트랩 후 수행 권고.
2. **단위 테스트 부재** — grid-export test 스크립트 = `echo TODO`. B1/B2/B3 자동 회귀 보호 없음. 후속 cycle vitest 인프라 추가 필요.
3. **xlsx 직접 사용 4건 (out of scope)** — `DailyMonthlyReportPage`, `FinAcno01InterestPage`, `FinAcno01LedgerPage`, `EmployeeRosterPage` 는 본 ADR 범위 외. 별도 마이그레이션 cycle 후보.
4. **xlsx community edition styling 한계** — B2 헤더 styling 은 xlsx community edition 에서 부분 동작 가능성. 원본 util 도 동일 한계 공유 (excelExport.ts:42 주석 인용).
5. **pre-existing typecheck error** — `PayReal01EditModal.tsx` 7건 JSDoc 구문 오류 (ADR-005 무관, untracked file).
