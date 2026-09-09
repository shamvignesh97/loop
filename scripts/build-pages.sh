#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export VITE_BASE="${VITE_BASE:-/loop/}"
npm run build
