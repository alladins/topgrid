# 10-core — 핵심 원칙 (universal redirect)

본 카테고리는 모두 [`_shared/`](../../policies/_shared/INDEX.md) 로 SSoT 추출됨.

---

## C-1: 추측 코딩 금지

→ **SSoT**: [SHARED-QUALITY/§1](../../policies/_shared/code-quality.md#1-no-assumption-coding)
*요약*: 모르면 멈춤. 가정만으로 implement 금지.

**★ tw-grid 특화 — TOMIS 내부 기존 파일 MODIFY 시 보존 의무** (2026-05-14 G-004):
tw-framework-front 등 TOMIS 내부 기존 파일 수정 시 다른 무관 섹션(alias, plugins, config 등) 보존을 다음 둘 중 하나로 입증:
1. `git diff` 라인 수 + 보존 섹션 unchanged 확인
2. Read 도구 호출로 보존 섹션 + grep 키워드 인용 (무커밋 신규 프로젝트 상태)

C-1 (Read-then-Write) 의 자연스러운 확장. 검증 의무는 implement-rubric F-03 참조.

---

## C-3: 더미/Mock 데이터 금지

→ **SSoT**: [SHARED-QUALITY/§4](../../policies/_shared/code-quality.md#4-no-dummy-mock-data)
*요약*: `dummyData`/`mockData` 변수명 금지. Storybook story, 단위 테스트만 예외.

---

## C-4: TypeScript Strict (No `any`)

→ **SSoT**: [SHARED-QUALITY/§2](../../policies/_shared/code-quality.md#2-typescript-strict)
*요약*: `any` 0건 + `@ts-ignore` 금지 + implicit any 금지.

---

## C-5: CSS 신규 파일 금지 (Tailwind Only)

→ **SSoT**: [SHARED-QUALITY/§5](../../policies/_shared/code-quality.md#5-css-신규-파일-금지)
*요약*: `.css`/`.scss`/`.module.css` 신규 생성 금지. `clsx`/`cn` 유틸 사용.

---

## C-11: Coverage Verifier 독립성

→ **SSoT**: [SHARED-AGENT/§2](../../policies/_shared/agent-delegation.md#2-implementer-verifier-분리-의무)
*요약*: Verifier 는 별도 Agent 인스턴스. 각 YES/NO 에 증거 의무.

---

## C-12: 빌드 0 errors 필수

→ **SSoT**: [SHARED-BUILD](../../policies/_shared/build-commands.md) + [SHARED-QUALITY/§2.3](../../policies/_shared/code-quality.md#23-build-통과)
*요약*: `npx tsc --noEmit` 0 errors + `vite build` / `tsup build` / `pnpm -r build` 통과. `--skipLibCheck` 우회 금지.

---

## C-15: 모든 Stage 작업은 Agent 위임 의무

→ **SSoT**: [SHARED-AGENT/§1](../../policies/_shared/agent-delegation.md#1-모든-stage-작업은-agent-위임-의무)
*요약*: 메인 직접 작업 금지. tier 별 모델 차등 (high tier opus, medium/low sonnet, Coverage haiku).
