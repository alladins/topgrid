# topgrid 개발 하네스 설계 (DEV-HARNESS-DESIGN)

> **위상**: `@topgrid` 신규 그리드 기능 개발을 **노우하우가 축적되는(compounding)** 규율로
> 진행하기 위한 하네스 설계. vibe-coding(산출만 남고 축적 0)을 탈피해, 매 개발 사이클이
> 재사용 자산(패턴·안티패턴·규칙·결정·rubric)을 키운다.
> **비-마이그레이션 전용**: TOMIS migration-harness / tw-grid harness 에서 *축적 엔진*만
> 수확하고, *마이그레이션 기계*(legacy 분석·parity·db 변환)는 배제한다.
> **단일 SSoT 연동**: `MASTER-HIERARCHY.md`(하이어라키 매트릭스)가 라이브 맵이며, 하네스의
> 모든 페이즈가 이를 읽고 갱신한다(§5 — 반드시 빠지지 않는 규약).

---

## 1. 설계 원칙

| # | 원칙 | 의미 |
|---|------|------|
| P1 | **capture 강제** | 사이클 끝에 교훈/패턴/안티패턴을 *반드시* 자산으로 떨어뜨린다. (B의 결손분) |
| P2 | **reuse 게이트** | 새 작업 전 기존 자산을 *반드시* 조회한다(duplicate-check, 80%+ 유사 시 신규 차단) |
| P3 | **promotion(N=2)** | 같은 교훈이 두 번 나오면 즉시 constraint/anti-pattern 으로 codify — 다시는 수동 판단 안 함 |
| P4 | **단일 SSoT** | `MASTER-HIERARCHY.md` 가 라이브 맵. 모든 페이즈가 읽고 쓴다 |
| P5 | **유기적 성장** | 빈 골격 + 시드 → 모듈마다 자람. 빅뱅 재구축 금지 |
| P6 | **추측 금지·근거 강제** | 경쟁 vendor 동작 = 1차 출처 인용, 코드 주장 = 실제 소스/빌드 검증 |

## 2. 수확 출처 (참고 — 개념만, TOMIS 파일 미접촉)

| 출처 | 수확(축적 메커니즘) | 배제 |
|------|------------------|------|
| TOMIS migration-harness | `/learn`(교훈→인프라화) · `/retro`(회고→promotion) · `optimization-scan`(반복→라이브러리화) · `duplicate-check`(재사용 게이트) · `adr-new`(trade-off 2+ 강제) · `promotion`(N=2) · checkpoint/resume | legacy-analyst · parity-checker · db-migrator · "AS-IS L0 인용" |
| tw-grid harness | rubric(specify/implement/verify 점수 게이트) · constraints(POL-*/C-*) · ADR 레저 · coverage/canonical 추적 | TOMIS 결합 · migration 제약 |
| 일반 best practice | pattern/anti-pattern 카탈로그 · ADR · Definition-of-Done · spec 템플릿 | — |

> 결정적 통찰: TOMIS 하네스는 **이미 노우하우-축적 철학을 구현**(`/learn`·`/retro`·promotion·
> duplicate-check·pattern catalog)하고 있었다. 재설계 = **축적 엔진은 살리고 마이그레이션
> 기계는 신규개발 엔진으로 교체**.

## 3. 아키텍처 — 4-페이즈 루프

```
 [reuse-gate] ─→ specify ─→ implement ─→ verify ─→ CAPTURE ─┐  (release)
   ↑ patterns/             constraints      ↑ anti-patterns   ↓ retro→lesson→promotion
   │ §3 조회                준수             drift 0/build      ↓ 새 패턴→patterns
   └──────────── 자산 성장 → 다음 모듈 더 빠르고 정확 ─────────┘
       매 페이즈는 MASTER-HIERARCHY 를 읽고, verify/capture 가 쓴다(§5)
```

각 페이즈의 **입력 / 게이트 / 산출 / 매트릭스 갱신**. **모든 모듈 run 은 §3.0 으로 시작한다(필수).**

### 3.0 context-load (phase 0 — 매 모듈/턴 시작 시 필수)
오케스트레이션 에이전트는 spawn 마다 stateless 다. 축적이 *먹여지려면* 매 run 이 자산을 먼저 로드해야 한다.
- 동작: `*-INDEX.md`(patterns/anti-patterns/constraints 인덱스) + `MASTER §3·§6` + `state.json` 로드.
- 산출: 현 컨텍스트(보유 패턴·안티패턴·규칙·진행상태). **이게 없으면 reuse-gate·promotion 이 "본 적 없는 채" 동작 → 축적 무효.**

