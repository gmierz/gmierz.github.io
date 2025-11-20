const API_URL = 'https://sql.telemetry.mozilla.org/api/queries/108351/results.json?api_key=cu3eqD40BhCbwPJ8KfQ7NHCueftTpnIvJcdRVo7a';

let allAlerts = [];
let currentView = 'with-bugs'; // 'with-bugs', 'without-bugs', or 'grouped'
let currentSort = {
    column: null,
    direction: 'asc' // 'asc' or 'desc'
};
let currentFilters = {
    platforms: new Set(),
    probeSearchTerms: [],
    groupedWithBugsOnly: false,
    dateFrom: null,
    dateTo: null
};
let maxProbeLength = 0;
let groupedSortColumn = 'summaryId'; // 'summaryId', 'count', 'mostRecent', or 'detectionDate'
let groupedSortDirection = 'desc'; // 'asc' or 'desc' for grouped view

async function fetchAlerts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.query_result.data;
    } catch (error) {
        console.error('Error fetching alerts:', error);
        throw error;
    }
}

function parseData(data) {
    const rows = data.rows;

    // The rows are already objects with column names as keys
    const alerts = rows.map(row => ({
        alertId: row['Alert ID'],
        alertSummaryId: row['Alert Summary ID'],
        bug: row['Bug'],
        bugStatus: row['Bug Status'],
        created: row['created'],
        probe: row['probe'],
        platform: row['platform'],
        pushDate: row['Push Date'],
        detectionPush: row['Detection Push'],
        pushRange: row['Push Range'],
        newestPush: row['Newest Push'],
        oldestPush: row['Oldest Push']
    }));

    return alerts;
}

function getUniqueValues(field, alertsList = allAlerts) {
    const values = new Set();
    alertsList.forEach(alert => {
        if (alert[field]) {
            values.add(alert[field]);
        }
    });
    return Array.from(values).sort();
}

function calculateMaxProbeLength() {
    maxProbeLength = 0;
    allAlerts.forEach(alert => {
        if (alert.probe && alert.probe.length > maxProbeLength) {
            maxProbeLength = alert.probe.length;
        }
    });
}

function padProbe(probeName) {
    if (!probeName) return 'N/A';
    const padding = maxProbeLength - probeName.length;
    return probeName + ' '.repeat(padding);
}

function getViewFilteredAlerts() {
    if (currentView === 'with-bugs') {
        return allAlerts.filter(alert => alert.bug !== null && alert.bug !== undefined);
    } else if (currentView === 'without-bugs') {
        return allAlerts.filter(alert => alert.bug === null || alert.bug === undefined);
    } else {
        // grouped view - return all alerts
        return allAlerts;
    }
}

function getFilteredAlerts() {
    let filtered;
    if (currentView === 'with-bugs') {
        filtered = allAlerts.filter(alert => alert.bug !== null && alert.bug !== undefined);
    } else if (currentView === 'without-bugs') {
        filtered = allAlerts.filter(alert => alert.bug === null || alert.bug === undefined);
    } else {
        // grouped view - return all alerts
        filtered = [...allAlerts];
    }

    // Apply platform filter
    if (currentFilters.platforms.size > 0) {
        filtered = filtered.filter(alert => currentFilters.platforms.has(alert.platform));
    }

    // Apply probe filter (text search with space-separated terms)
    if (currentFilters.probeSearchTerms.length > 0) {
        filtered = filtered.filter(alert => {
            if (!alert.probe) return false;
            const probeLower = alert.probe.toLowerCase();
            // Match if probe contains ANY of the search terms
            return currentFilters.probeSearchTerms.some(term =>
                probeLower.includes(term.toLowerCase())
            );
        });
    }

    // Apply date range filter
    if (currentFilters.dateFrom || currentFilters.dateTo) {
        filtered = filtered.filter(alert => {
            if (!alert.pushDate) return false;
            const pushDate = new Date(alert.pushDate);
            // Get date without time for comparison
            const pushDateOnly = new Date(pushDate.getFullYear(), pushDate.getMonth(), pushDate.getDate());

            if (currentFilters.dateFrom) {
                const fromDate = new Date(currentFilters.dateFrom);
                if (pushDateOnly < fromDate) return false;
            }

            if (currentFilters.dateTo) {
                const toDate = new Date(currentFilters.dateTo);
                if (pushDateOnly > toDate) return false;
            }

            return true;
        });
    }

    // Apply sorting if a column is selected (not for grouped view)
    if (currentSort.column && currentView !== 'grouped') {
        filtered = sortAlerts(filtered, currentSort.column, currentSort.direction);
    }

    return filtered;
}

