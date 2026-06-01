# implement rubric (게이트)

Goal 단위로 하나씩 — 매 Goal 후:

- [ ] `pnpm exec tsc --noEmit` 0 에러
- [ ] `pnpm build`(해당 패키지) 통과
- [ ] **constraints 준수** — CONSTRAINTS-INDEX 전수 (특히 C-001 optional peer, POL-TANSTACK)
- [ ] 외부 그리드 엔진 직접 도입 0 (TanStack 위 선언형)
- [ ] `state.json.<mod>.goals.<G>` = `done` 기록
- [ ] 변경은 spec 의 해당 Goal 에 추적 (범위 밖 변경 금지)
- [ ] 발행 패키지면 README/EULA/주석에 금지어(TOMIS/topvel/tw-framework/@tomis) 0, @topgrid 만
