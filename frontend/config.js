/**
 * Edit this file for your build. Keep marker paths aligned with index.html (mindar-image).
 *
 * Optional hooks: assign functions on window.AR_HOOKS in another script
 * (beforePlay, afterPlay, afterStop, onEnded) for analytics, AI, etc.
 */
window.AR_CONFIG = {
  title: 'AR presentation',

  video: {
    src: './media/video.mp4',
    loop: false,
    mutedUntilPlay: true,
  },

  /** Set to { src: './media/audio.mp3' } to use separate audio (video track is muted). */
  audio: null,

  /** Size and pose of the video on the printed marker (meters / degrees). */
  plane: {
    width: 1,
    height: 0.5625,
    position: '0 0 0.01',
    rotation: '0 0 0',
  },

  /**
   * MindAR target — imageTargetSrc in index.html must match marker.src
   */
  marker: {
    src: './media/targets.mind',
  },

  ui: {
    play: 'Play',
    stop: 'Stop',
  },
};
