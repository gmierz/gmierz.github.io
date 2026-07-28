// Potential culprit detection for telemetry alerts.
//
// Walks the commits in an alert's push range, pulls the bug number out of each commit
// message, looks those bugs up in Bugzilla, and splits them into best matches — the
// probe's own component or a sibling under the same parent component — and other matches,
// which only share its product. A commit touching the same area as the probe is a far more
// likely cause than the rest of the range, so this narrows a few hundred commits down to a
// handful worth reading.
//
// Sourcing the commits is awkward. hg.mozilla.org's pushlog has exactly the right data
// but sits behind a bot challenge that trips on any browser User-Agent, returning an
// HTML challenge page with no CORS header — and User-Agent is a forbidden header name,
// so page JavaScript cannot work around it. Treeherder's push API is reachable but caps
// `revisions` at 20 per push, hiding most of a wide range. So instead we take the push
// *timestamps* from Treeherder and pull the commits from the Firefox git mirror on
// GitHub, whose API is built for browser use.
//
// That makes the range approximate. GitHub filters on commit date, and git `main` takes
// landings continuously while mozilla-central pushes are periodic merges from autoland,
// so a commit's git date runs hours ahead of the hg push that carried it. Measured
// against the pushlog over three ranges, a WINDOW_LEAD of 6h recovers ~100% of the bugs
// actually in the range (98.8-100%), at the cost of also listing some that landed near
// but outside it (precision 64-99%, worst on merge-day ranges). Recall is what matters
// for culprit hunting; the extra rows are disclosed in the rendered output.
const GITHUB_API = 'https://api.github.com';
const GITHUB_REPO = 'mozilla-firefox/firefox';
const TREEHERDER_API = 'https://treeherder.mozilla.org/api';
const BUGZILLA_REST = 'https://bugzilla.mozilla.org/rest/bug';
const BUGZILLA_SHOW_BUG = 'https://bugzilla.mozilla.org/show_bug.cgi?id=';
const BUG_BATCH_SIZE = 100;

// Which git branch of the mirror corresponds to each hg repository.
const GIT_BRANCH_BY_REPO = {
    'mozilla-central': 'main',
    'autoland': 'autoland',
    'mozilla-beta': 'beta',
    'mozilla-release': 'release',
};

const WINDOW_LEAD_MS = 6 * 60 * 60 * 1000;
const COMMITS_PER_PAGE = 100;
const MAX_COMMIT_PAGES = 15; // 1500 commits; ranges this wide are already unreviewable

