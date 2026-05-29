# Documented Deviation: Storybook story 파일 작성됐으나 Storybook 앱 미부트스트랩

**Occurrence count**: **2** (G-001 1차, G-002 2차 — 2026-05-14 same-day)
**Promotion threshold**: 3 occurrences → 신규 constraint 후보 (G-001 self-review note 기준)
**Goals**:
- MOD-GRID-07/column-drag/G-001 (origin, 1차)
- MOD-GRID-07/column-drag/G-002 (2차, 2026-05-14 same module same day)
**AC**: G-001 AC-008 / G-002 AC-006 (둘 다 C-25: Storybook story 1개)
**최초 날짜**: 2026-05-14
**최근 갱신**: 2026-05-14 (G-002 self-review)
**Status**: accepted-deviation (verifier 수용) — MOD-GRID-99-B/docs/G-002 에서 본격 부트스트랩 예정

---

## 사실 (Evidence)

### G-001 (1차, 2026-05-14)

#### 작성된 산출물
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/src/column-drag/useColumnDrag.stories.tsx` 실재 (Read 검증)
- 2 story export: `ColumnReorderDrop`, `WithPinnedGuard`
- 6 컬럼 + enableColumnReorder 시나리오 (verify-score AC-008 evidence)

### G-002 (2차, 2026-05-14 same-day)

#### 추가된 산출물
- 동일 파일 (`useColumnDrag.stories.tsx`) MODIFY — 3번째 story `PersistAndKeyboard` 추가 + `PersistKeyboardDemo` 컴포넌트.
- spec G-002 Section 12.3 L811: "Storybook 앱 미설정 상태 — G-001-storybook-bootstrap.md 동일 deviation 적용 (story 파일 작성 완료 = C-25 만족)" — G-001 deviation 명시적 재사용.
- implement-score `feedback.storybootstrapDeviation`: "PersistAndKeyboard story written to canonical path. Storybook app not bootstrapped — same deviation as G-001-storybook-bootstrap.md. C-25 satisfied by 'story file written' criterion."
- verify-score 는 AC-006 YES 처리 (acEvidence: "useColumnDrag.stories.tsx PersistKeyboardDemo component L200-303 + PersistAndKeyboard story export L309-313")

### Storybook 앱 부재
- `D:/project/topvel_project/topvel-grid-monorepo/apps/` 디렉토리 내용: `docs/` 만 존재 (apps/docs/package.json 한 개)
- `.storybook/` 디렉토리 부재 (Glob 검증)
- `storybook` / `@storybook/*` dependency 부재 — 작성된 stories.tsx 를 실행할 환경 없음

### Implementer 자가 보고 (implement-score L44)
> "Storybook app이 monorepo apps/에 미존재 (2026-05-14). 스토리 파일 canonical 경로에 작성 완료. Storybook 연동 후 자동 등록 예정"

### Verifier 자가 판단 (verify-score)
- AC-008 evidence: "useColumnDrag.stories.tsx 존재 (canonical 경로 packages/grid-features/src/column-drag/). 6 컬럼 (id/name/department/role/location/status, L42-49). 2개 story export (ColumnReorderDrop L172, WithPinnedGuard L181). title='grid-features/column-drag/useColumnDrag'."
- 즉 verifier 는 "파일 존재 + 시나리오 구조 적정" 으로 AC-008 YES 처리. 실행 가능성은 검증하지 않음.

---

## 수용 사유 (Acceptance Rationale)

C-25 ("Public API 문서화 의무") 의 의도는 **공개 API 시연용 story 작성** — 패키지 단위 산출물이 canonical 경로에 누락 없이 정의되어야 한다는 의미. monorepo 차원의 Storybook 부트스트랩은 별도 인프라 Goal (`MOD-GRID-99-B/docs/G-002`) 에 명시된 작업.

근거 — state.json L1207-1218:
```
MOD-GRID-99-B/docs/G-002:
  title: "Storybook (모든 패키지) — story 최소 1개/컴포넌트 + 대용량 시나리오"
  priority: P0
  status: pending
```

본 Goal 의 implementImpact: low + affectedUsageFiles: [] (사용처 0) 이라는 점에서, story 실행 환경 부재는 G-001 의 책임 범위가 아니다. story 파일이 canonical 경로에 작성됐으면 G-002 부트스트랩 시 자동 등록될 것이라는 implementer 의 가정은 합리적.

---

## 잔여 위험 (Residual Risk)

1. **C-10 / C-18 검증 deferred**: "1000행+ 대용량 시나리오 Storybook 1개" 의무가 G-001 story 에는 미포함 (열 6개 + 행 N개 기본 데이터). header DnD 가 row 가상화와 독립이라는 spec 인용으로 회피.
2. **story 컴파일 검증 불가**: tsconfig.json 의 `*.stories.tsx` exclude 패턴 (`packages/grid-features/tsconfig.json` G-001 추가) 으로 tsc 통과는 보장되나, JSX 컴파일 오류 / story API 사용 오류는 Storybook 부트스트랩 전 검출 불가.
3. **C-13 / C-17 시각 회귀 미적용**: low tier + affectedUsageFiles=0 으로 본 Goal 은 N/A. 그러나 후속 G-002 에서 키보드 이동 시 외관 회귀 가능성 있음 — Storybook 부트스트랩 후 시각 회귀 베이스라인 신설 필요.

---

## 후속 작업 (Follow-up)

- [ ] MOD-GRID-99-B/docs/G-002 착수 시 본 deviation 참조 — `useColumnDrag.stories.tsx` 가 부트스트랩 후 즉시 등록되는지 확인.
- [x] G-002 (영속화) 진행 시 동일 패턴 (story 작성 + 부트스트랩 deferred) 반복되면 본 finding 의 footprint 누적 기록. **→ 2026-05-14 G-002 2차 발생 기록 완료 (이 문서 갱신).**
- [ ] C-25 만족 기준 명문화 — 본 deviation 패턴이 G-001 단독 사례인지, 정책으로 승격할 패턴인지 retrospective (3 occurrences 도달 시 신규 constraint 또는 rubric 항목 정당화). **현재 2/3 — 다음 동일 패턴 발생 시 promotion 검토.**
- [ ] 다음 후보 trigger: MOD-GRID-08 G-001 또는 MOD-GRID-09 G-001 등 grid-features sub-package 의 Storybook story 작성 Goal — 3rd occurrence 시 C-33 (Storybook story 작성 기준: "file written" vs "executable") 신설 후보.

---

## 관련 자료

- implement-score: `.claude/tw-grid/artifacts/MOD-GRID-07/column-drag/G-001-implement-score.json` `feedback.storybookNoApp`
- verify-score: `.claude/tw-grid/artifacts/MOD-GRID-07/column-drag/G-001-verify-score.json` AC-008 acEvidence
- state.json: `.claude/tw-grid/state.json` L1207-1218 (MOD-GRID-99-B/docs/G-002)
- C-25 정의: `.claude/tw-grid/constraints.md` L254-262
