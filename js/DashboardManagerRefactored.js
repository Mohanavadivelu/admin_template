/**
 * DashboardManager - Refactored main application controller
 * 
 * This is the refactored version that uses the new service architecture.
 * It coordinates between different services and manages the overall application flow.
 * 
 * Responsibilities:
 * - Coordinate between services
 * - Handle application initialization
 * - Manage page navigation
 * - Handle modal interactions
 * - Provide unified API for UI interactions
 * 
 * @author Dashboard Team
 * @version 2.0.0
 */

class DashboardManagerRefactored {
    constructor() {
        console.log('🚀 DashboardManagerRefactored initializing...');
        
        // Initialize services
        this.initializeServices();
        
        // Setup service coordination
        this.setupServiceCoordination();
        
        // Start initialization
        this.init();
    }

    /**
     * Initialize all services
     */
    initializeServices() {
        try {
            // Core services
            this.errorHandler = new ErrorHandler();
            this.stateManager = new StateManager();
            this.dataService = new DataService();
            this.validationService = new ValidationService();
            
            // UI services
            this.componentLoader = new ComponentLoader();
            this.chartManager = new ChartManager(this.stateManager, this.errorHandler);
            
            // Feature services
            this.applicationManager = new ApplicationManager(
                this.dataService,
                this.validationService,
                this.stateManager,
                this.errorHandler
            );
            
            console.log('✅ All services initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize services:', error);
            this.errorHandler.handle(error, 'Service Initialization');
            throw error;
        }
    }

    /**
     * Setup coordination between services
     */
    setupServiceCoordination() {
        // Subscribe to state changes for coordination
        this.stateManager.subscribe('currentPage', (newPage) => {
            this.handlePageChange(newPage);
        });

        this.stateManager.subscribe('dashboardData', (newData) => {
            if (newData) {
                this.handleDashboardDataUpdate(newData);
            }
        });

        // Setup error handling coordination
        this.setupErrorHandlingCoordination();
        
        console.log('🔗 Service coordination setup complete');
    }

    /**
     * Setup error handling coordination
     */
    setupErrorHandlingCoordination() {
        // Coordinate error handling across services
        this.errorHandler.showUserMessage = (message, type) => {
            this.showMessage(message, type);
        };
    }

    /**
     * Main initialization method
     */
    async init() {
        try {
            console.log('🚀 Starting dashboard initialization...');
            
            // Show loading indicator
            this.showLoadingIndicator();
            
            // Load dashboard data
            await this.loadDashboardData();
            
            // Load components
            await this.loadComponents();
            
            // Initialize charts
            await this.initializeCharts();
            
            // Initialize application management
            await this.initializeApplicationManagement();
            
            // Setup navigation
            this.setupNavigation();
            
            // Populate initial data
            this.populateInitialData();
            
            // Hide loading indicator
            this.hideLoadingIndicator();
            
            console.log('✅ Dashboard initialization complete');
            
        } catch (error) {
            this.errorHandler.handle(error, 'Dashboard Initialization');
            this.showError('Failed to initialize dashboard. Please refresh the page.');
        }
    }

    /**
     * Load dashboard data
     */
    async loadDashboardData() {
        try {
            this.updateLoadingStatus('Loading dashboard data...');
            
            const dashboardData = await this.dataService.loadDashboardData();
            
            // Validate data structure
            const requiredFields = ['metrics', 'chartData', 'chartColors'];
            if (!this.dataService.validateDataStructure(dashboardData, requiredFields)) {
                throw new Error('Invalid dashboard data structure');
            }
            
            // Update state
            this.stateManager.setState({ dashboardData });
            
            console.log('✅ Dashboard data loaded successfully');
            
        } catch (error) {
            throw new Error(`Failed to load dashboard data: ${error.message}`);
        }
    }

