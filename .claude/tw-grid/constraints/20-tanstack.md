# 20-tanstack — TanStack + 경쟁 라이브러리 금지

본 카테고리는 [`POL-TANSTACK`](../policies/tanstack-fidelity.md) 으로 SSoT 추출됨.

---

## C-2: TanStack v8 표준 API 사용 (No Custom Fork)

→ **SSoT**: [POL-TANSTACK/§1](../policies/tanstack-fidelity.md#1-tanstack-v8-표준-api-사용)
*요약*: 표준 export 만 사용. 내부 API 직접 접근 금지.

---

## C-7: AG Grid 신규 도입 금지

→ **SSoT**: [POL-TANSTACK/§2](../policies/tanstack-fidelity.md#2-ag-grid-신규-도입-금지)
*요약*: `ag-grid-*` 신규 dependency 금지. references/ 에 패턴 분석만.

---

## C-16: Wijmo 비도입 의무

→ **SSoT**: [POL-TANSTACK/§3](../policies/tanstack-fidelity.md#3-wijmo-비도입-의무)
*요약*: `wijmo*` 신규 import 절대 금지. 상용 라이선스 + MIT 정책 위배.
