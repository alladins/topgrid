# specify rubric (게이트 — Full 은 점수, Lite 는 체크만)

spec(`specs/MOD-GRID-XX.md`)이 다음을 만족해야 implement 진입:

- [ ] **Goal** 1문장 — 무엇을/왜 (경쟁 vendor 대응 명시)
- [ ] **In / Out** 명확 — 범위 경계, 차후 모듈로 미루는 것 표기
- [ ] **AC** 각 항목 **측정 가능**(검증 절차가 따라오게) — 모호어("잘 된다") 금지
- [ ] **reuse-gate 결과 반영** — 재사용한 PAT-/기존 모듈 인용, 중복 작성 아님 확인
- [ ] **constraints 적용 선언** — 관련 C-/POL- 명시 (특히 optional peer 시 C-001)
- [ ] **의존** — peer/dependency/optional 구분 명시 (AP-001 예방)
- [ ] **추측 0** — 경쟁 vendor 동작은 1차 출처, 미확인은 "확인 필요" 표기
- [ ] **분류** — MASTER §2 택소노미 7형으로 각 기능 분류
