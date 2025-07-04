// Dashboard Initialization Script
console.log('🔧 DEBUG: Dashboard script file loaded successfully');
console.log('🔧 DEBUG: Current timestamp:', new Date().toISOString());
console.log('🔧 DEBUG: Document ready state:', document.readyState);

// Global error handler
window.addEventListener('error', (e) => {
    console.error('🚨 GLOBAL ERROR:', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        error: e.error
    });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('🚨 UNHANDLED PROMISE REJECTION:', e.reason);
});

class DashboardManager {
    constructor() {
        console.log('🔧 DEBUG: DashboardManager constructor called');
        this.data = null;
        this.charts = {};
        this.loadingStatus = {
            data: false,
            components: false,
            charts: false
        };
        
        console.log('🔧 DEBUG: Starting initialization...');
        this.init();
    }

    async init() {
        console.log('🚀 Starting dashboard initialization...');
        
        try {
            // Show loading indicator
            this.showLoadingIndicator();
            
            // Load dashboard data first
            console.log('📊 Loading dashboard data...');
            await this.loadData();
            
            // Load components
            console.log('🧩 Loading components...');
            await this.loadComponents();
            
            // Wait a bit for DOM to settle
            await this.delay(100);
            
            // Initialize charts
            console.log('📈 Initializing charts...');
            await this.initializeCharts();
            
            // Populate data
            console.log('🔄 Populating data...');
            this.populateData();
            
            // Hide loading indicator
            this.hideLoadingIndicator();
            
            console.log('✅ Dashboard initialized successfully');
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            this.showError('Failed to initialize dashboard. Please refresh the page.');
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showLoadingIndicator() {
        const body = document.body;
        const loader = document.createElement('div');
        loader.id = 'dashboard-loader';
        loader.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--primary-bg);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                color: var(--accent-color);
                font-family: 'Segoe UI', sans-serif;
            ">
                <div style="text-align: center;">
                    <div style="
                        width: 50px;
                        height: 50px;
                        border: 3px solid var(--border-color);
                        border-top: 3px solid var(--accent-color);
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px;
                    "></div>
                    <div style="font-size: 18px; font-weight: 600;">Loading Dashboard...</div>
                    <div id="loading-status" style="font-size: 14px; margin-top: 10px; color: var(--text-secondary);">Initializing...</div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        body.appendChild(loader);
    }

    hideLoadingIndicator() {
        const loader = document.getElementById('dashboard-loader');
        if (loader) {
            loader.remove();
        }
    }

    updateLoadingStatus(message) {
        const statusEl = document.getElementById('loading-status');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }

    showError(message) {
        this.hideLoadingIndicator();
        const body = document.body;
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--secondary-bg);
                border: 1px solid var(--border-color);
                padding: 30px;
                border-radius: 10px;
                color: var(--text-primary);
                text-align: center;
                z-index: 10000;
                max-width: 400px;
            ">
                <div style="color: #ff6b6b; font-size: 24px; margin-bottom: 15px;">⚠️</div>
                <div style="font-size: 16px; margin-bottom: 20px;">${message}</div>
                <button onclick="location.reload()" style="
                    background: var(--accent-color);
                    color: var(--primary-bg);
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: 600;
                ">Refresh Page</button>
            </div>
        `;
        body.appendChild(errorDiv);
    }

    async loadData() {
        try {
            this.updateLoadingStatus('Loading dashboard data...');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch('./data/dashboard-data.json', {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.data = await response.json();
            this.loadingStatus.data = true;
            console.log('✅ Dashboard data loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load dashboard data:', error);
            throw new Error('Failed to load dashboard configuration');
        }
    }

    async loadComponents() {
        console.log('🔧 DEBUG: Starting component loading...');
        console.log('🔧 DEBUG: Current DOM state:', document.body ? 'Body exists' : 'No body');
        
        // Check if all container elements exist
        const expectedContainers = [
            '#sidebar-container', '#topbar-container', '#visitors-panel-container',
            '#sales-panel-container', '#members-panel-container', '#bandwidth-panel-container',
            '#server-panel-container', '#traffic-panel-container'
        ];
        
        console.log('🔧 DEBUG: Checking container elements...');
        expectedContainers.forEach(selector => {
            const element = document.querySelector(selector);
            console.log(`🔧 DEBUG: Container ${selector}:`, element ? 'EXISTS' : 'MISSING');
        });
        
        const components = [
            { selector: '#sidebar-container', url: './components/sidebar.html', name: 'Sidebar' },
            { selector: '#topbar-container', url: './components/topbar.html', name: 'Top Navigation' },
            { selector: '#visitors-panel-container', url: './components/dashboard/visitors-panel.html', name: 'Visitors Panel' },
            { selector: '#sales-panel-container', url: './components/dashboard/sales-panel.html', name: 'Sales Panel' },
            { selector: '#members-panel-container', url: './components/dashboard/members-panel.html', name: 'Members Panel' },
            { selector: '#bandwidth-panel-container', url: './components/dashboard/bandwidth-panel.html', name: 'Bandwidth Panel' },
            { selector: '#server-panel-container', url: './components/dashboard/server-panel.html', name: 'Server Panel' },
            { selector: '#traffic-panel-container', url: './components/dashboard/traffic-panel.html', name: 'Traffic Panel' }
        ];

        let loadedCount = 0;
        const totalComponents = components.length;

        for (const component of components) {
            try {
                console.log(`🔧 DEBUG: Attempting to load ${component.name} from ${component.url}`);
                this.updateLoadingStatus(`Loading ${component.name}... (${loadedCount + 1}/${totalComponents})`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    console.log(`🔧 DEBUG: Timeout for ${component.name}`);
                    controller.abort();
                }, 5000); // 5 second timeout per component
                
                console.log(`🔧 DEBUG: Fetching ${component.url}...`);
                const response = await fetch(component.url, {
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                console.log(`🔧 DEBUG: Response for ${component.name}:`, response.status, response.statusText);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const html = await response.text();
                console.log(`🔧 DEBUG: HTML length for ${component.name}:`, html.length);
                console.log(`🔧 DEBUG: HTML preview for ${component.name}:`, html.substring(0, 100));
                
                const container = document.querySelector(component.selector);
                console.log(`🔧 DEBUG: Container for ${component.name}:`, container ? 'FOUND' : 'NOT FOUND');
                
                if (container) {
                    container.innerHTML = html;
                    console.log(`✅ ${component.name} loaded successfully`);
                    console.log(`🔧 DEBUG: Container content after load:`, container.innerHTML.substring(0, 100));
                } else {
                    console.warn(`⚠️ Container not found for ${component.name}: ${component.selector}`);
                }
                
                loadedCount++;
            } catch (error) {
                console.error(`❌ Failed to load ${component.name}:`, error);
                console.error(`🔧 DEBUG: Error details:`, {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
                // Continue loading other components even if one fails
            }
        }
        
        this.loadingStatus.components = true;
        console.log(`✅ Components loaded: ${loadedCount}/${totalComponents}`);
        
        // Final DOM check
        console.log('🔧 DEBUG: Final DOM check after component loading...');
        expectedContainers.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`🔧 DEBUG: ${selector} content length:`, element.innerHTML.length);
            }
        });
    }

    async initializeCharts() {
        try {
            this.updateLoadingStatus('Initializing charts...');
            
            // Check if data is loaded
            if (!this.data) {
                throw new Error('Dashboard data not loaded');
            }
            
            // Chart.js Global Configuration
            Chart.defaults.color = '#a8b2d1';
            Chart.defaults.borderColor = 'rgba(100, 255, 218, 0.15)';
            Chart.defaults.backgroundColor = 'rgba(100, 255, 218, 0.1)';

            // Initialize all charts with error handling
            const chartInitializers = [
                { name: 'Site Visitors', fn: () => this.initSiteVisitorsChart() },
                { name: 'Store Sales', fn: () => this.initStoreSalesChart() },
                { name: 'New Members', fn: () => this.initNewMembersChart() },
                { name: 'Bandwidth', fn: () => this.initBandwidthChart() },
                { name: 'Server Stats', fn: () => this.initServerStatsChart() },
                { name: 'Disk Usage', fn: () => this.initDiskUsageChart() },
                { name: 'Bandwidth Usage', fn: () => this.initBandwidthUsageChart() },
                { name: 'Traffic Source', fn: () => this.initTrafficSourceChart() }
            ];
            
            let initializedCount = 0;
            for (const chart of chartInitializers) {
                try {
                    this.updateLoadingStatus(`Initializing ${chart.name} chart...`);
                    chart.fn();
                    initializedCount++;
                    console.log(`✅ ${chart.name} chart initialized`);
                } catch (error) {
                    console.error(`❌ Failed to initialize ${chart.name} chart:`, error);
                }
            }
            
            this.loadingStatus.charts = true;
            console.log(`✅ Charts initialized: ${initializedCount}/${chartInitializers.length}`);
        } catch (error) {
            console.error('❌ Chart initialization failed:', error);
            throw error;
        }
    }

    initSiteVisitorsChart() {
        const ctx = document.getElementById('siteVisitorsChart');
        if (!ctx) return;

        this.charts.siteVisitors = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['', '', '', '', '', '', '', '', '', ''],
                datasets: [{
                    data: this.data.chartData.siteVisitors,
                    backgroundColor: this.data.chartColors.primary,
                    borderColor: this.data.chartColors.primary,
                    borderWidth: 0,
                    borderRadius: 2,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                },
                elements: {
                    bar: { borderRadius: 2 }
                }
            }
        });
    }

    initStoreSalesChart() {
        const ctx = document.getElementById('storeSalesChart');
        if (!ctx) return;

        this.charts.storeSales = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['', '', '', '', '', '', '', '', '', '', ''],
                datasets: [{
                    data: this.data.chartData.storeSales,
                    borderColor: this.data.chartColors.primary,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    }

    initNewMembersChart() {
        const ctx = document.getElementById('newMembersChart');
        if (!ctx) return;

        this.charts.newMembers = new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                datasets: [{
                    data: this.data.chartData.newMembers,
                    backgroundColor: [this.data.chartColors.secondary, this.data.chartColors.tertiary, this.data.chartColors.dark],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    }

    initBandwidthChart() {
        const ctx = document.getElementById('bandwidthChart');
        if (!ctx) return;

        this.charts.bandwidth = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: this.data.chartData.bandwidth,
                    backgroundColor: [this.data.chartColors.primary, 'transparent'],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    }

    initServerStatsChart() {
        const ctx = document.getElementById('serverStatsChart');
        if (!ctx) return;

        this.charts.serverStats = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
                datasets: [{
                    label: 'Memory',
                    data: this.data.chartData.serverMemory,
                    backgroundColor: this.data.chartColors.serverMemory,
                    borderColor: this.data.chartColors.serverMemory,
                    borderWidth: 0,
                    borderRadius: 2,
                    maxBarThickness: 8
                }, {
                    label: 'CPU',
                    data: this.data.chartData.serverCPU,
                    backgroundColor: this.data.chartColors.serverCPU,
                    borderColor: this.data.chartColors.serverCPU,
                    borderWidth: 0,
                    borderRadius: 2,
                    maxBarThickness: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true }
                },
                scales: {
                    x: { 
                        display: true,
                        grid: { display: false },
                        ticks: { color: '#a8b2d1' }
                    },
                    y: { 
                        display: true,
                        grid: { color: 'rgba(100, 255, 218, 0.1)' },
                        ticks: { color: '#a8b2d1' },
                        max: 100
                    }
                }
            }
        });
    }

    initDiskUsageChart() {
        const ctx = document.getElementById('diskUsageChart');
        if (!ctx) return;

        this.charts.diskUsage = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: this.data.chartData.diskUsage,
                    backgroundColor: [this.data.chartColors.primary, this.data.chartColors.diskBackground],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    }

    initBandwidthUsageChart() {
        const ctx = document.getElementById('bandwidthUsageChart');
        if (!ctx) return;

        this.charts.bandwidthUsage = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: this.data.chartData.bandwidthUsage,
                    backgroundColor: [this.data.chartColors.primary, this.data.chartColors.diskBackground],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    }

    initTrafficSourceChart() {
        const ctx = document.getElementById('trafficSourceChart');
        if (!ctx) return;

        this.charts.trafficSource = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: this.data.chartData.trafficSource,
                    backgroundColor: [
                        this.data.chartColors.secondary,
                        this.data.chartColors.tertiary,
                        this.data.chartColors.warning,
                        this.data.chartColors.danger,
                        this.data.chartColors.purple,
                        this.data.chartColors.gray
                    ],
                    borderWidth: 0,
                    cutout: '60%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    }

    populateData() {
        // Populate metrics data dynamically
        this.populateMetrics();
        this.populateServerStats();
        this.populateTrafficAnalytics();
    }

    populateMetrics() {
        // Site Visitors
        const visitorsMetric = document.getElementById('visitors-metric');
        const visitorsSubMetrics = document.getElementById('visitors-sub-metrics');
        if (visitorsMetric && this.data.metrics.siteVisitors) {
            visitorsMetric.textContent = this.data.metrics.siteVisitors.value;
            if (visitorsSubMetrics) {
                visitorsSubMetrics.innerHTML = this.data.metrics.siteVisitors.subMetrics
                    .map(metric => `<li><i class="${metric.icon} ${metric.class || ''}"></i>${metric.text}</li>`)
                    .join('');
            }
        }

        // Store Sales
        const salesMetric = document.getElementById('sales-metric');
        const salesSubMetrics = document.getElementById('sales-sub-metrics');
        if (salesMetric && this.data.metrics.storeSales) {
            salesMetric.textContent = this.data.metrics.storeSales.value;
            if (salesSubMetrics) {
                salesSubMetrics.innerHTML = this.data.metrics.storeSales.subMetrics
                    .map(metric => `<li><i class="${metric.icon} ${metric.class || ''}"></i>${metric.text}</li>`)
                    .join('');
            }
        }

        // New Members
        const membersMetric = document.getElementById('members-metric');
        const membersSubMetrics = document.getElementById('members-sub-metrics');
        if (membersMetric && this.data.metrics.newMembers) {
            membersMetric.textContent = this.data.metrics.newMembers.value;
            if (membersSubMetrics) {
                membersSubMetrics.innerHTML = this.data.metrics.newMembers.subMetrics
                    .map(metric => `<li><i class="${metric.icon} ${metric.class || ''}"></i>${metric.text}</li>`)
                    .join('');
            }
        }

        // Bandwidth
        const bandwidthMetric = document.getElementById('bandwidth-metric');
        const bandwidthSubMetrics = document.getElementById('bandwidth-sub-metrics');
        if (bandwidthMetric && this.data.metrics.bandwidth) {
            bandwidthMetric.textContent = this.data.metrics.bandwidth.value;
            if (bandwidthSubMetrics) {
                bandwidthSubMetrics.innerHTML = this.data.metrics.bandwidth.subMetrics
                    .map(metric => `<li><i class="${metric.icon} ${metric.class || ''}"></i>${metric.text}</li>`)
                    .join('');
            }
        }
    }

    populateServerStats() {
        // Disk Usage
        const diskPercentage = document.getElementById('disk-percentage');
        const diskMetric = document.getElementById('disk-metric');
        const diskUpdated = document.getElementById('disk-updated');
        const diskDetails = document.getElementById('disk-details');

        if (diskPercentage && this.data.serverStats.diskUsage) {
            diskPercentage.textContent = this.data.serverStats.diskUsage.percentage;
        }
        if (diskMetric && this.data.serverStats.diskUsage) {
            diskMetric.textContent = this.data.serverStats.diskUsage.metric;
        }
        if (diskUpdated && this.data.serverStats.diskUsage) {
            diskUpdated.textContent = this.data.serverStats.diskUsage.updated;
        }
        if (diskDetails && this.data.serverStats.diskUsage) {
            diskDetails.innerHTML = this.data.serverStats.diskUsage.details
                .map(detail => `<li><span class="label"><span class="dot"></span> ${detail.label}</span> <span class="value">${detail.value}</span></li>`)
                .join('');
        }

        // Bandwidth Usage
        const bandwidthUsageMetric = document.getElementById('bandwidth-usage-metric');
        const bandwidthUsageUpdated = document.getElementById('bandwidth-usage-updated');
        const bandwidthUsageDetails = document.getElementById('bandwidth-usage-details');

        if (bandwidthUsageMetric && this.data.serverStats.bandwidth) {
            bandwidthUsageMetric.textContent = this.data.serverStats.bandwidth.metric;
        }
        if (bandwidthUsageUpdated && this.data.serverStats.bandwidth) {
            bandwidthUsageUpdated.textContent = this.data.serverStats.bandwidth.updated;
        }
        if (bandwidthUsageDetails && this.data.serverStats.bandwidth) {
            bandwidthUsageDetails.innerHTML = this.data.serverStats.bandwidth.details
                .map(detail => `<li><span class="label"><span class="dot"></span> ${detail.label}</span> <span class="value">${detail.value}</span></li>`)
                .join('');
        }
    }

    populateTrafficAnalytics() {
        // Traffic Table
        const trafficTable = document.getElementById('traffic-table');
        if (trafficTable && this.data.trafficAnalytics.countries) {
            const headerRow = trafficTable.querySelector('.header-row');
            const dataRows = this.data.trafficAnalytics.countries
                .map(country => `
                    <div class="row data-row ${country.active ? 'active' : ''} g-0">
                        <div class="col-5">${country.name}</div>
                        <div class="col-4 text-end">${country.visits}</div>
                        <div class="col-3 text-end">${country.percentage}</div>
                    </div>
                `).join('');
            
            trafficTable.innerHTML = headerRow.outerHTML + dataRows;
        }

        // Traffic Sources
        const trafficSources = document.getElementById('traffic-sources');
        if (trafficSources && this.data.trafficAnalytics.trafficSources) {
            trafficSources.innerHTML = this.data.trafficAnalytics.trafficSources
                .map(source => `<li><span class="label"><span class="dot" style="background-color: ${source.color};"></span> ${source.label}</span> <span class="value">${source.percentage}</span></li>`)
                .join('');
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});
