# ADR-014 실행 결과 — as unknown as CellComponent 14회 정리

**실행일**: 2026-05-17
**Wave**: 1 (의존성 0)
**상태**: blocked

---

## 차단 사유

ADR-014가 처방한 `CellComponent` 타입 변경 (`ComponentType<{ value: unknown } & Record<string, unknown>>`)을 `packages/grid-renderers/src/rendererRegistry.ts`에 실제로 적용한 결과 **14개 모든 entry에서 TS2322 컴파일 오류**가 발생하여 실행 불가 상태입니다.

원본 파일은 **변경하지 않았습니다**. 14 cast 모두 현 상태 유지.

---

## 증거 — typecheck 오류 (실제 파일 기준 ground-truth)

### 적용 시도한 변경

```typescript
// 기존
export type CellComponent = ComponentType<CellComponentProps>;

// ADR-014 처방
export type CellComponent = ComponentType<{ value: unknown } & Record<string, unknown>>;
```

### TS2322 오류 (전체 14건, 대표 발췌)

```
src/rendererRegistry.ts(58,3): error TS2322: Type '({ label, onClick, href, className }: LinkCellProps) => Element'
  is not assignable to type 'CellComponent'.
    Property 'label' is missing in type '{ value: unknown; } & Record<string, unknown>'
    but required in type 'LinkCellProps'.

src/rendererRegistry.ts(59,3): error TS2322: Type '({ label, onClick, ... }: ButtonCellProps) => Element'
  is not assignable to type 'CellComponent'.
    Type '{ value: unknown; } & Record<string, unknown>' is missing the following properties
    from type 'ButtonCellProps': label, onClick

src/rendererRegistry.ts(60,3): error TS2322: Type '({ checked, onChange, readOnly, className, }: CheckCellProps) => Element'
  is not assignable to type 'CellComponent'.
    Property 'checked' is missing in type '{ value: unknown; } & Record<string, unknown>'
    but required in type 'CheckCellProps'.

src/rendererRegistry.ts(62,3): error TS2322: Type '({ icon, label, onClick, color, className, }: IconCellProps) => Element'
  is not assignable to type 'CellComponent'.
    Property 'icon' is missing in type '{ value: unknown; } & Record<string, unknown>'
    but required in type 'IconCellProps'.

src/rendererRegistry.ts(64,3): error TS2322: Type '({ name, src, sizeClassName, className, }: AvatarCellProps) => Element'
  is not assignable to type 'CellComponent'.
    Property 'name' is missing in type '{ value: unknown; } & Record<string, unknown>'
    but required in type 'AvatarCellProps'.
```

(이 외 TextCell / NumberCell / DateCell / StatusBadgeCell / TagCell / ProgressCell 에서도 동일 유형 오류 — `value` 타입 불일치: `unknown` is not assignable to `string | number | null | undefined` 등)

---

## 근본 원인 분석

TypeScript `strict` + `exactOptionalPropertyTypes` 환경에서 `FunctionComponent<P>`의 파라미터는 **contravariant**하게 검사됩니다 (`--strictFunctionTypes`). 따라서:

- `ComponentType<{ value: unknown } & Record<string, unknown>>` 에 `LinkCell: ComponentType<LinkCellProps>` 를 할당하려면
- TypeScript가 `{ value: unknown } & Record<string, unknown>` ⊇ `LinkCellProps` 임을 검증해야 함
- 하지만 `Record<string, unknown>`의 index signature는 `label: unknown`을 제공하며, 이는 `label: string`에 **할당 불가** (`unknown` → `string` 방향)

**`value`가 없는 5개 셀 (schema mismatch)**: CheckCell (`checked`), IconCell (`icon`), AvatarCell (`name`), LinkCell (`label`), ButtonCell (`label`, `onClick`) — 이 셀들은 `value` prop 자체가 없어 추가적인 불일치 발생.

**ADR-014 justification 주석 (line 50–55)이 옳았습니다**: "TypeScript's contravariance check requires the `unknown` intermediate cast" — `Record<string, unknown>` index signature로는 이 contravariance를 해소할 수 없음.

---

## 사용처 인벤토리 (Step 2 완료)

