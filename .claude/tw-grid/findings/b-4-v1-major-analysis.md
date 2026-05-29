# B-4 — v1.0.0 major 4건 changeset 원인 분석 + downgrade 권고

- 작성일: 2026-05-18
- 작업: tw-grid B-4 (publish 전 semver 정합성 점검)
- 대상 패키지: `@tomis/grid-renderers`, `@tomis/grid-pro-master`, `@tomis/grid-pro-merging`, `@tomis/grid-pro-tracking` (모두 현재 v1.0.0)
- 입력 commit:
  - `f5ea968` — initial commit (16 changeset 파일 + package.json v0.0.0)
  - `fd5b43b` — `pnpm changeset version` 실행 commit (13 패키지 version bump + CHANGELOG 통합 + 16 changeset 파일 삭제)
- 방식: read-only 분석 (git history + package.json + CHANGELOG 인용)

---

## 0. Executive summary

**현 상태는 semver semantics 위반 + author intent 일관성 결함이다. 권고는 4 패키지 모두 v1.0.0 → v0.1.0 downgrade.**

- 16 changeset 모두 `minor` 또는 `patch`만 선언. **major 선언 0건** (frontmatter 직접 인용으로 확정).
- 9개 패키지는 v0.0.0 → v0.1.0 으로 정상 bump. 4개 패키지만 v0.0.0 → **v1.0.0** 비정상 jump.
- `fd5b43b` commit body 는 "major declare 결과"라고 주장하나, **실 changeset 파일에는 major 선언 부재** — 즉 commit 메시지의 self-attribution 이 사실과 불일치.
- 동일 changeset(`adr-001-license-wiring` minor) 을 받은 `grid-pro-agg`(→ v0.1.0) 와 `grid-pro-merging`/`grid-pro-tracking`(→ v1.0.0) 의 결과 차이가 결정적 반증.

다음 4개 핵심 의문에 대한 답:
1. **changeset 에 `major` declare 가 있었나?** — **없다. 16/16 모두 minor 또는 patch.**
2. **있다면 어느 ADR / changeset?** — 해당 없음.
3. **semver semantics 적절성?** — **부적절.** v0.x → v1.0.0 = stable API contract 선언인데, Wave 1-5 작업 어떤 ADR 도 stable 선언 처방 부재. 게다가 ADR-006/009/010/013/014 모두 "deprecation alias 1 cycle 유지 후 **다음 major 에서 제거**"라고 명시 — 즉 **현 cycle 은 명시적으로 minor 임을 ADR 본문이 자기증언**.
4. **publish 전 downgrade 권고?** — **예. 4 패키지 모두 v1.0.0 → v0.1.0** (옵션 B). 단 npm publish 미실행 (D 비가역 미발생) → 단순 package.json + CHANGELOG 수정으로 무비용 복구 가능.

---

## 1. 16 changesets frontmatter declare 매트릭스 (실 데이터)

**`git show f5ea968:.changeset/*.md`** 로 직접 추출한 frontmatter:

| # | Changeset 파일 | 영향 패키지 | declare | 비고 |
|---|---|---|---|---|
| 1 | `adr-001-license-wiring.md` | grid-license, grid-pro-agg, grid-pro-datamap, grid-pro-header, **grid-pro-master**, **grid-pro-merging**, grid-pro-range, **grid-pro-tracking** (8) | **minor** × 8 | ADR-001 7 Pro Watermark wiring |
| 2 | `adr-002-cross-package-wiring.md` | **grid-renderers**, grid-core | **minor** + **patch** | ADR-002 wireRegistry |
| 3 | `adr-003-meta-facade.md` | @tomis/grid | **minor** | ADR-003 메타 facade |
| 4 | `adr-005-grid-export-entry.md` | grid-export | **minor** | ADR-005 exportRowsToExcel |
| 5 | `adr-006-tomis-column-def-rename.md` | grid-pro-datamap | **minor** | ADR-006 DataMapColumnDef rename + alias |
| 6 | `adr-007-storage-adapter.md` | grid-core, **grid-pro-master** | **minor** + **minor** | ADR-007 internal/storage |
| 7 | `adr-008-016-onrowclick-types.md` | grid-core, grid-pro-header | **minor** + **minor** | ADR-008/016 |
| 8 | `adr-009-layering.md` | grid-core, grid-features | **minor** + **minor** | ADR-009 layering |
| 9 | `adr-010-sortbadge-consolidation.md` | grid-core, grid-features | **minor** + **minor** | ADR-010 SortBadge |
| 10 | `adr-013-dead-api-deprecation.md` | grid-core | **minor** | ADR-013 dead API deprecation |
| 11 | `adr-014-d-partial.md` | **grid-renderers** | **minor** | ADR-014 LinkCell/ButtonCell `value` prop |
| 12 | `adr-018-tag-progress-wiring.md` | grid-core, **grid-renderers** | **minor** + **minor** | ADR-018 tag/progress slot |
| 13 | `grid-export-g001-excel.md` | grid-export | **minor** | historical G-001 |
| 14 | `grid-pro-master-g001-master-detail.md` | **grid-pro-master**, grid-core, grid-license | **minor** + **minor** + **patch** | historical G-001 |
| 15 | `grid-pro-master-g002-context-menu.md` | **grid-pro-master** | **minor** | historical G-002 |
| 16 | `grid-pro-master-g003-expanded-persistence.md` | **grid-pro-master** | **minor** | historical G-003 |

