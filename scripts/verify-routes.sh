#!/usr/bin/env bash
# Route and authorisation smoke test.
#
# Two questions only, asked of a running server:
#   1. does the route serve at all?
#   2. does an unauthenticated request get turned away rather than served?
#
# A protected route that returns 200 to a stranger is the single worst bug this
# product could ship, so it is checked from outside the application rather than
# by asking the application about itself.
BASE="${1:-http://localhost:3000}"
pass=0; fail=0

expect() { # path  expected-codes  label
  local path="$1" want="$2" label="$3"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 25 "$BASE$path")
  if [[ " $want " == *" $code "* ]]; then
    printf "  [  ok  ] %-44s %s\n" "$label" "$code"; pass=$((pass+1))
  else
    printf "  [ FAIL ] %-44s got %s, wanted one of: %s\n" "$label" "$code" "$want"; fail=$((fail+1))
  fi
}

echo ""
echo "PUBLIC — should serve"
expect "/"                       "200" "marketing home"
expect "/login"                  "200" "login"
expect "/apply"                  "200" "application form"

echo ""
echo "PROTECTED — an anonymous request must be turned away"
for p in /admin /admin/research /admin/research/calibration /admin/clients /admin/prospects \
         /admin/acquisition /admin/metrics /admin/sops /admin/queue /admin/applications; do
  expect "$p" "302 307 401 403 404" "anon $p"
done
for p in /app /app/northbeam /app/northbeam/learning /app/northbeam/performance \
         /app/northbeam/reports /app/northbeam/create /app/northbeam/production \
         /app/northbeam/distribution /app/northbeam/pipeline /app/northbeam/settings \
         /app/northbeam/intelligence /app/northbeam/library /app/northbeam/approvals; do
  expect "$p" "302 307 401 403 404" "anon $p"
done

echo ""
echo "CROSS-TENANT — an anonymous request to another workspace"
expect "/app/lumenpath"          "302 307 401 403 404" "anon /app/lumenpath"

echo ""
echo "NOT FOUND — a workspace that does not exist"
expect "/app/does-not-exist"     "302 307 404" "unknown workspace"

echo ""
echo "TRACKED REDIRECT — unknown slug must not 200"
expect "/t/definitely-not-a-real-slug" "302 307 404" "unknown tracked link"

echo ""
printf -- "----------------------------------------------------------------------\n"
printf "PASS %s   FAIL %s\n" "$pass" "$fail"
printf -- "----------------------------------------------------------------------\n"
[[ $fail -eq 0 ]]