- **`CellComponent` 타입 외부 사용자 (src/*.ts 기준)**: 1건
  - `packages/grid-renderers/src/index.ts:39` — `type CellComponent` re-export
- **`registerRenderer` 호출처 (packages/ 내)**: 0건 (테스트 제외)
  - `packages/grid-core/src/column/createColumns.test.ts:172` — 테스트에서 사용 (별도 `registerRenderer` 시그니처, grid-core 패키지)
- **사용자 정의 cell 등록자**: 0건 (monorepo src 내)
- **영향 평가**: `CellComponent` type 변경은 `registerRenderer(type, component: CellComponent)` 시그니처를 통해 외부 사용자에게 영향. 현재 monorepo 내 등록자 0건이므로 영향 없음.

---

## 단위 테스트 현황 (Step 3 완료)

- `packages/grid-renderers/src/*.test.*`: **0건** — 테스트 부재
- `packages/grid-renderers/src/*.spec.*`: **0건** — 테스트 부재
- **결론**: 14 cell 전체 단위 테스트 부재. 회귀 위험 14/14 항목 미커버.
  (테스트 추가는 본 ADR 범위 외)

---

## ADR-014 대안 재검토

ADR-014는 3개 대안을 검토하고 각하했습니다:

| 대안 | ADR-014 각하 사유 | 실증 검증 |
|------|-----------------|---------|
| 현 cast 유지 (status quo) | 14회 반복 boilerplate | — 유일하게 컴파일되는 현재 상태 |
| union type | 새 cell type 추가마다 확장 필요 | 미검증 (플러그인 의도와 반대) |
| `any` 완화 | C-4 no-any 위반 | 동작하나 정책 위반 |

---

## ADR 범위 외 발견된 대안 (참고 — ADR 수정 없이 실행 불가)

`asCell<T>()` helper 패턴: cast를 14개에서 1개로 통합하는 방법으로, `any` 없이 동작합니다.

```typescript
/** @internal — ADR-014 amendment 검토용. 현재 미채택. */
function asCell<T>(c: ComponentType<T>): CellComponent {
  return c as unknown as CellComponent;  // cast 1개, 내부에만 격리
}

export const defaultRendererRegistry: Record<string, CellComponent> = {
  text: asCell(TextCell),
  link: asCell(LinkCell),
  // ... 등록 시 cast 없음
};
```

probe 검증 결과: `asCell(CheckLikeComp)`, `asCell(LinkLikeComp)` 모두 TS2322 없이 컴파일 통과.

**단, 이 패턴은 ADR-014의 3개 열거 대안에 포함되어 있지 않습니다.** ADR 거버넌스 원칙에 따라 ADR 수정 없이 단독 채택 불가.

---

## 변경 파일

없음. `rendererRegistry.ts` 원본 유지.

---

## 검증 결과

- **원본 파일 typecheck**: `npx tsc --noEmit` → **PASS** (0 errors) — 기존 cast가 정상 동작
- **ADR-014 처방 적용 후 typecheck**: **FAIL — 14 TS2322 errors** (실증)
- **grep `as unknown as CellComponent`**: 14 hits — cast 제거 **불가** (blocked)
- **단위 테스트**: 부재 (N/A)

---

## 결과 체크리스트 (ADR-014 결과 절 매핑)

- [ ] `grid-renderers/src/rendererRegistry.ts` 의 `as unknown as CellComponent` 0건 — **차단 (0건 달성 불가)**
- [ ] `pnpm typecheck` 통과 — **차단 (처방 타입 적용 시 14 TS2322)**
- [ ] 14 cell 단위 테스트 통과 — **N/A (테스트 부재)**
- [ ] grep `as unknown as CellComponent` packages/grid-renderers/ → 0 — **차단**

충족: **0 / 4**

---

## 후속 조치 (필수)

ADR-014 수정 전 Wave 1 item #14 실행 불가.

**ADR 수정 옵션 (제안):**

1. **`asCell<T>()` helper 패턴 채택**: cast 14 → 1 통합. `any` 없음. ADR에 4번째 대안으로 추가 후 승인.
2. **status quo 수용**: ADR-014 결정을 "현 cast 유지 정당화 문서화"로 변경. cast 14개가 justified임을 공식 인정.
3. **cell prop 재설계**: 모든 cell이 `value: unknown`을 받도록 prop contract 변경 (CheckCell → `value: boolean`, AvatarCell → `value: string` 등). 단, 각 cell의 public API가 변경됨 — semver minor 또는 major.

**권고**: 옵션 1 (`asCell<T>()` helper). `any` 없음, cast 1개로 격리, design smell 해소, ADR 수정 범위 최소.

---

**환경**: TypeScript ~5.8.3, strict: true, exactOptionalPropertyTypes: true, noImplicitAny: true
**참조**: ADR-014 본문 §결정, §대안, §Trade-off; refactor-analysis-2026-05-17.md §9.3