**결과: 16 changesets × 0 major declare.** 

집계:
- minor 선언 count: 32
- patch 선언 count: 2
- **major 선언 count: 0**

---

## 2. v1.0.0 4 패키지 변경 누적

| 패키지 | 영향 changesets | 최고 declare | 예상 (semver 표준) | 실제 결과 | 차이 |
|---|---|---|---|---|---|
| grid-renderers | adr-002 + adr-014 + adr-018 (3건) | **minor** | v0.0.0 → **v0.1.0** | **v1.0.0** | ❌ 9 minor 만큼 점프 |
| grid-pro-master | adr-001 + adr-007 + G-001/002/003 (5건) | **minor** | v0.0.0 → **v0.1.0** | **v1.0.0** | ❌ 9 minor 만큼 점프 |
| grid-pro-merging | adr-001 만 (1건) | **minor** | v0.0.0 → **v0.1.0** | **v1.0.0** | ❌ 9 minor 만큼 점프 |
| grid-pro-tracking | adr-001 만 (1건) | **minor** | v0.0.0 → **v0.1.0** | **v1.0.0** | ❌ 9 minor 만큼 점프 |

**비교 대조군 (정상 동작):**

| 패키지 | 영향 changesets | 최고 declare | 결과 | 정합? |
|---|---|---|---|---|
| grid-pro-agg | adr-001 만 (1건) | minor | v0.0.0 → **v0.1.0** | ✅ |
| grid-pro-range | adr-001 만 (1건) | minor | v0.0.0 → **v0.1.0** | ✅ |
| grid-pro-header | adr-001 + adr-008-016 (2건) | minor | v0.0.0 → **v0.1.0** | ✅ |
| grid-pro-datamap | adr-001 + adr-006 (2건) | minor | v0.1.0 → **v0.2.0** | ✅ |
| grid-license | adr-001 (+ G-001 patch) | minor | v0.0.0 → **v0.1.0** | ✅ |
| grid-core | adr-002/007/008/009/010/013/018/G-001 (8건) | minor | v0.0.0 → **v0.1.0** | ✅ |
| grid (meta) | adr-003 (1건) | minor | v0.0.0 → **v0.1.0** | ✅ |
| grid-features | adr-009 + adr-010 (2건) | minor | v0.2.0 → **v0.3.0** | ✅ |
| grid-export | adr-005 + G-001 (2건) | minor | v0.1.0 → **v0.2.0** | ✅ |

**핵심 반증**:
- `grid-pro-agg` 와 `grid-pro-merging` 은 **단 하나 동일한 changeset(`adr-001`, minor)** 만 받고 동일하게 v0.0.0 에서 출발.
- 그러나 agg → v0.1.0, merging → v1.0.0.
- 동일 입력에서 다른 출력이므로 **changeset 선언이 원인이 아님이 명확.**

---

## 3. 원인 진단 — changesets/cli 의 정상 동작이 아닌 별도 메커니즘

### 3.1 changesets/cli 표준 동작 검증
- `@changesets/cli` 의 `version` 명령은 v0.x 패키지에 대해 별도 모드 없이 standard semver bump 적용.
- 즉 v0.0.0 + minor changeset = **v0.1.0** (v1.0.0 아님).
- `.changeset/config.json` 검사 결과 — 기본 설정. `linked: []`, `fixed: []`, `ignore: []`, `updateInternalDependencies: "patch"`. major-forcing 옵션 무.
- `.changeset/pre.json` 부재 (pre-release 모드 아님).
- 즉 changesets 도구가 자체적으로 v1.0.0 으로 bump 했을 메커니즘이 **표준 동작상 존재하지 않음.**