function sortAlerts(alerts, column, direction) {
    const sorted = [...alerts].sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];

        // Handle null/undefined values
        if (aVal === null || aVal === undefined) return direction === 'asc' ? 1 : -1;
        if (bVal === null || bVal === undefined) return direction === 'asc' ? -1 : 1;

        // Handle dates
        if (column === 'pushDate' || column === 'created') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        }

        // Handle numbers
        if (column === 'alertId' || column === 'alertSummaryId' || column === 'bug') {
            aVal = Number(aVal);
            bVal = Number(bVal);
        }

        // Handle strings
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    return sorted;
}

function sortByColumn(column) {
    // Toggle direction if clicking the same column
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    updateSortIndicators();
    updateView();
}

function sortGroupedBy(column) {
    if (groupedSortColumn === column) {
        groupedSortDirection = groupedSortDirection === 'desc' ? 'asc' : 'desc';
    } else {
        groupedSortColumn = column;
        groupedSortDirection = column === 'summaryId' ? 'desc' : 'desc'; // Default desc for both
    }
    updateGroupedSortIndicators();
    updateView();
}

function updateGroupedSortIndicators() {
    // Remove all sort indicators
    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });

    // Add indicator to current sorted column
    const columnMap = {
        'summaryId': 1,
        'count': 2,
        'mostRecent': 3,
        'detectionDate': 4
    };
    const columnIndex = columnMap[groupedSortColumn];
    const th = document.querySelectorAll('th')[columnIndex];
    if (th) {
        th.classList.add(`sorted-${groupedSortDirection}`);
    }
}

function updateSortIndicators() {
    // Remove all sort indicators
    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });

    // Add indicator to current sorted column
    if (currentSort.column) {
        let columnMap;

        if (currentView === 'with-bugs') {
            columnMap = {
                'alertId': 0,
                'bug': 1,
                'bugStatus': 2,
                'probe': 3,
                'platform': 4,
                'pushDate': 5
            };
        } else {
            // Without bugs view has different column order
            columnMap = {
                'alertId': 0,
                'probe': 1,
                'platform': 2,
                'pushDate': 3
            };
        }

        const thIndex = columnMap[currentSort.column];
        if (thIndex !== undefined) {
            const th = document.querySelectorAll('th')[thIndex + 1]; // +1 for expand column
            if (th) {
                th.classList.add(`sorted-${currentSort.direction}`);
            }
        }
    }
}

