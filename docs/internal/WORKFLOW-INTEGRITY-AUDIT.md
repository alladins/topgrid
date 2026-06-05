# dev-harness 워크플로우 무결성 감사 (MOD-18 ~ MOD-39)

> 2026-06 작성. 사용자 제기: "최근 모듈들이 정식 하네스 워크플로우(1:1 대조→목표→스펙→스펙 채점→구현→검증)를
> 거치지 않고 인라인 자체 구현된 것 아닌가." 본 문서는 **파일/git 1차 증거**로 페이즈별 준수 여부를 대조한 결과다.
> 추정 0 — 모든 판정은 디스크 상태·커밋 diffstat·state.json 자기기록에 근거한다.

## 1. 정식 워크플로우 (SSoT: `.claude/dev-harness/README.md`)

모듈 1개당 루프:
```
0. context-load   1. reuse-gate   2. specify(→specs/MOD-GRID-XX.md)
3. implement      4. verify       5. CAPTURE(필수)   6. release(선택)
```
weight-class: **Full**=4페이즈 전부+rubric+ADR / **Lite**=간이 spec·rubric 생략, 단 capture·매트릭스 유지.

## 2. 핵심 결론 (한 줄)

**사용자 의심은 "절반 맞다."** 정식 **specify 페이즈(설계 spec 산출물 + rubric 게이트)는 MOD-34~39에서 실제로 폐기**됐다(인라인 대체).
그러나 **implement·capture 페이즈는 끝까지 실재(real)** 이고, **verify 페이즈는 node-검증 가능 모듈(34~37)에서 본 감사가 실제 실행해 통과 확인**
(56 assertion green) — 실제 소스·Goal별 커밋이 전부 존재하며 **fabrication 증거는 없다.** 즉 워크플로우의 **앞단(형식적 설계·게이트)이
탈락**했고 **뒷단(구현·검증)은 유지**됐다. 단 verify 의 완전 무결성은 아니다 — §3.2·§5 의 단서(browser-only 미실행분 + 기존 known-broken 흔적) 참조.

## 3. 페이즈별 준수 매트릭스 (증거 기반)

| 모듈 | 설계 spec 파일 | reuse-gate | implement(실코드) | verify(실테스트) | CAPTURE(§3행+lesson) |
|---|---|---|---|---|---|
| **MOD-18 ~ 33** (16개) | ✅ 전부 존재(`specs/MOD-GRID-18~33.md`, 44~134줄) | ✅ | ✅ | ✅ | ✅ |
| **MOD-34 ~ 39** (6개) | ❌ **전무** | 🟡 인라인 | ✅ | ✅ | ✅ |

### 3.1 specify 폐기 — 하드 증거
- 디스크: `specs/`에 MOD-GRID-18.md ~ 33.md만 존재. **MOD-34/35/36/37/38/39 spec 파일 0건.**
- state.json 자기기록(자백):
  - MOD-34 `spec`: "재감사 델타 + advisor 시퀀스(**specs 미작성, 인라인 진행**)"
  - MOD-35 `spec`: "**인라인 진행**(advisor 모듈 결정)"
  - MOD-36 `spec`: "**인라인**(advisor: getRowId=keystone)"
  - MOD-37/38/39 `spec`: `—` (필드 자체 없음)

### 3.2 implement·verify 실재 — 하드 증거 (spec 없는 6개 모듈 커밋 diffstat)
| 모듈 | 실제 소스 | node 단위테스트 | Playwright 시각테스트 |
|---|---|---|---|
| 34 chart | `chartScale.ts`(185)·`RangeChart.tsx`(206)·`ChartCard.tsx`·`SparklineCell.tsx`·`seriesFromMatrix.ts` | `chartScale.test.ts`·`seriesFromMatrix.test.ts` | `range-chart`·`range-chart-g2`·`chart-card`.spec.ts |
| 35 selection | `rowClickSelection.ts`(74)·`CheckboxColumn.tsx` | `rowClickSelection.test.ts` | `grid-row-click-select`·`grid-select-all-indeterminate`.spec.ts |
| 36 identity | `computeChangedCells.ts`(52)·Grid.tsx·buildTableOptions | `computeChangedCells.test.ts` | `grid-cell-flash`·`grid-cell-tooltip`·`grid-row-identity`.spec.ts |
| 37 sorting | `localeSort.ts`(34)·`sortNulls.ts`(34) | `localeSort.test.ts`·`sortNulls.test.ts` | `grid-locale-sort`·`grid-null-placement`·`grid-always-multisort`.spec.ts |
| 38 col-menu | `ColumnMenu.tsx`(125) | — (browser-only 정직) | `grid-column-menu`.spec.ts |
| 39 row-pin | `Grid.tsx`(renderDataRow)·`RowPinButton.tsx`(69) | — (browser-only 정직) | `grid-row-pinning`.spec.ts |

