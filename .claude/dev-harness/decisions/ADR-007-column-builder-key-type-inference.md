---
id: ADR-007
title: W3-6 — createColumns 컬럼 빌더 키/타입 추론 강화 (breaking → grid-core 1.0)
module: W3 (grid-core DX)
date: 2026-06-20
status: proposed
related: ["W3-DX-FRICTION-ANALYSIS.md(§10)", "ADR-006(non-breaking adapter)", LESS-002]
---

# ADR-007 — 컬럼 빌더 키/타입 추론: discriminated union 으로 `id ∈ keyof TData` 강제 (breaking)

> 상태 = **proposed**(설계만; 구현은 grid-core 1.0 major 동반). 본 ADR 은 [[W3-DX-FRICTION-ANALYSIS]] §10 의
> "급조 금지, 전용 ADR + major 동반" 처분을 이행하는 설계 문서다. **코드 변경 없음.**

## Context
[[W3-DX-FRICTION-ANALYSIS]] §2(P3)·§10(W3-6): `createColumns<TData>([{id,type,…}])` 의 `id` 가
**TData 키를 강제하지 못한다**. 현 정의(`packages/grid-core/src/column/types.ts:76`):

```ts
id: keyof TData extends never ? string : (keyof TData & string) | string;
//                                                              ^^^^^^^^ 이 escape hatch 가 키 안전성을 무력화
```

끝의 `| string` 때문에 **임의 문자열이 통과** → `{ id: 'naem' }` 같은 오타나 존재하지 않는 키가
**컴파일 타임에 잡히지 않는다**. 실증: `createColumns.typetest.ts:46` 의 `id: 'x'`(User 키 아님)가
현재 **무오류로 통과**한다(같은 파일이 잘못된 `type` 은 `@ts-expect-error` 로 잡는 것과 대조).

**`| string` 이 존재하는 이유**: `type:'checkbox'`(selection 컬럼, AC-006 = id 무시)는 데이터 키가 아닌
임의 id(`'sel'` 등)를 쓴다. 즉 escape hatch 는 **비-데이터 컬럼을 허용하려는 것**이었으나, 그 대가로
**데이터 컬럼의 키 안전성까지 통째로 포기**했다.

**제약(하위호환)**: grid 13-패키지 lockstep 발행됨(grid-core@0.8.0)·실 소비자 존재
(`apps/example-react`, PTLPSM). 키 강제는 **breaking** — 기존에 data-bound 컬럼에 비-키 id(예: 커스텀
display 컬럼을 `type:'text'` + 합성 id 로 쓰던 코드)를 두면 즉시 타입 에러가 난다.

## Decision
**`TopgridColumnDef<TData>` 를 `type` 으로 판별하는 discriminated union 으로 재정의**해, 데이터바운드
컬럼은 `id: keyof TData & string` 을 강제하고 비-데이터 컬럼만 임의 `id: string` 을 허용한다.
**구현은 grid-core 1.0(차기 major)** 으로 연기(현 0.x 에서는 non-breaking 만 유지 = ADR-006 노선).

- **D1 — 판별 분기**: 컬럼 type 11종을 2분류한다.
  - **비-데이터(display)** = `'checkbox'` (selection 컬럼; AC-006 = accessorKey 없음·id 무시).
    → `{ type: 'checkbox'; id: string; … }` (임의 id 허용).
  - **데이터바운드** = 나머지 10종(`number`·`boolean`·`dateTime`·`date`·`text`·`badge`·`link`·`icon`·`tag`·`progress`)
    — 전부 accessorKey(=id)로 셀 값을 읽는다. → `{ type: <위 10종>; id: keyof TData & string; … }` (키 강제).

  ```ts
  // 1.0 스케치 (공유 필드는 base 로 추출)
  type DataColumnType = Exclude<TopgridColumnType, 'checkbox'>;
  interface BaseCol { name: string; align?: …; width?: string; visibility?: boolean; /* … */ }
  type TopgridColumnDef<TData = unknown> =
    | (BaseCol & { type: 'checkbox'; id: string })
    | (BaseCol & { type: DataColumnType; id: keyof TData & string });
  // TData=unknown(레거시 ColumnInfo 경로) → keyof unknown = never → 분기가 무너지지 않게
  // `keyof TData extends never ? string : keyof TData & string` 로 한 번 더 감싼다(현 패턴 유지).
  ```

- **D2 — `type↔value` 정합은 본 1.0 컷에서 제외(별도 후속)**. "`type:'number'` 는 숫자 필드에만"
  같은 값-타입 정합은 `TData[id]` 와 type 카탈로그를 교차하는 **복잡 conditional 제네릭**이고
  엣지(`number|null`, union 필드, `badge`=문자열·`progress`=숫자 등 type↔value 매핑 자체가 1:1 아님)가
  많다. 가치/리스크 비 낮음 → **D1(키 강제)만 1.0 에 넣고**, 값-타입 정합은 수요 확인 후 별도 ADR.

