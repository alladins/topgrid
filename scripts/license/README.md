# topgrid 라이선스 발급 (vendor 전용)

Pro 패키지용 라이선스 키를 발급하는 내부 운영 도구. Ed25519 서명, **도메인 락 + 만료 내장**.
검증은 `@topgrid/grid-license-core`(`verifySignature`)가 **라이브러리에 핀된 공개키**로 수행하므로,
대응하는 개인키로 서명한 키만 유효하다(자가서명 위조 차단).

## 키 형식

```
<서명 base64url>.<페이로드 base64url>
```
- 페이로드(JSON): `{ "domain": "<운영 도메인>", "expiresAt": <Unix ms>, "tier": "pro" }`
- 서명: 페이로드 JSON 바이트를 vendor 개인키로 Ed25519 서명
- 공개키는 키에 넣지 않는다 — `packages/grid-license-core/src/verifySignature.ts`의 `PINNED_PUBLIC_KEY`에 핀.

## 최초 1회 셋업 (키페어)

```bash
node scripts/license/license.mjs keygen
```
- **공개키** → `verifySignature.ts`의 `PINNED_PUBLIC_KEY` 상수에 붙여넣고 grid-license-core 재발행.
- **개인키** → `scripts/license/.private.key`(자동 저장, `.gitignore`됨) + 오프라인 백업. **절대 커밋/유출 금지.**

> ⚠️ 개인키가 유출되면 누구나 유효 키를 위조할 수 있다. 유출 시 keygen으로 키페어를 교체하고
> 핀 값을 갱신한 뒤 재발행하면 기존(유출된 개인키 기반) 키는 전부 무효가 된다.

## 라이선스 발급

```bash
# 1년 유효, 운영 도메인 1개
node scripts/license/license.mjs sign --domain shipmg.example.com --expires +1y --tier pro

# 평가판(30일)
node scripts/license/license.mjs sign --domain poc.example.com --expires +30d --tier pro

# 특정 만료일(ISO8601)
node scripts/license/license.mjs sign --domain app.example.com --expires 2027-12-31
```
- `--expires`: `+Nd` / `+Nm` / `+Ny` (발급 시점 기준) 또는 ISO8601.
- **1키 = 도메인 1개.** dev·운영 등 도메인이 여러 개면 각각 발급. (localhost·127.0.0.1은 검증 예외 = 개발 편의.)
- 개인키 위치: `--key <file>` > env `TOPGRID_LICENSE_PRIVATE_KEY` > `scripts/license/.private.key`.

## 고객 적용

```ts
// 앱 entry(main.tsx / App.tsx / Nuxt client plugin)에서 1회
import { setLicenseKey } from '@topgrid/grid-license'; // React
// 또는 '@topgrid/grid-license-core' (Vue/Nuxt·프레임워크 무관)
setLicenseKey('<발급받은 키>');
```
검증은 런타임(브라우저). 무효/만료/도메인불일치 시 Pro 그리드에 워터마크(기능은 동작). SSR/SSG 정적 빌드 안전(window 없으면 도메인 검사 skip).

## 키 내용 확인 / 셀프테스트

```bash
node scripts/license/license.mjs inspect <key>        # 페이로드 디코드(서명검증 X)
pnpm --filter @topgrid/grid-license-core build
node scripts/license/selftest.mjs                     # 발급→검증·위조차단 회귀 테스트
```
