#!/usr/bin/env bash
# Regenerate lightweight muted loop MP4s from GIFs (Phase 1 AR). Requires ffmpeg.
set -euo pipefail
DIR="$(cd "$(dirname "$0")/../frontend/media" && pwd)"
cd "$DIR"
echo "Converting PEPETHUGLIFE.gif -> PEPETHUGLIFE-loop.mp4"
ffmpeg -y -i PEPETHUGLIFE.gif -movflags +faststart -an -pix_fmt yuv420p -vf "scale=400:-2" PEPETHUGLIFE-loop.mp4
echo "Converting SHADILAYTHUG.gif -> SHADILAYTHUG-loop.mp4"
ffmpeg -y -i SHADILAYTHUG.gif -movflags +faststart -an -pix_fmt yuv420p -vf "scale=400:-2" SHADILAYTHUG-loop.mp4
echo "Done."
