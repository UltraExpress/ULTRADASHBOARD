// Constants
const API_URL = 'YOUR_APPS_SCRIPT_URL';
const LOCATIONS = ['RIVERSIDE', 'SANTA ANA'];
const STATUSES = ['NEEDS WORK', 'PARTS ON ORDER', 'IN PROGRESS', 'COMPLETE'];

// Components
const DashboardHeader = () => (
    <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
                <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-blue-600">ULTRA WASH Maintenance Reports</h1>
                </div>
            </div>
        </div>
    </nav>
);

const StatsCard = ({ label, value, color }) => (
    <div className="stat-card">
        <div className={`text-${color}-500`}>{label}</div>
        <div className={`text-3xl font-bold text-${color}-500`}>{value}</div>
    </div>
);

const StatsOverview = ({ stats }) => (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <StatsCard label="Total Reports" value={stats.total} color="gray" />
        <StatsCard label="Needs Work" value={stats.needsWork} color="red" />
        <StatsCard label="Parts On Order" value={stats.partsOnOrder} color="indigo" />
        <StatsCard label="In Progress" value={stats.inProgress} color="yellow" />
        <StatsCard label="Complete" value={stats.complete} color="green" />
    </div>
);

const DashboardFilters = ({ filters, onFilterChange }) => (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <select 
                    className="filter-select"
                    value={filters.location}
                    onChange={(e) => onFilterChange('location', e.target.value)}
                >
                    <option value="">All Locations</option>
                    {LOCATIONS.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Time Period</label>
                <select 
                    className="filter-select"
                    value={filters.timePeriod}
                    onChange={(e) => onFilterChange('timePeriod', e.target.value)}
                >
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select 
                    className="filter-select"
                    value={filters.status}
                    onChange={(e) => onFilterChange('status', e.target.value)}
                >
                    <option value="">All Statuses</option>
                    {STATUSES.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Search Equipment</label>
                <input 
                    type="text"
                    className="filter-input"
                    placeholder="Search by part/equipment..."
                    value={filters.search}
                    onChange={(e) => onFilterChange('search', e.target.value)}
                />
            </div>
        </div>
    </div>
);

const ReportsTable = ({ reports }) => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="dashboard-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Equipment</th>
                    <th>Status</th>
                    <th>Update Status</th>
                    <th>Media</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
                {reports.map((report, index) => (
                    <tr key={index}>
                        <td>
                            <div className={report.daysWithoutUpdate >= 3 ? 'date-urgent p-2 rounded' : 'p-2'}>
                                <div className="text-sm">{new Date(report.timestamp).toLocaleString()}</div>
                                {report.daysWithoutUpdate > 0 && (
                                    <div className="text-xs">
                                        No updates
                                        <span className="days-badge">{report.daysWithoutUpdate}+ days</span>
                                    </div>
                                )}
                            </div>
                        </td>
                        <td>{report.location}</td>
                        <td>{report.partName}</td>
                        <td>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full status-${report.status.toLowerCase().replace(' ', '-')}`}>
                                {report.status}
                            </span>
                        </td>
                        <td>
                            <select 
                                className={`w-full rounded-md border-gray-300 shadow-sm py-2 status-${report.status.toLowerCase().replace(' ', '-')}`}
                                value={report.status}
                                onChange={(e) => handleStatusUpdate(report.id, e.target.value)}
                            >
                                {STATUSES.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </td>
                        <td>
                            {report.photo && (
                                <button className="text-blue-600 hover:text-blue-900 mr-2">📷 Photo</button>
                            )}
                            {report.video && (
                                <button className="text-blue-600 hover:text-blue-900">🎥 Video</button>
                            )}
                        </td>
                        <td>
                            <button className="text-blue-600 hover:text-blue-900">View Notes</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// Main Dashboard Component
const Dashboard = () => {
    const [stats, setStats] = React.useState({
        total: 0,
        needsWork: 0,
        inProgress: 0,
        partsOnOrder: 0,
        complete: 0
    });
    const [reports, setReports] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [filters, setFilters] = React.useState({
        location: '',
        timePeriod: '7',
        status: '',
        search: ''
    });

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}?action=getStats`);
            if (!response.ok) throw new Error('Failed to fetch dashboard data');
            const data = await response.json();
            if (data.status === 'success') {
                setStats(data.data);
                setReports(data.reports || []);
            } else {
                throw new Error(data.message || 'Failed to load dashboard data');
            }
        } catch (err) {
            setError(err.message);
            console.error('Dashboard data fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle filter changes
    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
    };

    // Handle status updates
    const handleStatusUpdate = async (reportId, newStatus) => {
        try {
            const response = await fetch(`${API_URL}?action=updateStatus`, {
                method: 'POST',
                body: JSON.stringify({ reportId, status: newStatus })
            });
            if (!response.ok) throw new Error('Failed to update status');
            await fetchDashboardData(); // Refresh data
        } catch (err) {
            console.error('Status update error:', err);
            alert('Failed to update status. Please try again.');
        }
    };

    // Initial data fetch
    React.useEffect(() => {
        fetchDashboardData();
    }, []);

    // Loading state
    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-100">
                <DashboardHeader />
                <main className="max-w-7xl mx-auto px-4 py-6">
                    <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                        Error loading dashboard: {error}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <DashboardHeader />
            <main className="max-w-7xl mx-auto px-4 py-6">
                <StatsOverview stats={stats} />
                <DashboardFilters filters={filters} onFilterChange={handleFilterChange} />
                <ReportsTable reports={reports} />
            </main>
        </div>
    );
};

// Render the dashboard
ReactDOM.render(<Dashboard />, document.getElementById('root'));