모든 Goal(G-1/G-2/G-3)이 **개별 커밋**으로 증분 코드 변경을 담는다. → 구현은 진짜다.

### 3.3 verify 실행 검증 (본 감사가 직접 run — 파일 존재 ≠ 통과)
> 파일이 있다는 것만으로 "verify real"을 주장하는 것은 본 하네스가 잡으려는 vacuity(LESS-006) 그 자체다. 그래서 실제 실행했다.
- **node spine 실행·전수 통과 (MOD-34~37, `node --experimental-strip-types`)**:
  chartScale **12** · seriesFromMatrix **7** · rowClickSelection **11** · computeChangedCells **7** · localeSort **8** · sortNulls **11** = **56 assertion green**.
  (localeSort 는 accented 'é' 가 code-point 정렬과 **달라야** 통과하는 non-vacuous 설계 — 통과 = 실로직 검증.)
- **MOD-38·39 = browser-only** (node 테스트 없음, 본 매트릭스대로): Playwright `*.spec.ts` 산출물은 존재하나 **본 감사에서 미실행**
  (storybook 빌드+chromium 필요). → **artifact-verified, not-executed-in-this-audit** 로 표기. 무실행을 통과로 간주하지 않는다.
- **기존 known-broken/inert 흔적(state.json 자기기록)** — verify 가 균일 green 이 아님의 증거:
  - MOD-29: `tests/visual/storybook.spec.ts` playwright 1.60 API drift + baseline 0 → **전수 fail**(범위 외로 미수리 기록).
  - MOD-28 active-cell 링 = Tailwind outline class → **Tailwind-less storybook/비-Tailwind 소비자서 inert**(MOD-29 가 "unverified ship" 으로 지적).

### 3.4 MASTER-HIERARCHY 문서층 — §3(개발 후)는 완전, §6(개발 전)은 MOD-28 부터 중단 (2026-06-06 추가)
> CAPTURE 페이즈는 "MASTER §6→§3 이관"을 요구한다. 두 층을 분리 검사한 결과 **열화가 specify 보다 더 일찍 시작**됐다.
- **§3 기능 매트릭스(개발 *후* 산출)**: MOD-18~**39 전부** 6컬럼 표+소스+수확 문단 완비. ✅ **충실**(34~39도 이전 동급).
- **§6 로드맵/스케치(개발 *전* 정리)**: §6.1 테이블·§6.2 Goal/Scope/AC 스케치가 **MOD-18~27 까지만**. **MOD-28~39(12개) 부재**
  였다 — §6 intro 가 "다음 로드맵은 COMMERCIAL-GAP-ANALYSIS.md 에서 도출"이라 적고 **MASTER §6 갱신을 MOD-28 부터 중단**.
- **★3층 열화 타임라인(정밀)**: ① **MASTER §6 로드맵 = MOD-28 중단**(가장 먼저) → ② **specs/ 설계 스펙 = MOD-34 중단** →
  ③ **§3 기능 매트릭스 = MOD-39 까지 유지**(중단 없음). 즉 "개발 전 정리(계획)"가 "설계 스펙(specs)"보다 6모듈 먼저 빠졌다.
- ✅ **시정 완료(2026-06-06)**: §6.1 에 MOD-28~39 12행 소급 등재(`구현됨(→§3)`+출처=COMMERCIAL-GAP) + §6.2 에 12 스케치(§3
  역참조, SSoT 중복 회피) + §6 intro 노트 갱신 → **MASTER 로드맵 = 완전한 이력 원장 복원**.

## 4. "스펙 채점(rubric 점수)"에 관한 별도 발견

