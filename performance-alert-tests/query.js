// Data access for the Telemetry Alert Tests dashboard.
//
// Two sources:
//   1. Redash query 117898 — the telemetry-alert table (PerformanceAlertTesting
//      rows). Each row points at a real Treeherder performance signature via
//      `series_signature_id` and records where the alert fired (`push_id`).
//   2. Treeherder performance REST API — the actual test time-series for those
//      signatures, plus their human-readable metadata (suite/test/platform).
//
// The dashboard overlays (2) with the alert locations from (1).

const REDASH_QUERY_ID = 117898;
const REDASH_API_KEY = "uxgQwqWKeymE0K4EF62Dp3WjfpfZttZxGp0oZh9c";
const REDASH_URL = `https://sql.telemetry.mozilla.org/api/queries/${REDASH_QUERY_ID}/results.json?api_key=${REDASH_API_KEY}`;

const TH_BASE_URL = "https://treeherder.mozilla.org";

function buildUrl(baseUrl, path, params) {
  const url = new URL(path, baseUrl);
  for (const [key, value] of params) url.searchParams.append(key, value);
  return url.toString();
}

async function fetchJson(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return resp.json();
}

// --- redash alert rows -----------------------------------------------------

// Fetch the alert rows from redash. Returns an array of plain objects keyed by
// column name (the same shape as test_data.csv).
async function fetchAlertRows() {
  const json = await fetchJson(REDASH_URL);
  const data = json.query_result && json.query_result.data;
  if (!data || !Array.isArray(data.rows)) {
    throw new Error("Unexpected redash response shape");
  }
  return data.rows;
}

// --- treeherder metadata + data --------------------------------------------

// repository_id -> repository name (e.g. 77 -> "autoland"). The perf API is
// per-project, so we need the name to build URLs.
async function fetchRepositoryMap() {
  const repos = await fetchJson(`${TH_BASE_URL}/api/repository/`);
  const map = {};
  for (const r of repos) map[r.id] = r.name;
  return map;
}

// Fetch signature metadata (suite/test/platform/unit/...) for a single
// signature id on a repo. Returns the props object or null.
async function fetchSignatureMeta(repo, signatureId) {
  const url = buildUrl(TH_BASE_URL, `/api/project/${repo}/performance/signatures/`, [
    ["id", signatureId],
  ]);
  const json = await fetchJson(url);
  return json[String(signatureId)] || Object.values(json)[0] || null;
}

// Fetch the performance time-series for a signature id. `intervalSeconds` is the
// look-back window. Returns an array of datums sorted by push_timestamp.
async function fetchSignatureData(repo, signatureId, intervalSeconds) {
  const url = buildUrl(TH_BASE_URL, `/api/project/${repo}/performance/data/`, [
    ["signature_id", signatureId],
    ["interval", intervalSeconds],
  ]);
  const json = await fetchJson(url);
  const out = [];
  for (const datums of Object.values(json)) {
    for (const d of datums) out.push(d);
  }
  out.sort((a, b) => a.push_timestamp - b.push_timestamp);
  return out;
}

window.AlertQuery = {
  fetchAlertRows,
  fetchRepositoryMap,
  fetchSignatureMeta,
  fetchSignatureData,
  TH_BASE_URL,
  REDASH_QUERY_ID,
};
