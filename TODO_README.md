# TODO: Dynamic Data Integration via REST API

This document outlines the roadmap for converting the current static JSON-based dashboard to a fully dynamic system that receives all data from REST endpoints.

## 🎯 Current State vs Target State

### Current State
- Static data loaded from `data/dashboard-data.json`
- One-time data loading on page initialization
- No real-time updates
- Client-side data management

### Target State
- Dynamic data from REST API endpoints
- Real-time data updates
- Server-side data management
- Configurable refresh intervals
- Error handling for API failures

## 📋 Implementation Roadmap

### Phase 1: Backend API Development

#### 1.1 Core API Endpoints

Create the following REST endpoints:

```
GET /api/dashboard/metrics          # Main dashboard metrics
GET /api/dashboard/charts          # Chart data for all visualizations
GET /api/dashboard/server-stats    # Server statistics (CPU, Memory, Disk)
GET /api/dashboard/traffic         # Traffic analytics data
GET /api/dashboard/config          # Dashboard configuration (colors, settings)
```

#### 1.2 Detailed Endpoint Specifications

**GET /api/dashboard/metrics**
```json
{
  "siteVisitors": {
    "value": "4.2m",
    "subMetrics": [
      { "icon": "fas fa-arrow-up", "text": "33.3% more than last week", "class": "metric-increase" }
    ]
  },
  "storeSales": { /* ... */ },
  "newMembers": { /* ... */ },
  "bandwidth": { /* ... */ }
}
```

**GET /api/dashboard/charts**
```json
{
  "siteVisitors": [60, 75, 50, 65, 40, 55, 35, 70, 85, 95],
  "storeSales": [25, 20, 28, 22, 25, 18, 22, 20, 25, 15, 20],
  "serverMemory": [70, 78, 50, 42, 60, 65, 52, 70, 40, 55],
  "serverCPU": [60, 70, 55, 40, 82, 50, 78, 62, 65, 62],
  "diskUsage": [7.8, 92.2],
  "bandwidthUsage": [83.7, 16.3],
  "trafficSource": [25.7, 24.3, 23.05, 14.85, 7.35, 4.75]
}
```

**GET /api/dashboard/server-stats**
```json
{
  "diskUsage": {
    "percentage": "81",
    "metric": "20.04 / 256 GB",
    "updated": "2025-01-05T02:17:00Z",
    "details": [
      { "label": "DISK C", "value": "19.56GB" },
      { "label": "DISK D", "value": "0.50GB" }
    ]
  },
  "bandwidth": {
    "metric": "83.76GB / 10TB",
    "updated": "2025-01-05T02:17:00Z",
    "details": [
      { "label": "HTTP", "value": "35.47GB" },
      { "label": "FTP", "value": "1.25GB" }
    ]
  }
}
```

**GET /api/dashboard/traffic**
```json
{
  "countries": [
    { "name": "FRANCE", "visits": "13,849", "percentage": "40.79%", "active": false }
  ],
  "trafficSources": [
    { "label": "FEED", "percentage": "25.70%", "color": "#3ddc97" }
  ]
}
```

**GET /api/dashboard/config**
```json
{
  "chartColors": {
    "primary": "#64ffda",
    "secondary": "#3ddc97",
    "tertiary": "#4d8af0"
  },
  "refreshIntervals": {
    "metrics": 30000,
    "charts": 60000,
    "serverStats": 10000,
    "traffic": 120000
  }
}
```

#### 1.3 Backend Technology Recommendations

Choose one of the following backend technologies:

- **Node.js + Express**: Fast development, JavaScript ecosystem
- **Python + FastAPI**: Type safety, automatic documentation
- **Python + Flask**: Lightweight, flexible
- **Java + Spring Boot**: Enterprise-grade, robust
- **C# + ASP.NET Core**: Microsoft ecosystem integration

### Phase 2: Frontend API Integration

#### 2.1 Create API Service Layer

Create `js/api-service.js`:

```javascript
class ApiService {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
        this.cache = new Map();
        this.refreshIntervals = {};
    }

    async get(endpoint, useCache = false) {
        const url = `${this.baseUrl}${endpoint}`;
        
        if (useCache && this.cache.has(url)) {
            return this.cache.get(url);
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (useCache) {
                this.cache.set(url, data);
            }
            
            return data;
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            throw error;
        }
    }

    async getDashboardMetrics() {
        return this.get('/dashboard/metrics');
    }

    async getChartData() {
        return this.get('/dashboard/charts');
    }

    async getServerStats() {
        return this.get('/dashboard/server-stats');
    }

    async getTrafficData() {
        return this.get('/dashboard/traffic');
    }

    async getConfig() {
        return this.get('/dashboard/config', true); // Cache config
    }
}
```

#### 2.2 Modify DashboardManager Class