function getBugStatusClass(status) {
    if (!status) return 'na';
    const statusLower = status.toLowerCase();
    if (statusLower === 'new') return 'new';
    if (statusLower === 'fixed') return 'fixed';
    if (statusLower === 'invalid') return 'invalid';
    if (statusLower === 'inactive') return 'inactive';
    if (statusLower === 'duplicate') return 'duplicate';
    return 'na';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function createDetailsRow(alert, rowId) {
    const treeherderBase = 'https://treeherder.mozilla.org/jobs?repo=mozilla-central&revision=';

    const detectionPushLink = alert.detectionPush
        ? `<a href="${treeherderBase}${alert.detectionPush}" target="_blank">${alert.detectionPush}</a>`
        : 'N/A';

    const oldestPushLink = alert.oldestPush
        ? `<a href="${treeherderBase}${alert.oldestPush}" target="_blank">${alert.oldestPush}</a>`
        : 'N/A';

    const newestPushLink = alert.newestPush
        ? `<a href="${treeherderBase}${alert.newestPush}" target="_blank">${alert.newestPush}</a>`
        : 'N/A';

    return `
        <tr class="details-row" id="details-${rowId}">
            <td colspan="7" class="details-cell">
                <div class="details-content">
                    <div class="detail-item" style="grid-row: 1;">
                        <div class="detail-label">Alert Summary ID</div>
                        <div class="detail-value">${alert.alertSummaryId}</div>
                    </div>
                    <div class="detail-item" style="grid-row: 1;">
                        <div class="detail-label">Created</div>
                        <div class="detail-value">${formatDate(alert.created)}</div>
                    </div>
                    <div class="detail-item" style="grid-row: 2;">
                        <div class="detail-label">Detection Push</div>
                        <div class="detail-value">${detectionPushLink}</div>
                    </div>
                    <div class="detail-item" style="grid-row: 2;">
                        <div class="detail-label">Oldest Push</div>
                        <div class="detail-value">${oldestPushLink}</div>
                    </div>
                    <div class="detail-item" style="grid-row: 2;">
                        <div class="detail-label">Newest Push</div>
                        <div class="detail-value">${newestPushLink}</div>
                    </div>
                    <div class="detail-item" style="grid-column: 1 / -1; grid-row: 3;">
                        <div class="detail-label">Push Range</div>
                        <div class="detail-value">
                            ${alert.pushRange ? `<a href="${alert.pushRange}" target="_blank">View on Treeherder</a>` : 'N/A'}
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    `;
}

function toggleRow(rowId) {
    const detailsRow = document.getElementById(`details-${rowId}`);
    const expandBtn = document.getElementById(`expand-${rowId}`);

    if (detailsRow.classList.contains('visible')) {
        detailsRow.classList.remove('visible');
        expandBtn.classList.remove('expanded');
    } else {
        detailsRow.classList.add('visible');
        expandBtn.classList.add('expanded');
    }
}

function getRowHTMLWithBug(alert, rowId, bugStatusClass) {
    const probeContent = alert.probe
        ? `<a href="https://glam.telemetry.mozilla.org/fog/probe/${encodeURIComponent(alert.probe)}/explore?os=${encodeURIComponent(alert.platform)}"
              target="_blank"
              class="bug-link"
              onclick="event.stopPropagation()">${alert.probe}</a>${' '.repeat(maxProbeLength - alert.probe.length)}`
        : padProbe(null);

    return `
        <td>
            <button class="expand-btn" id="expand-${rowId}">▶</button>
        </td>
        <td>${alert.alertId}</td>
        <td>
            <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=${alert.bug}"
               target="_blank"
               class="bug-link"
               onclick="event.stopPropagation()">
                ${alert.bug}
            </a>
        </td>
        <td><span class="badge ${bugStatusClass}">${alert.bugStatus}</span></td>
        <td class="probe-cell">${probeContent}</td>
        <td>${alert.platform}</td>
        <td>${formatDate(alert.pushDate)}</td>
    `;
}

function getRowHTMLWithoutBug(alert, rowId) {
    const probeContent = alert.probe
        ? `<a href="https://glam.telemetry.mozilla.org/fog/probe/${encodeURIComponent(alert.probe)}/explore?os=${encodeURIComponent(alert.platform)}"
              target="_blank"
              class="bug-link"
              onclick="event.stopPropagation()">${alert.probe}</a>${' '.repeat(maxProbeLength - alert.probe.length)}`
        : padProbe(null);

    return `
        <td>
            <button class="expand-btn" id="expand-${rowId}">▶</button>
        </td>
        <td>${alert.alertId}</td>
        <td class="probe-cell">${probeContent}</td>
        <td>${alert.platform}</td>
        <td>${formatDate(alert.pushDate)}</td>
    `;
}

function groupAlertsBySummaryId(alerts) {
    const grouped = {};
    alerts.forEach(alert => {
        const summaryId = alert.alertSummaryId;
        if (!grouped[summaryId]) {
            grouped[summaryId] = [];
        }
        grouped[summaryId].push(alert);
    });
    return grouped;
}

function renderGroupedAlerts(alerts) {
    const tbody = document.getElementById('alerts-body');
    tbody.innerHTML = '';

    let grouped = groupAlertsBySummaryId(alerts);

    // Filter groups if "With Bugs Only" is active
    if (currentFilters.groupedWithBugsOnly) {
        const filteredGrouped = {};
        Object.keys(grouped).forEach(summaryId => {
            const groupAlerts = grouped[summaryId];
            // Check if at least one alert in the group has a bug
            if (groupAlerts.some(alert => alert.bug !== null && alert.bug !== undefined)) {
                filteredGrouped[summaryId] = groupAlerts;
            }
        });
        grouped = filteredGrouped;
    }

    // Create array of [summaryId, count, mostRecentCreated, detectionDate] for sorting
    const summaryData = Object.keys(grouped).map(id => {
        const groupAlerts = grouped[id];

        // Find most recent created date
        const mostRecentCreated = groupAlerts.reduce((latest, alert) => {
            const alertDate = new Date(alert.created);
            return alertDate > latest ? alertDate : latest;
        }, new Date(0));

        // Get detection date (should be same for all alerts in group, so just take first)
        const detectionDate = groupAlerts[0].pushDate;

        return {
            id: id,
            count: groupAlerts.length,
            mostRecentCreated: mostRecentCreated,
            detectionDate: detectionDate
        };
    });

    // Sort based on current sort column and direction
    summaryData.sort((a, b) => {
        let aVal, bVal;
        if (groupedSortColumn === 'summaryId') {
            aVal = Number(a.id);
            bVal = Number(b.id);
        } else if (groupedSortColumn === 'count') {
            aVal = a.count;
            bVal = b.count;
        } else if (groupedSortColumn === 'mostRecent') {
            aVal = a.mostRecentCreated.getTime();
            bVal = b.mostRecentCreated.getTime();
        } else if (groupedSortColumn === 'detectionDate') {
            aVal = new Date(a.detectionDate).getTime();
            bVal = new Date(b.detectionDate).getTime();
        }

        if (groupedSortDirection === 'desc') {
            return bVal - aVal;
        } else {
            return aVal - bVal;
        }
    });

    let rowIndex = 0;
    summaryData.forEach(({id: summaryId, count, mostRecentCreated, detectionDate}) => {
        const groupAlerts = grouped[summaryId];

        // Create group header row
        const groupRowId = `group-${summaryId}`;
        const groupHeaderRow = document.createElement('tr');
        groupHeaderRow.className = 'main-row group-header';
        groupHeaderRow.onclick = () => toggleRow(groupRowId);
        groupHeaderRow.innerHTML = `
            <td>
                <button class="expand-btn" id="expand-${groupRowId}">▶</button>
            </td>
            <td><strong>${summaryId}</strong></td>
            <td>${count}</td>
            <td>${formatDate(mostRecentCreated)}</td>
            <td>${formatDate(detectionDate)}</td>
        `;
        tbody.appendChild(groupHeaderRow);

        // Create details row with nested table showing individual alerts
        const detailsRow = document.createElement('tr');
        detailsRow.className = 'details-row';
        detailsRow.id = `details-${groupRowId}`;

        let detailsHTML = '<td colspan="5" class="details-cell" style="padding: 0;"><table style="width: 100%; margin: 0;">';

        // Add header for the nested table
        detailsHTML += `
            <thead style="background: #8b9ff5; color: white;">
                <tr>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 40px; cursor: default;"></th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; cursor: default;">Alert ID</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; cursor: default;">Bug</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; cursor: default;">Bug Status</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; cursor: default;">Probe</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; cursor: default;">Platform</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; cursor: default;">Push Date</th>
                </tr>
            </thead>
        `;

        detailsHTML += '<tbody>';

        groupAlerts.forEach((alert, alertIndex) => {
            const nestedRowId = `${groupRowId}-alert-${alertIndex}`;
            const bugStatusClass = getBugStatusClass(alert.bugStatus);
            const probeContent = alert.probe
                ? `<a href="https://glam.telemetry.mozilla.org/fog/probe/${encodeURIComponent(alert.probe)}/explore?os=${encodeURIComponent(alert.platform)}"
                      target="_blank"
                      class="bug-link"
                      onclick="event.stopPropagation()">${alert.probe}</a>${' '.repeat(maxProbeLength - alert.probe.length)}`
                : padProbe(null);

            // Main row for this alert
            detailsHTML += `
                <tr class="main-row" onclick="toggleRow('${nestedRowId}')" style="border-bottom: 1px solid #e0e0e0;">
                    <td style="padding: 8px 12px; width: 40px;">
                        <button class="expand-btn" id="expand-${nestedRowId}">▶</button>
                    </td>
                    <td style="padding: 8px 12px;">${alert.alertId}</td>
                    <td style="padding: 8px 12px;">
                        ${alert.bug ? `<a href="https://bugzilla.mozilla.org/show_bug.cgi?id=${alert.bug}" target="_blank" class="bug-link" onclick="event.stopPropagation()">${alert.bug}</a>` : 'N/A'}
                    </td>
                    <td style="padding: 8px 12px;">
                        <span class="badge ${bugStatusClass}">${alert.bugStatus || 'N/A'}</span>
                    </td>
                    <td style="padding: 8px 12px;" class="probe-cell">${probeContent}</td>
                    <td style="padding: 8px 12px;">${alert.platform}</td>
                    <td style="padding: 8px 12px;">${formatDate(alert.pushDate)}</td>
                </tr>
            `;

            // Details row for this alert (reusing createDetailsRow logic)
            detailsHTML += createDetailsRow(alert, nestedRowId);
        });

        detailsHTML += '</tbody></table></td>';

        detailsRow.innerHTML = detailsHTML;
        tbody.appendChild(detailsRow);

        rowIndex++;
    });

    // Calculate total alerts from the filtered groups
    const totalAlerts = summaryData.reduce((sum, summary) => sum + summary.count, 0);
    const totalGroups = summaryData.length;
    document.getElementById('alert-count').textContent = `Total: ${totalGroups} group${totalGroups !== 1 ? 's' : ''} (${totalAlerts} alert${totalAlerts !== 1 ? 's' : ''})`;
    document.getElementById('alerts-table').style.display = 'table';
}

function renderAlerts(alerts) {
    if (currentView === 'grouped') {
        renderGroupedAlerts(alerts);
        return;
    }

    const tbody = document.getElementById('alerts-body');
    tbody.innerHTML = '';

    alerts.forEach((alert, index) => {
        const rowId = `row-${index}`;
        const bugStatusClass = getBugStatusClass(alert.bugStatus);

        const mainRow = document.createElement('tr');
        mainRow.className = 'main-row';
        mainRow.onclick = () => toggleRow(rowId);

        if (currentView === 'with-bugs') {
            mainRow.innerHTML = getRowHTMLWithBug(alert, rowId, bugStatusClass);
        } else {
            mainRow.innerHTML = getRowHTMLWithoutBug(alert, rowId);
        }

        tbody.appendChild(mainRow);
        tbody.insertAdjacentHTML('beforeend', createDetailsRow(alert, rowId));
    });

    const viewLabel = currentView === 'with-bugs' ? 'With Bugs' : 'Without Bugs';
    document.getElementById('alert-count').textContent = `Total Alerts (${viewLabel}): ${alerts.length}`;
    document.getElementById('alerts-table').style.display = 'table';
}

function updateTableHeaders() {
    const thead = document.querySelector('thead tr');
    const dateFromFilter = document.getElementById('date-from-filter').parentElement;
    const dateToFilter = document.getElementById('date-to-filter').parentElement;

    if (currentView === 'grouped') {
        thead.innerHTML = `
            <th></th>
            <th class="sortable" onclick="sortGroupedBy('summaryId')">Alert Summary ID</th>
            <th class="sortable" onclick="sortGroupedBy('count')">Alert Count</th>
            <th class="sortable" onclick="sortGroupedBy('mostRecent')">Alert Last Created</th>
            <th class="sortable" onclick="sortGroupedBy('detectionDate')">Push Date</th>
        `;
        updateGroupedSortIndicators();
        // Show date filters in grouped view
        dateFromFilter.style.display = 'flex';
        dateToFilter.style.display = 'flex';
    } else if (currentView === 'with-bugs') {
        thead.innerHTML = `
            <th></th>
            <th class="sortable" onclick="sortByColumn('alertId')">Alert ID</th>
            <th class="sortable" onclick="sortByColumn('bug')">Bug</th>
            <th class="sortable" onclick="sortByColumn('bugStatus')">Bug Status</th>
            <th class="sortable" onclick="sortByColumn('probe')">Probe</th>
            <th class="sortable" onclick="sortByColumn('platform')">Platform</th>
            <th class="sortable" onclick="sortByColumn('pushDate')">Push Date</th>
        `;
        // Show date filters in with-bugs view
        dateFromFilter.style.display = 'flex';
        dateToFilter.style.display = 'flex';
    } else {
        thead.innerHTML = `
            <th></th>
            <th class="sortable" onclick="sortByColumn('alertId')">Alert ID</th>
            <th class="sortable" onclick="sortByColumn('probe')">Probe</th>
            <th class="sortable" onclick="sortByColumn('platform')">Platform</th>
            <th class="sortable" onclick="sortByColumn('pushDate')">Push Date</th>
        `;
        // Show date filters in without-bugs view
        dateFromFilter.style.display = 'flex';
        dateToFilter.style.display = 'flex';
    }

    if (currentView !== 'grouped') {
        updateSortIndicators();
    }
}

function updateView() {
    updateTableHeaders();
    const filteredAlerts = getFilteredAlerts();
    renderAlerts(filteredAlerts);
    updateURLParameter();
}

function updateURLParameter() {
    const url = new URL(window.location);
    url.searchParams.set('view', currentView);

    // Update platforms parameter
    if (currentFilters.platforms.size > 0) {
        url.searchParams.set('platforms', Array.from(currentFilters.platforms).join(','));
    } else {
        url.searchParams.delete('platforms');
    }

    // Update probe search terms parameter
    if (currentFilters.probeSearchTerms.length > 0) {
        url.searchParams.set('probe', currentFilters.probeSearchTerms.join(' '));
    } else {
        url.searchParams.delete('probe');
    }

    // Update date parameters
    if (currentFilters.dateFrom) {
        url.searchParams.set('dateFrom', currentFilters.dateFrom);
    } else {
        url.searchParams.delete('dateFrom');
    }

    if (currentFilters.dateTo) {
        url.searchParams.set('dateTo', currentFilters.dateTo);
    } else {
        url.searchParams.delete('dateTo');
    }

    // Update grouped with bugs only parameter
    if (currentFilters.groupedWithBugsOnly) {
        url.searchParams.set('groupedWithBugsOnly', 'true');
    } else {
        url.searchParams.delete('groupedWithBugsOnly');
    }

    window.history.replaceState({}, '', url);
}

function getViewFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam && ['with-bugs', 'without-bugs', 'grouped'].includes(viewParam)) {
        return viewParam;
    }
    return 'with-bugs'; // default
}

