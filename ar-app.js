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
  const fullReady = {};
  const fullLoading = {};
  // Default ON; autoplay-with-sound may still require a user gesture.
  let audioEnabled = true;

  function removeVRButton() {
    document.querySelectorAll('.a-enter-vr, .a-enter-vr-button, .a-enter-vr-fullscreen').forEach(function (el) {
      el.remove();
    });
  }
  setInterval(removeVRButton, 400);

  function getVideoEl(idx) {
    return document.getElementById('video-' + idx);
  }

  function getFullVideoEl(idx) {
    return document.getElementById('video-full-' + idx);
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
      el.style.display = 'inline-flex';
      el.textContent = text || (C.ui && C.ui.loadingFull) || 'Loading…';
    } else {
      el.style.display = 'none';
      el.textContent = '';
    }
  }

  function setAudioToggleState() {
    const btn = document.getElementById('audio-toggle');
    if (!btn) return;
    const onLabel = (C.ui && C.ui.audioOn) || 'Sound on';
    const offLabel = (C.ui && C.ui.audioOff) || 'Sound off';
    btn.setAttribute('aria-pressed', audioEnabled ? 'true' : 'false');
    btn.setAttribute('aria-label', audioEnabled ? onLabel : offLabel);
    btn.setAttribute('title', audioEnabled ? onLabel : offLabel);
    btn.textContent = audioEnabled ? '🔊' : '🔇';
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

      let fullVid = getFullVideoEl(idx);
      if (!fullVid) {
        fullVid = document.createElement('video');
        fullVid.id = 'video-full-' + idx;
        fullVid.setAttribute('crossorigin', 'anonymous');
        fullVid.setAttribute('playsinline', '');
        fullVid.setAttribute('webkit-playsinline', '');
        // Start with metadata only; switch to auto when a target is found.
        fullVid.setAttribute('preload', 'metadata');
        // Start muted; we will try to unmute when playing.
        fullVid.muted = true;
        fullVid.loop = false;
        assets.appendChild(fullVid);
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
        target.setAttribute('visible', false);
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
  }

  function playLoopForIndex(idx) {
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

  function showLoadingForIndex(idx, show) {
    // Only show the loader for the currently visible target.
    const current = pickVisibleTargetIndex();
    if (!show && current !== idx) return;
    const m = getMarkerConfig(idx);
    const label = (m && m.label) || 'video';
    setLoadingFull(!!show, 'Loading ' + label + '…');
  }

  function switchPlaneToLoop(idx) {
    const plane = document.getElementById('plane-' + idx);
    if (plane) plane.setAttribute('src', '#video-' + idx);
  }

  function switchPlaneToFull(idx) {
    const plane = document.getElementById('plane-' + idx);
    if (plane) plane.setAttribute('src', '#video-full-' + idx);
  }

  function preloadAndMaybePlayFull(idx) {
    const m = getMarkerConfig(idx);
    if (!m || !m.full || !m.full.src) return;
    if (fullReady[idx] || fullLoading[idx]) return;

    const fullVid = getFullVideoEl(idx);
    if (!fullVid) return;

    fullLoading[idx] = true;
    showLoadingForIndex(idx, true);

    const fullUrl = resolveUrl(m.full.src);
    fullVid.muted = true; // start muted, try to unmute when playing
    fullVid.loop = false;
    fullVid.preload = 'auto';
    if (fullVid.src !== fullUrl) {
      fullVid.src = fullUrl;
      fullVid.load();
    }

    const onReady = function () {
      fullVid.removeEventListener('error', onErr);
      fullLoading[idx] = false;
      fullReady[idx] = true;

      if (!visible[idx]) {
        showLoadingForIndex(idx, false);
        return;
      }

      switchPlaneToFull(idx);
      showLoadingForIndex(idx, false);

      if (audioEnabled) {
        fullVid.muted = false;
      } else {
        fullVid.muted = true;
      }

      fullVid.play().catch(function () {
        // If unmuted autoplay is blocked, fall back to muted playback.
        if (audioEnabled) {
          fullVid.muted = true;
          fullVid.play().catch(function () {});
        }
      });
    };

    const onErr = function () {
      fullVid.removeEventListener('canplay', onReady);
      fullLoading[idx] = false;
      showLoadingForIndex(idx, false);
    };

    fullVid.addEventListener('canplay', onReady, { once: true });
    fullVid.addEventListener('error', onErr, { once: true });
  }

  function onTargetFound(idx) {
    visible[idx] = true;
    lastFoundIndex = idx;
    const targetEl = document.getElementById('target-' + idx);
    if (targetEl) targetEl.setAttribute('visible', true);
    playLoopForIndex(idx);
    preloadAndMaybePlayFull(idx);
  }

  function onTargetLost(idx) {
    visible[idx] = false;
    const targetEl = document.getElementById('target-' + idx);
    if (targetEl) targetEl.setAttribute('visible', false);

    const loopVid = getVideoEl(idx);
    if (loopVid) loopVid.pause();

    const fullVid = getFullVideoEl(idx);
    if (fullVid) fullVid.pause();

    switchPlaneToLoop(idx);
    showLoadingForIndex(idx, false);
  }

  function applyAudioToVisibleFull() {
    const idx = pickVisibleTargetIndex();
    if (idx === null) return;
    const fullVid = getFullVideoEl(idx);
    if (!fullVid || !fullReady[idx]) return;
    fullVid.muted = !audioEnabled;
    // If user just interacted (toggle click), retry play; that gesture can unlock sound.
    fullVid.play().catch(function () {});
  }

  function initAudioToggle() {
    const btn = document.getElementById('audio-toggle');
    if (!btn) return;
    setAudioToggleState();
    btn.addEventListener('click', function () {
      audioEnabled = !audioEnabled;
      setAudioToggleState();
      applyAudioToVisibleFull();
    });
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
    initAudioToggle();
    initMenu();
  });
})();