### 3.2 실 메커니즘 후보 (확정 불가, 사후 추정)
실 changeset 도구 실행 로그가 보존되지 않아 직접 확인 불가하나, 가능한 후보:

| 후보 | 가능성 | 비고 |
|---|---|---|
| (a) 누군가 `pnpm changeset version` 후 package.json 을 수동 편집 | 중 | CHANGELOG 의 `### Minor Changes` 표기와 일치하나 package.json만 1.0.0 — drift |
| (b) 별도 추가 changeset 파일이 실행 중간에 존재했다가 삭제 | 낮 | git history 에 흔적 없음 (initial commit 의 17 파일 = 16 changeset + config.json 만) |
| (c) 일부 패키지에 대해 `pnpm changeset version --release-as 1.0.0` 같은 비표준 명령 실행 | 중 | changesets/cli 에 `--release-as` 플래그는 공식 미존재. force version 도구 사용 가능 |
| (d) Author 의 의도적 수동 stable 선언 (commit body 의 "major declare" 자기-증언 일치) | 중 | commit body 는 "changeset 자체 major declare 결과" 라고 잘못 단정 — 자기-증언과 changeset 파일 내용 불일치 |

**가장 가능성 높은 시나리오**: (a) 또는 (d) — `changeset version` 출력이 v0.1.0 이었으나, 작성자가 publish 첫 stable release 의도로 4 패키지 만 수동으로 1.0.0 으로 편집. 그러나 CHANGELOG 의 `### Major Changes` 섹션을 만들지 않아 unintentional drift 발생.

### 3.3 commit body 의 self-contradicting 텍스트
fd5b43b commit body:
> `Constraint: v1.0.0 4 패키지 (grid-renderers + pro-master + pro-merging + pro-tracking) — changeset 자체 major declare 결과. publish 전 적절성 재검토 권고`

작성자 자신이 **"publish 전 적절성 재검토 권고"** 라고 명시함 — 즉 작성 시점부터 의문이 있던 결과. 본 B-4 가 그 권고 응답.

또한:
> `Confidence: high (changeset 도구 자동 처리 + commit 만)`

"changeset 도구 자동 처리"라는 주장이 changeset 파일 frontmatter 실증 데이터와 불일치 — **commit body 의 high confidence 진술이 실 데이터로 반증됨.**

---

## 4. semver semantics 분석 — v0.x → v1.0.0 의 의미

### 4.1 npm/semver 공식 의미 (semver.org §4 / §5)
- **v0.x.y**: "Major version zero (0.y.z) is for initial development. Anything **may change at any time**. The public API should not be considered stable."
- **v1.0.0**: "Version 1.0.0 defines the **public API**. The way in which the version number is incremented after this release is dependent on this public API and how it changes."

즉 v1.0.0 = stable API contract 선언. 한번 v1.0.0 으로 publish 한 후의 breaking change 는 v2.0.0 으로만 가능.

### 4.2 Wave 1-5 + 잔존 작업이 stable 선언 정합?

**ADR 본문 자기-증언 (`MOD-GRID-REFACTOR-2026-05-17-decisions.md`):**

복수의 ADR 이 "다음 major 에서 제거" 라고 명시:
- ADR-006: `TomisColumnDef` deprecation alias — "removed in next major"
- ADR-009: `useColumnDrag` 등 grid-features alias — "removed in next major"
- ADR-010: `SortBadge` grid-features alias — "removed in next major"
- ADR-013: 5 dead API deprecation alias — "removed in next major"
- ADR-014: `label` prop alias on LinkCell/ButtonCell — "removed in next major"

→ ADR 본문은 **"이번은 minor; alias 는 다음 major (v2.0.0) 에서 제거"** 라는 일관된 전제 위에 작성됨. 본 commit 이 4 패키지를 v1.0.0 으로 점프시킨 것은 **ADR 본문 정합 위배** — 다음 deprecation 제거 시점이 v2.0.0 으로 너무 일찍 도래.

**4 패키지 별 stable 선언 적합성:**

