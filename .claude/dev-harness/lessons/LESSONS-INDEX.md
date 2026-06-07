# LESSONS INDEX

> capture(§3.5)가 추가. 각 lesson 은 `signature`(promotion dedup 키)를 가진다.
> 신규 capture 의 signature 가 이 표의 기존 행과 매칭되면 **N=2 → 즉시 AP/C 승격**(신규 lesson 작성 X).
> 형식: `LESS-NNN | signature | 한 줄 | 발생 | 상태`

| LESS | signature | 한 줄 | 첫 발생 | 상태 |
|------|-----------|-------|---------|------|
| LESS-001 | `public-identifier-contains-engine-substring` | 공개 export 이름에 차트/엔진/브랜드 lib 부분문자열 우연 혼입(예 `RangeChartSeries`⊃`echarts`) → 발행물 엔진 grep 신뢰도 훼손 | MOD-GRID-19 | lesson(N=1) |
| LESS-002 | `cross-package-react-major-split-blocks-dom-render` | workspace react 18/19 동시 설치 → **버전 불일치 합성**(pivot@18→core@19) 모듈만 node DOM 마운트 "Invalid hook call". **정밀화(MOD-24 G-2)**: grid-core 자체/정렬 합성은 react+react-dom 을 같은 pkg dir 서 resolve(단일 인스턴스)하면 **node 마운트 OK**(grid-core+floating 행 8/8 node 검증). storybook 은 *불일치 합성*에 한정 | MOD-GRID-18 | lesson(N=2; MOD-24 G-2 로 범위 정밀화) |
| LESS-003 | `inventory-before-specify-collapses-scope` | specify 전 기존 표면 인벤토리 → 'Full' 모듈이 대부분-재사용으로 축소(MOD-21: 3중 2 기존). 건너뛰면 에이전트가 있는 걸 재구현 | MOD-GRID-21 | lesson(N=3: +MOD-25,+MOD-24-G1 — 검증됨; reuse-gate 페이즈로 이미 운영화 → C-/AP- 승격 안 함) |
| LESS-004 | `pinned-dep-edition-feature-silent-noop` | pinned 의존성 edition 미지원 기능 호출 → throw 없이 산출물 미반영(silent no-op). "limited" 주석에 속지 말고 write→read 라운드트립으로 경계 확정·생존하는 것만 주장 (xlsx community `.s` strip, `.z`/`!cols` 생존 실측) | MOD-GRID-25 | lesson(N=1) |
| LESS-005 | `reuse-gate-no-seam-build-minimal-primitive` | reuse-gate 가 '재사용 계약 없음(seam 없음)' 반환 시 → host 의 *공개* 표면 위 **최소 자립 primitive** + 문서화된 한계. **host 패키지 수정 금지**(=scope escalation). [[PAT-006]]의 음화(계약 있음→컴파일 vs 없음→primitive). MOD-23 G-2: tracking 0 수정, 제네릭 command 스택 | MOD-GRID-23 G-2 | lesson(N=1) |
| LESS-006 | `node-fallback-blind-to-browser-measurement-gated-feature` | 호스트 측정(layout/scroll)에 의존하는 opt-in 기능은 node "안전 fallback"(ON≈OFF 마크업)을 통과해도 *실제 동작 미검증* — node 가 ON 경로를 실행조차 못 함. 첫 chromium 이 비동작 검출(table 전체폭 미설정→스크롤 죽음). 교정: experimental 표기 + chromium 단언은 **윈도 *이동*(동적)**을 보고 정적 count<N(vacuous) 금지 + 비-vacuity 앵커. byte-identity 는 회귀만, ON 정확성 아님 | MOD-GRID-27 G-2 | lesson(N=1) |
| LESS-007 | `ast-roundtrip-serialization-must-be-precedence-aware` | AST→텍스트 라운드트립 serializer(예 copy/fill translate)는 **연산자 우선순위/결합성 인지** 필수 — naive 중위 이어붙임은 `(A1+B1)*2`→`A1+B1*2` 로 의미 조용히 손상. 교정: prec(child)<prec(parent)→괄호 + 비교환(`-`/`/`) 우변 동일prec 도 괄호; `translate(0,0)` identity 를 *괄호식*으로 검증; translate 방출 토큰(#REF!)은 문법에 추가. 인접: 기대값=구현 아닌 *명세* 도출(B1+1col=C3≠D3) | MOD-GRID-40 G-2 | lesson(N=1) |
| LESS-008 | `keyed-graph-absorbs-new-dimension-via-key-namespacing` | keyed 의존그래프(순환/topo/recalc)에 새 주소 차원(시트·네임스페이스)을 더할 때 **그래프 재구조화 금지** — 키에 폴딩(qualified key)하면 알고리즘이 키-무관이라 교차차원 의존/순환이 그냥 흡수. 순수 리더(evaluate/extractRefs)가 보는 키를 불변으로, 기본 차원은 무접두(특성회귀 가드). 폴딩 전 표현(serialize/translate)은 별도 처리. **N=2 with MOD-40**($=키 밖 메타) → 승격 [[PAT-007]] | MOD-GRID-41 G-1 | lesson(N=2) → PAT-007 |
| LESS-009 | `ref-keyed-dnd-handlers-must-not-touch-datatransfer-directly` | dispatchEvent 로 검증할 HTML5 DnD 핸들러는 `e.dataTransfer` 직접 접근 금지 — 합성 drag 이벤트엔 dataTransfer 가 null 이라 `getData/setData` throw → `\|\| ref.current` 폴백 도달 전 핸들러 사망(드롭 no-op). **React ref 를 1차 진실**, dataTransfer 는 try-guard Safari 폴백. 드롭 발산은 "요소 이동"이 아닌 **소비 컴포넌트 반응**(그리드 재-피벗)으로. **N=2 with MOD-33**(row-reorder ref-keyed) → DnD 클러스터 표준 | MOD-GRID-64 G-2 | lesson(N=2) |
