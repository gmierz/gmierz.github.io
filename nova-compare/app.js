// Nova Compare dashboard: renders one chart per nova/opposite pair.

let allPairs = []; // full result set
let filtered = []; // currently displayed subset
let currentRepo = "mozilla-central"; // repo of the last query, for job links
const charts = new Map(); // canvas id -> Chart instance (lazily created)

const els = {
  repo: document.getElementById("repo-input"),
  framework: document.getElementById("framework-input"),
  interval: document.getElementById("interval-input"),
  replicates: document.getElementById("replicates-input"),
  runBtn: document.getElementById("run-btn"),
  filter: document.getElementById("filter-input"),
  minPoints: document.getElementById("min-points"),
  includeSubtests: document.getElementById("include-subtests"),
  sort: document.getElementById("sort-select"),
  chartType: document.getElementById("chart-type-select"),
  status: document.getElementById("status"),
  count: document.getElementById("pair-count"),
  grid: document.getElementById("grid"),
};

function setStatus(msg, isError = false) {
  els.status.textContent = msg;
  els.status.classList.toggle("error", isError);
}

function fmtDate(ts) {
  return new Date(ts * 1000).toISOString().slice(0, 16).replace("T", " ");
}

function pairTitle(p) {
  const test = p.test ? ` / ${p.test}` : "";
  return `${p.suite}${test}`;
}

// Map a Treeherder machine_platform string to an OS icon + class for at-a-glance
// recognition (e.g. "linux1804-64-shippable-qr", "windows11-64", "macosx1015").
function platformInfo(platform) {
  const p = (platform || "").toLowerCase();
  if (p.includes("android")) return { icon: "🤖", os: "android" };
  if (p.includes("win")) return { icon: "🪟", os: "windows" };
  if (p.includes("mac") || p.includes("osx") || p.includes("darwin"))
    return { icon: "🍎", os: "macos" };
  if (p.includes("linux")) return { icon: "🐧", os: "linux" };
  return { icon: "🖥️", os: "other" };
}

function deltaPct(p) {
  // Mean nova value vs mean opposite value, as a percentage.
  const mean = (arr) =>
    arr.length ? arr.reduce((s, d) => s + d.value, 0) / arr.length : null;
  const n = mean(p.nova_performance_data);
  const o = mean(p.opposite_performance_data);
  if (n == null || o == null || o === 0) return null;
  return ((n - o) / o) * 100;
}

// --- rendering -------------------------------------------------------------

function applyFilter() {
  const term = els.filter.value.trim().toLowerCase();
  const minPts = parseInt(els.minPoints.value, 10) || 0;
  const includeSubtests = els.includeSubtests.checked;
  filtered = allPairs.filter((p) => {
    // A subtest is any signature with a non-empty `test` field.
    if (!includeSubtests && p.test) return false;
    if (p.nova_datum_count < minPts) return false;
    if (!term) return true;
    const hay = `${p.suite} ${p.test} ${p.machine_platform} ${(
      p.nova_extra_options || []
    ).join(" ")}`.toLowerCase();
    return hay.includes(term);
  });
  sortPairs();
  renderGrid();
}

function sortPairs() {
  const mode = els.sort.value;
  if (mode === "none") return;

  if (mode === "platform") {
    // Group by OS first, then by the full platform string, then by title so
    // related pairs sit next to each other.
    filtered.sort((a, b) => {
      const oa = platformInfo(a.machine_platform).os;
      const ob = platformInfo(b.machine_platform).os;
      return (
        oa.localeCompare(ob) ||
        (a.machine_platform || "").localeCompare(b.machine_platform || "") ||
        pairTitle(a).localeCompare(pairTitle(b))
      );
    });
    return;
  }

  // Pairs with no computable delta sink to the bottom.
  const key = (p) => {
    const d = deltaPct(p);
    if (d == null) return null;
    return mode === "abs-desc" ? Math.abs(d) : d;
  };
  filtered.sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka == null && kb == null) return 0;
    if (ka == null) return 1;
    if (kb == null) return -1;
    return mode === "asc" ? ka - kb : kb - ka;
  });
}

function renderGrid() {
  // Tear down existing charts before rebuilding the DOM.
  for (const c of charts.values()) c.destroy();
  charts.clear();
  els.grid.innerHTML = "";

  els.count.textContent = `${filtered.length} pair${
    filtered.length === 1 ? "" : "s"
  } shown (of ${allPairs.length})`;

  if (filtered.length === 0) {
    els.grid.innerHTML = '<p class="empty">No pairs match the current filter.</p>';
    return;
  }

  filtered.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "card";

    const d = deltaPct(p);
    let badge = "";
    if (d != null) {
      const cls = d > 0 ? "up" : d < 0 ? "down" : "flat";
      const sign = d > 0 ? "+" : "";
      badge = `<span class="badge ${cls}" title="mean nova vs mean opposite">${sign}${d.toFixed(
        1
      )}%</span>`;
    }

    const plat = platformInfo(p.machine_platform);

    card.innerHTML = `
      <div class="card-head">
        <div class="card-title" title="${pairTitle(p)}">${pairTitle(p)}</div>
        ${badge}
      </div>
      <div class="platform os-${plat.os}" title="${p.machine_platform}">
        <span class="platform-icon" aria-hidden="true">${plat.icon}</span>
        <span class="platform-name">${p.machine_platform}</span>
      </div>
      <div class="card-meta">
        <span>fw ${p.framework_id}</span>
        <span>nova: ${p.nova_datum_count} pts</span>
        <span>opp: ${p.opposite_datum_count} pts</span>
      </div>
      <div class="card-meta sub">
        <span>options: ${(p.nova_extra_options || []).join(", ")}</span>
      </div>
      <div class="chart-wrap"><canvas id="chart-${i}"></canvas></div>
      <div class="card-foot">
        <span>nova sig ${p.nova_signature_id}</span>
        <span>opp sig ${p.opposite_signature_id}</span>
        <span>from ${fmtDate(p.nova_start_date)}</span>
      </div>`;

    card.dataset.index = String(i);
    els.grid.appendChild(card);
  });

  observeCards();
}

