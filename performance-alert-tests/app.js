// Telemetry Alert Tests dashboard.
//
// Loads telemetry-alert rows from redash, groups them by the Treeherder
// performance signature they reference, and lets you pick one test to see its
// time-series with every alert location marked on the chart.

// chartjs-plugin-annotation ships as a UMD global; register it so we can draw a
// vertical line at each alert push. The zoom plugin auto-registers in its UMD
// build, but register defensively in case load order changes.
if (window["chartjs-plugin-annotation"]) {
  Chart.register(window["chartjs-plugin-annotation"]);
}

const DAY = 24 * 60 * 60;

const ALERT_STATUS = {
  0: "Untriaged",
  1: "Downstream",
  2: "Reassigned",
  3: "Invalid",
  4: "Acknowledged",
  5: "Infra",
};

let repoMap = {}; // repository_id -> name
let groups = []; // [{key, repoId, repoName, sigId, frameworkId, alerts:[...], stats}]
let groupByKey = new Map();
let metaCache = new Map(); // group key -> signature props
let dataCache = new Map(); // `${key}:${intervalSeconds}` -> datum[]
let chart = null;
let selectedKey = null;
let focusAlertId = null; // alert id to highlight within the selected test
let suppressHashChange = false; // ignore the hashchange we trigger ourselves

const els = {
  testSelect: document.getElementById("test-select"),
  filter: document.getElementById("filter-input"),
  sort: document.getElementById("sort-select"),
  interval: document.getElementById("interval-input"),
  chartType: document.getElementById("chart-type-select"),
  reloadBtn: document.getElementById("reload-btn"),
  namesBtn: document.getElementById("names-btn"),
  status: document.getElementById("status"),
  testCount: document.getElementById("test-count"),
  detail: document.getElementById("detail"),
  detailTitle: document.getElementById("detail-title"),
  detailPlatform: document.getElementById("detail-platform"),
  detailLinks: document.getElementById("detail-links"),
  detailMeta: document.getElementById("detail-meta"),
  alertNote: document.getElementById("alert-note"),
  alertTableBody: document.querySelector("#alert-table tbody"),
  placeholder: document.getElementById("placeholder"),
};

function setStatus(msg, isError = false) {
  els.status.textContent = msg;
  els.status.classList.toggle("error", isError);
}