사용자가 기억하는 **"스펙을 검정하여 점수를 매기고"** 단계의 실체:
- `rubrics/specify.md`는 **게이트가 정의돼 있다** — 헤더가 명시: "Full 은 **점수**, Lite 는 체크만"(8항목 체크리스트 본문).
  즉 **Full 모듈 정량 채점 게이트는 설계상 존재**했다. (사용자 기억이 틀린 게 아니다.)
- 그러나 specs·state.json **어디에도 실제 숫자 rubric 점수가 기록된 흔적이 없다**(전수 grep). **채점 대상이어야 할
  Full 모듈(18·22·26·30·31·32)조차 점수 산출물 0건.** → **"정의됐으나 증거 없음(defined-but-never-evidenced)".**
- ⚠ 파일 증거만으로는 **"애초에 채점 안 함"** vs **"대화 중 채점했으나 파일로 영속화 안 함"** 을 구분할 수 없다 —
  의도는 단정하지 않는다. 확실한 것은: **게이트는 정의됐고, 어떤 모듈도 점수를 산출물로 남기지 않았다.**

## 5. 종합 판정

1. **무결성(fabrication) 측면**: 깨끗하다. 22개 모듈 전부 실제 코드+커밋 존재, spec-없는 4개 모듈 node spine 56 assertion
   **실행·통과 확인**. 날조 증거 0.
2. **프로세스 일관성 측면**: **단계적 열화.** ① MASTER §6 로드맵(개발 전 정리)=**MOD-28 중단** → ② specs/ 설계 스펙=
   **MOD-34 중단** → ③ §3 기능 매트릭스(개발 후)=유지. "개발 전 계획→설계 스펙" 앞단이 차례로 빠지고 "개발 후 기록"만
   남음. **둘 다 2026-06-06 소급 복원**(§6 12행+12스케치 / specs 6 백필). 추적성 공백 메움.
3. **verify 완전성**: node-검증 모듈은 green이나 **균일하지 않다** — MOD-38/39 browser-only 분은 본 감사 미실행,
   기존 storybook.spec 전수 fail·MOD-28 inert-ring 흔적 존재(§3.3). "검증됐다"는 node-spine 범위에 한정.
4. **rubric 정량 채점**: 게이트는 정의됐으나(Full=점수) **어떤 모듈도 점수를 영속화하지 않음**(defined-but-never-evidenced).
   "안 했다" vs "했으나 미기록"은 파일로 판별 불가.

## 6. 시정 권고 (선택)

- (A) ✅ **완료(2026-06-06) — 소급 spec 백필**: MOD-34~39 6개 `specs/MOD-GRID-34~39.md` 작성(state.json·git·MASTER §3
  재구성). **각 파일에 "소급 작성" 헤더 명시**(사전 계약 위조 금지 — 실제 구현·검증 기록임을 표기). state.json spec 필드도
  새 파일 참조 + 원래 "인라인" 이력 보존으로 갱신. **디스크 spec 커버리지 18~39 = 22/22.** 저위험·문서 작업.
- (A2) ✅ **완료(2026-06-06) — MASTER §6 로드맵 이력 복원**: §6.1 에 MOD-28~39 12행(`구현됨(→§3)`+출처=COMMERCIAL-GAP) +
  §6.2 에 12 스케치(§3 역참조, SSoT 중복 회피) + §6 intro 노트 갱신. → MASTER 로드맵 = 완전한 이력 원장(§3.4 참조).
- (B) **차기 모듈 게이트 복원**: 향후 모듈은 implement 진입 전 spec 파일 + §6 로드맵 등재 필수화(README 게이트 재적용).
- (C) **rubric 정량화**(원할 경우): specify 체크리스트를 8/8 점수로 명시 기록하도록 `verify` done_gate에 추가.

- (D) **browser-only verify 실집행**: MOD-38/39 + 전 chromium 스펙을 storybook 빌드→playwright 로 실제 1회 돌려
  state.json 의 "chromium N/N" 주장을 영속 검증(known-broken storybook.spec 수리 포함). 중위험·인프라 작업.

> 본 감사는 release 전에 수행됐다. **fabrication(날조)은 발견되지 않았다.** 다만 (1) 프로세스 추적성 공백(specify 폐기),
> (2) browser-only verify 미실행분, (3) rubric 점수 미영속화는 사실로 남는다. **발행 진행 여부와 시정(A~D) 채택은
> 사용자 결정 사항** — 본 감사가 이전의 "지금 발행" 답변을 자동 승계하지 않는다(그 답변은 본 우려 제기 이전 시점).

