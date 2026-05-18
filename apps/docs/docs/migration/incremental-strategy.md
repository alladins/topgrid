---
title: 증분 이전 전략
sidebar_position: 3
---

# 증분 이전 전략 (C-19 기반)

이 문서는 TOMIS Grid 컴포넌트를 `@topgrid/grid-core` 기반으로 이전할 때 적용하는
**점진적(incremental) 마이그레이션 전략**을 설명한다.

대량 일괄 변환은 충돌 위험과 롤백 비용이 크다. C-19 규칙에 따라 Goal 단위로 분할하고
독립적으로 이전한다.

---

## C-19 규칙 — Goal당 ≤ 5 사용처 파일

**C-19 원문 요약**:
> 1 Goal당 영향 사용처(`affectedUsageFiles`) 마이그레이션 ≤ 5개.
> 6개 이상이면 별도 Goal로 분할한다.
> **예외**: import 경로만 변경하는 트리비얼 변경은 ≤ 10개까지 허용.

### 왜 5개인가?

| 이유 | 설명 |
|------|------|
| 리뷰 가능성 | PR 단위로 5개 파일이면 코드 리뷰자가 전체를 파악 가능 |
| 롤백 범위 | 이전 실패 시 5개 파일만 되돌리면 됨 |
| 충돌 최소화 | 다른 개발자의 기능 개발과 교차 수정 범위를 줄임 |
| 검증 단위 | 5개 파일 이전 후 실제 화면 검증이 현실적 |

---

## 전체 사용처 파일 현황

MOD-GRID-17 이하 Goals가 다루는 전체 사용처 파일은 **≥ 27개**로 예상된다.
정확한 수치와 파일 목록은 **MOD-GRID-17 Goals를 권위적 출처**로 인용한다.

> 이 수치는 MOD-GRID-17 Goal 목록(전체 Grid 이전 범위)에서 산출된 것으로,
> G-004 spec에서 직접 검증하지 않는다. (G-004 spec D5 결정)

---

## Goal별 그룹핑 기준

### 기준 1: 변형 종류별 그룹

동일 변형 컴포넌트를 사용하는 파일들을 같은 Goal로 묶는다.

```
Goal A: BaseGrid 사용처 5개 이전
Goal B: BaseGrid 사용처 (추가) 5개 이전
Goal C: VirtualGrid 사용처 3개 이전
Goal D: TreeGrid 사용처 4개 이전
...
```

**장점**: 변환 패턴이 동일해 코드 리뷰가 빠르다.

### 기준 2: 도메인 유형별 그룹

같은 업무 도메인 파일을 같은 Goal로 묶는다.

```
Goal A: 급여(payroll) 도메인 Grid 파일 5개 이전
Goal B: 인사(hr) 도메인 Grid 파일 5개 이전
Goal C: 회계(account) 도메인 Grid 파일 5개 이전
...
```

**장점**: 도메인 전문가가 한 PR에서 검토 가능.

### 기준 3: 혼합 (변형 + 도메인)

트리비얼 변환(import 경로만 변경)이 많을 때는 도메인 단위로 최대 10개까지 묶는다.

---

## 권장 이전 순서

### Phase 1: 완전 이전 변형 사용처 (우선)

이미 shim/re-export로 이전 완료된 변형들의 사용처는 import 경로만 변경하면 된다.
변환 비용이 낮아 먼저 처리한다.

| 변형 | 이전 방법 | 예상 Goal 수 |
|------|----------|-------------|
| GroupedHeaderGrid | import 경로 변경 (`@topgrid/grid-pro-header`) | 1~2 Goals |
| ChangeTrackingGrid | 변경 없음 (compat shim 유지) | 0 Goals |
| RangeSelectGrid | 변경 없음 (wrapper 유지) | 0 Goals |

```tsx
// GroupedHeaderGrid 사용처 이전 (트리비얼 — import만 변경)
// Before
import { GroupedHeaderGrid } from '../Grid/GroupedHeaderGrid';

// After
import { GroupedHeaderGrid } from '@topgrid/grid-pro-header';
// ↑ 또는 그대로 유지 (GroupedHeaderGrid.tsx가 이미 re-export 중)
```

