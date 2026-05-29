# MOD-GRID-03 Decisions — Pagination

## ADR-MOD-GRID-03-001: mode는 manual의 convenience shorthand

**날짜**: 2026-05-14  
**상태**: 확정  
**Goal**: G-001

### 상황
G-001은 `mode: 'client' | 'server' | 'none'` prop 추가를 요구하지만, `GridPaginationOptions.manual: boolean`이 이미 buildTableOptions.ts L175에서 `manualPagination`으로 wiring 완료되어 있다.

### 결정
`mode`는 기존 `manual` 경로를 대체하지 않는다. 신규 `buildPaginationOptions.ts`가 `mode`를 TanStack 옵션으로 변환하는 별도 경로를 제공한다. `manual`을 직접 사용하는 기존 코드는 `buildTableOptions.ts`가 처리하는 기존 경로를 그대로 타게 된다. `mode`와 `manual` 동시 지정 시 `mode`가 우선.

### 대안

| 대안 | 거부 이유 |
|------|----------|
| `PaginationOptions` 신규 타입으로 `GridPaginationOptions` 대체 | C-6 위반 (breaking change) — 기존 `manual: true` 사용자 전체 수정 강제 |
| `manual`을 deprecated 처리하고 `mode`만 사용 | C-23 위반 — 1 minor 버전 alias 유지 없이 즉시 제거 불가 |

### Trade-off

- (+) 기존 `manual: boolean` API 완전 보존 (C-6 준수)
- (+) 새 사용자는 명시적 `mode` union으로 의도 표현 가능
- (-) `mode`와 `manual` 두 경로가 공존 → 동시 지정 시 우선순위 규칙 필요 (AC-006으로 명시)
- (-) `buildPaginationOptions` + `buildTableOptions`가 각각 `manualPagination` 처리 → 이중 경로 (mode 사용 시 manual 미설정이 기본이므로 실질 충돌 없음)

### 결과
`mode: 'server'`와 `manual: false` 동시 지정 시 `mode` 우선 (`manualPagination: true`). 기존 `manual: true` 사용자는 영향 없음.

---

## ADR-MOD-GRID-03-002: GridPagination.tsx는 G-001에서 skeleton

**날짜**: 2026-05-14  
**상태**: 확정  
**Goal**: G-001

### 상황
G-001 범위 내에서 pagination UI 컴포넌트(`GridPagination.tsx`)를 완성하면 C-8(≤5 usage files/Goal)과 단순성 원칙에 위배될 수 있음.

### 결정
G-001에서 `GridPagination.tsx`는 `null` 반환 skeleton만 생성. Props 인터페이스(`GridPaginationProps`)는 정의하여 G-002/G-003의 구현 계약을 선언.

### 대안

| 대안 | 거부 이유 |
|------|----------|
| G-001에서 완전한 UI 구현 | 사용처 파일 수 C-8 ≤5 위반 위험 + scope 과다 |
| GridPagination.tsx 생성 자체 생략 | G-002/G-003 구현자가 props 계약 없이 작업 — 일관성 훼손 |

### Trade-off

- (+) G-001 범위 명확히 한정 (mode prop API + TanStack 옵션 wiring)
- (+) G-002/G-003 구현자에게 props interface 계약 제공
- (-) `GridPagination` export 되지만 null 반환 — 사용자가 혼동할 수 있음 (JSDoc으로 안내)

---

## ADR-MOD-GRID-03-003: pageCount 직접 지정 지원

**날짜**: 2026-05-14  
**상태**: 확정  
**Goal**: G-001

### 상황
AS-IS `data-table.tsx` L370은 `pageCount: pageingInfo?.pageCount || 1`로 외부 pageCount를 그대로 수신. `totalCount / pageSize` 계산은 서버 응답이 이미 pageCount를 계산하여 제공하는 경우 불필요한 중복.

### 결정
`GridPaginationOptions.pageCount?: number` 추가. `buildPaginationOptions`에서 `pageCount` 직접 지정 시 계산 없이 사용. `totalCount` 없이도 `pageCount`만으로 server 모드 동작 가능.

### 대안

| 대안 | 거부 이유 |
|------|----------|
| `pageCount` 제거, `totalCount`만 사용 | AS-IS `data-table.tsx` L370 패턴과 불일치 — 하위 호환 마이그레이션 불편 |
| `pageCount`를 `GridProps` 최상위 prop으로 추가 | `pagination` 옵션 객체와 분리 — 응집성 저하 |

### Trade-off

- (+) AS-IS `pageingInfo.pageCount` 패턴 직접 지원 (마이그레이션 용이)
- (+) `totalCount` 없이도 server pagination 동작 (AC-003)
- (-) `pageCount` + `totalCount` + `pageSize` 세 값이 불일치할 경우 `pageCount` 우선 정책 필요 (명시됨)
