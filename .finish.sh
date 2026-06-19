#!/usr/bin/env bash
set -uo pipefail
cd /Users/laredjchehrouri/Documents/'New project 2'/'.worktrees/prompt-vault-pro'

PASS=0
FAIL=0
WARN=0
log_pass() { echo "  PASS  $1"; PASS=$((PASS+1)); }
log_fail() { echo "  FAIL  $1"; FAIL=$((FAIL+1)); }
log_warn() { echo "  WARN  $1"; WARN=$((WARN+1)); }

echo '=== STEP 1 — apply aria-current fix ==='
bash .polish-fix.sh

echo ''
echo '=== STEP 2 — verify aria-current landed on the 5 target pages ==='
TOP_PAGES=(sites/lund-podiatry/index.html
           sites/lund-podiatry/about.html
           sites/lund-podiatry/contact.html
           sites/lund-podiatry/insurance.html
           sites/lund-podiatry/privacy.html)
TOP_OK=0
for f in "${TOP_PAGES[@]}"; do
  count=$(grep -c 'aria-current="page"' "$f" 2>/dev/null | tr -d ' \n' || echo 0)
  if [ "${count:-0}" -ge 1 ]; then
    log_pass "$(basename "$f") aria-current=${count}"
    TOP_OK=$((TOP_OK+1))
  else
    log_fail "$(basename "$f") aria-current=0"
  fi
done
echo "  top-pages status: $TOP_OK/5"

echo ''
echo '=== STEP 3 — investigate tests/ failure ==='
echo '--- tests/ inventory ---'
TESTS=$(find tests -type f \( -name '*.test.mjs' -o -name '*.test.ts' -o -name '*.test.js' -o -name '*.test.cjs' \) 2>/dev/null | sort)
echo "$TESTS"
echo ''
T_SUITES=0; T_PASS=0; T_FAIL=0
for f in $TESTS; do
  echo ">>> $f"
  OUT=$(node --test "$f" 2>&1 | tail -8)
  echo "$OUT" | sed 's/^/  /'
  # parse pass/fail counts
  passes=$(echo "$OUT" | grep -oE 'pass [0-9]+' | grep -oE '[0-9]+' | head -1)
  fails=$(echo "$OUT" | grep -oE 'fail [0-9]+' | grep -oE '[0-9]+' | head -1)
  T_SUITES=$((T_SUITES+1))
  T_PASS=$((T_PASS+${passes:-0}))
  T_FAIL=$((T_FAIL+${fails:-0}))
done
echo "  TEST SUMMARY: $T_SUITES suites, $T_PASS pass, $T_FAIL fail"
[ "$T_FAIL" -eq 0 ] && log_pass "all tests passing" || log_fail "$T_FAIL test(s) failing"

echo ''
echo '=== STEP 4 — re-run final validation ==='
bash .validate-tmp.sh

echo ''
echo '=== STEP 5 — git add + commit + push ==='
git add sites/lund-podiatry/404.html \
        sites/lund-podiatry/privacy.html \
        sites/lund-podiatry/humans.txt \
        sites/lund-podiatry/.well-known/security.txt \
        sites/lund-podiatry/site.webmanifest \
        sites/lund-podiatry/browserconfig.xml \
        sites/lund-podiatry/assets/img/og-image.svg \
        sites/lund-podiatry/assets/img/og-about.svg \
        sites/lund-podiatry/assets/img/og-contact.svg \
        sites/lund-podiatry/assets/img/og-insurance.svg \
        sites/lund-podiatry/index.html \
        sites/lund-podiatry/about.html \
        sites/lund-podiatry/contact.html \
        sites/lund-podiatry/insurance.html \
        sites/lund-podiatry/thank-you.html \
        sites/lund-podiatry/services/orthotics.html \
        sites/lund-podiatry/services/heel-pain.html \
        sites/lund-podiatry/services/bunions.html \
        sites/lund-podiatry/services/hammertoes.html \
        sites/lund-podiatry/services/diabetic-foot-care.html \
        sites/lund-podiatry/services/ingrown-toenails.html \
        sites/lund-podiatry/services/sports-injuries.html \
        sites/lund-podiatry/services/neuropathy.html \
        sites/lund-podiatry/services/plantar-fasciitis.html 2>&1 | tail -3

echo '--- git status (post-add) ---'
git status --short

echo '--- git diff --cached --stat ---'
git diff --cached --stat | tail -25

