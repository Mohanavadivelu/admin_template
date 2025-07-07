/**
 * ChartManager - Handles chart initialization and management
 * 
 * Responsibilities:
 * - Initialize and manage Chart.js instances
 * - Handle chart data updates
 * - Manage chart lifecycle (create, update, destroy)
 * - Provide chart configuration and theming
 * 
 * @author Dashboard Team
 * @version 1.0.0
 */

class ChartManager {
    constructor(stateManager, errorHandler) {
        this.stateManager = stateManager;
        this.errorHandler = errorHandler;
        this.charts = new Map();
        this.chartConfigs = new Map();
        this.defaultColors = {};
        
        this.initializeChartConfigs();
        this.setupGlobalChartDefaults();
        
        console.log('📈 ChartManager initialized');
    }

    /**
     * Initialize chart configurations
     */
    initializeChartConfigs() {
        // Usage Statistics Chart
        this.chartConfigs.set('usageStats', {
            canvasId: 'usageStatsChart',
            type: 'bar',
            dataKey: 'usageStats',
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: this.getTooltipConfig('usage')
                },
                scales: {
                    x: { 
                        display: true,
                        grid: { display: false },
                        ticks: { color: '#a8b2d1', font: { size: 11 } }
                    },
                    y: { display: false, grid: { display: false } }
                },
                elements: { bar: { borderRadius: 4 } }
            }
        });

        // Store Sales Chart
        this.chartConfigs.set('storeSales', {
            canvasId: 'storeSalesChart',
            type: 'line',
            dataKey: 'storeSales',
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

        // New Members Chart
        this.chartConfigs.set('newMembers', {
            canvasId: 'newMembersChart',
            type: 'pie',
            dataKey: 'newMembers',
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });

        // Bandwidth Chart
        this.chartConfigs.set('bandwidth', {
            canvasId: 'bandwidthChart',
            type: 'doughnut',
            dataKey: 'bandwidth',
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                cutout: '70%'
            }
        });

        // Server Stats Chart
        this.chartConfigs.set('serverStats', {
            canvasId: 'serverStatsChart',
            type: 'bar',
            dataKey: ['serverMemory', 'serverCPU'],
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

        // Disk Usage Chart
        this.chartConfigs.set('diskUsage', {
            canvasId: 'diskUsageChart',
            type: 'doughnut',
            dataKey: 'diskUsage',
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                cutout: '70%'
            }
        });

        // Bandwidth Usage Chart
        this.chartConfigs.set('bandwidthUsage', {
            canvasId: 'bandwidthUsageChart',
            type: 'doughnut',
            dataKey: 'bandwidthUsage',
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                cutout: '70%'
            }
        });

        // Traffic Source Chart
        this.chartConfigs.set('trafficSource', {
            canvasId: 'trafficSourceChart',
            type: 'doughnut',
            dataKey: 'trafficSource',
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                cutout: '60%'
            }
        });
    }

    /**
     * Setup global Chart.js defaults
     */
    setupGlobalChartDefaults() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }

        Chart.defaults.color = '#a8b2d1';
        Chart.defaults.borderColor = 'rgba(100, 255, 218, 0.15)';
        Chart.defaults.backgroundColor = 'rgba(100, 255, 218, 0.1)';
        
        console.log('📈 Chart.js global defaults configured');
    }

    /**
     * Initialize all charts
     * @param {Object} dashboardData - Dashboard data containing chart data
     * @returns {Promise<Object>} Initialization results
     */
    async initializeAllCharts(dashboardData) {
        if (!dashboardData || !dashboardData.chartData) {
            throw new Error('Dashboard data or chart data not available');
        }

        this.defaultColors = dashboardData.chartColors || {};
        const results = {
            initialized: [],
            failed: []
        };

        console.log('📈 Initializing all charts...');

        for (const [chartId, config] of this.chartConfigs) {
            try {
                await this.initializeChart(chartId, dashboardData);
                results.initialized.push(chartId);
                console.log(`✅ Initialized chart: ${chartId}`);
            } catch (error) {
                console.error(`❌ Failed to initialize chart ${chartId}:`, error);
                results.failed.push({ chartId, error: error.message });
            }
        }

        // Update state
        this.stateManager.setState({
            charts: Object.fromEntries(this.charts),
            chartsInitialized: true
        });

        console.log(`📈 Chart initialization complete: ${results.initialized.length}/${this.chartConfigs.size} successful`);
        return results;
    }

    /**
     * Initialize single chart
     * @param {string} chartId - Chart identifier
     * @param {Object} dashboardData - Dashboard data
     * @returns {Promise<Chart>} Chart instance
     */
    async initializeChart(chartId, dashboardData) {
        const config = this.chartConfigs.get(chartId);
        if (!config) {
            throw new Error(`Chart configuration not found: ${chartId}`);
        }

        const canvas = document.getElementById(config.canvasId);
        if (!canvas) {
            throw new Error(`Canvas element not found: ${config.canvasId}`);
        }

        // Destroy existing chart if it exists
        if (this.charts.has(chartId)) {
            this.destroyChart(chartId);
        }

        try {
            const chartData = this.prepareChartData(config, dashboardData);
            const chartOptions = this.prepareChartOptions(config);

            const chart = new Chart(canvas.getContext('2d'), {
                type: config.type,
                data: chartData,
                options: chartOptions
            });

            this.charts.set(chartId, chart);
            return chart;

        } catch (error) {
            throw new Error(`Failed to create chart ${chartId}: ${error.message}`);
        }
    }

    /**
     * Prepare chart data based on configuration
     * @param {Object} config - Chart configuration
     * @param {Object} dashboardData - Dashboard data
     * @returns {Object} Chart data object
     */
    prepareChartData(config, dashboardData) {
        const { chartData, chartColors } = dashboardData;
        const dataKey = config.dataKey;

        switch (config.type) {
            case 'bar':
                return this.prepareBarChartData(dataKey, chartData, chartColors);
            case 'line':
                return this.prepareLineChartData(dataKey, chartData, chartColors);
            case 'pie':
                return this.preparePieChartData(dataKey, chartData, chartColors);
            case 'doughnut':
                return this.prepareDoughnutChartData(dataKey, chartData, chartColors);
            default:
                throw new Error(`Unsupported chart type: ${config.type}`);
        }
    }

    /**
     * Prepare bar chart data
     * @param {string|Array} dataKey - Data key(s)
     * @param {Object} chartData - Chart data
     * @param {Object} chartColors - Chart colors
     * @returns {Object} Bar chart data
     */
    prepareBarChartData(dataKey, chartData, chartColors) {
        if (Array.isArray(dataKey)) {
            // Multiple datasets (e.g., server stats)
            return {
                labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
                datasets: dataKey.map((key, index) => ({
                    label: key,
                    data: chartData[key],
                    backgroundColor: chartColors[key] || chartColors.primary,
                    borderColor: chartColors[key] || chartColors.primary,
                    borderWidth: 0,
                    borderRadius: 2,
                    maxBarThickness: 8
                }))
            };
        } else {
            // Single dataset
            return {
                labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
                datasets: [{
                    data: chartData[dataKey],
                    backgroundColor: chartColors.primary,
                    borderColor: chartColors.primary,
                    borderWidth: 0,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            };
        }
    }

    /**
     * Prepare line chart data
     * @param {string} dataKey - Data key
     * @param {Object} chartData - Chart data
     * @param {Object} chartColors - Chart colors
     * @returns {Object} Line chart data
     */
    prepareLineChartData(dataKey, chartData, chartColors) {
        return {
            labels: new Array(chartData[dataKey].length).fill(''),
            datasets: [{
                data: chartData[dataKey],
                borderColor: chartColors.primary,
                backgroundColor: 'transparent',
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 0
            }]
        };
    }

    /**
     * Prepare pie chart data
     * @param {string} dataKey - Data key
     * @param {Object} chartData - Chart data
     * @param {Object} chartColors - Chart colors
     * @returns {Object} Pie chart data
     */
    preparePieChartData(dataKey, chartData, chartColors) {
        return {
            datasets: [{
                data: chartData[dataKey],
                backgroundColor: [
                    chartColors.secondary,
                    chartColors.tertiary,
                    chartColors.dark
                ],
                borderWidth: 0
            }]
        };
    }

    /**
     * Prepare doughnut chart data
     * @param {string} dataKey - Data key
     * @param {Object} chartData - Chart data
     * @param {Object} chartColors - Chart colors
     * @returns {Object} Doughnut chart data
     */
    prepareDoughnutChartData(dataKey, chartData, chartColors) {
        const data = chartData[dataKey];
        
        if (dataKey === 'trafficSource') {
            return {
                datasets: [{
                    data: data,
                    backgroundColor: [
                        chartColors.secondary,
                        chartColors.tertiary,
                        chartColors.warning,
                        chartColors.danger,
                        chartColors.purple,
                        chartColors.gray
                    ],
                    borderWidth: 0
                }]
            };
        } else {
            return {
                datasets: [{
                    data: data,
                    backgroundColor: [
                        chartColors.primary,
                        chartColors.diskBackground || 'transparent'
                    ],
                    borderWidth: 0
                }]
            };
        }
    }

    /**
     * Prepare chart options
     * @param {Object} config - Chart configuration
     * @returns {Object} Chart options
     */
    prepareChartOptions(config) {
        return {
            ...config.options,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        };
    }

    /**
     * Get tooltip configuration
     * @param {string} type - Tooltip type
     * @returns {Object} Tooltip configuration
     */
    getTooltipConfig(type) {
        const baseConfig = {
            enabled: true,
            backgroundColor: 'rgba(29, 45, 68, 0.9)',
            titleColor: '#64ffda',
            bodyColor: '#e0e0e0',
            borderColor: '#64ffda',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false
        };

        switch (type) {
            case 'usage':
                return {
                    ...baseConfig,
                    callbacks: {
                        title: function(context) {
                            return context[0].label + ' 2024';
                        },
                        label: function(context) {
                            return 'New Users: ' + context.parsed.y;
                        }
                    }
                };
            default:
                return baseConfig;
        }
    }

    /**
     * Update chart data
     * @param {string} chartId - Chart identifier
     * @param {Object} newData - New chart data
     */
    updateChart(chartId, newData) {
        const chart = this.charts.get(chartId);
        if (!chart) {
            console.warn(`Chart not found for update: ${chartId}`);
            return;
        }

        try {
            chart.data = newData;
            chart.update('active');
            console.log(`📈 Updated chart: ${chartId}`);
        } catch (error) {
            this.errorHandler.handle(error, `Update Chart ${chartId}`);
        }
    }

    /**
     * Destroy single chart
     * @param {string} chartId - Chart identifier
     */
    destroyChart(chartId) {
        const chart = this.charts.get(chartId);
        if (chart) {
            chart.destroy();
            this.charts.delete(chartId);
            console.log(`🗑️ Destroyed chart: ${chartId}`);
        }
    }

    /**
     * Destroy all charts
     */
    destroyAllCharts() {
        for (const [chartId, chart] of this.charts) {
            chart.destroy();
        }
        this.charts.clear();
        
        // Update state
        this.stateManager.setState({
            charts: {},
            chartsInitialized: false
        });
        
        console.log('🗑️ Destroyed all charts');
    }

    /**
     * Refresh all charts with new data
     * @param {Object} dashboardData - New dashboard data
     */
    async refreshAllCharts(dashboardData) {
        console.log('🔄 Refreshing all charts...');
        
        try {
            // Destroy existing charts
            this.destroyAllCharts();
            
            // Re-initialize with new data
            await this.initializeAllCharts(dashboardData);
            
            console.log('✅ All charts refreshed successfully');
        } catch (error) {
            this.errorHandler.handle(error, 'Refresh All Charts');
            throw error;
        }
    }

    /**
     * Get chart statistics
     * @returns {Object} Chart statistics
     */
    getChartStats() {
        return {
            totalCharts: this.chartConfigs.size,
            initializedCharts: this.charts.size,
            chartTypes: Array.from(this.chartConfigs.values()).map(config => config.type),
            isInitialized: this.stateManager.getState('chartsInitialized')
        };
    }

    /**
     * Check if Chart.js is available
     * @returns {boolean} Is Chart.js available
     */
    isChartJsAvailable() {
        return typeof Chart !== 'undefined';
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartManager;
}
