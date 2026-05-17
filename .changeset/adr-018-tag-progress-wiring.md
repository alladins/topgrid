---
"@tomis/grid-core": minor
"@tomis/grid-renderers": minor
---

ADR-018: registry slot 정책 — tag / progress 슬롯 wiring + TomisColumnType union 확장.

- grid-core: TomisColumnType union 에 'tag', 'progress' 추가 (additive — backward-compat).
  defaultRendererRegistry 에 2 placeholder entries 추가 (graceful fallback).
- grid-renderers: wireRegistry 에 TagCell / ProgressCell 어댑터 2건 추가 (6 → 8 wired slots).
  size-limit 10 KB → 12 KB (ADR-018 S-A).
- button / avatar / icon 은 registry 외 처리 정책 (구조적 차단 — required non-value prop).
  README "Action / Avatar Column Pattern" 섹션 추가 (ADR-018 D-3 X-B).
- aliases statusBadge / check 은 grid-renderers Record 에서 status quo (ADR-018 D-4 A-A).
