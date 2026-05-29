# SHARED-SUPERSEDE — Cross-Module Goal Supersession Pattern

> **Universal 룰** — tw-mail / tw-harness / tw-grid 3개 하네스 모두 적용.
> 한 모듈의 Goal 이 다른 모듈의 Goal/산출물에 의해 이미 충족되었을 때 (cross-module supersession) 의 처리 워크플로우.
>
> **첫 정착 사례**: tw-mail G-MAIL-18-012 → G-MAIL-19-007 (ADR-MAIL-18-037 + ADR-MAIL-19-061, 2026-05-22 ack 완료).

---

## 1. 정의

### 1-1. supersession
한 Goal **G-A** (supersededModule 소속) 이 다른 Goal **G-B** (ownerModule 소속) 에 의해 이미 충족됨. G-A 를 별도 구현할 필요가 없음.

```
G-A (superseded — 보통 설계/SPECIFY 단계, 또는 미시작)
   ↑ SUPERSEDED by
G-B (owner — 이미 deployed + verify=PASS, supersededModule 의 AC 대부분/전부 충족)
```

### 1-2. cross-module
G-A 와 G-B 가 **서로 다른 모듈 (MAIL-NN, MOD-NN 등) 소속**. 같은 모듈 내 supersession 은 일반 ADR + goals.json patch 로 처리 — 본 패턴 범위 아님.

### 1-3. 발생 빈도 추정
- **tw-mail**: 모듈 간 기능 overlap 가능성 (예: quota snapshot ↔ admin 리포트)
- **tw-harness**: 마이그레이션 하네스 — 같은 기능이 여러 MOD 에 분산될 가능성 높음 (예: 결재 / 게시판 / 메모 등 cross-cutting)
- **tw-grid**: 그리드 컴포넌트 모듈화 단계에 따라 가능

---

## 2. 왜 별도 패턴이 필요한가

### 2-1. cross-module write 금지 (drift-spec §x mirror)
| 모듈 owned 영역 | write 권한 |
|---|---|
| MAIL-NN owned (`goals/MAIL-NN/*`, `decisions/MAIL-NN-*`, `artifacts/MAIL-NN/*`) | MAIL-NN session 만 |
| MOD-NN owned | MOD-NN session 만 |

문제: G-A 가 SUPERSEDED 됐다는 사실을 **ownerModule 영역에 기록하려면** supersededModule session 이 cross-module write 해야 함 → drift 정책 위반.

### 2-2. cross-session race 위험
ownerModule 의 active loop session 과 동시에 다른 session 이 ownerModule 파일 수정 시 wipe 또는 false-positive rollback (tw-mail memory N=2 사례 참조).

### 2-3. timing gap
supersededModule 의 SUPERSEDED 결정 시점 ≠ ownerModule 의 self-review 작성 시점. owner notification 메커니즘 없으면 ownerModule 이 supersede 사실을 영원히 모를 수 있음.

---

## 3. 해결 패턴 — 3-step workflow

### Step 1. supersededModule 측 (SUPERSEDED resolution)

**작성 책임**: supersededModule session (또는 catch-up cycle 진입한 메인)

**산출물**:
1. **SUPERSEDED ADR** (`decisions/<supersededModule>-decisions.md` 또는 동등 위치)
   - 필수 섹션:
     - Context (supersede 발견 경위)
     - Decision (option 명시)
     - **AC Coverage Mapping table** (서술형 금지 — mapping table 의무):
       | superseded Goal AC | Status (DEPLOYED / EQUIVALENT / DISMISSED) | Evidence (file:line 또는 ADR ref) |
     - Alternatives Rejected (option b/c 등)
     - Future (재오픈 조건)
     - Cross-Reference (ownerModule Goal + ledger entry path)
2. **supersededModule goals.json patch** (G-A 객체만 surgical):
   - `stages.specify/implement/verify.status` → `"done_via_spec_alignment"` (state-sync TERMINAL_GOOD 인식)
   - `overallStatus` → `"completed"` (명시)
   - `supersededBy` → `"G-B-goalId"` (신규 필드)
   - `supersededAt` → ISO date (신규 필드)
   - `supersedeAdr` → ADR ref (신규 필드)
