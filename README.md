# pepethuglife-static-ar

**Primary goal:** ship a **fully static** site on **GitHub Pages** so the experience runs **without you operating any server**—no VPS, no Flask, no process to keep alive. Pushing to the repo and pointing Pages at `frontend/` is enough for production.

A **stripped-down** marker-based AR page: point a phone camera at a **specific printed image**, see a **video** mapped onto that marker, and play **video audio** or an optional **separate audio file**. There is **no AI**, no speech-to-text, and no server-side pipeline in the deployed experience.

This repo keeps the **same general idea** as an earlier, fuller project (printed target + AR presentation), but the implementation only supports **a small set of compiled targets and media** you configure in one place.

## What it does

1. **Image tracking** — [MindAR](https://github.com/hiukim/mind-ar-js) detects one of your compiled markers in `targets.mind` (this project is set up for **two** targets: Pepe + Shadilay).
2. **Video projection** — Each marker has its own `<a-video>` plane with a **short, muted loop** (Phase 1) so the experience starts quickly on GitHub Pages.
3. **Full clips** — The user can tap **Full song** to load and play a **large MP4 with audio** (Phase 2) on demand—files are not fully preloaded until then, which avoids blocking the first paint on big assets (~30MB+).

**GIFs** are not used directly on the AR plane: they are converted to **small MP4 loops** (`scripts/convert-gif-loops.sh`) because WebGL video textures expect `<video>` sources; animated GIFs on a plane usually show a single frame.

Everything runs **in the browser** from static files. GitHub Pages (or any static host) only serves HTML, JS, and media—there is **no backend in production**.

## Technology

| Piece | Role |
|--------|------|
| HTML / CSS / vanilla JS | UI and wiring |
| [A-Frame](https://aframe.io/) | Scene and video entity |
| MindAR (image target) | Marker tracking (uses TensorFlow.js inside the MindAR bundle for tracking math in the browser) |
| MP4 / optional MP3 | Media you supply under `frontend/media/` |

## Repository layout

```
├── frontend/                 # Static site — this is what you deploy
│   ├── index.html          # Placeholder landing (root URL on Pages)
│   ├── ar.html             # A-Frame + MindAR scene
│   ├── config.js           # Video path, marker path, plane size, copy
│   ├── ar-app.js           # Loop on track, full clip on demand, AR_HOOKS
│   ├── lib/                # aframe + mindar-image (vendored)
│   └── media/              # targets.mind, video, optional audio
├── backend/                # Legacy Python stack — not used by the static Pages deploy
├── package.json            # Metadata; "build" is a no-op reminder for static deploy
└── …                       # install/start scripts for optional local backend work
```

For deployment details and path sync rules, see `frontend/STATIC_SITE.txt` and `frontend/media/README.txt`.

## Configuration

1. **Compiled markers** — Build `frontend/media/targets.mind` with **both** reference images in a **single** compile, in the same order as `AR_CONFIG.markers[].targetIndex` (0 = first image, 1 = second). [MindAR compile tool](https://hiukim.github.io/mind-ar-js-doc/tools/compile).
2. **Keep paths aligned** — The same `targets.mind` path must appear in:
   - `frontend/index.html` (`mindar-image` → `imageTargetSrc`)
   - `frontend/config.js` → `AR_CONFIG.marker.src`
3. **Per-marker media** — In `frontend/config.js`, each entry under `markers` has:
   - `loop` — Small muted MP4 (Phase 1), autoplay when that marker is visible.
   - `full` — Large MP4 (Phase 2), loaded when the user taps **Full song** while that marker is tracked.
4. **Optional hooks** — `window.AR_HOOKS` (`beforePlay`, `afterPlay`, `afterStop`) — see `config.js`.

**Large files:** Phase 2 uses progressive buffering until `canplay`. For very slow networks, a future improvement is **HLS** (`.m3u8` + segments) hosted on the same static site— not implemented here yet.

## Local preview (development only)

A tiny local server is **only** for testing before you push—you are not required to run anything in production.

Serve `frontend/` over HTTP(s) (camera APIs need a secure context or localhost). For example:

```bash
cd frontend && python3 -m http.server 8080
```

Then open `http://localhost:8080/` for the landing page, or `http://localhost:8080/ar.html` for the AR app.

## GitHub Pages (production)

**Settings → Pages:** build from branch **`main`** (or your default), folder **`/frontend`**. GitHub serves the static files.

- **Landing:** `index.html` is a placeholder “coming soon” page at the site root (`https://<user>.github.io/<repo>/`).
- **AR app:** open **`/ar.html`** for the MindAR experience (same folder as `config.js` and `media/`, so paths stay simple).

Custom domains point at the same `/frontend` root; visitors see the landing first until you swap `index.html` for a full home page.

- No deploy scripts beyond git push; no runtime besides GitHub’s static CDN.
- Visitors never load `backend/` or Python—those files stay in the repo for optional local use only.

## Legacy `backend/`

The `backend/` tree is **optional** upstream/legacy code (Flask, Whisper, etc.). It is **not** part of the static AR experience described above. The root `package.json` `start` / `dev` scripts point at a Python entry if you still run that stack locally; the documented product for this repo is the **static** `frontend/`.

## Third-party licenses

MindAR, A-Frame, and Three.js are used under their respective open-source licenses. See each vendor’s repository for full license text.

Project content and branding beyond those libraries are proprietary unless stated otherwise.