    /**
     * Load components
     */
    async loadComponents() {
        try {
            this.updateLoadingStatus('Loading components...');
            
            const results = await this.componentLoader.loadAllComponents((progress) => {
                this.updateLoadingStatus(`Loading ${progress.component}... (${progress.current}/${progress.total})`);
            });
            
            if (results.failed.length > 0) {
                console.warn('Some components failed to load:', results.failed);
            }
            
            console.log(`✅ Components loaded: ${results.loaded.length}/${results.total}`);
            
        } catch (error) {
            throw new Error(`Failed to load components: ${error.message}`);
        }
    }

    /**
     * Initialize charts
     */
    async initializeCharts() {
        try {
            this.updateLoadingStatus('Initializing charts...');
            
            if (!this.chartManager.isChartJsAvailable()) {
                throw new Error('Chart.js library not available');
            }
            
            const dashboardData = this.stateManager.getState('dashboardData');
            const results = await this.chartManager.initializeAllCharts(dashboardData);
            
            if (results.failed.length > 0) {
                console.warn('Some charts failed to initialize:', results.failed);
            }
            
            console.log(`✅ Charts initialized: ${results.initialized.length}/${this.chartManager.chartConfigs.size}`);
            
        } catch (error) {
            throw new Error(`Failed to initialize charts: ${error.message}`);
        }
    }

    /**
     * Initialize application management
     */
    async initializeApplicationManagement() {
        try {
            this.updateLoadingStatus('Initializing application management...');
            
            const dashboardData = this.stateManager.getState('dashboardData');
            const defaultApplications = dashboardData.applications || [];
            
            await this.applicationManager.initialize(defaultApplications);
            
            console.log('✅ Application management initialized');
            
        } catch (error) {
            throw new Error(`Failed to initialize application management: ${error.message}`);
        }
    }

    /**
     * Setup navigation
     */
    setupNavigation() {
        try {
            // Setup navigation event listeners
            document.addEventListener('click', (e) => {
                const navLink = e.target.closest('.sidebar-nav-link[data-page]');
                if (navLink) {
                    e.preventDefault();
                    const page = navLink.getAttribute('data-page');
                    this.navigateToPage(page);
                }
            });
            
            // Set initial page
            this.stateManager.setState({ currentPage: 'dashboard' });
            this.showPage('dashboard');
            
            console.log('✅ Navigation setup complete');
            
        } catch (error) {
            this.errorHandler.handle(error, 'Navigation Setup');
        }
    }

    /**
     * Populate initial data
     */
    populateInitialData() {
        try {
            const dashboardData = this.stateManager.getState('dashboardData');
            
            if (dashboardData) {
                this.populateMetrics(dashboardData.metrics);
                this.populateServerStats(dashboardData.serverStats);
                this.populateTrafficAnalytics(dashboardData.trafficAnalytics);
            }
            
            console.log('✅ Initial data populated');
            
        } catch (error) {
            this.errorHandler.handle(error, 'Populate Initial Data');
        }
    }

    /**
     * Handle page change
     * @param {string} newPage - New page name
     */
    handlePageChange(newPage) {
        this.showPage(newPage);
        this.refreshPageData(newPage);
    }

    /**
     * Handle dashboard data update
     * @param {Object} newData - New dashboard data
     */
    async handleDashboardDataUpdate(newData) {
        try {
            // Refresh charts with new data
            if (this.stateManager.getState('chartsInitialized')) {
                await this.chartManager.refreshAllCharts(newData);
            }
            
            // Update metrics display
            this.populateMetrics(newData.metrics);
            this.populateServerStats(newData.serverStats);
            this.populateTrafficAnalytics(newData.trafficAnalytics);
            
        } catch (error) {
            this.errorHandler.handle(error, 'Dashboard Data Update');
        }
    }

    /**
     * Navigate to page
     * @param {string} page - Page name
     */
    navigateToPage(page) {
        const currentPage = this.stateManager.getState('currentPage');
        
        if (currentPage === page) {
            return;
        }
        
        // Update navigation state
        this.updateNavigationState(page);
        
        // Update state
        this.stateManager.setState({ currentPage: page });
        
        console.log(`📄 Navigated to ${page} page`);
    }

