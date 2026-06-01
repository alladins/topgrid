# ANTI-PATTERNS INDEX

> verify(§3.4)가 이 표만 읽고, 각 행의 **탐지 grep** 을 신규 코드에 돌린다. 개별 파일은 상세용.
> 형식: `AP-NNN | signature | 한 줄 | 탐지 grep`

| AP | signature | 한 줄 증상 | 탐지 grep (rg) |
|----|-----------|-----------|----------------|
| AP-001 | `optional-peer-static-import` | optional peer 를 정적 top-level import + 무조건 호출 → 미설치 시 모듈 로드 실패 | `^import .* from '(@tanstack/react-virtual\|jspdf\|xlsx\|date-fns)'` 가 있는데 그 패키지가 `package.json` `peerDependenciesMeta.*.optional:true` 인 경우 |
| AP-002 | `deprecated-reexport-tag-missing` | alias/재export 인데 형제는 `@deprecated` 인데 자신만 태그 누락 | 같은 블록 내 `export { X }`/`export type { X }` 중 일부만 위에 `@deprecated` JSDoc |
| AP-003 | `stale-count-in-comment` | 주석에 하드코딩된 개수(예 "6 adapters")가 실제 코드 수와 불일치 | `\b(\d+)\s*(slots?\|adapters?\|cells?\|columns?\|개)\b` 주석 ↔ 실제 등록/배열 길이 대조 |
| AP-004 | `doc-source-signature-drift` | README/JSDoc 의 시그니처·prop 이 실제 export 와 다름 | README 코드블록·JSDoc 의 함수 시그니처 ↔ `src` 실제 시그니처 대조 |

(seed: 2026-06 gap audit — G-vimport=AP-001(×2 merging/agg), G3/G4=AP-002, G1/G2=AP-003, G-readme14/G-jsdoc16=AP-004)
