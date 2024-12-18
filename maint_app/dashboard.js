// Constants
const API_URL = 'https://script.google.com/macros/s/AKfycbz7blJPKrmYhxCczyop4J6ObxDptjfzfYTiJTRrN-3q4WRIiQbPhoBOj4-MTl6UherQiA/exec';
const LOCATIONS = ['RIVERSIDE', 'SANTA ANA'];
const STATUSES = ['NEEDS WORK', 'PARTS ON ORDER', 'IN PROGRESS', 'COMPLETE'];

// DOM Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const statsOverview = document.getElementById('statsOverview');
const filtersSection = document.getElementById('filtersSection');
const reportsSection = document.getElementById('reportsSection');

// Initialize Dashboard Elements
function initializeDashboard() {
    initializeStats();
    initializeFilters();
    initializeReportsTable();
    fetchDashboardData();
}

function initializeStats() {
    statsOverview.innerHTML = `
        <div class="bg-white rounded-lg shadow p-6">
            <div class="text-gray-500">Total Reports</div>
            <div id="totalReports" class="text-3xl font-bold">-</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <div class="text-red-500">Needs Work</div>
            <div id="needsWorkCount" class="text-3xl font-bold text-red-500">-</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <div class="text-indigo-500">Parts On Order</div>
            <div id="partsOrderCount" class="text-3xl font-bold text-indigo-500">-</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <div class="text-yellow-500">In Progress</div>
            <div id="inProgressCount" class="text-3xl font-bold text-yellow-500">-</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <div class="text-green-500">Complete</div>
            <div id="completeCount" class="text-3xl font-bold text-green-500">-</div>
        </div>
    `;
}

function initializeFilters() {
    filtersSection.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Location</label>
                <select id="locationFilter" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    <option value="">All Locations</option>
                    ${LOCATIONS.map(loc => `<option value="${loc}">${loc}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Time Period</label>
                <select id="timeFilter" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Status</label>
                <select id="statusFilter" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    <option value="">All Statuses</option>
                    ${STATUSES.map(status => `<option value="${status}">${status}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Search Equipment</label>
                <input id="searchInput" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
                       placeholder="Search by part/equipment...">
            </div>
        </div>
    `;

    // Add filter event listeners
    document.querySelectorAll('select, input').forEach(element => {
        element.addEventListener('change', fetchDashboardData);
    });
    document.getElementById('searchInput').addEventListener('input', fetchDashboardData);
}

function initializeReportsTable() {
    reportsSection.innerHTML = `
        <table class="min-w-full divide-y divide-gray-200 reports-table">
            <thead class="bg-gray-50">
                <tr>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Equipment</th>
                    <th>Status</th>
                    <th>Media</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody id="reportsTableBody"></tbody>
        </table>
    `;
}











// Modified fetch function to handle CORS properly
async function fetchDashboardData() {
    loadingOverlay.style.display = 'flex';
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                action: 'getStats'
            })
        });
        
        // Since we can't read the response with no-cors,
        // we need to do a second request to actually get the data
        const dataResponse = await fetch(API_URL + '?action=getStats', {
            method: 'GET'
        });
        
        if (!dataResponse.ok) {
            throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await dataResponse.json();
        updateDashboard(data);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        alert('Error loading dashboard data. Please try again.');
    } finally {
        loadingOverlay.style.display = 'none';
    }
}













function updateDashboard(data) {
    if (data.status === 'success') {
        updateStats(data.data);
        updateReportsTable(data.data.reports || []);
    } else {
        console.error('Error in dashboard data:', data);
        alert('Error updating dashboard. Please check console for details.');
    }
}

function updateStats(stats) {
    document.getElementById('totalReports').textContent = stats.total || 0;
    document.getElementById('needsWorkCount').textContent = stats.needsWork || 0;
    document.getElementById('partsOrderCount').textContent = stats.partsOnOrder || 0;
    document.getElementById('inProgressCount').textContent = stats.inProgress || 0;
    document.getElementById('completeCount').textContent = stats.complete || 0;
}

function updateReportsTable(reports) {
    const tableBody = document.getElementById('reportsTableBody');
    tableBody.innerHTML = reports.map(report => `
        <tr class="hover:bg-gray-50">
            <td class="whitespace-nowrap">
                <div class="${report.daysWithoutUpdate >= 3 ? 'date-urgent' : ''} p-2 rounded">
                    <div class="text-sm">${new Date(report.timestamp).toLocaleString()}</div>
                    ${report.daysWithoutUpdate > 0 ? `
                        <div class="text-xs">
                            No updates<span class="days-badge">${report.daysWithoutUpdate}+ days</span>
                        </div>
                    ` : ''}
                </div>
            </td>
            <td>${report.location}</td>
            <td>${report.equipment}</td>
            <td><span class="px-2 py-1 text-xs font-semibold rounded-full status-${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span></td>
            <td>
                ${report.photo ? '<button class="text-blue-600 hover:text-blue-900 mr-2">📷 Photo</button>' : ''}
                ${report.video ? '<button class="text-blue-600 hover:text-blue-900">🎥 Video</button>' : ''}
            </td>
            <td><button class="text-blue-600 hover:text-blue-900">View Notes</button></td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="text-center py-4">No reports found</td></tr>';
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', initializeDashboard);
