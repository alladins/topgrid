# MOD-GRID-00 — Architecture Decision Records

> 모든 ADR은 다음을 포함: 결정 / 사유 / 대안 2개+ / trade-off / 결과.
> Source: C-14, C-20 (외부 라이브러리 추가) / C-22 (peerDeps) 정책 의무.

---

## ADR-MOD-GRID-00-001: 외부 모노레포 디렉토리 위치

**결정일**: 2026-05-13 (G-001 success-review)
**상태**: accepted
**연관 Goal**: G-001 (스캐폴딩)
**연관 constraint**: C-1, C-6

### 결정

`topvel-grid-monorepo`는 **TOMIS 저장소 외부**(`D:/project/topvel_project/topvel-grid-monorepo/`)에 생성한다.
TOMIS 저장소(`D:/project/topvel_project/TOMIS/`) 내부가 아니다.

### 사유

- 별도 npm publish 대상 (상용 그리드 패키지 13개). TOMIS는 backend/frontend 통합 저장소이며 publish 대상 아님.
- 라이선스 모델 분리: TOMIS는 단일 라이선스, 모노레포는 패키지별(MIT vs Pro EULA) 분리 관리.
- 독립 git 히스토리: 그리드 패키지 changeset/semver는 TOMIS 커밋 사이클과 무관해야 한다.

### 대안

1. **TOMIS 내부 (`TOMIS/packages/`)**: 단일 git 히스토리, 동기화 부담 0. **각하 이유**: npm publish 대상 분리 불가, 라이선스 모델 혼재.
2. **별도 git remote, TOMIS submodule**: 외부 디렉토리 + submodule. **각하 이유**: Windows에서 submodule UX 빈약, success-review 시점에 결정 보류.

### Trade-off

| Pro | Con |
|-----|-----|
| 별도 git 가능 → 독립 publish · 라이선스 분리 | 마이그레이션 중 TOMIS와의 동기화 부담 (G-004 alias 필요) |
| TOMIS 저장소 영향 0 (`affectedUsageFiles: []`) | 검증 시 git diff 기반 검증 불가 (verify F-03 N/A) |
| 외부 디렉토리 rollback이 단순 (`Remove-Item -Recurse`) | spec writer가 매번 외부 경로 합리성(H-02) 입증 부담 |

### 결과

- Spec H-02 합리성 입증을 위해 **조부모(`D:/project/topvel_project/`) 실재 ls 확인** 절차를 spec writer가 수행.
- verify F-03(git diff) 검증은 외부 디렉토리에 한해 **N/A** 허용. 대신 Glob/Read 기반 파일 실재 검증으로 대체.
- G-004에서 `tw-framework-front/vite.config.ts`에 workspace alias 추가 (`@tomis/grid-*` → `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-*/src`).

---

## ADR-MOD-GRID-00-002: 인프라 Goal의 N/A 다수 처리 정책

**결정일**: 2026-05-13 (G-001 success-review)
**상태**: accepted
**연관 Goal**: G-001 (스캐폴딩, 13 N/A / 16 rubric 항목)
**연관 constraint**: C-11 (verifier 산식 정확), F-02 (verifier 자기-무결성)

### 결정

verify-rubric의 `categoryScore = YES / (YES+NO) × 100` 산식에서, **카테고리 전체가 N/A**인 경우 (`YES=0, NO=0, N/A≥1`) `categoryScore = 100` 으로 처리한다.
이를 **vacuous truth** 처리라 부른다.

evidence 필드에는 반드시 "(category vacuous: 전 항목 N/A — {합리적 사유})" 명시.

### 사유

- 인프라 Goal(스캐폴딩, 빌드 도구 도입 등)은 컴포넌트 동작(B 카테고리), 사용처 마이그레이션(D 카테고리)이 본질적으로 적용 불가.
- 산식 `0/0`은 수학적으로 정의되지 않음. 명시적 규칙이 없으면 verifier마다 다른 값(0, 50, 100, NaN) 가정 → 비결정성.
- 적용처가 없는 항목을 NO로 강제 처리하면 인프라 Goal이 비합리적으로 fail.

### 대안

1. **인프라 Goal 전용 별도 rubric**: A/B/C/D/E 외에 INFRA 카테고리 신설. **각하 이유**: rubric 종류 증가 → 학습 부담, 카테고리 매핑 모호.
2. **`0/0 → 0`**: 보수적이지만 인프라 Goal 전체가 항상 fail. **각하 이유**: 검증 시그널 없음, threshold가 무의미.

### Trade-off

| Pro | Con |
|-----|-----|
| 산식 결정성 확보 — verifier가 같은 결과 도출 | 검증 강도 약화 가능성 (특히 G-002+ build 도구 도입 시 A 활성 필수) |
| 인프라 Goal이 합리적으로 통과 | NO 0 + N/A 다수만으로 100점 → 점수 부풀림 비판 가능 |
| 단순 (rubric 한 항목 추가만 필요) | 다음 Goal에서 카테고리 활성 시점을 verifier가 판단해야 함 |

### 결과

- `verify-rubric.md` 점수 산출 섹션에 vacuous rule 추가.
- 다음 Goal G-002 (tsup + tsconfig strict + dual format)은 build 도구 도입 → **A 카테고리 활성 필수**. vacuous rule을 A에 적용 금지.
- verify-rubric에 명시: "Goal 제목이 build/tsup/tsc/vite/size-limit 단어를 포함하면 A 카테고리는 vacuous 처리 금지."

### 모듈 종료 시 관찰 (2026-05-14 MOD-GRID-02 G-006 self-review 추가)

MOD-GRID-02 state 영역 6 Goal (G-001~G-006) 완료 시점:
- 6/6 Goal 모두 hook-only (`affectedUsageFiles=0`)
- 6/6 Goal 모두 verify D 카테고리 vacuous=100
- 6/6 Goal 모두 affectedUsageFiles=0 (해당 사용처 마이그레이션 시점 = MOD-GRID-17)

1=anecdote / 2=pattern / 3=policy 룰 적용 시 **policy 변경 threshold 도달**. 그러나 정책 변경 방향이 **하향**(vacuous 금지화) — 적용 시 G-001~G-006 retroactive damage + MOD-GRID-03~16 hooks-first phase 차단. 본 ADR의 본래 의도 (인프라/hook Goal 정상 점수 부여 + 사용처 채택 phase 별도) 가 phased rollout 전략의 정확한 반영.

**정책 재확인**: 본 ADR-MOD-GRID-00-002 vacuous truth rule 은 phased rollout 의도로 유효. 실제 D 카테고리 evaluation 은 MOD-GRID-17 (usage-site adoption) 에서 시작. MOD-GRID-03~16 hook/util 개발 phase 동안 동일 패턴 유지.

이 모듈-종료 관찰은 정책 변경이 아닌 **재확인 documentation** 임. 차후 (MOD-GRID-17) D 카테고리 real-scoring 시작 시 본 ADR 의 phased rollout intent 가 자동 만료될 것.

---

## ADR-MOD-GRID-00-003: 환경 의존 AC의 documented-deviation 처리

**결정일**: 2026-05-13 (G-001 success-review)
**상태**: accepted
**연관 Goal**: G-001 (AC-005 pnpm install skipped)
**연관 constraint**: C-12 (빌드 0 errors 필수와의 충돌 해결)

### 결정

AC 중 **환경에 의존하는 항목** (CLI 도구 설치 여부, OS 버전, 외부 서비스 가용성 등)이 실행 불가한 경우:

1. **Spec 단계**에서 해당 AC를 EC(엣지 케이스) 섹션과 1:1 매핑하여 사전 명시.
2. **Implement 단계**에서 실행 불가 시 `findings/auto-fixed/MOD-{MOD}-{GOAL}-{slug}.md`에 finding 작성.
3. implement-score JSON `documentedDeviations[]` 배열에 `{ac, reason, finding, resolution}` 객체로 기록.
4. 점수 산정에서는 해당 AC를 **분모에서 제외**(N/A 동등 처리). 직접 매핑 rubric 항목이 N/A 처리됨.
5. 다음 Goal 착수 전 resolution 단계(개발자가 환경 준비) 필수 명시.

### 사유

- AC-005처럼 환경 의존 항목을 fail 처리하면 환경 제약이 있는 implementer는 모든 Goal을 통과 못함.
- 반면 무조건 skip 허용하면 점수 게임 가능성 (모든 AC를 "환경 의존"으로 분류).
- 두 위험 사이 균형: **Spec 단계에서 EC와 1:1 매핑된 항목만 deviation 인정**.

### 대안

1. **모든 환경 의존 AC를 spec 단계에서 제거**: spec이 환경 비의존 AC만 가짐. **각하 이유**: AC-005 같은 "워크스페이스가 실제로 작동하는가" 검증을 포기 못함.
2. **deviation 인정 없이 strict fail**: implementer가 환경 준비를 책임지게 함. **각하 이유**: 실제로 환경 준비가 다음 Goal의 책임인 경우(예: G-002에서 corepack 설치) 1 Goal 단위로 분리 불가.

### Trade-off

| Pro | Con |
|-----|-----|
| 환경 제약을 합리적으로 처리 (자동화 가능성 유지) | 점수 게임 가능성 (악용 시 모든 AC를 deviation으로 분류) |
| EC 1:1 매핑 강제로 악용 방지 | EC 매핑 자체가 spec writer 부담 |
| finding 파일이 감사 추적(audit trail) 역할 | finding 파일 누락 시 환각 (실제 G-001 케이스에서 발생) |

### 결과

- finding 파일 누락은 verifier F-01(evidence 실재)이 잡아야 한다 — 차후 verifier rubric 강화 필요.
- implement-rubric에 환경 의존 deviation 명시 절차 추가.
- specify-rubric에 EC ↔ AC 매핑 권장 사항 추가.

---

---

## ADR-MOD-GRID-00-005: tsup 빌드 도구 선택

**결정일**: 2026-05-13 (G-002 spec)
**상태**: accepted
**연관 Goal**: G-002 (tsup + TypeScript strict + 공유 tsconfig.base.json)
**연관 constraint**: C-9 (외부 라이브러리 도입 ADR 의무), C-20 (라이선스 검증), C-21 (번들 한도)

### 결정

