(function () {
  'use strict';

  const C = window.ARTWORK_CONFIG;
  if (!C) {
    console.error('ARTWORK_CONFIG missing — load config.js before ar-app.js');
    return;
  }

  /**
   * Optional hooks for forks (AI pipeline, analytics, etc.)
   * Assign functions from another script: window.ARTWORK_HOOKS.beforePlay = async () => { ... }
   */
  window.ARTWORK_HOOKS = window.ARTWORK_HOOKS || {};

  let separateAudio = null;

  function runHook(name) {
    const h = window.ARTWORK_HOOKS[name];
    if (typeof h === 'function') {
      try {
        return h();
      } catch (e) {
        console.warn('ARTWORK_HOOKS.' + name + ' failed', e);
      }
    }
    return Promise.resolve();
  }

  function removeVRButton() {
    document.querySelectorAll('.a-enter-vr, .a-enter-vr-button, .a-enter-vr-fullscreen').forEach(function (el) {
      el.remove();
    });
  }
  setInterval(removeVRButton, 400);

  function applyConfigToDom() {
    document.title = C.title;

    const vid = document.getElementById('artwork-video');
    if (vid) {
      vid.src = C.video.src;
      vid.loop = !!C.video.loop;
      if (C.video.mutedUntilPlay !== false) {
        vid.muted = true;
      }
    }

    const plane = document.getElementById('projection-plane');
    if (plane && C.projection) {
      const p = C.projection;
      if (p.width != null) plane.setAttribute('width', p.width);
      if (p.height != null) plane.setAttribute('height', p.height);
      if (p.position) plane.setAttribute('position', p.position);
      if (p.rotation) plane.setAttribute('rotation', p.rotation);
    }

    const playBtn = document.getElementById('play-btn');
    const stopBtn = document.getElementById('stop-btn');
    if (playBtn && C.ui) playBtn.textContent = C.ui.play || 'Play';
    if (stopBtn && C.ui) stopBtn.setAttribute('title', C.ui.stop || 'Stop');

    const err = document.getElementById('media-error');
    if (vid && err) {
      vid.addEventListener('error', function () {
        err.hidden = false;
        err.textContent =
          'Could not load video: ' +
          C.video.src +
          '. Add your file or update ARTWORK_CONFIG.video.src in config.js.';
      });
    }

    if (vid) {
      vid.addEventListener('ended', function () {
        const stopBtn = document.getElementById('stop-btn');
        if (stopBtn) stopBtn.style.display = 'none';
        if (separateAudio) {
          separateAudio.pause();
          separateAudio.currentTime = 0;
        }
        runHook('onEnded');
      });
    }
  }

  async function playPiece() {
    await runHook('beforePlay');

    const vid = document.getElementById('artwork-video');
    const stopBtn = document.getElementById('stop-btn');
    if (!vid) return;

    vid.muted = false;

    if (C.audio && C.audio.src) {
      vid.muted = true;
      if (!separateAudio) {
        separateAudio = new Audio(C.audio.src);
      }
      separateAudio.currentTime = 0;
      try {
        await separateAudio.play();
      } catch (e) {
        console.warn('Separate audio play failed', e);
      }
    }

    try {
      await vid.play();
    } catch (e) {
      console.error('Video play failed', e);
      alert('Playback failed. Tap Play again or check media paths and formats.');
      return;
    }

    if (stopBtn) stopBtn.style.display = 'inline-flex';
    await runHook('afterPlay');
  }

  function stopPlayback() {
    const vid = document.getElementById('artwork-video');
    if (vid) {
      vid.pause();
      vid.currentTime = 0;
      if (C.video.mutedUntilPlay !== false) {
        vid.muted = true;
      }
    }
    if (separateAudio) {
      separateAudio.pause();
      separateAudio.currentTime = 0;
    }

    const stopBtn = document.getElementById('stop-btn');
    if (stopBtn) stopBtn.style.display = 'none';

    runHook('afterStop');
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyConfigToDom();
  });

  window.playPiece = playPiece;
  window.stopPlayback = stopPlayback;
})();