| 패키지 | stable v1.0.0 정합? | 사유 |
|---|---|---|
| grid-renderers | ❌ 부적합 | ADR-014 LinkCell.label / ButtonCell.label deprecation alias 유지 중. 다음 cycle 에서 제거 예정 (= 다음 major). v1.0.0 stable 이면 alias 제거가 v2.0.0 이라는 너무 일찍 major bump 트리거 |
| grid-pro-master | ❌ 부적합 | G-003 의 `TreeGrid` / `ColumnPinGrid` alias re-export 가 정확히 deprecation 임 (useDeprecationWarn 적용). 다음 major 에서 제거 예정 — 동일 사유 |
| grid-pro-merging | ❌ 부적합 | adr-001 Watermark wiring 만 받음. **DOM 변경이 "stable" 일 만큼 검증 안 됨** (B-1 hardening 후에도 visual regression baseline PNG 미생성 — `Confidence: high` 가 아닌 `moderate` 상태). v1.0.0 stable 선언은 시기상조 |
| grid-pro-tracking | ❌ 부적합 | adr-001 Watermark wiring 만 받음. legacy alias `ChangeTrackingGrid` 자체가 deprecation 대상. v1.0.0 = stable = legacy alias 가 stable contract 가 되어 모순 |

### 4.3 정합 옵션 C 검토 (advisor 분석 — Wave 1-5 누적 stable 선언 가능?)
이론상:
- grid-renderers: 8 cell adapter wiring 완료 → stable surface 충분히 갖춤
- grid-pro-master: G-001/002/003 5 신기능 + ADR-007 storage refactor → 기능 면적 완전
- grid-pro-merging/tracking: ADR-001 만 → stable 면적 부족

그러나 stable 선언의 **충분조건**은 (a) public API 면적이 충분히 갖춰지고 (b) deprecation alias 정리가 끝났을 때. 현 상태는 (b) 부재 — 모든 4 패키지에 직간접 deprecation alias 가 남아있음.

→ **옵션 C (stable 선언 유지 정당화) 불가.**

---

## 5. 4 패키지 권고

| 패키지 | 현 | 권고 | 옵션 | 사유 |
|---|---|---|---|---|
| **grid-renderers** | v1.0.0 | **v0.1.0** | **B (downgrade)** | (1) major changeset declare 부재 (2) ADR-014 `label` alias 미정리 (3) ADR-018 신규 slot wiring 도 minor declare |
| **grid-pro-master** | v1.0.0 | **v0.1.0** | **B (downgrade)** | (1) G-001/002/003 5 changeset 모두 minor declare (2) TreeGrid/ColumnPinGrid alias re-export deprecation 진행 중 (3) baseline PNG 미생성 |
| **grid-pro-merging** | v1.0.0 | **v0.1.0** | **B (downgrade)** | (1) adr-001 만 받음 — agg/range 와 동일 입력 (2) agg → v0.1.0 인데 merging → v1.0.0 비대칭 (3) B-1 hardening 후 baseline 미확정 |
| **grid-pro-tracking** | v1.0.0 | **v0.1.0** | **B (downgrade)** | (1) adr-001 만 받음 (2) `ChangeTrackingGrid` 자체가 legacy alias → stable contract 모순 (3) agg/range/header 와 동일 입력 |

**4/4 모두 옵션 B (v1.0.0 → v0.1.0 downgrade) 권고.** 옵션 A (유지) 와 옵션 C (stable 선언 정당화) 모두 reject — 사유 §4.2 / §4.3.

---

## 6. Downgrade 실행 방안 (사용자 결정 후)

### 6.1 비용/리스크
- npm publish 미실행 (commit fd5b43b 의 `Constraint: publish 보류` 명시) → **외부 사용자 영향 0건**.
- dist artifact 영향 0건 (version 변경은 빌드 결과물에 영향 없음).
- 4 개 package.json + 4 개 CHANGELOG.md 만 수정.
- 무비용 무리스크.

### 6.2 실행 옵션

**옵션 1: 직접 수동 수정 (권장)** — changesets 도구 우회
```
# 4 개 package.json 의 version 필드만 직접 수정
packages/grid-renderers/package.json:    "version": "1.0.0" → "0.1.0"
packages/grid-pro-master/package.json:   "version": "1.0.0" → "0.1.0"
packages/grid-pro-merging/package.json:  "version": "1.0.0" → "0.1.0"
packages/grid-pro-tracking/package.json: "version": "1.0.0" → "0.1.0"

# 4 개 CHANGELOG.md 의 ## 1.0.0 헤더만 ## 0.1.0 으로 변경
# (entry 내용은 minor 선언 그대로 유지 → ## 0.1.0 + ### Minor Changes 자연 정합)
```

**옵션 2: 16 changeset 재생성 + version 재실행** — 비권장
- 16 changeset 파일은 fd5b43b 에서 이미 삭제됨 → 복구 후 재실행 시 동일 결과 (v1.0.0 jump 가 도구 자체 동작 아니라면 재실행해도 v0.1.0 정상 출력) 또는 비결정성 노출.
- 옵션 1 이 단순 + 결정성 + 안전.

