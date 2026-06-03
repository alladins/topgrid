---
id: LESS-006
signature: node-fallback-blind-to-browser-measurement-gated-feature
first_seen: MOD-GRID-27 G-2 (grid-core column virtualization) 2026-06
status: lesson (N=1) — N=2 시 C/AP 승격 검토
related: [LESS-002, "MASTER §5.2 P27-1", "MOD-GRID-27 Commit C"]
---

# LESS-006 — node "안전 fallback" 검증은 *호스트 측정 게이트* 기능에 구조적으로 눈먼다

## 증상 (검증 가능 사실)
컬럼(가로) 가상화는 Commit B 에서 opt-in 으로 배선되고 **모든 node 게이트를 통과**했다:
- `computeColumnWindow` 순수 6/6 node, OFF byte-identical 7/7, "ON SSR 안전 fallback 확인".
- node `renderToStaticMarkup` 에는 DOM/scroll 측정이 없어 `columnVirtualizer.getVirtualItems()`
  가 비어 → `columnWindow = full window`(전 컬럼, pad=0). 즉 **node 에서 ON 은 OFF 와 사실상 동일**
  마크업을 낸다. 검증이 초록이어도 *실제 윈도잉 경로는 한 번도 실행되지 않았다*.

Commit C 의 **첫 chromium 실행이 기능 비동작을 즉시 검출**:
- 윈도잉은 DOM 에 서브셋만 렌더(virtualizer 가 estimate=getSize 로 계산) → "22 중 10 렌더"는
  스크롤 없이도 참 → **count<N 단언만으론 vacuous**.
- 그러나 가로 2200px 스크롤 후 윈도가 **이동하지 않았다**(`scrollWidth==clientWidth`, 윈도 라벨
  불변 `C01..C08`). 원인: Commit B 가 `<table>` 을 전체 컬럼 폭으로 안 늘림 → `table-layout:auto`
  가 22컬럼(각 140px 인라인)을 컨테이너 600px 로 압축(th 실폭 40px) → 넘칠 게 없어 스크롤 0.

## 왜 중요한가 (그리고 무엇이 아닌가)
- **이중 맹점**: (1) node 는 측정 host 가 없어 ON 경로를 *실행조차* 못 한다 — 초록 ≠ 동작.
  (2) 약한 브라우저 단언(`렌더 수 < N`)은 virtualizer 의 estimate-기반 서브셋 렌더만으로 충족 →
  스크롤이 죽어도 통과. **진짜 게이트 = 윈도가 스크롤에 *반응해 이동*하는가**(`C01..C08`→`C13..C20`).
- **제품 요구 발견(테스트 아티팩트 아님)**: 컬럼 가상화는 `<table>` 이 전체 컬럼 폭으로 존재해야
  pad px 가 실제 스크롤 폭을 만든다 → `table-layout:fixed` + `width=Σgetsize` 필요(ON 게이트). 없으면
  auto 레이아웃이 셀 너비를 무시하고 압축 → 윈도/pad 계산과 어긋남.

## 올바른 형 (how to apply)
1. **호스트-측정 게이트 기능은 "experimental"로 표기하고 브라우저 검증 전엔 done 선언 금지.**
   판별: 기능의 실제 출력이 node 에 없는 능력(layout/scroll/measure/IO)에 의존하는가? 그렇다면
   node 통과는 *fallback 안전성*만 증명할 뿐 *기능 동작*은 미검증. (MOD-27 은 prop JSDoc 에
   experimental + "SSR 미측정 시 전 컬럼 렌더(안전 fallback)" 명시 — 정직.)
2. **chromium 단언은 non-vacuous 하게: 정적 카운트가 아니라 *동적 거동*을 본다.** 윈도잉이면
   "스크롤 후 윈도 라벨 집합이 *바뀐다*"(이전 컬럼 빠지고 이후 컬럼 들어옴) + 비-vacuity 앵커
   (OFF 스토리는 전부 렌더=22)로 ON `<N` 을 의미있게 만든다. "수가 줄었다"만으론 부족.
3. **fallback 이 모든 케이스를 충실히 렌더하면 byte-identical 게이트가 ON 결함을 못 잡는다.**
   OFF byte-identity 는 *회귀 없음*만 증명; ON 정확성은 별 도구(browser)가 필요. 둘을 혼동 말 것.

## 탐지 (체크리스트)
- 이 기능의 ON 경로가 node verify 에서 OFF 와 다른 마크업을 내는가? **아니오 → node 는 ON 미검증.**
- 브라우저 단언이 스크롤/상호작용 *전후* 차이를 보는가? **아니오 → vacuous 위험.**
- (컬럼/행 가상화류) 스크롤 컨테이너의 `scrollWidth > clientWidth` 인가? 같으면 스크롤 죽음.

## 출처
MOD-GRID-27 G-2 Commit C. `packages/grid-core/src/Grid.tsx`(table-layout:fixed+width 게이트,
applyWidth 강제), `tests/visual/column-virtualization.spec.ts`(윈도 이동 단언 + OFF 앵커).
[[LESS-002]] 와 함께 "검증 도구를 결함 클래스에 맞춰라" 군(LESS-002=합성 마운트 도구, 본 건=호스트
측정 게이트 도구).