// "Bug 12345 - ...", "bug #12345:", "Backed out changeset abc (bug 12345)".
// Requires 4+ digits so revision hashes and version numbers don't match.
const BUG_ID_PATTERN = /\bbugs?\s*[:#]?\s*(\d{4,})/gi;

function escapeHtml(text) {
    return String(text == null ? '' : text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Split a dictionary tag ("Firefox :: Tabbed Browser") into its Bugzilla parts.
function splitComponentTag(tag) {
    if (!tag || !tag.includes('::')) return null;
    const parts = tag.split('::').map(part => part.trim());
    const product = parts.shift();
    const component = parts.join(' :: ');
    if (!product || !component) return null;
    return { product, component };
}

// Bugzilla nests components by prefixing them with their parent: "Networking: HTTP",
// "Networking: Cache" and plain "Networking" are all one team's area. A probe owned by
// one of them is just as easily moved by a change to a sibling, so the family — the text
// before the first colon — is what gets compared, not the full component name.
function componentFamily(component) {
    return String(component || '').split(':')[0].trim();
}

function sameComponentFamily(a, b) {
    const familyA = componentFamily(a).toLowerCase();
    return familyA !== '' && familyA === componentFamily(b).toLowerCase();
}

// Only the first line is scanned: later lines hold review/differential metadata that
// often references unrelated bugs.
function extractBugIds(description) {
    const firstLine = String(description || '').split('\n')[0];
    const ids = new Set();
    let match;
    BUG_ID_PATTERN.lastIndex = 0;
    while ((match = BUG_ID_PATTERN.exec(firstLine)) !== null) {
        ids.add(match[1]);
    }
    return Array.from(ids);
}

function isBackout(description) {
    return /^\s*(back(ed)?\s+out|revert)\b/i.test(String(description || '').split('\n')[0]);
}

function summaryLine(description) {
    return String(description || '').split('\n')[0].trim();
}

function toCommit(message, sha, author, date) {
    return {
        sha,
        author,
        date,
        summary: summaryLine(message),
        bugIds: extractBugIds(message),
        backout: isBackout(message)
    };
}

// Resolve the alert's push range to a time window. Treeherder is the only browser-
// reachable source that understands these hg revisions; we want nothing from it but the
// push timestamps, so the 20-commits-per-push cap on `revisions` is irrelevant here.
async function fetchRangeWindow(repo, fromRevision, toRevision) {
    const url = `${TREEHERDER_API}/project/${encodeURIComponent(repo)}/push/`
        + `?fromchange=${encodeURIComponent(fromRevision)}`
        + `&tochange=${encodeURIComponent(toRevision)}&count=1000`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Treeherder push request failed (HTTP ${response.status})`);
    }
    const data = await response.json();

    const pushes = (data.results || []).sort((a, b) => a.push_timestamp - b.push_timestamp);
    if (!pushes.length) {
        throw new Error('Treeherder has no pushes for this range.');
    }

    // Treeherder's fromchange is inclusive. The oldest push is the last known-good one,
    // so it bounds the window but its own commits are not culprits.
    const inRange = pushes.filter(push =>
        !push.revision.startsWith(fromRevision) && !fromRevision.startsWith(push.revision));
    if (!inRange.length) {
        throw new Error('This alert\'s push range contains no pushes after the last good one.');
    }

    const rangeStart = pushes[0].push_timestamp * 1000;
    const rangeEnd = inRange[inRange.length - 1].push_timestamp * 1000;
    return {
        pushCount: inRange.length,
        rangeStart: new Date(rangeStart),
        rangeEnd: new Date(rangeEnd),
        // Commits land on autoland hours before the merge push that carries them to
        // mozilla-central, so the window has to reach back past the range start.
        windowStart: new Date(rangeStart - WINDOW_LEAD_MS),
        windowEnd: new Date(rangeEnd)
    };
}

// GitHub's unauthenticated quota is 60 requests/hour per IP, and each page of commits
// spends one, so a rate-limited response needs to say so plainly rather than look like a
// range with no commits in it.
async function fetchGitHubJson(url) {
    const response = await fetch(url);
    if (response.status === 403 || response.status === 429) {
        if (response.headers.get('x-ratelimit-remaining') === '0') {
            throw new Error('GitHub\'s API rate limit is exhausted (60 requests/hour for '
                + 'unauthenticated use). Wait for it to reset and try again.');
        }
        throw new Error(`GitHub refused the request (HTTP ${response.status}).`);
    }
    if (!response.ok) {
        throw new Error(`GitHub commit request failed (HTTP ${response.status})`);
    }
    return response.json();
}

// Pull the window's commits from the git mirror, oldest first — the order a sheriff
// would bisect in. GitHub returns newest first, so the pages get reversed at the end.
async function fetchWindowCommits(branch, windowStart, windowEnd) {
    const commits = [];
    let truncated = false;

    for (let page = 1; page <= MAX_COMMIT_PAGES; page++) {
        const url = `${GITHUB_API}/repos/${GITHUB_REPO}/commits`
            + `?sha=${encodeURIComponent(branch)}`
            + `&since=${encodeURIComponent(windowStart.toISOString())}`
            + `&until=${encodeURIComponent(windowEnd.toISOString())}`
            + `&per_page=${COMMITS_PER_PAGE}&page=${page}`;
        const batch = await fetchGitHubJson(url);
        if (!Array.isArray(batch) || !batch.length) break;

        batch.forEach(entry => {
            const commit = entry.commit || {};
            commits.push(toCommit(
                commit.message,
                entry.sha,
                commit.author?.name || entry.author?.login || 'unknown',
                commit.committer?.date ? new Date(commit.committer.date) : null
            ));
        });

        if (batch.length < COMMITS_PER_PAGE) break;
        truncated = page === MAX_COMMIT_PAGES;
    }

    commits.reverse();
    return { commits, truncated };
}

async function fetchRangeCommits(repo, fromRevision, toRevision) {
    const branch = GIT_BRANCH_BY_REPO[repo];
    if (!branch) {
        throw new Error(`No ${GITHUB_REPO} branch is known for the "${repo}" repository.`);
    }

    const window = await fetchRangeWindow(repo, fromRevision, toRevision);
    const { commits, truncated } = await fetchWindowCommits(
        branch, window.windowStart, window.windowEnd);

    return { ...window, branch, commits, truncated };
}

// Bugzilla caps how much it will return per request, so ids go out in batches.
// Bugs the anonymous API can't see (security-restricted) are simply absent from the
// response — the caller reports those as unresolved rather than pretending they matched.
async function fetchBugComponents(bugIds) {
    const bugs = new Map();

    for (let i = 0; i < bugIds.length; i += BUG_BATCH_SIZE) {
        const batch = bugIds.slice(i, i + BUG_BATCH_SIZE);
        const url = `${BUGZILLA_REST}?id=${batch.join(',')}`
            + '&include_fields=id,product,component,summary,status,resolution';
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Bugzilla request failed (HTTP ${response.status})`);
        }
        const data = await response.json();
        (data.bugs || []).forEach(bug => bugs.set(String(bug.id), bug));
    }

    return bugs;
}

