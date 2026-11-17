#!/bin/bash
# Real touches in Mobile Safari on the iOS Simulator (XCUITest).
#
# Needs Xcode, xcodegen (brew install xcodegen) and npm ci. Builds the page,
# records the expected text of every scenario step in Chromium
# (expected.mjs), serves build/ on localhost, generates the Xcode project
# and runs the tests on a simulator. SIM picks the simulator (default:
# "iPhone 17 Pro"); PORT the local server's port (default 8765).
set -euo pipefail

cd "$(dirname "$0")"
ROOT="$(cd .. && pwd)"
SIM="${SIM:-iPhone 17 Pro}"
PORT="${PORT:-8765}"

"$ROOT/build.sh"
node expected.mjs "$ROOT" UITests/expected.json

python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT/build" >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER' EXIT

xcodegen generate --quiet
rm -rf build/TouchTests.xcresult
TEST_RUNNER_PAGE_URL="http://127.0.0.1:$PORT/meter-rhythm.html" \
xcodebuild test \
    -project MeterRhythmIOS.xcodeproj -scheme UITests \
    -destination "platform=iOS Simulator,name=$SIM" \
    -derivedDataPath build/DerivedData \
    -resultBundlePath build/TouchTests.xcresult \
    | grep -E "Test Case .*(passed|failed)|error:|\*\* TEST"

echo "Screenshots of every step: open ios-tests/build/TouchTests.xcresult"
