# MOD-GRID-06 아키텍처 결정 기록 (ADR)

---

## ADR-MOD-GRID-06-001: Excel export 라이브러리 선택 — xlsx (SheetJS CE)

**상태**: 확정 (2026-05-14)
**Goal**: MOD-GRID-06 / G-001
**작성자**: Implementer Agent (이관됨 — 원본 위치: topvel-grid-monorepo/decisions/, 정규 위치로 이동)

### 결정

`packages/grid-export` 패키지의 Excel export 구현에 **xlsx (SheetJS Community Edition) `^0.18.5`** 를 peerDependency로 채택한다.

### 사유

1. `tw-framework-front/package.json` L42 에 `"xlsx": "^0.18.5"` 가 이미 직접 의존성으로 선언되어 있음 — consumer 가 추가 설치 없이 peerDep 충족 가능.
2. `aoa_to_sheet` + `ws['!merges']` API 로 다중행 헤더(GroupColumnDef) merge cells 구현 가능 — AC-003 충족.
3. 브라우저 `writeFile` 동기 다운로드 지원 — D3 결정(void 반환 타입) 과 일치.
4. UTF-8 기본 지원 — AC-004 한국어 헤더 정상 출력.
5. Apache-2.0 라이선스 — MIT/Apache 2.0 도입 정책(C-9) 충족.

### 대안 비교

| 라이브러리 | 라이선스 | 번들 영향 | 다중헤더 | 선택 여부 |
|-----------|--------|---------|---------|--------|
| **xlsx ^0.18.5** (SheetJS CE) | Apache-2.0 | peer (0 KB 추가) | `!merges` 수동 처리 | ✅ 선택 |
| exceljs ^4 | MIT | ~280 KB (gzip) | `merges` API 지원 | ❌ 번들 과대, consumer 미보유 |
| sheetjs-ce (fork) | Apache-2.0 | peer | `!merges` 동일 | ❌ xlsx 와 동일 코어, 중복 |
| 순수 CSV (no dep) | N/A | 0 KB | 불가 | ❌ AC-003 미충족 |

### Trade-off

**Trade-off 1 (선택)**: xlsx CE는 `optional: false` peer이므로 consumer 가 반드시 xlsx를 설치해야 한다.
→ 단, tw-framework-front 에 이미 존재하므로 현 사용처에서는 실질적 부담 없음.
→ 미래 신규 consumer 는 xlsx 의존성 추가 필요 — peerDependenciesMeta 로 명시.

**Trade-off 2 (선택)**: xlsx CE는 `writeFile` 이 동기(synchronous) — 대용량 데이터 시 메인 스레드 블로킹 가능.
→ 현 G-001 범위는 동기 구현만. 비동기(Web Worker) 확장은 향후 G-XXX 에서 처리 가능 구조로 분리 설계.

### peerDependenciesMeta 변경

기존 `grid-export/package.json` 의 `peerDependenciesMeta.xlsx.optional: true` 를 `false` 로 변경.
이유: G-001 부터 `exportToExcel` 이 xlsx 없이는 동작 불가 → optional 아님.

### 번들 영향

- `grid-export` 자체 번들: +5 KB 이내 (gzipped) — xlsx 는 peer이므로 미포함.
- `tw-framework-front`: xlsx 이미 포함 → 번들 변화 없음.

### 라이선스 확인

xlsx@0.18.5: Apache-2.0 (npmjs.com 확인) — C-9 MIT/Apache 2.0만 허용 정책 충족.

---

*이 파일은 MOD-GRID-06 관련 모든 ADR 을 누적 기록한다.*

---

## ADR-MOD-GRID-06-002: PDF export 라이브러리 선택 — jspdf + jspdf-autotable optional peer

**상태**: 확정 (2026-05-14)
**Goal**: MOD-GRID-06 / G-003
**작성자**: Implementer (C-20 의무 — spec Section 13 초안 기반)

### 결정

