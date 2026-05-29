# tw-grid references/

Phase 1 (discover) 산출물. Phase 2~5에서 Spec Writer / Implementer가 사전 읽기.

| 파일 | 출처 | 용도 |
|------|------|------|
| `current-tanstack-analysis.md` | tw-framework-front 23 파일 | 현 8 variant 사용 패턴 |
| `tanstack-api-inventory.md` | @tanstack/react-table v8 docs | API 인벤토리 |
| `publish-aggrid-analysis.md` | publish 13 파일 | AG Grid 패턴 |
| `publish-wijmo-analysis.md` | publish 5 파일 + 근태관리 | Wijmo 참조 (코드 차용 X) |
| `ag-grid-feature-matrix.md` | ag-grid.com 공식 | AG Grid 기능 매트릭스 |
| `wijmo-feature-matrix.md` | mescius.com 공식 | Wijmo 16 카테고리 |
| `feature-gap-matrix.md` | 통합 분석 | TanStack 미보유 갭 도출 |
| `usage-inventory.json` | 자동 집계 | 23 파일 × 기능 사용 빈도 |

## ⚠️ 절대 준수
- **Wijmo 분석은 패턴 학습용** (R-W 참조). C-16: `@mescius/wijmo*` 신규 import 금지.
- AG Grid Enterprise 코드 차용 금지 (Pro 라이선스). R-A는 동등 기능 참조만.
- `publish/` 코드 직접 복사 금지. 분석 결과만 packages/ 구현에 반영.

## 비어있을 때
Phase 1 미실행 상태. `/tw-grid discover` 호출하여 채울 것.