## 7. 독립 검증 — "테스트 통과 ≠ 목표 로직" (2026-06-06, 사용자 요청)

> 사용자 지적: 구현과 함께 짠 테스트는 *목표*가 아니라 *구현된 것*을 확인하는 **자기확인 회로**다(§4 의 backfill spec 도
> 구현 역산이라 순환). 그래서 **요구사항(경쟁 그리드 동작)에서 독립적으로 도출한 adversarial 케이스**로 실제 구현 소스를
> 대조해 "구현이 목표 로직과 얼마나 어긋나는가(gap)"를 측정했다. 샘플 3개(체계 붕괴 구간 = MOD-34 차트 이후).

### 7.1 방법
요구사항→독립 스펙(AC)→구현 역산 아닌 **요구 도출 테스트**→실제 소스 실행→갭 분류. 순수 코어 한정(node 실행 가능분).
샘플: **MOD-34**(chartScale 값→픽셀), **MOD-36**(computeChangedCells 정체성 diff), **MOD-37**(localeCompare·blank 정규화).

### 7.2 결과 — 순수 코어 로직 갭 = **0 / 25 독립 케이스**
- **MOD-37 localeCompare**: ✅ é 가 e·f 사이(비공허: code-point 이면 é>z 인데 locale 은 é<z)·numeric a2<a10·antisymmetric.
- **MOD-37 isBlank/blankToUndefined**: ✅ 0/false 는 blank 아님(falsy 버그 차단)·''/공백/null→blank·0 보존.
- **MOD-36 computeChangedCells**: ✅ 편집=그 셀만·재정렬=0(정체성)·제거행 제외·**키 충돌-안전(분리자=NUL ` `, 공백 포함
  복합 id 도 비충돌)**.
- **MOD-34 chartScale**: ✅ niced 도메인 ⊇ 데이터·tick max→plot.top·0→bottom·**데이터 max(비-tick)는 축 *내부* 정확 배치**·
  단조·NaN gap 인덱스 보존·flat 도메인 중앙(÷0 없음)·bandScale 균등.
→ 사용자가 우려한 "구현은 됐는데 목표 로직과 다름"은 **이 샘플의 순수 코어에서 발생하지 않았다.** 로직 품질 높음.

### 7.3 ★감사자 자기교정 (정직성 — verify-우선의 실증)
- 본 감사가 처음 MOD-36 분리자를 "주석=NUL ↔ 코드=공백, 충돌 버그"로 **오판**했다. 원인: **Read 도구가 NUL(` `)을
  공백으로 렌더링**. **직접 바이트 검사(`charCodeAt`=0)로 NUL 확정** → 코드는 주석대로 충돌-안전. **오탐 철회.**
  (교훈: 감사조차 "추정 말고 실행/검사" 가 필요 — 사용자가 강조한 바로 그 원칙.)
- **유일한 실 발견(경미)**: MOD-34 원 모듈 테스트가 "max→top pixel" 로 서술하나, 실제(정확)는 "데이터는 niced 축
  *내부* 배치". 자기확인 테스트가 tick-정렬 픽스처라 부정확 서술을 통과시킴 = **자기확인이 spec-driven 보다 느슨함의
  소규모 실증**(로직 결함 아님, 서술 정밀도 갭).

### 7.4 잔여 리스크 (정직)
독립 검증은 **순수 코어(node)만** 커버했다. **미검증 표면 = 실 리스크**:
- **browser/wiring 층**: 차트 실렌더(RangeChart)·flash effect 배선·MOD-38/39 **전부 browser-only**(순수 코어 0). 여기가
  자기확인 chromium 의 위험이 큰 곳이며 본 독립 검증이 닿지 못함.
- 샘플 3개(가장 강한 층). 비-exhaustive. verify 비균일(storybook.spec known-broken·MOD-28 inert-ring).
→ **결론**: 샘플 순수 코어는 목표 로직에 충실(갭 0). 그러나 spec-first 프로세스가 가장 값졌을 곳 = **wiring/browser 층**이며,
  이 층의 독립 검증(시정 D: storybook+playwright 실집행 + spec-first 재작성)이 진짜 잔여 작업이다.