`topvel-grid-monorepo` 13개 패키지의 빌드 도구로 **tsup `^8.4.0`** 을 선택한다.
CJS+ESM dual format (`dist/index.cjs` + `dist/index.mjs`) + d.ts 산출.

### 사유

- tsup은 esbuild 기반 — 13개 패키지 전체 빌드 < 5초 예상 (rollup 대비 10× 빠름).
- 설정 파일 1개 (`tsup.config.ts`, ~15줄) — rollup의 `rollup.config.mjs` 대비 설정 minimal.
- `dts: true` 플래그 하나로 d.ts 병렬 산출 (tsc DTS plugin 내장).
- CJS+ESM dual을 `format: ['cjs', 'esm']` 한 줄로 선언 — vite library mode의 다중 설정 불필요.
- TypeScript 5.8.x와 완전 호환 검증됨 (verbatimModuleSyntax 지원).

### 대안

1. **Rollup**: 세밀한 tree-shaking 제어, 생태계 검증됨. **각하 이유**: 설정 복잡도 높음 (롤업 플러그인 5개+ 필요: @rollup/plugin-typescript, @rollup/plugin-node-resolve, rollup-plugin-dts 등). 13개 패키지 × 각 설정 → 유지보수 부담 과도.
2. **Vite library mode**: 앱(`tw-framework-front`)과 동일 도구로 일관성. **각하 이유**: Vite library mode는 UMD/ESM 중심 — CJS `.cjs` 확장자 산출이 vite 5.x 기준 별도 설정 필요. d.ts 산출은 `vite-plugin-dts` 별도 플러그인 필요. tsup이 단순함.

### Trade-off

| Pro | Con |
|-----|-----|
| 설정 minimal (tsup.config.ts 15줄 × 13개 패키지) | esbuild 기반 — TypeScript type narrowing 일부 미지원 (tsc --noEmit로 보완) |
| 빌드 속도 우수 (esbuild) | tsup 자체 버그 시 esbuild 대기 (upstream 의존) |
| CJS+ESM+DTS 한 번에 산출 | rollup 대비 tree-shaking 제어 약함 (splitting: false 선택으로 완화) |
| MIT 라이선스 — C-9 허용 목록 충족 | pnpm hoist 설정에 의존 (hoist=false 환경 비호환) |

### 라이선스

tsup `^8.4.0`: MIT 라이선스 (`https://github.com/egoist/tsup/blob/main/LICENSE`). C-9 허용 목록(MIT/Apache 2.0/BSD/ISC) 충족.

### 번들 영향

tsup은 devDependency — 런타임 번들 포함 없음. 빌드 산출 dist/ 크기: G-002 기준 src/index.ts = `export {}` → dist/index.cjs ≈ 50B, dist/index.mjs ≈ 10B, dist/index.d.ts ≈ 10B. C-21 한도 적용 시점: 실제 구현 코드 포함 이후 (G-003+).

### 결과

- 13개 패키지 각 `tsup.config.ts` (동일 스키마, Section 2.3).
- 루트 `package.json` devDependencies에 `"tsup": "^8.4.0"` 추가.
- `pnpm -r --filter './packages/*' build` → 전체 빌드 명령 통일.

---

## ADR-MOD-GRID-00-004: peerDependencies 정책

**결정일**: 2026-05-13 (G-003 spec)
**상태**: accepted
**연관 Goal**: G-003 (peerDependencies + size-limit)
**연관 constraint**: C-22 (peerDeps must not be declared as deps)

### 결정

`topvel-grid-monorepo` 13개 패키지(grid-license 제외 12개)에서 react, react-dom, @tanstack/react-table을 **peerDependencies**로 선언한다. `dependencies` 또는 `devDependencies`로 중복 선언 금지.

세부 결정:
1. **react/react-dom**: 전체 12개 패키지에 `"^18.0.0 || ^19.0.0"` peer 선언.
2. **@tanstack/react-table**: 전체 12개 패키지에 `"^8.0.0"` peer 선언.
3. **@tanstack/react-virtual**: grid-core에만 `"^3.0.0"` peer 선언 (grid-virtual 패키지 미존재).
4. **xlsx/jspdf**: grid-export + grid(meta)에 optional peer 선언 (`peerDependenciesMeta.optional: true`).
5. **grid-license**: G-003 범위 외 (MOD-GRID-99-A로 연기). peer 추가 없음.

버전 범위 원칙: L0 실측보다 넓은 **라이브러리 브로드니스** 적용. 소비자 버전 유연성 확보.

### 사유

- peerDependencies 미선언 상태에서 소비자가 @tomis/grid-core를 설치하면 react가 번들에 포함될 수 있음 → 소비자 앱에 react 중복 포함, 오작동.
- C-22 명시 의무: react/react-dom/@tanstack/react-table는 소비자 앱이 직접 설치하는 것이 표준 패턴 (AG Grid, Wijmo R-A/R-W 참조).
- tsup external 배열(G-002 결정)과 peerDependencies가 일치해야 번들 bloat 방지 가능.

### 대안

1. **dependencies로 포함**: react가 번들에 포함됨. **각하 이유**: 소비자 앱의 react와 버전 충돌, hooks 규칙 위반 (두 react 인스턴스).
2. **devDependencies만 (peer 미선언)**: 개발 시 타입 체크 가능, 소비자에게 peer 안내 없음. **각하 이유**: pnpm install 시 소비자가 react를 명시적으로 설치해야 한다는 안내 없음. npm WARN 없어서 버전 불일치 조기 감지 불가.

### Trade-off

| Pro | Con |
|-----|-----|
| 소비자 앱 react 버전 충돌 조기 감지 | pnpm install 시 WARN (소비자 경험 소폭 저하) |
| tsup external과 일관성 유지 | peer 범위 관리 부담 (react 20 출시 시 범위 업데이트 필요) |
| C-22 명시 의무 충족 | grid-license 제외 → 일관성 불완전 (MOD-GRID-99-A 해결) |

### 결과

- 12개 패키지 각 package.json에 peerDependencies 추가.
- grid-export + grid(meta)에 peerDependenciesMeta (xlsx, jspdf optional).
- 향후 react 버전 추가 시 OR 범위 확장: `"^18.0.0 || ^19.0.0 || ^20.0.0"`.

---

## ADR-MOD-GRID-00-007: size-limit 도구 선택 + 패키지별 한도

**결정일**: 2026-05-13 (G-003 spec)
**상태**: accepted
**연관 Goal**: G-003 (peerDependencies + size-limit)
**연관 constraint**: C-21 (번들 한도), C-9 (외부 라이브러리 라이선스)

### 결정

번들 크기 측정 도구로 **`size-limit` + `@size-limit/preset-small-lib`** 을 루트 devDependencies에 추가한다.

패키지별 한도 (brotli 기준):
| 패키지 | 한도 |
|--------|------|
| @tomis/grid-core | 30 KB |
| @tomis/grid-renderers | 10 KB |
| @tomis/grid-export | 20 KB |
| @tomis/grid-features | 20 KB |
| @tomis/grid-pro-* (7개) | 각 20 KB |
| @tomis/grid (meta) | 150 KB |

### 사유

- C-21 명시 의무: G-003은 size-limit P0 Goal. `.size-limit.json` 파일로 per-package 한도 정의.
- `preset-small-lib`은 라이브러리 패키지 전용 preset (brotli 측정). gzip 대비 더 엄격한 측정.
- CI exit 1 지원 → PR 병합 차단 가능.
- MIT 라이선스 (C-9 허용 목록 충족).

### 대안

1. **bundlesize**: JSON 설정 유사. **각하 이유**: 유지 관리 불활성 (2021 마지막 릴리스). size-limit이 더 활발.
2. **custom rollup plugin**: 자체 측정. **각하 이유**: 유지 부담. size-limit이 표준.
3. **@bundlejs/cli**: 온라인 측정. **각하 이유**: CI 오프라인 실행 불가.

### Trade-off

| Pro | Con |
|-----|-----|
| MIT 라이선스 — C-9 충족 | dist 빌드 선행 필수 (EC-02) |
| brotli 측정 — 실제 네트워크 크기와 일치 | pnpm 환경 의존 — 환경 미구성 시 AC-005 deviation (EC-01) |
| 설정 간단 (.size-limit.json JSON 배열) | meta 150KB 한도는 넉넉 — 실제 구현 후 재검토 가능 |

### 한도 조정 정책

실제 구현 코드 포함 후(G-005+) size-limit 측정 결과에 따라 한도 재검토. 상향 시 이 ADR 업데이트 + 사유 추가 의무.

### 결과

- `.size-limit.json` (루트) + 루트 `package.json` devDependencies에 size-limit `^11.0.0`, @size-limit/preset-small-lib `^11.0.0` 추가.
- `pnpm size` 명령: `pnpm -r --filter './packages/*' build && size-limit`.

---

## ADR-MOD-GRID-00-008: peerDependencies 표준 버전 매트릭스

**결정일**: 2026-05-13 (G-003 success-review)
**상태**: accepted
**연관 Goal**: G-003 (peerDependencies + size-limit)
**연관 ADR**: ADR-MOD-GRID-00-004 (peerDependencies 정책 — 본 ADR이 구체 버전 매트릭스 보강)
**연관 constraint**: C-22 (peerDependencies 정책)

### 결정

ADR-MOD-GRID-00-004은 **정책**(어떤 패키지가 peer인지)을 정의하고, 본 ADR-008은 **구체 버전 범위 매트릭스**를 single source of truth로 고정한다. 신규 패키지 추가 시 본 매트릭스를 참조.

