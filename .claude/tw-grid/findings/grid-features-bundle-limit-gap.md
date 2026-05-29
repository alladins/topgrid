# Finding: state.json `bundleSizeLimits` 에 `grid-features` 항목 누락

**발견일**: 2026-05-14
**Goal**: MOD-GRID-07/column-drag/G-001 (self-review 단계)
**Status**: open — state-sync 단계에서 state.json 갱신 필요

---

## 사실 (Evidence)

### state.json config
파일: `.claude/tw-grid/state.json` L68-74

```json
"bundleSizeLimits": {
  "grid-core": "30 KB",
  "grid-renderers": "10 KB",
  "grid-virtual": "15 KB",
  "grid-pro-package": "20 KB",
  "grid-meta": "150 KB"
}
```

`grid-features` 패키지 한도 enumeration 누락.

### 실제 패키지 + 한도 사용처
- `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-features/` 실재 (G-001 implement 산출)
- monorepo `.size-limit.json` 에 `@tomis/grid-features` 한도 20000 bytes brotli 등록됨 (verify-score E-01 evidence 인용)
- G-001 verify-score E-01: "size=3620 brotli, limit=20000 → passed:true"

### 검증 과정에서의 영향
- spec.md Section 13: "예상 +3 KB" 명시했으나 state.json 한도 미정의 → verifier 는 `.size-limit.json` 의 20KB 를 정식 한도로 채택.
- C-21 (Bundle Size Limit) 의 "기본 한도" 카탈로그에도 `grid-features` 미명시.
- 결과: G-001 측정 결과 (3.26 KB raw, 3620 brotli) 가 한도 내 ✅. 단, 후속 Goal (G-002 +2 KB 예상) 누적 시 누군가가 권위 한도(state.json vs .size-limit.json vs C-21) 를 합의 없이 임의 적용할 위험.

---

## 영향 (Impact)

후속 Goal 에서 `grid-features` 번들 한도 검증 시 권위 source 불명확:
- **MOD-GRID-07/G-002** — columnOrder 영속화 +2 KB 예상 (누적 5 KB).
- **MOD-GRID-08~16** 일부 — `grid-features` 신규 hook/component 추가 시 동일 누적.
- **C-21 카탈로그** — state.json 보다 우선 권위가 명확하지 않음. spec writer 가 spec.md Section 13 작성 시 어느 한도를 참조할지 결정 정책 없음.

---

## 권고 (Recommended Action)

state-sync 단계에서 `state.json` `config.bundleSizeLimits` 에 다음 행 추가:

```json
"grid-features": "20 KB"
```

근거:
1. `.size-limit.json` 의 `@tomis/grid-features` 한도가 20000 bytes brotli (이미 적용 중).
2. `grid-pro-package` 와 동일 카테고리 (개별 feature 패키지) — 20 KB 등급이 자연스러움.
3. C-21 "각 pro 패키지 ≤ 20 KB" 정책과 일관 (`grid-features` 는 MIT 이나 feature-scope 패키지 단위 적용).

추가 후 후속 작업:
- 본 finding 을 close (resolved at: state.json L68-74 갱신 커밋 SHA).
- `constraints.md` C-21 "기본 한도" 카탈로그에 `grid-features ≤ 20 KB` 행 추가 (선택 — additive 변경).

---

## 관련 자료

- state.json: `.claude/tw-grid/state.json` L68-74
- G-001 verify-score: `.claude/tw-grid/artifacts/MOD-GRID-07/column-drag/G-001-verify-score.json` E-01
- C-21: `.claude/tw-grid/constraints.md` L208-219
- monorepo size-limit: `D:/project/topvel_project/topvel-grid-monorepo/.size-limit.json` L36-40
