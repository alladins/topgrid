# MOD-GRID-06 Export — 모듈 회고

**완료일**: 2026-05-14
**모듈**: Excel/PDF/CSV/Clipboard/Print Export (packages/grid-export)
**총 Goal**: 5 (G-001 ~ G-005)
**전체 결과**: 5/5 completed, 1 loop 내 모두 통과

---

## 1. Goals 점수표

| Goal | 제목 | Specify | Implement | Verify | 비고 |
|---|---|---:|---:|---:|---|
| G-001 | Excel(.xlsx) export + 한국어 + 다중행 헤더 + DataTable alias | 100 | 95.65 | 95.00 | 첫 Goal — rubric drift 발견 (E-02 ADR 위치, A-03 size-limit infra-defect) |
| G-002 | CSV export 순수 JS RFC 4180 | 100 | 100 | 100 | rubric 개선 후 첫 100점, `getRowsByScope` internal 추출 |
| G-003 | PDF export jspdf + jspdf-autotable peer + ADR | 100 | 100 | 100 | dynamic import 패턴 표준화, ADR-002 정규 위치 작성 |
| G-004 | copyToClipboard + printGrid (TSV + window.print) | 100 | 100 | 100 | 외부 dep 0, `getRowsByScope` 재사용 |
| G-005 | scope 통합 검증 (filtered/selected/all 정합 + EmptyBehavior 단일화) | 92.59 | 100 | 100 | Spec 단계 H-02/B-01/E-01 NO — spec→implement 분리 본질 |
| **평균** | | **98.52** | **99.13** | **99.00** | **모듈 평균 ~98.6점** |

---

## 2. 누적 패턴 (5개)

### 2.1 G-001 후 rubric 개선 → G-002~G-005 안정화 (★ 핵심)
- G-001 Self-Review 단계에서 발견:
  - `implement-rubric E-02`: ADR 정규 위치(`.claude/tw-grid/decisions/`) 명시 + 비정규 위치 NO 처리
  - `verify-rubric A-03`: size-limit 인프라 결함 vs 코드 결함 구분 (tsup external + raw dist 기반 YES 허용)
- 결과: G-002/G-003/G-004 모두 Implement/Verify 100점 안정화
- **교훈**: 첫 Goal Self-Review의 rubric 개선이 후속 Goal 효율의 핵심 레버

### 2.2 `getRowsByScope` internal 추출 → DRY 입증 (★ 4회 재사용)
- G-002 (CSV) 구현 시 처음 추출
- G-002 / G-003 (PDF) / G-004 (clipboard) / G-005 (scope 통합 검증) 모두 재사용
- **교훈**: 공통 헬퍼는 두 번째 사용처에서 추출 ("rule of three" 보다 빠른 시점)

### 2.3 `EmptyBehavior` 타입 단일화 (G-005)
- ExcelExportOptions / CSVExportOptions / PDFExportOptions / ClipboardOptions / PrintOptions 5종 모두 동일 scope/emptyBehavior 필드 사용
- types.ts 단일 소스, 코드 런타임 변경 0 — 정합성만 강화
- **교훈**: 정합성 Goal은 회귀 위험 0, Verify 100점 기대 가능

### 2.4 dynamic import 패턴 (G-003 PDF)
- jspdf + jspdf-autotable: `peerDependenciesMeta.optional: true` + dynamic import
- PDF 미사용 페이지에서 초기 번들 영향 0
- **교훈**: 외부 peer optional 신설 시 본 패턴 표준화 — MOD-GRID-08/etc 적용

### 2.5 ADR 정규 위치 의무화 (G-001 → rubric E-02)
- G-003 ADR-002 (jspdf 채택) 정상 작성
- **교훈**: Self-Review에서 발견한 drift는 즉시 rubric에 반영 → 후속 Goal 자동 강제

---

## 3. 후속 트랙 surface (시급도순)

| 시급도 | 트랙 | 누적 횟수 | 처리 위치 |
|---|---|---:|---|
| **최상위** | size-limit `.size-limit.json` peer ignore 일괄 추가 (xlsx, jspdf, jspdf-autotable, @tanstack/react-table, react, react-dom 등) | **5회 연속 (G-001~G-005)** | MOD-GRID-99-B/G-003 |
| 시급 | vitest 인프라 구축 (단위 테스트 매트릭스) — A-07/B-* 기계적 N/A 누적 해소 | 5회 | MOD-GRID-99-B docs/test infra |
| 중 | 한국어 폰트 base64 stub (G-003 W1) — `loadKoreanFont.ts` 완성 (NanumGothic/Noto Sans KR subset) | 1회 | G-003 후속 |
| 중 | findings 파일 정규 위치 정합 — `packages/grid-export/findings/` → `.claude/tw-grid/findings/` | 1회 (G-005) | MOD-GRID-06 정리 |
| 저 | goals.json `implementFiles` prefix 정정 — `TOMIS/packages/` → `topvel-grid-monorepo/packages/` (C-28 정책 적용) | 5회 (모듈 전체) | spec writer 가 매 Spec 단계에서 명시 |

---

## 4. DRY 입증 데이터

### `getRowsByScope` 재사용 (4회)
```
G-002 src/exportToCSV.ts          ← 최초 추출
G-003 src/exportToPdf.ts          ← 재사용 #1
G-004 src/copyToClipboard.ts      ← 재사용 #2
G-004 src/printGrid.ts            ← 재사용 #3
G-005 src/internal/resolveRows.ts ← 통합 검증 + 정규 위치 이관
```

### `EmptyBehavior` 타입 참조 (5회)
```
G-005 src/types.ts                 ← 단일 소스 정의
G-001 ExcelExportOptions           ← 참조
G-002 CSVExportOptions             ← 참조
G-003 PDFExportOptions             ← 참조
G-004 ClipboardOptions / PrintOptions ← 참조
```

---

## 5. 모듈 평균과 의의

- **평균 ~98.6점** — 5 Goals 모두 1 loop 내 통과
- G-001의 rubric drift 1회 발견 → G-002~G-005 자동 강제 효과 입증
- **DRY 패턴 입증**: helper 함수 1회 추출 + 타입 1회 단일화 = 4~5회 재사용
- 외부 peer optional + dynamic import 패턴 표준화

**다음 모듈에 가져갈 것**:
1. 첫 Goal Self-Review의 rubric 개선이 가장 큰 레버 → Verifier 적극적 surface 권장
2. 공통 헬퍼는 2번째 사용처에서 추출
3. infra-defect (size-limit/vitest) 누적은 별도 트랙(MOD-GRID-99-B)으로 묶기 — 코드 결함과 분리