| Peer 패키지 | 버전 범위 | 적용 대상 | optional |
|------------|----------|----------|---------|
| `react` | `^18.0.0 \|\| ^19.0.0` | 전체 12개 패키지 | 필수 |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` | 전체 12개 패키지 | 필수 |
| `@tanstack/react-table` | `^8.0.0` (또는 `>=8.0.0 <9.0.0`) | 전체 12개 패키지 | 필수 |
| `@tanstack/react-virtual` | `^3.0.0` | grid-core (필수), grid meta (optional) | grid에서 optional |
| `xlsx` | `^0.18.0` | grid-export, grid meta | optional (peerDependenciesMeta) |
| `jspdf` | `^2.5.0` | grid-export, grid meta | optional |
| `jspdf-autotable` | `^3.8.0` | grid-export (선택), grid meta | optional |

**범위 선택 원칙 (라이브러리 브로드니스)**:
- L0 실측 버전보다 **넓은 메이저 범위**로 선언 (예: react `^19.1.0` 실측 → peer `^18.0.0 || ^19.0.0`).
- 메이저 1개 위·아래 범위 포함. 단 deprecated 메이저는 제외.
- 신메이저 출시 시 OR 확장 (`^18.0.0 || ^19.0.0 || ^20.0.0`).

**버전 범위 변경 절차**:
1. 본 매트릭스 행 수정 + ADR 본문에 변경 사유 추가
2. 영향 패키지 package.json 일괄 업데이트 (12개 동시 — drift 방지)
3. tsup external 배열(G-002 ADR-005)과 일관성 cross-check
4. size-limit 재측정 (C-21 한도 영향 확인)

### 사유

- G-003 1차 implement에서 메인 prompt가 grid-renderers의 `@tanstack/react-table` peer를 누락. 원인: peer 매트릭스가 ADR-004 본문에 텍스트로만 명시되어 lookup 부담. 매트릭스 표 형태로 single source of truth 확립 시 누락 방지 가능.
- 신규 패키지 추가 시(예: MOD-GRID-99-A의 grid-license) peer 결정 시점에 본 매트릭스 참조로 일관성 보장.
- 버전 범위 변경(예: react 20 출시 시) 한 곳에서 관리 → 12개 패키지 drift 방지.

### 대안

1. **매트릭스 없이 각 package.json 자유 선언**: 패키지별 peer 범위 자율. **각하 이유**: 12개 패키지 drift 발생 가능. G-003 1차 실패 사례가 증거.
2. **package.json template + script로 자동 생성**: 매트릭스 → JSON 자동 적용. **각하 이유**: 도구 신규 도입 부담 + 이 시점에 over-engineering. ADR 문서 매트릭스로 충분.

### Trade-off

| Pro | Con |
|-----|-----|
| Single source of truth — 12개 패키지 drift 차단 | 매트릭스 수정 시 12개 파일 동시 업데이트 부담 |
| 신규 패키지 추가 시 lookup 비용 0 | ADR 문서 추가 (정책 ADR-004 + 매트릭스 ADR-008 분리 — 두 곳 참조 부담) |
| 메인 prompt 작성 시 명확한 참조 — C-27 drift 사전 차단 보조 | 도구 자동화 부재 — 수동 cross-check 의존 |

### 결과

- 본 매트릭스가 모든 신규 패키지 peer 선언의 기준점.
- 메인 세션이 Implementer prompt 작성 시 본 매트릭스를 spec 외 보조 참조로 사용 (C-27 drift 사전 차단 보조).
- react 20 출시 시 본 ADR에 변경 entry 추가 후 12개 일괄 업데이트.
- ADR-004는 **정책**(왜 peer로 선언하는가) 유지. ADR-008은 **구체 버전 매트릭스**(어떤 범위인가). 두 ADR 역할 분리 명시.

---

### Amendment — ADR-MOD-GRID-00-008 (2026-05-17~18)

**갱신일**: 2026-05-18  
**갱신 사유**: Wave 1~5 + 잔존 4 + Phase 6 + B 우선 1 이후 package.json 실제 상태와 원 매트릭스 간 누적 drift 해소 및 신규 peer 카테고리 추가.  
**선행 ADR 결정**: ADR-002, ADR-009, ADR-011, 잔존 4, Phase 6 fix #1/#2, B 우선 1

---

#### 1. 갱신된 peer 매트릭스 (현행 SSoT)

| Peer 패키지 | 버전 범위 | 적용 대상 | optional | 변경 이력 |
|------------|----------|----------|---------|----------|
| `react` | `^18.0.0 \|\| ^19.0.0` | 전체 13개 패키지 | 필수 | 원 매트릭스 — "12개" → "13개" (grid-license 포함 재산정) |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` | 전체 13개 패키지 | 필수 | 동일 |
| `@tanstack/react-table` | `^8.0.0` (또는 `>=8.0.0 <9.0.0`) | 12개 (grid-license 제외) | 필수 | grid-license에는 react-table peer 불필요 — 원 범위 그대로 |
| `@tanstack/react-virtual` | `^3.0.0` | grid-core (필수), grid-features (optional), grid-pro-range (optional), grid-pro-merging (optional), grid-pro-agg (optional), grid meta (optional) — **6개** | grid-core 필수; 나머지 optional | **확장**: 원 "2개(grid-core + grid meta)" → 실제 6개 확인 (ADR-011 D1 — wave1) |
| `xlsx` | `^0.18.5` | grid-export (필수), grid meta (optional) | grid-export **필수** (`peerDependenciesMeta.optional=false`); grid meta optional | **drift 해소**: 원 `^0.18.0` → 실제 `^0.18.5`. grid-export optionality 원 기재 오류 수정 (optional → 필수) |
| `jspdf` | `^2.5.0` | grid-export, grid meta | optional | 변경 없음 |
| `jspdf-autotable` | `^3.5.0` | grid-export, grid meta | optional | **drift 해소**: 원 `^3.8.0` → 실제 `^3.5.0`. ⚠️ OQ-001: `^3.5.0` 유지 vs `^3.8.0` 상향 여부 미결 |
| `@tomis/grid-core` | `workspace:*` | grid-renderers (peerDep), grid-pro-tracking (peerDep), grid-pro-merging (peerDep), grid-pro-master (peerDep) — **4개 peer** | 필수 | **신규 카테고리**: workspace 패키지 간 peer. ADR-002 (grid-renderers) + 기존(grid-pro-master) + Phase 6 fix #2(tracking) + B 우선 1(merging). **footnote (OQ-002 resolution 2026-05-18)**: `grid-pro-range` 는 본 표 미포함 — production `src/` 에서 `@tomis/grid-core` import 0건, `stories/` 만 사용. devDep (build/test 전용) 만 보유, peerDep 정당화 불가. false symmetry 회피 — §6 advisor 우선 정책 (실 의존성 사실 우선) |
| `date-fns` | `^4.1.0` | grid-features 전용 | 필수 | **신규 (package-specific)**: grid-features DatePicker 기능 전용. 타 패키지 무관 |
| `react-datepicker` | `^8.3.0` | grid-features 전용 | 필수 | **신규 (package-specific)**: grid-features DatePicker 기능 전용. 타 패키지 무관 |

---

#### 2. Wave·Phase별 변경 내역

| 출처 | 대상 파일 | 변경 유형 | 내용 |
|------|---------|---------|------|
| ADR-002 (wave3) | `packages/grid-renderers/package.json` | peerDep 추가 | `@tomis/grid-core: "workspace:*"` peerDep 신설 |
| ADR-009 (wave2) | `packages/grid-features/package.json` | dep 변경 (**peer 아님**) | `@tomis/grid-core` 를 dep(dependencies)로 선언. layering inversion 해소. peer가 아닌 dep |
| ADR-011 D1 (wave1) | 문서 갱신 | peer 범위 확인 | `@tanstack/react-virtual` 실제 6개 peerDep. 원 "2개" drift 확인 |
| 잔존 4 | `packages/grid-license/src/index.ts` | API surface | `setLicenseState` public export. package.json 변경 없음 |
| Phase 6 fix #1 | `apps/docs/package.json` | devDep (**apps, peer 아님**) | `@storybook/react: "^8.0.0"`. storybook build 전용 |
| Phase 6 fix #2 | `packages/grid-pro-range/package.json` | devDep (**peer 아님**) | `@tomis/grid-core: "workspace:*"`. Rollup story resolve. peerDep 미선언 유지 |
| Phase 6 fix #2 | `packages/grid-core/package.json` | devDep (**peer 아님**) | `@tomis/grid-renderers: "workspace:*"`. stories side-effect import 해소 |
| Phase 6 fix #2 | `packages/grid-pro-tracking/package.json` | devDep (build-ordering) | `@tomis/grid-core: "workspace:*"`. peerDep-only race 해소. grid-pro-master 패턴 |
| B 우선 1 | `packages/grid-pro-merging/package.json` | devDep (build-ordering) | `@tomis/grid-core: "workspace:*"`. Phase 6 fix #2에서 식별된 latent race 해소 |

> **build-ordering devDep 주석**: Phase 6 fix #2 + B 우선 1 devDep은 라이브러리 배포 peer와 무관하다. pnpm은 peerDependencies만으로 topological build 순서를 보장하지 않으므로 devDep에 중복 선언이 필요하다. 현행 패턴 적용 패키지: grid-pro-master (초기부터), grid-pro-tracking (Phase 6 fix #2), grid-pro-merging (B 우선 1).

---

#### 3. 매트릭스 범위 재산정 — "12개" → "13개"

원 매트릭스는 "전체 12개 패키지" 기준이었으나 grid-license가 별도 패키지로 존재한다. grid-license는 react/react-dom peer만 선언하며 react-table peer 없음.
- react / react-dom: 13개 (grid-license 포함)
- react-table: 12개 (grid-license 제외)

---

#### 4. Open question resolution (2026-05-18 사용자 결정)

| ID | 항목 | 상태 | 결정 + 사유 |
|----|------|------|------------|
| OQ-001 | `jspdf-autotable` 버전 정합 | **resolved A** | `^3.5.0` 유지 (실 코드 SSoT). Amendment 매트릭스가 코드에 맞춰진 상태로 마감. `^3.8.0` 상향은 jspdf-autotable changelog 검토 + 외부 사용자 호환성 영향 평가가 필요하나 ROI 없음 — 별도 cycle 시점에 재검토. |
| OQ-002 | `grid-pro-range` `@tomis/grid-core` peerDep 승격 | **resolved A** | dev만 유지. `grid-pro-range/src/*` 에서 `@tomis/grid-core` import 0건 (production 미사용, stories/만 사용) — peerDep 정당화 불가. 다른 3 패키지(master/tracking/merging)는 src import 있어 peer 정당 — false symmetry 회피. **매트릭스 footnote**: grid-pro-range 의 grid-core 는 build/test 전용 (stories) 이므로 peer 매트릭스 미포함. |

---

## ADR-MOD-GRID-00-006: Changesets + ESLint 도입

**결정일**: 2026-05-14 (G-004 spec)
**상태**: accepted
**연관 Goal**: G-004
**연관 constraint**: C-9 (외부 라이브러리 ADR), C-20, C-23 (Changeset 도구 의무)