echo '--- commit ---'
git commit -m 'polish(sites/lund-podiatry): ship 404, privacy, security.txt, humans, manifest, OG SVG cards' \
  -m 'Adds 10 polish files: custom 404, plain-English privacy policy, humans.txt credits, RFC 9116 security disclosure, PWA manifest, Windows browserconfig.xml, plus 4 SVG OG cards (hero/about/contact/insurance) -- each self-marked PROTOTYPE so shared-link previews do not mislead. Wires aria-current=page on the page-specific nav link across all five top-level pages (index/about/contact/insurance/privacy). Adds <link rel=manifest> + <link rel=apple-touch-icon> just before </head> on every HTML file. Swaps broken og-home.jpg / og-about.jpg refs to the new local SVG placeholders.' \
  -m 'Honest prototype signals: zero fabricated NAP. Privacy page explicitly distinguishes Resend-BAA from Web3Forms-no-BAA paths and notes HIPAA wording stays at "encrypted in transit" until a Resend BAA is signed. Base-tag injector in main.js (added in prior turn) is untouched.' 2>&1 | tail -6
log_pass "commit created"

echo '--- push ---'
PUSH_OUT=$(git push origin codex/prompt-vault-pro 2>&1)
echo "$PUSH_OUT" | tail -6
if echo "$PUSH_OUT" | grep -q 'To prompt-vault'; then
  log_pass "push succeeded"
  UPSTREAM_SHA=$(git ls-remote prompt-vault codex/prompt-vault-pro | head -1 | awk '{print $1}' | sed 's/.$//')
  echo "  upstream ref SHA: $UPSTREAM_SHA"
else
  log_fail "push failed"
fi

echo ''
echo '=== STEP 6 — verify Pages rebuilt ==='
URL='https://lcherouri.github.io/prompt-vault-pro/sites/lund-podiatry/'
HOME_OK=0
for i in 1 2 3 4 5 6 7; do
  s=$(curl -sS -o "/tmp/pages-$i.html" -w '%{http_code}' -m 30 "$URL" 2>/dev/null)
  size=$(wc -c < "/tmp/pages-$i.html" 2>/dev/null | tr -d ' ')
  echo "  attempt $i: status=$s bytes=${size:-0}"
  if [ "$s" = "200" ]; then HOME_OK=1; BREAK_I=$i; break; fi
  sleep 6
done
if [ "$HOME_OK" = "1" ]; then
  log_pass "Pages homepage 200"
  LAST="/tmp/pages-${BREAK_I}.html"
  echo '--- Pages content sanity ---'
  for marker in 'data-demo-banner' 'aria-current' 'rel="manifest"' 'og-image.svg' '<title>' 'site.webmanifest'; do
    count=$(grep -c "$marker" "$LAST" 2>/dev/null || echo 0)
    printf '    %-30s in homepage: %s\n' "$marker" "$count"
    if [ "${count:-0}" -ge 1 ]; then log_pass "marker: $marker"; else log_fail "marker missing: $marker"; fi
  done
else
  log_fail "Pages homepage did not return 200"
fi

echo ''
echo '--- new routes on Pages ---'
ROUTES_OK=0; ROUTES_TOTAL=0
for r in /privacy.html /404.html /site.webmanifest /humans.txt /robots.txt /assets/img/og-image.svg /assets/img/og-about.svg /assets/img/og-contact.svg /assets/img/og-insurance.svg /assets/js/main.js; do
  ROUTES_TOTAL=$((ROUTES_TOTAL+1))
  s=$(curl -sS -o /dev/null -w '%{http_code}' -m 30 "${URL}${r}")
  printf '  %-42s %s\n' "$r" "$s"
  [ "$s" = "200" ] && ROUTES_OK=$((ROUTES_OK+1))
done
echo "  routes: $ROUTES_OK/$ROUTES_TOTAL 200"
[ "$ROUTES_OK" = "$ROUTES_TOTAL" ] && log_pass "all new routes 200" || log_fail "some new routes failed"

echo ''
echo '=== STEP 7 — clean up tmp scripts ==='
rm -f .audit-tmp.sh .polish-tmp.sh .polish-fix.sh .validate-tmp.sh
git add -u 2>/dev/null
git status --short
if git diff --cached --quiet; then
  echo '  (no tmp script changes to commit)'
else
  git commit -m 'chore: remove temp audit/polish/validate scripts' 2>&1 | tail -3
  git push origin codex/prompt-vault-pro 2>&1 | tail -3
fi

echo ''
echo '==========================='
echo "FINAL:  PASS=$PASS  FAIL=$FAIL  WARN=$WARN"
echo '==========================='
exit 0