3. **ledger entry 추가** (`<harness>/supersession-ledger.json`)

**금지**:
- ownerModule source/goals.json/decisions 수정
- ownerModule 영역에 ADR 직접 추가
- ledger entry 후 owner ack 강제 (ack 는 owner 자율)

### Step 2. ledger entry (indirection 인프라)

**위치**: `.claude/<harness>/supersession-ledger.json` (각 하네스 1개)

**Schema**: [`supersession-ledger.schema.json`](./supersession-ledger.schema.json) 참조

**Entry 필수 필드** (요약):
```json
{
  "entries": {
    "<superseded-goalId>": {
      "supersededBy": "<owner-goalId>",
      "supersededAt": "<ISO date>",
      "supersedeAdr": "<ADR ref>",
      "ownerModule": "<MOD-NN or MAIL-NN>",
      "supersededModule": "<MOD-NN or MAIL-NN>",
      "ownerStage": "<완료 상태 + score 인용>",
      "acCoverage": {
        "deployed": [<AC list>],
        "equivalent": [<AC list>],
        "dismissed": [<AC list with reason>]
      },
      "evidence": [<file path list>],
      "ownerNotification": "<권장 사항 — ownerModule session 자율>",
      "ownerAcknowledgedAt": null,       // ← Step 3 에서 갱신
      "ownerAckAdr": null,                // ← Step 3 에서 갱신
      "ownerAckArtifacts": []             // ← Step 3 에서 갱신
    }
  },
  "indexes": {
    "byOwnerModule": { "<ownerModule>": ["<superseded-goalId>", ...] },
    "bySupersededModule": { "<supersededModule>": ["<superseded-goalId>", ...] }
  }
}
```

**Append-only 정책**:
- entry 삭제 금지
- evidence 회수적 변경 금지
- 단 ownerAck 관련 필드 (Step 3) 만 추가 가능
- 재오픈 결정 시 entry 의 `reopenedAt` + `reopenAdr` 추가 (futureExtensions §1)

### Step 3. ownerModule 측 (owner ack — 권장)

**작성 책임**: ownerModule session (또는 catch-up cycle 진입한 메인)

**진입 의무 조건**:
- ownerModule self-review 사이클 시작 시 ledger `byOwnerModule.<self>` 인덱스 query
- entry 발견 시 `ownerAcknowledgedAt = null` 인 항목 ack 처리

**산출물**:
1. **ack ADR** (`decisions/<ownerModule>-decisions.md`)
   - 필수 섹션:
     - Cross-Pointer Mapping table (source / target / supersession ADR / ack via)
     - Owner 관점 검증 (ownerModule source/goals.json 변경 요구 0건 확인 등)
     - Constraints in force
     - Cross-Reference
2. **self-review.md 갱신** — "Cross-Module Supersession Inbound" 섹션 추가
3. **ledger ack 필드 갱신** (양쪽 합의 영역 — futureExtensions §2 허용):
   - `ownerAcknowledgedAt` → ISO date
   - `ownerAckAdr` → ADR ref
   - `ownerAckArtifacts` → 갱신된 file path list

**금지**:
- supersededModule source/goals.json/decisions 수정
- ledger entry 삭제 또는 evidence 회수
- 자동 ack (자율 결정 — owner module 이 G-A 의 책임 범위 변경 인지/검증 후)

---

## 4. 도구 — supersession-check

### 4-1. 위치
`.claude/<harness>/tools/supersession-check.mjs` 또는 universal `.claude/tools/supersession-check.mjs`

### 4-2. 동작
1. `<harness>/supersession-ledger.json` 읽기
2. `entries[*]` 순회 → `ownerAcknowledgedAt: null` 항목 추출
3. 각 항목별로:
   - 경과 일수 계산 (`supersededAt` 기준)
   - ownerModule self-review file 존재 + cross-pointer 섹션 grep
   - 미충족 시 warn 출력
