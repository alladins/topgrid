# POL-DOC-LIC — 라이선스 + 문서화 + ADR 의무 (SSoT)

> 모든 패키지 라이선스 명시 + Public API JSDoc/Storybook/README + 외부 라이브러리 ADR.
>
> 출처 통합: constraints C-24 + C-25 + C-14 + C-9 + C-20.

---

## §1. 라이선스 명시 의무

### §1.1 의무
모든 패키지 `package.json` 에 `license` 필드 명시:
- **MIT 패키지**: `"license": "MIT"` + `LICENSE` 파일
- **Pro 패키지**: `"license": "SEE LICENSE IN EULA"` + `EULA.md` + 라이선스 검증 매크로

### §1.2 Pro 패키지 런타임 검증
- 런타임 라이선스 검증 호출 (`grid-license` 패키지)

### §1.3 금지
- 라이선스 미명시 `npm publish`

---

## §2. Public API 문서화 의무

### §2.1 의무
- 모든 export 함수/타입/컴포넌트에 **JSDoc**
- **Docusaurus 또는 Nextra** 페이지 (API reference + 사용 예시)
- **Storybook story** 최소 1개 (기본 + 시나리오별)
- **README.md** (패키지별)

### §2.2 금지
- 문서 없이 release

---

## §3. 라이선스 정책 (도입 가능)

### §3.1 도입 가능
- MIT, Apache 2.0, BSD, ISC

### §3.2 도입 금지
- GPL, LGPL, EPL
- 상용 라이선스 (Wijmo, AG Grid Enterprise 등 — [POL-TANSTACK/§4](tanstack-fidelity.md#4-라이선스-정책-도입-가능-라이브러리))

---

## §4. ADR 의무

### §4.1 ADR 필수 결정
- API 시그니처 결정 (props/return)
- 라이선스 모델 결정 (MIT vs Pro)
- 외부 라이브러리 추가
- 번들 분할 전략
- peerDependencies 정책 변경

### §4.2 위치
`.claude/tw-grid/decisions/MOD-GRID-XX-decisions.md`

### §4.3 형식
- 결정 / 사유 / 대안 2개+ / trade-off / 결과

### §4.4 외부 라이브러리 ADR 필수 항목
- 라이브러리 선택 이유
- 대안 2개+ 비교
- 라이선스 확인 (§3.1 만)
- 번들 영향 (예상 +N KB — [POL-BUNDLE/§2.2](bundle-perf.md#22-기본-한도))
- maintenance 상태 (last commit, star, issue)

---

## §5. 검증

### §5.1 정적
- 각 `package.json` `license` 필드 grep
- `README.md`, `EULA.md`, `LICENSE` 파일 존재 확인
- 신규 dependency 추가 시 `decisions/MOD-GRID-XX-decisions.md` 존재 확인

### §5.2 위반 시 처리
- **implement**: ADR 부재 + 신규 dep → NO + 재시도
- **verify**: 문서화/라이선스 카테고리 NO

### §5.3 SHARED-DRIFT/§8 연동
ADR 의무는 [SHARED-DRIFT/§8](../../policies/_shared/drift-spec.md#8-adr-의무-decision-log) 과 함께 작동. 본 정책은 tw-grid 도메인 특화 ADR 필수 결정 명시.