// Lazily build charts only when their card scrolls into view (there can be
// hundreds of pairs, and one Chart.js instance each is expensive).
let observer = null;
function observeCards() {
  if (observer) observer.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const card = entry.target;
        const idx = parseInt(card.dataset.index, 10);
        buildChart(idx, `chart-${idx}`);
        observer.unobserve(card);
      }
    },
    { rootMargin: "200px" }
  );
  els.grid.querySelectorAll(".card").forEach((c) => observer.observe(c));
}

function toPoints(data) {
  return data.map((d) => ({
    x: d.push_timestamp * 1000,
    y: d.value,
    rev: d.revision,
    jobId: d.job_id,
  }));
}

// Build the Treeherder jobs URL for a single data point.
function jobUrl(point) {
  const params = new URLSearchParams({ repo: currentRepo });
  if (point.rev) params.set("revision", point.rev);
  if (point.jobId != null) params.set("selectedJob", String(point.jobId));
  return `${NovaQuery.DEFAULT_BASE_URL}/jobs?${params.toString()}`;
}

function buildChart(idx, canvasId) {
  if (charts.has(canvasId)) return;
  const p = filtered[idx];
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const isLine = els.chartType.value === "line";
  const dataset = (label, data, color) => ({
    label,
    data,
    backgroundColor: color,
    borderColor: color,
    pointRadius: 3,
    pointHoverRadius: 5,
    // Line-only styling; ignored when showLine is false (scatter).
    showLine: isLine,
    borderWidth: isLine ? 1.5 : 1,
    tension: 0.1,
  });

  const chart = new Chart(canvas.getContext("2d"), {
    type: isLine ? "line" : "scatter",
    data: {
      datasets: [
        dataset("nova", toPoints(p.nova_performance_data), "#d63384"),
        dataset("opposite", toPoints(p.opposite_performance_data), "#0d6efd"),
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: "nearest", intersect: false },
      // Open the Treeherder job for the clicked data point.
      onClick: (_evt, elements, chart) => {
        if (!elements.length) return;
        const { datasetIndex, index } = elements[0];
        const point = chart.data.datasets[datasetIndex].data[index];
        window.open(jobUrl(point), "_blank", "noopener");
      },
      // Show a pointer cursor when hovering over a clickable point.
      onHover: (evt, elements) => {
        evt.native.target.style.cursor = elements.length ? "pointer" : "default";
      },
      scales: {
        x: {
          type: "time",
          time: { tooltipFormat: "yyyy-MM-dd HH:mm", unit: "day" },
          ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
        },
        y: { title: { display: true, text: "value" } },
      },
      plugins: {
        legend: { position: "top", labels: { boxWidth: 12 } },
        tooltip: {
          callbacks: {
            afterLabel: (ctx) => {
              const lines = [];
              if (ctx.raw.rev) lines.push(`rev: ${String(ctx.raw.rev).slice(0, 12)}`);
              lines.push("click to open job in Treeherder");
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
  charts.set(canvasId, chart);
}

// --- data loading ----------------------------------------------------------

function loadPairs(pairs) {
  allPairs = pairs;
  applyFilter();
}

async function runLive() {
  const frameworks = els.framework.value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const days = parseInt(els.interval.value, 10);
  const interval = days > 0 ? days * 24 * 60 * 60 : NovaQuery.DEFAULT_INTERVAL;
  currentRepo = els.repo.value.trim() || "mozilla-central";
  const wantReplicates = els.replicates.checked;
  els.runBtn.disabled = true;
  try {
    const pairs = await NovaQuery.runNovaQuery({
      repo: currentRepo,
      frameworks,
      interval,
      replicates: wantReplicates,
      onStatus: (m) => setStatus(m),
    });
    // Replicate values only exist on subtest signatures (the leaf measurements);
    // suite-level signatures carry a single aggregated value. Auto-enable the
    // subtests view so the replicate spread is actually visible.
    if (wantReplicates && !els.includeSubtests.checked) {
      els.includeSubtests.checked = true;
    }
    loadPairs(pairs);
    const note = wantReplicates
      ? " (replicates — subtests enabled to show them)"
      : "";
    setStatus(`Loaded ${pairs.length} pairs from Treeherder live query${note}`);
  } catch (e) {
    setStatus(`Query failed: ${e.message}`, true);
  } finally {
    els.runBtn.disabled = false;
  }
}

// --- wiring ----------------------------------------------------------------

els.runBtn.addEventListener("click", runLive);
els.filter.addEventListener("input", debounce(applyFilter, 200));
els.minPoints.addEventListener("input", debounce(applyFilter, 200));
els.includeSubtests.addEventListener("change", applyFilter);
els.sort.addEventListener("change", applyFilter);
els.chartType.addEventListener("change", renderGrid);

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

setStatus("Set your repo/framework/interval and click “Run query”.");
