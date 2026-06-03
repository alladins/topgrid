---
id: LESS-005
title: reuse-gate 가 '재사용할 seam 없음' 을 반환하면 — host 수정이 아니라 최소 자립 primitive
signature: reuse-gate-no-seam-build-minimal-primitive
status: lesson(N=1)
first_seen: MOD-GRID-23 G-2 (grid-pro-edit-plus undo/redo)
links: [PAT-006, LESS-003, "MASTER §5.2 P23-1"]
---

## 교훈
reuse-gate(인벤토리)는 두 가지를 반환할 수 있다:
1. **재사용 가능한 계약 발견** → 그 위에 컴파일([[PAT-006]] declarative-rules-to-existing-contract).
2. **seam 없음**(host 가 필요한 표면을 노출 안 함) → **host 의 *공개* 표면 위에 최소 자립 primitive**
   를 짓고 충실히 안 되는 부분은 **문서화된 한계**로 남긴다. **host 패키지를 수정하지 않는다.**

(2)를 무시하고 host 를 고치면 = *발행된 패키지를 Goal 중간에 인프라 변경* = 루프가 막으려는 scope
escalation(컬럼-가상화 류). "helper 인 줄 알았는데 인프라" 신호다.

## 최초 발견 (MOD-GRID-23 G-2, undo/redo)
`grid-pro-edit-plus` undo/redo 의 reuse-gate 가 `grid-pro-tracking` 인벤토리:
- **seam 없음**(검증 가능 사실): tracking 은 닫힌 reducer — 연산 히스토리·redo·상태복원 표면 0.
  `undoRow(key)` 는 *마운트 스냅샷* 복원(단계별 아님), `resetChanges` 는 전부-아니면-전무.
  reducer/Action 은 비-export.
- 충실한 다단계 undo/redo+redo 는 tracking 의 공개 표면만으론 불가 →
  - **Option A**(tracking 위 외부 op-log + 역산): `addRow` redo 가 새 UUID 발급(키 깨짐), edited 행
    delete 의 충실 복원 불가 → host 에 새 seam 필요 = **거부**(scope escalation).
  - **Option B**(채택, advisor): **제네릭 command 스택**(`useUndoRedo` + `{undo,redo}` 명령) +
    충실히 되는 연산만 바인딩(`makeUpdateCommand`=이전값 포착, `makeAddCommand`=redo 시 포착키 강제
    재주입). **tracking 0 수정.** node 14/14(push가 redo 비움 / add-redo 키재사용 / update-undo
    이전값 복원 / 통합 왕복).

## 처방 (how to apply)
- reuse-gate 결과를 정직히 분류: "계약 위 컴파일(PAT-006)" vs "seam 없음(본 lesson)".
- seam 없음 → host 공개 mutator 위 최소 primitive. **host 수정 욕구 = 중단 신호**(별도 host-seam
  task 로 분리). MOD-23 G-2 는 tracking 을 한 줄도 안 고쳤다.
- 충실 불가 경계는 **명시 문서화**(JSDoc/README + §5.2). 본 건: **편집된 기존 행의 delete 는 충실
  undo 불가**(tracking `undoRow` 가 마운트 스냅샷 복원 → 세션 편집 손실). → §5.2 **P23-1**.

## 신호 (다음에 같은 모양)
- 신기능 구현 중 "이 host 패키지에 메서드/상태 하나만 추가하면…" 생각이 들면 = seam 없음 확정 →
  본 lesson 적용(primitive + 문서화), host 수정은 별도 task. N=2 재발 시 C- 승격 검토(예 "Goal 중
  타 패키지 public 표면 수정 금지").

## 연결
- [[PAT-006]] 의 **음화**(positive=계약 있음→컴파일 / 본 건=계약 없음→primitive). 둘 다 reuse-gate
  ([[LESS-003]]) 출력의 분기.
- MASTER §5.2 **P23-1**(delete-of-edited 한계).
