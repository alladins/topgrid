# CONSTRAINTS INDEX

> implement(§3.3)가 준수, verify 가 점검. 형식: `ID | 규칙 | 검증법 | 출처`

| ID | 규칙 | 검증법 | 출처 |
|----|------|--------|------|
| C-001 | optional peer 를 정적 top-level import 금지 — 동적 import 또는 required 선언 | AP-001 탐지 grep | G-vimport(×2) 승격 |
| C-002 | alias/재export 는 형제와 일관되게 `@deprecated` JSDoc 동반 | AP-002 탐지 | G3/G4 승격 |
| C-003 | 주석·README·JSDoc 은 코드와 동기 — 하드코딩 카운트·stale 시그니처 금지 | AP-003/004 탐지 | G1/G2/G-readme/jsdoc 승격 |
| POL-TANSTACK | TanStack Table/Virtual 네이티브 위에 **선언형**으로 구축 — AG Grid/Wijmo 등 외부 그리드 엔진 직접 도입 금지. 명령형 DOM 조작 대신 컬럼 정의·콜백·className | 의존성 + import 검토 | tw-grid POL 추출 + competitive-analysis §5.2 |

(seed: 2026-06 gap 승격 + tw-grid 정책)
