# POL-COMPAT — Backward Compatibility + peerDependencies + semver (SSoT)

> 사용처 호환성 절대 + peerDependencies 정책 + API 안정성 semver.
>
> 출처 통합: constraints C-6 + C-22 + C-23.

---

## §1. Backward Compatibility

### §1.1 의무
- 모든 새 API 는 기존 사용처 마이그레이션 가능 보장
- Breaking change 시 deprecation 단계 (최소 1 minor 버전 alias 유지)

### §1.2 금지
- 사용처 코드에 일괄 변경 강제 (점진 마이그레이션은 [POL-MIG-STAGE](migration-staging.md))

### §1.3 0.x → 1.0 전환
- 1.0 전환 후 breaking change 는 major (2.0, 3.0)
- deprecated API 는 최소 1 minor 버전 alias 유지

---

## §2. peerDependencies 정책

### §2.1 의무 peerDependencies
다음은 반드시 `peerDependencies` 로 선언 (`dependencies` X):
- `react`, `react-dom`
- `@tanstack/react-table`
- `@tanstack/react-virtual` (grid-virtual 패키지만)
- `xlsx` (grid-export 패키지만)
- `jspdf` (grid-export 패키지만)

### §2.2 금지
- peer 를 dep 으로 중복 선언 (이중 번들 발생)

### §2.3 optional peer
- `peerDependenciesMeta` 로 optional 명시 (가능 시)

---

## §3. Semver 준수

### §3.1 의무
- 모든 패키지 semver 준수
- breaking change 시 CHANGELOG.md 에 마이그레이션 가이드

### §3.2 Changeset 도구
- `@changesets/cli` 사용 의무

---

## §4. 검증

### §4.1 정적
- 각 패키지 `package.json` 의 `peerDependencies` ↔ `dependencies` 중복 검사
- breaking change PR 의 `CHANGELOG.md` migration guide 존재 확인

### §4.2 위반 시 처리
- **implement**: 해당 항목 NO + 재시도
- **verify**: 호환성 카테고리 NO
