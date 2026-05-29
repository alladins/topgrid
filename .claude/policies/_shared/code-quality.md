# SHARED-QUALITY — 코드 품질 (universal SSoT)

> tw-mail / tw-harness / tw-grid 공통 코드 품질 룰.
>
> 출처 통합:
> - tw-mail: constraints C-10, C-11, C-12 + POL-BUILD/§2
> - tw-harness: constraints C-1, C-3, C-4, C-5, C-10, C-11
> - tw-grid: constraints C-1, C-3, C-4, C-5

---

## §1. No Assumption Coding

- 코드/스펙 작성 시 추측 금지. 모르면 멈추고 사용자에게 확인.
- 다른 위치의 동일 패턴 grep 없이 신규 작성 금지.
- "이렇게 동작할 것이다" 가정만으로 implement 진행 금지.
- 위반 시 Self-Review NO + 사용자 결정 게이트 발동.

---

## §2. TypeScript Strict

### §2.1 `any` 금지
- 변경 파일에 `any` 0건 강제.
- `unknown` + narrow 사용.
- `as any` 캐스팅 금지.
- 외부 라이브러리 타입 미정의 시 `declare module` 또는 `@types/*` 설치.

### §2.2 `tsconfig.json` strict
- `strict: true` 의무.
- `exactOptionalPropertyTypes: true` 권장 (tw-grid 환경에서는 강제).

### §2.3 Build 통과
- `npx tsc --noEmit` 0 errors 강제.
- 정확한 명령은 [SHARED-BUILD](build-commands.md) 참조.

---

## §3. Java Strict (BE 변경 시)

### §3.1 Raw type 금지
- `List` 등 raw type 0건. 제네릭 명시 의무.

### §3.2 Compile 통과
- `gradlew.bat compileJava` 0 errors 강제 ([SHARED-BUILD](build-commands.md)).

---

## §4. No Dummy / Mock Data

- 모든 데이터는 실제 API / DB 에서 (frontend 코드 + backend Service 코드 모두).
- 하드코딩 mock 금지.
- 단 단위 테스트(`*Test.java`, `*.test.tsx`) 는 예외.
- "임시로 mock 두고 나중에 교체" 패턴 금지 — 시작부터 실제 데이터.

---

## §5. CSS 신규 파일 금지

- 신규 `.css` / `.scss` 파일 생성 금지.
- Tailwind `className` 만 사용.
- 기존 CSS 파일은 유지 (회고적 변경 X).

---

## §6. 에러 처리 + 로딩 상태

### §6.1 FE 에러 처리
- 모든 API 호출에 `catch { showToast('error', ...) }` 또는 동등 메커니즘 강제.
- 사용자 노출 메시지에 stack trace 노출 금지.

### §6.2 FE 로딩 상태
- 모든 비동기 작업에 `isLoading` state + 버튼 disabled 의무.
- 사용자가 다중 클릭하여 중복 호출 방지.

### §6.3 BE 에러 응답
- 사용자 노출 응답 body 에 stack trace 노출 금지.
- 상세 로깅은 별도 (logger 사용).
- 에러 코드/메시지 표준화 (ErrorCode enum — 하네스별 별도 정의).

---

## §7. Null/Optional 처리

### §7.1 BE
- Mapper `SELECT` 결과 list 가 null 이면 빈 리스트 반환 (`list != null ? list : new ArrayList<>()`).
- Optional 사용 시 `.get()` 직접 호출 금지 — `.orElse()` / `.orElseThrow()`.

### §7.2 FE
- API 응답 null 가드 의무 (Spec 에 명시 + 코드 적용).
- `?.` 또는 명시적 null check.

---

## §8. 정적 검증

| 위치 | 검증 |
|------|------|
| FE | `any` grep 0건, `dangerouslySetInnerHTML` 없이 sanitize 여부 (도메인별 정책 참조) |
| BE | raw type grep 0건, null guard grep |
| 둘 다 | [SHARED-BUILD/§3](build-commands.md#3-통과-의무-시점) 빌드 통과 |

---

## §9. 위반 시 처리

- **implement**: 해당 카테고리 NO + Self-Review 보고
- **verify**: B 카테고리 NO + buildStatus FAIL 가능
- silently 진행 시 [SHARED-DRIFT](drift-spec.md) 위반으로 추가 게이트
