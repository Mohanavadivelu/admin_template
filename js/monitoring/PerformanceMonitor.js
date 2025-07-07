/**
 * PerformanceMonitor - Real-time performance monitoring and analytics
 * 
 * Monitors application performance, user interactions, and system health
 * Provides insights for optimization and debugging
 * 
 * @author Dashboard Team
 * @version 1.0.0
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoad: {},
            userInteractions: [],
            errors: [],
            memory: [],
            network: [],
            customMetrics: new Map()
        };
        
        this.observers = [];
        this.isMonitoring = false;
        this.reportingInterval = 30000; // 30 seconds
        
        this.init();
    }

    /**
     * Initialize performance monitoring
     */
    init() {
        this.setupPerformanceObservers();
        this.setupUserInteractionTracking();
        this.setupMemoryMonitoring();
        this.setupNetworkMonitoring();
        this.startReporting();
        
        console.log('📊 PerformanceMonitor initialized');
    }

    /**
     * Setup performance observers
     */
    setupPerformanceObservers() {
        if ('PerformanceObserver' in window) {
            // Navigation timing
            const navObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.entryType === 'navigation') {
                        this.recordNavigationTiming(entry);
                    }
                });
            });
            
            try {
                navObserver.observe({ entryTypes: ['navigation'] });
                this.observers.push(navObserver);
            } catch (e) {
                console.warn('Navigation timing not supported');
            }

            // Resource timing
            const resourceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.entryType === 'resource') {
                        this.recordResourceTiming(entry);
                    }
                });
            });
            
            try {
                resourceObserver.observe({ entryTypes: ['resource'] });
                this.observers.push(resourceObserver);
            } catch (e) {
                console.warn('Resource timing not supported');
            }

            // Measure timing
            const measureObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.entryType === 'measure') {
                        this.recordCustomMeasure(entry);
                    }
                });
            });
            
            try {
                measureObserver.observe({ entryTypes: ['measure'] });
                this.observers.push(measureObserver);
            } catch (e) {
                console.warn('Measure timing not supported');
            }
        }
    }

    /**
     * Setup user interaction tracking
     */
    setupUserInteractionTracking() {
        const interactionEvents = ['click', 'keydown', 'scroll', 'resize'];
        
        interactionEvents.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                this.recordUserInteraction(eventType, event);
            }, { passive: true });
        });
    }

    /**
     * Setup memory monitoring
     */
    setupMemoryMonitoring() {
        if ('memory' in performance) {
            setInterval(() => {
                this.recordMemoryUsage();
            }, 5000); // Every 5 seconds
        }
    }

    /**
     * Setup network monitoring
     */
    setupNetworkMonitoring() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            this.recordNetworkInfo(connection);
            
            connection.addEventListener('change', () => {
                this.recordNetworkInfo(connection);
            });
        }
    }

    /**
     * Record navigation timing
     */
    recordNavigationTiming(entry) {
        this.metrics.pageLoad = {
            timestamp: Date.now(),
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            domInteractive: entry.domInteractive - entry.navigationStart,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint(),
            largestContentfulPaint: this.getLargestContentfulPaint(),
            cumulativeLayoutShift: this.getCumulativeLayoutShift(),
            firstInputDelay: this.getFirstInputDelay()
        };
        
        console.log('📊 Navigation timing recorded:', this.metrics.pageLoad);
    }

    /**
     * Record resource timing
     */
    recordResourceTiming(entry) {
        const resource = {
            name: entry.name,
            type: this.getResourceType(entry.name),
            duration: entry.duration,
            size: entry.transferSize || 0,
            timestamp: Date.now()
        };
        
        this.metrics.network.push(resource);
        
        // Keep only last 100 entries
        if (this.metrics.network.length > 100) {
            this.metrics.network.shift();
        }
    }

    /**
     * Record custom measure
     */
    recordCustomMeasure(entry) {
        const measure = {
            name: entry.name,
            duration: entry.duration,
            timestamp: Date.now()
        };
        
        if (!this.metrics.customMetrics.has(entry.name)) {
            this.metrics.customMetrics.set(entry.name, []);
        }
        
        this.metrics.customMetrics.get(entry.name).push(measure);
    }

    /**
     * Record user interaction
     */
    recordUserInteraction(type, event) {
        const interaction = {
            type,
            timestamp: Date.now(),
            target: event.target.tagName,
            targetId: event.target.id,
            targetClass: event.target.className
        };
        
        this.metrics.userInteractions.push(interaction);
        
        // Keep only last 50 interactions
        if (this.metrics.userInteractions.length > 50) {
            this.metrics.userInteractions.shift();
        }
    }

    /**
     * Record memory usage
     */
    recordMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            const usage = {
                timestamp: Date.now(),
                usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // MB
                totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // MB
                jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
                usagePercentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
            };
            
            this.metrics.memory.push(usage);
            
            // Keep only last 20 entries (100 seconds of data)
            if (this.metrics.memory.length > 20) {
                this.metrics.memory.shift();
            }
        }
    }

    /**
     * Record network information
     */
    recordNetworkInfo(connection) {
        const networkInfo = {
            timestamp: Date.now(),
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData
        };
        
        this.metrics.network.push(networkInfo);
    }

    /**
     * Get First Paint timing
     */
    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : null;
    }

    /**
     * Get First Contentful Paint timing
     */
    getFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? fcp.startTime : null;
    }

    /**
     * Get Largest Contentful Paint timing
     */
    getLargestContentfulPaint() {
        return new Promise((resolve) => {
            if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    resolve(lastEntry ? lastEntry.startTime : null);
                });
                
                try {
                    observer.observe({ entryTypes: ['largest-contentful-paint'] });
                } catch (e) {
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        });
    }

    /**
     * Get Cumulative Layout Shift
     */
    getCumulativeLayoutShift() {
        return new Promise((resolve) => {
            if ('PerformanceObserver' in window) {
                let clsValue = 0;
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                    resolve(clsValue);
                });
                
                try {
                    observer.observe({ entryTypes: ['layout-shift'] });
                } catch (e) {
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        });
    }

    /**
     * Get First Input Delay
     */
    getFirstInputDelay() {
        return new Promise((resolve) => {
            if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                    const firstEntry = list.getEntries()[0];
                    resolve(firstEntry ? firstEntry.processingStart - firstEntry.startTime : null);
                });
                
                try {
                    observer.observe({ entryTypes: ['first-input'] });
                } catch (e) {
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        });
    }

    /**
     * Get resource type from URL
     */
    getResourceType(url) {
        if (url.includes('.js')) return 'script';
        if (url.includes('.css')) return 'stylesheet';
        if (url.includes('.png') || url.includes('.jpg') || url.includes('.gif')) return 'image';
        if (url.includes('.json')) return 'data';
        return 'other';
    }

    /**
     * Start performance reporting
     */
    startReporting() {
        this.isMonitoring = true;
        
        setInterval(() => {
            this.generateReport();
        }, this.reportingInterval);
    }

    /**
     * Generate performance report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            pageLoad: this.metrics.pageLoad,
            memoryTrend: this.getMemoryTrend(),
            interactionCount: this.metrics.userInteractions.length,
            errorCount: this.metrics.errors.length,
            networkResources: this.getNetworkSummary(),
            customMetrics: this.getCustomMetricsSummary()
        };
        
        console.log('📊 Performance Report:', report);
        
        // Send to analytics service (if configured)
        this.sendToAnalytics(report);
        
        return report;
    }

    /**
     * Get memory usage trend
     */
    getMemoryTrend() {
        if (this.metrics.memory.length < 2) return null;
        
        const recent = this.metrics.memory.slice(-5);
        const average = recent.reduce((sum, entry) => sum + entry.usagePercentage, 0) / recent.length;
        
        return {
            current: recent[recent.length - 1].usagePercentage,
            average: Math.round(average),
            trend: recent[recent.length - 1].usagePercentage > recent[0].usagePercentage ? 'increasing' : 'decreasing'
        };
    }

    /**
     * Get network summary
     */
    getNetworkSummary() {
        const resources = this.metrics.network.filter(item => item.type);
        const totalSize = resources.reduce((sum, resource) => sum + resource.size, 0);
        const avgDuration = resources.reduce((sum, resource) => sum + resource.duration, 0) / resources.length;
        
        return {
            totalResources: resources.length,
            totalSize: Math.round(totalSize / 1024), // KB
            averageDuration: Math.round(avgDuration)
        };
    }

    /**
     * Get custom metrics summary
     */
    getCustomMetricsSummary() {
        const summary = {};
        
        for (const [name, measures] of this.metrics.customMetrics) {
            const durations = measures.map(m => m.duration);
            summary[name] = {
                count: measures.length,
                average: durations.reduce((sum, d) => sum + d, 0) / durations.length,
                min: Math.min(...durations),
                max: Math.max(...durations)
            };
        }
        
        return summary;
    }

    /**
     * Send report to analytics service
     */
    sendToAnalytics(report) {
        // Implement analytics service integration here
        // Example: Google Analytics, custom endpoint, etc.
        
        // For now, just store in localStorage for debugging
        try {
            const reports = JSON.parse(localStorage.getItem('performanceReports') || '[]');
            reports.push(report);
            
            // Keep only last 10 reports
            if (reports.length > 10) {
                reports.shift();
            }
            
            localStorage.setItem('performanceReports', JSON.stringify(reports));
        } catch (error) {
            console.warn('Failed to store performance report:', error);
        }
    }

    /**
     * Mark custom performance measure
     */
    mark(name) {
        if ('performance' in window && 'mark' in performance) {
            performance.mark(name);
        }
    }

    /**
     * Measure custom performance metric
     */
    measure(name, startMark, endMark) {
        if ('performance' in window && 'measure' in performance) {
            try {
                performance.measure(name, startMark, endMark);
            } catch (error) {
                console.warn(`Failed to measure ${name}:`, error);
            }
        }
    }

    /**
     * Get current performance snapshot
     */
    getSnapshot() {
        return {
            timestamp: Date.now(),
            metrics: { ...this.metrics },
            memory: this.getMemoryTrend(),
            network: this.getNetworkSummary()
        };
    }

    /**
     * Stop monitoring
     */
    stop() {
        this.isMonitoring = false;
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        
        console.log('📊 PerformanceMonitor stopped');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}
