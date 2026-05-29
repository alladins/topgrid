# Wave 5 — ADR-017 Spec Writer 결과

**작성일**: 2026-05-17
**상태**: completed (권고 시나리오 **X-1 (ADR-017 폐기)** 채택, implementer 위임 **불필요**)
**원본 task**: ADR-001 sub-spec `wave2-adr-001-sub-spec.md:738` 의 ADR-017 신설 권고
**참조 ADR**: ADR-001 (Wave 2 흡수 영역), ADR-015 (transitional sweep 정합), ADR-MOD-GRID-00-012 (transitional inline stub sunset), ADR-MOD-GRID-99-B (Storybook 부트스트랩)
**실 코드 변경**: 0건 (spec + 결번 marker 만)

---

## 0. Executive Summary

**결론**: **ADR-017 폐기 (시나리오 X-1)**. 본문 작성 없음. ADR 번호 017 결번 처리 + 1단락 결번 marker (decisions.md ADR-016 ↔ ADR-018 사이) 추가 — **약 30 line, 본문 0 line**.

**핵심 근거 (primary source 인용)**:

`wave2-adr-001-sub-spec.md:738` (직접 인용):
> ADR-017 (신설 검토 — 본 sub-spec 으로 부분 흡수): MultiRowHeader + DataMapCell 의 license enforcement 정책. **본 sub-spec 채택 후 ADR-001 본문에 흡수 가능 (별도 ADR 불필요)**.

sub-spec 작성자 본인이 조건부 retraction 명시. **조건 = 사용자 §9.1=B + sub-spec 권고 (H-D + D-D) 채택**. ADR-001 본문 line 36-44 + Implementation Note (line 99-110) 가 충족 확인. → retraction 발효. → ADR-017 본문 작성 의무 소멸.

**다음 단계**: 본 spec 채택 시 implementer 위임 불필요. decisions.md 의 ADR-017 결번 marker (이미 본 spec 과 함께 추가됨) 가 audit trail 보존.

---

## 1. ADR-001 sub-spec 의 ADR-017 권고 사유 재확인

### 1.1 원 권고 인용 (file:line)

`wave2-adr-001-spec.md:31` (1차 spec, sub-spec 이전):
> **Step 3 (별도 ADR)**: MultiRowHeader + DataMapCell 의 wiring 정책 — ADR-001a (sub-ADR) 또는 ADR-017 신설 필요

`wave2-adr-001-spec.md:495-507` (사용자 검토 §9.1 — 5/7 축소 vs 7/7 강제 분기 명시):
> **§9.1 본 ADR 범위 조정 — MultiRowHeader + DataMapCell 제외** … 본 ADR 범위를 **5 컴포넌트** … 로 축소. MultiRowHeader + DataMapCell 의 enforcement 는 별도 sub-ADR 또는 **ADR-017 신설** … (의문 — DataMapCell 사용 grid 자체가 다른 Pro 패키지일 수도 있음). **결정 필요**: 사용자가 본 spec 의 5/7 축소를 승인하는가? 또는 7 모두 강제하고 MultiRowHeader/DataMapCell 의 wiring 방안을 본 ADR 안에서 추가 결정하는가?

`wave2-adr-001-spec.md:566` (10.3 별도 ADR 권고):
> **ADR-017 (신설)**: MultiRowHeader + DataMapCell 의 license enforcement 정책 (본 ADR 9.1 결과)

`wave2-adr-001-sub-spec.md:738` (sub-spec — 본 retraction):
> **ADR-017** (신설 검토 — 본 sub-spec 으로 부분 흡수): MultiRowHeader + DataMapCell 의 license enforcement 정책. **본 sub-spec 채택 후 ADR-001 본문에 흡수 가능 (별도 ADR 불필요)**.

### 1.2 권고 시점 가정 vs 실 결정

| 시점 | 가정 | 실 결정 |
|------|------|--------|
| 1차 spec (`wave2-adr-001-spec.md:31, 503, 566`) | §9.1 미정 — A (5/7 축소) 또는 B (7/7 강제) 가능 | n/a |
| sub-spec (`wave2-adr-001-sub-spec.md:738`) | §9.1=B 채택 + H-D + D-D 가정 → "본 sub-spec 채택 후 흡수 가능" | n/a |
| 사용자 결정 (Wave 2) | n/a | **§9.1=B (7/7 강제) + (b) 패키지 단위 granularity + H-D + D-D + §9.4=C minor + 즉시 Watermark** (decisions.md:36-44) |
| Wave 2 implementation (`wave2-adr-001-result.md`) | n/a | 7/7 wiring + H-D `<thead>` watermark row + D-D singleton portal — **완료** (decisions.md:99-110 Implementation Note) |

### 1.3 ADR-001 흡수 영역 vs ADR-017 잔여 영역 표

