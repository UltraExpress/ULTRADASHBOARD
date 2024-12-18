// Global state
let currentData = {
    stats: {
        total: 0,
        needsWork: 0,
        partsOnOrder: 0,
        inProgress: 0,
        complete: 0
    },
    reports: []
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    initializeDashboard().catch(error => {
        console.error('Failed to initialize dashboard:', error);
        updateConnectionStatus('Initialization failed', 'error');
    });
});

async function initializeDashboard() {
    try {
        console.log('Starting initialization...');
        updateConnectionStatus('Connecting...', 'connecting');
        
        // Initialize filter event listeners
        initializeFilters();
        
        // Initial data load
        loadDashboardData();
        
        // Start auto-refresh
        setInterval(loadDashboardData, 300000); // Refresh every 5 minutes
        
        console.log('Initialization complete');
    } catch (error) {
        console.error('Initialization error:', error);
        throw error;
    }
}

function initializeFilters() {
    // Location filter
    const locationFilter = document.getElementById('locationFilter');
    if (locationFilter) {
        locationFilter.addEventListener('change', () => {
            loadDashboardData({
                location: locationFilter.value
            });
        });
    }

    // Time period filter
    const timeFilter = document.getElementById('timeFilter');
    if (timeFilter) {
        timeFilter.addEventListener('change', () => {
            loadDashboardData({
                days: timeFilter.value
            });
        });
    }

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            loadDashboardData({
                status: statusFilter.value
            });
        });
    }

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            loadDashboardData({
                search: e.target.value
            });
        }, 300));
    }
}

function loadDashboardData(filters = {}) {
    console.log('Fetching dashboard data with filters:', filters);
    
    google.script.run
        .withSuccessHandler(handleDataSuccess)
        .withFailureHandler(handleDataError)
        .getMaintenanceData(filters);
}

function handleDataSuccess(data) {
    console.log('Received data:', data);
    
    // Update global state
    currentData = {
        stats: {
            ...currentData.stats,
            ...data.stats
        },
        reports: data.reports || []
    };

    // Update UI
    updateStats(currentData.stats);
    updateReports(currentData.reports);
    updateConnectionStatus('Connected', 'connected');
}

function handleDataError(error) {
    console.error('Failed to load dashboard data:', error);
    updateConnectionStatus('Connection failed', 'error');
}

function updateStats(stats) {
    const container = document.getElementById('statsContainer');
    if (!container) {
        console.error('Stats container not found');
        return;
    }

    // If stats is null or undefined, keep showing loading state
    if (!stats) return;

    container.innerHTML = `
        <div class="bg-white rounded-lg shadow p-6">
            <div class="text-gray-500">Total Reports</div>
            <div class="text-3xl font-bold">${stats.total || 0}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <div class="text-red-500">Needs Work</div>
            <div class="text-3xl font-bold text-red-500">${stats.needsWork || 0}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <div class="text-indigo-500">Parts On Order</div>
            <div class="text-3xl font-bold text-indigo-500">${stats.partsOnOrder || 0}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <div class="text-yellow-500">In Progress</div>
            <div class="text-3xl font-bold text-yellow-500">${stats.inProgress || 0}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <div class="text-green-500">Complete</div>
            <div class="text-3xl font-bold text-green-500">${stats.complete || 0}</div>
        </div>
    `;
}

function updateReports(reports) {
    const tbody = document.getElementById('reportsTableBody');
    if (!tbody) return;

    if (!reports || reports.length === 0) {
        tbody.innerHTML = `
            <tr class="loading-row">
                <td colspan="7">No reports available</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = reports.map(report => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">${formatDate(report.date)}</td>
            <td class="px-6 py-4">${report.location || ''}</td>
            <td class="px-6 py-4">${report.equipment || ''}</td>
            <td class="px-6 py-4">${formatStatus(report.status)}</td>
            <td class="px-6 py-4">${generateStatusDropdown(report)}</td>
            <td class="px-6 py-4">${generateMediaButtons(report)}</td>
            <td class="px-6 py-4">
                <button onclick="viewNotes('${report.id}')" class="text-blue-600 hover:text-blue-900">
                    View Notes
                </button>
            </td>
        </tr>
    `).join('');
}

function updateConnectionStatus(message, status) {
    const element = document.getElementById('connectionStatus');
    if (!element) return;
    
    element.textContent = message;
    element.className = `text-sm ${getStatusClass(status)}`;
}

function getStatusClass(status) {
    switch (status) {
        case 'connected':
            return 'text-green-600';
        case 'error':
            return 'text-red-600';
        case 'connecting':
            return 'text-yellow-600';
        default:
            return 'text-gray-600';
    }
}

function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatStatus(status) {
    const colors = {
        'Needs Work': 'red',
        'Parts On Order': 'indigo',
        'In Progress': 'yellow',
        'Complete': 'green'
    };
    const color = colors[status] || 'gray';
    
    return `
        <span class="px-2 py-1 text-xs font-semibold rounded-full 
                     bg-${color}-100 text-${color}-800">
            ${status}
        </span>
    `;
}

function generateStatusDropdown(report) {
    const statuses = ['Needs Work', 'Parts On Order', 'In Progress', 'Complete'];
    return `
        <select onchange="updateStatus('${report.id}', this.value)" 
                class="rounded-md border-gray-300 shadow-sm py-1 px-2">
            ${statuses.map(status => `
                <option value="${status}" ${report.status === status ? 'selected' : ''}>
                    ${status}
                </option>
            `).join('')}
        </select>
    `;
}

function generateMediaButtons(report) {
    let buttons = [];
    if (report.hasPhotos) {
        buttons.push(`
            <button onclick="viewMedia('${report.
