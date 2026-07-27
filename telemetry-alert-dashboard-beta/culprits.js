// Potential culprit detection for telemetry alerts.
//
// Walks every changeset in an alert's push range, pulls the bug number out of each
// commit message, looks those bugs up in Bugzilla, and keeps the ones filed against
// the same Bugzilla product/component as the probe that alerted. A commit touching
// the same component as the probe is a far more likely cause than the rest of the
// range, so this narrows a few hundred changesets down to a handful worth reading.

// hg.mozilla.org 302s to hg-edge. Requesting the edge host directly avoids a
// cross-origin redirect, which browsers reject when the dashboard is served from a
// file:// URL — serve the directory over http:// if the pushlog still gets blocked.
const PUSHLOG_BASE = 'https://hg-edge.mozilla.org';
const HGMO_BASE = 'https://hg.mozilla.org'; // canonical host, used for links shown to the user
const BUGZILLA_REST = 'https://bugzilla.mozilla.org/rest/bug';
const BUGZILLA_SHOW_BUG = 'https://bugzilla.mozilla.org/show_bug.cgi?id=';
const BUG_BATCH_SIZE = 100;

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

function toCommit(description, node, author, pushId, pushDate) {
    return {
        node,
        author,
        summary: summaryLine(description),
        bugIds: extractBugIds(description),
        backout: isBackout(description),
        pushId,
        pushDate
    };
}

// Flatten the push range into a commit list ordered oldest push first, which is the
// order a sheriff would bisect in.
//
// The pushlog returns every changeset in the range in a single request. fromchange is
// exclusive here, which is what we want — the oldest push is the last known-good one,
// so its commits cannot be culprits.
async function fetchRangeCommits(repo, fromRevision, toRevision) {
    const url = `${PUSHLOG_BASE}/${encodeURIComponent(repo)}/json-pushes`
        + `?fromchange=${encodeURIComponent(fromRevision)}`
        + `&tochange=${encodeURIComponent(toRevision)}&full=1`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Pushlog request failed (HTTP ${response.status})`);
    }
    const pushlog = await response.json();

    const commits = [];
    const pushIds = Object.keys(pushlog).sort((a, b) => Number(a) - Number(b));
    pushIds.forEach(pushId => {
        const push = pushlog[pushId];
        const pushDate = push.date ? new Date(push.date * 1000) : null;
        (push.changesets || []).forEach(changeset => {
            commits.push(toCommit(changeset.desc, changeset.node, changeset.author, pushId, pushDate));
        });
    });

    return { commits, pushCount: pushIds.length };
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
 * Find commits in a push range whose bug shares the probe's Bugzilla component.
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

    const { commits, pushCount } = await fetchRangeCommits(repo, fromRevision, toRevision);

    const allBugIds = Array.from(new Set(commits.flatMap(commit => commit.bugIds)));
    const bugs = await fetchBugComponents(allBugIds);

    const componentMatches = [];
    const productMatches = [];
    const unresolvedBugIds = allBugIds.filter(id => !bugs.has(id));

    commits.forEach(commit => {
        const matchedBugs = commit.bugIds
            .map(id => bugs.get(id))
            .filter(bug => bug && bug.product === target.product);
        if (!matchedBugs.length) return;

        const exact = matchedBugs.some(bug => bug.component === target.component);
        const entry = { ...commit, bugs: matchedBugs, match: exact ? 'component' : 'product' };
        (exact ? componentMatches : productMatches).push(entry);
    });

    return {
        repo,
        fromRevision,
        toRevision,
        target,
        pushCount,
        commitCount: commits.length,
        bugCount: allBugIds.length,
        unresolvedBugIds,
        componentMatches,
        productMatches
    };
}

function renderCommitRow(repo, entry) {
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
                <a href="${HGMO_BASE}/${encodeURIComponent(repo)}/rev/${entry.node}" target="_blank"
                   class="culprit-rev" onclick="event.stopPropagation()">${entry.node.slice(0, 12)}</a>
                ${entry.backout ? '<span class="culprit-tag">backout</span>' : ''}
                <span>${escapeHtml(entry.summary)}</span>
            </td>
            <td class="culprit-author">${escapeHtml(entry.author)}</td>
        </tr>
    `;
}

function renderCulpritTable(repo, entries) {
    return `
        <table class="culprit-table">
            <thead>
                <tr><th>Bug</th><th>Component</th><th>Bug Status</th><th>Commit</th><th>Author</th></tr>
            </thead>
            <tbody>${entries.map(entry => renderCommitRow(repo, entry)).join('')}</tbody>
        </table>
    `;
}

function renderComponentMatches(repo, entries) {
    if (!entries.length) return '';
    return `
        <div class="culprit-group culprit-group-exact">
            <div class="culprit-group-title">
                Same component as the probe <span class="culprit-count">${entries.length}</span>
            </div>
            ${renderCulpritTable(repo, entries)}
        </div>
    `;
}

// Same-product matches are weak evidence — a product like Core covers hundreds of
// commits per range — so they stay collapsed behind a disclosure rather than burying
// the component matches that were actually asked for.
function renderProductMatches(repo, entries, product) {
    if (!entries.length) return '';
    return `
        <div class="culprit-group culprit-group-weak">
            <details onclick="event.stopPropagation()">
                <summary class="culprit-group-title">
                    Same product, different component (${escapeHtml(product)})
                    <span class="culprit-count">${entries.length}</span>
                </summary>
                ${renderCulpritTable(repo, entries)}
            </details>
        </div>
    `;
}

function renderCulpritsHTML(result) {
    const { repo, target, componentMatches, productMatches } = result;
    const targetLabel = escapeHtml(`${target.product} :: ${target.component}`);

    const scanned = `Scanned ${result.commitCount} commit${result.commitCount === 1 ? '' : 's'}`
        + ` across ${result.pushCount} push${result.pushCount === 1 ? '' : 'es'}`
        + ` (${result.bugCount} bug${result.bugCount === 1 ? '' : 's'} referenced)`
        + ` against <strong>${targetLabel}</strong>.`;

    const unresolvedNote = result.unresolvedBugIds.length
        ? `<p class="culprit-note">${result.unresolvedBugIds.length} referenced
           bug${result.unresolvedBugIds.length === 1 ? ' was' : 's were'} not readable by Bugzilla's
           public API (likely security-restricted) and could not be checked.</p>`
        : '';

    const emptyNote = componentMatches.length
        ? ''
        : `<p class="culprit-empty">No commit in this range references a bug filed against the probe's
           component. The cause may be a bug in another component, an infrastructure change, or a
           commit landed without a bug.</p>`;

    return `
        <p class="culprit-note">${scanned}</p>
        ${emptyNote}
        ${renderComponentMatches(repo, componentMatches)}
        ${renderProductMatches(repo, productMatches, target.product)}
        ${unresolvedNote}
    `;
}