function getFiltersFromURL() {
    const urlParams = new URLSearchParams(window.location.search);

    // Get platforms
    const platformsParam = urlParams.get('platforms');
    if (platformsParam) {
        currentFilters.platforms = new Set(platformsParam.split(','));
    }

    // Get probe search terms
    const probeParam = urlParams.get('probe');
    if (probeParam) {
        currentFilters.probeSearchTerms = probeParam.split(/\s+/).filter(term => term.length > 0);
    }

    // Get date filters
    const dateFromParam = urlParams.get('dateFrom');
    if (dateFromParam) {
        currentFilters.dateFrom = dateFromParam;
    }

    const dateToParam = urlParams.get('dateTo');
    if (dateToParam) {
        currentFilters.dateTo = dateToParam;
    }

    // Get grouped with bugs only filter
    const groupedWithBugsOnlyParam = urlParams.get('groupedWithBugsOnly');
    if (groupedWithBugsOnlyParam === 'true') {
        currentFilters.groupedWithBugsOnly = true;
    }
}

function setupToggleButtons() {
    const withBugsBtn = document.getElementById('toggle-bugs');
    const withoutBugsBtn = document.getElementById('toggle-no-bugs');
    const groupedBtn = document.getElementById('toggle-grouped');
    const groupedBugsBtn = document.getElementById('toggle-grouped-bugs');

    withBugsBtn.addEventListener('click', () => {
        if (currentView !== 'with-bugs') {
            currentView = 'with-bugs';
            withBugsBtn.classList.add('active');
            withoutBugsBtn.classList.remove('active');
            groupedBtn.classList.remove('active');
            groupedBugsBtn.style.display = 'none';
            updateView();
        }
    });

    withoutBugsBtn.addEventListener('click', () => {
        if (currentView !== 'without-bugs') {
            currentView = 'without-bugs';
            withoutBugsBtn.classList.add('active');
            withBugsBtn.classList.remove('active');
            groupedBtn.classList.remove('active');
            groupedBugsBtn.style.display = 'none';
            updateView();
        }
    });

    groupedBtn.addEventListener('click', () => {
        if (currentView !== 'grouped') {
            currentView = 'grouped';
            groupedBtn.classList.add('active');
            withBugsBtn.classList.remove('active');
            withoutBugsBtn.classList.remove('active');
            groupedBugsBtn.style.display = 'inline-block';
            updateView();
        }
    });

    groupedBugsBtn.addEventListener('click', () => {
        currentFilters.groupedWithBugsOnly = !currentFilters.groupedWithBugsOnly;
        if (currentFilters.groupedWithBugsOnly) {
            groupedBugsBtn.classList.add('active');
        } else {
            groupedBugsBtn.classList.remove('active');
        }
        updateView();
    });
}

