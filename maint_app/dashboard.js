// Configuration
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzy9jocVrp5QvarA8NUbDwUToVxe5SqgihsDjDhgb1ZnKEPfydjC5b1K7blJnS8HiN0_w/exec';

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
    console.log('Initializing dashboard...');
    initializeDashboard();
});

async function initializeDashboard() {
    try {
        // Set initial connection status
        updateConnectionStatus('Connecting...', 'connecting');
        
        // Initialize filter event listeners
        initializeFilters();
        
        // Load initial data
        await loadDashboardData();
        
        // Start auto-refresh
        setInterval(loadDashboardData, 300000); // Refresh every 5 minutes
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        updateConnectionStatus('Connection failed', 'error');
    }
}

function initializeFilters() {
    // Location filter
    const locationFilter = document.getElementById('locationFilter');
    if (locationFilter) {
        locationFilter.addEventListener('change', refreshData);
    }

    // Time period filter
    const timeFilter = document.getElementById('timeFilter');
    if (timeFilter) {
        timeFilter.addEventListener('change', refreshData);
    }

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', refreshData);
    }

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(refreshData, 300));
    }
}

async function loadDashboardData() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        // Update global state
        currentData = {
            ...currentData,
            ...data
        };

        // Update UI
        updateStats(currentData.stats);
        updateReports(currentData.reports);
        updateConnectionStatus('Connected', 'connected');

    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        updateConnectionStatus('Connection failed', 'error');
    }
}

function updateStats(stats) {
    const container = document.getElementById('statsContainer');
    if (!container) return;

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
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    No reports available
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = reports.map(report => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">${report.date || ''}</td>
            <td class="px-6 py-4">${report.location || ''}</td>
            <td class="px-6 py-4">${report.equipment || ''}</td>
            <td class="px-6 py-4">${report.status || ''}</td>
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
            <button onclick="viewMedia('${report.id}', 'photo')" 
                    class="text-blue-600 hover:text-blue-900 mr-2">📷 Photo</button>
        `);
    }
    if (report.hasVideos) {
        buttons.push(`
            <button onclick="viewMedia('${report.id}', 'video')" 
                    class="text-blue-600 hover:text-blue-900">🎥 Video</button>
        `);
    }
    return buttons.join('');
}

function refreshData() {
    loadDashboardData();
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Event handler functions
function viewNotes(id) {
    console.log('Viewing notes for:', id);
    // Implement notes viewing functionality
}

function viewMedia(id, type) {
    console.log('Viewing media:', type, 'for:', id);
    // Implement media viewing functionality
}

function updateStatus(id, newStatus) {
    console.log('Updating status:', id, 'to:', newStatus);
    // Implement status update functionality
}