### 6.3 추가 정리 산출물 (옵션 1 수반)

- (a) commit 메시지에 "v1.0.0 4 패키지 발견 → 원인 분석 결과 changeset 자체 major 선언 부재 → semver 위반 + ADR 본문 위배 → v0.1.0 downgrade. publish 영향 0건" 명시.
- (b) ADR-XX (신규) 또는 ID-LEDGER 에 본 downgrade 결정 등록.
- (c) 차후 v1.0.0 stable 선언 시점은 "ADR-006/009/010/013/014 deprecation alias 5건 모두 제거 완료" 충족 후 별도 cycle.

---

## 7. publish 전 사용자 결정 지점 (4건)

본 보고서는 권고만 — 실 실행은 사용자 명시 승인 후.

1. **D-1 (downgrade 승인)**: 4 패키지 v1.0.0 → v0.1.0 수정 승인?
   - 권고: 승인 (사유 §5).
2. **D-2 (실행 방식)**: 옵션 1 (직접 수정) vs 옵션 2 (changeset 재실행)?
   - 권고: 옵션 1 (사유 §6.2).
3. **D-3 (commit 단위)**: 4 패키지 일괄 commit vs 패키지 별 commit?
   - 권고: 일괄 commit — semver hygiene 결정은 한 묶음 (단일 ADR 단위로 추적 가능).
4. **D-4 (v1.0.0 미래 선언 정책)**: 각 패키지 v1.0.0 stable 선언 트리거 조건 명시?
   - 권고: "deprecation alias 5건 모두 정리 + baseline PNG 생성 + 외부 사용자 1+ 도달" 3 조건 충족 후. policies/_shared/semver-stable-declaration.md (신규) 권장.

---

## 8. advisor 활용 명시 (§6 정책)

본 분석은 advisor 1회 호출 (보고서 작성 전):

**advisor 입력 (전체 transcript 자동 전송):**
- 16 changeset frontmatter 인용
- 4 패키지 v1.0.0 결과 + 9 패키지 v0.1.0 결과
- 초기 가정 "changeset 자체 major declare 결과"

**advisor 출력 — 결정적 반증 제공:**
- "grid-pro-agg 와 grid-pro-merging 은 동일 adr-001 minor changeset 만 받음. agg → v0.1.0, merging → v1.0.0 — 동일 입력에서 다른 출력이므로 changeset 선언이 원인 아님" (§3.1).
- "report 작성 전 fd5b43b 의 package.json diff 직접 확인하여 메커니즘 명명 의무" — diagnosis 강화.
- "재시 도구 동작이 표준 동작 아닐 가능성 (수동 편집 또는 비표준 명령) 진단 필요" — §3.2 후보 (a)(b)(c)(d) 도출 기반.

→ advisor 가 단순 권고 보고서를 "원인 진단 + 권고" 보고서로 격상시킴. **advisor 호출 없었으면 §3 진단 누락 + commit body 의 잘못된 self-attribution 답습 가능성 존재.**

**§6 advisor 우선 원칙 적용**: critical 5 (B 외부 사용자) 해당하나 본 작업은 **read-only 권고 보고서** 단계 — 실 downgrade 는 사용자 publish 시점 결정.

---

## 9. 결과 체크리스트

- [x] 16 changesets frontmatter 분석 (§1 매트릭스)
- [x] major declare changesets 식별 — **0건** (§1, §2)
- [x] commit body self-attribution 모순 식별 (§3.3)
- [x] semver 표준 + ADR 본문 정합 분석 (§4)
- [x] 4 패키지 권고 (사유 + 옵션) — 4/4 모두 옵션 B downgrade (§5)
- [x] downgrade 실행 방안 + 비용/리스크 (§6)
- [x] publish 전 사용자 결정 지점 4건 (§7)
- [x] advisor 활용 명시 (§8)

---

## 10. 출력 인용 (1줄 요약)

| 항목 | 값 |
|---|---|
| 보고서 경로 | `.claude/tw-grid/findings/b-4-v1-major-analysis.md` |
| 16 changesets 중 major declare | **0건** |
| 4 패키지 권고 | grid-renderers / pro-master / pro-merging / pro-tracking 모두 **옵션 B (v1.0.0 → v0.1.0 downgrade)** |
| publish 전 사용자 결정 지점 | **4건** (D-1 downgrade 승인 / D-2 방식 / D-3 commit 단위 / D-4 stable 미래정책) |
| advisor 활용 | **1회** (보고서 작성 전, 진단 결정적 반증 도출) |