Update `js/dashboard-init.js`:

```javascript
class DashboardManager {
    constructor() {
        this.apiService = new ApiService();
        this.data = {};
        this.charts = {};
        this.refreshIntervals = {};
        this.loadingStatus = {
            config: false,
            components: false,
            data: false,
            charts: false
        };
        
        this.init();
    }

    async init() {
        try {
            this.showLoadingIndicator();
            
            // Load configuration first
            await this.loadConfig();
            
            // Load components
            await this.loadComponents();
            
            // Load initial data
            await this.loadAllData();
            
            // Initialize charts
            await this.initializeCharts();
            
            // Start real-time updates
            this.startRealTimeUpdates();
            
            this.hideLoadingIndicator();
            
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.showError('Failed to initialize dashboard. Please refresh the page.');
        }
    }

    async loadConfig() {
        try {
            this.config = await this.apiService.getConfig();
            this.loadingStatus.config = true;
        } catch (error) {
            // Use default config if API fails
            this.config = this.getDefaultConfig();
            console.warn('Using default configuration due to API error:', error);
        }
    }

    async loadAllData() {
        try {
            const [metrics, chartData, serverStats, trafficData] = await Promise.all([
                this.apiService.getDashboardMetrics(),
                this.apiService.getChartData(),
                this.apiService.getServerStats(),
                this.apiService.getTrafficData()
            ]);

            this.data = {
                metrics,
                chartData,
                serverStats,
                trafficAnalytics: trafficData,
                chartColors: this.config.chartColors
            };

            this.loadingStatus.data = true;
            this.populateData();
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            throw error;
        }
    }

    startRealTimeUpdates() {
        const intervals = this.config.refreshIntervals;

        // Update metrics
        this.refreshIntervals.metrics = setInterval(async () => {
            try {
                const metrics = await this.apiService.getDashboardMetrics();
                this.data.metrics = metrics;
                this.populateMetrics();
            } catch (error) {
                console.error('Failed to update metrics:', error);
            }
        }, intervals.metrics);

        // Update charts
        this.refreshIntervals.charts = setInterval(async () => {
            try {
                const chartData = await this.apiService.getChartData();
                this.data.chartData = chartData;
                this.updateCharts();
            } catch (error) {
                console.error('Failed to update charts:', error);
            }
        }, intervals.charts);

        // Update server stats
        this.refreshIntervals.serverStats = setInterval(async () => {
            try {
                const serverStats = await this.apiService.getServerStats();
                this.data.serverStats = serverStats;
                this.populateServerStats();
            } catch (error) {
                console.error('Failed to update server stats:', error);
            }
        }, intervals.serverStats);

        // Update traffic data
        this.refreshIntervals.traffic = setInterval(async () => {
            try {
                const trafficData = await this.apiService.getTrafficData();
                this.data.trafficAnalytics = trafficData;
                this.populateTrafficAnalytics();
            } catch (error) {
                console.error('Failed to update traffic data:', error);
            }
        }, intervals.traffic);
    }

    updateCharts() {
        // Update existing charts with new data
        Object.keys(this.charts).forEach(chartKey => {
            const chart = this.charts[chartKey];
            if (chart && this.data.chartData[chartKey]) {
                chart.data.datasets[0].data = this.data.chartData[chartKey];
                chart.update('none'); // No animation for real-time updates
            }
        });
    }

    getDefaultConfig() {
        return {
            chartColors: {
                primary: "#64ffda",
                secondary: "#3ddc97",
                tertiary: "#4d8af0",
                warning: "#ffc107",
                danger: "#e83e8c",
                purple: "#6f42c1",
                gray: "#5a7d9a",
                dark: "#34495e",
                serverMemory: "#5a7d9a",
                serverCPU: "#3ddc97",
                diskBackground: "#415a77"
            },
            refreshIntervals: {
                metrics: 30000,    // 30 seconds
                charts: 60000,     // 1 minute
                serverStats: 10000, // 10 seconds
                traffic: 120000    // 2 minutes
            }
        };
    }

    destroy() {
        // Clean up intervals when dashboard is destroyed
        Object.values(this.refreshIntervals).forEach(interval => {
            clearInterval(interval);
        });
    }
}
```

#### 2.3 Add Error Handling and Retry Logic

```javascript
class ApiService {
    async get(endpoint, options = {}) {
        const { 
            useCache = false, 
            retries = 3, 
            retryDelay = 1000,
            timeout = 10000 
        } = options;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(`${this.baseUrl}${endpoint}`, {
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                return data;

            } catch (error) {
                console.warn(`API attempt ${attempt}/${retries} failed for ${endpoint}:`, error.message);
                
                if (attempt === retries) {
                    throw error;
                }

                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            }
        }
    }
}
```

### Phase 3: Real-Time Features

