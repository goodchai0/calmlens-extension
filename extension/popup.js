const DEFAULTS = {
  enabled: true, font: "default", spacing: 0, tint: "none", dim: 0, ruler: false,
  ytShorts: true, ytHome: false, ytRelated: false, ytComments: false, ytEndCards: true,
  sitesOff: []
};

const $ = (id) => document.getElementById(id);
const CHECKS = ["enabled", "ruler", "ytShorts", "ytHome", "ytRelated", "ytComments", "ytEndCards"];
const SELECTS = ["font", "tint"];
let host = null;
let state = { ...DEFAULTS };

function render() {
  CHECKS.forEach((k) => { $(k).checked = !!state[k]; });
  SELECTS.forEach((k) => { $(k).value = state[k]; });
  $("spacing").value = String(state.spacing);
  $("dim").value = state.dim;
  $("dimVal").textContent = state.dim + "%";
  if (host) {
    $("host").textContent = host;
    $("pause").checked = state.sitesOff.includes(host);
  } else {
    $("pause").disabled = true;
    $("host").textContent = "this page (not supported)";
  }
}

function save(patch) {
  state = { ...state, ...patch };
  chrome.storage.sync.set(patch);
}

CHECKS.forEach((k) => $(k).addEventListener("change", () => save({ [k]: $(k).checked })));
SELECTS.forEach((k) => $(k).addEventListener("change", () => save({ [k]: $(k).value })));
$("spacing").addEventListener("change", () => save({ spacing: parseInt($("spacing").value, 10) }));
$("dim").addEventListener("input", () => {
  $("dimVal").textContent = $("dim").value + "%";
  save({ dim: parseInt($("dim").value, 10) });
});
$("pause").addEventListener("change", () => {
  if (!host) return;
  const list = new Set(state.sitesOff);
  if ($("pause").checked) list.add(host); else list.delete(host);
  save({ sitesOff: Array.from(list) });
});

const PRESETS = {
  pComfort: { enabled: true, font: "easy", spacing: 2, tint: "cream", dim: 0 },
  pNight: { enabled: true, font: "easy", spacing: 1, tint: "warm", dim: 25 },
  pYT: { enabled: true, ytShorts: true, ytHome: true, ytRelated: true, ytComments: true, ytEndCards: true },
  pReset: { ...DEFAULTS, sitesOff: undefined }
};
Object.keys(PRESETS).forEach((id) => {
  $(id).addEventListener("click", () => {
    const patch = { ...PRESETS[id] };
    if (id === "pReset") { delete patch.sitesOff; }
    save(patch);
    render();
  });
});

function setStatus(kind, text, withRefresh, tabId) {
  const el = $("status");
  el.className = "status " + kind;
  el.textContent = text;
  if (withRefresh) {
    const b = document.createElement("button");
    b.textContent = "Refresh this page";
    b.onclick = () => { chrome.tabs.reload(tabId); window.close(); };
    el.appendChild(b);
  }
}

function ping(tabId) {
  return new Promise((res) => {
    try {
      chrome.tabs.sendMessage(tabId, { type: "cl-ping" }, (r) => {
        void chrome.runtime.lastError;
        res(r && r.ok ? r : null);
      });
    } catch (e) { res(null); }
  });
}

// Makes sure CalmLens is running in this tab (tabs opened before install have no script yet).
async function ensureRunning(tab) {
  if (!tab || !tab.id || !/^https?:/.test(tab.url || "")) {
    setStatus("bad", "CalmLens can't run on this kind of page (browser pages, the Web Store). Open a normal website.");
    return;
  }
  let r = await ping(tab.id);
  if (!r) {
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    } catch (e) {
      setStatus("bad", "This page doesn't allow extensions to run.", false);
      return;
    }
    await new Promise((x) => setTimeout(x, 200));
    r = await ping(tab.id);
  }
  if (r) setStatus("ok", r.off ? "Running, but paused or turned off here." : "\u2713 Running on this page");
  else setStatus("bad", "Not running here yet.", true, tab.id);
}

async function init() {
  let tab0 = null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    tab0 = tab;
    if (tab && tab.url && /^https?:/.test(tab.url)) host = new URL(tab.url).hostname;
  } catch (e) { /* no tab info available */ }
  chrome.storage.sync.get(DEFAULTS, (v) => {
    state = { ...DEFAULTS, ...v };
    render();
  });
  ensureRunning(tab0);
}
init();
