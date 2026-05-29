# Shared Policies — Cross-harness SSoT (universal 룰)

> 본 디렉토리는 **tw-mail / tw-harness / tw-grid 3개 하네스가 공유하는 universal 룰** SSoT.
> 각 하네스의 `policies/INDEX.md` 가 본 _shared/ 를 reference 로 인용.
> 변경 시 3개 하네스에 일괄 적용됨 — **충돌 가능성 사전 인지 의무**.

## 카탈로그

| ID | 파일 | 범위 |
|----|------|------|
| SHARED-QUALITY | [code-quality.md](code-quality.md) | No assumption / TS strict / no dummy / error handling / loading state |
| SHARED-BUILD | [build-commands.md](build-commands.md) | gradlew/tsc/npm 표준 명령 + Windows 환경 규칙 |
| SHARED-AGENT | [agent-delegation.md](agent-delegation.md) | 모든 Stage agent 위임 의무 + Implementer↔Verifier 분리 + 메인 검증 |
| SHARED-DRIFT | [drift-spec.md](drift-spec.md) | Spec 권위 + drift gates + silently 진행 금지 + ADR 의무 |
| SHARED-SUPERSEDE | [cross-module-supersession.md](cross-module-supersession.md) | Cross-module Goal supersession 3-step workflow + ledger indirection + owner ack — POL-DRIFT cross-module write 회피용. schema: [supersession-ledger.schema.json](supersession-ledger.schema.json). 도구: `.claude/tools/supersession-check.mjs` |

## 인용 규칙

하네스별 `policies/` 또는 `constraints/` 에서:
```markdown
→ **SSoT**: [SHARED-QUALITY/§1](../../policies/_shared/code-quality.md#1-no-assumption-coding)
```

본문 복사 금지. 변경 필요 시 본 _shared/ 만 수정 → 3개 하네스 자동 동기화.

## Cross-harness 도구

본 SSoT 와 정합을 유지하기 위한 universal 도구 (`--scope <harness>` 옵션 지원):

| 도구 | 위치 | 용도 |
|------|------|------|
| `supersession-check` | [`.claude/tools/supersession-check.mjs`](../../tools/supersession-check.mjs) | 3 하네스 ledger ack 미완료 entry 감지 |
| `fix-anchor-double-hyphen` | [`.claude/tw-grid/tools/fix-anchor-double-hyphen.mjs`](../../tw-grid/tools/fix-anchor-double-hyphen.mjs) | markdown link target anchor `--`→`-` 일괄 정규화 (cross-harness reusable) |
| `verify-ssot-internal` | [`.claude/tw-grid/tools/verify-ssot-internal.mjs`](../../tw-grid/tools/verify-ssot-internal.mjs) | SSoT 5 루트 cross-ref 정합성 검증 |
| `verify-v1.1-refs` | [`.claude/tw-grid/tools/verify-v1.1-refs.mjs`](../../tw-grid/tools/verify-v1.1-refs.mjs) | tw-grid.md v1.1 본문 link 검증 (tw-mail/tw-harness 동일 패턴 응용 가능) |

> ⚠️ **Cross-session 안전 사용**: `--scope` 옵션으로 자기 harness 범위만 fix. tw-grid 도구라도
> `--scope tw-mail` 호출 시 tw-mail 영역만 정리 — 단 본 세션이 다른 harness write 시 cross-session
> 격리 정책 (각 harness 메모리 참조) 위반 위험. **dry-run 후 해당 harness 세션에 결과만 surface 권장**.

## 변경 절차

본 _shared/ 변경 시:
1. 3개 하네스 모두에 영향 인지
2. `.claude/policies/_shared/CHANGELOG.md` (필요 시 신설) 에 entry 추가
3. 영향받는 하네스의 in-flight Goal 회고적 재평가 불필요 (forward-only)

## 도메인 특화 룰 위치

universal 이 아닌 도메인 특화 룰은 각 하네스 자체 `policies/`:
- **tw-mail**: tenant-isolation, auth-mtls-jwt, mail-resource-management, mail-security
- **tw-harness**: migration-domain-coverage, migration-data-integrity, migration-catalog
- **tw-grid**: tanstack-fidelity, compatibility-versioning, bundle-perf, migration-staging, documentation-licensing, spec-discipline
