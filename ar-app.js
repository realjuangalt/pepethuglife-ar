(function () {
  'use strict';

  const C = window.AR_CONFIG;
  if (!C || !Array.isArray(C.markers) || C.markers.length === 0) {
    console.error('AR_CONFIG.markers missing — check config.js');
    return;
  }

  window.AR_HOOKS = window.AR_HOOKS || {};

  function getSceneEl() {
    return document.getElementById('ar-scene') || document.querySelector('a-scene');
  }

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

  function parseMindarAttr(str) {
    const out = {};
    if (!str) return out;
    str.split(';').forEach(function (chunk) {
      const c = chunk.trim();
      if (!c) return;
      const parts = c.split(':');
      const key = (parts.shift() || '').trim();
      const value = parts.join(':').trim();
      if (!key) return;
      out[key] = value;
    });
    return out;
  }

  function serializeMindarAttr(obj) {
    return Object.keys(obj)
      .map(function (k) {
        return k + ': ' + obj[k];
      })
      .join('; ');
  }

  function ensureDomForMarkers() {
    const scene = getSceneEl();
    if (!scene) return;

    let assets = document.getElementById('ar-assets');
    if (!assets) {
      assets = document.createElement('a-assets');
      assets.id = 'ar-assets';
      scene.appendChild(assets);
    }

    const attr = parseMindarAttr(scene.getAttribute('mindar-image'));
    if (C.marker && C.marker.src) {
      attr.imageTargetSrc = C.marker.src;
    }
    const maxIndex = Math.max.apply(
      null,
      C.markers.map(function (m) {
        return m.targetIndex;
      })
    );
    attr.maxTrack = String(Math.max(1, maxIndex + 1));
    scene.setAttribute('mindar-image', serializeMindarAttr(attr));

    C.markers.forEach(function (m) {
      const idx = m.targetIndex;

      let vid = getVideoEl(idx);
      if (!vid) {
        vid = document.createElement('video');
        vid.id = 'video-' + idx;
        vid.setAttribute('crossorigin', 'anonymous');
        vid.setAttribute('playsinline', '');
        vid.setAttribute('webkit-playsinline', '');
        vid.setAttribute('preload', 'auto');
        vid.muted = true;
        vid.loop = true;
        assets.appendChild(vid);
      }

      let target = document.getElementById('target-' + idx);
      if (!target) {
        target = document.createElement('a-entity');
        target.id = 'target-' + idx;
        target.setAttribute('mindar-image-target', 'targetIndex: ' + idx);

        const plane = document.createElement('a-video');
        plane.id = 'plane-' + idx;
        plane.setAttribute('src', '#video-' + idx);
        plane.setAttribute('position', '0 0 0.01');
        plane.setAttribute('rotation', '0 0 0');
        plane.setAttribute('width', '1');
        plane.setAttribute('height', '1');

        target.appendChild(plane);
        scene.appendChild(target);
      }
    });
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

  function initMenu() {
    const burger = document.getElementById('menu-burger');
    const panel = document.getElementById('menu-panel');
    const nav = document.getElementById('menu-nav');
    const closeBtn = document.getElementById('menu-close');
    if (!burger || !panel || !nav) return;

    const links = (C.menu && C.menu.links) || [];
    if (links.length === 0) return;

    links.forEach(function (item) {
      if (!item || !item.href) return;
      const a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label || item.href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      nav.appendChild(a);
    });

    burger.removeAttribute('hidden');
    panel.removeAttribute('hidden');
    burger.setAttribute('aria-label', (C.ui && C.ui.menuOpen) || 'Menu');

    function setOpen(open) {
      panel.classList.toggle('is-open', open);
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('menu-open', open);
    }

    burger.addEventListener('click', function () {
      setOpen(true);
    });
    closeBtn.addEventListener('click', function () {
      setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        setOpen(false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    ensureDomForMarkers();
    applyConfigToDom();
    wireMindarTargets();
    initMenu();
  });

  window.beginFullPlayback = beginFullPlayback;
  window.stopFullPlayback = stopFullPlayback;
  window.stopPlayback = stopFullPlayback;
})();
