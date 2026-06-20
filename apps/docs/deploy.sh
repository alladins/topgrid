#!/usr/bin/env bash
# 원커맨드 문서사이트 배포. 리포 루트에서:  bash apps/docs/deploy.sh
#
# 인증 = topgrid 비밀번호(scp/ssh 가 프롬프트). root 불필요(topgrid 가 자기 파일 chmod).
# ★근본 해결은 서버 SFTP umask(-u 0022) — 그러면 이 스크립트의 정규화 단계도 불필요해진다.
#   (DEPLOY.md 「정규화 영구 제거」 참고.) 이 스크립트는 서버 설정 못 댈 때의 대안.
set -euo pipefail

HOST="${TOPGRID_HOST:-topgrid@49.247.14.212}"
ROOT="${TOPGRID_WEBROOT:-/var/www/topgrid}"
BUILD="apps/docs/build"

[ -d "$BUILD" ] || {
  echo "✗ $BUILD 없음 — 먼저 빌드: pnpm build && (cd apps/docs && pnpm build:site)" >&2
  exit 1
}

echo "→ 업로드 (scp → $HOST:$ROOT)…"
scp -r "$BUILD"/* "$HOST:$ROOT/"

echo "→ 권한 정규화 (topgrid, no root)…"
ssh "$HOST" "setfacl -Rb '$ROOT' 2>/dev/null || true; \
  find '$ROOT' -type d -exec chmod 755 {} + ; \
  find '$ROOT' -type f -exec chmod 644 {} + ; \
  restorecon -RF '$ROOT' 2>/dev/null || true"

echo "→ 검증…"
for p in getting-started charting nextjs-ssr storybook/ en/; do
  line="$(curl -sI "https://topgrid.platree.com/$p" | head -1 | tr -d '\r')"
  echo "  /$p → ${line:-no response}"
done
echo "✓ 완료"
