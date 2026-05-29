# POL-MIG-STAGE — 사용처 점진 마이그레이션 + 시각 회귀 (SSoT)

> 1 Goal 당 사용처 마이그레이션 5개 이하. 시각 회귀 검증 의무.
>
> 출처 통합: constraints C-8 + C-19 + C-13 + C-17.

---

## §1. 사용처 점진 마이그레이션

### §1.1 의무
- 1 Goal 당 영향 사용처 (`affectedUsageFiles`) 마이그레이션 **≤ 5개**
- 6개 이상이면 별도 Goal 로 분할 (Section 11 구현 순서 명시)
- 잔여 사용처는 deprecated alias 또는 `documented-deviations/` 기록

### §1.2 예외
- 트리비얼 변경(import 경로만 변경)은 ≤ 10개까지 허용

### §1.3 금지
- 1 Goal 에서 사용처 6개 이상 동시 변경 (위 예외 외)

---

## §2. 시각 회귀 검증 의무

### §2.1 적용 대상
- `migrationImpact: high` / `medium` Goal 은 영향 사용처 마이그레이션 후 시각 회귀 검증 **필수**
- `low` 는 권장

### §2.2 방법
1. **자동**: Storybook story + Chromatic 또는 Playwright screenshot
2. **수동**: 마이그레이션 전후 동일 데이터로 스크린샷 캡처 + 외관 비교 메모

### §2.3 금지
- tsc 통과만으로 "호환 OK" 주장

### §2.4 N/A 조건
- `migrationImpact: low` 또는 사용처 0개 Goal

---

## §3. 검증

### §3.1 정적
- `affectedUsageFiles` 배열 길이 점검 ≤ 5
- Storybook story 또는 screenshot 산출물 확인

### §3.2 위반 시 처리
- **implement**: 사용처 6개 이상 + Goal 분할 없음 → NO + 재시도
- **verify**: 시각 회귀 미검증 + impact high/medium → NO
