# 30-compat — Backward Compatibility + peerDeps + semver

본 카테고리는 [`POL-COMPAT`](../policies/compatibility-versioning.md) 으로 SSoT 추출됨.

---

## C-6: 호환성 절대 (Backward Compatibility)

→ **SSoT**: [POL-COMPAT/§1](../policies/compatibility-versioning.md#1-backward-compatibility)
*요약*: 사용처 마이그레이션 가능 보장. Breaking 시 deprecation 최소 1 minor.

---

## C-22: peerDependencies 정책

→ **SSoT**: [POL-COMPAT/§2](../policies/compatibility-versioning.md#2-peerdependencies-정책)
*요약*: react/react-dom/@tanstack/react-table 등 peerDependencies 의무. dep 중복 금지.

---

## C-23: API 안정성 — semver 준수

→ **SSoT**: [POL-COMPAT/§3](../policies/compatibility-versioning.md#3-semver-준수)
*요약*: semver 준수. breaking 시 CHANGELOG 마이그레이션 가이드. Changeset 사용.