function setupFilters() {
    const platforms = getUniqueValues('platform');

    populateFilter('platform', platforms);

    // Setup dropdown toggle for platform
    document.getElementById('platform-header').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown('platform');
    });

    // Setup probe text filter
    const probeInput = document.getElementById('probe-filter');
    probeInput.addEventListener('input', (e) => {
        const searchText = e.target.value.trim();
        if (searchText === '') {
            currentFilters.probeSearchTerms = [];
        } else {
            // Split by spaces and filter out empty strings
            currentFilters.probeSearchTerms = searchText.split(/\s+/).filter(term => term.length > 0);
        }
        updateView();
    });

    // Setup date filters
    const dateFromInput = document.getElementById('date-from-filter');
    const dateToInput = document.getElementById('date-to-filter');

    dateFromInput.addEventListener('input', (e) => {
        currentFilters.dateFrom = e.target.value || null;
        updateView();
    });

    dateToInput.addEventListener('input', (e) => {
        currentFilters.dateTo = e.target.value || null;
        updateView();
    });

    // Clear filters button
    document.getElementById('clear-filters').addEventListener('click', () => {
        currentFilters.platforms.clear();
        currentFilters.probeSearchTerms = [];
        currentFilters.groupedWithBugsOnly = false;
        currentFilters.dateFrom = null;
        currentFilters.dateTo = null;
        probeInput.value = '';
        dateFromInput.value = '';
        dateToInput.value = '';
        document.getElementById('toggle-grouped-bugs').classList.remove('active');
        updateFilterDisplay();
        updateView();
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        closeAllDropdowns();
    });
}

