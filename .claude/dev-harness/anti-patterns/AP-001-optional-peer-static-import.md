---
id: AP-001
signature: optional-peer-static-import
title: optional peer 를 정적 import + 무조건 호출
severity: 동작 영향(high) — 미설치 환경에서 모듈 로드 실패
first_seen: grid-pro-merging (2026-06), grid-pro-agg (2026-06, 감사가 처음 놓침)
related: PAT-004 (올바른 형), C-001
---

## 증상
`package.json` 이 어떤 peer 를 `peerDependenciesMeta.<pkg>.optional: true` 로 선언했는데,
소스가 그 패키지를 **정적 top-level `import`** 하고 **무조건 호출**한다. 결과: 소비자가 그
optional peer 를 설치하지 않으면, 기능을 `enable…=false` 로 꺼도 **번들/모듈 로드 단계에서
import 해소 실패**(빌드 또는 런타임 에러). "optional" 계약("미설치 시에도 기본 동작") 위반.

## 실제 사례 (2회 — 이 AP의 존재 이유)
- `grid-pro-merging/src/MergingGrid.tsx:9` — `import { useVirtualizer } from '@tanstack/react-virtual'` + L97 무조건 호출.
- `grid-pro-agg/src/AggregationGrid.tsx:37` — 동일 패턴, **감사(MASTER §5.2)가 처음 놓쳤다가** ①+② 정리 중 발견.
→ 같은 실수가 두 번. 이 AP + verify 전수대조가 있었으면 agg 를 **선제 검출**했을 것. (이 하네스의 동기)

## 탐지 (verify 가 신규 코드에 실행)
1. `package.json` 의 `peerDependenciesMeta.*.optional:true` 목록을 추출.
2. `src/**` 에서 그 패키지를 **top-level `import`** 하는지 grep: `^\s*import .* from '<optional-peer>'`.
3. 매치 + 그 import 가 조건부(동적 import/lazy)가 아니면 → **AP-001 위반**.

## 올바른 형 → [[PAT-004]] (optional-peer-dynamic-import)
- (A) 가상화 본문을 별도 컴포넌트로 분리해 `enable…` 일 때만 `React.lazy`/`import()` 동적 로드, **또는**
- (B) 그 peer 를 **required 로 선언**(코드가 정말 무조건 쓰면 manifest 를 동작에 정합 — 우리가 merging/agg 에 적용한 안전책).
- 선택 기준: 기능이 진짜 opt-in 이면 A(진짜 optional), 코어 경로면 B.