| 영역 | ADR-017 원 권고 (1차 spec §9.1=A 분기) | ADR-001 Wave 2 흡수 | 잔여 |
|------|-----------------------------------|---------------------|------|
| MultiRowHeader enforcement 패턴 결정 (portal vs contract 변경 vs `<thead>` 내 `<tr>`) | ✓ 권고 | **H-D 채택** (decisions.md:38) — `<thead>` 내 `<tr><th colSpan=N><Watermark required/></th></tr>` watermark row prepend + `enableStickyHeader === true` 시 `sticky top-0 z-20` (D-3 = a) | 0 |
| DataMapCell enforcement 패턴 결정 (per-cell vs per-row vs per-table vs singleton portal) | ✓ 권고 | **D-D 채택** (decisions.md:39) — `useWatermarkEnforcement()` void hook + ref-counted createRoot 1회 mount + document.body 의 singleton portal | 0 |
| Granularity 결정 (컴포넌트 단위 vs 패키지 단위) | ✓ 권고 (1차 spec §9.1 의 sub-question) | **(b) 패키지 단위** 채택 (decisions.md:37) | 0 |
| Watermark 의 시각 회귀 baseline | △ 권고 가능 영역 | n/a — **MOD-GRID-99-B/G-002 Storybook 부트스트랩** 별도 ledger (decisions.md:101 알려진 한계 #2) | n/a (별도 ADR) |
| Inline stub sweep | × ADR-017 원 권고 영역 아님 | n/a — **ADR-MOD-GRID-00-012 Sunset** 별도 ledger (transitional, MOD-GRID-99-A/G-002 미출하 의존) | n/a (별도 ADR) |
| stale build artifact sweep (`verifyLicense` dist) | × ADR-017 원 권고 영역 아님 | n/a — **ADR-015 Wave 1+3** 완료 | n/a (별도 ADR — 완료) |

**결론**: ADR-001 본문 + sub-spec 의 H-D + D-D 결정으로 ADR-017 원 권고 영역 **3/3 항목** (MultiRowHeader / DataMapCell / Granularity) **완전 흡수**. 잔여 0.

---

## 2. Transitional inline stub 인벤토리 (잔재 위치)

ADR-017 의 가능 잔여 영역 (a) 분석을 위한 실증 인벤토리. **결론: ADR-017 영역 아님 — ADR-MOD-GRID-00-012 Sunset 영역**.

### 2.1 Inline stub 함수 정의 잔재 (5 파일)

`Grep "_verifyGridLicenseStub\\|verifyOrWarn" packages/ --glob "!**/dist/**"` 결과 정리:

| 패키지 | 파일 | line | 패턴 |
|--------|------|------|------|
| grid-pro-agg | `src/AggregationGrid.tsx` | 52 (정의), 56 (호출) | `verifyOrWarn` |
| grid-pro-merging | `src/MergingGrid.tsx` | 22 (정의), 25 (호출) | `verifyOrWarn` |
| grid-pro-range | `src/RangeSelectGrid.tsx` | 39 (정의), 99 (호출) | `_verifyGridLicenseStub` |
| grid-pro-range | `src/DragFillHandle.tsx` | 19 (정의), 35 (호출) | `_verifyGridLicenseStub` |
| grid-pro-range | `src/useCellRange.ts` | 29 (정의), 77 (호출) | `_verifyGridLicenseStub` |
| grid-pro-range | `src/useClipboard.ts` | 27 (정의), 38 (호출) | `_verifyGridLicenseStub` |
| grid-pro-range | `src/useKeyboardEdit.ts` | 31 (정의), 87 (호출) | `_verifyGridLicenseStub` |
| grid-pro-range | `src/useKeyboardNav.ts` | 23 (정의), 57 (호출) | `_verifyGridLicenseStub` |

**총 8 stub 함수 정의 + 호출** (grid-pro-agg 1 + grid-pro-merging 1 + grid-pro-range 6).

### 2.2 module-load side-effect `checkLicense();` 잔재 (7 파일)

`Grep "^checkLicense\\(\\);" packages/*/src/index.ts` 결과:

| 패키지 | 파일:line |
|--------|----------|
| grid-pro-agg | `src/index.ts:3` |
| grid-pro-datamap | `src/index.ts:3` |
| grid-pro-merging | `src/index.ts:3` |
| grid-pro-tracking | `src/index.ts:3` |
| grid-pro-master | `src/index.ts:3` |
| grid-pro-range | `src/index.ts:3` |
| grid-pro-header | `src/index.ts:3` |

**총 7 패키지 모두 `index.ts:3` 에 side-effect `checkLicense();`** (결과 폐기 — ADR-001 의 결정 53-58 line 사유 동일). `wave2-adr-001-result.md:64, 98` 명시 — ADR-001 범위 외, **별도 ADR sweep 대상**.

### 2.3 sweep 정책 위치 — ADR-MOD-GRID-00-012 Sunset

`MOD-GRID-00-decisions.md:694-698` 인용:
> Sunset 단계:
> 1. MOD-GRID-99-A/G-002 출하 완료 → grid-license 패키지에 `verifyGridLicense` 또는 `verifyOrWarn` 실제 export.
> 2. 모든 Pro 패키지 `peerDependencies` 에 `@tomis/grid-license` 추가 (별도 maintenance Goal).
> 3. 인라인 stub 을 `import { verifyOrWarn } from '@tomis/grid-license'` 로 교체.
> 4. 본 ADR + C-33 에 deprecation marker 추가 (사용 금지로 전환). C-24 (라이선스 명시 의무) 는 유지.

**핵심**: ADR-001 이 출하한 `useLicenseStatus()` / `useWatermarkEnforcement()` 는 **새 API**. ADR-MOD-GRID-00-012 sunset 이 기대한 `verifyGridLicense` 실 export 와 **다름**. inline stub sweep 은 여전히 **MOD-GRID-99-A/G-002 출하** (real `verifyGridLicense` with signature + expiry + domain checks) 에 의존. **ADR-001 무관 + ADR-017 영역 아님**.

`wave2-adr-001-result.md:98` 의 알려진 한계 #4:
> **inline stub 잔재** — 7 Pro 패키지의 `index.ts:3 checkLicense();` (side-effect 호출, 결과 폐기) + agg/merging/range 의 inline `verifyOrWarn` / `_verifyGridLicenseStub` 함수 — 본 ADR 범위 외, **ADR-015 sweep 대상**.

→ ADR-001 자체가 "별도 ADR sweep 대상" 명시. 이미 ADR-015 (stale build artifact sweep) 가 dist 산출물 sweep 완료 (`wave3-adr-015-result.md`). **src inline stub sweep 은 ADR-MOD-GRID-00-012 Sunset (별개 트랙)**.

---

## 3. 시나리오 평가 (X-1 ~ X-5)

### X-1: ADR-017 폐기 (권고)

**근거**:
- sub-spec line 738 의 조건부 retraction 충족 (사용자 §9.1=B + H-D + D-D 채택 + ADR-001 Wave 2 implemented).
- ADR-017 원 권고 영역 3/3 (MultiRowHeader / DataMapCell / Granularity) 흡수 완료. 잔여 0.
- 잔여 후보 (a)(b)(c)(d) 모두 다른 ADR/ledger 가 owner.

**비용**: 결번 marker 약 30 line (본문 0) — 0 implementer 시간.

**위험**: 0. audit trail 은 결번 marker + sub-spec 의 인용으로 보존.

**판정**: **권고**.

### X-2: ADR-017 = transitional sweep (각하)

원 권고 영역 (1차 spec §9.1) 과 무관. ADR-MOD-GRID-00-012 Sunset 이 이미 owner. ADR-017 로 중복 작성 시 audit trail 분산 + 권고 사유 변조. **각하**.

### X-3: ADR-017 = 미래 Pro 컴포넌트 enforcement 패턴 가이드 (각하)

ADR-001 sub-spec §6.2 의 분담 매트릭스 (5 inline + 1 native `<tr>` + 1 portal) 가 이미 패턴 가이드 역할 수행. 두 번째 사례 (DataMapCell-class 가 아닌 새 Pro 컴포넌트) 부재 시 가이드 추출 = **anti-pattern catalog of 1**. premature. **각하**.

### X-4: ADR-017 = 시각 회귀 자동화 (각하)

MOD-GRID-99-B/G-002 (Storybook 부트스트랩) 가 owner. ADR-001 의 deferred 항목 (`wave2-adr-001-result.md:96` "Storybook 시각 검증 deferred") 이 명시. ADR-017 로 중복 신설 시 ledger 충돌. **각하**.

### X-5: ADR-017 = 복합 (a)+(c)+(d) (각하)

(a)(c)(d) 각각이 다른 owner ledger 보유. 묶음 ADR 신설 시 cross-cutting concern 으로 보일 수 있으나, 실제는 분리된 책임 — 묶음의 통일된 사유 부재. **각하**.

---

## 4. 본 spec 의 산출물

### 4.1 decisions.md 결번 marker (이미 추가 — 약 30 line)

`MOD-GRID-REFACTOR-2026-05-17-decisions.md` 의 ADR-016 (line 1197-1273) 와 ADR-018 (line 1275 →) 사이에 **결번 marker 추가**.

내용 골격:
- 제목: `## ADR-MOD-GRID-REFACTOR-2026-05-17-017: 결번 (sub-spec line 738 retraction)`
- 상태: `withdrawn (never authored — 신설 검토 후 부재 처리)`
- 사유 (한 문장): sub-spec line 738 의 조건부 retraction 충족
- 흡수 영역 요약
- 잔여 영역 = 별도 ADR (ADR-MOD-GRID-00-012 Sunset / MOD-GRID-99-B / ADR-015) 명시
- 본 결정의 효과: ADR 번호 017 결번 + 번호 재사용 금지

### 4.2 Index 표 (line 9-27) 갱신

ADR-016 행 다음 + ADR-018 행 앞에 결번 표시 1행 추가:
```
| 017 | (결번 — sub-spec line 738 retraction, ADR-001 에 흡수) | n/a | 0h | n/a |
| 018 | registry slot 정책 — icon + 5 extras + alias (ADR-002 분리) | minor | 4h | P0 (Wave 4) |
```

### 4.3 본 spec 보고서 (`wave5-adr-017-spec.md`)

본 파일 — implementer 위임 불요 명시.

---

## 5. 사용자 결정 지점

### 5.1 BLOCKING 결정

**0건**. sub-spec line 738 의 조건부 retraction 이 사용자 §9.1=B 선택으로 자동 발효 — 별도 사용자 응답 의무 없음.

### 5.2 NON-BLOCKING (사용자 override 가능 — 권고 부정 시)

| 시나리오 override | 의미 | 결과 |
|-----------------|------|------|
| X-2 채택 (ADR-017 = transitional sweep) | ADR-MOD-GRID-00-012 Sunset 와 중복 ADR 신설 | audit trail 분산 — 권고 부정 |
| X-3 채택 (enforcement 패턴 가이드) | 2번째 사례 부재 상태에서 가이드 신설 | premature — 권고 부정 |
| X-4 채택 (시각 회귀 자동화) | MOD-GRID-99-B 와 중복 ADR 신설 | ledger 충돌 — 권고 부정 |
| X-5 채택 (복합) | 묶음 사유 부재 | 권고 부정 |

**기본 권고 유지**: X-1.

---

## 6. 다음 단계 권고

### 6.1 본 spec 채택 시 (X-1)

- **implementer 위임 불필요**. decisions.md 의 결번 marker + Index 표 갱신만으로 audit trail 완결.
- ADR-MOD-GRID-00-012 Sunset 트리거 (= MOD-GRID-99-A/G-002 출하) 가 후속 inline stub sweep 의 owner — 별도 cycle 에서 처리.
- MOD-GRID-99-B Storybook 부트스트랩 (시각 회귀 baseline) 도 별도 cycle.

### 6.2 사용자 override (X-2/X-3/X-4/X-5) 채택 시

새 spec writer cycle 필요 — 해당 시나리오의 본문 작성 + 흡수 영역 재정의 + ledger 충돌 해소 spec 작성.

### 6.3 추가 검토 권고 (선택)

- **ADR ledger 신설** (memory/feedback-tw-mail-adr-number-collision.md 의 N=1 사례) — 본 ADR-017 결번 marker 가 두 번째 사례. promotion N=3 도달 시 ADR 번호 reuse 방지 정책 신설 권고. 단 본 spec 범위 외.

---

## 7. 본 spec 의 검증 메타데이터

| 항목 | 값 |
|------|-----|
| 실 코드 변경 | **0건** (read-only) |
| ADR 본문 작성 | **0 line** (결번 marker 약 30 line — 본문 미수반) |
| 권고 시나리오 | **X-1 (ADR-017 폐기)** |
| primary source 인용 (사유) | sub-spec line 738 (직접 인용) + sub-spec line 736 (1차 spec §10.3 매핑) |
| transitional inline stub 잔재 인벤토리 | 8 stub (grid-pro-agg 1 + grid-pro-merging 1 + grid-pro-range 6) + 7 module-load `checkLicense();` (7 Pro 패키지 모두) — ADR-MOD-GRID-00-012 Sunset 영역 |
| ADR-001 흡수 영역 vs ADR-017 잔여 | 3/3 흡수 (MultiRowHeader H-D + DataMapCell D-D + Granularity (b)) / 잔여 0 |
| 사용자 결정 지점 | **0 BLOCKING** + 4 NON-BLOCKING (X-2~X-5 각하) |
| 다음 단계 | **implementer 위임 불필요** (X-1 채택 시) |

---

## 8. Conjunction Summary (한 줄)

**ADR-017 본문 작성 불필요. 사유 = sub-spec line 738 의 조건부 retraction 이 사용자 §9.1=B + H-D + D-D 채택으로 충족됨. 결과 = decisions.md 의 결번 marker 약 30 line + Index 표 1행 갱신 (이미 추가). implementer 위임 불요. 잔재 영역 (inline stub sweep) 은 ADR-MOD-GRID-00-012 Sunset 별도 트랙 — ADR-017 영역 아님.**