### 결정

1. `@changesets/cli ^2.27.0` 도입 — pnpm workspace 기반 semver 자동화
2. `eslint ^9.25.0` + `@eslint/js ^9.25.0` + `typescript-eslint ^8.30.1` + `eslint-plugin-react-hooks ^5.2.0` 도입 — flat config v9

모노레포 루트 `package.json`에 devDependencies 추가. `eslint.config.mjs` (flat config v9) 신규 생성.

### 사유

C-23은 Changeset 도구 사용을 명시 의무화. ESLint flat config는 C-4 (no-any) 강제 수단.  
tw-framework-front 동일 버전 pin → 두 설정 간 플러그인 버전 일관성.

### 대안

1. **lerna + conventional-commits**: 전통적 semver 관리. **각하**: pnpm workspace와 연계 약함, lerna는 유지 관리 주체 이전 후 안정성 불확실.
2. **ESLint 미도입 (tsc만 사용)**: 타입 체크만. **각하**: C-4 위반(no-any) 런타임 감지 불가. ESLint로 빌드 전 조기 감지 필요.

### Trade-off

| Pro | Con |
|-----|-----|
| C-23 명시 의무 완전 이행 | CI 미구성 상태에서 pnpm changeset CLI만 수동 운영 |
| ESLint C-4 강제 → 라이브러리 타입 안전성 보장 | tw-framework-front(off)와 모노레포(error) 규칙 차이 → 기여자 주의 필요 |
| @changesets/cli MIT 라이선스 (C-9 충족) | access=restricted → publish 시 별도 설정 변경 필요 |

### 라이선스 검증 (C-9)

| 패키지 | 버전 | 라이선스 |
|--------|------|---------|
| `@changesets/cli` | `^2.27.0` | MIT |
| `eslint` | `^9.25.0` | MIT |
| `@eslint/js` | `^9.25.0` | MIT |
| `typescript-eslint` | `^8.30.1` | MIT |
| `eslint-plugin-react-hooks` | `^5.2.0` | MIT |

전부 MIT — C-9 허용 목록 충족.

### 결과

- 모노레포 루트 `package.json` devDependencies에 5개 패키지 추가.
- `scripts`에 `"lint"` + `"changeset"` 추가.
- `topvel-grid-monorepo/eslint.config.mjs` 신규 생성 (`no-explicit-any: 'error'` — C-4 준수).
- `topvel-grid-monorepo/.changeset/config.json` 신규 생성 (`access: "restricted"`, `baseBranch: "master"`).
- `.changeset/config.json baseBranch`: `"master"` (CLAUDE.md TOMIS git 브랜치 확인).

---

## ADR-MOD-GRID-00-009: 환경 의존 deferred AC 일괄 검증 게이트

**결정일**: 2026-05-14 (G-004 success-review)
**상태**: accepted
**연관 Goal**: G-001 (EC-02), G-003 (EC-01+EC-02), G-004 (EC-01+EC-03)
**연관 ADR**: ADR-MOD-GRID-00-003 (documented-deviation 처리 정책)
**연관 constraint**: C-12 (빌드 0 errors 필수)

### 결정

G-001~G-004 사이 누적된 4건의 deferred AC (모두 `pnpm install` 미실행 환경에 root-cause)를 **G-005 (또는 다음 첫 실 구현 Goal) 착수 전 일괄 검증** 게이트로 처리한다.

**누적 deferred AC 목록**:
| Goal | AC | EC | 검증 필요 항목 |
|------|----|----|---------------|
| G-001 | AC-005 | EC-02 | `pnpm install` 실행 + workspace recognition |
| G-003 | AC-005 | EC-01 | `size-limit` CLI 실행 + 12 패키지 한도 통과 |
| G-003 | (해당 — 측정 deviation) | EC-02 | 패키지 dist/ 빌드 산출물 측정 |
| G-004 | AC-001 (CLI 부분) | EC-01 | `pnpm changeset --version` 실행 + .changeset/config.json 인식 |
| G-004 | AC-005 | EC-03 | tw-framework-front `pnpm dev` HMR — `@tomis/grid-core` import 해석 + src/ 변경 즉시 반영 |

**G-005 (또는 첫 실 구현 Goal) Spec 단계 의무**:
1. Spec 첫 Section에 "Pre-flight: deferred AC bulk validation" 명시
2. 위 표의 4건 모두 G-005 implement 시작 전 검증 통과 입증 (PR 또는 commit 또는 finding 파일)
3. 미통과 시 G-005 implement 단계 진입 차단 (blocking gate)

**검증 명령 (G-005 Spec 단계에서 사용자 또는 Implementer가 실행)**:
```powershell
# Step 1: pnpm install 실행
cd D:\project\topvel_project\topvel-grid-monorepo
pnpm install

# Step 2: changeset CLI 검증
pnpm changeset --version  # → 2.27.x

# Step 3: size-limit CLI 검증
pnpm -r --filter './packages/*' build  # → 13 dist/ 생성
pnpm size-limit              # → exit 0, 한도 통과

# Step 4: tw-framework-front HMR 검증
cd D:\project\topvel_project\TOMIS\tw-framework-front
pnpm dev                     # → port 5173 listening
# 브라우저에서 @tomis/grid-core import 페이지 확인 + packages/grid-core/src/index.ts 수정 → 즉시 반영 확인
```

각 단계 통과 시 `findings/auto-fixed/MOD-GRID-00-G-001-deferred-resolved.md` 등 finding 파일을 **resolved 상태로 업데이트** (또는 신규 `findings/resolved/MOD-GRID-00-deferred-bulk-2026-05-14.md` 작성).

### 사유

- 4건의 deferred AC가 모두 동일 root cause (`pnpm install` 미실행)로 일괄 처리 가능.
- 개별 Goal마다 환경 의존 검증을 시도하면 **개별 환경 setup → 검증 → tear-down** 반복 — 환경 setup 비용을 누적 4회 부담.
- G-005부터는 실제 구현 코드(grid-core 등)가 들어가므로 **환경 검증 없이 구현하면 implement 실패 risk** 급증.
- 4건을 일괄 G-005 사전 게이트로 묶으면: (a) 환경 1회 setup, (b) 검증 1회, (c) implement 진입.

### 대안

1. **개별 Goal에서 retroactive 검증**: 각 Goal로 돌아가 deferred AC 통과 후 score 갱신. **각하 이유**: 4회 setup 반복 비효율. Goal 완료 의미 약화 (deferred 인정 정책이 사후 부정됨).
2. **G-005 spec에서 검증 없이 그냥 진행**: 환경 의존 AC를 영구 deferred 처리. **각하 이유**: 첫 실 구현 단계에서 빌드/HMR 결함 발견 시 모든 G-005+ Goal에 cascading fail. 검증 비용은 어차피 발생 — 늦출수록 손해.

### Trade-off

| Pro | Con |
|-----|-----|
| 환경 setup 1회로 4건 일괄 검증 — 비용 효율 | G-005 spec writer가 사전 게이트 단계를 spec에 명시 의무 추가 |
| Implement 단계 진입 전 환경 결함 사전 차단 | 검증 통과 입증 finding 작성 부담 (4건 × 1줄씩) |
| documented-deviation 정책의 명시적 resolution 시점 | G-005 specify 단계가 약간 길어짐 |

### 결과

- G-005 (또는 다음 첫 실 구현 Goal) spec 첫 Section에 "Pre-flight: deferred AC bulk validation" 의무 추가.
- 본 ADR-009가 G-001~G-004의 모든 documented-deviation finding 파일의 resolution 경로.
- 4건 일괄 통과 후 다음 첫 substantive Goal의 implement 진입 허가.
- 통과 입증 finding: `findings/resolved/MOD-GRID-00-deferred-bulk-{date}.md` 또는 기존 deferred finding 파일에 "Resolved {date} per ADR-009" 추가.

---

## ADR-MOD-GRID-00-010: Cross-module bundle estimation policy — measure-then-decide (3 profile data points 입증)

**결정일**: 2026-05-14 (G-005 self-review, MOD-GRID-01 wrapper 모듈 5/5 종결 회고)
**상태**: accepted
**연관 Goal**: MOD-GRID-01/G-001~G-005 (5 Goal × 3 size profile)
**연관 ADR**: ADR-MOD-GRID-01-003 (D7 measure-then-decide 게이트), ADR-MOD-GRID-01-005 (Pattern Catalog Note — 번들 efficiency profile 의존), ADR-MOD-GRID-01-006 (Pattern Catalog Note — alias-wrapper 3rd profile 데이터포인트)
**연관 constraint**: C-21 (번들 한도)

### Promotion 근거

MOD-GRID-01 wrapper 5 Goal 누적으로 **3 profile data points** (anecdote=1 → pattern=2 → policy=3) 입증:

| Profile group | 대표 Goals | spec 예상 | 실측 | efficiency |
|---------------|-----------|----------|------|-----------|
| same-profile (CSS class + props + hooks 추가) | MOD-GRID-01/G-001 / G-002 / G-003 | +13 KB (4+3+3 추정 합) | +0.91 KB | ≈10-15% |
| different-profile (forwardRef + virtual hooks + handle 함수 + tbody 분기 boilerplate) | MOD-GRID-01/G-004 | +7 KB | +5.86 KB | ≈84% |
| alias-wrapper (props 위임 컴포넌트 N개 + dedupe 패턴) | MOD-GRID-01/G-005 | +5 KB | +0.31 KB | ≈94% |
| hook-only — pure pass-through (8x useState + setter, no JSX, no component tree) | MOD-GRID-02/G-001 | +2 KB | +0.12 KB | ≈6% |
| hook-only — controlled-aware (useControllableState NEW + snapshotRef + 8 wiring boilerplate) | MOD-GRID-02/G-002 | +2 KB | +0.23 KB | ≈11.5% |
| hook-only — hook+helper+ref+timeout (useDebouncedCallback NEW 90 LOC + useGridState MODIFY 8 wiring + useRef×2 + useEffect×2 + useCallback + setTimeout cleanup boilerplate) | MOD-GRID-02/G-003 | +1 KB | +0.72 KB | ≈72% |

