Add your media here.

Two-track AR (see config.js)
----------------------------
- targets.mind — Compile BOTH printed reference images in ONE file (order = targetIndex 0, 1).
  Tool: https://hiukim.github.io/mind-ar-js-doc/tools/compile
  Example order: PEPETHUGLIFE-target-image.png first, SHADILAYTHUG-target-image.jpg second.

Phase 1 — Lightweight loops (autoplay muted when marker is seen)
-----------------------------------------------------------------
- PEPETHUGLIFE-loop.mp4, SHADILAYTHUG-loop.mp4 — generated from the GIFs (soundless, small).
  Regenerate: ../../scripts/convert-gif-loops.sh (requires ffmpeg).

Why not project .gif directly?
- The AR plane uses <video>; animated GIFs in <img>/<a-image> usually show only the first frame in WebGL.
- MP4 loops are small and buffer quickly on GitHub Pages.

Phase 2 — Full song (user taps “Full song”; large files load on demand)
-----------------------------------------------------------------------
- Large MP4s are NOT preloaded; playback starts after enough buffering (see browser “canplay”).
- True adaptive streaming (HLS/DASH) would be a future improvement for 30MB+ files on slow networks.

Optional separate soundtrack
----------------------------
Set AR_CONFIG.markers[].full or use legacy pattern in config for per-clip audio if you split A/V.