/**
 * Find commits in a push range whose bug shares the probe's Bugzilla component family
 * (best matches) or only its product (other matches).
 *
 * @param {object} options
 * @param {string} options.repo           Repository name, e.g. "mozilla-central".
 * @param {string} options.fromRevision   Oldest push revision (exclusive — the last good push).
 * @param {string} options.toRevision     Newest push revision (inclusive).
 * @param {string} options.probeComponent Probe's dictionary tag, e.g. "Firefox :: Tabbed Browser".
 * @returns {Promise<object>} Result consumable by renderCulpritsHTML.
 */
async function findPotentialCulprits({ repo, fromRevision, toRevision, probeComponent }) {
    const target = splitComponentTag(probeComponent);
    if (!target) {
        throw new Error('No Bugzilla component is known for this probe, so culprits cannot be ranked.');
    }
    if (!fromRevision || !toRevision) {
        throw new Error('This alert has no push range to search.');
    }

    const range = await fetchRangeCommits(repo, fromRevision, toRevision);
    const commits = range.commits;

    const allBugIds = Array.from(new Set(commits.flatMap(commit => commit.bugIds)));
    const bugs = await fetchBugComponents(allBugIds);

    // Exact-component and sibling-component hits are both listed as best matches, exact
    // ones first; a sibling is close enough to the probe's area to be worth reading in the
    // same pass, unlike the same-product remainder.
    const bestMatches = [];
    const siblingMatches = [];
    const otherMatches = [];
    const unresolvedBugIds = allBugIds.filter(id => !bugs.has(id));

    commits.forEach(commit => {
        const matchedBugs = commit.bugIds
            .map(id => bugs.get(id))
            .filter(bug => bug && bug.product === target.product);
        if (!matchedBugs.length) return;

        const exact = matchedBugs.some(bug => bug.component === target.component);
        const family = !exact
            && matchedBugs.some(bug => sameComponentFamily(bug.component, target.component));
        const match = exact ? 'component' : family ? 'family' : 'product';
        const entry = { ...commit, bugs: matchedBugs, match };
        (exact ? bestMatches : family ? siblingMatches : otherMatches).push(entry);
    });
    bestMatches.push(...siblingMatches);

    return {
        repo,
        fromRevision,
        toRevision,
        target,
        branch: range.branch,
        pushCount: range.pushCount,
        rangeStart: range.rangeStart,
        rangeEnd: range.rangeEnd,
        windowStart: range.windowStart,
        windowEnd: range.windowEnd,
        truncated: range.truncated,
        commitCount: commits.length,
        bugCount: allBugIds.length,
        unresolvedBugIds,
        bestMatches,
        otherMatches
    };
}

function renderCommitRow(entry) {
    const bugLinks = entry.bugs.map(bug => `
        <a href="${BUGZILLA_SHOW_BUG}${bug.id}" target="_blank" class="bug-link"
           title="${escapeHtml(bug.summary)}" onclick="event.stopPropagation()">${bug.id}</a>`).join(' ');
    const components = Array.from(new Set(entry.bugs.map(bug => bug.component)))
        .map(escapeHtml).join(', ');
    const statuses = Array.from(new Set(entry.bugs.map(
        bug => [bug.status, bug.resolution].filter(Boolean).join(' ')
    ))).map(escapeHtml).join(', ');

    return `
        <tr>
            <td class="culprit-bug">${bugLinks}</td>
            <td>${components}</td>
            <td class="culprit-status">${statuses}</td>
            <td class="culprit-summary">
                <a href="https://github.com/${GITHUB_REPO}/commit/${entry.sha}" target="_blank"
                   class="culprit-rev" onclick="event.stopPropagation()">${entry.sha.slice(0, 12)}</a>
                ${entry.backout ? '<span class="culprit-tag">backout</span>' : ''}
                <span>${escapeHtml(entry.summary)}</span>
            </td>
            <td class="culprit-author">${escapeHtml(entry.author)}</td>
        </tr>
    `;
}