### Phase 2: 부분 이전 변형 사용처

`EditableGrid` 사용처는 컴포넌트 쉘이 로컬에 유지 중이므로,
해당 MOD-GRID Goal이 완성된 후 이전한다.

### Phase 3: 미이전 변형 사용처 (BaseGrid, VirtualGrid, TreeGrid, ColumnPinGrid)

Legacy alias가 있는 변형부터 시작한다 (TreeGrid, ColumnPinGrid).
Import 경로만 변경하면 되므로 트리비얼 변환에 해당한다.

```
Goal X:   TreeGrid 사용처 10개 이전 (트리비얼 예외 적용)
Goal X+1: ColumnPinGrid 사용처 10개 이전 (트리비얼 예외 적용)
Goal X+2: BaseGrid 사용처 5개 이전 (mode="client" prop 추가 필요)
Goal X+3: BaseGrid 사용처 (추가) 5개 이전
...
```

### Phase 4: DataTable 사용처

DataTable은 변환 비용이 가장 높다 (`ColumnInfo` → `ColumnDef`, `listAction` 분리 등).
각 페이지를 개별 Goal로 처리한다.

```
Goal Y:   DataTable 사용처 3개 이전 (급여 도메인)
Goal Y+1: DataTable 사용처 3개 이전 (인사 도메인)
...
```

---

## MOD-GRID-17 Goal 구조 예시

MOD-GRID-17은 전체 사용처 이전을 담당한다. 아래는 Goal 분할 예시다.

```
MOD-GRID-17/
  G-001: TreeGrid 사용처 1~10 (트리비얼, 10개)
  G-002: ColumnPinGrid 사용처 1~8 (트리비얼, 8개)
  G-003: BaseGrid 사용처 1~5 (mode="client" 추가)
  G-004: BaseGrid 사용처 6~10
  G-005: VirtualGrid 사용처 1~4 (containerHeight 확인)
  G-006: EditableGrid 사용처 1~5 (쉘 완성 후)
  G-007: DataTable 사용처 1~3 (급여)
  G-008: DataTable 사용처 4~6 (인사)
  ...
```

> **총 Goal 수**: 사용처 27개 기준으로 약 8~12개 Goal 예상 (변환 복잡도에 따라 달라짐).

---

## 롤백 전략

파일별 독립적 이전 덕분에 부분 롤백이 가능하다.

```
Goal 완료 후 문제 발견 시:
1. 해당 Goal의 5개 파일만 revert
2. deprecated alias가 유지되므로 이전 코드 즉시 복구
3. 다음 Goal 작업에 영향 없음
```

### deprecated alias 유지의 중요성

C-23에 따라 legacy alias는 최소 1 minor 버전 동안 유지된다.
이전 중 문제가 생기면 기존 import 경로로 즉시 롤백 가능하다.

```tsx
// 롤백 — deprecated alias 경유 (항상 가능)
import { BaseGrid } from '@topgrid/grid-core'; // legacy alias 유지 중
// 또는
import { BaseGrid } from '../Grid/BaseGrid';  // 원본 파일 유지 중
```

자세한 alias 목록은 [Deprecated Alias 문서](./deprecated-aliases.md)를 참조한다.

---

## 체크리스트 (Goal 시작 전)

```
□ 이전 대상 파일 5개 이하인가?
□ 동일 변형 또는 동일 도메인 기준으로 그룹화했는가?
□ 해당 변형의 이전 상태를 확인했는가? (8-variant-table.md 참조)
□ deprecated alias가 유지되는지 확인했는가?
□ 이전 후 실제 화면 검증 계획이 있는가?
```

---

## 관련 문서

- [8개 Grid 변형 이전 가이드](./8-variant-table.md)
- [DataTable 이전 가이드](./dataTable-migration.md)
- [Deprecated Alias 목록](./deprecated-aliases.md)
- [Live 데모](./live-demos.md)

> **사이드바 등록**: G-001(Docusaurus 설정) PR에서 `sidebars.ts`에 이 문서를 추가한다 (D4).
