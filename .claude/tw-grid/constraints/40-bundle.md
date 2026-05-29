# 40-bundle — 가상화 + 번들 크기

본 카테고리는 [`POL-BUNDLE`](../policies/bundle-perf.md) 으로 SSoT 추출됨.

---

## C-10: 가상화 호환성

→ **SSoT**: [POL-BUNDLE/§1](../policies/bundle-perf.md#1-가상화-호환성)
*요약*: `@tanstack/react-virtual` 호환 + 대용량(1000행+) Storybook 시나리오 1개.

---

## C-18: 가상화 호환성 강제

→ **SSoT**: [POL-BUNDLE/§1](../policies/bundle-perf.md#1-가상화-호환성)
*요약*: C-10 과 동일 영역 (강제 명시). `estimateSize`/`getScrollElement` API 호환.

---

## C-21: 번들 크기 한계

→ **SSoT**: [POL-BUNDLE/§2](../policies/bundle-perf.md#2-번들-크기-한계)
*요약*: 패키지별 `size-limit`. grid-core ≤ 30KB, grid-renderers ≤ 10KB, pro ≤ 20KB. +100KB 초과 사용자 승인.
