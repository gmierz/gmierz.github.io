const API_URL = 'https://sql.telemetry.mozilla.org/api/queries/108351/results.json?api_key=cu3eqD40BhCbwPJ8KfQ7NHCueftTpnIvJcdRVo7a';

// Shared floating tooltip for the percentile labels below the chart.
function getPercentileTooltip() {
    let el = document.getElementById('percentile-label-tooltip');
    if (!el) {
        el = document.createElement('div');
        el.id = 'percentile-label-tooltip';
        el.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;display:none;' +
            'background:rgba(0,0,0,0.85);color:#fff;font:12px sans-serif;padding:4px 8px;' +
            'border-radius:4px;white-space:nowrap;transform:translate(-50%,-100%);';
        document.body.appendChild(el);
    }
    return el;
}

// Draws percentile labels in the padding strip below the x-axis (layout.padding.bottom
// reserves the room). Reads chart.$percentileLabels = [{x, color, text, row, exact}], and
// records each label's hit box in chart.$percentileLabelRects for hover detection.
if (typeof Chart !== 'undefined') {
    Chart.register({
        id: 'percentileTopLabels',
        afterDraw(chart) {
            chart.$percentileLabelRects = [];
            const labels = chart.$percentileLabels;
            if (chart.$hidePercentiles || !labels || !labels.length) return;
            const xScale = chart.scales.x;
            const { ctx, chartArea } = chart;
            const ROW_H = 17;
            const FONT = '12px sans-serif';
            ctx.save();
            ctx.font = FONT;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            labels.forEach(l => {
                const px = xScale.getPixelForValue(l.x);
                if (px == null || px < chartArea.left || px > chartArea.right) return;
                // Anchor below the x-axis scale (xScale.bottom is beneath the tick values and
                // axis title) so the labels sit under the x values. row 0 (After) on the upper
                // line, row 1 (Before) just below it.
                const cy = xScale.bottom + 12 + l.row * ROW_H;
                const w = ctx.measureText(l.text).width + 8;
                const x0 = px - w / 2, y0 = cy - ROW_H / 2 + 1;
                ctx.fillStyle = l.color;
                ctx.fillRect(x0, y0, w, ROW_H - 2);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(l.text, px, cy);
                chart.$percentileLabelRects.push({
                    x0, y0, x1: x0 + w, y1: y0 + ROW_H - 2,
                    text: l.text, exact: l.exact
                });
            });
            ctx.restore();
        },
        afterEvent(chart, args) {
            const rects = chart.$percentileLabelRects;
            const e = args.event;
            const tip = getPercentileTooltip();
            if (!rects || !rects.length || !e || e.type === 'mouseout') {
                tip.style.display = 'none';
                return;
            }
            const hit = rects.find(r => e.x >= r.x0 && e.x <= r.x1 && e.y >= r.y0 && e.y <= r.y1);
            if (hit) {
                tip.textContent = `${hit.text}: ${hit.exact}`;
                const ne = e.native;
                tip.style.left = (ne ? ne.clientX : 0) + 'px';
                tip.style.top = ((ne ? ne.clientY : 0) - 8) + 'px';
                tip.style.display = 'block';
                chart.canvas.style.cursor = 'pointer';
            } else {
                tip.style.display = 'none';
                chart.canvas.style.cursor = 'default';
            }
        }
    });
}

let allAlerts = [];
let alertsByRowId = {};
let currentView = 'without-bugs'; // 'with-bugs', 'without-bugs', or 'grouped'
let currentSort = {
    column: 'pushDate',
    direction: 'desc' // 'asc' or 'desc'
};
let currentFilters = {
    platforms: new Set(),
    probeSearchTerms: [],
    groupedWithBugsOnly: false,
    dateFrom: null,
    dateTo: null,
    alertSummaryId: null,
    alertId: null
};
let maxProbeLength = 0;
let groupedSortColumn = 'detectionDate'; // 'summaryId', 'count', 'mostRecent', or 'detectionDate'
let groupedSortDirection = 'desc'; // 'asc' or 'desc' for grouped view

window.mobileCheck = function() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

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

