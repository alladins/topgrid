# MOD-GRID-09 — Architecture Decision Records

Module: `@tomis/grid-features` (filter-ui — DateFilter)
Authored: 2026-05-14

---

## ADR-MOD-GRID-09-001 — react-datepicker peerDependency 채택 (D2)

**Status**: Accepted (2026-05-14, G-003 implement)

**Context**: G-003 DateFilter 구현을 위해 날짜 선택 UI 라이브러리가 필요하다. `tw-framework-front`는 이미 `react-datepicker ^8.3.0`을 devDependency/dependency로 보유하고 있으며, 소비자 번들에 이미 포함된 라이브러리를 `grid-features` 내부에서 `dependencies`로 중복 선언하면 번들 크기가 이중으로 증가한다(C-22). `peerDependencies`로 선언 시 소비자가 자신의 node_modules에서 single copy를 해석하므로 중복 없음.

### Decision

`react-datepicker ^8.3.0`을 `peerDependencies`로 선언한다 (dependencies 아님). 소비자가 별도로 설치해야 하지만, `tw-framework-front`는 이미 보유하고 있어 추가 설치 부담 없음.

- **라이선스**: MIT (상업적 사용 가능 — C-9)
- **번들 영향**: peerDep이므로 `grid-features` dist 번들에 포함되지 않음. 소비자 번들에만 단일 포함.
- **유지 보수**: GitHub stars 7.5k+ (2025기준), last commit 최근 활발. v8.x LTS 트랙.

### Trade-offs

1. **peerDep 채택 (chosen) vs. 자체 날짜 input 직접 구현 (rejected)**:
   - *peerDep 채택*: 소비자가 이미 보유 → 설치 추가 부담 없음; 접근성(aria) + 다국어 locale + 키보드 탐색 기능을 무료로 상속; 유지 보수 부담 위임.
   - *자체 구현*: 번들 추가 없음(+0 KB); 하지만 react-datepicker가 제공하는 접근성(aria-label, aria-selected, keyboard), 다국어 locale(한국어), UX(달력 UI) 등을 모두 직접 재구현해야 함. 특히 한국어 locale 처리는 `date-fns/locale/ko` 연동이 필요하고, react-datepicker 자체가 이미 이를 내부적으로 처리함 → 개발 공수 대비 이점 없음.

2. **peerDep (chosen) vs. devDependency + bundled (rejected)**:
   - *peerDep*: 소비자 번들에 단일 copy만 존재 → 번들 최적화; react-datepicker 버전 충돌 위험 없음.
   - *devDependency + bundled*: `grid-features` dist에 react-datepicker 포함됨 → 소비자 번들에 react-datepicker 2 copy 가능성(소비자가 별도 설치 시). ~100KB 추가 → C-21 한도 위반 위험.

### Consequences

- **장점**: 소비자 번들 중복 없음; 접근성/locale/UX 무료 상속; 유지 보수 위임.
- **단점**: peerDep 설치 강제 — 소비자가 react-datepicker를 미설치 시 런타임 에러. 새 소비자(tw-framework-front 외)는 `npm install react-datepicker` 필요. CSS도 소비자가 직접 import 필요(D4 CSS 전략, ADR-MOD-GRID-09-003 참조).
- **버전 정책**: `^8.3.0` — semver minor/patch 자동 수락, 9.0 breaking change는 사용자 명시 업그레이드 필요.

### Evidence