- **D3 — 마이그레이션 경로**: 1.0 릴리스 노트에 명시. 깨지는 소비자는 둘 중 하나.
  (a) 진짜 데이터 컬럼이면 오타/잘못된 키를 **고친다**(이게 의도된 이득). 
  (b) 의도적 비-키 display 컬럼이면 `type:'checkbox'` 가 아닌 한 **현재 비-데이터 display 타입이 없으므로**,
  1.0 에서 `id: string` 을 허용하는 display 분기(예: 향후 `type:'custom'`)를 추가하거나 escape 용
  `as` 캐스트를 안내. (현 카탈로그상 checkbox 외 순수 display 컬럼은 없음 → 영향 표면 작음.)

- **D4 — 검증 게이트 = `tsc --noEmit`**(런타임 무관). 기존 `createColumns.typetest.ts` 에:
  유효 키 = 통과, 오타 키 = `@ts-expect-error`, checkbox 임의 id = 통과, 의 3 케이스 추가. (line 46 의
  `id:'x'` 는 1.0 에서 `@ts-expect-error` 로 전환.)

## Rejected
- **(R1) 지금(0.x) 키 강제** — 발행된 13-패키지의 실 소비자를 즉시 파손. 0.x 중간 major churn,
  마이그레이션 경로 빈약. 거부(ADR-006 의 "하위호환이 깨끗함을 이긴다" 원칙 일치).
- **(R2) `| string` 만 제거하고 단일 인터페이스 유지**(`id: keyof TData & string` 일괄) — checkbox/selection
  의 임의 id(`'sel'`)까지 키로 강제해 **정당한 비-데이터 컬럼이 막힌다**. 분기 없는 강제는 과도. 거부.
- **(R3) 런타임 검증(dev-warn)으로 대체** — `id` 가 데이터에 없으면 console.warn. 타입 안전이 아닌
  런타임 후행 검출이라 IDE/컴파일 피드백 부재 = W3-6 의 목적(컴파일 타임 키 안전) 미달. 단, 1.0 전
  **0.x 과도기 완화책으로는 채택 가능**(별도 저비용 항목, 본 ADR 범위 밖). 본 ADR 의 주 결정으로는 거부.
- **(R4) `type↔value` 정합까지 1.0 에 동봉**(D2 를 채택) — conditional 제네릭 복잡도·엣지 폭발 대비
  가치 낮음. "방금 안정화된 grid-core 에 급조 금지" 처분과 충돌. 거부(후속 ADR 로 분리).

## Trade-offs
1. **discriminated union(분기 강제) vs 단일 인터페이스(`| string`)**: union 은 데이터 컬럼 키 안전 +
   checkbox 자유를 **동시 달성**하나, 타입 정의가 복잡해지고(공유 필드 base 추출 필요) 향후 새 비-데이터
   type 추가 시 분기 갱신 비용이 든다. → 키 안전 이득이 분기 유지비를 상회(오타=silent breakage 는 P3 마찰).
2. **1.0 연기 vs 즉시**: 연기 = 발행물 안정 유지·소비자 마이그레이션 시점 제어. 비용 = 1.0 까지
   `| string` 으로 인한 오타 미검출 잔존(단 dev-warn 완화 가능 R3). 수용(ADR-006 와 동일 노선).
3. **D1만 vs D1+D2(값-타입 정합)**: D1만 = 단순·고가치(키 오타 제거)·엣지 적음. D1+D2 = 더 강한 안전이나
   conditional 제네릭 엣지(union/null/비1:1 매핑)로 유지·디버깅 비용 급증. → D1 우선, D2 분리(수요 게이트).
4. **breaking 의 영향 표면**: 현 카탈로그상 순수 display 컬럼은 checkbox 뿐 → data 타입에 비-키 id 를 쓰던
   코드만 깨진다. 표면은 작다고 추정되나 **실측 미확인**(PTLPSM 코드 비가시) → 1.0 착수 전 소비자 grep 필요.

## 구현 함의 (grid-core 1.0 착수 시)
- `types.ts` `TopgridColumnDef` 를 D1 union 으로 재작성(공유 필드 `BaseCol` 추출). `createColumns.ts`
  런타임 로직은 **무변경**(이미 type 분기로 checkbox=selection, 그 외=accessorKey 라우팅). 순수 타입 변경.
- `createColumns.typetest.ts` D4 케이스 추가 + line 46 `id:'x'` 를 `@ts-expect-error` 로 전환.
- 동반: ADR-006 의 1.0 콜백 시그니처 clean 전환(W3-DX §10 "📋 W3-4")과 **같은 major 에 배치**(major 1회로 흡수).
- 발행: grid-core 1.0 = 13-패키지 lockstep(peerDep major escalation [[changeset-peerdep-major-escalation]]
  주의 — 수동 bump). user-gated.

## 컴파운딩 데이터포인트 (하네스 학습)
ADR-006(런타임/값 누출 = **non-breaking adapter**)과 ADR-007(**타입 표면 = breaking, major 연기**)이
짝을 이룬다: **DX 개선의 분기 규칙** — 데이터 경로 보강은 adapter 로 즉시(하위호환), **타입 시그니처
강화는 깨지므로 major 까지 모은다.** "급조 금지 → 전용 ADR + major 동반"이 발행된 라이브러리의 표준 처분.