function populateFilter(type, values) {
    const dropdown = document.getElementById(`${type}-dropdown`);
    dropdown.innerHTML = '';

    values.forEach(value => {
        const option = document.createElement('div');
        option.className = 'filter-option';
        option.innerHTML = `
            <input type="checkbox" id="${type}-${value}" value="${value}">
            <label for="${type}-${value}">${value}</label>
        `;

        option.querySelector('input').addEventListener('change', (e) => {
            if (e.target.checked) {
                currentFilters[`${type}s`].add(value);
            } else {
                currentFilters[`${type}s`].delete(value);
            }
            updateFilterDisplay();
            updateView();
        });

        dropdown.appendChild(option);
    });
}

function toggleDropdown(type) {
    const dropdown = document.getElementById(`${type}-dropdown`);
    const isOpen = dropdown.classList.contains('open');

    closeAllDropdowns();

    if (!isOpen) {
        dropdown.classList.add('open');
    }
}

function closeAllDropdowns() {
    document.querySelectorAll('.select-dropdown').forEach(dropdown => {
        dropdown.classList.remove('open');
    });
}

function updateFilterDisplay() {
    // Update platform header
    const platformHeader = document.getElementById('platform-header').querySelector('span');
    if (currentFilters.platforms.size === 0) {
        platformHeader.textContent = 'All Platforms';
    } else if (currentFilters.platforms.size === 1) {
        platformHeader.textContent = Array.from(currentFilters.platforms)[0];
    } else {
        platformHeader.textContent = `${currentFilters.platforms.size} selected`;
    }

    // Update checkboxes (only for platform now)
    document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(checkbox => {
        const type = checkbox.id.split('-')[0];
        const value = checkbox.value;
        if (type === 'platform') {
            checkbox.checked = currentFilters.platforms.has(value);
        }
    });
}