function hasCdfData(alert) {
    if (!alert?.additionalData) return false;
    try {
        const d = typeof alert.additionalData === 'string'
            ? JSON.parse(alert.additionalData)
            : alert.additionalData;
        return !!(d?.before?.bin && d?.after?.cdf);
    } catch {
        return false;
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
        oldestPush: row['Oldest Push'],
        additionalData: row['Extra Data'],
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

    // Apply alert summary ID filter
    if (currentFilters.alertSummaryId !== null) {
        filtered = filtered.filter(alert => {
            return alert.alertSummaryId === currentFilters.alertSummaryId;
        });
    }

    // Apply alert ID filter
    if (currentFilters.alertId !== null) {
        filtered = filtered.filter(alert => {
            return alert.alertId === currentFilters.alertId;
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

    // Make alert summary ID a clickable link if not already filtered
    const alertSummaryIdContent = currentFilters.alertSummaryId === null
        ? `<a href="#" class="bug-link" onclick="event.stopPropagation(); applyAlertSummaryFilter(${alert.alertSummaryId}); return false;">${alert.alertSummaryId}</a>`
        : alert.alertSummaryId;

    return `
        <tr class="details-row" id="details-${rowId}">
            <td colspan="7" class="details-cell">
                <div class="details-content">
                    <div class="detail-item" style="grid-row: 1;">
                        <div class="detail-label">Alert Summary ID</div>
                        <div class="detail-value">${alertSummaryIdContent}</div>
                    </div>
                    <div class="detail-item" style="grid-row: 1;">
                        <div class="detail-label">Created</div>
                        <div class="detail-value">${formatDate(alert.created)}</div>
                    </div>
                    ${hasCdfData(alert) ? `
                    <div class="detail-item" style="grid-row: 1;">
                        <div class="detail-label">Status</div>
                        <div id="status-${rowId}" class="detail-value">Unknown</div>
                    </div>` : ''}
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
                    <div class="detail-item" style="grid-row: 2;">
                        <div class="detail-label">Push Range</div>
                        <div class="detail-value">
                            ${alert.pushRange ? `<a href="${alert.pushRange}" target="_blank">View on Treeherder</a>` : 'N/A'}
                        </div>
                    </div>
                </div>
                ${hasCdfData(alert) ? `
                <div style="display: flex; gap: 16px; padding: 0 12px 12px;">
                    <div class="cdf-chart-item" style="flex: 1; min-width: 0;">
                        <div class="detail-label">Distribution (CDF)</div>
                        <div class="detail-value cdf-chart-wrapper" style="max-width: none;">
                            <div class="cdf-canvas-box" style="height: 408px;">
                                <canvas id="chart-${rowId}" data-probe="${alert.probe || ''}"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="cdf-chart-item" style="flex: 1; min-width: 0;">
                        <div class="detail-label">CDF Difference (After − Before)</div>
                        <div class="detail-value cdf-chart-wrapper" style="max-width: none;">
                            <div class="cdf-canvas-box" style="height: 360px;">
                                <canvas id="diff-chart-${rowId}"></canvas>
                            </div>
                        </div>
                    </div>
                </div>` : ''}
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
        if (document.getElementById(`chart-${rowId}`)) {
            renderCDFChart(`chart-${rowId}`);
        }
    }
}

function formatBinValue(val, unit) {
    const label = unit ? ` ${unit}` : '';
    if (val >= 1e12) return (val / 1e12).toPrecision(3) + 'T' + label;
    if (val >= 1e9) return (val / 1e9).toPrecision(3) + 'G' + label;
    if (val >= 1e6) return (val / 1e6).toPrecision(3) + 'M' + label;
    if (val >= 1e3) return (val / 1e3).toPrecision(3) + 'K' + label;
    return val.toPrecision(3) + label;
}

function normalizeTimeUnit(unit) {
    const mapping = {
        nanosecond: 'ns',
        microsecond: 'us',
        millisecond: 'ms',
        second: 's'
    };
    const normalized = unit ? unit.toLowerCase() : '';
    return mapping[normalized] || normalized;
}

function convertFromNanoseconds(valueNs, unit) {
    const factors = { ns: 1, us: 1_000, ms: 1_000_000, s: 1_000_000_000 };
    return valueNs / (factors[unit] || 1);
}


function percentileFromCdf(cdfValues, bins, pct) {
    // Find the CDF segment that spans this percentile value using linear interpolation
    for (let i = 0; i < cdfValues.length - 1; i++) {
        if (cdfValues[i] <= pct && cdfValues[i + 1] >= pct) {
            // Linear interpolation between adjacent points
            const y0 = cdfValues[i], y1 = cdfValues[i + 1];
            if (y1 === y0) return bins[i] > 0 ? bins[i] : 1;
            const frac = (pct - y0) / (y1 - y0);
            return bins[i] + (bins[i + 1] - bins[i]) * frac;
        }
    }
    // If percentile is outside range, clamp to nearest bin
    return cdfValues.length > 0 && bins[cdfValues.length - 1] > 0 ? bins[cdfValues.length - 1] : 1;
}

function setupChartBehavior(canvas, isTouchDevice, includePercentileToggle = false) {
    canvas.style.touchAction = 'none';
    canvas.addEventListener('dblclick', (e) => e.preventDefault());

    const originalLimits = {
        xMin: canvas._chartInstance.scales.x.options.min,
        xMax: canvas._chartInstance.scales.x.options.max,
        yMin: canvas._chartInstance.scales.y.options.min,
        yMax: canvas._chartInstance.scales.y.options.max
    };

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const chart = canvas._chartInstance;
        if (!chart || chart === 'pending') return;

        const xScale = chart.scales.x;
        const yScale = chart.scales.y;
        const rect = canvas.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;

        const logMin = Math.log10(xScale.min);
        const logMax = Math.log10(xScale.max);
        const logCursor = Math.log10(Math.max(xScale.getValueForPixel(cursorX), 1e-10));
        const logRange = logMax - logMin;
        const newLogRange = logRange / factor;
        const xFrac = logRange > 0 ? (logCursor - logMin) / logRange : 0.5;
        xScale.options.min = Math.pow(10, logCursor - xFrac * newLogRange);
        xScale.options.max = Math.pow(10, logCursor + (1 - xFrac) * newLogRange);

        const yValue = yScale.getValueForPixel(cursorY);
        const yRange = yScale.max - yScale.min;
        const newYRange = yRange / factor;
        const yFrac = yRange > 0 ? (yValue - yScale.min) / yRange : 0.5;
        yScale.options.min = yValue - yFrac * newYRange;
        yScale.options.max = yValue + (1 - yFrac) * newYRange;

        chart.update('none');
    }, { passive: false });

    const controls = document.createElement('div');
    controls.className = 'chart-controls';

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Zoom';
    resetBtn.className = 'reset-zoom-btn';
    resetBtn.onclick = () => {
        const chart = canvas._chartInstance;
        if (!chart || chart === 'pending') return;
        chart.scales.x.options.min = originalLimits.xMin;
        chart.scales.x.options.max = originalLimits.xMax;
        chart.scales.y.options.min = originalLimits.yMin;
        chart.scales.y.options.max = originalLimits.yMax;
        chart.update('default');
    };
    controls.appendChild(resetBtn);

    // Toggle the percentile vertical lines and their labels on/off. Only the main CDF chart
    // has these annotations, so the toggle is omitted on the difference chart.
    if (includePercentileToggle) {
        const togglePctBtn = document.createElement('button');
        togglePctBtn.textContent = 'Hide Percentiles';
        togglePctBtn.className = 'reset-zoom-btn';
        togglePctBtn.onclick = () => {
            const chart = canvas._chartInstance;
            if (!chart || chart === 'pending') return;
            chart.$hidePercentiles = !chart.$hidePercentiles;
            const ann = chart.options.plugins.annotation && chart.options.plugins.annotation.annotations;
            if (ann) {
                Object.values(ann).forEach(a => { a.display = !chart.$hidePercentiles; });
            }
            togglePctBtn.textContent = chart.$hidePercentiles ? 'Show Percentiles' : 'Hide Percentiles';
            chart.update('none');
        };
        controls.appendChild(togglePctBtn);
    }

    // The canvas lives in a fixed-height .cdf-canvas-box; attach controls to the
    // outer wrapper. Insert the buttons and hint above the canvas box, just under
    // the graph title.
    const controlsParent = canvas.closest('.cdf-chart-wrapper') || canvas.parentElement;
    const canvasBox = canvas.closest('.cdf-canvas-box');
    controlsParent.insertBefore(controls, canvasBox || controlsParent.firstChild);

    const defaultHint = isTouchDevice
        ? 'Drag to zoom · Pinch to zoom'
        : 'Drag to zoom · Scroll to zoom · Double-click and hold to pan';
    const hint = document.createElement('div');
    hint.className = 'chart-hint';
    hint.textContent = defaultHint;
    controlsParent.insertBefore(hint, canvasBox || controlsParent.firstChild);

    if (!isTouchDevice) {
        let lastDownTime = 0;
        let isPanning = false;
        let panStartX = 0;
        let panStartY = 0;

        // Capture phase runs before the zoom plugin's mousedown listener.
        // Two presses within 300 ms with the second held → pan while held.
        // preventDefault() suppresses the synthesized mousedown the plugin listens to.
        canvas.addEventListener('mousedown', (e) => {
            const now = Date.now();
            if (now - lastDownTime < 300) {
                isPanning = true;
                panStartX = e.clientX;
                panStartY = e.clientY;
                canvas._chartInstance.options.plugins.zoom.zoom.drag.enabled = false;
                canvas._chartInstance.update('none');
                canvas.style.cursor = 'grabbing';
                hint.textContent = 'Panning… release to stop';
                e.preventDefault();
                e.stopPropagation();
            }
            lastDownTime = now;
        }, true);

        document.addEventListener('mousemove', (e) => {
            if (!isPanning) return;
            const dx = e.clientX - panStartX;
            const dy = e.clientY - panStartY;
            canvas._chartInstance.pan({ x: dx, y: dy }, undefined, 'none');
            panStartX = e.clientX;
            panStartY = e.clientY;
        });

        document.addEventListener('mouseup', () => {
            if (!isPanning) return;
            isPanning = false;
            canvas._chartInstance.options.plugins.zoom.zoom.drag.enabled = true;
            canvas._chartInstance.update('none');
            canvas.style.cursor = 'default';
            hint.textContent = defaultHint;
        });
    }
}

async function renderCDFChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || canvas._chartInstance) return;

    // Guard against duplicate calls while the fetch is in-flight
    canvas._chartInstance = 'pending';

    const probe = canvas.dataset.probe;
    let timeUnit = 'ns';
    let lowerIsBetter = null;

    if (probe) {
        try {
            const url = `https://dictionary.telemetry.mozilla.org/data/firefox_desktop/metrics/data_${probe}.json`;
            const response = await fetch(url);
            if (response.ok) {
                const metadata = await response.json();
                if (metadata.time_unit) {
                    timeUnit = normalizeTimeUnit(metadata.time_unit);
                }
                if (metadata.monitor && typeof metadata.monitor === 'object' && 'lower_is_better' in metadata.monitor) {
                    lowerIsBetter = metadata.monitor.lower_is_better;
                }
            }
        } catch (e) {
            console.warn('Could not fetch probe metadata for', probe, e);
        }
    }

    // Row may have been collapsed while fetching — bail out cleanly
    const currentCanvas = document.getElementById(canvasId);
    if (!currentCanvas) return;

    const rowId = canvasId.slice('chart-'.length);
    const alert = alertsByRowId[rowId];
    const cdfData = alert?.additionalData
        ? (typeof alert.additionalData === 'string' ? JSON.parse(alert.additionalData) : alert.additionalData)
        : null;

    if (!cdfData?.before?.bin || !cdfData?.after?.cdf) {
        currentCanvas._chartInstance = 'no-data';
        currentCanvas.parentElement.insertAdjacentHTML(
            'beforeend',
            '<p class="chart-hint">No distribution data available.</p>'
        );
        return;
    }

    const bins = cdfData.before.bin;
    const beforeCdf = cdfData.before.cdf;
    const afterCdf = cdfData.after.cdf;

    // Find meaningful range: first non-zero to last non-one (with padding)
    let startIdx = 0;
    let endIdx = bins.length - 1;

    for (let i = 0; i < bins.length; i++) {
        if (beforeCdf[i] > 0 || afterCdf[i] > 0) {
            startIdx = Math.max(0, i - 1);
            break;
        }
    }
    for (let i = bins.length - 1; i >= 0; i--) {
        if (beforeCdf[i] < 1 || afterCdf[i] < 1) {
            endIdx = Math.min(bins.length - 1, i + 1);
            break;
        }
    }

    // Build point arrays: convert bins from nanoseconds, skip bin=0 (invalid on log scale)
    const beforePoints = [];
    const afterPoints = [];
    for (let i = startIdx; i <= endIdx; i++) {
        const rawBin = bins[i] > 0 ? bins[i] : 1;
        const x = convertFromNanoseconds(rawBin, timeUnit);
        beforePoints.push({ x, y: beforeCdf[i] });
        afterPoints.push({ x, y: afterCdf[i] });
    }

    const isTouchDevice = window.mobileCheck();

    currentCanvas._chartInstance = new Chart(currentCanvas, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Before',
                    data: beforePoints,
                    borderColor: '#4a7eff',
                    backgroundColor: 'rgba(74, 126, 255, 0.08)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                    tension: 0
                },
                {
                    label: 'After',
                    data: afterPoints,
                    borderColor: '#ff6b4a',
                    backgroundColor: 'rgba(255, 107, 74, 0.08)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        title: (items) => formatBinValue(items[0].parsed.x, timeUnit),
                        label: (item) => `${item.dataset.label}: ${(item.parsed.y * 100).toFixed(2)}%`
                    }
                },
                zoom: {
                    zoom: {
                        drag: {
                            enabled: true,
                            backgroundColor: 'rgba(74, 126, 255, 0.15)',
                            borderColor: 'rgba(74, 126, 255, 0.8)',
                            borderWidth: 1,
                            threshold: 10
                        },
                        wheel: { enabled: false },
                        pinch: { enabled: true },
                        mode: 'xy'
                    },
                    pan: {
                        enabled: isTouchDevice,
                        mode: 'xy'
                    }
                }
            },
            scales: {
                x: {
                    type: 'logarithmic',
                    title: {
                        display: true,
                        text: `Value (${timeUnit})`,
                        font: { size: 14 }
                    },
                    ticks: {
                        maxTicksLimit: 12,
                        callback: (val) => formatBinValue(val, timeUnit)
                    }
                },
                y: {
                    min: 0,
                    max: 1,
                    title: {
                        display: true,
                        text: 'Cumulative Probability',
                        font: { size: 14 }
                    },
                    ticks: {
                        callback: (val) => `${(val * 100).toFixed(0)}%`
                    }
                }
            }
        }
    });

    setupChartBehavior(currentCanvas, isTouchDevice, true);

    // Compute percentiles and add vertical line annotations for median, p5, p75, p95 on CDF chart.
    // Both before and after share the same bin array (before.bin serves both).
    if (beforePoints.length > 0 && afterPoints.length > 0) {
        const medianBeforePct = percentileFromCdf(beforeCdf, bins, 0.5);
        const p5BeforePct     = percentileFromCdf(beforeCdf, bins, 0.05);
        const p75BeforePct    = percentileFromCdf(beforeCdf, bins, 0.75);
        const p95BeforePct    = percentileFromCdf(beforeCdf, bins, 0.95);

        const medianAfterPct  = percentileFromCdf(afterCdf, bins, 0.5);
        const p5AfterPct      = percentileFromCdf(afterCdf, bins, 0.05);
        const p75AfterPct     = percentileFromCdf(afterCdf, bins, 0.75);
        const p95AfterPct     = percentileFromCdf(afterCdf, bins, 0.95);

        // Convert from nanoseconds to chart x-axis value
        function toX(valNs) {
            if (!valNs || valNs <= 0) return null;
            return convertFromNanoseconds(valNs, timeUnit);
        }

        const annotations = {};
        const topLabels = [];

        // row 0 sits just above the plot, row 1 a little higher. Before lines go on the
        // upper row and After on the lower row so the two never collide at a shared x.
        function addAnn(key, displayX, color, labelPct, row) {
            if (displayX === null || displayX <= 0) return;
            annotations[key] = {
                type: 'line',
                xMin: displayX,
                xMax: displayX,
                borderColor: color,
                borderWidth: 2,
                borderDash: [6, 4]
            };
            topLabels.push({ x: displayX, color, text: labelPct, row, exact: formatBinValue(displayX, timeUnit) });
        }

        // Before (blue #4a7eff) vertical lines at each percentile
        addAnn('medianBefore', toX(medianBeforePct), '#4a7eff', 'B-Median', 1);
        addAnn('p5Before',     toX(p5BeforePct),     '#4a7eff', 'B-p5',     1);
        addAnn('p75Before',    toX(p75BeforePct),    '#4a7eff', 'B-p75',    1);
        addAnn('p95Before',    toX(p95BeforePct),    '#4a7eff', 'B-p95',    1);

        // After (orange #ff6b4a) vertical lines at each percentile
        addAnn('medianAfter',  toX(medianAfterPct),  '#ff6b4a', 'A-Median', 0);
        addAnn('p5After',      toX(p5AfterPct),       '#ff6b4a', 'A-p5',     0);
        addAnn('p75After',     toX(p75AfterPct),      '#ff6b4a', 'A-p75',    0);
        addAnn('p95After',     toX(p95AfterPct),      '#ff6b4a', 'A-p95',    0);

        // Apply annotation lines via chartjs-plugin-annotation (v3.x API: lines live under
        // plugins.annotation.annotations, not directly on plugins.annotation).
        if (!currentCanvas._chartInstance.options.plugins.annotation) {
            currentCanvas._chartInstance.options.plugins.annotation = { annotations: {} };
        }
        if (!currentCanvas._chartInstance.options.plugins.annotation.annotations) {
            currentCanvas._chartInstance.options.plugins.annotation.annotations = {};
        }
        Object.assign(currentCanvas._chartInstance.options.plugins.annotation.annotations, annotations);

        // The labels themselves are drawn in a reserved strip below the x-axis by the
        // percentileTopLabels plugin (registered once below). Reserve room for two rows.
        if (!currentCanvas._chartInstance.options.layout) {
            currentCanvas._chartInstance.options.layout = {};
        }
        currentCanvas._chartInstance.options.layout.padding =
            Object.assign({}, currentCanvas._chartInstance.options.layout.padding, { bottom: 48 });
        currentCanvas._chartInstance.$percentileLabels = topLabels;
        currentCanvas._chartInstance.update('none');
    }


    // Build diff points: after CDF minus before CDF at each bin
    const diffPoints = beforePoints.map((pt, i) => ({ x: pt.x, y: afterPoints[i].y - pt.y }));

    const statusEl = document.getElementById(`status-${rowId}`);
    if (statusEl) {
        const diffSum = diffPoints.reduce((sum, pt) => sum + pt.y, 0);
        const isRegression = lowerIsBetter === null
            ? null
            : (diffSum < 0 && lowerIsBetter) || (diffSum >= 0 && !lowerIsBetter);
        if (isRegression === null) {
            statusEl.textContent = 'Unknown';
            statusEl.className = 'detail-value';
        } else {
            statusEl.textContent = isRegression ? 'Regression' : 'Improvement';
            statusEl.className = `detail-value cdf-status ${isRegression ? 'cdf-regression' : 'cdf-improvement'}`;
        }
    }

    const diffCanvas = document.getElementById('diff-' + canvasId);
    if (diffCanvas) {
        diffCanvas._chartInstance = new Chart(diffCanvas, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'After − Before',
                    data: diffPoints,
                    borderColor: '#9b59b6',
                    backgroundColor: 'rgba(155, 89, 182, 0.08)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                    tension: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    title: { display: false },
                    legend: { display: true, position: 'top' },
                    tooltip: {
                        callbacks: {
                            title: (items) => formatBinValue(items[0].parsed.x, timeUnit),
                            label: (item) => `${item.dataset.label}: ${(item.parsed.y * 100).toFixed(2)}%`
                        }
                    },
                    zoom: {
                        zoom: {
                            drag: {
                                enabled: true,
                                backgroundColor: 'rgba(74, 126, 255, 0.15)',
                                borderColor: 'rgba(74, 126, 255, 0.8)',
                                borderWidth: 1,
                                threshold: 10
                            },
                            wheel: { enabled: false },
                            pinch: { enabled: true },
                            mode: 'xy'
                        },
                        pan: {
                            enabled: isTouchDevice,
                            mode: 'xy'
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'logarithmic',
                        title: {
                            display: true,
                            text: `Value (${timeUnit})`,
                            font: { size: 14 }
                        },
                        ticks: {
                            maxTicksLimit: 12,
                            callback: (val) => formatBinValue(val, timeUnit)
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Difference (After − Before)',
                            font: { size: 14 }
                        },
                        ticks: {
                            callback: (val) => `${(val * 100).toFixed(1)}%`
                        }
                    }
                }
            }
        });

        setupChartBehavior(diffCanvas, isTouchDevice);
    }
}

