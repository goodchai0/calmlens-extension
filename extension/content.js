(() => {
  const VERSION = 2;
  if (window.__calmLensLoaded === VERSION) return;
  window.__calmLensLoaded = VERSION;
  // Remove anything left behind by an older copy of this script (after an extension reload).
  document.querySelectorAll("#cl-style, #cl-tint, #cl-dim, #cl-ruler").forEach((e) => e.remove());

  const DEFAULTS = {
    enabled: true,
    font: "default",     // default | easy | friendly | serif
    spacing: 0,          // 0 = off, 1 = comfy, 2 = roomy, 3 = extra
    tint: "none",        // none | cream | blue | mint | rose | warm
    dim: 0,              // 0..50 (% of black laid over the page)
    ruler: false,        // reading ruler that follows the mouse
    ytShorts: true,
    ytHome: false,
    ytRelated: false,
    ytComments: false,
    ytEndCards: true,
    sitesOff: []
  };

  const FONTS = {
    easy: 'Verdana, Tahoma, "Trebuchet MS", sans-serif',
    friendly: '"Comic Sans MS", "Comic Neue", "Chalkboard SE", "Trebuchet MS", sans-serif',
    serif: 'Georgia, "Times New Roman", serif'
  };
  const SPACING = [
    null,
    { lh: 1.6, ls: "0.02em", ws: "0.08em" },
    { lh: 1.8, ls: "0.05em", ws: "0.16em" },
    { lh: 2.0, ls: "0.08em", ws: "0.24em" }
  ];
  const TINTS = {
    cream: "#fbf0d0",
    blue: "#dbeafe",
    mint: "#d9f2e3",
    rose: "#fde2e4",
    warm: "#ffd9a8"
  };

  const isYT = /(^|\.)youtube\.com$/.test(location.hostname);
  let s = { ...DEFAULTS };
  let isOff = false;
  let styleEl = null, tintEl = null, dimEl = null, rulerEl = null;
  let rulerOn = false, rulerRaf = 0, mouseY = 0;

  /* ---------- CSS ---------- */

  // Text styling is skipped on YouTube: it would distort the player and menus.
  const TEXT_TARGET =
    'html.cl-on body *:not(code):not(pre):not(kbd):not(samp):not(svg):not(svg *):not(i)' +
    ':not([class*="icon" i]):not([class*="material" i]):not([class*="glyph" i]):not([class*="fa-"])';

  function buildCSS() {
    const out = [];

    if (!isYT) {
      const decl = [];
      const font = FONTS[s.font];
      const sp = SPACING[s.spacing];
      if (font) decl.push(`font-family:${font} !important;`);
      if (sp) {
        decl.push(`line-height:${sp.lh} !important;`);
        decl.push(`letter-spacing:${sp.ls} !important;`);
        decl.push(`word-spacing:${sp.ws} !important;`);
      }
      if (decl.length) out.push(`${TEXT_TARGET}{${decl.join("")}}`);
    }

    if (isYT) {
      const hide = (selectors) => out.push(`${selectors.join(",\n")}{display:none !important;}`);

      if (s.ytShorts) {
        hide([
          "ytd-rich-shelf-renderer[is-shorts]",
          "ytd-reel-shelf-renderer",
          "ytd-shorts",
          'ytd-guide-entry-renderer:has(a[title="Shorts"])',
          'ytd-guide-entry-renderer:has(a[href^="/shorts"])',
          'ytd-mini-guide-entry-renderer[aria-label="Shorts"]',
          'ytd-rich-item-renderer:has(a[href^="/shorts/"])',
          'ytd-video-renderer:has(a[href^="/shorts/"])',
          'ytd-grid-video-renderer:has(a[href^="/shorts/"])',
          'ytd-compact-video-renderer:has(a[href^="/shorts/"])',
          "ytm-shorts-lockup-view-model",
          "ytm-shorts-lockup-view-model-v2",
          'yt-tab-shape[tab-title="Shorts"]'
        ]);
      }
      if (s.ytHome) {
        out.push('ytd-browse[page-subtype="home"] ytd-rich-grid-renderer > #contents{display:none !important;}');
        out.push(
          'ytd-browse[page-subtype="home"]::before{content:"Focus mode is on. Use the search bar to find what you want.";' +
          'display:block;text-align:center;padding:90px 20px;font-size:18px;color:var(--yt-spec-text-secondary,#888);}'
        );
      }
      if (s.ytRelated) {
        hide(["ytd-watch-flexy #related", "ytd-watch-next-secondary-results-renderer"]);
      }
      if (s.ytComments) {
        hide(["ytd-comments#comments", "ytd-watch-flexy #comments"]);
      }
      if (s.ytEndCards) {
        hide([".ytp-endscreen-content", ".ytp-ce-element", ".ytp-suggestion-set", ".videowall-endscreen"]);
      }
    }

    return out.join("\n");
  }

  /* ---------- overlays (tint, dim, ruler) ---------- */

  function overlay(existing, id, z) {
    if (existing && existing.isConnected) return existing;
    const el = document.createElement("div");
    el.id = id;
    el.style.cssText =
      `position:fixed;inset:0;pointer-events:none;z-index:${z};display:none;`;
    document.documentElement.appendChild(el);
    return el;
  }

  function applyOverlays() {
    const color = TINTS[s.tint];
    tintEl = overlay(tintEl, "cl-tint", 2147483646);
    if (color) {
      tintEl.style.background = color;
      tintEl.style.mixBlendMode = "multiply";
      tintEl.style.display = "block";
    } else {
      tintEl.style.display = "none";
    }

    dimEl = overlay(dimEl, "cl-dim", 2147483645);
    if (s.dim > 0) {
      dimEl.style.background = `rgba(0,0,0,${Math.min(50, s.dim) / 100})`;
      dimEl.style.display = "block";
    } else {
      dimEl.style.display = "none";
    }
  }

  function removeOverlays() {
    if (tintEl) tintEl.style.display = "none";
    if (dimEl) dimEl.style.display = "none";
  }

  function onMove(e) {
    mouseY = e.clientY;
    if (rulerRaf) return;
    rulerRaf = requestAnimationFrame(() => {
      rulerRaf = 0;
      if (!rulerEl) return;
      rulerEl.style.display = "block";
      rulerEl.style.transform = `translateY(${mouseY - 42}px)`;
    });
  }

  function setRuler(on) {
    if (on === rulerOn) return;
    rulerOn = on;
    if (on) {
      rulerEl = document.createElement("div");
      rulerEl.id = "cl-ruler";
      rulerEl.style.cssText =
        "position:fixed;left:0;top:0;width:100vw;height:84px;pointer-events:none;" +
        "z-index:2147483644;box-shadow:0 0 0 100vmax rgba(0,0,0,.45);display:none;";
      document.documentElement.appendChild(rulerEl);
      window.addEventListener("mousemove", onMove, { passive: true });
    } else {
      window.removeEventListener("mousemove", onMove);
      if (rulerEl) rulerEl.remove();
      rulerEl = null;
    }
  }

  /* ---------- YouTube Shorts -> normal player ---------- */

  function checkShorts() {
    if (!isYT || isOff || !s.ytShorts) return;
    const m = location.pathname.match(/^\/shorts\/([\w-]{5,})/);
    if (m) location.replace("https://www.youtube.com/watch?v=" + m[1]);
  }

  /* ---------- apply everything ---------- */

  function apply() {
    isOff = !s.enabled || (s.sitesOff || []).includes(location.hostname);
    document.documentElement.classList.toggle("cl-on", !isOff);

    if (!styleEl || !styleEl.isConnected) {
      styleEl = document.createElement("style");
      styleEl.id = "cl-style";
      (document.head || document.documentElement).appendChild(styleEl);
    }

    if (isOff) {
      styleEl.textContent = "";
      removeOverlays();
      setRuler(false);
      return;
    }

    styleEl.textContent = buildCSS();
    applyOverlays();
    setRuler(!!s.ruler);
    checkShorts();
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "cl-ping") sendResponse({ ok: true, off: isOff });
  });

  chrome.storage.sync.get(DEFAULTS, (v) => {
    s = { ...DEFAULTS, ...v };
    apply();
  });

  chrome.storage.onChanged.addListener((changes) => {
    for (const k in changes) s[k] = changes[k].newValue;
    apply();
  });

  if (isYT) setInterval(checkShorts, 1000);
})();