    /**
     * Show page
     * @param {string} page - Page name
     */
    showPage(page) {
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(pageEl => {
            pageEl.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
    }

    /**
     * Update navigation state
     * @param {string} activePage - Active page
     */
    updateNavigationState(activePage) {
        document.querySelectorAll('.sidebar-nav-link[data-page]').forEach(link => {
            const page = link.getAttribute('data-page');
            if (page === activePage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * Refresh page data
     * @param {string} page - Page name
     */
    refreshPageData(page) {
        try {
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
        } catch (error) {
            this.errorHandler.handle(error, `Refresh ${page} Page`);
        }
    }

    /**
     * Refresh dashboard page
     */
    refreshDashboardPage() {
        const dashboardData = this.stateManager.getState('dashboardData');
        
        if (dashboardData) {
            this.populateMetrics(dashboardData.metrics);
            this.populateServerStats(dashboardData.serverStats);
            this.populateTrafficAnalytics(dashboardData.trafficAnalytics);
        }
        
        console.log('🔄 Dashboard page refreshed');
    }

    /**
     * Refresh app manager page
     */
    refreshAppManagerPage() {
        // Reset search and pagination
        this.stateManager.setState({
            searchTerm: '',
            currentPageNumber: 1
        });
        
        // Clear search input
        const searchInput = document.getElementById('app-search');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Refresh table
        this.applicationManager.populateApplicationsTable();
        
        console.log('🔄 App Manager page refreshed');
    }

    /**
     * Populate metrics data
     * @param {Object} metrics - Metrics data
     */
    populateMetrics(metrics) {
        try {
            if (!metrics) return;

            // Usage Statistics
            this.populateMetric('usage-stats-metric', 'usage-sub-metrics', metrics.usageStatistics);

            // Store Sales
            this.populateMetric('sales-metric', 'sales-sub-metrics', metrics.storeSales);

            // New Members
            this.populateMetric('members-metric', 'members-sub-metrics', metrics.newMembers);

            // Bandwidth
            this.populateMetric('bandwidth-metric', 'bandwidth-sub-metrics', metrics.bandwidth);

        } catch (error) {
            this.errorHandler.handle(error, 'Populate Metrics');
        }
    }

    /**
     * Populate single metric
     * @param {string} metricId - Metric element ID
     * @param {string} subMetricsId - Sub-metrics element ID
     * @param {Object} metricData - Metric data
     */
    populateMetric(metricId, subMetricsId, metricData) {
        if (!metricData) return;

        const metricEl = document.getElementById(metricId);
        const subMetricsEl = document.getElementById(subMetricsId);

        if (metricEl && metricData.value) {
            metricEl.textContent = metricData.value;
        }

        if (metricEl && metricData.totalHours) {
            metricEl.textContent = metricData.totalHours;
        }

        if (subMetricsEl && metricData.subMetrics) {
            subMetricsEl.innerHTML = metricData.subMetrics
                .map(metric => `<li><i class="${metric.icon} ${metric.class || ''}"></i>${metric.text}</li>`)
                .join('');
        }
    }

    /**
     * Populate server stats
     * @param {Object} serverStats - Server stats data
     */
    populateServerStats(serverStats) {
        try {
            if (!serverStats) return;

            // Disk Usage
            if (serverStats.diskUsage) {
                this.populateServerStat('disk', serverStats.diskUsage);
            }

            // Bandwidth Usage
            if (serverStats.bandwidth) {
                this.populateServerStat('bandwidth-usage', serverStats.bandwidth);
            }

        } catch (error) {
            this.errorHandler.handle(error, 'Populate Server Stats');
        }
    }

    /**
     * Populate single server stat
     * @param {string} statType - Stat type (disk, bandwidth-usage)
     * @param {Object} statData - Stat data
     */
    populateServerStat(statType, statData) {
        const elements = {
            percentage: document.getElementById(`${statType}-percentage`),
            metric: document.getElementById(`${statType}-metric`),
            updated: document.getElementById(`${statType}-updated`),
            details: document.getElementById(`${statType}-details`)
        };

        if (elements.percentage && statData.percentage) {
            elements.percentage.textContent = statData.percentage;
        }

        if (elements.metric && statData.metric) {
            elements.metric.textContent = statData.metric;
        }

        if (elements.updated && statData.updated) {
            elements.updated.textContent = statData.updated;
        }

        if (elements.details && statData.details) {
            elements.details.innerHTML = statData.details
                .map(detail => `<li><span class="label"><span class="dot"></span> ${detail.label}</span> <span class="value">${detail.value}</span></li>`)
                .join('');
        }
    }

    /**
     * Populate traffic analytics
     * @param {Object} trafficAnalytics - Traffic analytics data
     */
    populateTrafficAnalytics(trafficAnalytics) {
        try {
            if (!trafficAnalytics) return;

            // Traffic Table
            if (trafficAnalytics.countries) {
                this.populateTrafficTable(trafficAnalytics.countries);
            }

            // Traffic Sources
            if (trafficAnalytics.trafficSources) {
                this.populateTrafficSources(trafficAnalytics.trafficSources);
            }

        } catch (error) {
            this.errorHandler.handle(error, 'Populate Traffic Analytics');
        }
    }

    /**
     * Populate traffic table
     * @param {Array} countries - Countries data
     */
    populateTrafficTable(countries) {
        const trafficTable = document.getElementById('traffic-table');
        if (!trafficTable) return;

        const headerRow = trafficTable.querySelector('.header-row');
        const dataRows = countries
            .map(country => `
                <div class="row data-row ${country.active ? 'active' : ''} g-0">
                    <div class="col-5">${country.name}</div>
                    <div class="col-4 text-end">${country.visits}</div>
                    <div class="col-3 text-end">${country.percentage}</div>
                </div>
            `).join('');

        trafficTable.innerHTML = headerRow.outerHTML + dataRows;
    }

    /**
     * Populate traffic sources
     * @param {Array} trafficSources - Traffic sources data
     */
    populateTrafficSources(trafficSources) {
        const trafficSourcesEl = document.getElementById('traffic-sources');
        if (!trafficSourcesEl) return;

        trafficSourcesEl.innerHTML = trafficSources
            .map(source => `<li><span class="label"><span class="dot" style="background-color: ${source.color};"></span> ${source.label}</span> <span class="value">${source.percentage}</span></li>`)
            .join('');
    }

    /**
     * Show loading indicator
     */
    showLoadingIndicator() {
        const existingLoader = document.getElementById('dashboard-loader');
        if (existingLoader) return;

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
        document.body.appendChild(loader);
    }

    /**
     * Hide loading indicator
     */
    hideLoadingIndicator() {
        const loader = document.getElementById('dashboard-loader');
        if (loader) {
            loader.remove();
        }
    }

    /**
     * Update loading status
     * @param {string} message - Status message
     */
    updateLoadingStatus(message) {
        const statusEl = document.getElementById('loading-status');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.hideLoadingIndicator();
        this.errorHandler.showUserMessage(message, 'error');
    }

    /**
     * Show message to user
     * @param {string} message - Message text
     * @param {string} type - Message type
     */
    showMessage(message, type = 'success') {
        const messagesContainer = document.getElementById('form-messages');
        if (!messagesContainer) {
            // Fallback to error handler notification
            this.errorHandler.createNotification(message, type);
            return;
        }

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

    /**
     * Get service statistics
     * @returns {Object} Service statistics
     */
    getServiceStats() {
        return {
            state: this.stateManager.getStats(),
            charts: this.chartManager.getChartStats(),
            components: this.componentLoader.getCacheStats(),
            data: this.dataService.getCacheStats()
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        try {
            // Destroy charts
            this.chartManager.destroyAllCharts();

            // Clear caches
            this.dataService.clearCache();
            this.componentLoader.clearCache();

            // Clear state
            this.stateManager.resetState();

            console.log('🧹 Dashboard cleanup complete');

        } catch (error) {
            this.errorHandler.handle(error, 'Dashboard Cleanup');
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardManagerRefactored;
}
