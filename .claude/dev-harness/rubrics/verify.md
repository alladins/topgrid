# verify rubric (게이트)

구현 완료 후, capture 진입 전:

- [ ] **소스 대조 drift 0** — spec/AC ↔ 실제 export·동작 1:1 (추측 아닌 소스 근거)
- [ ] **ANTIPATTERNS-INDEX 전수 대조** — 각 AP 의 탐지 grep 을 신규 코드에 실행, 위반 0
      (특히 AP-001 optional-peer 정적 import — chart/sheet 등 외부 lib 모듈 필수)
- [ ] build + (가능 시) 동작/시각 검증
- [ ] 발견 gap → **MASTER §5.2** 에 기록(검증가능 사실 vs 원인추정 구분)
- [ ] 신규 export 표면 ↔ `index.ts` 정합 (누락/stale 0)
- [ ] 발행 dist `.d.ts` 금지어 0