function num(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function bool(v) {
  return v === true || v === "true" || v === "True" || v === 1;
}

function fmtDate(ts) {
  return new Date(ts * 1000).toISOString().slice(0, 16).replace("T", " ");
}

function platformInfo(platform) {
  const p = (platform || "").toLowerCase();
  if (p.includes("android")) return { icon: "🤖", os: "android" };
  if (p.includes("win")) return { icon: "🪟", os: "windows" };
  if (p.includes("mac") || p.includes("osx") || p.includes("darwin"))
    return { icon: "🍎", os: "macos" };
  if (p.includes("linux")) return { icon: "🐧", os: "linux" };
  return { icon: "🖥️", os: "other" };
}

// --- grouping --------------------------------------------------------------

// Collapse the flat alert rows into one group per (repo, signature). A single
// signature can produce many alert rows (different detection methods, summaries,
// or pushes); we keep them all and compute a few summary stats for sorting.
function buildGroups(rows) {
  const map = new Map();
  for (const r of rows) {
    const repoId = r.repository_id;
    const sigId = r.series_signature_id;
    if (sigId == null || sigId === "") continue;
    const key = `${repoId}:${sigId}`;
    let g = map.get(key);
    if (!g) {
      g = {
        key,
        repoId,
        repoName: repoMap[repoId] || `repo ${repoId}`,
        sigId,
        frameworkId: r.framework_id,
        alerts: [],
        meta: null,
      };
      map.set(key, g);
    }
    g.alerts.push({
      id: r.id,
      pushId: r.push_id,
      prevPushId: r.prev_push_id,
      prevValue: num(r.prev_value),
      newValue: num(r.new_value),
      amountPct: num(r.amount_pct),
      amountAbs: num(r.amount_abs),
      isRegression: bool(r.is_regression),
      detectionMethod: r.detection_method || "",
      status: r.status,
      created: r.created || "",
      summaryId: r.summary_id,
      tValue: num(r.t_value),
      noiseProfile: r.noise_profile || "",
    });
  }

  const out = [];
  for (const g of map.values()) {
    let maxAbs = 0;
    let latest = "";
    let anyReg = false;
    for (const a of g.alerts) {
      if (a.amountPct != null) maxAbs = Math.max(maxAbs, Math.abs(a.amountPct));
      if (a.created > latest) latest = a.created;
      if (a.isRegression) anyReg = true;
    }
    g.stats = { maxAbs, latest, anyReg, count: g.alerts.length };
    out.push(g);
  }
  return out;
}

// --- dropdown --------------------------------------------------------------

function groupLabel(g) {
  const m = g.meta;
  const name = m
    ? `${m.suite}${m.test ? " / " + m.test : ""} · ${m.machine_platform}`
    : `sig ${g.sigId}`;
  const sign = g.stats.anyReg ? "▲" : "▼";
  const pct = g.stats.maxAbs ? `${sign}${g.stats.maxAbs.toFixed(1)}%` : "";
  const n = g.stats.count;
  return `[${g.repoName}] ${name} · ${n} alert${n === 1 ? "" : "s"} ${pct}`;
}

function sortedGroups() {
  const mode = els.sort.value;
  const arr = groups.slice();
  arr.sort((a, b) => {
    switch (mode) {
      case "alerts-desc":
        return b.stats.count - a.stats.count || b.stats.maxAbs - a.stats.maxAbs;
      case "recent":
        return b.stats.latest.localeCompare(a.stats.latest);
      case "sig":
        return Number(a.sigId) - Number(b.sigId);
      case "amount-desc":
      default:
        return b.stats.maxAbs - a.stats.maxAbs;
    }
  });
  return arr;
}

function matchesFilter(g, term) {
  if (!term) return true;
  const m = g.meta;
  const hay = [
    g.repoName,
    g.sigId,
    `fw${g.frameworkId}`,
    m ? m.suite : "",
    m ? m.test : "",
    m ? m.machine_platform : "",
    (m && m.extra_options ? m.extra_options.join(" ") : ""),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(term);
}

function rebuildDropdown() {
  const term = els.filter.value.trim().toLowerCase();
  const list = sortedGroups().filter((g) => matchesFilter(g, term));

  els.testSelect.innerHTML = "";
  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = list.length ? "Select a test…" : "No tests match the filter";
  els.testSelect.appendChild(blank);

  for (const g of list) {
    const opt = document.createElement("option");
    opt.value = g.key;
    opt.textContent = groupLabel(g);
    els.testSelect.appendChild(opt);
  }
  els.testSelect.disabled = false;

  // Preserve the current selection if it survived the filter.
  if (selectedKey && list.some((g) => g.key === selectedKey)) {
    els.testSelect.value = selectedKey;
  }

  els.testCount.textContent = `${list.length} of ${groups.length} test${
    groups.length === 1 ? "" : "s"
  } · ${groups.reduce((s, g) => s + g.stats.count, 0)} alerts total`;
}

// --- detail rendering ------------------------------------------------------

function intervalSeconds() {
  const days = parseInt(els.interval.value, 10);
  return (days > 0 ? days : 90) * DAY;
}

// --- deep linking ----------------------------------------------------------
//
// The URL hash captures the current view so it can be shared:
//   #test=<repoId>:<sigId>            -> open this test
//   #test=<repoId>:<sigId>&alert=<id> -> open it and highlight one alert

function buildShareUrl(key, alertId) {
  const p = new URLSearchParams();
  p.set("test", key);
  if (alertId != null && alertId !== "") p.set("alert", String(alertId));
  return `${location.origin}${location.pathname}#${p.toString()}`;
}

function updateHash(key, alertId) {
  const p = new URLSearchParams();
  p.set("test", key);
  if (alertId != null && alertId !== "") p.set("alert", String(alertId));
  const newHash = `#${p.toString()}`;
  if (location.hash !== newHash) {
    suppressHashChange = true;
    location.hash = newHash;
  }
}

function parseHash() {
  const h = location.hash.replace(/^#/, "");
  if (!h) return null;
  const p = new URLSearchParams(h);
  const key = p.get("test");
  if (!key) return null;
  return { key, alertId: p.get("alert") };
}

// Honor a deep link in the current hash (called on load and on hashchange).
function applyHash() {
  const sel = parseHash();
  if (!sel || !groupByKey.has(sel.key)) return;
  els.testSelect.value = sel.key;
  selectGroup(sel.key, sel.alertId, false);
}

async function copyShareLink(key, alertId) {
  const url = buildShareUrl(key, alertId);
  try {
    await navigator.clipboard.writeText(url);
    setStatus(`Copied link to clipboard: ${url}`);
  } catch (_e) {
    setStatus(`Link: ${url}`);
  }
}

async function selectGroup(key, focusAlert = null, updateUrl = true) {
  selectedKey = key;
  focusAlertId = focusAlert != null && focusAlert !== "" ? String(focusAlert) : null;
  const g = groupByKey.get(key);
  if (!g) return;
  if (updateUrl) updateHash(key, focusAlertId);

  els.placeholder.classList.add("hidden");
  els.detail.classList.remove("hidden");

  const interval = intervalSeconds();
  const dataKey = `${key}:${interval}`;
  const cached = dataCache.get(dataKey);
  if (cached && g.meta) {
    renderDetail(g, cached);
    setStatus(`Showing ${cached.length} data points for signature ${g.sigId}.`);
    return;
  }

  setStatus(`Fetching data for signature ${g.sigId} (${g.repoName})…`);
  try {
    const [meta, data] = await Promise.all([
      g.meta
        ? Promise.resolve(g.meta)
        : AlertQuery.fetchSignatureMeta(g.repoName, g.sigId),
      cached
        ? Promise.resolve(cached)
        : AlertQuery.fetchSignatureData(g.repoName, g.sigId, interval),
    ]);
    if (selectedKey !== key) return; // selection changed while fetching
    dataCache.set(dataKey, data);
    if (meta) {
      g.meta = meta;
      metaCache.set(key, meta);
    }
    renderDetail(g, data);
    setStatus(`Loaded ${data.length} data points for signature ${g.sigId}.`);
  } catch (e) {
    setStatus(`Failed to load signature ${g.sigId}: ${e.message}`, true);
  }
}

function renderDetail(g, data) {
  const m = g.meta || {};
  const title = m.suite
    ? `${m.suite}${m.test ? " / " + m.test : ""}`
    : `Signature ${g.sigId}`;
  els.detailTitle.textContent = title;

  const plat = platformInfo(m.machine_platform);
  els.detailPlatform.className = `platform os-${plat.os}`;
  els.detailPlatform.innerHTML = m.machine_platform
    ? `<span class="platform-icon">${plat.icon}</span><span class="platform-name">${m.machine_platform}</span>`
    : "";

  const unit = m.measurement_unit ? ` (${m.measurement_unit})` : "";
  els.detailMeta.innerHTML = [
    `<span>${g.repoName}</span>`,
    `<span>sig ${g.sigId}</span>`,
    `<span>fw ${g.frameworkId}</span>`,
    `<span>${g.stats.count} alert${g.stats.count === 1 ? "" : "s"}</span>`,
    `<span>${data.length} data points</span>`,
    m.measurement_unit ? `<span>unit: ${m.measurement_unit}</span>` : "",
    (m.extra_options || []).length
      ? `<span>options: ${m.extra_options.join(", ")}</span>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  // Link to Perfherder's own graph for this signature for cross-checking.
  const graphUrl = `${AlertQuery.TH_BASE_URL}/perfherder/graphs?series=${encodeURIComponent(
    `${g.repoName},${g.sigId},1,${g.frameworkId}`
  )}`;
  els.detailLinks.innerHTML =
    `<a href="${buildShareUrl(g.key)}" class="share-test" title="Copy a shareable link to this test">🔗 Copy link</a>` +
    `<a href="${graphUrl}" target="_blank" rel="noopener">Open in Perfherder ↗</a>`;

  buildChart(g, data, unit);
  renderAlertTable(g, data);
  focusSelectedAlert();
}

// Scroll to and flash the highlighted alert row, if one is linked.
function focusSelectedAlert() {
  if (!focusAlertId) return;
  const row = els.alertTableBody.querySelector(
    `tr[data-alert-id="${focusAlertId}"]`
  );
  if (!row) return;
  row.scrollIntoView({ behavior: "smooth", block: "center" });
  row.classList.add("flash");
  setTimeout(() => row.classList.remove("flash"), 2000);
}

function toPoints(data) {
  return data.map((d) => ({
    x: d.push_timestamp * 1000,
    y: d.value,
    rev: d.revision,
    jobId: d.job_id,
    pushId: d.push_id,
  }));
}

// One marker per distinct alert push, placed on the series at the value recorded
// for that push. Several alert rows can share a push (e.g. different detection
// methods) — they're merged so the chart shows one marker per location.
function buildAlertMarkers(g, data) {
  const valueByPush = new Map();
  for (const d of data) {
    // Last value wins if a push has retriggers; good enough for placement.
    valueByPush.set(d.push_id, d);
  }
  const byPush = new Map();
  for (const a of g.alerts) {
    let e = byPush.get(a.pushId);
    if (!e) {
      e = { pushId: a.pushId, alerts: [] };
      byPush.set(a.pushId, e);
    }
    e.alerts.push(a);
  }

  const markers = [];
  const missing = [];
  for (const e of byPush.values()) {
    const datum = valueByPush.get(Number(e.pushId)) || valueByPush.get(e.pushId);
    if (datum) {
      markers.push({
        x: datum.push_timestamp * 1000,
        y: datum.value,
        rev: datum.revision,
        pushId: e.pushId,
        alerts: e.alerts,
        isRegression: e.alerts.some((a) => a.isRegression),
        focused:
          focusAlertId != null &&
          e.alerts.some((a) => String(a.id) === focusAlertId),
      });
    } else {
      missing.push(e.pushId);
    }
  }
  markers.sort((a, b) => a.x - b.x);
  return { markers, missing };
}

function buildChart(g, data, unit) {
  if (chart) {
    chart.destroy();
    chart = null;
  }
  const canvas = document.getElementById("chart");
  const isLine = els.chartType.value === "line";
  const { markers, missing } = buildAlertMarkers(g, data);

  // A dashed vertical line for every alert location, colored by direction. A
  // linked (focused) alert gets a solid, thicker gold line so it stands out.
  const annotations = {};
  markers.forEach((mk, i) => {
    annotations[`alert-${i}`] = {
      type: "line",
      xMin: mk.x,
      xMax: mk.x,
      borderColor: mk.focused
        ? "rgba(240,160,32,0.95)"
        : mk.isRegression
          ? "rgba(214,51,132,0.55)"
          : "rgba(26,127,71,0.55)",
      borderWidth: mk.focused ? 3 : 1.5,
      borderDash: mk.focused ? [] : [5, 4],
    };
  });

  els.alertNote.textContent = missing.length
    ? `Note: ${missing.length} alert push${
        missing.length === 1 ? "" : "es"
      } fell outside the ${els.interval.value}-day window and aren't marked (push ${missing.join(
        ", "
      )}). Increase the interval to include them.`
    : "";

  chart = new Chart(canvas.getContext("2d"), {
    type: isLine ? "line" : "scatter",
    data: {
      datasets: [
        {
          label: "value",
          data: toPoints(data),
          backgroundColor: "#0d6efd",
          borderColor: "#0d6efd",
          pointRadius: 2.5,
          pointHoverRadius: 5,
          showLine: isLine,
          borderWidth: isLine ? 1.5 : 1,
          tension: 0.1,
          order: 2,
        },
        {
          label: "alert",
          type: "scatter",
          data: markers,
          backgroundColor: markers.map((m) =>
            m.isRegression ? "#d63384" : "#1a7f47"
          ),
          borderColor: markers.map((m) => (m.focused ? "#f0a020" : "#fff")),
          borderWidth: markers.map((m) => (m.focused ? 3 : 1)),
          pointStyle: "triangle",
          pointRadius: markers.map((m) => (m.focused ? 12 : 8)),
          pointHoverRadius: markers.map((m) => (m.focused ? 14 : 11)),
          showLine: false,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: "nearest", intersect: false },
      onClick: (_evt, elements, chart) => {
        if (!elements.length) return;
        const { datasetIndex, index } = elements[0];
        const point = chart.data.datasets[datasetIndex].data[index];
        const params = new URLSearchParams({ repo: g.repoName });
        if (point.rev) params.set("revision", point.rev);
        if (point.jobId != null) params.set("selectedJob", String(point.jobId));
        window.open(
          `${AlertQuery.TH_BASE_URL}/jobs?${params.toString()}`,
          "_blank",
          "noopener"
        );
      },
      onHover: (evt, elements) => {
        evt.native.target.style.cursor = elements.length ? "pointer" : "default";
      },
      scales: {
        x: {
          type: "time",
          time: { tooltipFormat: "yyyy-MM-dd HH:mm", unit: "day" },
          ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
        },
        y: { title: { display: true, text: `value${unit}` } },
      },
      plugins: {
        legend: { position: "top", labels: { boxWidth: 12, usePointStyle: true } },
        annotation: { annotations },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              if (ctx.dataset.label === "alert") {
                const mk = ctx.raw;
                return `${mk.alerts.length} alert${
                  mk.alerts.length === 1 ? "" : "s"
                } here (value ${mk.y})`;
              }
              return `value: ${ctx.parsed.y}`;
            },
            afterLabel: (ctx) => {
              const lines = [];
              if (ctx.dataset.label === "alert") {
                const mk = ctx.raw;
                for (const a of mk.alerts) {
                  const dir = a.isRegression ? "regression" : "improvement";
                  const pct = a.amountPct != null ? `${a.amountPct.toFixed(1)}%` : "?";
                  lines.push(`#${a.id} ${dir} ${pct} — ${a.detectionMethod}`);
                }
                if (mk.rev) lines.push(`rev: ${String(mk.rev).slice(0, 12)}`);
              } else if (ctx.raw.rev) {
                lines.push(`rev: ${String(ctx.raw.rev).slice(0, 12)}`);
                lines.push("click to open job in Treeherder");
              }
              return lines;
            },
          },
        },
        zoom: {
          pan: { enabled: true, mode: "x" },
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
        },
      },
    },
  });
}

