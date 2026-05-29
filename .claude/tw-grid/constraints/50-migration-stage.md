# 50-migration-stage — 사용처 점진 + 시각 회귀

본 카테고리는 [`POL-MIG-STAGE`](../policies/migration-staging.md) 으로 SSoT 추출됨.

---

## C-8: 사용처 마이그레이션 점진 (대량 일괄 금지)

→ **SSoT**: [POL-MIG-STAGE/§1](../policies/migration-staging.md#1-사용처-점진-마이그레이션)
*요약*: 1 Goal 사용처 ≤ 5개. 6개 이상 → 별도 Goal 분할.

---

## C-13: 시각 회귀 검증

→ **SSoT**: [POL-MIG-STAGE/§2](../policies/migration-staging.md#2-시각-회귀-검증-의무)
*요약*: 영향 사용처 마이그레이션 후 외관 보존 검증. Storybook+Chromatic 또는 수동 스크린샷.

---

## C-17: 시각 회귀 검증 의무 (Visual Regression Required)

→ **SSoT**: [POL-MIG-STAGE/§2](../policies/migration-staging.md#2-시각-회귀-검증-의무)
*요약*: C-13 과 동일 영역 (의무 명시). migrationImpact high/medium 필수, low N/A.

---

## C-19: 사용처 마이그레이션 점진 (Incremental Usage Migration)

→ **SSoT**: [POL-MIG-STAGE/§1](../policies/migration-staging.md#1-사용처-점진-마이그레이션)
*요약*: C-8 과 동일 영역 (의무 명시). 트리비얼 변경(import 경로) ≤ 10개 예외.
