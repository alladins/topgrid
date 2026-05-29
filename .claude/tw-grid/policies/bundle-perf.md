# POL-BUNDLE — 가상화 호환 + 번들 크기 (SSoT)

> 모든 그리드 컴포넌트는 `@tanstack/react-virtual` 호환. 번들 크기 한계 강제.
>
> 출처 통합: constraints C-10 + C-18 + C-21.

---

## §1. 가상화 호환성

### §1.1 의무
- 모든 새 그리드 컴포넌트는 `@tanstack/react-virtual` 통합 가능
- 대용량 시나리오 Storybook story 1개 필수 (1000행+)
- `estimateSize`, `getScrollElement` 등 react-virtual API 호환 검증

### §1.2 금지
- 전체 DOM 렌더링 가정 (스크롤 시 가상화 깨지는 코드)
- 절대 위치(`position: absolute`) 셀, 정확한 행 높이 계산 없는 컴포넌트

---

## §2. 번들 크기 한계

### §2.1 의무
- 패키지별 `size-limit` 설정 (`.size-limit.json`)

### §2.2 기본 한도
| 패키지 | 한도 (gzipped) |
|--------|---------------|
| `grid-core` | ≤ 30 KB |
| `grid-renderers` | ≤ 10 KB |
| 각 pro 패키지 | ≤ 20 KB |
| 메타 패키지 `grid` (all pro) | ≤ 150 KB |

### §2.3 의무
- +100 KB 초과 변경 시 **사용자 승인 의무**

---

## §3. 검증

### §3.1 정적/동적
- `pnpm -r build` 후 `size-limit` 통과 확인
- Storybook 대용량 시나리오 (1000행+) 렌더링 확인

### §3.2 위반 시 처리
- **implement**: 번들 한도 초과 시 NO + 재시도 또는 사용자 결정 게이트
- **verify**: 가상화 카테고리 NO
