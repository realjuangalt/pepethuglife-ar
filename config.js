/**
 * Static AR: paths must stay in sync with index.html (mindar-image imageTargetSrc).
 *
 * Compile targets.mind from your printed reference image(s), same order as targetIndex:
 *   https://hiukim.github.io/mind-ar-js-doc/tools/compile
 *
 * Phase 1 — Lightweight loops (GIF → MP4): autoplay muted when the marker is seen.
 * Phase 2 — Full clips: user taps "Full song"; large files load on demand (see ar-app.js).
 */
window.AR_CONFIG = {
  title: 'Pepe Thug Life AR',

  marker: {
    src: './media/targets.mind',
  },

  /**
   * One entry per MindAR target index (same order as in targets.mind).
   */
  markers: [
    {
      targetIndex: 0,
      label: 'PEPETHUGLIFE',
      loop: {
        src: './media/PEPETHUGLIFE-loop.mp4',
      },
      full: {
        src: './media/PEPETHUGLIFE snoop dog DRE edition artivive smoke.mp4',
      },
      plane: {
        width: 1,
        height: 1.3975,
        position: '0 0 0.01',
        rotation: '0 0 0',
      },
    },
  ],

  ui: {
    playFull: 'Full song',
    stop: 'Stop',
    loadingFull: 'Loading full video…',
    pointAtCard: 'Point camera at a card',
  },
};
