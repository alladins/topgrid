---
id: LESS-004
title: pinned 의존성 edition 이 미지원하는 기능을 호출하면 silent no-op 으로 ship 된다
signature: pinned-dep-edition-feature-silent-noop
status: lesson(N=1)
first_seen: MOD-GRID-25
links: [AP-003, AP-004, C-003, "MASTER §5.2 P25-1"]
---

## 교훈
라이브러리의 **특정 edition/버전에서만 동작하는 기능**을 그 edition 이 핀(pin)된 환경에서 호출하면,
호출은 throw 없이 통과하지만 산출물에는 **반영되지 않는다(silent no-op)**. 주석이 "부분 지원"·"limited
support" 처럼 *완곡하게* 적혀 있으면 실제로는 0 반영인데도 "되긴 된다"로 오독된다.

## 최초 발견 (MOD-GRID-25, grid-export 확장)
`exportRowsToExcel.ts:83` 이 헤더 셀에 `.s = { font:{bold}, fill:{fgColor:{rgb:'F3F4F6'}} }` 를 세팅.
그러나 grid-export 의 pinned required peer `xlsx@0.18.5`(**community edition**)는 **write 시 `.s` 를
스트립**한다 — cell 스타일(font/fill/border)은 SheetJS Pro(styled build) 전용. 주석은 "limited style
support"라 적혀 부분 동작처럼 보였으나, write→read 라운드트립 **실측**(harness P6):

```
A1.s ({font.bold, fill F3F4F6})  write→read  →  {patternType:'none'}   // 원 스타일 완전 소멸
A2.z ('#,##0.00')                write→read  →  '#,##0.00'  (생존, t:'n' numeric 유지)
!cols ({wch:22})                 write→read  →  생존
```

→ 폰트/배경은 0 반영(부분 아님), 숫자서식(`.z`)·폭(`!cols`)은 생존. "limited" 주석이 실제 경계를
흐렸다.

## 처방 (적용한 것)
- **추측 금지·근거 강제(P6)**: edition 경계는 **실제 write→read 라운드트립으로 확정**하고 그 증거를
  spec/§5.2 에 인용. 코드 주석("limited")을 사실로 신뢰하지 않는다.
- **생존하는 것만 주장**: MOD-25 는 라운드트립에서 생존 확인된 **네이티브 `.z` + `!cols`** 만 신규 API
  로 노출. 폰트/배경은 **문서화된 한계**로 README 에 명시(no-op 을 동작처럼 ship 0).
- **surgical**: 기존 `exportRowsToExcel` 의 `.s` no-op 은 silent 수정하지 않고 §5.2 P25-1 gap 으로만 기록
  (정정/제거는 후속 선택). 본 모듈 요청 범위 밖 코드 보존.

## 신호 (다음에 같은 모양이 보이면)
- 라이브러리 community/free edition + Pro/styled edition 분기 + 코드가 Pro 전용 필드를 세팅.
- 주석에 "limited"/"partial"/"best-effort" 가 있는데 검증 round-trip 이 없음.
- → 같은 signature 가 **2번째**로 나오면(예 다른 패키지에서 pinned-edition 기능 no-op 재발) **N=2 →
  즉시 `anti-patterns/AP-005` 로 승격** + 탐지 grep(코드가 외부 lib 의 edition-gated 필드 세팅 ↔
  round-trip 증거 부재) 카탈로그화. 그 전까지는 본 lesson(N=1).

## 연결
- [[AP-003]](stale-count-in-comment)·[[AP-004]](doc-source-signature-drift) 와 **친족**(주석↔실태 drift)이나
  축이 다름: AP-003/004 는 *문서↔소스 시그니처* drift, 본 건은 *코드↔외부 lib 런타임 동작* drift.
- [[C-003]](주석/README/JSDoc ↔ 코드 동기) 의 런타임 확장판.
- MASTER §5.2 **P25-1**.
