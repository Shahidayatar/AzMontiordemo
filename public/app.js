// Dashboard Application
class AzureDashboard {
    constructor() {
        console.log('🏗️ Constructing AzureDashboard...');
        this.charts = {};
        this.refreshInterval = null;
        this.isLoading = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        console.log('🔧 Initializing elements...');
        this.initializeElements();
        console.log('📊 Initializing charts...');
        this.initializeCharts();
        console.log('🔗 Binding events...');
        this.bindEvents();
        console.log('⏰ Starting auto-refresh...');
        this.startAutoRefresh();
        
        // Initial data load
        console.log('📥 Loading initial data...');
        this.loadDashboardData();
    }

    initializeElements() {
        this.elements = {
            // Status indicators
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            
            // Stat values
            totalRequests: document.getElementById('totalRequests'),
            failedRequests: document.getElementById('failedRequests'),
            errorRate: document.getElementById('errorRate'),
            avgResponseTime: document.getElementById('avgResponseTime'),
            p95ResponseTime: document.getElementById('p95ResponseTime'),
            systemStatus: document.getElementById('systemStatus'),
            lastUpdate: document.getElementById('lastUpdate'),
            
            // Buttons
            setupGuideBtn: document.getElementById('setupGuideBtn'),
            triggerErrorBtn: document.getElementById('triggerErrorBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            
            // Overlays
            loadingOverlay: document.getElementById('loadingOverlay'),
            toastContainer: document.getElementById('toastContainer')
        };
    }

    initializeCharts() {
        // Requests Chart
        const requestsCtx = document.getElementById('requestsChart').getContext('2d');
        this.charts.requests = new Chart(requestsCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Successful Requests',
                        data: [],
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Failed Requests',
                        data: [],
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time (Last 60 minutes)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Requests'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

        // Response Time Chart
        const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
        this.charts.responseTime = new Chart(responseTimeCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Average Response Time (ms)',
                    data: [],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time (Last 60 minutes)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Response Time (ms)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

        // Slowest Endpoints Chart
        const slowestEndpointsCtx = document.getElementById('slowestEndpointsChart').getContext('2d');
        this.charts.slowestEndpoints = new Chart(slowestEndpointsCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Average Response Time (ms)',
                    data: [],
                    backgroundColor: [
                        'rgba(220, 53, 69, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(255, 152, 0, 0.8)',
                        'rgba(0, 123, 255, 0.8)',
                        'rgba(40, 167, 69, 0.8)'
                    ],
                    borderColor: [
                        '#dc3545',
                        '#ffc107',
                        '#ff9800',
                        '#007bff',
                        '#28a745'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Endpoints'
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Response Time (ms)'
                        }
                    }
                }
            }
        });
    }

    bindEvents() {
        // Trigger Error button
        this.elements.triggerErrorBtn.addEventListener('click', () => {
            this.triggerError();
        });

        // Refresh button
        this.elements.refreshBtn.addEventListener('click', () => {
            this.loadDashboardData();
        });

        // Setup Guide button
        this.elements.setupGuideBtn.addEventListener('click', () => {
            window.open('/setup-guide.html', '_blank');
        });



        // Handle window visibility change to pause/resume auto-refresh
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoRefresh();
            } else {
                this.startAutoRefresh();
                this.loadDashboardData(); // Refresh immediately when tab becomes visible
            }
        });
    }

    async loadDashboardData() {
        console.log('🔄 Loading dashboard data...');
        if (this.isLoading) {
            console.log('⏳ Already loading, skipping...');
            return;
        }
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            console.log('📡 Fetching /stats...');
            const response = await fetch('/stats');
            
            if (!response.ok) {
                console.error('❌ Response not OK:', response.status, response.statusText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            } else {
                console.log('✅ Response OK, parsing data...');
                const data = await response.json();
                console.log('📊 Data received:', {
                    timestamp: data.timestamp,
                    requestsCount: data.requestsPerMinute?.length || 0,
                    responseTimeCount: data.responseTimePerMinute?.length || 0,
                    overallStats: data.overallStats
                });
                this.updateDashboard(data, false);
                this.retryCount = 0; // Reset retry count on success
            }
            
            this.updateStatus('connected');
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.retryCount++;
            
            if (this.retryCount <= this.maxRetries) {
                this.updateStatus('warning');
                this.showToast(`Connection issue - retrying (${this.retryCount}/${this.maxRetries})`, 'warning');
                
                // Retry after a delay
                setTimeout(() => this.loadDashboardData(), 2000);
            } else {
                this.updateStatus('error');
                this.showToast('Failed to load data - check your connection and Application Insights configuration', 'error');
            }
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    updateDashboard(data, isSampleData = false) {
        console.log('🎨 RECEIVED DATA STRUCTURE:', JSON.stringify(data, null, 2));
        console.log('🎨 Updating dashboard with data:', {
            isSampleData,
            dataKeys: Object.keys(data),
            hasRequestCounts: !!data.requestCounts,
            hasFailedRequests: !!data.failedRequests,
            hasResponseTimes: !!data.responseTimes,
            hasSummary: !!data.summary,
            requestCountsLength: data.requestCounts?.length || 0,
            failedRequestsLength: data.failedRequests?.length || 0,
            responseTimesLength: data.responseTimes?.length || 0
        });
        
        // Update overall stats - handle both old and new format
        const overallStats = data.summary || data.overallStats || {};
        console.log('📊 Processing overall stats:', overallStats);
        
        this.elements.totalRequests.textContent = this.formatNumber(overallStats.TotalRequests || overallStats.totalRequests || 0);
        this.elements.failedRequests.textContent = this.formatNumber(overallStats.FailedRequests || overallStats.failedRequests || 0);
        
        const totalReqs = overallStats.TotalRequests || overallStats.totalRequests || 0;
        const failedReqs = overallStats.FailedRequests || overallStats.failedRequests || 0;
        const errorRate = totalReqs > 0 ? ((failedReqs / totalReqs) * 100).toFixed(1) : '0.0';
        this.elements.errorRate.textContent = `${errorRate}%`;
        
        const avgResponseTime = overallStats.AvgResponseTime || overallStats.avgResponseTime || 0;
        this.elements.avgResponseTime.textContent = `${Math.round(avgResponseTime)}ms`;
        this.elements.p95ResponseTime.textContent = `${Math.round(overallStats.p95ResponseTime || 0)}ms`;
        
        this.elements.systemStatus.textContent = overallStats.failedRequests > 10 ? 'Degraded' : 'Healthy';
        this.elements.lastUpdate.textContent = `Last update: ${new Date().toLocaleTimeString()}`;
        
        // Update charts - handle both old and new format
        console.log('📊 Updating charts with data formats:', {
            requestCounts: data.requestCounts?.length || 0,
            failedRequests: data.failedRequests?.length || 0,
            responseTimes: data.responseTimes?.length || 0,
            slowestEndpoints: data.slowestEndpoints?.length || 0
        });
        
        this.updateRequestsChart(data.requestCounts || data.requestsPerMinute || [], data.failedRequests || data.failedRequestsPerMinute || []);
        this.updateResponseTimeChart(data.responseTimes || data.responseTimePerMinute || []);
        this.updateSlowestEndpointsChart(data.slowestEndpoints || []);

    }

    updateRequestsChart(requestsData, failedRequestsData) {
        console.log('📊 Updating requests chart:', {
            requestsDataPoints: requestsData.length,
            failedDataPoints: failedRequestsData.length,
            sampleRequestsData: requestsData.slice(0, 2),
            sampleFailedData: failedRequestsData.slice(0, 2)
        });
        
        const labels = requestsData.map((item, index) => {
            const date = new Date(item.timestamp);
            return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
        });
        
        // Handle both old and new data formats
        const successfulRequests = requestsData.map(item => item.RequestCount || item.count || 0);
        console.log('📊 Successful requests data:', successfulRequests);
        
        // Create a map for failed requests by timestamp
        const failedMap = {};
        failedRequestsData.forEach(item => {
            failedMap[item.timestamp] = item.FailedRequestCount || item.count || 0;
        });
        
        const failedRequests = requestsData.map(item => failedMap[item.timestamp] || 0);
        
        console.log('📊 Chart data prepared:', {
            labels: labels.length,
            successfulRequests: successfulRequests.length,
            failedRequests: failedRequests.length,
            sampleLabels: labels.slice(0, 3),
            sampleSuccessful: successfulRequests.slice(0, 3),
            sampleFailed: failedRequests.slice(0, 3)
        });
        
        this.charts.requests.data.labels = labels;
        this.charts.requests.data.datasets[0].data = successfulRequests;
        this.charts.requests.data.datasets[1].data = failedRequests;
        this.charts.requests.update('none');
    }

    updateResponseTimeChart(responseTimeData) {
        console.log('⏱️ Updating response time chart:', responseTimeData.length, 'data points');
        console.log('⏱️ Sample response time data:', responseTimeData.slice(0, 2));
        
        const labels = responseTimeData.map(item => {
            const date = new Date(item.timestamp);
            return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
        });
        
        // Handle both old and new data formats
        const responseTimes = responseTimeData.map(item => Math.round(item.AvgResponseTime || item.avgResponseTime || 0));
        console.log('⏱️ Processed response times:', responseTimes);
        
        console.log('⏱️ Response time data:', {
            labels: labels.length,
            responseTimes: responseTimes.length,
            sampleTimes: responseTimes.slice(0, 5)
        });
        
        this.charts.responseTime.data.labels = labels;
        this.charts.responseTime.data.datasets[0].data = responseTimes;
        this.charts.responseTime.update('none');
    }

    updateSlowestEndpointsChart(slowestEndpoints) {
        console.log('🐌 Updating slowest endpoints chart:', slowestEndpoints);
        
        // Handle both old and new data formats
        const labels = slowestEndpoints.map(item => item.name || item.endpoint || 'Unknown');
        const durations = slowestEndpoints.map(item => Math.round(item.AvgDuration || item.avgDuration || 0));
        
        console.log('🐌 Processed endpoint data:', { labels, durations });
        
        this.charts.slowestEndpoints.data.labels = labels;
        this.charts.slowestEndpoints.data.datasets[0].data = durations;
        this.charts.slowestEndpoints.update('none');
    }

    async triggerError() {
        try {
            this.elements.triggerErrorBtn.disabled = true;
            this.elements.triggerErrorBtn.innerHTML = '⏳ Triggering...';
            
            const response = await fetch('/error');
            
            // This should not execute since /error throws an error
            this.showToast('Unexpected: Error endpoint did not fail', 'warning');
            
        } catch (error) {
            this.showToast('Error successfully triggered - check Application Insights', 'success');
            
            // Refresh data after a short delay to show the new error
            setTimeout(() => this.loadDashboardData(), 2000);
            
        } finally {
            this.elements.triggerErrorBtn.disabled = false;
            this.elements.triggerErrorBtn.innerHTML = '⚠️ Trigger Error';
        }
    }

    updateStatus(status) {
        const { statusDot, statusText } = this.elements;
        
        statusDot.className = 'status-dot';
        
        switch (status) {
            case 'connected':
                statusDot.classList.add('success');
                statusText.textContent = 'Connected';
                break;
            case 'warning':
                statusDot.classList.add('warning');
                statusText.textContent = 'Reconnecting...';
                break;
            case 'error':
                statusDot.classList.add('error');
                statusText.textContent = 'Connection Error';
                break;
            default:
                statusText.textContent = 'Connecting...';
        }
    }

    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(() => {
            if (!document.hidden && !this.isLoading) {
                this.loadDashboardData();
            }
        }, 10000); // 10 seconds
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    showLoading() {
        this.elements.loadingOverlay.classList.add('show');
    }

    hideLoading() {
        this.elements.loadingOverlay.classList.remove('show');
    }

    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const title = document.createElement('div');
        title.className = 'toast-title';
        title.textContent = this.getToastTitle(type);
        
        const messageEl = document.createElement('div');
        messageEl.className = 'toast-message';
        messageEl.textContent = message;
        
        toast.appendChild(title);
        toast.appendChild(messageEl);
        
        this.elements.toastContainer.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    getToastTitle(type) {
        switch (type) {
            case 'success': return '✅ Success';
            case 'error': return '❌ Error';
            case 'warning': return '⚠️ Warning';
            default: return 'ℹ️ Info';
        }
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
}

// Global function for testing endpoints
async function testEndpoint(endpoint) {
    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (response.ok) {
            dashboard.showToast(`${endpoint} responded successfully`, 'success');
        } else {
            dashboard.showToast(`${endpoint} returned ${response.status}`, 'error');
        }
        
        console.log(`Response from ${endpoint}:`, data);
        
        // Refresh dashboard after testing an endpoint
        setTimeout(() => dashboard.loadDashboardData(), 1000);
        
    } catch (error) {
        dashboard.showToast(`Failed to test ${endpoint}: ${error.message}`, 'error');
        console.error(`Error testing ${endpoint}:`, error);
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing dashboard...');
    try {
        dashboard = new AzureDashboard();
        console.log('✅ Azure Monitor Dashboard initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing dashboard:', error);
    }
});

// Handle errors globally
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (dashboard) {
        dashboard.showToast('An unexpected error occurred', 'error');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (dashboard) {
        dashboard.showToast('An unexpected error occurred', 'error');
    }
});