async function init() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');

    try {
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';

        const data = await fetchAlerts();
        allAlerts = parseData(data);
        calculateMaxProbeLength();

        loadingEl.style.display = 'none';

        if (allAlerts.length === 0) {
            errorEl.textContent = 'No alerts found.';
            errorEl.style.display = 'block';
        } else {
            // Initialize view and filters from URL parameters
            currentView = getViewFromURL();
            getFiltersFromURL();
            setupToggleButtons();
            setupFilters();
            updateToggleButtonStates();
            updateFilterUIFromState();
            updateView();
        }
    } catch (error) {
        loadingEl.style.display = 'none';
        errorEl.textContent = `Error loading alerts: ${error.message}`;
        errorEl.style.display = 'block';
    }
}

function updateToggleButtonStates() {
    const withBugsBtn = document.getElementById('toggle-bugs');
    const withoutBugsBtn = document.getElementById('toggle-no-bugs');
    const groupedBtn = document.getElementById('toggle-grouped');
    const groupedBugsBtn = document.getElementById('toggle-grouped-bugs');

    withBugsBtn.classList.remove('active');
    withoutBugsBtn.classList.remove('active');
    groupedBtn.classList.remove('active');

    if (currentView === 'with-bugs') {
        withBugsBtn.classList.add('active');
        groupedBugsBtn.style.display = 'none';
    } else if (currentView === 'without-bugs') {
        withoutBugsBtn.classList.add('active');
        groupedBugsBtn.style.display = 'none';
    } else if (currentView === 'grouped') {
        groupedBtn.classList.add('active');
        groupedBugsBtn.style.display = 'block';
    }
}

function updateFilterUIFromState() {
    // Update probe input
    const probeInput = document.getElementById('probe-filter');
    if (currentFilters.probeSearchTerms.length > 0) {
        probeInput.value = currentFilters.probeSearchTerms.join(' ');
    }

    // Update date inputs
    const dateFromInput = document.getElementById('date-from-filter');
    const dateToInput = document.getElementById('date-to-filter');
    if (currentFilters.dateFrom) {
        dateFromInput.value = currentFilters.dateFrom;
    }
    if (currentFilters.dateTo) {
        dateToInput.value = currentFilters.dateTo;
    }

    // Update grouped with bugs only button
    const groupedBugsBtn = document.getElementById('toggle-grouped-bugs');
    if (currentFilters.groupedWithBugsOnly) {
        groupedBugsBtn.classList.add('active');
    } else {
        groupedBugsBtn.classList.remove('active');
    }

    // Update filter display (for platform dropdown)
    updateFilterDisplay();
}

document.addEventListener('DOMContentLoaded', init);