### 3.1 reuse-gate (specify 전)
- 입력: 신규 모듈 의도. 게이트: `duplicate-check` — `PATTERNS-INDEX` + `MASTER §3` 에서 유사 기능 조회.
- 산출: 재사용 결정(80%+ 유사 → 기존 확장, 신규작성 차단 / 그 외 → 신규). 매트릭스: 조회만.

### 3.2 specify
- 입력: `§6` Goal/AC 시드 + `patterns/`(인덱스) + `constraints/` + `competitive-analysis.md`(경쟁 동작 1차 출처).
- 게이트: **specify rubric**(In/Out 명확, AC 측정가능, 추측 0). 산출: `specs/MOD-GRID-XX.md` + 분기 시 `decisions/ADR-NNN`.
- **매트릭스**: `§6` 상태 `계획 → spec 작성중`.

### 3.3 implement
- 입력: spec. 게이트: Goal 1개씩, 매 Goal 후 `tsc --noEmit` + build + `constraints/` 준수.
- 산출: `packages/` 코드 + `state.json` per-Goal 진행 갱신. 매트릭스: verify 에서 반영.

### 3.4 verify
- 입력: 코드 + spec. 게이트: **소스 대조 drift 0** + **`ANTIPATTERNS-INDEX` 전수 대조(시그니처 매칭)** + **verify rubric** + build.
- 산출: verify 결과 + 발견 gap. **매트릭스**: `§5.2` gap 기록.

### 3.5 CAPTURE (★ 핵심 — 기계적 게이트로 강제)
capture 는 *기능 산출이 없어 가장 건너뛰기 쉬운* 페이즈다. 따라서 **DoD 텍스트가 아니라 기계적 게이트**로 강제한다:
- **promotion 기계(N=2 자동 발화)**: 새 lesson 작성 전, 그 lesson 의 `signature`(예: `optional-peer-static-import`)
  로 `ANTIPATTERNS-INDEX` + `lessons/` 를 grep. **매칭 = 2번째 발생 → 즉시 `anti-patterns/AP-NNN`(또는
  `constraints/C-NNN`)로 승격**(수동 판단 X). 무매칭 = `lessons/LESS-NNN` 신규(`signature` 필드 필수).
  → 이게 verify(§3.4)의 "anti-patterns 대조"를 실제로 작동시키는 짝이다.
- 새 패턴 → `patterns/PAT-NNN` + 인덱스 1줄.
- **완료 게이트(§5.1)**: `state.json` 은 ①`lessons/LESS-NNN` 존재 ②`§3` 6컬럼 행(PAT-/AP- cross-link 포함)
  작성 ③인덱스 갱신이 **모두 충족돼야** 모듈을 `done` 으로 마킹. **미충족 → §6→§3 이관 불가 = 모듈은 시각적으로 미완료.**
  (capture 를 건너뛰면 모듈이 "안 끝난 것"으로 보이게 만들어 — 폴더만 추가된 vibe-coding 회귀를 차단.)
- **매트릭스(필수 산출)**: 모듈을 **`§6` → `§3` 이관**(6컬럼) + `§4` wiring 갱신. capture = 매트릭스 이관을 *생산하는* 페이즈.
- **측정 기록**: capture 가 `state.json` 에 effort/turn · 재사용 패턴 수 · anti-pattern 선제검출 수를 기록(§7).

### 3.6 release (선택)
- 0.x minor bump + npm 발행 + meta `@topgrid/grid` facade 갱신.

## 4. 축적 자산 스토어 (5종 + 보조) — 디렉토리/스키마

```
.claude/dev-harness/
├── patterns/        PAT-NNN.md   — 패턴명 / 문제 / 해법 / 적용 모듈 / 예시 / 관련 AP·C
│   └── PATTERNS-INDEX.md         — ★ 한 줄/항목 인덱스 (PAT-NNN | signature | 한 줄 요약)
├── anti-patterns/   AP-NNN.md    — 증상 / 원인 / 탐지법 / 올바른 형 / 최초 발견 모듈
│   └── ANTIPATTERNS-INDEX.md     — ★ 한 줄/항목 (AP-NNN | signature | 탐지 grep)
├── constraints/     C-NNN.md, POL-*.md   (+ CONSTRAINTS-INDEX.md)
├── decisions/       ADR-NNN.md   — 결정 / trade-off 2+ / 근거 / 영향  (+ ID-LEDGER.md)
├── rubrics/         specify.md · implement.md · verify.md — 페이즈 게이트 체크리스트
├── lessons/         LESS-NNN.md  — 교훈 + ★`signature` 필드(promotion dedup 키) + N 카운트
├── specs/           MOD-GRID-XX.md — 진행 중 정식 spec
└── state.json       — 모듈별 phase + per-Goal 진행 + done-게이트 충족여부(§5.1) + 측정지표(§7)
```

