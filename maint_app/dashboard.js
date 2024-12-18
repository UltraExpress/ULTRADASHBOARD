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
    console.log('DOM fully loaded');
    initializeDashboard().catch(error => {
        console.error('Failed to initialize dashboard:', error);
        updateConnectionStatus('Initialization failed', 'error');
    });
});

async function initializeDashboard() {
    try {
        console.log('Starting initialization...');
        
        // Set initial connection status
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            updateConnectionStatus('Connecting...', 'connecting');
        }

        // Initialize filter event listeners
        initializeFilters();
        
        // Load initial data
        await loadDashboardData();
        
        // Start auto-refresh
        setInterval(() => {
            loadDashboardData().catch(error => {
                console.error('Auto-refresh failed:', error);
            });
        }, 300000); // Refresh every 5 minutes
        
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
        console.log('Fetching dashboard data...');
        const response = await fetch(SCRIPT_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
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

    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        updateConnectionStatus('Connection failed', 'error');
        throw error;
    }
}

function updateStats(stats) {
    const container = document.getElementById('statsContainer');
    if (!container) {
        console.error('Stats container not found');
        return;
    }

    // If stats is null or undefined, keep showing loading state
    if (!stats) return;

    // Create the stats cards HTML
    const statsHTML = `
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

    // Update the container contents
    container.innerHTML = statsHTML;
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
