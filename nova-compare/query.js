// JavaScript port of test_nova_query_api.py.
//
// Reproduces the nova-vs-opposite pairing using the public Treeherder
// performance REST API. For a given repo it:
//   1. fetches all performance signatures,
//   2. selects those carrying the `nova` extra option,
//   3. pairs each with its "opposite" signature (identical suite/test/platform/
//      option-collection/application and the same extra options *minus* nova),
//   4. fetches the perf data for both, and
//   5. clips the opposite's data to start at the nova signature's earliest date.
//
// The result is an array of pair objects matching the shape of out.json.

const DEFAULT_BASE_URL = "https://treeherder.mozilla.org";
const DEFAULT_INTERVAL = 30 * 24 * 60 * 60; // 30 days, in seconds
const NOVA = "nova";
// Keep request URLs under server/proxy length limits.
const SIGNATURE_BATCH = 100;

function buildUrl(baseUrl, path, params) {
  const url = new URL(path, baseUrl);
  for (const [key, value] of params) {
    url.searchParams.append(key, value);
  }
  return url.toString();
}

async function fetchJson(url) {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} for ${url}`);
  }
  return resp.json();
}

async function fetchSignatures(baseUrl, repo, frameworks, interval) {
  const params = [["interval", interval]];
  for (const fw of frameworks) {
    params.push(["framework", fw]);
  }
  const url = buildUrl(baseUrl, `/api/project/${repo}/performance/signatures/`, params);
  return fetchJson(url);
}

async function fetchData(baseUrl, repo, signatureIds, interval, onProgress) {
  // Return {signature_id: [datum, ...]} for the given signature ids.
  const bySignature = {};
  const ids = Array.from(signatureIds);
  for (let start = 0; start < ids.length; start += SIGNATURE_BATCH) {
    const batch = ids.slice(start, start + SIGNATURE_BATCH);
    const params = [["interval", interval]];
    for (const sid of batch) {
      params.push(["signature_id", sid]);
    }
    const url = buildUrl(baseUrl, `/api/project/${repo}/performance/data/`, params);
    const json = await fetchJson(url);
    // Response is keyed by signature_hash; regroup by signature_id since a
    // nova and its opposite are distinct ids (and we requested by id).
    for (const datums of Object.values(json)) {
      for (const datum of datums) {
        (bySignature[datum.signature_id] ||= []).push(datum);
      }
    }
    if (onProgress) {
      onProgress(Math.min(start + SIGNATURE_BATCH, ids.length), ids.length);
    }
  }
  return bySignature;
}

// Number of replicate requests to keep in flight at once. Replicate data is
// only available via the per-signature /performance/summary/ endpoint, so a
// query needs one request per signature; cap concurrency to be a good citizen.
const REPLICATE_CONCURRENCY = 8;

// The summary endpoint serializes push_timestamp as a naive ISO string in UTC
// (e.g. "2026-06-09T21:08:30", no timezone). Treat it as UTC so it matches the
// epoch-seconds the /performance/data/ endpoint returns; otherwise the points
// shift by the local timezone offset.
function toEpochSeconds(ts) {
  if (typeof ts === "number") return ts;
  const utc = /[zZ]|[+-]\d\d:?\d\d$/.test(ts) ? ts : ts + "Z";
  return Math.floor(new Date(utc).getTime() / 1000);
}

async function fetchReplicateData(baseUrl, repo, signatureIds, interval, onProgress) {
  // Return {signature_id: [datum, ...]} with one entry per replicate value.
  //
  // The /performance/summary/ endpoint returns individual replicate values when
  // called with replicates=true&all_data=true&signature=<id>. Datums that have
  // no replicates fall back to their aggregated value server-side, so this is a
  // safe superset of the regular data. Its push_timestamp is an ISO string, so
  // we normalize it back to epoch seconds to match the /performance/data/ shape.
  const bySignature = {};
  const ids = Array.from(signatureIds);
  let done = 0;

  const fetchOne = async (sid) => {
    const params = [
      ["repository", repo],
      ["signature", sid],
      ["all_data", "true"],
      ["replicates", "true"],
      ["interval", interval],
    ];
    const url = buildUrl(baseUrl, `/api/performance/summary/`, params);
    const summary = await fetchJson(url);
    const out = [];
    for (const item of summary) {
      for (const d of item.data || []) {
        out.push({
          id: d.id,
          signature_id: sid,
          job_id: d.job_id,
          push_id: d.push_id,
          revision: d.revision,
          push_timestamp: toEpochSeconds(d.push_timestamp),
          value: d.value,
        });
      }
    }
    bySignature[sid] = out;
    done += 1;
    if (onProgress) onProgress(done, ids.length);
  };

  for (let start = 0; start < ids.length; start += REPLICATE_CONCURRENCY) {
    const batch = ids.slice(start, start + REPLICATE_CONCURRENCY);
    await Promise.all(batch.map(fetchOne));
  }
  return bySignature;
}

function matchKey(props, extraOptions) {
  // Identity of a signature for pairing, ignoring extra_options (passed in
  // separately so we can substitute the nova-stripped variant).
  const extra = [...(extraOptions || [])].sort();
  return JSON.stringify([
    props.framework_id ?? null,
    props.machine_platform ?? null,
    props.option_collection_hash ?? null,
    props.suite ?? null,
    props.test ?? "",
    props.application ?? "",
    extra,
  ]);
}

// Identity of a signature's *suite-level* summary, ignoring the `test` field.
// Two signatures share this key when they belong to the same suite for the same
// platform/options/application/framework — i.e. a subtest and its suite summary.
function suiteLevelKey(props) {
  return JSON.stringify([
    props.framework_id ?? null,
    props.machine_platform ?? null,
    props.option_collection_hash ?? null,
    props.suite ?? null,
    props.application ?? "",
    [...(props.extra_options || [])].sort(),
  ]);
}

// Build the set of suite-level identities that actually exist as their own
// signature (test == ""). A subtest whose suite has no such summary signature
// is a standalone test, not a real subtest.
function suiteLevelSet(signatures) {
  const set = new Set();
  for (const props of Object.values(signatures)) {
    if (!props.test) set.add(suiteLevelKey(props));
  }
  return set;
}

function buildPairs(signatures) {
  // Return [{novaId, novaProps, oppId, oppProps}, ...].
  // Index every signature by its full identity for O(1) opposite lookup.
  const index = new Map();
  for (const [sigId, props] of Object.entries(signatures)) {
    const key = matchKey(props, props.extra_options || []);
    if (!index.has(key)) index.set(key, []);
    index.get(key).push([parseInt(sigId, 10), props]);
  }

  const pairs = [];
  for (const [sigId, props] of Object.entries(signatures)) {
    const extra = props.extra_options || [];
    if (!extra.includes(NOVA)) continue;
    const oppositeExtra = extra.filter((opt) => opt !== NOVA);
    const candidates = index.get(matchKey(props, oppositeExtra)) || [];
    if (candidates.length === 0) continue;
    const [oppId, oppProps] = candidates[0];
    pairs.push({ novaId: parseInt(sigId, 10), novaProps: props, oppId, oppProps });
  }
  return pairs;
}

// Run the full query. Returns an array of pair-result objects (see out.json).
// `opts`: { repo, frameworks, interval, baseUrl, replicates, onStatus }
async function runNovaQuery(opts = {}) {
  const repo = opts.repo || "mozilla-central";
  const frameworks = opts.frameworks || [];
  const interval = opts.interval || DEFAULT_INTERVAL;
  const baseUrl = opts.baseUrl || DEFAULT_BASE_URL;
  const replicates = !!opts.replicates;
  const status = opts.onStatus || (() => {});

  status(`Fetching signatures for repo=${repo} ...`);
  const signatures = await fetchSignatures(baseUrl, repo, frameworks, interval);
  status(`${Object.keys(signatures).length} signatures total`);

  const pairs = buildPairs(signatures);
  const suiteLevels = suiteLevelSet(signatures);
  status(`${pairs.length} nova/opposite pairs`);
  if (pairs.length === 0) return [];

  const neededIds = new Set();
  for (const p of pairs) {
    neededIds.add(p.novaId);
    neededIds.add(p.oppId);
  }
  const kind = replicates ? "replicate data" : "data";
  status(`Fetching ${kind} for ${neededIds.size} signatures ...`);
  const fetcher = replicates ? fetchReplicateData : fetchData;
  const data = await fetcher(baseUrl, repo, neededIds, interval, (done, total) => {
    status(`Fetching ${kind} ... ${done}/${total} signatures`);
  });

  const byTimestamp = (a, b) => a.push_timestamp - b.push_timestamp;
  const results = [];
  for (const { novaId, novaProps, oppId, oppProps } of pairs) {
    const novaData = (data[novaId] || []).slice().sort(byTimestamp);
    if (novaData.length === 0) continue; // no nova data in window
    const novaStart = novaData[0].push_timestamp;
    // Clip the opposite's data to begin at the nova start date.
    const oppData = (data[oppId] || [])
      .filter((d) => d.push_timestamp >= novaStart)
      .sort(byTimestamp);
    results.push({
      nova_signature_id: novaId,
      nova_signature_hash: novaProps.signature_hash,
      nova_extra_options: novaProps.extra_options,
      opposite_signature_id: oppId,
      opposite_signature_hash: oppProps.signature_hash,
      opposite_extra_options: oppProps.extra_options,
      suite: novaProps.suite,
      test: novaProps.test || "",
      // A subtest is only a "real" subtest if its suite has a suite-level
      // summary signature too; otherwise it's a standalone test.
      has_suite_level: !!novaProps.test && suiteLevels.has(suiteLevelKey(novaProps)),
      machine_platform: novaProps.machine_platform,
      framework_id: novaProps.framework_id,
      nova_start_date: novaStart,
      nova_datum_count: novaData.length,
      opposite_datum_count: oppData.length,
      nova_performance_data: novaData,
      opposite_performance_data: oppData,
    });
  }
  status(`${results.length} pairs with nova data`);
  return results;
}

window.NovaQuery = { runNovaQuery, DEFAULT_INTERVAL, DEFAULT_BASE_URL };
