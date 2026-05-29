# Agent Preamble (tw-grid 공통)

> 모든 tw-grid agent prompt 의 사전 읽기 의무 + 공통 boilerplate.

## 세션 시작 전 의무 읽기

1. [`constraints/INDEX.md`](../constraints/INDEX.md) — agent 별 active 카테고리
2. [`_shared/INDEX.md`](../../policies/_shared/INDEX.md) — cross-harness universal SSoT
3. [`policies/INDEX.md`](../policies/INDEX.md) — tw-grid 도메인 SSoT
4. 본 agent 의 단계별 rubric

## Windows 환경 의무
→ [SHARED-BUILD/§5](../../policies/_shared/build-commands.md#5-windows-환경-규칙-claudemd-준수)

## 위반 우선순위

| Tier | 위반 시 |
|------|---------|
| SHARED-QUALITY, POL-TANSTACK | 즉시 NO + 사용자 결정 게이트 |
| SHARED-DRIFT, POL-SPEC-DISC | 즉시 작업 중단 + 사용자 결정 |
| POL-COMPAT, POL-BUNDLE | NO + 재시도 |
| POL-MIG-STAGE, POL-DOC-LIC | NO + 재시도 |
| SHARED-AGENT | 메인 검증 의무 위반은 critical |

## 메인 검증 의무
→ [SHARED-AGENT/§3](../../policies/_shared/agent-delegation.md#3-메인-검증-의무-agent-보고-자체-검증-금지)

## Worktree 환경 (해당 시)
→ [constraints/90-environment.md C-34](../constraints/90-environment.md#c-34-워크트리-경계-vs-사용처-마이그레이션-powershell-via-bash-우회-의무)
