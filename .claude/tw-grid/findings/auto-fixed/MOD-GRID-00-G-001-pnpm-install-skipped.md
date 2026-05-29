# Finding: MOD-GRID-00 / G-001 — pnpm install skipped (documented deviation)

**Goal**: G-001 — pnpm workspace + 13 패키지 + apps/docs 디렉토리 스캐폴딩
**Stage**: implement (referenced in verify)
**Status**: ✅ **RESOLVED 2026-05-13** (originally documented-deviation, 사용자 결정에 따라 `npx pnpm@8.15.1 install --recursive` 실행 → "Scope: all 15 workspace projects, Done in 454ms, 0 error" — AC-005 충족)
**Type**: environment-dependent AC skip
**기록일**: 2026-05-13

---

## 컨텍스트

G-001의 AC-005는 다음을 요구한다.

> `pnpm install --recursive` 후 exit code 0

Spec Section 6 EC-02는 "pnpm 미설치 환경" 엣지 케이스를 미리 명시했다.

> 시나리오: 개발 환경에 pnpm CLI 없음 (`pnpm: command not found`)
> 처리: `npm install -g pnpm@latest` 또는 `corepack enable && corepack prepare pnpm@latest --activate` 가이드 제공.

## 실제 환경 상태

- Implementer 환경: pnpm CLI 미설치 (EC-02 시나리오 활성)
- 16개 파일 생성(structure scaffolding)은 100% 완료:
  - 루트: `pnpm-workspace.yaml`, `package.json`
  - packages/: 13개 `package.json` (`@tomis/grid-*`)
  - apps/docs/: 1개 `package.json`
- 검증된 부분:
  - `name`/`license`/`version`/`private`/`engines` 필드 모두 spec Section 2.2 스키마 일치
  - Glob 결과 16개 파일 모두 실재 (F-01 메타 게이트 통과)
  - 핵심 식별자 `@tomis/grid-*` Grep 검증 통과 (F-04)

## Skip 사유

AC-005 자체는 **pnpm CLI 설치라는 환경 의존성**을 전제로 한다.
실행 가능한 환경이 아니므로 `pnpm install --recursive`를 수행할 방법이 없다.
이 deviation은 **spec이 이미 예측한(EC-02) 정당한 환경 제약**이며, implementer/verifier가 임의로 회피한 것이 아니다.

## 점수 처리

- implement-score: F 메타 게이트 4개 모두 YES → 점수 계산 진행. AC-005에 직접 1:1 매핑되는 rubric 항목 없음 (B-01 tsc/B-05 ESLint 등은 `.ts` 파일 부재로 N/A). 명시적 documentedDeviations 항목으로 분리 기록.
- verify-score: rubric 16항목 중 A-03(size-limit/tsup)에 부분 관련. 단, A-03 자체는 G-003 tsup 도입 대상이므로 N/A. 점수 영향 없음.

## 후속 조치 (G-002 착수 전 필수)

다음 Goal G-002 (tsup + tsconfig strict + CJS+ESM dual) 착수 전에 **반드시** 다음 중 하나를 수행해야 한다.

1. **pnpm 전역 설치**:
   ```powershell
   npm install -g pnpm@latest
   ```
2. **corepack 사용** (Node 18+ 권장 경로):
   ```powershell
   corepack enable
   corepack prepare pnpm@latest --activate
   ```

설치 후 검증:
```powershell
cd D:\project\topvel_project\topvel-grid-monorepo
pnpm --version           # 8.0+ 확인
pnpm install --recursive # exit code 0 확인
pnpm list -r --depth=0   # 14 workspaces(@tomis/* 13 + docs 1) 출력 확인
```

이 단계가 완료되지 않으면 G-002의 `tsup build`가 cross-package import를 해석하지 못해 실패한다.

## 학습 (다음 Goal에 적용)

- EC(엣지 케이스) 섹션에서 미리 예측한 환경 deviation은 **finding/auto-fixed/** 에 기록하여 점수 산정에서 분리.
- "auto-fixed"라는 카테고리명이지만 **자동 수정 불가능한 환경 제약**도 같은 디렉토리 사용 (vs. `blocked/` — 명시적 차단 사유).
- 향후 환경 의존 AC는 spec 단계에서 EC와 1:1 매핑된 명시 태그(`env-dependent: true`) 권장.