#### 3.1 WebSocket Integration (Optional)

For real-time updates, consider WebSocket integration:

```javascript
class WebSocketService {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }

    connect() {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    handleMessage(data) {
        // Handle real-time updates
        switch (data.type) {
            case 'metrics_update':
                window.dashboardManager.updateMetrics(data.payload);
                break;
            case 'server_stats_update':
                window.dashboardManager.updateServerStats(data.payload);
                break;
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
        }
    }
}
```

#### 3.2 Add Connection Status Indicator

```javascript
class ConnectionStatusIndicator {
    constructor() {
        this.createIndicator();
    }

    createIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'connection-status';
        indicator.innerHTML = `
            <div class="status-dot"></div>
            <span class="status-text">Connected</span>
        `;
        document.body.appendChild(indicator);
    }

    setStatus(status) {
        const indicator = document.getElementById('connection-status');
        const dot = indicator.querySelector('.status-dot');
        const text = indicator.querySelector('.status-text');

        switch (status) {
            case 'connected':
                dot.className = 'status-dot connected';
                text.textContent = 'Connected';
                break;
            case 'disconnected':
                dot.className = 'status-dot disconnected';
                text.textContent = 'Disconnected';
                break;
            case 'reconnecting':
                dot.className = 'status-dot reconnecting';
                text.textContent = 'Reconnecting...';
                break;
        }
    }
}
```

### Phase 4: Performance Optimization

#### 4.1 Data Caching Strategy

```javascript
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = new Map();
    }

    set(key, data, ttl = 60000) { // Default 1 minute TTL
        this.cache.set(key, data);
        this.cacheExpiry.set(key, Date.now() + ttl);
    }

    get(key) {
        if (this.isExpired(key)) {
            this.delete(key);
            return null;
        }
        return this.cache.get(key);
    }

    isExpired(key) {
        const expiry = this.cacheExpiry.get(key);
        return expiry && Date.now() > expiry;
    }

    delete(key) {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
    }

    clear() {
        this.cache.clear();
        this.cacheExpiry.clear();
    }
}
```

#### 4.2 Lazy Loading for Charts

```javascript
class LazyChartLoader {
    constructor() {
        this.observer = new IntersectionObserver(this.handleIntersection.bind(this));
        this.pendingCharts = new Set();
    }

    observe(element, chartInitializer) {
        element.dataset.chartInitializer = chartInitializer.name;
        this.pendingCharts.add({ element, chartInitializer });
        this.observer.observe(element);
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const chartData = Array.from(this.pendingCharts)
                    .find(item => item.element === entry.target);
                
                if (chartData) {
                    chartData.chartInitializer();
                    this.observer.unobserve(entry.target);
                    this.pendingCharts.delete(chartData);
                }
            }
        });
    }
}
```

### Phase 5: Testing Strategy

#### 5.1 API Testing

Create test files for API endpoints:

```javascript
// tests/api.test.js
describe('Dashboard API', () => {
    test('GET /api/dashboard/metrics returns valid data', async () => {
        const response = await fetch('/api/dashboard/metrics');
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data).toHaveProperty('siteVisitors');
        expect(data.siteVisitors).toHaveProperty('value');
    });

    test('API handles errors gracefully', async () => {
        // Test error scenarios
    });
});
```

#### 5.2 Frontend Testing

```javascript
// tests/dashboard.test.js
describe('DashboardManager', () => {
    test('initializes correctly with API data', async () => {
        const dashboard = new DashboardManager();
        await dashboard.init();
        
        expect(dashboard.data).toBeDefined();
        expect(dashboard.charts).toBeDefined();
    });

    test('handles API failures gracefully', async () => {
        // Mock API failure
        const dashboard = new DashboardManager();
        jest.spyOn(dashboard.apiService, 'getDashboardMetrics')
            .mockRejectedValue(new Error('API Error'));
        
        await expect(dashboard.loadAllData()).rejects.toThrow('API Error');
    });
});
```

### Phase 6: Deployment Considerations

#### 6.1 Environment Configuration

Create environment-specific configuration:

```javascript
// js/config.js
const CONFIG = {
    development: {
        apiBaseUrl: 'http://localhost:3000/api',
        wsUrl: 'ws://localhost:3000/ws',
        refreshIntervals: {
            metrics: 5000,    // 5 seconds for development
            charts: 10000,    // 10 seconds
            serverStats: 2000, // 2 seconds
            traffic: 30000    // 30 seconds
        }
    },
    production: {
        apiBaseUrl: '/api',
        wsUrl: `wss://${window.location.host}/ws`,
        refreshIntervals: {
            metrics: 30000,    // 30 seconds
            charts: 60000,     // 1 minute
            serverStats: 10000, // 10 seconds
            traffic: 120000    // 2 minutes
        }
    }
};

