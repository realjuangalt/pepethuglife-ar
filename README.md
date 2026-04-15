# pepethuglife-static-ar

**Goal:** a **fully static** marker-based AR page on **GitHub Pages** — HTML, JS, and media only. No server, no backend, no AI pipeline in production.

Point a phone camera at a **printed target image**; MindAR tracks it and a **short loop MP4** is projected on the card. A **full-length** MP4 loads in the background; a subtle loader appears until it is ready to play. **Unmuted audio** usually needs one tap (“Tap to enable sound”) because browsers block autoplay with sound until there is a user gesture.

## GitHub Pages (this repo layout)

The site lives at the **repository root** (`index.html`, `config.js`, `lib/`, `media/`).

**Settings → Pages:** branch **`main`**, folder **`/` (root)**.

- **Site entry:** `/` → `index.html` (AR experience; camera permission + tracking).
- **Alternate URL:** `/ar.html` redirects to `/` (bookmarks).

Custom domain: keep **`CNAME`** at the repo root (e.g. `www.pepethuglife.lol`). **``.nojekyll`** is included so GitHub Pages does not run Jekyll on these files.

## What’s in the tree

| Path | Role |
|------|------|
| `index.html` | A-Frame + MindAR scene (main entry) |
| `ar.html` | Redirect to `/` |
| `config.js` | `AR_CONFIG`: marker file, per-target loop + full video paths |
| `ar-app.js` | Track found/lost, loop vs full playback |
| `lib/` | Vendored A-Frame + MindAR |
| `media/` | MP4s, source art (`targets.mind` lives at repo root) |
| `scripts/convert-gif-loops.sh` | Optional: GIF → small muted loop MP4s (`ffmpeg`) |

## Configuration

1. **Compile** `targets.mind` with the [MindAR compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile) from your **print** reference image(s). Target order must match `AR_CONFIG.markers[].targetIndex` (0 = first image in the compiler).

2. **Keep paths aligned:** the same `targets.mind` path must appear in:
   - `index.html` → `mindar-image` → `imageTargetSrc`
   - `config.js` → `AR_CONFIG.marker.src`

3. **Per marker** in `config.js`: `loop` (small muted MP4, autoplay when tracked), `full` (web-optimized full clip; see below).

**Full clips (strategy):** ship **H.264 + AAC** MP4s with **`-movflags +faststart`** (moov at the start) so playback can start after a small buffer. GitHub Pages serves these over **HTTPS** with **byte-range** requests, so the browser can fetch progressively instead of needing the whole file in memory first. Source masters can stay in `media/`; deployable “web” encodes use names like `*-full-web.mp4`.

**GIFs:** use **MP4** on the AR plane (`<a-video>`). Convert with `scripts/convert-gif-loops.sh` or `ffmpeg` locally, then commit the MP4.

## Local preview (optional)

Camera APIs need **HTTPS** or **localhost**:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080/` (or `http://127.0.0.1:8080/`).

## Third-party licenses

MindAR, A-Frame, and Three.js are used under their respective open-source licenses. Project branding and non-library assets are proprietary unless stated otherwise.
