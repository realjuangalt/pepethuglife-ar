(function () {
  'use strict';

  const C = window.AR_CONFIG;
  if (!C || !Array.isArray(C.markers) || C.markers.length === 0) {
    console.error('AR_CONFIG.markers missing — check config.js');
    return;
  }

  window.AR_HOOKS = window.AR_HOOKS || {};

  function runHook(name) {
    const h = window.AR_HOOKS[name];
    if (typeof h === 'function') {
      try {
        return h();
      } catch (e) {
        console.warn('AR_HOOKS.' + name + ' failed', e);
      }
    }
    return Promise.resolve();
  }

  /** Resolve relative paths with spaces/special chars for media URLs */
  function resolveUrl(relativePath) {
    try {
      return new URL(relativePath, window.location.href).href;
    } catch (e) {
      return relativePath;
    }
  }

  const visible = {};
  let lastFoundIndex = 0;
  /** Which marker index is playing the full (large) clip, or null */
  let fullActiveFor = null;

  function removeVRButton() {
    document.querySelectorAll('.a-enter-vr, .a-enter-vr-button, .a-enter-vr-fullscreen').forEach(function (el) {
      el.remove();
    });
  }
  setInterval(removeVRButton, 400);

  function getVideoEl(idx) {
    return document.getElementById('video-' + idx);
  }

  function getMarkerConfig(idx) {
    return C.markers.filter(function (m) {
      return m.targetIndex === idx;
    })[0];
  }

  function setLoadingFull(show, text) {
    const el = document.getElementById('loading-full');
    if (!el) return;
    if (show) {
      el.style.display = 'block';
      el.textContent = text || (C.ui && C.ui.loadingFull) || 'Loading…';
    } else {
      el.style.display = 'none';
      el.textContent = '';
    }
  }

  function updatePlayButton() {
    const btn = document.getElementById('play-full-btn');
    if (!btn) return;
    const anyVisible = C.markers.some(function (m) {
      return visible[m.targetIndex];
    });
    const idx = pickVisibleTargetIndex();
    const m = idx !== null ? getMarkerConfig(idx) : null;
    const hasFull = m && m.full && m.full.src;
    btn.disabled = !anyVisible || !hasFull || fullActiveFor !== null;
  }

  function pickVisibleTargetIndex() {
    if (visible[lastFoundIndex]) return lastFoundIndex;
    for (let i = 0; i < C.markers.length; i++) {
      const ix = C.markers[i].targetIndex;
      if (visible[ix]) return ix;
    }
    return null;
  }

  function applyPlane(idx) {
    const m = getMarkerConfig(idx);
    if (!m || !m.plane) return;
    const plane = document.getElementById('plane-' + idx);
    if (!plane) return;
    const p = m.plane;
    if (p.width != null) plane.setAttribute('width', p.width);
    if (p.height != null) plane.setAttribute('height', p.height);
    if (p.position) plane.setAttribute('position', p.position);
    if (p.rotation) plane.setAttribute('rotation', p.rotation);
  }

  function applyConfigToDom() {
    document.title = C.title || 'AR';

    C.markers.forEach(function (m) {
      const idx = m.targetIndex;
      applyPlane(idx);
      const vid = getVideoEl(idx);
      if (!vid) return;
      vid.loop = true;
      vid.muted = true;
      vid.preload = 'auto';
      if (m.loop && m.loop.src) {
        vid.src = resolveUrl(m.loop.src);
        vid.dataset.mode = 'loop';
      }
    });

    const playBtn = document.getElementById('play-full-btn');
    const stopBtn = document.getElementById('stop-btn');
    if (playBtn && C.ui) playBtn.textContent = C.ui.playFull || 'Full song';
    if (stopBtn && C.ui) stopBtn.setAttribute('title', C.ui.stop || 'Stop');

    const err = document.getElementById('media-error');
    C.markers.forEach(function (m) {
      const idx = m.targetIndex;
      const vid = getVideoEl(idx);
      if (vid && err) {
        vid.addEventListener('error', function () {
          err.hidden = false;
          err.textContent =
            'Could not load video for ' +
            (m.label || 'target ' + idx) +
            '. Check paths in config.js and that the file is deployed.';
        });
      }
    });

    updatePlayButton();
  }

  function playLoopForIndex(idx) {
    if (fullActiveFor === idx) return;

    const m = getMarkerConfig(idx);
    const vid = getVideoEl(idx);
    if (!m || !m.loop || !m.loop.src || !vid) return;

    vid.muted = true;
    vid.loop = true;
    const loopUrl = resolveUrl(m.loop.src);
    if (vid.dataset.mode !== 'loop' || vid.src !== loopUrl) {
      vid.src = loopUrl;
      vid.dataset.mode = 'loop';
      vid.load();
    }
    vid.play().catch(function () {});
  }

  function onTargetFound(idx) {
    visible[idx] = true;
    lastFoundIndex = idx;
    updatePlayButton();

    if (fullActiveFor === idx) {
      const vid = getVideoEl(idx);
      if (vid && vid.paused) {
        vid.play().catch(function () {});
      }
      return;
    }

    playLoopForIndex(idx);
  }

  function onTargetLost(idx) {
    visible[idx] = false;
    updatePlayButton();

    const vid = getVideoEl(idx);
    if (vid) vid.pause();

    if (fullActiveFor === idx) {
      fullActiveFor = null;
      setLoadingFull(false);
      const stopBtn = document.getElementById('stop-btn');
      if (stopBtn) stopBtn.style.display = 'none';
      const m = getMarkerConfig(idx);
      if (m && m.loop && m.loop.src) {
        vid.muted = true;
        vid.loop = true;
        vid.src = resolveUrl(m.loop.src);
        vid.dataset.mode = 'loop';
        vid.load();
      }
      runHook('afterStop');
    }
  }

  function wireMindarTargets() {
    const scene = document.querySelector('a-scene');
    if (!scene) return;

    function bind() {
      C.markers.forEach(function (m) {
        const idx = m.targetIndex;
        const el = document.getElementById('target-' + idx);
        if (!el) return;
        el.addEventListener('targetFound', function () {
          onTargetFound(idx);
        });
        el.addEventListener('targetLost', function () {
          onTargetLost(idx);
        });
      });
    }

    if (scene.hasLoaded) {
      bind();
    } else {
      scene.addEventListener('loaded', bind);
    }
  }

  /**
   * Phase 2: load large file on demand (not preloaded as whole-file download until user taps).
   * Uses progressive buffering; UI shows loading until playback can start.
   */
  async function beginFullPlayback() {
    await runHook('beforePlay');

    const idx = pickVisibleTargetIndex();
    if (idx === null) {
      alert((C.ui && C.ui.pointAtCard) || 'Point camera at a card first.');
      return;
    }

    const m = getMarkerConfig(idx);
    if (!m || !m.full || !m.full.src) return;

    const vid = getVideoEl(idx);
    const stopBtn = document.getElementById('stop-btn');
    if (!vid) return;

    if (fullActiveFor !== null && fullActiveFor !== idx) {
      stopFullPlayback();
    }

    fullActiveFor = idx;
    vid.muted = false;
    vid.loop = false;
    setLoadingFull(true);
    updatePlayButton();

    const fullUrl = resolveUrl(m.full.src);
    vid.src = fullUrl;
    vid.dataset.mode = 'full';
    vid.load();

    const onReady = function () {
      vid.removeEventListener('error', onErr);
      setLoadingFull(false);
      vid.play().catch(function (e) {
        console.error('Full video play failed', e);
        alert('Playback failed. Try again or check network.');
        stopFullPlayback();
      });
      if (stopBtn) stopBtn.style.display = 'inline-flex';
      updatePlayButton();
      runHook('afterPlay');
    };

    const onErr = function () {
      vid.removeEventListener('canplay', onReady);
      setLoadingFull(false);
      fullActiveFor = null;
      updatePlayButton();
      alert('Could not load full video. File missing or network error.');
    };

    vid.addEventListener('canplay', onReady, { once: true });
    vid.addEventListener('error', onErr, { once: true });

    vid.addEventListener(
      'ended',
      function onEnd() {
        vid.removeEventListener('ended', onEnd);
        stopFullPlayback();
      },
      { once: true }
    );
  }

  function stopFullPlayback() {
    if (fullActiveFor === null) return;

    const idx = fullActiveFor;
    fullActiveFor = null;
    setLoadingFull(false);

    const vid = getVideoEl(idx);
    const stopBtn = document.getElementById('stop-btn');
    if (stopBtn) stopBtn.style.display = 'none';

    if (vid) {
      vid.pause();
      const m = getMarkerConfig(idx);
      if (m && m.loop && m.loop.src) {
        vid.muted = true;
        vid.loop = true;
        vid.src = resolveUrl(m.loop.src);
        vid.dataset.mode = 'loop';
        vid.load();
        if (visible[idx]) {
          vid.play().catch(function () {});
        }
      }
    }

    updatePlayButton();
    runHook('afterStop');
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyConfigToDom();
    wireMindarTargets();
  });

  window.beginFullPlayback = beginFullPlayback;
  window.stopFullPlayback = stopFullPlayback;
  window.stopPlayback = stopFullPlayback;
})();
