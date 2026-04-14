/**
 * AR art piece — edit this file when you fork the project.
 * Replace files under ./media/ and keep marker paths in sync with index.html (mindar-image).
 *
 * Extensions: assign functions on window.ARTWORK_HOOKS in a separate script
 * (e.g. beforePlay, afterPlay, afterStop, onEnded) for analytics, AI pipelines, etc.
 */
window.ARTWORK_CONFIG = {
  title: 'AR Artwork',

  video: {
    src: './media/artwork.mp4',
    loop: false,
    mutedUntilPlay: true,
  },

  /** Set to { src: './media/your-audio.mp3' } to use a separate audio file (video is muted). */
  audio: null,

  projection: {
    width: 1,
    height: 0.5625,
    position: '0 0 0.01',
    rotation: '0 0 0',
  },

  /**
   * Marker file for MindAR — must match imageTargetSrc in index.html <a-scene mindar-image="...">
   */
  marker: {
    src: './media/targets.mind',
  },

  ui: {
    play: 'Play',
    stop: 'Stop',
  },
};
