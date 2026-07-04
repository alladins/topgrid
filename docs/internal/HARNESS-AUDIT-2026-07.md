# 하네스 엔지니어링 감사 (2026-07-04)

> 목적: 현행 dev-harness 를 외부 레퍼런스(Anthropic 공식 8소스 + SWE-agent/Aider/OpenHands +
> 커뮤니티 compounding engineering)와 대조 — 무엇이 이미 충분하고, 무엇이 누락됐는지 재점검.
> 개선 적용은 별도 승인 후(리스트 하단).

## 1. 현행 아키텍처 실사

**스택**: Claude(Opus 계열) 메인 루프 + 서브에이전트 위임(advisor 판단·Plan 설계·general-purpose 조사/번역)
+ 인간 게이트(npm publish·git push) + 유저 메모리(MEMORY.md) + SESSION-HANDOFF.md(세션 간 아티팩트).
모델 내부 아키텍처는 비공개 — 엔지니어링 대상은 모델을 감싸는 하네스 층이다.

**dev-harness (.claude/dev-harness/)**: 4-페이즈 루프(context-load→reuse-gate→specify→implement→verify→CAPTURE),
자산 스토어 6종(patterns 7·anti-patterns 4·constraints 4·ADR 8·lessons 11[signature dedup]·rubrics 3·specs 55),
state.json(54모듈 MOD-18~72, done_gate 기계 집행, metrics), MASTER-HIERARCHY SSoT, promotion N=2,
weight-class Lite/Full, policies/_shared(Implementer↔Verifier 분리·drift-spec·supersession ledger).

## 2. 강점 — 이미 공식 권고와 일치 (재발명 불요)

| 우리 것 | 일치하는 외부 권고 |
|---|---|
| SESSION-HANDOFF.md 아티팩트 핸드오프 | Anthropic S3 "컴팩션 아닌 구조화 파일+리셋" — **정확히 일치** |
| state.json (JSON 상태) | S2 "JSON은 모델이 덮어쓸 확률 낮음" — 이미 JSON |
| CAPTURE 강제 + promotion N=2 | compounding engineering "교훈→규칙 승격"과 동형 |
| signature dedup + *-INDEX 한줄 인덱스 | progressive disclosure 원리 |
| weight-class Lite/Full | S6 "노력을 복잡도에 스케일링" |
| drift 0·build 게이트·증거 기반 verify | S1 "검증 없인 looks-done 이 유일 신호" |
| advisor/Plan 서브에이전트 위임 | S1 "조사·검증은 서브에이전트로" |
| 발행·push 인간 게이트 | 파괴적 행동 인간 승인 원칙 |

**결론(정직)**: 축적 엔진(capture·promotion·state·handoff)은 외부 최고 수준과 대등하거나 앞선다.
54모듈 실증 완료. 갭은 엔진이 아니라 **집행 층(훅)·컨텍스트 로드 층(CLAUDE.md·트리거 주입)·평가 위생(자기채점)** 에 있다.

## 3. 갭 진단 (외부 대조로 드러난 누락)

