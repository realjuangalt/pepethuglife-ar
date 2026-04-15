Add your media here.

targets.mind
------------
Compile your printed reference image(s) into ONE file; order must match
targetIndex in ../config.js (0 = first image in the MindAR compiler).

Tool: https://hiukim.github.io/mind-ar-js-doc/tools/compile

Phase 1 — Lightweight loops (autoplay muted when marker is seen)
-----------------------------------------------------------------
- PEPETHUGLIFE-loop.mp4 — small muted loop (often generated from a GIF).
  Regenerate: ../scripts/convert-gif-loops.sh (requires ffmpeg).

Why not project .gif directly?
- The AR plane uses <video>; animated GIFs in <img>/<a-image> usually show only the first frame in WebGL.
- MP4 loops are small and buffer quickly on GitHub Pages.

Phase 2 — Full song (user taps “Full song”; large files load on demand)
-----------------------------------------------------------------------
- Large MP4s are NOT preloaded; playback starts after enough buffering (see browser “canplay”).
- HLS/DASH would be a future improvement for very large files on slow networks.

Optional separate soundtrack
----------------------------
Use AR_CONFIG.markers[].full or split A/V in config if you add separate audio.
