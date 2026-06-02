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

## 올바른 형 (how to apply) — 도구를 분리하라
**핵심 교정**: node `renderToStaticMarkup` 은 grid-core 합성 컴포넌트에 **틀린 도구**다(chart 는
grid-core 무합성이라 단일 react 로 됐을 뿐). 마운트는 **lockfile 정렬이 아니라 번들러 단일-react
하네스**로 한다.
1. **순수 로직 → node 직접 실행**: 변환/reducer/컬럼빌더/`column.cell` 등 React 무관 함수를 직접
   호출(모듈 고유 출력의 대부분). 측정/렌더 등 host 능력은 PAT-005 로 주입해 순수화.
2. **컴포넌트 마운트 → storybook/visual 하네스**: 이 repo 의 `apps/docs` storybook(`@storybook/
   react-vite`, **단일 react 18.3.1**)이 vite dedupe 로 18/19 split 을 우회한다. 기존 Pro 그리드
   (merging/range/master) 스토리가 이 경로로 `<Grid>` 합성을 렌더 중. → 합성 컴포넌트마다
   `packages/<pkg>/stories/*.stories.tsx` 1개 추가 후 storybook 빌드/visual:test 로 실제 마운트.
   (피벗: `packages/grid-pro-pivot/stories/PivotGrid.stories.tsx`.)
3. **이 마운트는 게이트다**: grid-core 합성 컴포넌트(피벗·MOD-21 panel·24·26)는 **발행/‘done’ 선언
   전 storybook 마운트 1회 필수**. 위임 패턴(column groups + `__kind` 합성행 + `rowClassName`)이
   한 번도 브라우저에서 안 돌았다면 결함을 N 모듈 뒤에 발견하게 된다.
4. lockfile 단일화(react 정렬)는 **불필요**(번들러가 해결) — 시도 금지.

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