function getRowHTMLWithBug(alert, rowId, bugStatusClass) {
    const probeContent = alert.probe
        ? `<a href="https://glam.telemetry.mozilla.org/fog/probe/${encodeURIComponent(alert.probe)}/explore?os=${encodeURIComponent(alert.platform)}&normalizationType=non_normalized"
              target="_blank"
              class="bug-link"
              onclick="event.stopPropagation()">${alert.probe}</a>${' '.repeat(maxProbeLength - alert.probe.length)}`
        : padProbe(null);

    const alertIdContent = currentFilters.alertId === null
        ? `<a href="#" class="bug-link" onclick="event.stopPropagation(); applyAlertIdFilter(${alert.alertId}); return false;">${alert.alertId}</a>`
        : alert.alertId;

    return `
        <td>
            <button class="expand-btn" id="expand-${rowId}">▶</button>
        </td>
        <td>${alertIdContent}</td>
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
        ? `<a href="https://glam.telemetry.mozilla.org/fog/probe/${encodeURIComponent(alert.probe)}/explore?os=${encodeURIComponent(alert.platform)}&normalizationType=non_normalized"
              target="_blank"
              class="bug-link"
              onclick="event.stopPropagation()">${alert.probe}</a>${' '.repeat(maxProbeLength - alert.probe.length)}`
        : padProbe(null);

    const alertIdContent = currentFilters.alertId === null
        ? `<a href="#" class="bug-link" onclick="event.stopPropagation(); applyAlertIdFilter(${alert.alertId}); return false;">${alert.alertId}</a>`
        : alert.alertId;

    return `
        <td>
            <button class="expand-btn" id="expand-${rowId}">▶</button>
        </td>
        <td>${alertIdContent}</td>
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
    alertsByRowId = {};

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

        // Make summary ID a clickable link if not already filtered
        const summaryIdLink = currentFilters.alertSummaryId === null
            ? `<a href="#" class="bug-link" onclick="event.stopPropagation(); applyAlertSummaryFilter(${summaryId}); return false;">${summaryId}</a>`
            : summaryId;

        groupHeaderRow.innerHTML = `
            <td>
                <button class="expand-btn" id="expand-${groupRowId}">▶</button>
            </td>
            <td>
                <strong>${summaryIdLink}</strong>
            </td>
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
            alertsByRowId[nestedRowId] = alert;
            const bugStatusClass = getBugStatusClass(alert.bugStatus);
            const probeContent = alert.probe
                ? `<a href="https://glam.telemetry.mozilla.org/fog/probe/${encodeURIComponent(alert.probe)}/explore?os=${encodeURIComponent(alert.platform)}&normalizationType=non_normalized"
                      target="_blank"
                      class="bug-link"
                      onclick="event.stopPropagation()">${alert.probe}</a>${' '.repeat(maxProbeLength - alert.probe.length)}`
                : padProbe(null);

            const nestedAlertIdContent = currentFilters.alertId === null
                ? `<a href="#" class="bug-link" onclick="event.stopPropagation(); applyAlertIdFilter(${alert.alertId}); return false;">${alert.alertId}</a>`
                : alert.alertId;

            // Main row for this alert
            detailsHTML += `
                <tr class="main-row" onclick="toggleRow('${nestedRowId}')" style="border-bottom: 1px solid #e0e0e0;">
                    <td style="padding: 8px 12px; width: 40px;">
                        <button class="expand-btn" id="expand-${nestedRowId}">▶</button>
                    </td>
                    <td style="padding: 8px 12px;">${nestedAlertIdContent}</td>
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

    alertsByRowId = {};

    const tbody = document.getElementById('alerts-body');
    tbody.innerHTML = '';

    alerts.forEach((alert, index) => {
        const rowId = `row-${index}`;
        alertsByRowId[rowId] = alert;
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
            <th class="sortable" onclick="sortGroupedBy('mostRecent')">Last Alert Created On</th>
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

    if (currentFilters.alertId !== null && filteredAlerts.length === 1) {
        if (currentView !== 'grouped') {
            toggleRow('row-0');
        } else {
            const summaryId = filteredAlerts[0].alertSummaryId;
            const groupRowId = `group-${summaryId}`;
            toggleRow(groupRowId);
            toggleRow(`${groupRowId}-alert-0`);
        }
    }

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

    // Update alert summary ID parameter
    if (currentFilters.alertSummaryId !== null) {
        url.searchParams.set('alertSummaryId', currentFilters.alertSummaryId);
    } else {
        url.searchParams.delete('alertSummaryId');
    }

    // Update alert ID parameter
    if (currentFilters.alertId !== null) {
        url.searchParams.set('alertId', currentFilters.alertId);
    } else {
        url.searchParams.delete('alertId');
    }

    window.history.replaceState({}, '', url);
}

function getViewFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam && ['with-bugs', 'without-bugs', 'grouped'].includes(viewParam)) {
        return viewParam;
    }
    return 'without-bugs'; // default
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

    // Get alert summary ID filter
    const alertSummaryIdParam = urlParams.get('alertSummaryId');
    if (alertSummaryIdParam) {
        currentFilters.alertSummaryId = parseInt(alertSummaryIdParam, 10);
    }

    // Get alert ID filter
    const alertIdParam = urlParams.get('alertId');
    if (alertIdParam) {
        currentFilters.alertId = parseInt(alertIdParam, 10);
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
        currentFilters.alertSummaryId = null;
        currentFilters.alertId = null;
        probeInput.value = '';
        dateFromInput.value = '';
        dateToInput.value = '';
        document.getElementById('toggle-grouped-bugs').classList.remove('active');
        updateAlertSummaryDisplay();
        updateAlertIdDisplay();
        updateFilterDisplay();
        updateView();
    });

    // Setup remove alert summary button
    document.getElementById('remove-alert-summary').addEventListener('click', () => {
        currentFilters.alertSummaryId = null;
        updateAlertSummaryDisplay();
        updateView();
    });

    // Setup remove alert ID button
    document.getElementById('remove-alert-id').addEventListener('click', () => {
        currentFilters.alertId = null;
        updateAlertIdDisplay();
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

    // Update alert summary ID display
    updateAlertSummaryDisplay();

    // Update alert ID display
    updateAlertIdDisplay();

    // Update filter display (for platform dropdown)
    updateFilterDisplay();
}

function updateAlertSummaryDisplay() {
    const alertSummaryGroup = document.getElementById('alert-summary-filter-group');
    const alertSummaryValue = document.getElementById('alert-summary-value');

    if (currentFilters.alertSummaryId !== null) {
        alertSummaryValue.textContent = currentFilters.alertSummaryId;
        alertSummaryGroup.style.display = 'flex';
    } else {
        alertSummaryGroup.style.display = 'none';
    }
}

function applyAlertSummaryFilter(alertSummaryId) {
    if (currentFilters.alertSummaryId === null) {
        currentFilters.alertSummaryId = alertSummaryId;
        updateAlertSummaryDisplay();
        updateView();
    }
}

function updateAlertIdDisplay() {
    const alertIdGroup = document.getElementById('alert-id-filter-group');
    const alertIdValue = document.getElementById('alert-id-value');

    if (currentFilters.alertId !== null) {
        alertIdValue.textContent = currentFilters.alertId;
        alertIdGroup.style.display = 'flex';
    } else {
        alertIdGroup.style.display = 'none';
    }
}

function applyAlertIdFilter(alertId) {
    if (currentFilters.alertId === null) {
        currentFilters.alertId = alertId;
        updateAlertIdDisplay();
        updateView();
    }
}

function updateChartColors(isDark) {
    const textColor = isDark ? '#ccc' : '#666';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;
    document.querySelectorAll('canvas').forEach(canvas => {
        const chart = canvas._chartInstance;
        if (!chart || chart === 'pending') return;
        Object.values(chart.options.scales || {}).forEach(scale => {
            scale.ticks = scale.ticks || {};
            scale.ticks.color = textColor;
            scale.title = scale.title || {};
            scale.title.color = textColor;
            scale.grid = scale.grid || {};
            scale.grid.color = gridColor;
        });
        if (chart.options.plugins?.legend?.labels) {
            chart.options.plugins.legend.labels.color = textColor;
        }
        chart.update('none');
    });
}

function initDarkMode() {
    const toggle = document.getElementById('dark-mode-toggle');
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.documentElement.classList.add('dark');
        toggle.textContent = '\u2600 Light Mode';
        updateChartColors(true);
    }
    toggle.addEventListener('click', () => {
        const nowDark = document.documentElement.classList.toggle('dark');
        toggle.textContent = nowDark ? '\u2600 Light Mode' : '\u263E Dark Mode';
        localStorage.setItem('darkMode', nowDark);
        updateChartColors(nowDark);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    init();
});