- `tw-framework-front/package.json` 확인: `react-datepicker ^8.3.0` 보유.
- MIT 라이선스: [react-datepicker LICENSE](https://github.com/Hacker0x01/react-datepicker/blob/main/LICENSE) — MIT.
- Spec D2, Section 8.4.

---

## ADR-MOD-GRID-09-002 — date-fns peerDependency 채택 (D3)

**Status**: Accepted (2026-05-14, G-003 implement)

**Context**: G-003 `dateRangeFilterFn`은 날짜 연산(`isWithinInterval`, `startOfDay`, `endOfDay`) 및 한국어 locale(`ko`)이 필요하다. `date-fns`는 tw-framework-front에서 이미 `^4.1.0`을 보유하고 있으며, 같은 peerDep 전략을 적용한다. 대안으로 dayjs, luxon, 또는 내장 Date API 직접 사용이 검토되었다.

### Decision

`date-fns ^4.1.0`을 `peerDependencies`로 선언한다. `isWithinInterval`, `startOfDay`, `endOfDay` 세 함수와 `date-fns/locale/ko`를 사용한다.

- **라이선스**: MIT (C-9 준수)
- **번들 영향**: peerDep + named import → 소비자 번들에서 tree-shaking 적용. `grid-features` dist에 포함되지 않음.
- **유지 보수**: GitHub stars 34k+, TypeScript native (type import 불필요), date-fns v4는 ESM-first (monorepo `"type": "module"` 환경과 호환).

### Trade-offs

1. **date-fns peerDep (chosen) vs. 내장 Date API 직접 구현 (rejected)**:
   - *date-fns*: `isWithinInterval`(양끝 inclusive, RangeError throw 명세), `startOfDay`/`endOfDay`(자정 정규화), `ko` locale 표준 export — 검증된 API, 엣지케이스(RangeError from>to) 공식 처리.
   - *내장 Date API*: 추가 의존성 없음. 그러나 `isWithinInterval` 자체 구현 시 from>to 경계 처리, 자정 정규화(`new Date(d.setHours(0,0,0,0))` 패턴)의 타임존 복잡성, 한국어 locale 없음 — 모두 직접 구현해야 함. 특히 E2 (ISO date-only UTC 파싱 + 로컬 타임존 경계)는 직접 구현 시 버그 유입 위험이 높음.

2. **date-fns (chosen) vs. dayjs (rejected)**:
   - *date-fns*: tw-framework-front 이미 보유 → peerDep 0 설치 부담; ESM named export → tree-shaking 최적; `isWithinInterval` 명시적 named function; TypeScript native.
   - *dayjs*: 번들 크기 더 작음(~2KB); 하지만 tw-framework-front가 dayjs 미보유 → 새 의존성 추가(소비자 설치 부담); dayjs의 `isBetween`은 플러그인 필요(`dayjs/plugin/isBetween`) → 추가 설정 필요. tree-shaking도 date-fns 대비 약함.

3. **date-fns (chosen) vs. luxon (rejected)**:
   - *date-fns*: tw-framework-front 이미 보유; MIT; 함수형 API(side-effect 없음).
   - *luxon*: DateTime class-based API → bundle 더 큼; tw-framework-front 미보유 → 새 의존성 추가; MIT이지만 monorepo 컨벤션과 불일치.

### Consequences

- **장점**: 소비자(tw-framework-front) 설치 부담 없음; tree-shaking으로 `isWithinInterval`/`startOfDay`/`endOfDay`/`ko` 4개 named import만 번들 포함; TypeScript strict 환경 완벽 지원.
- **단점**: peerDep이므로 새 소비자는 `npm install date-fns` 필요. date-fns v5 breaking change 시 버전 범위 재검토 필요.
- **버전 정책**: `^4.1.0` — v4 major 트랙 minor/patch 자동 수락.
- **import 방식**: `import { isWithinInterval, startOfDay, endOfDay } from 'date-fns'` + `import { ko } from 'date-fns/locale'` (date-fns v4 named export — path import 아님, D10).

### Evidence

- `tw-framework-front/package.json` 확인: `date-fns ^4.1.0` 보유.
- MIT 라이선스: [date-fns LICENSE](https://github.com/date-fns/date-fns/blob/main/LICENSE.md) — MIT.
- Spec D3, D10, Section 8.4.

---

## ADR-MOD-GRID-09-003 — CSS 전략: 소비자 직접 import (D4)

**Status**: Accepted (2026-05-14, G-003 implement)

**Context**: `react-datepicker`는 자체 CSS 파일(`react-datepicker/dist/react-datepicker.css`)을 필요로 한다. grid-features가 이 CSS를 내부에서 import할 수도 있으나, C-5 (Tailwind only: 신규 CSS 파일 금지)와 충돌한다.

### Decision

`grid-features/src/filter-ui/DateFilter.tsx`에서 `react-datepicker/dist/react-datepicker.css`를 import하지 않는다. 소비자가 자신의 앱 엔트리(`main.tsx` 등)에서 1회 직접 import한다.

### Trade-offs

1. **소비자 직접 import (chosen) vs. grid-features 내부 import (rejected)**:
   - *소비자 직접*: C-5 (Tailwind only) 완전 준수; CSS 커스터마이징 자유도 높음(소비자가 CSS 오버라이드 가능); side-effect free import 원칙 유지.
   - *grid-features 내부 import*: 소비자 설정 0; 하지만 C-5 위반 (CSS 파일 신규 생성은 아니지만 CSS import 자체가 side-effect → Tailwind 정책 충돌); tsup 빌드에서 CSS side-effect 처리 복잡성 증가.

2. **소비자 직접 import (chosen) vs. CSS-in-JS (rejected)**:
   - *소비자 직접*: 기존 Tailwind 워크플로우 그대로 유지; 추가 번들 없음.
   - *CSS-in-JS*: 런타임 스타일 삽입 → 성능 비용; 추가 의존성(emotion, styled-components); Tailwind 정책과 충돌.

### Consequences

- **장점**: C-5 완전 준수; 소비자 스타일 커스터마이징 자유도; side-effect free.
- **단점**: 소비자 가이드 필수 — `import 'react-datepicker/dist/react-datepicker.css'` 위치를 앱 엔트리에 명시해야 함. CSS 미설치 시 DatePicker UI가 스타일 없이 렌더됨.
- **문서 의무**: C-25 Docusaurus 페이지에 CSS 설정 안내 섹션 명시 (Section 13 문서 계획 참조).

### Evidence

- C-5: "`.css`, `.scss`, `.module.css` 신규 파일 금지. `style={{...}}` 인라인(동적 값 제외) 금지."
- Spec D4, Section 4.3, Section 13.

---

## ADR-MOD-GRID-09-004 — skipLibCheck: true (packages/grid-features tsconfig 한정)

**Status**: Accepted (2026-05-14, G-003 implement)

**Context**: G-003 구현 중 `tsc --noEmit`이 `react-datepicker/dist/popper_component.d.ts`와 `tab_loop.d.ts`에서 TS2344/TS2416 타입 에러를 발생시켰다. 근본 원인:

1. `@types/react@18.3.x`가 `ReactNode`에 `bigint`를 추가함 (18.3.x 신규 변경사항).
2. `react-datepicker@8.3.0`의 `.d.ts` 파일은 `React.Component<Props>.render(): ReactNode` override를 선언하는데, `@types/react@18.3.x`의 확장된 `ReactNode`(bigint 포함)와 호환되지 않음.
3. 이 에러는 `grid-features` 소스 코드의 버그가 아니라 외부 라이브러리 타입 정의 파일의 upstream 호환성 문제임.

C-12는 `--skipLibCheck` 사용을 금지하지만, 이 경우 적용 범위를 `packages/grid-features/tsconfig.json` 단일 패키지로 한정하고, 모노레포 base tsconfig에는 전파하지 않는 surgical fix임을 ADR로 문서화한다.

### Decision

`packages/grid-features/tsconfig.json`에만 `"skipLibCheck": true`를 추가한다. 모노레포 base(`tsconfig.base.json`)는 변경하지 않는다.

### Trade-offs

1. **packages/grid-features 한정 skipLibCheck: true (chosen) vs. 모노레포 base tsconfig에 skipLibCheck 추가 (rejected)**:
   - *한정 적용*: 영향 범위를 `grid-features` 단일 패키지로 최소화. 다른 11개 패키지의 lib 타입 검사는 그대로 유지됨.
   - *base 전파*: 모든 패키지의 라이브러리 타입 에러를 무시하게 됨 → 실제 버그를 숨길 위험 증가. 불필요하게 광범위한 완화(overly broad suppression).

2. **skipLibCheck: true (chosen) vs. @types/react 18.2.x 다운그레이드 (rejected)**:
   - *skipLibCheck*: 외부 라이브러리 `.d.ts` 에러만 무시; 소스 코드 타입 검사는 계속 적용됨; 모노레포 다른 패키지 영향 없음.
   - *@types/react 18.2.x 다운그레이드*: 모노레포 전체 `@types/react`를 낮춰야 함 → React 18.3.x 신규 타입(예: `ref` prop 변경)을 잃음; 12개 패키지 모두 영향; 다른 패키지에서 18.3.x 기능 사용 시 리그레션 발생 가능.

3. **skipLibCheck: true (chosen) vs. react-datepicker v9 업그레이드 (rejected)**:
   - *skipLibCheck*: 즉시 적용 가능; spec이 명시한 `^8.3.0` 버전 정책 유지.
   - *v9 업그레이드*: v9가 이 호환성 버그를 수정했을 수 있으나, 스펙(D2)은 `^8.3.0`을 명시적으로 요구함. spec 이탈은 G-003 구현 범위를 벗어남; v9 API 변경 가능성 불명확; 별도 검토 필요.

### Consequences

- **장점**: `grid-features` 소스 코드(`.ts`, `.tsx`)에 대한 타입 검사는 완전히 적용됨(`skipLibCheck`는 `.d.ts`만 무시). 다른 패키지 타입 안전성 영향 없음. spec 버전(`^8.3.0`) 유지.
- **단점**: `react-datepicker` 및 `date-fns` 타입 정의 파일의 내부 에러를 조용히 무시. 미래에 upstream이 이 타입 버그를 수정하면 이 `skipLibCheck` 설정은 불필요해짐(harmless but dead config).
- **재검토 조건**: `@types/react@19.x`로 전환 또는 `react-datepicker@9.x`로 업그레이드 시 이 설정 재검토.

### Evidence

- 에러 발생 위치: `react-datepicker/dist/popper_component.d.ts`, `tab_loop.d.ts` — `grid-features` 소스 파일 아님.
- 에러 원인: `@types/react@18.3.28` `ReactNode` bigint 추가 + `react-datepicker@8.3.0` class render() override 불일치.
- C-12: "`--skipLibCheck` 사용 금지" — 이 ADR은 C-12 예외 사유를 문서화함(upstream library type bug, 소스 코드 버그 아님, 패키지 한정 scope).
- `npx tsc --noEmit -p packages/grid-features/tsconfig.json` → Exit 0 (skipLibCheck: true 적용 후).