const getConfig = () => {
    const env = process.env.NODE_ENV || 'development';
    return CONFIG[env] || CONFIG.development;
};
```

#### 6.2 Build Process

Update build process to handle API integration:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run api:dev\" \"npm run frontend:dev\"",
    "build": "npm run frontend:build && npm run api:build",
    "test": "npm run test:api && npm run test:frontend",
    "api:dev": "nodemon server/index.js",
    "frontend:dev": "live-server --port=8080",
    "test:api": "jest tests/api/",
    "test:frontend": "jest tests/frontend/"
  }
}
```

### Phase 7: Monitoring and Analytics

#### 7.1 API Performance Monitoring

```javascript
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            apiCalls: 0,
            failedCalls: 0,
            averageResponseTime: 0,
            slowQueries: []
        };
    }

    recordApiCall(endpoint, responseTime, success = true) {
        this.metrics.apiCalls++;
        
        if (!success) {
            this.metrics.failedCalls++;
        }

        // Update average response time
        this.metrics.averageResponseTime = 
            (this.metrics.averageResponseTime + responseTime) / 2;

        // Track slow queries (>2 seconds)
        if (responseTime > 2000) {
            this.metrics.slowQueries.push({
                endpoint,
                responseTime,
                timestamp: new Date().toISOString()
            });
        }
    }

    getMetrics() {
        return {
            ...this.metrics,
            errorRate: (this.metrics.failedCalls / this.metrics.apiCalls) * 100
        };
    }
}
```

#### 7.2 User Analytics

```javascript
class UserAnalytics {
    constructor() {
        this.events = [];
        this.sessionStart = Date.now();
    }

    trackEvent(eventName, properties = {}) {
        this.events.push({
            event: eventName,
            properties,
            timestamp: Date.now(),
            sessionDuration: Date.now() - this.sessionStart
        });
    }

    trackPanelView(panelName) {
        this.trackEvent('panel_viewed', { panelName });
    }

    trackChartInteraction(chartType, action) {
        this.trackEvent('chart_interaction', { chartType, action });
    }

    getAnalytics() {
        return {
            events: this.events,
            sessionDuration: Date.now() - this.sessionStart,
            totalEvents: this.events.length
        };
    }
}
```

## 🚀 Implementation Timeline

### Week 1-2: Backend Development
- [ ] Set up backend framework
- [ ] Implement core API endpoints
- [ ] Add authentication/authorization
- [ ] Write API tests
- [ ] Deploy to staging environment

### Week 3: Frontend Integration
- [ ] Create ApiService class
- [ ] Modify DashboardManager for API integration
- [ ] Implement error handling and retry logic
- [ ] Add loading states and user feedback

### Week 4: Real-time Features
- [ ] Implement WebSocket connection (optional)
- [ ] Add connection status indicator
- [ ] Implement real-time data updates
- [ ] Test real-time functionality

### Week 5: Performance & Testing
- [ ] Implement caching strategy
- [ ] Add lazy loading for charts
- [ ] Write comprehensive tests
- [ ] Performance optimization

### Week 6: Deployment & Monitoring
- [ ] Set up production environment
- [ ] Implement monitoring and analytics
- [ ] Deploy to production
- [ ] Monitor and fix issues

## 📝 Migration Checklist

### Pre-Migration
- [ ] Backup current static data files
- [ ] Document current functionality
- [ ] Set up development environment
- [ ] Create API specification document

### During Migration
- [ ] Implement backend APIs
- [ ] Update frontend code
- [ ] Test API integration
- [ ] Implement error handling
- [ ] Add real-time updates

### Post-Migration
- [ ] Monitor API performance
- [ ] Collect user feedback
- [ ] Optimize based on usage patterns
- [ ] Plan future enhancements

## 🔧 Troubleshooting Guide

### Common Issues

**API Connection Failures**
- Check network connectivity
- Verify API endpoint URLs
- Check CORS configuration
- Validate authentication tokens

**Chart Update Issues**
- Ensure chart data format matches expected structure
- Check for canvas element availability
- Verify Chart.js version compatibility
- Monitor console for JavaScript errors

**Performance Problems**
- Implement data caching
- Reduce API call frequency
- Use lazy loading for heavy components
- Monitor memory usage

**Real-time Update Delays**
- Check WebSocket connection status
- Verify server-side event emission
- Monitor network latency
- Implement connection retry logic

## 📚 Additional Resources

- [Fetch API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [WebSocket API Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [REST API Best Practices](https://restfulapi.net/)
- [Performance Monitoring Guide](https://web.dev/performance/)

---

**Note**: This TODO document serves as a comprehensive guide for converting the static dashboard to a dynamic, API-driven system. Each phase should be completed and tested before moving to the next phase to ensure stability and reliability.
