# ADR-011 실행 결과 — size-limit ignore 정책 통일

**실행일**: 2026-05-17
**Wave**: 1 (의존성 0)
**상태**: partial

---

## 변경 요약

- `.size-limit.json` 12 entry 갱신 (ADR 명시 13번째 entry `grid-license` 는 현재 파일에 부재 → drift 항목으로 기록, 본 ADR 범위 외)
- ignore baseline 출처: tsup.config.ts `external` 배열 (실제 빌드 시 제외 기준)
- ADR-011 baseline 과 비교하여 3개 drift 발견 (하단 §drift 참조)

## diff 요약

| 패키지 | 기존 ignore 개수 | 신 ignore 개수 | 신 ignore 목록 |
|--------|-----------------|---------------|---------------|
| @tomis/grid-core | 0 | 4 | react, react-dom, @tanstack/react-table, @tanstack/react-virtual |
| @tomis/grid-renderers | 0 | 4 | react, react-dom, @tanstack/react-table, @tanstack/react-virtual |
| @tomis/grid-export | 0 | 6 | react, react-dom, @tanstack/react-table, @tanstack/react-virtual, xlsx, jspdf |
| @tomis/grid-features | 7 | 7 | react, react-dom, @tanstack/react-table, @tanstack/react-virtual, date-fns, date-fns/locale, react-datepicker |
| @tomis/grid-pro-tracking | 5 → 5 | 5 | react, react-dom, @tanstack/react-table, @tanstack/react-virtual, @tomis/grid-core |
| @tomis/grid-pro-range | 0 | 4 | react, react-dom, @tanstack/react-table, @tanstack/react-virtual |
| @tomis/grid-pro-datamap | 0 | 4 | react, react-dom, @tanstack/react-table, @tanstack/react-virtual |
| @tomis/grid-pro-merging | 0 | 6 | react, react-dom, @tanstack/react-table, @tanstack/react-virtual, @tomis/grid-core, @tomis/grid-license |
| @tomis/grid-pro-header | 0 | 4 | react, react-dom, @tanstack/react-table, @tanstack/react-virtual |
| @tomis/grid-pro-agg | 0 | 4 | react, react-dom, @tanstack/react-table, @tanstack/react-virtual |
| @tomis/grid-pro-master | 0 | 4 | react, react-dom, @tanstack/react-table, @tanstack/react-virtual |
| @tomis/grid (meta) | 0 | 6 | react, react-dom, @tanstack/react-table, @tanstack/react-virtual, xlsx, jspdf |

**변경 없는 항목**: @tomis/grid-features (7→7, date-fns/locale 유지), @tomis/grid-pro-tracking (content 동일, @tomis/grid-virtual 제거 + @tomis/grid-core 추가 — 기존 ignore의 @tomis/grid-core 가 누락되어 있었으므로 실질 수정됨)

**핵심 변경 내용**:
- 9개 패키지에 ignore 0→4~6개 추가 (grid-core, grid-renderers, grid-export, grid-pro-range, grid-pro-datamap, grid-pro-merging, grid-pro-header, grid-pro-agg, grid-pro-master, grid meta)
- grid-pro-tracking: `@tomis/grid-virtual` 제거 + `@tomis/grid-core` 추가 (tsup external 기준 정렬)
- ignore 출처: tsup.config.ts `external` 배열 (peerDeps 선언과 독립적)

## pnpm size 결과

`pnpm size` 는 build 단계에서 실패 (pre-existing stale artifact — §2.3 finding: grid-pro-master/dist/index.mjs 가 `verifyLicense` import, 실제 export 는 `checkLicense`).

`pnpm size-limit` (build 생략, 기존 dist 측정) 실행 결과:

```
@tomis/grid-core        48.59 kB  (limit: 30 kB)  EXCEEDED +18.59 kB
@tomis/grid-renderers    2.34 kB  (limit: 10 kB)  OK
@tomis/grid-export      13.72 kB  (limit: 20 kB)  OK
@tomis/grid-features     5.08 kB  (limit: 20 kB)  OK
@tomis/grid-pro-tracking 2.99 kB  (limit: 20 kB)  OK
@tomis/grid-pro-range    5.09 kB  (limit: 20 kB)  OK
@tomis/grid-pro-datamap  2.08 kB  (limit: 20 kB)  OK
@tomis/grid-pro-merging  1.17 kB  (limit: 20 kB)  OK
@tomis/grid-pro-header   1.96 kB  (limit: 20 kB)  OK
@tomis/grid-pro-agg      2.95 kB  (limit: 20 kB)  OK
@tomis/grid-pro-master  49.47 kB  (limit: 20 kB)  EXCEEDED +29.47 kB
@tomis/grid (meta)      13 B      (limit: 150 kB)  OK
```

**한도 초과 2개**: @tomis/grid-core, @tomis/grid-master

**원인 분석**:
- `@tomis/grid-core` 48.59 kB: `@tomis/grid-features` 가 grid-core 의 hard dep (workspace:*) 이며 tsup external 에 없음 → grid-features 코드가 grid-core dist 에 번들됨. ADR-011 범위 외 (§4.1 layering inversion 과 연관).
- `@tomis/grid-pro-master` 49.47 kB: tsup external 에 `@tomis/grid-core` 가 없으나 peerDep 으로 선언됨 → grid-core 코드가 grid-pro-master dist 에 번들됨. stale dist 문제 (build 실패로 재측정 불가).

