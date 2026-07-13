# 30일 평가키 완전 자동 발급 — 전용 서명키 격리 설계 (TRIAL-AUTOISSUE)

> 작성 2026-07-14. 목표: 신규 도입 검토자가 **폼에서 즉시** 30일 Pro 평가키를 받게 한다(저마찰).
> 제약(사용자 요구): **유료(정품) 개인키는 서버에 올리지 않는다.** 위조돼도 손해가 작은 값만 서버 서명.

## 1. 핵심 아이디어 — 이중 키 + 30일 창(window) 상한

유료 개인키와 **별개의 "평가판 전용 키페어"** 를 만들어 **평가판 키만 서버에 탑재**한다.
라이브러리는 평가판 키로 서명된 라이선스를 **만료가 지금+상한(≈35일) 이내일 때만** 유효로 인정한다.

→ 평가판 키가 유출돼도 공격자는 **자동 소멸하는 ≤35일 전체기능 체험판**만 위조 가능(유료 위조 불가).
   복구 = 평가판 핀키만 교체(재발행). **유료 라이선스는 무영향.**

## 2. 보안 모델 (blast-radius)

| 키 | 위치 | 서명 가능 범위 | 유출 시 피해 | 복구 |
|---|---|---|---|---|
| 유료(main) | 로컬 `.private.key` (오프라인) | 모든 도메인·기간·tier | (탑재 안 하므로 노출면 없음) | — |
| 평가판(trial) | **서버** `~/topgrid-admin/trial-signing.key`(600) | ≤35일 자동소멸 키만 유효 | 임의 도메인 ≤35일 체험판 위조(저가치·자동소멸) | trial 핀키만 교체·재발행 |

- 체험판의 가치: 낮음 — 키 없이도 Pro는 **워터마크만** 뜨고 전부 동작. 체험판은 35일 워터마크 제거일 뿐.
- 서버 완전 장악 시나리오에서도 유료 라이선스 위조 불가(main 키 부재).

## 3. 검증 규칙 (verifySignature 변경 — additive, 공개 API 불변)

```
sig 를 PINNED_PUBLIC_KEY(main)로 검증:
  OK  → 기존 경로(만료 + 도메인 체크). 상한 없음(유료는 1년 등).
  실패 → PINNED_TRIAL_PUBLIC_KEY(trial)로 재검증:
           OK  → ★window 상한 강제: payload.expiresAt ≤ now + TRIAL_MAX_WINDOW(35일) 여야 함.
                  초과 → invalid(위조 시도 차단). 통과 → 만료 + 도메인 체크(기존과 동일).
           실패 → invalid.
```

- `tier` 는 검증에 사용 안 함(기존과 동일) — 체험판도 `tier:'pro'` 로 전 기능 동작.
- 반환 타입(`LicenseStatus`) 불변. `setLicenseKey`/`checkLicense` 불변.
- 상한 35일 = 30일 약속 + 시계 오차 여유. 유출 blast-radius 를 35일로 bound.

## 4. CLI 변경 (`scripts/license/license.mjs`)

- `keygen --trial` → 평가판 키페어 생성. 공개키(핀용) 출력 + 개인키 `.trial-private.key`(gitignore) 저장.
- `sign --trial` → `.trial-private.key` 로 서명. `--expires` 미지정 시 `+30d`, tier `pro`, kind `trial`.
  (35일 초과 `--expires` 는 경고 후 거부 — 라이브러리가 어차피 무효 처리.)
- 대장(ledger.csv) kind=trial 로 기록(기존 흐름 재사용).
- ★평가판 개인키도 **서버 배포 대상**(발급 엔드포인트용). `.private.key`(유료)는 배포 금지 유지.

## 5. 서버 자동 발급 엔드포인트 (`admin-server.mjs`)

`POST /api/request-trial` (공개, 의존성 0 Node webcrypto 로 Ed25519 서명):
- 입력: `{ email, domain, company?, website(honeypot) }`.
- 가드: honeypot + IP 레이트리밋(기존 `rateOk` 재사용) + **도메인당 30일 1회**(trials.jsonl 조회).
- 도메인 형식 검증(FQDN) · 이메일 형식 검증.
- 서명: `~/topgrid-admin/trial-signing.key`(평가판 개인키, 600) 로 30일 키 발급.
- 기록: `data/trials.jsonl`(도메인·이메일·발급시각·키) + 문의처럼 저장 + **Slack 알림**(신규 리드!).
- 응답: `{ ok, key, expiresAt, domain }`.

## 6. 프론트 (`pricing.tsx` — 평가 폼)

- 문의 유형 `trial` + 도메인 입력 시 → `/api/request-trial` 호출 → **키를 화면에 즉시 표시**
  (`setLicenseKey('…')` 스니펫 + 복사 버튼 + 만료일). 저마찰 완성.
- 도메인 미입력/실패 → 기존 문의 폼 폴백(수동 발급).

## 7. 롤아웃 & 발행

| 단계 | 내용 | 발행/배포 |
|---|---|---|
| P1 | grid-license-core: trial 핀키 + window 상한. CLI keygen/sign --trial. 셀프테스트/유닛. | **grid-license-core 재발행(게이트)** |
| P2 | 서버 엔드포인트 + trial 개인키 배포 + 프론트 auto-issue + 문서. | 서버·문서 배포(자율) |

- ★**의존성**: 평가판 키는 **고객 앱의 grid-license-core 가 신버전(trial 핀키 포함)일 때만** 검증됨.
  신규 검토자는 최신 설치 → 정상. 기존 유료 고객(구버전)은 무관(유료 키는 main 서명이라 계속 유효).
- grid-license-core 는 grid-core lockstep 과 별개로 독립 발행 가능(2026-07-03 0.2.0 선례). dependents
  (grid-license·pro)는 공개 API 불변이라 재배선 불필요(다음 각자 release 시 신버전 흡수).

## 8. 결정 필요 사항 (기본값 제안)

1. **window 상한** = 35일(권장). 더 짧게(31) = 시계오차 위험, 더 길게 = blast-radius 증가.
2. **이메일 검증** — 기본 미적용(체험판=저가치, 레이트리밋+도메인1회로 충분). 필요 시 1회성 코드 발송(별途).
3. **도메인당 1회/30일** 제한 적용(권장) — 남용 방지.
4. **평가판 키 서버 탑재 승인** — 유료 키가 아닌 전용 저가치 키만. (사용자 요구와 합치)
