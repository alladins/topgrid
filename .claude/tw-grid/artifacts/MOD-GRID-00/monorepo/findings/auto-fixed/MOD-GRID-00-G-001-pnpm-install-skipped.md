# Documented Deviation: pnpm install 스킵

**Goal**: MOD-GRID-00 / G-001  
**발생일**: 2026-05-13  
**유형**: EC-02 (pnpm 미설치 환경)  
**심각도**: low (구조 생성 완료, 설치만 미실행)

## 상황

`pnpm --version` 실행 결과 `pnpm: command not found` — 개발 환경에 pnpm CLI 미설치.

## 영향

- 16개 파일 생성: 완료 (pnpm과 무관)
- `pnpm install` 실행: 스킵 (AC-005 미충족)
- workspace symlink 생성: 스킵 (pnpm install 선행 필요)

## 해결 방법 (개발자 실행 필요)

```powershell
# 방법 1: npm으로 pnpm 설치
npm install -g pnpm@latest

# 방법 2: corepack 사용 (Node 18+ 내장)
corepack enable
corepack prepare pnpm@8.15.0 --activate

# 방법 3: 같은 드라이브로 store 이동 (Windows cross-drive 최적화)
pnpm config set store-dir D:\.pnpm-store

# 설치 후 실행
cd D:\project\topvel_project\topvel-grid-monorepo
pnpm install
pnpm list -r --depth=0  # 14 workspaces 확인
```

## 참조

- Spec Section 6 EC-02
- Spec Section 9 의존성
- Spec Section 12 V-02

## 다음 Goal 조치

G-002 착수 전 pnpm 설치 및 `pnpm install` 완료 필수.  
AC-005 (`pnpm install --recursive` exit code 0) 미충족 상태.