- **인덱스 파일(★)**: 스토어가 커지면 전수 열람이 느려져 *축적이 역전*된다(skim → 무용). 그래서
  specify/verify 는 개별 파일이 아니라 **`*-INDEX.md`(한 줄/항목)** 를 읽는다. 신규 항목은 파일 + 인덱스 1줄을 함께 쓴다.
- **`signature` 필드**: lessons/anti-patterns 의 dedup 키(예: `optional-peer-static-import`). promotion(§3.5)·
  verify 대조(§3.4)가 이 키로 grep 한다.
- 각 스토어 frontmatter(id/제목/상태/링크)로 상호 + `MASTER-HIERARCHY` 행과 ID cross-link(§5).

## 5. ★ 하이어라키 매트릭스 애드온 규약 (반드시 — 누락 금지)

`MASTER-HIERARCHY.md` 는 하네스의 **중앙 라이브 SSoT** 다. 하네스는 매트릭스를 *대체*하지 않고
*먹여 살린다*. 페이즈 ↔ 섹션 매핑:

| 매트릭스 섹션 | 누가 갱신 | 언제 |
|--------------|---------|------|
| `§6` 로드맵(계획) | specify 진입 | 상태 `계획→spec→구현중` |
| `§3` 구현 매트릭스(6컬럼) | **capture 완료** | 모듈 §6→§3 이관 |
| `§5.2` gap 표 | verify 발견 | drift/이슈 발견 시 |
| `§4` wiring 매트릭스 | capture | 새 패키지 관계 추가 |
| `§2` 택소노미 | specify/capture | 신기능 분류 시 참조, 필요 시 형 확장 |

**Definition-of-Done 에 "매트릭스 갱신 완료"를 포함한다 — 안 하면 모듈 미완료로 간주.**
자산 ↔ 매트릭스 cross-link: `§3`/`§5` 행은 적용 PAT-/AP-/C- ID 를 인용해, 매트릭스에서
자산으로, 자산에서 매트릭스로 양방향 추적이 된다.

### 5.1 완료 게이트 (state.json 으로 *기계적* 집행 — 텍스트 DoD 보강)

"매트릭스 갱신"을 선언으로 두면 ship-it 압력에 건너뛴다. 그래서 **모듈 `done` 마킹을 자산 존재로 묶는다**:

```
// state.json (모듈별)
"MOD-GRID-20": {
  "phase": "capture",
  "goals": { "G-1": "done", "G-2": "done" },     // 부분구현 추적(§10)
  "done_gate": {
    "lesson": "LESS-014",          // capture lesson 존재? (없으면 false)
    "matrix_row": true,            // MASTER §3 6컬럼 행 + PAT-/AP- cross-link 작성?
    "index_updated": true          // *-INDEX 갱신?
  },
  "metrics": { "turns": 6, "reused_patterns": ["PAT-003","PAT-007"], "ap_precaught": 1 }
}
```

- 세 `done_gate` 키가 **모두 truthy 여야** `phase: "done"` + `§6→§3` 이관 허용. 하나라도 false면 모듈은
  `§6` 에 `구현중`으로 남는다(시각적 미완료). → capture 스킵이 *눈에 보이게* 만들어 vibe-coding 회귀 차단.
- 운영자(에이전트/사람)는 모듈 마감 시 이 블록을 검증한다(자체 집행). 후일 slash-command 복원 시 동일 블록을 자동 체크하면 됨.

## 6. 시드 전략 (이번 세션 산출 재활용 — 첫날부터 축적이 보이게)

빈 골격이 아니라, **이번 세션이 이미 만든 원자재**로 시드한다:
- **anti-patterns 시드**: `G-vimport`(정적 optional-peer import → 모듈 로드 실패), `G3/G4`(재export
  `@deprecated` 태그 비대칭), `G1/G2`(stale "6→8" 카운트 주석), `G-readme14/G-jsdoc16`(문서-소스 drift).
- **patterns 시드**: `MASTER §2` 택소노미 7형 + `§4` wiring(registry side-effect 주입, peer 합성,
  license gate, headless hook + 선언형 wrapper).