`packages/grid-export` 패키지의 PDF export 구현에 **jspdf `^2.5.0`** + **jspdf-autotable `^3.5.0`** 을 optional peerDependency로 채택한다.

### 사유

1. `packages/grid-export/package.json` peerDependencies에 jspdf + jspdf-autotable이 이미 optional peer로 선언되어 있음 (G-001 scaffolding 시 pre-declared) — package.json 수정 불필요.
2. jspdf-autotable은 `head: string[][]` 구조로 TanStack `table.getHeaderGroups()` 다중행 헤더 직접 매핑 가능 — AC-005 충족.
3. Dynamic import 지원 → 미설치 consumer에게 번들 영향 0 (optional peer 채택 정당성).
4. jspdf MIT + jspdf-autotable MIT — C-9 라이선스 정책 충족.
5. tw-framework-front에 jspdf 미설치 확인 (Grep 결과 0) — consumer opt-in 방식 적합.

### 대안 비교

| 라이브러리 | 라이선스 | 번들 영향 | 한국어 폰트 | 테이블 지원 | 선택 여부 |
|-----------|--------|---------|-----------|-----------|--------|
| **jspdf ^2 + jspdf-autotable ^3** | MIT + MIT | optional peer (0 KB) | dynamic import stub | autoTable API | ✅ 선택 |
| pdfmake ^0.2 | MIT | ~300 KB (gzip) | vfs_fonts.js embed 필요 | 자체 docDefinition | ❌ 번들 과대, consumer 미보유 |
| html2pdf.js | MIT | ~600 KB | CSS 기반 (자동) | DOM 캡처 방식 | ❌ SSR 불가, DOM 의존성 |
| puppeteer | Apache-2.0 | Node.js 전용 | 시스템 폰트 | headless Chrome | ❌ 브라우저 환경 불가 |
| 브라우저 Print API | N/A | 0 KB | CSS @font-face | CSS 스타일링 | ❌ 다운로드 제어 불가 |

### Trade-off

**Trade-off 1 (선택)**: jspdf + autotable은 optional peer이므로 consumer가 별도 설치해야 함.
→ tw-framework-front에 미설치. 통합 시 `npm install jspdf jspdf-autotable` 필요.
→ JSDoc @example + consumer 가이드(V3)로 완화.

**Trade-off 2 (선택)**: 한국어 폰트는 base64 embed가 필요하나 번들 증가(~2 MB) 리스크 존재.
→ `loadKoreanFont.ts` stub 유지 + W1 리스크 문서화. 폰트 라이선스(OFL 1.1) 확인 후 V1로 구현.

**Trade-off 3 (선택)**: `jspdf-autotable` TypeScript 타입이 prototype 확장 방식이라 `@ts-expect-error` 1건 필요 (AC-006).
→ `@types/jspdf-autotable` 패키지가 없음. jspdf-autotable 자체 `dist/index.d.ts`는 `any` 기반 stub — module augmentation 미제공.
→ `@ts-expect-error jspdf-autotable extends jsPDF prototype at runtime` 주석으로 명시. AC-006 충족 유지.

### peerDependenciesMeta 현 상태

```json
"peerDependenciesMeta": {
  "jspdf": { "optional": true },
  "jspdf-autotable": { "optional": true }
}
```
→ **수정 불필요** — G-001 scaffolding 시 이미 선언됨 (D2).

### 번들 영향

- `grid-export` 자체 번들: +3.5 KB 이내 (gzipped) — jspdf는 peer이므로 미포함.
- `tw-framework-front`: jspdf 미설치 상태 → consumer opt-in 설치 시 +200 KB(gzip) 추가.

### 라이선스 확인

- `jspdf@2.x`: MIT (jspdf/types/index.d.ts 헤더 MIT 명시 확인)
- `jspdf-autotable@3.x`: MIT (LICENSE.txt 확인)
- C-9 정책 충족: MIT / Apache-2.0만 허용.

---

*이 파일은 MOD-GRID-06 관련 모든 ADR 을 누적 기록한다 (ADR-001 Excel, ADR-002 PDF).*
