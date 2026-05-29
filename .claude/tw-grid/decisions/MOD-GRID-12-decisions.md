# MOD-GRID-12 — Architecture Decision Records (datamap 패키지)

> 모든 ADR은 다음을 포함: 결정 / 사유 / 대안 2개+ / trade-off / 결과.
> Source: C-14 (ADR 문서화 의무), C-20, C-27.

---

## ADR-001: DataMap 설계 패턴 — 인터페이스 + 팩토리 함수

**결정일**: 2026-05-15
**상태**: accepted
**연관 Goal**: G-001 (DataMap API 설계)
**연관 constraint**: C-4, C-14, C-29

### 결정

`DataMap<TItem>`을 **인터페이스**로 정의하고 `createDataMap()` **팩토리 함수**로 인스턴스를 생성한다.
클래스 기반 구현(class DataMapImpl implements DataMap)을 사용하지 않는다.

### 사유

- 소비자는 인터페이스 타입만 의존. 구현 세부 사항(Map 내부 구조)은 노출 안 됨.
- 팩토리 함수는 closure 기반으로 private state를 자연스럽게 캡슐화.
- 클래스 사용 시 `instanceof` 검사 의존성 위험 + 상속 확장 오남용 가능성.
- 내부 구현(`buildDataMap`)을 별도 모듈(DataMap.ts)로 분리 → 테스트 용이성 향상.

### 대안

1. **클래스 패턴** (`class DataMapImpl<TItem> implements DataMap<TItem>`): instanceof 체크 가능, 친숙한 OOP 구조. **각하**: 소비자가 구현 클래스에 직접 의존하게 됨. 인터페이스 계약만으로 충분.
2. **단일 함수 반환** (순수 object literal): 팩토리 없이 직접 `{ getDisplay, getItems, getValue }` 반환. **각하**: createDataMap/buildDataMap 레이어 분리가 스펙 C-31 wiring 요구사항.

### Trade-off

- 팩토리 패턴은 tree-shaking 친화적이나, 인스턴스마다 Map을 새로 생성 → 아이템 수가 매우 많으면 메모리 압박. (G-001 범위에서는 허용 범위)

### 결과

`types.ts` = `DataMap<TItem>` + `PathOrAccessor` + `CreateDataMapOptions` + `TomisColumnDef`.
`DataMap.ts` = `buildDataMap` (내부 구현).
`createDataMap.ts` = `createDataMap` (공개 팩토리 API).

---

## ADR-002: TomisColumnDef — intersection 패턴 채택

**결정일**: 2026-05-15
**상태**: accepted
**연관 Goal**: G-001 (DataMap API 설계)
**연관 constraint**: C-4, C-27, C-29, C-30

### 결정

`TomisColumnDef<TData>`를 `ColumnDef<TData, unknown> & { dataMap?: ...; selectOptions?: string[] }` **교차 타입**으로 정의한다.

### 사유

- spec Section 3.3 코드 템플릿과 ADR-002 모두 intersection 패턴 명시.
- C-30 truth table: 코드 템플릿 + ADR이 prose보다 권위.
- D4 prose의 `Omit<ColumnDef<TData, unknown>, 'meta'> & { meta?: TomisColumnMeta }` 안은 `TomisColumnMeta` 타입이 스펙 어디에도 정의되지 않아 실현 불가.

### 대안

1. **Omit + TomisColumnMeta**: D4 prose의 안. TanStack 내부 meta 타입 충돌 방지 목적. **각하**: TomisColumnMeta 미정의 — TypeScript 컴파일 오류. G-004/G-005에서 meta 필드 필요 시 별도 ADR.
2. **완전 독립 타입** (ColumnDef 상속 없음): `@tanstack/react-table` 의존 완전 제거. **각하**: TanStack Table 생태계와 호환성 단절.

### Trade-off

- intersection은 meta 필드에 대한 타입 충돌 가능성 있음 (TanStack meta: unknown). G-002/G-003에서 meta 필드 사용 시 재검토 필요.

### 결과

`types.ts`의 `TomisColumnDef<TData>` = `ColumnDef<TData, unknown> & { dataMap?; selectOptions? }`.
D4 내부 비일관성은 spec feedback L1로 보고.

---

## ADR-003: grid-license 런타임 체크 — 인라인 stub 패턴

**결정일**: 2026-05-15
**상태**: accepted
**연관 Goal**: G-001 (DataMap API 설계)
**연관 constraint**: C-4, C-12, C-24

### 결정

`index.ts`에서 `@tomis/grid-license`를 직접 import하지 않고, **인라인 stub 함수** `verifyOrWarn`을 사용한다:
```typescript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function verifyOrWarn(_packageName: string): void {
  /* MOD-GRID-99-A/G-002 will implement signature / expiry / domain checks. */
}
verifyOrWarn('@tomis/grid-pro-datamap');
```

### 사유

- 스펙 D6는 `import * as gridLicense from '@tomis/grid-license'` + feature-detect 패턴을 명시.
- **실증적 충돌**: `@tomis/grid-license`가 `package.json` dependencies에 없고(D7: G-004 위임), pnpm workspace 미설치 상태에서 `tsc`는 `TS2307: Cannot find module '@tomis/grid-license'` 오류를 발생시킴.
- D6(spec import 패턴) + D7(package.json 수정 금지) + C-12(tsc 0 errors) 세 제약이 동시에 충족 불가능.
- C-12가 rubric F 게이트(배점 조건)로 더 상위 제약 → D6 패턴 적용 불가.
- **모노레포 선례**: `grid-pro-tracking/src/index.ts` + `grid-pro-range/src/DragFillHandle.tsx` 모두 동일 인라인 stub 패턴 사용 (실증적 작동 확인).
- MOD-GRID-99-A/G-002 구현 완료 후 실제 import로 교체 예정 (주석으로 명시).

### 대안

1. **spec D6 feature-detect 패턴** (`import * as gridLicense`): 스펙 코드 템플릿. **각하**: pnpm 미설치 환경에서 TS2307 오류 → C-12 위반.
2. **peerDependencies에 grid-license 추가** + D6 패턴: D7 위반 (package.json 수정 금지, G-004 위임). **각하**.
3. **grid-license 체크 완전 생략**: C-24 위반. **각하**.

### Trade-off

- 인라인 stub은 실제 라이선스 검증을 수행하지 않음. MOD-GRID-99-A/G-002 완료 전까지 무효.
- 하지만 모노레포 내 다른 Pro 패키지(grid-pro-tracking, grid-pro-range)도 동일 접근법 사용 → 일관성 유지.

### 결과

`index.ts`에 인라인 stub `verifyOrWarn` 함수 적용. TypeScript 0 오류. C-4 + C-12 준수.
D6 패턴 적용 불가 원인은 implement-score.json `deviations[]`에 기록.
