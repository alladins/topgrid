# B-1 ID-LEDGER backfill 결과

**작업일**: 2026-05-18  
**작업자**: Claude Sonnet 4.6  
**입력 문서**: state.json (79 Goal), canonical-modules.json (20 모듈), ID-LEDGER.md (기존 196 lines)

---

## 변경 요약

| 항목 | 변경 내용 |
|------|---------|
| ID-LEDGER.md 범위 갱신 | line 4~5: Goal ID G-NNN 추가 (backfill snapshot, state.json live 권위 명시) |
| Section 1.1 갱신 | Goal 신설 전 조회 의무 추가 (lastIssued + 1, withdrawn 슬롯 재사용 금지) |
| Section 1.4 갱신 | Goal G-NNN backfill cross-harness 권고 추가 |
| Section 6 갱신 | Spec Writer + Self-Review 에 Goal 관련 의무 추가 |
| **Section 7 신설** | Goal G-NNN Inventory (B-1 backfill) — 20 모듈 × Goal 목록 + lastIssued |
| Section 8 (구 Section 7) | 참조 — Goal state.json 참조 추가 |

---

## 모듈별 Goal 수치

| 모듈 | Goal 수 | lastIssued | area |
|------|---------|-----------|------|
| MOD-GRID-00 | 4 | G-004 | monorepo |
| MOD-GRID-01 | 5 | G-005 | wrapper |
| MOD-GRID-02 | 6 | G-006 | state |
| MOD-GRID-03 | 3 | G-003 | pagination |
| MOD-GRID-04 | 3 | G-003 | column |
| MOD-GRID-05 | 3 | G-003 | renderer |
| MOD-GRID-06 | 5 | G-005 | export |
| MOD-GRID-07 | 2 | G-002 | column-drag |
| MOD-GRID-08 | 2 | G-002 | multi-sort |
| MOD-GRID-09 | 4 | G-004 | filter-ui |
| MOD-GRID-10 | 5 | G-005 | tracking |
| MOD-GRID-11 | 6 | G-006 | range |
| MOD-GRID-12 | 4 | G-004 | datamap |
| MOD-GRID-13 | 3 | G-003 | merging |
| MOD-GRID-14 | 3 | G-003 | header |
| MOD-GRID-15 | 4 | G-004 | aggregation |
| MOD-GRID-16 | 3 | G-003 | enhancement |
| MOD-GRID-17 | 6 | G-006 | migration |
| MOD-GRID-99-A | 3 | G-003 | license |
| MOD-GRID-99-B | 5 | G-005 | docs |
| **합계** | **79** | | |

**모듈 수**: 20 (canonical-modules.json `totals.modules` = 20; 99-A + 99-B 이미 포함. 작업 지시의 "22" = 잘못된 산술 → 실제 20으로 보고).

---

## 결번/withdrawn 명시

**결번/withdrawn/skipped: 0건.**

state.json `goalsIndex` 전체 79 항목 검토 결과:
- 모든 항목 `overallStatus: "completed"`
- 모든 모듈에서 G-001 ~ G-NNN 연속 (gap 없음)
- 상태 분포 컬럼은 noise 유발 → Section 7 에서 생략, 헤더 note (`전 모듈 전 Goal completed`)로 대체 (advisor 권고 반영)

---

## 결과 체크리스트

- [x] state.json 79 Goal 인벤토리 확인 (모듈별 정확 계수)
- [x] ID-LEDGER.md 범위 갱신 (line 4~5 — Goal ID 추가, state.json live 권위 명시)
- [x] Section 1.1 Goal 신설 전 조회 의무 추가
- [x] Section 1.4 Goal backfill cross-harness 권고 추가
- [x] Section 6 작성 의무 매트릭스 Goal 관련 의무 추가
- [x] Section 7 신설 (Goal G-NNN Inventory, B-1 backfill)
- [x] 신규 Goal 정책 명시 (lastIssued + 1, 슬롯 재사용 금지, state.json 동기 갱신)
- [x] Section 8 (구 Section 7 참조) — state.json 참조 추가
- [x] 결번/withdrawn = 0건 명시
- [x] cross-harness 권고 (tw-mail / tw-harness) 별도 cycle — Section 1.4 기존 항목에 병합 (advisor 권고: 별도 신설 아닌 기존 항목 확장)
- [x] git commit 자동 실행 없음

---

## advisor 활용

advisor 호출 1회 (작업 전). 주요 수정 사항 반영:

1. **범위 conflict 해소**: 기존 line 6 "Goal ID 범위 외" → "state.json live 권위 + Section 7 backfill snapshot" 으로 명확 분리.
2. **모듈 수 정정**: 작업 지시의 "20 모듈 + 99-A + 99-B = 22" 는 잘못된 산술. canonical-modules.json `totals.modules = 20` (99-A/99-B 이미 포함) → 20으로 보고.
3. **상태 분포 컬럼 생략**: 전 79 Goal completed — per-module 상태 컬럼은 noise. 헤더 note로 대체.
4. **Section 배치**: 기존 Section 7 (참조) 앞에 신규 Section 7 삽입 → 구 Section 7 을 Section 8으로 renumber. 최소 ripple.
5. **cross-harness 권고**: 기존 Section 1.4에 Goal backfill 한 줄 추가 (별도 섹션 신설 대신).

---

## 파일 위치

- **변경 파일**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/ID-LEDGER.md`
  - Section 7 신설: (구 Section 7 참조 앞)
  - 총 line 수: 변경 전 196 lines → 변경 후 ~490 lines
- **본 보고서**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/findings/b-1-ledger-backfill-result.md`
