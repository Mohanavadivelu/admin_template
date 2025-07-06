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
            
            // Initialize application management
            console.log('📱 Initializing application management...');
            this.initializeApplicationManagement();
            
            // Initialize navigation
            console.log('🧭 Initializing navigation...');
            this.initializeNavigation();
            
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
            { selector: '#sidebar-container', url: './components/common/sidebar.html', name: 'Sidebar' },
            { selector: '#topbar-container', url: './components/common/topbar.html', name: 'Top Navigation' },
            { selector: '#visitors-panel-container', url: './components/pages/dashboard/visitors-panel.html', name: 'Visitors Panel' },
            { selector: '#sales-panel-container', url: './components/pages/dashboard/sales-panel.html', name: 'Sales Panel' },
            { selector: '#members-panel-container', url: './components/pages/dashboard/members-panel.html', name: 'Members Panel' },
            { selector: '#bandwidth-panel-container', url: './components/pages/dashboard/bandwidth-panel.html', name: 'Bandwidth Panel' },
            { selector: '#server-panel-container', url: './components/pages/dashboard/server-panel.html', name: 'Server Panel' },
            { selector: '#traffic-panel-container', url: './components/pages/dashboard/traffic-panel.html', name: 'Traffic Panel' },
            { selector: '#app-form-panel-container', url: './components/pages/app-manager/app-form-panel.html', name: 'Application Form Panel' },
            { selector: '#app-table-panel-container', url: './components/pages/app-manager/app-table-panel.html', name: 'Applications Table Panel' }
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

    // Application Management Methods
    initializeApplicationManagement() {
        try {
            console.log('🔧 DEBUG: Initializing application management...');
            
            // Initialize application data storage
            this.applications = this.data.applications || [];
            console.log('🔧 DEBUG: Applications loaded:', this.applications.length, 'items');
            console.log('🔧 DEBUG: Sample application:', this.applications[0]);
            
            this.currentEditingApp = null;
            this.currentPage = 1;
            this.itemsPerPage = 10;
            this.sortField = 'app_name';
            this.sortDirection = 'asc';
            this.searchTerm = '';

            // Populate applications table immediately
            console.log('🔧 DEBUG: About to populate applications table...');
            this.populateApplicationsTable();

            // Set up form event listeners
            this.setupApplicationFormEvents();

            // Set up table event listeners
            this.setupApplicationTableEvents();

            // Set today's date as default for registration date
            const registeredDateInput = document.getElementById('registered_date');
            if (registeredDateInput) {
                registeredDateInput.value = new Date().toISOString().split('T')[0];
            }

            console.log('✅ Application management initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize application management:', error);
        }
    }

    setupApplicationFormEvents() {
        // Form submission
        const appForm = document.getElementById('app-form');
        if (appForm) {
            appForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmission();
            });
        }

        // Reset form button
        const resetBtn = document.getElementById('reset-form');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetForm();
            });
        }

        // Clear form button
        const clearBtn = document.getElementById('clear-form');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearForm();
            });
        }

        // Enable tracking toggle
        const enableTrackingToggle = document.getElementById('enable_tracking');
        if (enableTrackingToggle) {
            enableTrackingToggle.addEventListener('change', (e) => {
                this.toggleTrackingOptions(e.target.checked);
            });
        }

        // CPU/Memory tracking toggle
        const cpuMemoryToggle = document.getElementById('track_cpu_memory');
        if (cpuMemoryToggle) {
            cpuMemoryToggle.addEventListener('change', (e) => {
                this.toggleCpuMemoryOptions(e.target.checked);
            });
        }
    }

    setupApplicationTableEvents() {
        // Search functionality
        const searchInput = document.getElementById('app-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.currentPage = 1;
                this.populateApplicationsTable();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-table');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.populateApplicationsTable();
                this.showMessage('Table refreshed successfully', 'success');
            });
        }

        // Export button
        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportApplicationData();
            });
        }

        // Table sorting
        const sortableHeaders = document.querySelectorAll('.sortable');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const field = header.dataset.sort;
                this.handleSort(field);
            });
        });
    }

    handleFormSubmission() {
        try {
            const formData = this.getFormData();
            
            // Validate form data
            if (!this.validateFormData(formData)) {
                return;
            }

            if (this.currentEditingApp) {
                // Update existing application
                this.updateApplication(formData);
            } else {
                // Add new application
                this.addApplication(formData);
            }

            this.clearForm();
            this.populateApplicationsTable();
            this.showMessage('Application saved successfully!', 'success');
        } catch (error) {
            console.error('Form submission error:', error);
            this.showMessage('Failed to save application. Please try again.', 'error');
        }
    }

    getFormData() {
        const form = document.getElementById('app-form');
        const formData = new FormData(form);
        
        return {
            id: this.currentEditingApp ? this.currentEditingApp.id : Date.now(),
            app_name: formData.get('app_name'),
            app_type: formData.get('app_type'),
            current_version: formData.get('current_version'),
            released_date: formData.get('released_date'),
            publisher: formData.get('publisher'),
            description: formData.get('description') || '',
            download_link: formData.get('download_link') || '',
            enable_tracking: formData.get('enable_tracking') === 'on',
            track: {
                usage: formData.get('track_usage') === 'on',
                location: formData.get('track_location') === 'on',
                cpu_memory: {
                    track_cm: formData.get('track_cpu_memory') === 'on',
                    track_intr: parseInt(formData.get('track_interval')) || 1
                }
            },
            registered_date: formData.get('registered_date')
        };
    }

    validateFormData(data) {
        const requiredFields = ['app_name', 'app_type', 'current_version', 'released_date', 'publisher', 'registered_date'];
        
        for (const field of requiredFields) {
            if (!data[field] || data[field].trim() === '') {
                this.showMessage(`Please fill in the ${field.replace('_', ' ')} field.`, 'error');
                return false;
            }
        }

        // Validate URL if provided
        if (data.download_link && !this.isValidUrl(data.download_link)) {
            this.showMessage('Please enter a valid download URL.', 'error');
            return false;
        }

        return true;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    addApplication(appData) {
        this.applications.push(appData);
        this.saveApplicationsToStorage();
    }

    updateApplication(appData) {
        const index = this.applications.findIndex(app => app.id === this.currentEditingApp.id);
        if (index !== -1) {
            this.applications[index] = appData;
            this.saveApplicationsToStorage();
        }
        this.currentEditingApp = null;
    }

    deleteApplication(appId) {
        this.applications = this.applications.filter(app => app.id !== appId);
        this.saveApplicationsToStorage();
        this.populateApplicationsTable();
        this.showMessage('Application deleted successfully!', 'success');
    }

    saveApplicationsToStorage() {
        // In a real application, this would save to a backend API
        // For now, we'll use localStorage
        localStorage.setItem('dashboard_applications', JSON.stringify(this.applications));
    }

    loadApplicationsFromStorage() {
        const stored = localStorage.getItem('dashboard_applications');
        if (stored) {
            this.applications = JSON.parse(stored);
        }
    }

    populateApplicationsTable() {
        console.log('🔧 DEBUG: populateApplicationsTable called');
        console.log('🔧 DEBUG: this.applications:', this.applications);
        console.log('🔧 DEBUG: this.applications.length:', this.applications ? this.applications.length : 'undefined');
        
        const tbody = document.getElementById('applications-tbody');
        const emptyState = document.getElementById('empty-state');
        
        console.log('🔧 DEBUG: tbody element:', tbody);
        console.log('🔧 DEBUG: emptyState element:', emptyState);
        
        if (!tbody) {
            console.log('🔧 DEBUG: tbody not found, returning');
            return;
        }

        // Filter applications based on search term
        let filteredApps = this.applications.filter(app => {
            if (!this.searchTerm) return true;
            return (
                app.app_name.toLowerCase().includes(this.searchTerm) ||
                app.publisher.toLowerCase().includes(this.searchTerm) ||
                app.current_version.toLowerCase().includes(this.searchTerm)
            );
        });

        // Sort applications
        filteredApps.sort((a, b) => {
            let aVal = a[this.sortField];
            let bVal = b[this.sortField];
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (this.sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        // Show empty state if no applications
        if (filteredApps.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        // Pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedApps = filteredApps.slice(startIndex, endIndex);

        // Generate table rows
        tbody.innerHTML = paginatedApps.map(app => `
            <tr>
                <td>
                    <div>
                        <strong>${app.app_name}</strong>
                        <br>
                        <small class="text-muted">${app.description ? app.description.substring(0, 50) + '...' : 'No description'}</small>
                    </div>
                </td>
                <td>${app.current_version}</td>
                <td>${app.publisher}</td>
                <td>
                    <span class="status-badge ${app.enable_tracking ? 'active' : 'inactive'}">
                        <span class="status-dot"></span>
                        ${app.enable_tracking ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn" onclick="window.dashboardManager.viewApplication(${app.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn" onclick="window.dashboardManager.editApplication(${app.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn danger" onclick="window.dashboardManager.confirmDeleteApplication(${app.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Update pagination
        this.updatePagination(filteredApps.length);
    }

    updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const paginationContainer = document.getElementById('pagination-container');
        
        if (totalPages <= 1) {
            if (paginationContainer) paginationContainer.style.display = 'none';
            return;
        }

        if (paginationContainer) paginationContainer.style.display = 'block';

        // Update pagination info
        const showingStart = document.getElementById('showing-start');
        const showingEnd = document.getElementById('showing-end');
        const totalRecords = document.getElementById('total-records');

        if (showingStart) showingStart.textContent = (this.currentPage - 1) * this.itemsPerPage + 1;
        if (showingEnd) showingEnd.textContent = Math.min(this.currentPage * this.itemsPerPage, totalItems);
        if (totalRecords) totalRecords.textContent = totalItems;

        // Generate pagination buttons
        const paginationList = document.getElementById('pagination-list');
        if (!paginationList) return;

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="window.dashboardManager.changePage(${this.currentPage - 1})">Previous</a>
            </li>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                paginationHTML += `
                    <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="window.dashboardManager.changePage(${i})">${i}</a>
                    </li>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="window.dashboardManager.changePage(${this.currentPage + 1})">Next</a>
            </li>
        `;

        paginationList.innerHTML = paginationHTML;
    }

    changePage(page) {
        const totalPages = Math.ceil(this.applications.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.populateApplicationsTable();
        }
    }

    handleSort(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }

        // Update sort icons
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
            if (header.dataset.sort === field) {
                header.classList.add(`sort-${this.sortDirection}`);
            }
        });

        this.populateApplicationsTable();
    }

    viewApplication(appId) {
        const app = this.applications.find(a => a.id === appId);
        if (!app) return;

        // Create custom modal with new styling
        this.showApplicationModal(app);
    }

    showApplicationModal(app) {
        // Remove existing modal if present
        const existingModal = document.getElementById('custom-app-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal HTML with proper structured layout matching the expected design
        const modalHTML = `
            <div class="modal-overlay active" id="custom-app-modal">
                <div class="modal animate-in">
                    <div class="modal-header">
                        <h2 class="modal-title">APPLICATION DETAILS</h2>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            ×
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="modal-grid">
                            <div class="modal-field-card">
                                <span class="modal-field-label">APPLICATION NAME</span>
                                <div class="modal-field-value">${app.app_name}</div>
                            </div>
                            
                            <div class="modal-field-card">
                                <span class="modal-field-label">TYPE</span>
                                <div class="modal-field-value">${app.app_type.toUpperCase()}</div>
                            </div>
                            
                            <div class="modal-field-card">
                                <span class="modal-field-label">VERSION</span>
                                <div class="modal-field-value">${app.current_version}</div>
                            </div>
                            
                            <div class="modal-field-card">
                                <span class="modal-field-label">PUBLISHER</span>
                                <div class="modal-field-value">${app.publisher}</div>
                            </div>
                            
                            <div class="modal-field-card">
                                <span class="modal-field-label">RELEASE DATE</span>
                                <div class="modal-field-value">${new Date(app.released_date).toLocaleDateString()}</div>
                            </div>
                            
                            <div class="modal-field-card">
                                <span class="modal-field-label">REGISTRATION DATE</span>
                                <div class="modal-field-value">${new Date(app.registered_date).toLocaleDateString()}</div>
                            </div>
                        </div>
                        
                        ${app.description ? `
                            <div class="modal-field-card modal-field-full">
                                <span class="modal-field-label">DESCRIPTION</span>
                                <div class="modal-field-value">${app.description}</div>
                            </div>
                        ` : ''}
                        
                        ${app.download_link ? `
                            <div class="modal-field-card modal-field-full">
                                <span class="modal-field-label">DOWNLOAD LINK</span>
                                <div class="modal-field-value">
                                    <a href="${app.download_link}" class="modal-field-value link" target="_blank">${app.download_link}</a>
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="modal-field-card modal-field-full">
                            <span class="modal-field-label">TRACKING STATUS</span>
                            <div class="modal-field-value">
                                <span class="modal-status-badge ${app.enable_tracking ? 'enabled' : 'disabled'}">
                                    ${app.enable_tracking ? 'ENABLED' : 'DISABLED'}
                                </span>
                            </div>
                        </div>
                        
                        ${app.enable_tracking ? `
                            <div class="modal-tracking-details">
                                <span class="modal-field-label">TRACKING DETAILS</span>
                                <div class="modal-tracking-item">Usage Tracking: ${app.track.usage ? 'Enabled' : 'Disabled'}</div>
                                <div class="modal-tracking-item">Location Tracking: ${app.track.location ? 'Enabled' : 'Disabled'}</div>
                                <div class="modal-tracking-item">CPU/Memory Tracking: ${app.track.cpu_memory.track_cm ? `Enabled (${app.track.cpu_memory.track_intr} min intervals)` : 'Disabled'}</div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                        <button class="btn btn-primary" onclick="window.dashboardManager.editApplicationFromModal(${app.id})">
                            Edit Application
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add click outside to close
        const modalOverlay = document.getElementById('custom-app-modal');
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
            }
        });

        // Add escape key to close
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modalOverlay.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    editApplicationFromModal(appId) {
        // Close modal
        const modal = document.getElementById('custom-app-modal');
        if (modal) modal.remove();
        
        // Edit application
        this.editApplication(appId);
    }

    editApplication(appId) {
        const app = this.applications.find(a => a.id === appId);
        if (!app) return;

        this.currentEditingApp = app;

        // Populate form with application data
        document.getElementById('app_name').value = app.app_name;
        document.getElementById('app_type').value = app.app_type;
        document.getElementById('current_version').value = app.current_version;
        document.getElementById('released_date').value = app.released_date;
        document.getElementById('publisher').value = app.publisher;
        document.getElementById('description').value = app.description || '';
        document.getElementById('download_link').value = app.download_link || '';
        document.getElementById('registered_date').value = app.registered_date;

        // Set tracking options
        document.getElementById('enable_tracking').checked = app.enable_tracking;
        this.toggleTrackingOptions(app.enable_tracking);

        if (app.enable_tracking) {
            document.getElementById('track_usage').checked = app.track.usage;
            document.getElementById('track_location').checked = app.track.location;
            document.getElementById('track_cpu_memory').checked = app.track.cpu_memory.track_cm;
            document.getElementById('track_interval').value = app.track.cpu_memory.track_intr;
            this.toggleCpuMemoryOptions(app.track.cpu_memory.track_cm);
        }

        // Update form title
        const panelTitle = document.querySelector('#app-form-panel-container .panel-title');
        if (panelTitle) {
            panelTitle.textContent = 'EDIT APPLICATION';
        }

        // Scroll to form
        document.getElementById('app-form-panel-container').scrollIntoView({ behavior: 'smooth' });
    }

    confirmDeleteApplication(appId) {
        const app = this.applications.find(a => a.id === appId);
        if (!app) return;

        // Get the modal elements
        const modal = document.getElementById('deleteConfirmationModal');
        const appNameEl = document.getElementById('deleteItemName');
        const appVersionEl = document.getElementById('deleteItemVersion');
        const appPublisherEl = document.getElementById('deleteItemPublisher');

        if (!modal || !appNameEl || !appVersionEl || !appPublisherEl) {
            console.error('Delete confirmation modal elements not found');
            return;
        }

        // Populate modal with application data
        appNameEl.textContent = app.app_name;
        appVersionEl.textContent = app.current_version;
        appPublisherEl.textContent = app.publisher;

        // Store the app ID for deletion
        modal.dataset.deleteAppId = appId;

        // Show the modal
        this.showModal('deleteConfirmationModal');
    }

    toggleTrackingOptions(enabled) {
        const trackingOptions = document.getElementById('tracking-options');
        if (trackingOptions) {
            trackingOptions.style.display = enabled ? 'block' : 'none';
        }
    }

    toggleCpuMemoryOptions(enabled) {
        const cpuMemoryOptions = document.getElementById('cpu-memory-options');
        if (cpuMemoryOptions) {
            cpuMemoryOptions.style.display = enabled ? 'block' : 'none';
        }
    }

    resetForm() {
        const form = document.getElementById('app-form');
        if (form) {
            form.reset();
            this.currentEditingApp = null;
            
            // Reset form title
            const panelTitle = document.querySelector('#app-form-panel-container .panel-title');
            if (panelTitle) {
                panelTitle.textContent = 'ADD NEW APPLICATION';
            }

            // Set today's date as default
            const registeredDateInput = document.getElementById('registered_date');
            if (registeredDateInput) {
                registeredDateInput.value = new Date().toISOString().split('T')[0];
            }

            // Reset tracking options
            this.toggleTrackingOptions(true); // Default to enabled
            this.toggleCpuMemoryOptions(false);
        }
    }

    clearForm() {
        this.resetForm();
        this.showMessage('Form cleared successfully', 'success');
    }

    exportApplicationData() {
        try {
            const dataStr = JSON.stringify(this.applications, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `applications_export_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showMessage('Application data exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showMessage('Failed to export data. Please try again.', 'error');
        }
    }

    showMessage(message, type = 'success') {
        const messagesContainer = document.getElementById('form-messages');
        if (!messagesContainer) return;

        const alertClass = type === 'error' ? 'alert-danger' : 'alert-success';
        const iconClass = type === 'error' ? 'fa-exclamation-triangle' : 'fa-check-circle';

        messagesContainer.innerHTML = `
            <div class="alert ${alertClass}" role="alert">
                <i class="fas ${iconClass} me-2"></i>
                <span class="message-text">${message}</span>
            </div>
        `;
        messagesContainer.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            messagesContainer.style.display = 'none';
        }, 5000);
    }

    // Navigation Management Methods
    initializeNavigation() {
        try {
            // Set up navigation event listeners
            this.setupNavigationEvents();
            
            // Initialize with dashboard page active
            this.currentPage = 'dashboard';
            this.showPage('dashboard');
            
            console.log('✅ Navigation initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize navigation:', error);
        }
    }

    setupNavigationEvents() {
        // Add click event listeners to navigation links
        const navLinks = document.querySelectorAll('.sidebar-nav-link[data-page]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigateToPage(page);
            });
        });
    }

    navigateToPage(page) {
        if (this.currentPage === page) return;

        // Update navigation active state
        this.updateNavigationState(page);
        
        // Show the selected page
        this.showPage(page);
        
        // Update current page
        this.currentPage = page;
        
        console.log(`📄 Navigated to ${page} page`);
    }

    updateNavigationState(activePage) {
        const navLinks = document.querySelectorAll('.sidebar-nav-link[data-page]');
        navLinks.forEach(link => {
            const page = link.getAttribute('data-page');
            if (page === activePage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    showPage(page) {
        console.log(`🔄 Switching to ${page} page and refreshing data...`);
        
        // Hide all page content
        const allPages = document.querySelectorAll('.page-content');
        allPages.forEach(pageEl => {
            pageEl.classList.remove('active');
        });

        // Show the selected page
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Refresh page-specific data
        setTimeout(() => {
            this.refreshPageData(page);
        }, 100);
    }

    refreshPageData(page) {
        try {
            console.log(`🔄 Refreshing data for ${page} page...`);
            
            switch (page) {
                case 'dashboard':
                    this.refreshDashboardPage();
                    break;
                case 'app-manager':
                    this.refreshAppManagerPage();
                    break;
                default:
                    console.log(`No specific refresh logic for ${page} page`);
            }
            
            console.log(`✅ ${page} page data refreshed successfully`);
        } catch (error) {
            console.error(`❌ Failed to refresh ${page} page data:`, error);
        }
    }

    refreshDashboardPage() {
        console.log('🔄 Refreshing Dashboard page data...');
        
        try {
            // Re-populate all metrics data
            this.populateMetrics();
            
            // Re-populate server statistics
            this.populateServerStats();
            
            // Re-populate traffic analytics
            this.populateTrafficAnalytics();
            
            // Re-initialize charts with fresh data (in case data has changed)
            this.refreshCharts();
            
            console.log('✅ Dashboard page refreshed successfully');
        } catch (error) {
            console.error('❌ Failed to refresh dashboard page:', error);
        }
    }

    refreshAppManagerPage() {
        console.log('🔄 Refreshing App Manager page data...');
        
        try {
            // Reset search and pagination state
            this.searchTerm = '';
            this.currentPage = 1;
            
            // Clear search input
            const searchInput = document.getElementById('app-search');
            if (searchInput) {
                searchInput.value = '';
            }
            
            // Re-populate applications table with fresh data
            this.populateApplicationsTable();
            
            // Clear any form editing state
            this.currentEditingApp = null;
            
            // Reset form title if needed
            const panelTitle = document.querySelector('#app-form-panel-container .panel-title');
            if (panelTitle && panelTitle.textContent !== 'ADD NEW APPLICATION') {
                panelTitle.textContent = 'ADD NEW APPLICATION';
            }
            
            console.log('✅ App Manager page refreshed successfully');
        } catch (error) {
            console.error('❌ Failed to refresh app manager page:', error);
        }
    }

    refreshCharts() {
        console.log('🔄 Refreshing charts...');
        
        try {
            // Destroy existing charts if they exist
            Object.keys(this.charts).forEach(chartKey => {
                if (this.charts[chartKey]) {
                    this.charts[chartKey].destroy();
                }
            });
            
            // Clear charts object
            this.charts = {};
            
            // Re-initialize all charts
            this.initializeCharts();
            
            console.log('✅ Charts refreshed successfully');
        } catch (error) {
            console.error('❌ Failed to refresh charts:', error);
        }
    }

    // Modal Management Methods
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal with ID ${modalId} not found`);
            return;
        }

        // Remove aria-hidden and add active class
        modal.setAttribute('aria-hidden', 'false');
        modal.classList.add('active');
        
        // Add animation class to modal content
        const modalContent = modal.querySelector('.modal');
        if (modalContent) {
            modalContent.classList.add('animate-in');
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Add escape key listener
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modalId);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modalId);
            }
        });

        console.log(`✅ Modal ${modalId} shown`);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal with ID ${modalId} not found`);
            return;
        }

        // Add animation class for closing
        const modalContent = modal.querySelector('.modal');
        if (modalContent) {
            modalContent.classList.add('animate-out');
            modalContent.classList.remove('animate-in');
        }

        // Wait for animation to complete before hiding
        setTimeout(() => {
            modal.setAttribute('aria-hidden', 'true');
            modal.classList.remove('active');
            
            if (modalContent) {
                modalContent.classList.remove('animate-out');
            }
        }, 200);

        // Restore body scroll
        document.body.style.overflow = '';

        console.log(`✅ Modal ${modalId} closed`);
    }

    confirmDelete() {
        const modal = document.getElementById('deleteConfirmationModal');
        if (!modal) {
            console.error('Delete confirmation modal not found');
            return;
        }

        const appId = modal.dataset.deleteAppId;
        if (!appId) {
            console.error('No app ID found for deletion');
            return;
        }

        // Close the modal first
        this.closeModal('deleteConfirmationModal');

        // Delete the application
        this.deleteApplication(parseInt(appId));

        console.log(`✅ Application ${appId} deletion confirmed`);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboardManager = new DashboardManager();
    // Make it globally accessible for onclick handlers
    window.dashboardManager = dashboardManager;
});

// Global functions for modal interactions (referenced in HTML)
function closeModal(modalId) {
    if (window.dashboardManager) {
        window.dashboardManager.closeModal(modalId);
    }
}

function confirmDelete() {
    if (window.dashboardManager) {
        window.dashboardManager.confirmDelete();
    }
}