efficiency 비율이 **6-94%로 ~16배 차이** — 단일 평균 적용 불가. ADR-MOD-GRID-01-005 + ADR-MOD-GRID-01-006 에서 1=anecdote, 2=pattern, 3=policy 룰에 따라 cross-module ADR로 promotion 권고됨. 본 ADR-010이 그 promotion.

**hook-only 행 추가 근거 (2026-05-14 MOD-GRID-02 G-001 self-review)**: 본 ADR §결과 3 ("신규 profile 발견 시 본 ADR 매트릭스에 데이터포인트 추가 — 행 추가는 readonly catalog — 평균화 또는 trajectory 적용 금지") 룰 적용. 단일 데이터포인트 — extrapolation 금지. 후속 hook profile Goal (예: MOD-GRID-02 G-002~G-006 controlled mode/debounce/url-sync) 측정 시 본 행 갱신 또는 sub-profile 분리 검토.

**hook sub-profile 분리 근거 (2026-05-14 MOD-GRID-02 G-002 self-review)**: G-002 controlled-aware hook (useControllableState NEW 121 LOC + useGridState MODIFY 155 LOC + snapshotRef 패턴 + onStateChange wiring 8회) 실측 +0.23 KB — G-001 pure pass-through (+0.12 KB) 대비 약 2배 efficiency 차이. 동일 "hook-only" 카테고리 내부에서도 boilerplate 복잡도에 따라 efficiency 변동 입증. 2 데이터포인트 = pattern 단계 (1=anecdote, 2=pattern, 3=policy). 3rd hook 데이터포인트 발견 시 (예: MOD-GRID-02/G-003 useDebouncedCallback hook 측정 후) sub-profile 추가 등록 또는 hook 카테고리 자체 sub-profile granularity 룰 elevation 검토. **G-003 spec writer 의무**: 본 2 데이터포인트 평균/trajectory 추정 사용 금지 — measurement at IMPLEMENT time only (ADR §결과 1+2 일관 적용).

**hook 3rd sub-profile 추가 근거 (2026-05-14 MOD-GRID-02 G-003 self-review)**: G-003 useDebouncedCallback hook+helper+ref+timeout sub-profile (useDebouncedCallback.ts NEW 90 LOC + useGridState.ts MODIFY 8 wiring + useRef×2 + useEffect×2 + useCallback + setTimeout cleanup boilerplate) 실측 +0.72 KB (verify-score 25.75 KB - G-002 baseline 25.03 KB). goals.json expected +1 KB → ≈72% efficiency. **3 hook sub-profiles 누적 spread = 6%/11.5%/72% (12배 차이)** — 동일 "hook-only" 카테고리 내부에서도 sub-profile 별 efficiency 패턴 다름이 단일 모듈 내 3 occurrences 로 입증. **3 데이터포인트 = policy 단계** (1=anecdote, 2=pattern, 3=policy). 룰 강화: hook profile 행은 readonly catalog 유지하되, 후속 모듈 spec writer 는 본 3 sub-profile 중 가장 가까운 것 1개만 reference 허용 — 평균/trajectory 적용 금지 룰 강화. **G-004+ spec writer 의무**: 본 3 데이터포인트 중 어느 것도 baseline 으로 사용 금지 — measurement at IMPLEMENT time only (ADR §결과 1+2+3 일관 적용).

### 결정 (cross-module 정책)

모든 신규 모듈(MOD-GRID-02~16, MOD-GRID-99-A/B 등) 의 spec 작성 시 다음 3원칙 일괄 적용:

1. **spec 예상 (`bundleImpact.expected`) 은 metric 참조용으로만 사용 — 게이트 아님.** spec D# 표 또는 Section 8.5 에 다음 1줄 명시 의무:
   > "bundle estimation NOT extrapolated from prior Goals (different size profile may apply) — measurement at IMPLEMENT time only per ADR-MOD-GRID-00-010."

2. **모든 게이트 결정은 IMPLEMENT 직후 `pnpm size-limit` 실측에 기반.** 분리 트리거 (`/legacy` sub-entry 강제, 별도 패키지 분할 등) 결정은 측정 후 1회만 실행.

3. **신규 profile 발견 시 본 ADR 매트릭스에 데이터포인트 추가** (예: MOD-GRID-09 inline editor profile 측정 후 4번째 행 등록). 행 추가는 readonly catalog — 평균화 또는 trajectory 적용 금지.

### 사유

- ADR-MOD-GRID-01-005 + ADR-MOD-GRID-01-006 두 ADR 모두 "cross-module 으로 promote 강력 권장" 명시.
- MOD-GRID-01 wrapper 5/5 누적 24.52 KB / 30 KB → 잔여 5.48 KB 예산을 MOD-GRID-02~16 (15 모듈) 이 공유 — extrapolation 으로는 안전 결정 불가능, 실측만 유효.
- 후속 모듈 spec writer 가 ADR-MOD-GRID-01-005/006 를 미참조할 경우 단순 trajectory 평균 적용 위험 → cross-module 가시 위치(MOD-GRID-00-decisions.md)로 promote 시 discoverability 강화.

### 대안

| 대안 | 채택 안 된 이유 |
|------|----------------|
| ADR-MOD-GRID-01-005/006 그대로 두고 promote 미실행 | MOD-GRID-02~16 spec writer 가 wrapper 모듈 ADR 까지 거슬러 읽지 않을 가능성 — discoverability 결함. 5+9배 efficiency 차이 패턴이 다시 묻힘. |
| `constraints.md` C-30 으로 하드 룰 추가 | constraints 는 enforceable lint 룰 또는 코드 패턴 의무 ↔ 본 정책은 spec 작성 절차 (process 정책) → ADR 가 적합. 단, spec 작성 시 의무 1줄 명시는 specify-rubric에 추후 통합 검토 가능. |
| 단순 README 또는 카탈로그 문서 신설 | ADR 형식의 trade-off + 대안 + 결과 구조가 audit 추적성 우수. 단순 문서는 결정 권위 약함. |

### Trade-off

| Pro | Con |
|-----|-----|
| MOD-GRID-02+ spec writer 가 1 cross-module ADR 1회 참조로 정책 인지 | spec 작성 시 D# 표 또는 Section 8.5 에 1줄 명시 의무 추가 (수술적 부담) |
| 신규 profile 데이터포인트 누적 시 본 ADR 매트릭스 update — single source of truth | 4번째 profile 발견 시 ADR 본문 수정 부담 (per-module ADR 보다 큼, 그러나 통합 우위) |
| extrapolation 위험 재발 차단 (G-003 self-review candidate D + G-004 self-review candidate D + G-005 spec D7 결정 일관 정책화) | spec 예상값을 game 하려는 동기 — 측정 의무로 보완 |

### 결과

