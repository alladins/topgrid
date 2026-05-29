# MOD-GRID-04 Architecture Decision Records

**Module**: column (createColumns + rendererRegistry)  
**Date**: 2026-05-14  
**Status**: Active

---

## ADR-MOD-GRID-04-001: createTomisColumnHelper = createColumnHelper re-export (Option A)

**결정**: `createTomisColumnHelper<TData>()` = TanStack `createColumnHelper<TData>()` 순수 re-export.  
`.tomisColumn()` wrapper 메서드 없음.

**사유**:
- TanStack API 그대로 사용하면 학습 비용 0 (팀원이 TanStack docs 참조 가능)
- 타입 추론이 TanStack 내부 타입과 100% 호환 — wrapper 추가 시 복잡한 타입 박싱 발생
- `createColumns(defs)` 가 고수준 자동 분기 API, 이 함수는 저수준 수동 컨트롤 경로로 공존

**대안 A (채택)**: 순수 re-export  
- 장점: 타입 호환 완벽, 추가 번들 기여 ~0.1 KB
- 단점: TOMIS 고유 API 없음 — 팀이 TanStack 패키지 직접 import와 혼용할 수 있음

**대안 B (기각)**: `.tomisColumn()` wrapper 메서드 추가  
- 장점: TOMIS 전용 추상화 (팀이 TanStack 직접 몰라도 됨)
- 단점: TanStack 내부 타입 boxing 복잡성, 번들 증가, 추가 유지보수 부담

**trade-off**:
1. **API 안정성 vs 학습 비용**: Option A는 TanStack breaking change에 직접 노출되나, wrapper (Option B)는 변경을 흡수할 수 있음. 현재 TanStack v8은 stable — 위험 낮음.
2. **추상화 깊이 vs 타입 투명성**: wrapper가 더 추상화되지만 타입 복잡성이 올라감. 현재 팀 규모에서는 투명성이 우선.

**결과**: 순수 re-export로 구현. 향후 `.tomisColumn()` 필요 시 ADR-MOD-GRID-04-001-v2로 재검토.

---

## ADR-MOD-GRID-04-002: rendererRegistry 패턴 (Map vs Object vs Provider)

**결정**: `Map<TomisColumnType, RendererFn>` 기반 registry.

**사유**:
- `Map.get()`은 타입 안전 — key가 `TomisColumnType` union으로 제한됨
- `Map.set()` 으로 외부 주입 용이 (MOD-GRID-05 연동)
- `hasKey()` 체크 없이 `undefined` 반환으로 fallback 처리 자연스러움

**대안 A (채택)**: `Map<TomisColumnType, RendererFn>`  
- 장점: 타입 안전, 동적 등록 (`registerRenderer`), key iteration 가능
- 단점: 초기화 verbose (new Map([...entries]) 문법)

**대안 B (기각)**: `Record<TomisColumnType, RendererFn>` object  
- 장점: 초기화 간결 (`{ text: fn, number: fn, ... }`)
- 단점: 모든 9종을 반드시 정의해야 함 (Record는 optional key 불가) — 부분 등록 불가

**대안 C (기각)**: React Context Provider  
- 장점: 컴포넌트 트리 전체에 registry 공유 용이
- 단점: 순수 함수 `createColumns()` 가 React 의존성 생기게 됨, 테스트 복잡도 증가, SSR 이슈 가능

**trade-off**:
1. **동적 등록 vs 정적 선언**: Map은 런타임 교체 가능, Record는 컴파일 타임 고정. MOD-GRID-05 연동을 위해 동적 등록 필수.
2. **순수성 vs 편의성**: Context (Option C)가 React 생태계와 통합되지만 `createColumns`의 순수 함수 성격을 훼손함. Map 기반이 테스트 용이성 높음.

**결과**: `Map<TomisColumnType, RendererFn>` 채택. `registerRenderer()` 함수로 외부 주입 인터페이스 제공.
