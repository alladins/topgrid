# SHARED-DRIFT — Spec 권위 + Drift Gates + ADR (universal SSoT)

> tw-mail / tw-harness / tw-grid 공통 spec authority + drift detection 룰.
>
> 출처 통합:
> - tw-mail: constraints C-21, C-22, C-23, C-30, C-31, C-32 + POL-DRIFT
> - tw-harness: constraints C-13 (Goals SSoT)
> - tw-grid: constraints C-27 (Spec authority + drift reporting), C-28 (path prefix), C-30 (truth table), C-33 (prompt subordination), C-14 (ADR)

---

## §1. Spec 권위 (Spec Authority)

### §1.1 단일 진실 출처
- `goals.json` + `spec.md` + `rubric/*` + `policies/*` + `constraints/*` 는 작성된 룰의 **공식 출처**.
- 메인 prompt 본문, 명령 파일 본문, agent prompt 본문 안의 코드 블록은 **example/guidance 한정** — Spec 본문보다 권위 X.
- Spec 과 prompt 본문 불일치 시 **Spec 우선**.

### §1.2 prompt-spec drift 보고 의무
메인 명령 파일 또는 agent prompt 본문에 spec 과 다른 내용 발견 시:
1. 즉시 작업 중단
2. drift 항목 보고
3. 사용자 결정: spec 갱신 또는 prompt 갱신

silently 진행 절대 금지.

---

## §2. Drift Detection Gate

배포 상태(DB 컬럼/DDL/Java 시그니처/FE 컴포넌트) 와 spec(AC/implementFiles) 사이 **drift 발견 시 silently 진행 금지**.

### §2.1 검출 시점
- 모든 IMPLEMENT 시작 *전*
- 모든 VERIFY 시작 *전*
- spec ↔ 실제 배포 대조

### §2.2 발견 시 의무 절차
1. **즉시 작업 중단**.
2. drift 항목을 표(spec ↔ 배포) 로 사용자에게 보고.
3. 사용자 결정 옵션 (택1):
   - (a) **배포 → spec 관철**: ALTER 또는 rename 으로 배포를 spec 에 맞춤
   - (b) **spec → 배포 갱신**: Decision Log + spec 본문 변경
   - (c) **별도 조사**: 원인 추적 후 재결정
4. 자체 판단으로 진행 절대 금지. "사용자가 continue 했으니 그냥 진행" 금지.

위반 검출: Self-Review 가 commit/edit 히스토리에서 drift 알면서 silently 진행한 흔적 발견 시 해당 Goal stage NO.

---

## §3. Pre-Implementation Checklist (의무)

```
=== Pre-Implementation Checklist ===
[ ] 1. spec.implementFiles 배열의 모든 경로가 실제 존재? (NEW가 아닌 경우)
[ ] 2. spec.implementFiles의 클래스명/패키지명이 실제 코드와 정확 일치?
[ ] 3. spec AC의 메서드 시그니처가 실제 코드와 정확 일치?
[ ] 4. 같은 Goal의 다른 AC가 본 작업으로 부정적 영향 받는지 cross-check?
[ ] 5. 공유 자원 (Migration Catalog / shared enum / DB schema) 영향?
[ ] 6. MCP 로 DDL 사전 적용? → Flyway baseline 설정 확인 (§4).
[ ] 7. 신규 Migration 파일 추가? → 슬롯 충돌 사전 확인 (도메인별 ledger).
```

NO 1건이라도 발견 시 Implementer는 **즉시 코드 작성 중단** + 메인 보고 + 사용자 결정 게이트 (§2.2).

---

## §4. MCP DDL 사전 적용 시 Migration Baseline

`mcp__mariadb-*__mariadb_query` 로 DDL 사전 적용 시 `application.yaml` 의무 명시:

```yaml
spring:
  flyway:
    baseline-on-migrate: true
    baseline-version: <마지막으로 MCP로 적용한 V번호>
```

이유: MCP 직접 적용 시 `flyway_schema_history` 비어있음 → 다음 bootRun 에서 V001 부터 재실행 → 충돌.

---

## §5. Out-of-scope Build Break 처리

VERIFY 단계 build category 채점 시 발견된 build break 의 *원인 파일이 본 Goal `implementFiles` 외부*에 위치:

1. stack trace 에서 원인 파일 경로 추출 → `implementFiles` 와 대조.
2. *모든* 원인 파일이 외부면 → 해당 check NO 마크하되 feedback 에 "out-of-scope drift — 책임 Goal/모듈 ID = X" 명시.
3. `implementFiles` 안 코드가 1개라도 break 기여 → 정상 NO + blocking.
4. Verifier 재량: out-of-scope only check 는 N/A 처리 가능 (Self-Review 사후 audit).

책임 이관: `summary.openDecisions` 에 책임 Goal ID + 발견 시점 + 증상 명시 의무.

---

## §6. Scope Contraction 처리

`implementFiles` 또는 Plan 에 명시된 다수 파일 중 일부만 본 Goal scope 로 좁히는 경우 (인프라만 + 메서드 본문은 후속 Goal 이양) **drift 에 해당**.

