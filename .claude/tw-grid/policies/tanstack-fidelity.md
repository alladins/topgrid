# POL-TANSTACK — TanStack 표준 + 경쟁 라이브러리 금지 (SSoT)

> TanStack Table v8 표준 API 만 사용. AG Grid + Wijmo 신규 도입 금지.
>
> 출처 통합: constraints C-2 + C-7 + C-16.

---

## §1. TanStack v8 표준 API 사용

### §1.1 의무
표준 export 함수만 사용:
- `useReactTable`, `getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel`
- `getPaginationRowModel`, `getExpandedRowModel`
- `flexRender`

### §1.2 금지
- TanStack Table 내부 API 직접 접근 (private fields, hidden methods)
- 비공식 fork / monkey-patch

---

## §2. AG Grid 신규 도입 금지

### §2.1 금지
- `ag-grid-community`, `ag-grid-react`, `ag-grid-enterprise` 신규 dependency

### §2.2 참조 허용
- `references/publish-aggrid-analysis.md` 에 패턴 분석만 (코드 차용 X — 라이선스)

### §2.3 예외
- publish 자체는 기존 AG Grid 유지 (마이그레이션 별도 트랙)

---

## §3. Wijmo 비도입 의무

### §3.1 금지
- `@mescius/wijmo*`, `wijmo*` 패키지 신규 import (전 패키지)
- Wijmo SDK 디렉토리(`wijmo-5.*_KR/`) 에서 코드 차용

### §3.2 참조 허용
- `references/publish-wijmo-analysis.md` 에 패턴 분석만 (구조 학습용)

### §3.3 근거
- Wijmo 상용 라이선스 ($695+/user/year, per-domain)
- tw-framework-front MIT only 정책
- publish 의 Wijmo 는 평가판 추정 (라이선스 모달 발생)
- 17 모듈로 동등 기능 직접 구현 — Wijmo-class 영역(MOD-GRID-10~15)

### §3.4 예외 없음
어떤 시나리오에서도 Wijmo import 금지. 패턴 모방은 허용.

---

## §4. 라이선스 정책 (도입 가능 라이브러리)

→ [POL-DOC-LIC/§3](documentation-licensing.md#3-라이선스-정책) 도 참조

### §4.1 도입 가능
**MIT**, **Apache 2.0**, **BSD**, **ISC** 만 도입.

### §4.2 도입 금지
GPL, LGPL, EPL, 상용 라이선스 (Wijmo, AG Grid Enterprise 등).

---

## §5. 검증

### §5.1 정적
- `package.json` dependencies/peerDependencies 에서 ag-grid/wijmo grep → 0건 확인
- 변경 파일 import grep: `from ['"]ag-grid|from ['"]@mescius|from ['"]wijmo` → 0건

### §5.2 위반 시 처리
- **implement**: A 카테고리 NO + 즉시 작업 중단 + 사용자 결정 게이트
- **verify**: 패키지 검증 NO

### §5.3 references 디렉토리 sanity
- `references/ag-grid-feature-matrix.md`, `references/publish-wijmo-analysis.md` 는 분석 목적 (코드 차용 X)
