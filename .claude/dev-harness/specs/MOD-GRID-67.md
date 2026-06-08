# MOD-GRID-67 — 서버사이드 피벗 (server-side / lazy pivoting)

dev-harness 49번째 (**Enterprise ❌ backlog — 비-DnD tail 1번째, reuse-heavy**, advisor). grid-pro-serverside(Pro).
갭분석 **Pivoting ❌ = Server-side / lazy pivoting**(computePivot 는 in-memory 전용, 서버 그룹 데이터 피벗 모드 부재). 경쟁: AG SSRM pivoting.

## verify-first + reuse-gate (advisor: reuse-heavy clean-✅ 후보)
- grep: computePivot=client-side(in-memory array). SSRM(MOD-22)=block cache+epoch+lazy group. server pivot 모드 0. genuine 부재.
- 재사용: **MOD-22 SSRM 전체**(GetRowsRequest/Result·serverSideController·block cache·epoch·useServerSideData) + GetRowsRequest 의 groupKeys/rowGroupCols **optional additive 패턴**(=pivot 도 동형 optional 확장).
- **build-vs-defer(read)**: pivot=request/response **additive 확장** + 순수 컬럼 도출, **core scroll-path(block cache/epoch/virtualizer) 무수정** → build(post-sort hot-path 얽힘과 구별). AG 모델=서버가 피벗 수행→client 는 pivotResultFields 로 동적 컬럼 생성.

## Goals
- **G-1 순수 buildServerPivotColumns — 종결형(map)**:
  - `buildServerPivotColumns(fields: string[], separator?): ServerPivotColumn[]` — 서버가 반환한 flat pivot-result field(예 `East|sales`)를 separator 로 분해→**중첩 컬럼 그룹 트리**(dim 값=그룹 헤더, 마지막 세그먼트=leaf header, accessorKey=full field). first-seen 순서 보존.
  - node 검증: 단일 dim·다중 dim 중첩·순서 보존·빈 입력·단일 세그먼트(그룹 없음)·중복 field.
- **G-2 SSRM additive 배선형(chromium ★end-to-end)**:
  - GetRowsRequest `pivotMode?/pivotCols?/valueCols?`(optional, 부재=기존 flat 동작) + GetRowsResult `pivotResultFields?`(서버 생성 field). serverSideController=pivot params 를 getRows 에 전달 + res.pivotResultFields 캡처→surface. useServerSideData `pivot?` 옵션 + `pivotResultFields` 노출. **core scroll-path 무수정**(block cache/epoch/materialize 불변).
  - **★발산**: mock datasource(pivotMode 시 피벗 행+fields 반환)→`<Grid>` 가 **서버-피벗 동적 컬럼(중첩 헤더)을 서버 값과 함께 렌더**(스크롤/로드 시). flat 모드 OFF byte-identical.

## In / Out
- **In**: 순수 buildServerPivotColumns+test+export + GetRowsRequest/Result additive 확장 + controller/hook pivot 배선 + 2-mode 스토리 + chromium.
- **Out(명시 — silent gap 금지)**:
  - **클라이언트 피벗 계산**: 서버가 피벗 수행(SSRM 계약). client 는 request 플래그+result-column 도출만(AG 모델). computePivot(in-memory)는 별개=무수정.
  - 피벗 + lazy group(rowGroupCols) **동시**: 두 optional 확장 독립, 스토리는 미혼용 = vN.
  - 피벗 값 집계 함수 의미론(서버 소관) · pivotResultFields 동적 변경 시 컬럼 재빌드 캐싱 = vN.

## ★ ❌ 닫힘 마커
- **Server-side pivoting = ✅**: additive SSRM pivot 계약 + 순수 컬럼 도출, end-to-end(서버-피벗 렌더). COMMERCIAL-GAP **Pivoting** 1 ❌→✅ → ❌14→13·✅242→243. reconcile 19/19·330.

## AC
G-1 buildServerPivotColumns 중첩 트리(node) · G-2 ★pivotMode datasource→동적 피벗 컬럼 렌더(chromium end-to-end) + flat OFF byte-identical.

## constraints
- grid-pro-serverside(Pro). 외부 dep 0. **LESS-006**: 렌더=chromium. 순수 map=node. **★core scroll-path 무수정**(block cache/epoch/virtualizer 불변, 기존 SSRM node 테스트 보존).
- additive optional(pivot* 미제공=기존 flat byte-identical). 기존 controller node 테스트 green 유지.

## 의존
grid-pro-serverside 내부(buildServerPivotColumns + types + controller + hook). story=useServerSideData(pivot)+Grid. 외부 0.

## 분류 (MASTER §2)
buildServerPivotColumns=**종결형**(순수 map). controller/hook pivot 배선=**배선형**(chromium).

## reuse-gate 결과 / 추측 0
재사용=MOD-22 SSRM 전체(block cache/epoch/controller/hook)·GetRowsRequest optional additive(groupKeys 패턴)·grid-core 중첩 ColumnDef. 신규=buildServerPivotColumns+pivot 계약 확장. 추측 0: AG SSRM pivoting(pivotResultFields 동적 컬럼)=1차. verified 부재.

## specify rubric (Full — 게이트 C)
- [x] Goal(buildServerPivotColumns map + SSRM additive end-to-end) **9/10** · [x] In/Out(client-pivot/pivot+group 혼용 Out) **10/10** · [x] AC(node 트리·서버-피벗 렌더·flat byte-identical) **10/10**
- [x] reuse-gate(MOD-22 SSRM·optional additive·build-vs-defer read) **10/10** · [x] constraints(core scroll-path 무수정·LESS-006) **10/10** · [x] 의존(내부, 외부 0) **9/10**
- [x] 추측 0(verified) **9/10** · [x] 분류(종결형+배선형) **9/10** · **합계 76/80 통과.**