4. state-sync 시점에 자동 호출 (선택 — 권장)

### 4-3. 출력 예
```
⚠ Pending owner ack — 1 entry
  G-MAIL-18-012 → owner MAIL-19 (ADR-MAIL-18-037, N=3일 경과)
    self-review found but no "Cross-Module Supersession Inbound" section
    권장: MAIL-19 catch-up cycle 진입 후 ADR-MAIL-19-NNN ack 추가
```

---

## 5. self-review template — "Cross-Module Supersession Inbound" 섹션

ownerModule self-review 작성 시 본 섹션 추가 의무 (ledger entry 가 ownerModule 대상으로 존재할 경우):

```markdown
## Cross-Module Supersession Inbound (<ISO date> patch)

**G-A SUPERSEDED by G-B** — 본 모듈의 G-B 산출물이 <supersededModule> 의 후속 catch-up 사이클에서 G-A 를 충족함을 발견. <supersededModule> 측 <SUPERSEDED ADR> 발급 + supersession-ledger entry 등록.

### Inbound supersession entry

| Source (superseded) | Target (이 모듈 owned) | AC coverage | 본 모듈 책임 변경 |
|---|---|---|---|
| G-A | G-B | <DEPLOYED/EQUIVALENT/DISMISSED counts> | <0건 또는 변경 명세> |

### 본 ack 가 자체 catch한 timing gap (해당 시)

- self-review 작성 시점: <T1>
- ledger 신설 시점: <T2>
- <T1 < T2 또는 T1 > T2 분석>

### 참조

- <ack ADR ref>
- <SUPERSEDED ADR ref>
- supersession-ledger.json entries["<G-A>"]
```

---

## 6. 정착 단계 (promotion path)

| 단계 | 의미 |
|------|------|
| 1. 신설 (이론) | ledger schema + 정책 정의. 실 사용 0건. |
| 2. **첫 사례 (검증)** ← *현재 위치* | 실 ack workflow 1회 성공. 인프라 reliability 검증. |
| 3. 누적 (N=3 임계) | 3 사례 누적 시 promotion 후보 — 자동화 의무화 검토 |
| 4. 자동화 (의무화) | state-sync 시점에 ack 미완료 entry 자동 warn. self-review template 의무 항목으로 추가 — verifier NO 처리. |

---

## 7. 하네스별 적용 현황

| 하네스 | ledger 위치 | 첫 사례 | promotion 단계 |
|--------|------------|--------|---------------|
| **tw-mail** | `.claude/tw-mail/supersession-ledger.json` | G-MAIL-18-012 → G-MAIL-19-007 (2026-05-22 ack) | **2 (검증 완료)** |
| **tw-harness** | `.claude/tw-harness/supersession-ledger.json` | 미발생 (빈 ledger) | 1 (신설) |
| **tw-grid** | `.claude/tw-grid/supersession-ledger.json` | 미발생 (빈 ledger) | 1 (신설) |

---

## 8. 인용 가이드

각 하네스 `policies/INDEX.md` 에서:
```markdown
| SHARED-SUPERSEDE | [_shared/cross-module-supersession.md](../../policies/_shared/cross-module-supersession.md) | Cross-module Goal supersession 3-step workflow + ledger + owner ack |
```

각 하네스 본문에서:
```markdown
→ **SSoT**: [SHARED-SUPERSEDE/§3 (3-step workflow)](../../policies/_shared/cross-module-supersession.md#3-해결-패턴-3-step-workflow)
```

본문 복사 금지 — 변경 필요 시 본 file 만 수정 → 3개 하네스 자동 동기화.

---

## 9. 변경 이력

| 날짜 | 변경 | 출처 |
|------|------|------|
| 2026-05-22 | 신설 | tw-mail G-MAIL-18-012 → G-MAIL-19-007 첫 사례 후 promotion 사용자 명시 요청 |