두 초과 모두 ignore 정책과 무관한 pre-existing 이슈.

## 결과 체크리스트 (ADR-011 결과 절 매핑)

- [x] `.size-limit.json` 12 entry 통일된 ignore 패턴 적용 (13번째 grid-license entry 부재 → partial 사유)
- [ ] `pnpm size` 재측정 — 한도 통과 확인: 2개 초과 (grid-core, grid-pro-master) — **ADR-MOD-GRID-00-007 업데이트 필요** 또는 stale dist rebuild 후 재측정
- [ ] CI 통과 검증 (모노레포 CI 외부 — 본 ADR 범위 외)

## 발견된 drift (ADR-011 baseline vs 실제)

### Drift-1: `@tanstack/react-virtual` 범위 불일치

**ADR-011 결정**: `@tanstack/react-virtual` 는 grid-core + grid meta 에만 conditional peer.
**실측**: 모든 13개 패키지 tsup.config.ts 가 `@tanstack/react-virtual` 을 external 로 선언. package.json peerDeps 에도 대부분 선언.

→ **결론**: ADR-011 의 "conditional" 표현이 부정확. 실제로는 공통 external. 본 작업에서는 모든 entry 에 포함 (tsup 기준 우선).

**사용자 확인 필요**: ADR-MOD-GRID-00-008 peer 매트릭스에서 @tanstack/react-virtual 의 적용 대상을 "전체" 로 수정할지 여부.

### Drift-2: `jspdf-autotable` tsup external 미포함

**ADR-011 결정**: `jspdf-autotable` 을 grid-export + grid meta 에 ignore 추가.
**실측**: 모든 패키지 tsup.config.ts 에 `jspdf-autotable` 미포함. package.json peerDeps 에는 선언되어 있으나 빌드에서 externalize 되지 않음.

→ **결론**: size-limit ignore 추가 시 번들에서 제외되지 않은 모듈을 ignore 하면 측정 understating. `jspdf-autotable` 은 ignore 미적용 (tsup external 기준). grid-export/grid 의 실제 jspdf-autotable 사용 여부 추가 조사 권고.

**사용자 확인 필요**: tsup.config.ts 에 `jspdf-autotable` external 추가할지 여부.

### Drift-3: `grid-license` entry .size-limit.json 부재

**ADR-011 결정**: 13 패키지 entry 통일.
**실측**: `.size-limit.json` 에 12 entry (grid-license 없음).

→ **결론**: grid-license 에 entry 추가하려면 limit 값 결정 필요 (ADR-MOD-GRID-00-007 범위). grid-license ignore 는 `[react, react-dom, @tanstack/react-table, @tanstack/react-virtual]` (tsup external 기준).

**사용자 확인 필요**: grid-license entry 추가 + limit 값 결정 (제안: 5 KB, 패키지 자체 코드 minimal).

### Drift-4: grid-pro-tracking 기존 ignore 내용 불일치

**기존 ignore**: `[react, react-dom, @tanstack/react-table, @tanstack/react-virtual, @tomis/grid-core]` (5개)
**tsup external 확인**: `@tanstack/react-virtual` ✓, `@tomis/grid-core` ✓ — 모두 external.
**결론**: 기존 ignore 는 사실 올바름 (tsup external 과 일치). 변경 없음 유지.

단, 기존 ignore 에 `@tomis/grid-core` 가 있었는데 package.json peerDeps 에도 `@tomis/grid-core: workspace:*` 로 선언 — peer + tsup external 양쪽 일치 → 정상.

## 한도 초과 패키지

| 패키지 | 측정값 | 한도 | 초과량 | 원인 |
|--------|--------|------|--------|------|
| @tomis/grid-core | 48.59 kB | 30 kB | +18.59 kB | @tomis/grid-features hard dep 번들 포함 (layering inversion §4.1) |
| @tomis/grid-pro-master | 49.47 kB | 20 kB | +29.47 kB | @tomis/grid-core 미externalize (stale dist — §2.3) |

→ ADR-MOD-GRID-00-007 업데이트 또는 §2.3 stale dist rebuild 후 재측정 필요.

## 다음 단계

1. **사용자 결정 필요**:
   - Drift-1: ADR-MOD-GRID-00-008 매트릭스 `@tanstack/react-virtual` 적용 대상 → "전체" 로 수정
   - Drift-2: tsup.config.ts 에 `jspdf-autotable` external 추가 여부
   - Drift-3: grid-license entry 추가 + limit 값 결정 (5 KB 제안)
2. **§2.3 stale dist 해결 후 `pnpm size` 재실행**: grid-pro-master dist 재빌드 (`verifyLicense` → `checkLicense`) 후 정확 측정
3. **한도 조정 필요 시 ADR-MOD-GRID-00-007 업데이트**: grid-core 30 KB 초과 원인이 §4.1 layering 이면 limit 조정보다 §4.1 수정 선행 검토