- MOD-GRID-02 이후 모든 모듈 spec writer 는 본 ADR 인용 의무 (spec D# 표 1줄).
- ADR-MOD-GRID-01-005 + ADR-MOD-GRID-01-006 의 Pattern Catalog Note 는 본 ADR-010 으로 promote 완료 — 두 wrapper-module ADR 본문에 "promoted to ADR-MOD-GRID-00-010 (2026-05-14)" 백참조 추가.
- 신규 profile 데이터포인트(예: MOD-GRID-09 inline editor profile 측정 후) 발견 시 본 ADR 매트릭스에 행 추가 + 변경 사유 본문 추가.
- `tw-grid` Self-Review/Loop tools 가 본 ADR을 reference 하여 cross-module 안전 게이트 적용 가능 (후속 tooling 작업).

---

## ADR-MOD-GRID-00-011: 모델 차등 적용 (medium tier) — sonnet SPECIFY+IMPLEMENT × opus VERIFY 검증

**결정일**: 2026-05-14 (MOD-GRID-02 G-001 self-review — 첫 medium tier mixed-model Goal 종결 회고)
**상태**: accepted
**연관 Goal**: MOD-GRID-02/G-001 (단일 데이터포인트 — 본 ADR 은 검증 documentation, 정책 변경 아님)
**연관 constraint**: C-15 (Agent 위임 의무 + tier 별 모델 매트릭스), C-26 (Verifier 산식 자기-검증)

### Context

C-15 가 정의한 medium tier 모델 매트릭스(SPECIFY=sonnet, IMPLEMENT=sonnet, VERIFY=opus, Self-Review=opus)는 MOD-GRID-01 wrapper 5/5 (전부 high tier opus 일괄 적용) 기간 동안 **empirical 검증 0회**. MOD-GRID-02 G-001 이 첫 medium tier 적용 케이스로, sonnet 의 SPECIFY/IMPLEMENT 품질이 opus baseline 과 구분 가능한지 의문 발생.

### Decision

C-15 의 medium tier 모델 매트릭스는 **현행 유지**. 본 ADR 은 정책 변경이 아니라 **첫 검증 결과의 문서화** 및 후속 tier 적용 시 참조 baseline 제공.

### Empirical Evidence (2 데이터포인트 — pattern 단계)

| Goal | Stage | Model | 결과 | Baseline 비교 (MOD-GRID-01 high tier opus) |
|------|-------|-------|-----|--------------------------------------------|
| MOD-GRID-02/G-001 | SPECIFY | sonnet | 27/27 + D# 7개 + H-01/H-02/H-03 ALL YES | 동등 (opus 와 score 차이 없음) |
| MOD-GRID-02/G-001 | IMPLEMENT | sonnet | 19/19 + F-01..F-05 ALL YES + drift 1건 자율 처리 (TS6133 `_TData`) + promptSpecDrift 정확 보고 | 동등 (drift handling C-27 절차 정확 준수) |
| MOD-GRID-02/G-001 | VERIFY | opus | 5축 100/100/100/100/100 + Σ=100 + F 메타게이트 ALL YES | 동등 (independent re-measurement: 24.64KB / 30KB 실측) |
| MOD-GRID-02/G-002 | SPECIFY | sonnet | 26/26 + D# 7개 + H-01/H-02/H-03 ALL YES + G-01 v1.0.4 breakdown consistency 정확 충족 | 동등 + new rubric rule (v1.0.4 breakdown) 자율 적용 |
| MOD-GRID-02/G-002 | IMPLEMENT | sonnet | 16/16 + F-01..F-05 ALL YES + drift 2건 자율 처리 (D4 C-29 union 명시 + OnChangeFn 호환 setter) + promptSpecDrift 정확 보고 | 동등 (drift 2건 모두 spec 우선 적용 — C-27 절차 일관) |
| MOD-GRID-02/G-002 | VERIFY | opus | 5축 100/100/100/100/100 + Σ=100 + F 메타게이트 ALL YES + vacuous truth (B+D) 정확 적용 | 동등 (24.87KB / 30KB 실측, +0.23KB G-001 baseline 대비) |
| (양 Goal) | Self-Review | opus | G-001 self-review (4 candidates: 2 APPLY + 2 REJECT) + G-002 self-review (4 candidates: 2 APPLY + 2 REJECT) | 동등 (rejection rationale 1=anecdote 룰 일관 적용) |

### 사유

- C-15 가 정의한 모델 매트릭스의 **검증 없는 적용** 은 cost 절감과 quality risk 의 trade-off 를 막연한 신뢰로 처리. 첫 medium tier 적용에서 sonnet 의 결함이 발견되면 전체 medium/low tier 정책 재검토 필요.
- 단일 데이터포인트지만 **3 stage × 3 메타게이트 카테고리 = 9 검증 axis** 모두 100점 통과 → C-15 매트릭스의 medium tier 부분 1차 검증 완료 신호.
- 후속 medium tier Goal (MOD-GRID-02 G-002~G-006, MOD-GRID-03+ 의 medium impact Goal) 은 본 ADR 을 baseline 참조로 사용 가능.

### 대안

| 대안 | 채택 안 된 이유 |
|------|----------------|
| 정책 변경 — sonnet 적용 범위 확대 (low tier → medium → high) | 1 데이터포인트 = anecdote. 1=anecdote, 2=pattern, 3=policy 룰에 따라 정책 변경 부적격. C-15 high tier=opus 정책은 quality safeguard 로 유지. |
| 본 ADR 미작성 — 단일 데이터포인트는 catalog 가치 없음 | 첫 medium tier 검증은 후속 medium tier Goal 의 baseline 으로 가치 있음. C-15 매트릭스의 empirical foundation 부재 → 신뢰 acquisition 점진적 필요. |
| C-15 자체에 검증 결과 inline 추가 | constraints.md 는 enforceable 룰. 검증 결과는 history 성격 → ADR 가 적합. |

### Trade-off

| Pro | Con |
|-----|-----|
| C-15 medium tier 매트릭스의 첫 empirical 검증 documented — 후속 tier 적용 시 신뢰 baseline | 단일 데이터포인트 — generalization 위험. 후속 medium tier Goal 에서 sonnet 결함 발생 시 본 ADR 재검토 필요 |
| sonnet 의 drift 자율 처리 능력 (TS6133 `_TData` C-27 절차 준수) 입증 — IMPLEMENT 부분은 sonnet 충분 | high tier 모듈 (예: MOD-GRID-09 filter UI, MOD-GRID-12 datamap) 에 sonnet 시도 동기 발생 가능 — quality risk |
| opus VERIFY 독립성 quality safeguard 유지 — sonnet self-claim 을 opus 가 독립 재측정 | 비용 매트릭스 자체는 변경 없음 — 본 ADR 의 ROI 는 후속 Goal 에서 누적 |

### 적용 한계 (★ 명시 의무)

- 본 ADR 은 **medium tier 한정** validation. C-15 high tier=opus (전 stage) 정책 **변경 금지**.
- low tier 적용 검증은 별도 ADR 필요 (low tier first Goal 종결 시 본 ADR 형식 follow).
- sonnet IMPLEMENT 의 drift 자율 처리 신뢰는 **C-27 promptSpecDrift 보고 절차 준수 조건** 한정. 보고 없는 drift 발견 시 본 ADR 재검토 trigger.

### Cascading Risk Mitigation

본 ADR 신설 후 cascading risk (self-review 산출):
- **R-3 (high tier 정책 약화)**: 본 ADR 본문 "적용 한계" 섹션이 명시적으로 차단.
- **C-15 매트릭스 변경 금지**: 본 ADR 은 검증 documentation 만, 정책 변경 0.

### 결과

- C-15 medium tier 매트릭스 = empirical **2 데이터포인트** 검증 완료 상태 (pattern 단계 — 1=anecdote, 2=pattern, 3=policy).
- 후속 medium tier Goal 의 SPECIFY/IMPLEMENT agent 호출 시 sonnet 사용 정당화 baseline 으로 본 ADR 참조 가능.
- **3rd medium tier Goal 종결 시** (예: MOD-GRID-02/G-003 — `onStateChange unified callback + debounce` medium impact) 본 ADR 매트릭스 행 추가 + 정책 강화/약화 검토 trigger 발동.
- 2 데이터포인트는 patterns 단계 — **정책 변경 (sonnet 적용 범위 확대 등) 부적격**. C-15 high tier=opus 정책 + medium tier VERIFY=opus + Self-Review=opus 모두 변경 금지.
- G-002 데이터포인트 추가 검증 사실: drift 2건 (D4 C-29 union 명시 + OnChangeFn 호환 setter) 모두 sonnet IMPLEMENT 가 자율 처리 + C-27 promptSpecDrift 보고 정확 준수. drift handling 능력의 1차 검증 (G-001 TS6133) → 2차 검증 (G-002 C-29 spec authority + TanStack 호환) 누적.

---

## ADR-MOD-GRID-00-012: Pro 패키지 grid-license 검증 — Inline Stub 패턴 카탈로그 (Cross-Module)

**결정일**: 2026-05-15 (MOD-GRID-12/G-001 self-review)
**상태**: accepted (Sunset 완료, 2026-05-17 — Amendment 2 참조)
**Amendment 1 (2026-05-17)**: Sunset 의존성 미충족. MOD-GRID-99-A/G-002 완료(`overallStatus: "completed"`)되었으나 출하 API 가 `checkLicense` (기능 동등) 이며 ADR-012 Sunset step 1 이 요구하는 `verifyGridLicense` / `verifyOrWarn` export 는 존재하지 않음 — ADR 선행 작성 시점의 명칭 예측 오류. 인라인 stub 8건 sweep 보류. 해결 경로 2가지 (alias export 신설 vs. ADR Sunset step 재정의) 는 `wave-residual-3-00-012-sunset-deferred.md` 참조.
**Amendment 2 (2026-05-17 — Sunset Option B 완료)**: ADR Sunset step 재정의(Option B) 채택. Sunset step 1 조건을 `checkLicense` (기능 동등 export) 로 재정의. 인라인 stub 8건 sweep 완료. `pnpm -r typecheck` + `pnpm -r build` 전 패키지 PASS. 상세: `wave-residual-3-00-012-sunset-result.md`.
**연관 Goal**: MOD-GRID-10/G-001 (grid-pro-tracking), MOD-GRID-11/G-001~G-003 (grid-pro-range), MOD-GRID-12/G-001 (grid-pro-datamap), MOD-GRID-13/G-001 (grid-pro-merging 진행 추정)
**연관 constraint**: C-12 (tsc 0 errors), C-24 (라이선스 명시 의무), C-33 (Pro 패키지 license stub 정책 — 본 ADR 과 1:1 매핑)

### Context

Pro 패키지 (`grid-pro-*`) 신규 Goal 마다 동일 라이선스 검증 진입점 작성 시 다음 3 제약이 동시 충족 불가:
- **D6** (spec 코드 템플릿): `import * as gridLicense from '@tomis/grid-license'` + feature-detect 패턴.
- **D7** (Goal-N 의 spec 분리 결정): `package.json` peerDependencies 추가는 후속 Goal (보통 G-004) 위임.
- **C-12** (rubric F 메타게이트): `tsc --noEmit` 0 errors. `@tomis/grid-license` 미선언 상태에서 D6 import 시 TS2307 발생.

C-12 가 점수 0 강제 메타 게이트로 최상위 제약 → D6 import 패턴 적용 불가. 매 Pro 패키지 spec 마다 본 충돌이 재발견되어 implementer 가 자율 fix (인라인 stub) + ADR-XXX-003 작성 + deviations[] 보고 부담이 반복됨.

### Decision

Pro 패키지 license 검증 진입점은 **인라인 stub 패턴**을 표준으로 채택. C-33 (constraints.md 신설) 으로 정책화. 모든 Pro 패키지 spec/implement Agent 는 본 패턴 채택 의무.

표준 패턴 코드 (★ 역사적 기록 — Amendment 2 이후 실제 코드에서 제거 완료):
```typescript
// [REMOVED — ADR-012 Sunset 완료 2026-05-17]
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function verifyOrWarn(_packageName: string): void {
  /* MOD-GRID-99-A/G-002 will implement signature / expiry / domain checks. */
}
verifyOrWarn('@tomis/grid-pro-<package-name>');
```

대안 명칭 `_verifyGridLicenseStub` 도 동등이었음 — grid-pro-range 모듈이 채택. 양 패턴 모두 2026-05-17 sweep 에서 제거. 현행 실 구현: 각 Pro 패키지 `index.ts` module-load `checkLicense()` 호출.

### Empirical Evidence (4 occurrences = policy 진입)

| Module | Goal | 파일 | 패턴 명칭 | 결과 |
|--------|------|------|----------|------|
| MOD-GRID-10 | G-001 | grid-pro-tracking/src/index.ts L14-17 | `verifyOrWarn` | 100/100/100 — 첫 occurrence (anecdote) |
| MOD-GRID-11 | G-001~G-003 | grid-pro-range/src/{DragFillHandle,useCellRange,useClipboard,useKeyboardNav}.{tsx,ts} | `_verifyGridLicenseStub` | 100/100/100 (G-001), 100/100/100 (G-002), 100/100/100 (G-003) — 2nd occurrence (pattern) |
| MOD-GRID-12 | G-001 | grid-pro-datamap/src/index.ts L8-11 | `verifyOrWarn` | implement 100 / implement-verifier 100 / verify 100 / specify 96.6 — 3rd occurrence (policy 진입 조건 충족) |
| MOD-GRID-13 | G-001 (진행 추정) | grid-pro-merging/src/MergingGrid.tsx | (확인 필요) | 4th occurrence — 후속 검증 |

### 사유

- 1=anecdote, 2=pattern, 3=policy 룰 (C-29 cross-module 정책 진입 기준과 동일) — 3 occurrence 시점에서 cross-module 정책화 의무.
- 매 Pro 패키지 spec writer 가 D6 패턴을 spec 에 명시하면 1차 specify Verifier 가 통과시키고 Implementer 가 자율 fix 하는 비효율 반복. C-33 신설로 spec writer 단계에서 D6 패턴 작성 차단.
- 모노레포 선례 4건이 동일 결론 도달 — 추가 실험 가치 없음. transitional 정책으로 codify 후 MOD-GRID-99-A/G-002 출하 시 deprecation.

### 대안

1. **D6 패턴 유지 + `@tomis/grid-license` 를 모든 Pro 패키지 peerDependencies 에 즉시 추가**: D7 (G-001 scope 분리) 위반. 모든 Pro 패키지가 G-004 까지 기다리지 않고 license peer 선언. **각하 이유**: G-001 scope 정의가 흐려짐. peerDependencies 변경 ADR 의무 (C-9, C-20) 추가 부담.
2. **`@ts-ignore` + `declare const verifyGridLicense: (() => void) | undefined`**: B-06 (specify-rubric C-4/C-29 compliance) 위반. `@ts-ignore` 0건 의무 + 미존재 심볼 `declare const` 런타임 ReferenceError 위험. **각하 이유**: G-001 spec 1차 작성 시 시도되었으나 B-06 NO 처리 + Implementer 자율 정정.
3. **라이선스 검증 완전 생략 (MOD-GRID-99-A/G-002 출하 후 일괄 추가)**: C-24 위반. **각하 이유**: Pro 패키지가 라이선스 stub 도 없이 release 되면 license 회피 risk + npm publish 차단.

### Trade-off

| Pro | Con |
|-----|-----|
| 4 Pro 패키지 누적 패턴 → spec writer/Implementer 부담 0 (boilerplate 결정 완료) | 인라인 stub 자체는 실제 라이선스 검증 0 — MOD-GRID-99-A/G-002 출하 전 license enforcement empty |
| C-12 + C-24 + D7 3 제약 동시 충족 (단일 실증적 해결책) | sunset migration 단계 필요 — MOD-GRID-99-A/G-002 출하 시 4 Pro 패키지 일괄 update |
| MOD-GRID-99-A/G-002 미출하 상태에서 Pro 패키지 출시 가능 (release 차단 0) | 본 ADR 은 transitional — 영구 정책 아님. MOD-GRID-99-A/G-002 ADR 우선 |
| spec writer 가 D6 patten 시도 시 specify B-06 NO 자동 차단 (C-33 효과) | 후속 maintenance pass (stub → real import 교체) 추가 작업 부담 ~30 min × 4 패키지 |

### 적용 한계 (★ 명시 의무)

- 본 ADR 은 **Pro 패키지 (`grid-pro-*`) 한정** 적용. MIT 패키지 (`grid-core`, `grid-renderers`, `grid-export` 등) 는 grid-license 검증 자체 의무 없음 (C-24 는 Pro 패키지 전용 EULA 항목).
- MOD-GRID-99-A/G-002 (`checkLicense` export 완료) **출하 후** 본 ADR 은 deprecated. Sunset 단계 (Amendment 2 — Option B 기준으로 재정의):
  1. ~~MOD-GRID-99-A/G-002 출하 완료 → grid-license 패키지에 `verifyGridLicense` 또는 `verifyOrWarn` 실제 export.~~ → **완료 (2026-05-17)**: `checkLicense` (기능 동등 export) 로 조건 재정의. MOD-GRID-99-A/G-002 `overallStatus: "completed"` 확인.
  2. 모든 Pro 패키지 `peerDependencies` 에 `@tomis/grid-license` 추가 — wave2 ADR-001 Phase 5 에서 이미 검증됨 (보정 불요). **완료**.
  3. ~~인라인 stub 을 `import { verifyOrWarn } from '@tomis/grid-license'` 로 교체.~~ → **완료 (2026-05-17)**: 8개 인라인 stub 제거 완료. module-load `checkLicense()` 7건 (각 Pro index.ts) 이 실 라이선스 검증 담당.
  4. 본 ADR + C-33 에 deprecation marker 추가 (사용 금지로 전환). C-24 (라이선스 명시 의무) 는 유지. → **완료 (Amendment 2)**: 본 ADR `상태: accepted (Sunset 완료)`. C-33 deprecated 처리 필요 (별도 constraints.md 업데이트 — 후속 cycle).

### Cascading Risk Mitigation

본 ADR 신설 후 cascading risk:
- **R-1 (sunset 시점 누락)**: ~~MOD-GRID-99-A/G-002 출하 시 ADR-MOD-GRID-99-A-NNN 에서 본 ADR + C-33 deprecation 명시 의무.~~ → **해소 (2026-05-17 Amendment 2)**: Sunset 완료. C-33 deprecated 처리는 후속 cycle constraints.md 업데이트로 마감.
- **R-2 (4 Pro 패키지 일관성 손실)**: 후속 Pro 패키지 spec writer 가 본 ADR/C-33 미숙지 → D6 패턴 또는 `@ts-ignore` 패턴 시도. specify B-06 (v1.0.6 신설) 으로 사전 차단 + Implementer F-06 (v1.0.7 신설) 자율 정정 fallback. 이중 안전망.
- **R-3 (license enforcement 0 잔존)**: 본 ADR 은 transitional — 영구 license-bypass 정책 아님. MOD-GRID-99-A/G-002 우선순위 강조 (sunset 조건 명시).

### 결과

- C-33 (constraints.md 신설) + 본 ADR (cross-module catalog) = 1:1 매핑. spec writer/Implementer/Verifier 모두 본 ADR 또는 C-33 인용 의무.
- 후속 Pro 패키지 (MOD-GRID-13 grid-pro-merging, MOD-GRID-14, MOD-GRID-15 등) spec writer 는 D6 검토 시 본 ADR 참조 + 인라인 stub 패턴 즉시 채택. 모듈별 ADR (예: MOD-GRID-12 ADR-003) 에서 본 cross-module ADR 인용으로 보일러플레이트 단축 가능.
- 4 occurrence accumulated → 5th+ occurrence 가 본 ADR 부재 패턴 발견 시 spec writer/Implementer 결함 보고 trigger.

---

## ADR-MOD-GRID-00-013: ID Ledger Policy — ADR/Constraint ID 재사용 방지 + Collision 추적

**결정일**: 2026-05-18 (tw-grid B 우선 3 — constraints ID ledger 신설 cycle)
**상태**: accepted
**연관 ADR**: ADR-MOD-GRID-00-012 (transitional stub, Sunset 완료 — 본 ADR 의 C-33 collision 사례 원 출처), ADR-MOD-GRID-REFACTOR-2026-05-17-017 (withdrawn marker 사례)
**연관 constraint**: C-33 (ID collision 본 ledger 의 첫 entry), C-14 (ADR 의무 기록)
**연관 memory**: `memory/feedback-tw-mail-adr-number-collision.md` (MAIL-12 N=1 M-1 mechanism), `memory/feedback-tw-grid-id-collision-pattern.md` (C-33 N=1 M-2 mechanism — 본 cycle 신규)
**연관 ledger**: `.claude/tw-grid/decisions/ID-LEDGER.md` (본 ADR 신설 산출물)

### Context

tw-mail / tw-grid 두 harness 에서 **독립적인** ID 관리 결함이 발생:

1. **MAIL-12 (2026-05-16~17)** — `MAIL-12-decisions.md` 안에서 cross-session working tree wipe 후 두 agent 가 같은 ADR-035/036 번호를 다른 의미 (Fork A polling vs. simulate seam) 로 발급. audit trail 손실 ~9700 bytes.
2. **tw-grid C-33 (2026-05-15~17)** — ADR-MOD-GRID-00-012 본문 (line 637/650/676/692/701/706/707/712) 이 "C-33 (Pro 패키지 license stub 정책)" 을 인용하나 정식 `constraints.md` entry 부재. 한편 `70-spec-discipline.md` L37 의 C-33 은 별도 의미 (Main Prompt Code Block Subordination) — ID collision.

두 사례는 mechanism 이 다름:
- **M-1 (ADR body reuse)**: cross-session race 로 같은 ID 가 두 결정에 발급.
- **M-2 (Constraint ID cross-reference dual-meaning)**: ADR 본문이 미등록 ID 를 가정 인용 → 별도 contraint 가 같은 ID 점유.

각 mechanism 은 현재 N=1 (pattern, anecdote+1). policy 진입 (N=3) 도달 전이나, **선제적 governance** 가 cost-effective — ID collision 사후 정리 비용 (audit trail 복원, post-hoc ADR 신설, disambiguation 추가) >>> ledger 신설 + 조회 의무 cost.

### Decision

`.claude/tw-grid/decisions/ID-LEDGER.md` 를 신설하여 다음 항목을 추적한다:

1. **ADR ID (`ADR-MOD-GRID-*-NNN`)** — 모듈별 (`00`, `01`, ..., `REFACTOR-*`, `99-A`, `99-B`) `lastIssued` + 각 entry 의 `상태` 컬럼 (accepted/implemented/withdrawn/deprecated).
2. **Constraint ID (`C-NN`)** — `lastIssued: C-36` + 각 entry 의 `상태` 컬럼 (active/ID collision/withdrawn/deprecated) + collision 사례 disambiguation.
3. **Mechanism 별 N 카운트** — M-1 / M-2 / M-3 / M-4 로 분류, **mechanism 통합 카운트 금지**. promotion (cross-harness 의무 적용) 은 mechanism 당 N=3 도달 시.

**의무**:
- 모든 ADR/Constraint 신설 전 본 ledger 조회 (Section 6 작성 의무 매트릭스 참조).
- withdrawn/deprecated ID 재사용 절대 금지.
- ID collision 발견 시 본 ledger 즉시 갱신 + 후속 인용 disambiguation 강제.

**Goal ID (`G-NNN`) 는 본 ledger 범위 외** — `.claude/tw-grid-state.json` + 각 모듈 `state.json` 이 권위.

### 사유

1. **ADR-MOD-GRID-00-012 Cross-module governance 선례 정합** — 00-012 가 Pro 패키지 license stub 정책을 cross-module catalog 로 신설한 패턴과 동일 lane. ID 관리도 cross-module governance — 같은 lane (`MOD-GRID-00`) 에 배치 정당.
2. **선제적 ledger 신설 ROI 양호** — collision 사후 정리 (MAIL-12 post-hoc 복원 ADR-037~039 작성 + audit trail 복원) >>> ledger 조회 의무 (1 grep + 1 read).
3. **Mechanism 분리 카운트 — false promotion 방지** — M-1 (race/wipe) 과 M-2 (cross-ref) 는 발생 조건 + 예방책이 다름. 통합 카운트 시 cross-harness 의무 적용이 premature.
4. **Goal ID 제외 — scope 명확화** — Goal ID 는 state.json 에 이미 권위 ledger 존재. 중복 추적 가치 0.

### 대안

| 대안 | 설명 | 각하 이유 |
|------|------|----------|
| **A. JSON 기반 ledger** | `.claude/tw-grid/decisions/id-ledger.json` agent 가 프로그래매틱 allocate | agent 가 next-ID 자동 할당 의무 unclear. spec writer 는 사람-읽기 우선 — MD table cross-reference 적합. JSON 신설 시 update tool 필요. ROI 부정. |
| **B. mechanism 통합 N 카운트 (N=2 → N=3 promotion)** | MAIL-12 + tw-grid C-33 = N=2 → 1 더 추가 시 cross-harness 의무 | advisor (2026-05-18) 명시 경고: mechanism 이 다른 사례 통합은 cherry-picking. premature cross-harness 의무. |
| **C. ledger 신설 보류, mechanism 당 N=3 도달 후 신설** | 현 단계는 anecdote (N=1) — policy 진입 (N=3) 도달 후 ledger 신설 | collision 사후 정리 비용 >> 선제 ledger 비용. 1 추가 collision 시 audit trail 손실 risk. |

### Trade-off

| Pro | Con |
|-----|-----|
| ADR/Constraint 신설 전 1 grep + 1 read 로 collision 사전 차단 | 모든 agent 의 의무 조회 — 학습 부담 (1회성, INDEX 와 동일) |
| ID collision 발견 시 disambiguation 강제 → 후속 인용 무결성 보장 | mechanism 분류 (M-1/M-2/M-3/M-4) 가 agent 에게 직관적이지 않을 수 있음 → 본 ADR + ledger Section 4 참조 의무 |
| ADR-00-012 cross-module governance 선례 정합 — 새 패턴 신설 없이 기존 lane 활용 | ledger 갱신 의무 — 신규 ADR 작성 시 두 곳 (decisions.md + ledger) 동기 갱신 |
| MAIL-12 N=1 + C-33 N=1 사례 영구 보존 → 향후 retro/promotion 근거 | tw-mail / tw-harness 까지 cross-harness 적용은 별도 cycle — 본 ADR 은 tw-grid pilot 한정 |

### 영향 분석

- **영향 범위**: tw-grid harness 한정. tw-mail / tw-harness 별도 cycle.
- **예상 공수**: 본 cycle 1-2h (ledger 신설 + 본 ADR + memory feedback 신설). 향후 신규 ADR 당 ledger 갱신 ~2분 추가.
- **위험**: low — read-only 분석 + 신규 파일 + 기존 ADR 본문 추가만. 실 코드 변경 0.
- **semver 영향**: none (governance ADR, 패키지 변경 0).
- **breaking change 여부**: no.

### 실행 조건 (실행 전 충족 필요)

- ID-LEDGER.md 신설 완료 (`.claude/tw-grid/decisions/ID-LEDGER.md`).
- memory feedback 신설 완료 (`memory/feedback-tw-grid-id-collision-pattern.md`).
- 본 ADR 작성 완료 (현재 entry).

### 결과 (실행 후 검증 항목)

- [x] `.claude/tw-grid/decisions/ID-LEDGER.md` 신설 (Section 1-7).
- [x] `memory/feedback-tw-grid-id-collision-pattern.md` 신설 (M-2 mechanism N=1 사례 영구 보존).
- [x] 본 ADR (00-013) decisions.md 추가.
- [-] tw-mail / tw-harness cross-harness 적용 — **별도 cycle 권고** (본 ADR 범위 외).
- [-] 기존 모듈 ADR (MOD-GRID-01 ~ 99-B) `lastIssued` backfill — 본 ledger 의 갱신 의무는 2026-05-18 이후 신규 ADR 시점부터 적용 (별도 cycle).

### 알려진 한계

1. **Backfill 미완** — 본 cycle 은 governance 신설 + 본 ledger 의 ADR-00 + REFACTOR-2026-05-17 인벤토리만 완전. MOD-GRID-01~99-B 의 `lastIssued` 컬럼은 *grep 으로 추출 가능* 명시만 — 별도 cycle backfill.
2. **Mechanism N=1 — promotion 부적격** — 본 ADR 은 *governance 신설* 만 정당. M-1/M-2 promotion (cross-harness 의무 적용) 은 각각 N=3 도달 후 별도 ADR 신설.
3. **Goal ID 추적 제외** — state.json 권위. 본 ledger 와 sync 의무 없음.

### Implementation Note — 2026-05-18

- 본 ADR 작성 + ID-LEDGER.md 신설 완료
- 사용자 옵션 B (governance ADR-MOD-GRID-00-NNN) 채택 — ADR-00-012 cross-module catalog 선례 정합
- ID-LEDGER.md 의 Section 6 작성 의무 매트릭스 = 4 agent 역할별 의무 명시
- memory feedback `feedback-tw-grid-id-collision-pattern.md` 신설 — M-2 mechanism N=1 영구 보존
- 결과 보고서: `.claude/tw-grid/findings/b-priority-3-id-ledger-result.md`

---

## ADR-MOD-GRID-00-014: npm scope rename `@tomis` → `@topgrid` + GitHub repo 연결

**Status**: implemented (2026-05-18)
**Wave**: Phase A — externalization 준비
**Mechanism**: 단일 결정 (사용자 명명 통일 의지)

### 배경

기존 monorepo 13 패키지가 `@tomis/grid-*` scope 로 명명되어 있었음. 사용자가 GitHub repo 를 `alladins/topgrid` 로 생성 + npm scope 통일 결정 (`@topgrid`) → monorepo + publish 측 패키지 명명 일괄 rename 의무 발생.

### 결정

1. **npm scope**: `@tomis/*` → `@topgrid/*` 일괄 rename (monorepo 13 패키지 전부, MIT + EULA 무관).
2. **GitHub repo**: `https://github.com/alladins/topgrid` 단일 monorepo (publish 측은 별개 repo, monorepo 가 publish source).
3. **4 MIT package.json metadata 추가**: `repository.url`, `bugs.url`, `homepage`, `publishConfig.access: "public"` — `npm publish` 직전 의무 필드. 9 EULA 패키지는 `private: true` 유지 + `publishConfig` 추가 금지.
4. **자기 검증 grep**: monorepo + publish 양쪽에서 `@tomis/` 0 hits (lockfile 제외) — 검증 완료.
5. **historical context 보존**: `decisions/MOD-GRID-*-decisions.md`, `findings/*`, `artifacts/*`, `goals/*-goals.json` 는 **immutable** — 당시 결정 시점에 `@tomis/` 였음이 본질. 일괄 rename 시 audit trail 손실.
6. **활성 SSoT 만 rename**: `canonical-modules.json` (1) + `decisions/ID-LEDGER.md` (2) + `rubric/specify-rubric.md` (4) + `rubric/implement-rubric.md` (1) + `rubric/verify-rubric.md` (3) — 향후 agent grep 시 `@topgrid/` 가 현재 canonical 식별자.
7. **C-26 (Compatibility) 면제**: 본 rename 은 *publish 전* (npm registry 에 외부 등록 0 — `@tomis/*` 0 packages published 확인됨). semver breaking change 적용 대상 아님. 만약 publish 후 동일 rename 발생 시 POL-COMPAT §3 major bump + deprecation alias 1 cycle 의무.

### 영향 범위

| 영역 | 파일 수 | occurrence | 검증 |
|------|---------|-----------|------|
| monorepo (src + config + docs) | 188 | 806 | 0 hits (lockfile 제외) |
| TBIZONE/publish (package.json + page.tsx) | 2 | 13 | 0 hits |
| TOMIS 활성 SSoT (canonical/ID-LEDGER/rubric) | 5 | 11 | 0 hits |
| TOMIS historical context (decisions/findings/artifacts) | 200+ | 1372+ | **의도적 보존** |

### 거부된 옵션

- **옵션 X (현 상태 유지)** — GitHub repo 명 `topgrid` ↔ npm scope `@tomis` 불일치. 외부 사용자 혼란 + README 명명 어색함.
- **옵션 Z (GitHub repo rename)** — 사용자 이미 `topgrid` 생성. 재명명 + URL 변경 + alladins/ 다른 repo 와의 충돌 가능성.
- **TOMIS 문서 일괄 rename** — historical context 손실 (당시 `@tomis/` 가 결정 사실).

### 검증 절차 (실측)

1. `grep -r "@tomis/" monorepo/ --exclude=pnpm-lock.yaml --exclude-dir=node_modules` → 1 hit only (`apps/docs/storybook-static/index.json` — build artifact, .gitignore에 포함됨).
2. `grep -r "@tomis/" publish/src publish/package.json` → 0 hits.
3. `pnpm install` (monorepo): exit 0, peer warning은 pre-existing (typedoc-plugin-markdown — rename 무관).
4. `npm install` (publish): exit 0.
5. 4 MIT package.json: name=`@topgrid/grid-*` + repository.url=`git+https://github.com/alladins/topgrid.git` + publishConfig.access=`public` 확인 (node -e 직접).

### Constraint

- C-1 (Drift): rename 외 변경 금지 — agent 가 mechanical text replacement 만 수행 + advisor 호출 0 (단순성).
- POL-COMPAT §3 면제: publish 전 rename = breaking change 아님.

### Directive

- 향후 ADR/finding 작성 시 `@topgrid/*` 사용. `@tomis/*` 는 historical reference (2026-05-18 이전) 로만 인용.
- `npm publish` 시점에 LICENSE 복사 + README per package 점검 + size-limit baseline lock — 별도 cycle.

### Confidence: high
### Scope-risk: narrow (rename + metadata 만)
### Not-tested
- `npm publish --dry-run` (publish credentials 부재로 실 publish 시뮬 미수행 — 별도 cycle)
- Storybook 빌드 (storybook-static 의 stale `@tomis/` 1 hit, build artifact 재생성 시 자동 정정)
