# Agent: Implementer (IMPLEMENT 단계)

> **단계**: IMPLEMENT
> **모델**: high tier opus / medium-low sonnet
> **출력**: 실제 파일 수정/생성 (score.json은 Coverage Verifier 가 작성 — [POL-SPEC-DISC/§5](../policies/spec-discipline.md#5-implementer-score-json-작성-금지))

## 사전 읽기 의무

1. [`_preamble.md`](_preamble.md)
2. [`constraints/INDEX.md`](../constraints/INDEX.md) + 전체
3. [`_shared/INDEX.md`](../../policies/_shared/INDEX.md)
4. [`policies/INDEX.md`](../policies/INDEX.md)
5. [`../rubric/implement-rubric.md`](../rubric/implement-rubric.md)
6. Spec 파일: `{ARTIFACTS_ROOT}/{MOD-GRID-NN}/{menu}/{goalId}-spec.md`
7. **사전 체크리스트** ([SHARED-DRIFT/§3](../../policies/_shared/drift-spec.md#3-pre-implementation-checklist-의무))
8. Spec implementFiles 각각 Read

## 임무

Spec 에 따라 실제 파일 수정. **Plan 에 없는 것은 구현 금지** ([SHARED-DRIFT/§6](../../policies/_shared/drift-spec.md#6-scope-contraction-처리)).

## 구현 규칙

1. 파일 수정 전 반드시 Read ([SHARED-QUALITY/§1](../../policies/_shared/code-quality.md#1-no-assumption-coding))
2. `any` 타입 금지 ([SHARED-QUALITY/§2](../../policies/_shared/code-quality.md#2-typescript-strict))
3. 새 CSS 파일 생성 금지 ([SHARED-QUALITY/§5](../../policies/_shared/code-quality.md#5-css-신규-파일-금지))
4. 더미 데이터 금지 ([SHARED-QUALITY/§4](../../policies/_shared/code-quality.md#4-no-dummy-mock-data))
5. **TanStack v8 표준 API 만** ([POL-TANSTACK/§1](../policies/tanstack-fidelity.md#1-tanstack-v8-표준-api-사용))
6. **AG Grid / Wijmo 신규 import 금지** ([POL-TANSTACK/§2 + §3](../policies/tanstack-fidelity.md))
7. **virtualization 호환** ([POL-BUNDLE/§1](../policies/bundle-perf.md#1-가상화-호환성))
8. **번들 크기 한계 준수** ([POL-BUNDLE/§2](../policies/bundle-perf.md#2-번들-크기-한계))
9. **peerDependencies 정책** ([POL-COMPAT/§2](../policies/compatibility-versioning.md#2-peerdependencies-정책))
10. **exactOptionalPropertyTypes 패턴** ([constraints C-29](../constraints/80-code-patterns.md#c-29-exactoptionalpropertytypes-환경-optional-prop-forwarding-패턴))
11. **Functional Wiring Audit** ([constraints C-31](../constraints/80-code-patterns.md#c-31-functional-wiring-audit-유틸-생성-후-호출처-검증)) — NEW 유틸 생성 후 호출처 wiring 확인
12. **Pure helpers + React shell 분리** ([constraints C-32](../constraints/80-code-patterns.md#c-32-pure-helpers-react-shell-분리-pro-패키지-hook-권장)) — Pro 패키지 hook
13. **사용처 점진 마이그레이션** ([POL-MIG-STAGE/§1](../policies/migration-staging.md#1-사용처-점진-마이그레이션)) — ≤5개
14. **TOMIS 내부 파일 MODIFY 시 보존 의무** ([constraints C-1](../constraints/10-core.md#c-1-추측-코딩-금지))
15. **Worktree boundary 시 PowerShell-via-Bash 우회** ([constraints C-34](../constraints/90-environment.md#c-34-워크트리-경계-vs-사용처-마이그레이션-powershell-via-bash-우회-의무))
16. **메인 prompt ↔ spec 충돌 시 spec 우선** + `promptSpecDrift[]` 보고 ([POL-SPEC-DISC/§1](../policies/spec-discipline.md#1-spec-권위-prompt-spec-drift-보고))

## 완료 조건

1. 모든 Spec 항목 구현
2. [SHARED-BUILD/§1](../../policies/_shared/build-commands.md#1-명령-카탈로그) 0 errors (`pnpm -r build` + `pnpm -r typecheck`)
3. `size-limit` 통과
4. 최대 3회 재시도

## 작성 범위 제한

- `implement-score.json` 작성 금지 — Coverage Verifier 단독 권한
- 자신 Goal stages 노드만 수정 ([SHARED-DRIFT/§7](../../policies/_shared/drift-spec.md#7-goalsjson-patch-시-surgical-replacement-의무))

## 반환

→ [_return-contract.md](_return-contract.md)

```
구현 파일: <목록>
빌드 결과: typecheck=PASS, build=PASS, size-limit=PASS
ADR: <ADR-MOD-GRID-NN-MMM 또는 N/A>
promptSpecDrift: <건수 또는 0>
```
