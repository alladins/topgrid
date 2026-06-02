---
id: LESS-002
signature: cross-package-react-major-split-blocks-dom-render
first_seen: MOD-GRID-18 (grid-pro-pivot) 2026-06
status: lesson (N=1) — N=2 시 C/AP 승격 검토
related: [PAT-001, "MASTER §5.2 P18-2", LESS-001]
---

# LESS-002 — workspace react 메이저 분리가 DOM 마운트 검증을 막는다

## 증상 (검증 가능 사실)
`grid-pro-pivot`(PAT-001 wrapper)을 `renderToStaticMarkup` 으로 DOM 마운트하려 하자
"Invalid hook call" 로 실패. 원인 규명:
- `require.resolve('react', {paths:['packages/grid-pro-pivot']})` → **react@18.3.1**
- `require.resolve('react', {paths:['packages/grid-core']})` → **react@19.2.6**
두 메이저가 모노레포에 동시 설치돼 있고, pivot 의 `useMemo`/`useLicenseStatus`(react18)와
pivot 이 합성하는 grid-core `<Grid>` 의 hooks(react19)가 **서로 다른 react 인스턴스**를 잡는다.
react-dom/server 를 19 로 맞춰도 pivot 자신이 18 을 잡으므로 해소되지 않는다.

## 왜 중요한가 (그리고 무엇이 아닌가)
- **제품 결함 아님**: 실제 소비자 앱은 단일 react 를 가진다(peer 1개). 이건 **검증 환경**의
  설치 불일치다.
- 그러나 dev-harness verify 의 "동작 검증(renderToStaticMarkup)" 단계는 **다른 workspace
  패키지를 합성하는 모듈**(PAT-001 wrapper 가 `<Grid>` 를 끌어쓰는 류)에서 이 벽에 막힌다.
  chart(MOD-19)는 grid-core 를 합성하지 않아(순수 SVG + grid-license 만) 단일 react 로
  마운트됐다 — 차이의 원인이 바로 cross-package 합성.

## 올바른 형 (how to apply)
다른 workspace 패키지(특히 grid-core)를 **합성**하는 모듈을 verify 할 때:
1. **고유 로직은 순수 실행**으로 전수 검증 — 변환/reducer/컬럼빌더/셀 렌더 함수를 React 없이
   직접 호출(피벗: computePivot·applyReducer·buildPivotColumns + `column.cell` 직접 호출로
   라벨·포맷 산출 확인). 이게 모듈 고유 출력의 대부분이다.
2. **셸의 react 동작은 동형 입증** — 워터마크/라이선스 게이트는 이미 실행검증된 동형 패턴
   (chart `RangeChartPanel`)으로, `<Grid>` 위임은 grid-core 소스로 확인.
3. **진짜 DOM 마운트가 꼭 필요하면** repo 의 react 메이저를 단일화(install 정렬)한 뒤 수행 —
   단 이는 lockfile 변경이므로 verify 범위 밖, 별도 작업으로 분리.

## 탐지 (환경 점검)
```
node -e "console.log(require.resolve('react',{paths:['packages/<mod>']}))"
node -e "console.log(require.resolve('react',{paths:['packages/grid-core']}))"
# 두 경로의 버전이 다르면 DOM 마운트 검증 불가 → 순수+소스 검증 경로 사용
```

## 출처
MOD-GRID-18 verify. spec `.claude/dev-harness/specs/MOD-GRID-18.md`,
`packages/grid-pro-pivot/src/PivotGrid.tsx`(grid-core `<Grid>` 합성). [[LESS-001]] 과 함께
"발행물·검증물 신뢰도" 군.
