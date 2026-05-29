# Finding: pnpm install 실행 미완료 (환경 의존)

**Goal**: MOD-GRID-99-B / G-001  
**Finding Type**: Documented Deviation (환경 제약)  
**Date**: 2026-05-15  
**Mapped EC**: EC-02 (pnpm workspace entryPoint 경로 오류 — `entryPointStrategy: 'packages'` 및 경로 검증 필요)  

---

## 현황

`apps/docs/package.json`에 Docusaurus + TypeDoc + plugin 7개 devDependencies를 추가했으나,
**`pnpm install` 실행은 본 Goal 완료 기준에서 제외**한다.

### 추가된 devDependencies

| 패키지 | 버전 | 라이선스 |
|--------|------|---------|
| `@docusaurus/core` | ^3.0.0 | MIT |
| `@docusaurus/preset-classic` | ^3.0.0 | MIT |
| `@docusaurus/types` | ^3.0.0 | MIT |
| `docusaurus-plugin-typedoc` | ^1.0.0 | MIT |
| `typedoc` | ^0.27.0 | Apache-2.0 |
| `typedoc-plugin-markdown` | ^4.0.0 | MIT |
| `react` | ^18.0.0 | MIT |
| `react-dom` | ^18.0.0 | MIT |

---

## 미실행 사유

1. **사용자 환경 의존**: `pnpm install`은 사용자 로컬 환경(Windows, pnpm >= 8.0.0 필요) 또는 CI/CD 파이프라인에서 실행해야 한다.
2. **C-12 조건 제한**: `pnpm install` 없이는 `npx tsc --noEmit` 실행 불가 (Docusaurus 타입 미설치). tsc 검증은 pnpm install 이후 사용자 또는 CI 책임.
3. **본 Goal 완료 기준**: `apps/docs/package.json` JSON 구문 무결성 + 설정 파일 구조적 정합성(TypeDoc entryPoints 13개 명시, failOnWarnings, docusaurus-plugin-typedoc wiring)을 본 Goal 완료 기준으로 한다.

---

## 개발자 조치 단계

1. monorepo root에서 `pnpm install` 실행
2. `pnpm --filter docs run docs:build` 실행 (AC-004 검증)
3. `apps/docs/build/api/` 디렉토리 생성 확인 (AC-002 검증)
4. TypeDoc `--failOnWarnings` 동작 확인 (AC-005 검증)

---

## implement-score JSON 매핑

```json
{
  "ac": "AC-002 / AC-004",
  "reason": "pnpm install 실행은 사용자/CI 환경 의존 — 본 Goal 범위 외",
  "finding": "findings/auto-fixed/MOD-GRID-99-B-G-001-pnpm-install-deferred.md",
  "resolution": "monorepo root pnpm install 후 pnpm --filter docs run docs:build 실행"
}
```