function renderAlertTable(g, data) {
  const valueByPush = new Set(data.map((d) => d.push_id));
  const alerts = g.alerts.slice().sort((a, b) => b.created.localeCompare(a.created));
  els.alertTableBody.innerHTML = alerts
    .map((a) => {
      const inWindow = valueByPush.has(Number(a.pushId)) || valueByPush.has(a.pushId);
      const dir = a.isRegression
        ? '<span class="dir reg">▲ reg</span>'
        : '<span class="dir imp">▼ imp</span>';
      const pct = a.amountPct != null ? `${a.amountPct.toFixed(1)}%` : "—";
      const prevNew =
        a.prevValue != null && a.newValue != null
          ? `${a.prevValue.toFixed(2)} → ${a.newValue.toFixed(2)}`
          : "—";
      const pushCell = inWindow
        ? a.pushId
        : `<span title="outside chart window">${a.pushId}*</span>`;
      const focused = focusAlertId === String(a.id);
      return `<tr data-alert-id="${a.id}"${focused ? ' class="focused"' : ""}>
        <td><a class="alert-link" data-alert-id="${a.id}" href="${buildShareUrl(
          g.key,
          a.id
        )}">#${a.id}</a></td>
        <td>${a.created}</td>
        <td>${pushCell}</td>
        <td>${pct}</td>
        <td>${prevNew}</td>
        <td>${dir}</td>
        <td class="method" title="${a.detectionMethod}">${a.detectionMethod}</td>
        <td>${ALERT_STATUS[a.status] || a.status}</td>
        <td><button class="copy-link" data-alert-id="${a.id}" title="Copy link to this alert">🔗</button></td>
      </tr>`;
    })
    .join("");
}

