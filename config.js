/**
 * Static AR: paths must stay in sync with index.html (mindar-image imageTargetSrc).
 *
 * Compile targets.mind from your printed reference image(s), same order as targetIndex:
 *   https://hiukim.github.io/mind-ar-js-doc/tools/compile
 *
 * Phase 1 — Lightweight loops (GIF → MP4): autoplay muted when the marker is seen.
 * Phase 2 — Full clips: preloaded when marker is tracked; web-optimized MP4 (+faststart).
 * Audio: we default sound ON, but some browsers require one tap before they allow unmuted playback.
 */
window.AR_CONFIG = {
  title: 'Pepe Thug Life AR',

  marker: {
    src: './targets.mind',
  },

  /**
   * One entry per MindAR target index (same order as in targets.mind).
   */
  markers: [
    {
      targetIndex: 1,
      label: 'PEPETHUGLIFE',
      loop: {
        src: './media/PEPETHUGLIFE-loop.mp4',
      },
      full: {
        src: './media/PEPETHUGLIFE-full-web.mp4',
      },
      plane: {
        width: 1,
        height: 1.3975,
        overscan: 1.15,
        position: '0 0 0.01',
        rotation: '0 0 0',
      },
    },
    {
      targetIndex: 0,
      label: 'SHADILAYTHUG',
      loop: {
        src: './media/SHADILAYTHUG-loop.mp4',
      },
      full: {
        src: './media/SHADILAYTHUG-full-web.mp4',
      },
      plane: {
        width: 1,
        height: 1.3925,
        overscan: 1.15,
        position: '0 0 0.01',
        rotation: '0 0 0',
      },
    },
  ],

  ui: {
    loadingFull: 'Loading full video…',
    pointAtCard: 'Point camera at a card',
    audioOn: 'Sound on',
    audioOff: 'Sound off',
    menuOpen: 'Menu',
    menuClose: 'Close menu',
  },

  /** Full-screen menu (burger, bottom-left). Opens links in a new tab. */
  menu: {
    links: [
      {
        href: 'https://blog.juangalt.com/p/an-art-project-ive-worked-on',
        label: 'About PEPETHUGLIFE',
      },
      {
        href: 'https://juangalt.com',
        label: 'Artist — juangalt.com',
      },
      {
        href: 'https://github.com/realjuangalt/pepethuglife-ar',
        label: 'GitHub repository',
      },
      {
        href: 'https://satochip.io/',
        label: 'Satochip',
      },
    ],
  },
};
