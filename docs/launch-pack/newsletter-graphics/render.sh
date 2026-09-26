#!/bin/sh
# Renders render/*.html to export/ with headless Chrome (own profile, no debugging port).
# 1200x1500 = web/email export (display at 600 px wide); 1080x1350 = LinkedIn/mobile.
cd "$(dirname "$0")"
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
PROFILE="$(pwd)/.chrome-render-profile"
DIR="$(cygpath -m "$(pwd)" 2>/dev/null || pwd)"
mkdir -p export
for f in render/*.html; do
  n=$(basename "$f" .html)
  for size in 1200,1500 1080,1350; do
    w=${size%,*}
    "$CHROME" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$PROFILE" \
      --window-size=$size --virtual-time-budget=8000 --run-all-compositor-stages-before-draw \
      --screenshot="$DIR/export/$n-$w.png" "file:///$DIR/$f" >/dev/null 2>&1
  done
done
if [ -f contact-sheet.html ]; then
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$PROFILE" \
    --window-size=2260,860 --virtual-time-budget=8000 --screenshot="$DIR/contact-sheet.png" "file:///$DIR/contact-sheet.html" >/dev/null 2>&1
fi
rm -rf "$PROFILE"
ls export