silently 좁히기 금지. ADR 로 다음 명시 의무:
- (a) 좁힌 이유
- (b) 이양 대상 Goal ID
- (c) 미구현 항목 책임 이관

---

## §7. goals.json patch 시 surgical replacement 의무

특정 Goal 의 `stages.*` patch 시 다음 중 *최소 하나* 만족:

### §7.1 goalId-anchored surgical replacement (1순위 권장)
`Edit` tool 의 `old_string` 이 해당 Goal goalId + 직전 1-2 줄 unique header 포함, 전체 파일에서 unique 보장.

```
"goalId": "G-MOD-XX-YYY",
"title": "..."
```
같이 멀티라인 blob 을 anchor.

### §7.2 JSON parse-modify-serialize (2순위, 큰 변경)
PowerShell `ConvertFrom-Json -Depth 100` → 객체 트리 patch → `ConvertTo-Json -Depth 100`.

### §7.3 금지 패턴
- pattern-based `IndexOf` + length-counted substring replacement
- `Edit` tool `replace_all=true` + non-unique pattern
- 첫 매칭 확인 없이 진행

### §7.4 사후 검증
patch 후 동일 파일에서 다른 Goal stages 가 의도치 않게 변경됐는지 `git diff` 또는 Read tool 로 cross-check.

---

## §8. ADR 의무 (Decision Log)

신규 개발 결정 또는 마이그레이션 결정은 `.claude/{harness}/decisions/{moduleId}-decisions.md` 에 기록:
- 어떤 결정
- 왜 (이유)
- 트레이드오프 (대안 + 거부 이유)
- 미래 변경 시 영향

같은 결정을 다른 Goal 에서 다르게 적용 금지. ADR 위반 의심 시 Self-Review 점검.

### §8.1 ADR redirect 시 implementFiles 즉시 sync
ADR 이 spec 상 구현 경로와 다른 실제 경로 결정 시 **동일 사이클 안에 `goals.json` 갱신 의무**:

```json
"implementFilesRedirect": {
  "adr": "ADR-XXX-NNN",
  "redirectedFrom": ["<spec 경로>"],
  "redirectedTo": ["<deployed 경로>"],
  "reason": "<한 줄>"
}
```

누락 시 cross-session 분석에서 false-positive wipe 단정 가능.

---

## §9. Cross-module/session 격리

### §9.1 자기 모듈만 modify
- `/{harness} loop {moduleId}` 컨텍스트 메인 세션은 **해당 moduleId 의 `*-goals.json` 만 write**.
- 다른 모듈은 read-only (dependsOn 분석 시 읽기는 허용).
- 단일 batch 로 2개 이상 모듈 goals.json 동시 write 금지.

### §9.2 Wipe 단정 *전* git reflog 의무
1. `git reflog --date=iso` 로 의심 시각 destructive event 확인. 없으면 wipe 가설 reject.
2. 대안 경로 검색 (ADR redirect, 확장자 차이, path consolidation). 단순 부재 ≠ wipe.
3. rollback marker 의 wipe 시점은 git reflog 로 확인 가능한 actual destructive event 시점만. 추측·fabricated 시점 절대 금지.

### §9.3 Parallel Session Lock
- lock 파일: `.claude/{harness}/loop.lock`
- 진입 시 같은 moduleId lock 존재 → 즉시 거부
- 다른 moduleId → 경고 + 사용자 확인 + `state.json crossSessionAlerts` push
- 종료 시 lock 해제 의무
- stale lock (30분 경과) → 사용자 승인 후 강제 해제

---

## §10. 공유 Enum Append-only

여러 모듈/Goal 이 공유하는 enum 파일은 **append-only**. rename/remove/reorder 절대 금지.

각 하네스가 자체 카탈로그 보유 (예: tw-mail `MailAuditAction`, tw-grid `gridFeature` 등). 카탈로그는 추가만 가능, 삭제 금지.

### §10.1 신규 enum 주석 의무
```java
// G-XXX-NNN (ADR-XXX-NNN) — <한 줄 reason>
NEW_ENUM_VALUE,
```

### §10.2 사전 git diff
수정 *전* `git log -n 5 -- <file>` + `git diff HEAD~3 HEAD -- <file>` 검토.

### §10.3 Merge conflict 시 양쪽 보존
strip 절대 금지. 양쪽 보존 + 즉시 작업 중단 + 사용자 결정 게이트.

---

## §11. Migration 파일 슬롯 ledger

Flyway V* 등 슬롯 기반 마이그레이션 파일 충돌 사전 차단:

- 각 하네스는 `.claude/{harness}/flyway-ledger.json` (or 동등) 보유
- 신규 V* 작성 *전* `nextFree` 확인 + atomic claim entry 추가
- 사후 정합 검증 (claims ↔ 디스크 1:1)

---

## §12. 위반 시 처리

- **implement**: 해당 카테고리 NO + Self-Review 보고 + 사용자 결정 게이트 발동
- **verify**: Out-of-scope drift 는 §5 처리, in-scope drift 는 정상 NO + blocking
- silently 진행 흔적: Self-Review 보고 + 해당 Goal stage NO + 회고적 audit