- **constraints 시드**: "optional peer 는 동적 import 또는 required 선언", "재export deprecated 태그
  일관", TanStack 충실도(tw-grid POL 추출).
- **rubrics 시드**: git 이력의 tw-grid specify/implement/verify rubric 에서 신규개발 유효분 추출·정리.

## 7. 측정 — 축적이 실제 일어나는가 (state.json 지표)

지표는 장식이 아니다 — **capture(§3.5)가 매 모듈 마감 시 `state.json.metrics` 에 직접 기록**한다(미기록 시 §5.1 게이트 미통과). 모듈이 쌓이며 추세를 본다:

| 지표 | 기대 추세 | 의미 |
|------|---------|------|
| 모듈당 재사용 패턴 수 | ↑ | 패턴 카탈로그가 실제 재사용됨 |
| 모듈당 소요(effort/turn) | ↓ | 앞 모듈 자산이 다음을 가속 |
| anti-pattern 선제 검출률 | ↑ | verify 가 카탈로그로 사전 차단 |
| gap 재발률 | →0 | promotion 후 같은 실수 반복 0 |

## 8. 롤아웃 (유기적, 빅뱅 금지)

1. `.claude/dev-harness/` 골격(5 스토어 + 4-페이즈 정의 + rubrics) + **이번 세션 gap 15건 시드**.
2. git 이력 tw-grid rubric/constraint 에서 **신규개발 유효분만** 추출·정리해 얹기.
3. **P0 모듈 1개(`grid-sizing` 추천)를 4-페이즈 루프로 관통** → 끝나며 patterns/lessons 자동 축적,
   §6→§3 이관 → **축적이 실제로 일어남을 실측**.
4. 측정 → 조정.

## 9. 비-목표 (scope 경계)

- 마이그레이션(legacy 분석·parity·db 변환) 배제.
- TOMIS 파일 미접촉(개념만 참고). 옛 `@tomis`/TOMIS 결합 재도입 0.
- 빅뱅 500파일 재구축 금지 — 모듈마다 자라게.
- 하네스가 매트릭스를 대체하지 않음 — 먹여 살릴 뿐(§5).

## 10. 운영·집행 모델

### 10.1 운영자 (operator)
당분간 운영자 = **이 어시스턴트(에이전트 오케스트레이션)**. 따라서 집행은 *self-policing* — 파일(state.json
done_gate, 인덱스, signature)을 운영자가 읽고 검증한다(slash-command 도구 의존 X). 후일 `.claude/commands/`
로 slash 표면을 복원하면 **동일 파일/게이트를 자동 체크**하면 되므로, 설계는 그대로 도구화 가능하다.
→ 즉 지금은 "파일이 곧 규칙", 도구는 나중에 그 파일을 강제하는 얇은 껍데기.

### 10.2 weight-class (경량 vs 풀 루프)
모든 모듈에 풀 4-페이즈 의식을 강요하면 — 사소한 모듈에선 오버헤드가 작업을 압도해(vibe-coding 의 대칭
실패) 하네스가 "관료적"이라 버려진다. 그래서 **무게 등급**을 둔다:

| 등급 | 대상 | 루프 |
|------|------|------|
| **Lite** | 사소·MIT 편의(`grid-sizing`, alternating 등) | context-load → (간이)spec → implement → verify → **capture 는 유지**(lesson/매트릭스만, rubric 점수 생략) |
| **Full** | Pro·복합(`grid-pro-pivot`, `grid-pro-sheet`) | 4-페이즈 전부 + rubric 점수 게이트 + ADR |

→ **capture·매트릭스 갱신은 등급 무관 항상 필수**(축적이 목적이므로). 생략되는 건 rubric 점수·ADR 같은 *형식*뿐.

### 10.3 부분 구현 (partial)
모듈은 Goal 단위로 점진 완료된다(일부 Goal 먼저 ship). 규칙:
- 모든 Goal 이 `done` 이 되기 전까지 모듈은 **`§6` 에 `구현중 (n/m goals)`** 으로 남는다(state.json `goals` 가 진실).
- `§6→§3` 이관은 **전 Goal 완료 + §5.1 게이트 충족 시 1회**. 부분 상태를 §3 에 넣지 않는다(§3 = 완료 SSoT 불변).
- 단, 부분 단계에서 발견한 gap/lesson 은 즉시 §5.2 / lessons 에 기록(축적은 부분에서도 멈추지 않음).
