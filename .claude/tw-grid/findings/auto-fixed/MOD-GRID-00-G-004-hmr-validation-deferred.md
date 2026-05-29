# Finding: MOD-GRID-00-G-004 — HMR Validation Deferred (EC-03)

**Goal**: G-004 — Changesets + ESLint flat config + tw-framework-front workspace alias  
**Module**: MOD-GRID-00  
**Finding Type**: documented-deviation (ADR-003)  
**Severity**: low  
**Status**: deferred-to-G-005  
**Date**: 2026-05-14

---

## EC 매핑

**EC-03**: `tw-framework-front pnpm dev` 실행 환경 미구비 — 개발 서버 미실행 또는 pnpm 미설치 환경 → HMR 검증 불가.

**AC 매핑**: AC-005 (HMR 반영)
- AC-005는 환경 의존 (ADR-003) → **N/A (분모 제외)**
- vite.config.ts alias 경로의 Read-based 정적 검증으로 AC-004 대체 (파일 경로 실재 확인)

---

## 편차 상세

### 수행한 작업 (정적 검증)
- `tw-framework-front/vite.config.ts` resolve.alias에 `@tomis/grid-*` 13개 alias 추가 완료
- 각 alias 경로 (`../../topvel-grid-monorepo/packages/*/src`) → PowerShell `Get-ChildItem` 로 src 디렉토리 실재 확인 완료 (13개 전 존재)
- 기존 `'@'` alias + plugins(react, tailwindcss) + server.proxy + define 완전 보존 확인 (AC-004 통과)

### 수행하지 않은 작업 (환경 제약)
- `pnpm -F tw-framework-front dev` 실행 — 개발 서버 기동 불가
- `@tomis/grid-core` import → `packages/grid-core/src/index.ts` 동적 해석 확인
- HMR 즉시 반영 (packages/grid-core/src 변경 시 브라우저 갱신) 확인

### 환경 제약 근거
- pnpm dev 서버 실행은 인터랙티브 프로세스 (포트 5173 바인딩)
- 구현 에이전트 환경에서 `pnpm dev` 기동 후 HMR 동작 확인은 환경 미구비
- 대신 vite.config.ts 경로 정확성은 정적 검증으로 확인 가능 (EC-04 위험 대응 완료)

---

## 정적 검증 결과 (AC-004 대체 증거)

| alias | 대상 경로 | src 실재 |
|-------|---------|---------|
| `@tomis/grid-core` | `packages/grid-core/src` | PASS |
| `@tomis/grid-renderers` | `packages/grid-renderers/src` | PASS |
| `@tomis/grid-export` | `packages/grid-export/src` | PASS |
| `@tomis/grid-features` | `packages/grid-features/src` | PASS |
| `@tomis/grid-pro-tracking` | `packages/grid-pro-tracking/src` | PASS |
| `@tomis/grid-pro-range` | `packages/grid-pro-range/src` | PASS |
| `@tomis/grid-pro-datamap` | `packages/grid-pro-datamap/src` | PASS |
| `@tomis/grid-pro-merging` | `packages/grid-pro-merging/src` | PASS |
| `@tomis/grid-pro-header` | `packages/grid-pro-header/src` | PASS |
| `@tomis/grid-pro-agg` | `packages/grid-pro-agg/src` | PASS |
| `@tomis/grid-pro-master` | `packages/grid-pro-master/src` | PASS |
| `@tomis/grid-license` | `packages/grid-license/src` | PASS |
| `@tomis/grid` | `packages/grid/src` | PASS |

---

## 대응 조치

**G-005 착수 전 또는 MOD-GRID-17 마이그레이션 착수 전 필수 수행**:
```powershell
cd D:\project\topvel_project\TOMIS\tw-framework-front
pnpm dev    # 또는: pnpm --dir tw-framework-front dev

# 검증:
# 1. http://localhost:5173 접속 확인
# 2. packages/grid-core/src/index.ts 에 import 추가 후 HMR 즉시 반영 확인
```

**vite build 정적 검증 (HMR 없이 경로 해석 확인)**:
```powershell
cd D:\project\topvel_project\TOMIS\tw-framework-front
pnpm build   # exit 0 → alias 경로 해석 성공 (오타 없음 확증)
```

---

## 루브릭 영향

- **AC-005**: N/A — 분모에서 제외 (EC-03 환경 의존)
- **AC-004**: PASS — vite.config.ts alias 정적 검증 완료 + 기존 설정 보존 확인
- **F-01 (파일 존재)**: PASS — vite.config.ts MODIFY 완료

---

## 참조

- EC-03 원문: G-004-spec.md Section 6
- ADR-003: 환경 의존 AC 처리 정책
- Section 12 V-09: AC-005 HMR 검증 → documented-deviation
