# tw-grid Policies — 도메인 SSoT 인덱스

> 본 디렉토리는 **tw-grid 그리드 라이브러리 도메인 특화 룰** SSoT.
> Universal 룰은 [`.claude/policies/_shared/`](../../policies/_shared/INDEX.md) 참조.

## 카탈로그

### Universal (cross-harness) — `_shared/` 참조
| ID | Reference | 범위 |
|----|-----------|------|
| SHARED-QUALITY | [_shared/code-quality.md](../../policies/_shared/code-quality.md) | No assumption / TS strict / no dummy / CSS / error handling / loading |
| SHARED-BUILD | [_shared/build-commands.md](../../policies/_shared/build-commands.md) | 빌드 명령 + Windows 환경 + pnpm monorepo |
| SHARED-AGENT | [_shared/agent-delegation.md](../../policies/_shared/agent-delegation.md) | Agent 위임 + Implementer↔Verifier 분리 + 메인 검증 |
| SHARED-DRIFT | [_shared/drift-spec.md](../../policies/_shared/drift-spec.md) | Spec 권위 + drift gates + ADR 의무 + cross-module 격리 |

### tw-grid 자체 도메인 SSoT
| ID | 파일 | 범위 |
|----|------|------|
| POL-TANSTACK | [tanstack-fidelity.md](tanstack-fidelity.md) | TanStack v8 표준 + AG Grid 금지 + Wijmo 금지 + 라이선스 정책 |
| POL-COMPAT | [compatibility-versioning.md](compatibility-versioning.md) | Backward compatibility + peerDependencies + semver |
| POL-BUNDLE | [bundle-perf.md](bundle-perf.md) | 가상화 호환 + 번들 크기 한계 |
| POL-MIG-STAGE | [migration-staging.md](migration-staging.md) | 사용처 점진 마이그레이션 + 시각 회귀 검증 |
| POL-DOC-LIC | [documentation-licensing.md](documentation-licensing.md) | 라이선스 명시 + Public API 문서 + ADR 의무 |
| POL-SPEC-DISC | [spec-discipline.md](spec-discipline.md) | Spec authority + score formula self-verify + path prefix + Implementer score 금지 |

## 인용 규칙

```markdown
→ **SSoT**: [POL-TANSTACK/§2 (AG Grid 금지)](../policies/tanstack-fidelity.md#2-ag-grid-신규-도입-금지)
→ **SSoT (universal)**: [SHARED-QUALITY/§1](../../policies/_shared/code-quality.md#1-no-assumption-coding)
```

본문 복사 금지. 변경 필요 시 policies/ 또는 _shared/ 만 수정.