// --- background name enrichment --------------------------------------------

// Fetch suite/test/platform metadata for every group so the dropdown shows
// readable names and the filter can match on them. Concurrency-limited; the
// user opts in via the button because it's one request per signature.
async function loadAllNames() {
  const todo = groups.filter((g) => !g.meta);
  if (!todo.length) {
    setStatus("All test names already loaded.");
    return;
  }
  els.namesBtn.disabled = true;
  const CONCURRENCY = 12;
  let done = 0;
  let idx = 0;

  const worker = async () => {
    while (idx < todo.length) {
      const g = todo[idx++];
      try {
        const meta = await AlertQuery.fetchSignatureMeta(g.repoName, g.sigId);
        if (meta) {
          g.meta = meta;
          metaCache.set(g.key, meta);
        }
      } catch (_e) {
        /* leave this one unnamed; keep going */
      }
      done += 1;
      if (done % 25 === 0 || done === todo.length) {
        setStatus(`Loading test names… ${done}/${todo.length}`);
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  rebuildDropdown();
  setStatus(`Loaded names for ${todo.length} tests.`);
  els.namesBtn.disabled = false;
}

// --- bootstrap -------------------------------------------------------------

async function loadAlerts() {
  els.reloadBtn.disabled = true;
  els.namesBtn.disabled = true;
  els.testSelect.disabled = true;
  els.filter.disabled = true;
  setStatus("Fetching alerts from redash…");
  try {
    if (!Object.keys(repoMap).length) {
      repoMap = await AlertQuery.fetchRepositoryMap();
    }
    const rows = await AlertQuery.fetchAlertRows();
    dataCache.clear();
    groups = buildGroups(rows);
    // Re-apply any metadata we fetched earlier this session.
    groupByKey = new Map();
    for (const g of groups) {
      groupByKey.set(g.key, g);
      if (metaCache.has(g.key)) g.meta = metaCache.get(g.key);
    }
    els.filter.disabled = false;
    els.namesBtn.disabled = false;
    rebuildDropdown();
    setStatus(`Loaded ${rows.length} alert rows across ${groups.length} tests.`);
    // Honor a deep link (#test=…&alert=…) once the groups exist.
    applyHash();
  } catch (e) {
    setStatus(
      `Failed to load alerts: ${e.message}. (Redash may require being logged in to telemetry.mozilla.org.)`,
      true
    );
  } finally {
    els.reloadBtn.disabled = false;
  }
}

// --- wiring ----------------------------------------------------------------

els.testSelect.addEventListener("change", () => {
  const key = els.testSelect.value;
  if (key) selectGroup(key);
});

// Deep-link routing: react to hash changes we didn't make ourselves (manual
// edits, back/forward, pasted links).
window.addEventListener("hashchange", () => {
  if (suppressHashChange) {
    suppressHashChange = false;
    return;
  }
  applyHash();
});

// Clicking an alert's "#id" link focuses it; the 🔗 button copies a shareable
// URL. Both keep the address bar in sync via the hash.
els.alertTableBody.addEventListener("click", (evt) => {
  const copyBtn = evt.target.closest(".copy-link");
  if (copyBtn) {
    evt.preventDefault();
    const id = copyBtn.dataset.alertId;
    selectGroup(selectedKey, id, true);
    copyShareLink(selectedKey, id);
    return;
  }
  const link = evt.target.closest(".alert-link");
  if (link) {
    evt.preventDefault();
    selectGroup(selectedKey, link.dataset.alertId, true);
  }
});

// "Copy link" in the detail header copies a link to the whole test.
els.detailLinks.addEventListener("click", (evt) => {
  const share = evt.target.closest(".share-test");
  if (!share) return;
  evt.preventDefault();
  copyShareLink(selectedKey, null);
});
els.filter.addEventListener("input", debounce(rebuildDropdown, 200));
els.sort.addEventListener("change", rebuildDropdown);
els.chartType.addEventListener("change", () => {
  if (selectedKey) selectGroup(selectedKey);
});
els.interval.addEventListener("change", () => {
  if (selectedKey) selectGroup(selectedKey);
});
els.reloadBtn.addEventListener("click", loadAlerts);
els.namesBtn.addEventListener("click", loadAllNames);

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

loadAlerts();