function renderCulpritTable(entries) {
    return `
        <table class="culprit-table">
            <thead>
                <tr><th>Bug</th><th>Component</th><th>Bug Status</th><th>Commit</th><th>Author</th></tr>
            </thead>
            <tbody>${entries.map(renderCommitRow).join('')}</tbody>
        </table>
    `;
}

function renderMatchGroup(entries, title, groupClass, open) {
    if (!entries.length) return '';
    return `
        <div class="culprit-group ${groupClass}">
            <details ${open ? 'open ' : ''}onclick="event.stopPropagation()">
                <summary class="culprit-group-title">
                    ${title} <span class="culprit-count">${entries.length}</span>
                </summary>
                ${renderCulpritTable(entries)}
            </details>
        </div>
    `;
}

// The probe's own component and its siblings under the same parent, exact ones first.
// Open by default — this is the list the button was pressed for.
function renderBestMatches(entries) {
    return renderMatchGroup(entries, 'Best matches', 'culprit-group-exact', true);
}

// Same-product matches are weak evidence — a product like Core covers hundreds of
// commits per range — so they stay collapsed rather than burying the best matches.
function renderOtherMatches(entries) {
    return renderMatchGroup(entries, 'Other matches', 'culprit-group-weak', false);
}

function formatWindowTime(date) {
    return date instanceof Date && !isNaN(date)
        ? date.toISOString().replace('T', ' ').slice(0, 16) + 'Z'
        : 'unknown';
}

function renderCulpritsHTML(result) {
    const { target, bestMatches, otherMatches } = result;
    const targetLabel = escapeHtml(`${target.product} :: ${target.component}`);
    const family = componentFamily(target.component);
    // A component with no parent prefix ("Tabbed Browser") has no siblings to mention.
    const familyNote = family === target.component
        ? ''
        : ` and its <code>${escapeHtml(`${target.product} :: ${family}`)}</code> siblings`;

    const scanned = `Scanned ${result.commitCount} commit${result.commitCount === 1 ? '' : 's'}`
        + ` from mozilla-central spanning the alert's`
        + ` ${result.pushCount} push${result.pushCount === 1 ? '' : 'es'}`
        + ` (${result.bugCount} bug${result.bugCount === 1 ? '' : 's'} referenced).`;

    // Bugs the anonymous Bugzilla API can't see are holes in that scan, so the count
    // belongs next to it rather than in a footnote below the tables.
    const unresolved = result.unresolvedBugIds.length;
    const unresolvedNote = unresolved
        ? ` ${unresolved} referenced bug${unresolved === 1 ? ' was' : 's were'} not readable by
           Bugzilla's public API (likely security-restricted) and could not be checked.`
        : '';

    // The window is wider than the push range on purpose — see WINDOW_LEAD_MS. Say so,
    // because a listed commit is not guaranteed to be inside the range.
    const approximateNote = `<p class="culprit-note">Commits are matched by the date range: 
        ${formatWindowTime(result.windowStart)} - ${formatWindowTime(result.windowEnd)}.
        Confirm against
        <a href="https://hg.mozilla.org/${encodeURIComponent(result.repo)}/pushloghtml?fromchange=${encodeURIComponent(result.fromRevision)}&amp;tochange=${encodeURIComponent(result.toRevision)}"
           target="_blank" onclick="event.stopPropagation()">the pushlog</a> before acting on a result.</p>`;

    const caveats = [];
    if (result.truncated) {
        caveats.push(`The commit list hit the ${MAX_COMMIT_PAGES}-page fetch limit, so the oldest
            part of this window was not checked.`);
    }
    const caveatNotes = caveats.map(text => `<p class="culprit-note">${text}</p>`).join('');

    const emptyNote = bestMatches.length
        ? ''
        : `<p class="culprit-empty">No commit in this window references a bug filed against the probe's
           component${familyNote ? ' or a sibling of it' : ''}. The cause may be a bug in another
           component, an infrastructure change, or a commit landed without a bug.</p>`;

    return `
        <p class="culprit-note">${scanned}${unresolvedNote}</p>
        ${approximateNote}
        ${emptyNote}
        ${renderBestMatches(bestMatches)}
        ${renderOtherMatches(otherMatches)}
        ${caveatNotes}
    `;
}
