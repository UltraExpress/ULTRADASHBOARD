// Configuration
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzy9jocVrp5QvarA8NUbDwUToVxe5SqgihsDjDhgb1ZnKEPfydjC5b1K7blJnS8HiN0_w/exec';
const REFRESH_INTERVAL = 300000; // 5 minutes

// Global state
let currentData = {
    stats: null,
    reports: [],
    page: 1,
    filters: {
        location: '',
        timeframe: '7',
        status: '',
        search: ''
    }
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeFilters();
    loadDashboardData();
    startAutoRefresh();
});

// Data loading functions
async function loadDashboardData() {
    try {
        updateConnectionStatus('Connecting...', 'loading');
        const stats = await fetchStats();
        const reports = await fetchReports();
        
        updateStats(stats);
        updateReports(reports);
        updateConnectionStatus('Connected', 'success');
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        updateConnectionStatus('Connection failed', 'error');
    }
}

async function fetchStats() {
    const response = await fetch(`${SCRIPT_URL}?action=stats`);
    return await response.json();
}

async function fetchReports() {
    const response = await fetch(`${SCRIPT_URL}?action=reports`);
    return await response.json();
}

// Filter initialization
function initializeFilters() {
    const filters = ['location', 'time', 'status'];
    filters.forEach(filter => {
        document.getElementById(`${filter}Filter`)?.addEventListener('change', handleFilterChange);
    });
    
    document.getElementById('searchInput')?.addEventListener('input', 
        debounce(handleFilterChange, 300)
    );
}

function handleFilterChange(event) {
    const filterId = event.target.id;
    currentData.filters[filterId.replace('Filter', '')] = event.target.value;
    refreshData();
}

// UI update functions
function updateStats(stats) {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;

    statsContainer.innerHTML = generateStatsHTML(stats);
}

function updateReports(reports) {
    const tbody = document.getElementById('reportsTableBody');
    if (!tbody) return;

    tbody.innerHTML = reports.map(generateReportRowHTML).join('');
}

function updateConnectionStatus(message, status) {
    const statusElement = document.getElementById('connectionStatus');
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `text-sm status-${status}`;
}

// HTML generation helpers
function generateStatsHTML(stats) {
    return `
        <div class="bg-white rounded-lg shadow p-6">
            <div class="text-gray-500">Total Reports</div>
            <div class="text-3xl font-bold">${stats.total}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <div class="text-red-500">Needs Work</div>
            <div class="text-3xl font-bold text-red-500">${stats.needsWork}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <div class="text-indigo-500">Parts On Order</div>
            <div class="text-3xl font-bold text-indigo-500">${stats.partsOnOrder}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <div class="text-yellow-500">In Progress</div>
            <div class="text-3xl font-bold text-yellow-500">${stats.inProgress}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <div class="text-green-500">Complete</div>
            <div class="text-3xl font-bold text-green-500">${stats.complete}</div>
        </div>
    `;
}

function generateReportRowHTML(report) {
    return `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">${formatDateCell(report)}</td>
            <td class="px-6 py-4">${report.location}</td>
            <td class="px-6 py-4">${report.equipment}</td>
            <td class="px-6 py-4">${formatStatusBadge(report.status)}</td>
            <td class="px-6 py-4">${createStatusDropdown(report)}</td>
            <td class="px-6 py-4">${formatMediaButtons(report)}</td>
            <td class="px-6 py-4">
                <button onclick="showNotes('${report.id}')" 
                        class="text-blue-600 hover:text-blue-900">View Notes</button>
            </td>
        </tr>
    `;
}

// Utility functions
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

function startAutoRefresh() {
    setInterval(loadDashboardData, REFRESH_INTERVAL);
}

// Modal functions
function showModal(title, content) {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalContent').innerHTML = content;
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

// Status update functions
async function updateStatus(reportId, newStatus) {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=updateStatus`, {
            method: 'POST',
            body: JSON.stringify({ reportId, status: newStatus })
        });
        
        if (response.ok) {
            loadDashboardData(); // Refresh data after successful update
        } else {
            throw new Error('Failed to update status');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status. Please try again.');
    }
}
