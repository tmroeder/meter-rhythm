#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -x node_modules/.bin/esbuild ]; then
    echo "Run npm ci first." >&2
    exit 1
fi

echo "Type-checking..."
node_modules/.bin/tsc

echo "Bundling..."
# src/main.ts and the modules it imports, as one script that the page loads
# from beside it.
node_modules/.bin/esbuild src/main.ts --bundle --format=iife --target=es2020 \
    --log-level=warning --outfile=build/app.js
cp src/template.html build/meter-rhythm.html

echo "Built: build/meter-rhythm.html and build/app.js"
