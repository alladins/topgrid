#!/usr/bin/env bash
# topgrid.platree.com 방문 분석 리포트 — nginx 전용 로그(topgrid.access_ssl.log) 기반.
# 사용: bash apps/docs/stats.sh          (키리스 SSH: topgrid@49.247.14.212)
# 봇(AI 크롤러·검색봇·curl 등) 제외한 사람 트래픽 중심. 정적자원 제외 = 페이지뷰.
# 주의: 자체 배포/검증 트래픽 일부 포함될 수 있음(curl·HeadlessChrome 은 봇으로 필터됨).
set -euo pipefail
HOST="${TOPGRID_HOST:-topgrid@49.247.14.212}"

cat <<'SCRIPT' | ssh -o BatchMode=yes -o ConnectTimeout=15 "$HOST" bash -s
# 소유자 IP(사무실 183.100.140.45 · 집 162.120.184.41)는 전 지표에서 제외(자기 트래픽).
LOGS() { { zcat /var/log/nginx/topgrid.access_ssl.log-*.gz 2>/dev/null; cat /var/log/nginx/topgrid.access_ssl.log 2>/dev/null; } | grep -vE '^(183\.100\.140\.45|162\.120\.184\.41) '; }
BOT='[Bb]ot|[Cc]rawl|[Ss]pider|Slurp|GPT|OAI-|Amazonbot|PetalBot|Semrush|Ahrefs|MJ12|DotBot|Bytespider|python|curl|wget|Go-http|zgrab|censys|masscan|HeadlessChrome|Scrapy|facebookexternal|Applebot|ClaudeBot|PerplexityBot|meta-external'

echo "========== topgrid.platree.com 방문 리포트 =========="
LOGS | awk 'NR==1{print "기간 시작:",$4} END{print "기간 끝:  ",$4, "| 총 요청:", NR}'
LOGS | awk -v b="$BOT" '{ua=""; for(i=12;i<=NF;i++) ua=ua" "$i; if (ua ~ b) bot++; else hum++} END{print "사람 요청:", hum, "| 봇 요청:", bot}'
printf "사람 고유 IP(전체): "
LOGS | awk -v b="$BOT" '{ua=""; for(i=12;i<=NF;i++) ua=ua" "$i; if (ua !~ b) print $1}' | sort -u | wc -l

echo ""; echo "--- 일자별 사람 고유 IP (최근 14일) ---"
LOGS | awk -v b="$BOT" '{ua=""; for(i=12;i<=NF;i++) ua=ua" "$i; if (ua !~ b) {d=substr($4,2,11); print d, $1}}' | sort -u | awk '{c[$1]++} END{for(d in c) print d, c[d]}' | sort -t/ -k3n -k2M -k1n | tail -14

echo ""; echo "--- 사람 페이지뷰 TOP 15 ---"
LOGS | awk -v b="$BOT" '{ua=""; for(i=12;i<=NF;i++) ua=ua" "$i; if (ua !~ b && $9 ~ /^(200|304)$/) print $7}' | grep -vE '\.(js|css|png|jpg|svg|woff2?|ico|map|json|txt|xml)([?"]|$)' | sed 's/\?.*//' | sort | uniq -c | sort -rn | head -15

echo ""; echo "--- /pricing 조회(사람, 최근 10) ---"
LOGS | awk -v b="$BOT" '{ua=""; for(i=12;i<=NF;i++) ua=ua" "$i; if (ua !~ b && $7 ~ /pricing/) print $4, $1, $7}' | tail -10

echo ""; echo "--- 외부 유입 리퍼러 TOP 10 ---"
LOGS | awk -v b="$BOT" '{ua=""; for(i=12;i<=NF;i++) ua=ua" "$i; if (ua !~ b) print $11}' | grep -vE 'topgrid|^"-"$' | sort | uniq -c | sort -rn | head -10

echo ""; echo "--- AI/검색 봇 인덱싱 TOP 8 ---"
LOGS | awk -v b="$BOT" '{ua=""; for(i=12;i<=NF;i++) ua=ua" "$i; if (ua ~ b) print ua}' | grep -oE '(Googlebot|bingbot|GPTBot|OAI-SearchBot|ClaudeBot|PerplexityBot|Amazonbot|PetalBot|Bytespider|SemrushBot|AhrefsBot|Applebot|meta-externalagent)' | sort | uniq -c | sort -rn | head -8
SCRIPT
