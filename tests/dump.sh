#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(dirname "$0")/.."

source tests/_inc/download_tools.sh >/dev/null
source tests/_inc/run_services.sh >/dev/null

download_tools
dump_schema $@
go run $PROJECT_DIR/tests/util/dump/dump.go $@
