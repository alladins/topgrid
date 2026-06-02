# ID LEDGER

신규 ID 발급 전 조회(재사용 금지, 번호 충돌 방지). 발급 시 한 줄 추가.

| 접두 | 다음 번호 | 범위 |
|------|----------|------|
| PAT- | 005 | 패턴 (PAT-001~004 시드됨) |
| AP-  | 005 | 안티패턴 (AP-001~004 시드됨) |
| C-   | 004 | 제약 (C-001~003 시드됨) |
| POL- | — | 정책 (POL-TANSTACK 시드됨) |
| ADR- | 002 | 결정 (ADR-001 발급: 피벗 reducer 로컬 vs 공유 @ MOD-GRID-18) |
| LESS-| 003 | 교훈 (LESS-001 engine-substring @ MOD-19; LESS-002 react-major-split @ MOD-18) |

## ADR 목록
- **ADR-001** (MOD-GRID-18): 피벗 값 reducer = 로컬 구현 + agg 키 어휘만 재사용. 공유 추출은 N=2(소비자 2번째) 트리거. → `decisions/ADR-001-pivot-reducer-local-vs-shared.md`