| # | 갭 | 근거 레퍼런스 | 위험 |
|---|---|---|---|
| G1 | **프로젝트 CLAUDE.md 부재** — 세션 컨텍스트가 유저 메모리(이 계정 전용)+HANDOFF에만 의존 | S1 CLAUDE.md 계층("지우면 실수하는 것만" ~50줄) | 다른 환경/운영자에게 하네스 비가시. 빌드 명령·게이트·마스킹 규칙이 산문 기억에 의존 |
| G2 | **결정론적 훅 0** — 모든 규칙이 advisory 산문 | S1 "CLAUDE.md=advisory, hooks=deterministic" | ★마스킹 재노출(XX Grid/xxxx)·ledger/.private.key 오커밋·위험 명령이 규율에만 의존 |
| G3 | **트리거 기반 지식 주입 없음** — lessons/AP 로드가 수동 규율(context-load) | OpenHands microagents·S1 skills | 자산 11+개가 커질수록 "안 읽고 지나감" — 축적 역전 |
| G4 | **세션 시작 프로토콜 비스크립트** — §3.0 이 산문 | S2 세션 시작 프로토콜(스크립트) | 세션마다 로드 품질 편차 |
| G5 | **verify 자기채점 잔재** — rubric 을 작업 에이전트가 채점한 사례 다수 | S3 Generator/Evaluator 분리+회의주의 주입, S1 "작업한 에이전트가 채점 금지" | 관대 편향(S3: "평범한 결과도 자신 있게 칭찬") |
| G6 | **역방향 압력 규칙 없음** — 규칙은 늘기만 함 | context-rot(95%→60%)·"도구로 강제 가능하면 산문 금지" | 규칙 비대화→중간 규칙 무시 |
| G7 | **컴팩션 보존 지시·2회 교정 리셋 규칙 없음** | S1 "compact 시 보존 지시 가능"·"2회 교정 실패=오염, 리셋" | 컴팩션 후 게이트/마스킹 규칙 유실 가능 |
| G8 | **낡은 스캐폴딩 정기 점검 없음** | S3 "모델 개선 시 하네스 단순화 테스트" | 형식 오버헤드 잔존(Lite 등급이 부분 해결) |
| G9 | 위임 4요소 템플릿 미문서화(objective/출력형식/도구/경계) | S6 | 실무론 하고 있으나 codify 안 됨 — 낮음 |

## 4. 참조 소스 (확인 2026-07-04)
Anthropic: code.claude.com/docs/en/best-practices · effective-harnesses-for-long-running-agents ·
harness-design-long-running-apps(2026-03) · effective-context-engineering · building-effective-agents ·
multi-agent-research-system · swe-bench-sonnet · writing-tools-for-agents · hooks-guide.
오픈소스: SWE-agent ACI(arxiv 2405.15793 — lint-before-apply 가드레일) · Aider(repo map·CONVENTIONS.md·자동 lint/test 루프) ·
OpenHands(이벤트 스트림·microagents 트리거 주입). 커뮤니티: Every compounding engineering ·
context-rot(research.trychroma.com) · CLAUDE.md 비대화 처방(~50-60줄, alexop.dev).

## 5. 개선 제안 리스트 (승인 후 적용 — 아래는 계획만)

**A. 즉시(저비용·고효과)**
- A1. 프로젝트 CLAUDE.md 신설(~50줄): 빌드/테스트 명령·인간 게이트·★마스킹 규칙·하네스 진입점(context-load)·컴팩션 보존 지시. "지우면 실수하는가" 기준으로만.
- A2. 훅 도입(.claude/settings.json): ①PostToolUse(Edit|Write)=**마스킹 워드 자동 검출**(XX Grid/xxxx 재노출 차단 — 프로젝트 고유 리스크 정조준) ②PreToolUse=ledger.csv/.private.key 보호+파괴 명령 차단 ③SessionStart(compact)=핵심 규칙 재주입.
- A3. 세션 시작 프로토콜 1스크립트화(git log+HANDOFF §0+state 요약) → CLAUDE.md에서 지시.

**B. 하네스 규약 개정(중기)**
- B1. verify 자기채점 금지 명문화 — rubric 채점=fresh-context 서브에이전트+회의주의 프롬프트+"정확성·명시 요구사항 gap만" 스코프 제한(DEV-HARNESS-DESIGN §3.4 개정).
- B2. 역방향 압력 원칙 P7 추가 — "규칙 추가 전: ①훅/도구로 강제 가능한가 ②기존 규칙 1개 삭제 가능한가" (capture 체크리스트에 편입).
- B3. 컨텍스트 위생 규칙 — 2회 교정 실패=리셋(HANDOFF 갱신 후), 무관 작업 혼합 금지.

**C. 선택(효과 확인 후)**
- C1. lessons/AP 의 트리거 주입화(skills 또는 signature→파일 매핑) — 자산 20+개 도달 시.
- C2. 분기 하네스 prune 의식 — 규칙 절반 삭제 시도 테스트(S3 "모델 개선 시 단순화").
