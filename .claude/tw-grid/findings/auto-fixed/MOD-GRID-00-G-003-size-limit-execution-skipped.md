# Documented Deviation: MOD-GRID-00 G-003 AC-005 — size-limit CI 실행 스킵

**파일**: `findings/auto-fixed/MOD-GRID-00-G-003-size-limit-execution-skipped.md`  
**생성일**: 2026-05-13  
**Goal**: MOD-GRID-00 / G-003  
**AC**: AC-005  
**EC 매핑**: EC-01 (pnpm size-limit 미설치 환경)

---

## 요약

AC-005 (`pnpm size-limit CI 단계에서 한도 초과 시 exit 1`)는 실행 환경 제약으로 인해 이번 Implement 단계에서 실행 불가.

---

## 사유 (환경 제약)

1. **dist 파일 미생성**: `pnpm -r build` 실행 시 각 패키지의 `src/index.ts`가 빈 파일(`export {}`)이므로 빌드는 가능하나, size-limit이 측정할 실제 구현 코드가 없음.
2. **EC-01 명시 시나리오**: G-003-spec.md Section 6 EC-01에서 "개발자 로컬에 pnpm corepack 미설정 또는 CI 파이프라인 미구성 → `pnpm size-limit` 실행 불가" 시나리오를 사전 명시하고 ADR-003과 1:1 매핑 처리.
3. **실제 적용 불가 원인**: G-003 구현 단계에서 패키지별 구현 코드가 없으므로 size-limit 측정 의미 없음. dist 파일이 있어도 거의 0B에 가까워 한도 테스트가 무의미함.

---

## 완료된 작업 (AC-005 대응)

| 항목 | 상태 |
|------|------|
| `.size-limit.json` 파일 생성 (12개 패키지 엔트리, C-21 한도) | ✅ 완료 |
| 루트 `package.json`에 `size-limit`, `@size-limit/preset-small-lib` devDeps 추가 | ✅ 완료 |
| `scripts["size-limit"]`, `scripts["size-limit:ci"]` 추가 | ✅ 완료 |
| `pnpm size-limit` 실제 실행 및 exit 코드 확인 | ❌ 환경 제약 — deviation |

---

## Resolution (다음 Goal 전 개발자 조치)

1. **G-005 (grid-core 구현 착수 전)**:
   - `pnpm install` 실행하여 `size-limit` 및 `@size-limit/preset-small-lib` 설치 확인
   - `pnpm -r --filter './packages/*' build` 실행하여 dist 산출 확인
   - `pnpm size-limit` 실행하여 `.size-limit.json` 한도 측정 확인
2. **CI 파이프라인 구성 (G-004 또는 별도 infra Goal)**:
   - GitHub Actions 또는 해당 CI에서 `pnpm -r build && pnpm size-limit` 단계 추가
   - PR 병합 전 자동 한도 체크 활성화

---

## 점수 처리

AC-005에 직접 매핑되는 rubric 항목 (`E-01: 번들 크기 변동 측정`)은 **N/A 처리** (분모 제외).  
이유: EC-01 ↔ AC-005 1:1 매핑 (G-003-spec.md Section 6 EC↔AC 매핑 표). ADR-003 deviation 처리 근거.

---

## implement-score documentedDeviations 항목

```json
{
  "ac": "AC-005",
  "reason": "dist 파일 미생성 (EC-01 + EC-02) — 패키지 구현 코드 없음. size-limit 실행 의미 없음.",
  "finding": "findings/auto-fixed/MOD-GRID-00-G-003-size-limit-execution-skipped.md",
  "resolution": "G-005 착수 전 pnpm install + pnpm -r build + pnpm size-limit 실행 확인"
}
```
