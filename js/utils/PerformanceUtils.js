/**
 * PerformanceUtils - Performance optimization utilities
 * 
 * Provides utility functions for performance optimization including:
 * - Debouncing and throttling
 * - Lazy loading
 * - Memory management
 * - Performance monitoring
 * 
 * @author Dashboard Team
 * @version 1.0.0
 */

class PerformanceUtils {
    /**
     * Debounce function - delays execution until after wait time has elapsed
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @param {boolean} immediate - Execute immediately on first call
     * @returns {Function} Debounced function
     */
    static debounce(func, wait, immediate = false) {
        let timeout;
        
        return function executedFunction(...args) {
            const context = this;
            
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            
            const callNow = immediate && !timeout;
            
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            
            if (callNow) func.apply(context, args);
        };
    }

    /**
     * Throttle function - limits execution to once per specified time period
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        
        return function(...args) {
            const context = this;
            
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Create debounced search function
     * @param {Function} searchFunction - Search function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced search function
     */
    static createDebouncedSearch(searchFunction, delay = 300) {
        return this.debounce(searchFunction, delay);
    }

    /**
     * Create throttled scroll handler
     * @param {Function} scrollHandler - Scroll handler function
     * @param {number} limit - Throttle limit in milliseconds
     * @returns {Function} Throttled scroll handler
     */
    static createThrottledScrollHandler(scrollHandler, limit = 100) {
        return this.throttle(scrollHandler, limit);
    }

    /**
     * Lazy load images with intersection observer
     * @param {string} selector - Image selector
     * @param {Object} options - Intersection observer options
     */
    static lazyLoadImages(selector = 'img[data-src]', options = {}) {
        const defaultOptions = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };
        
        const observerOptions = { ...defaultOptions, ...options };
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            }, observerOptions);
            
            document.querySelectorAll(selector).forEach(img => {
                imageObserver.observe(img);
            });
        } else {
            // Fallback for browsers without IntersectionObserver
            document.querySelectorAll(selector).forEach(img => {
                img.src = img.dataset.src;
                img.classList.remove('lazy');
            });
        }
    }

    /**
     * Preload critical resources
     * @param {Array} resources - Array of resource URLs
     * @param {string} type - Resource type (script, style, image)
     * @returns {Promise} Promise that resolves when all resources are loaded
     */
    static preloadResources(resources, type = 'script') {
        const promises = resources.map(url => {
            return new Promise((resolve, reject) => {
                let element;
                
                switch (type) {
                    case 'script':
                        element = document.createElement('script');
                        element.src = url;
                        element.async = true;
                        break;
                    case 'style':
                        element = document.createElement('link');
                        element.rel = 'stylesheet';
                        element.href = url;
                        break;
                    case 'image':
                        element = new Image();
                        element.src = url;
                        break;
                    default:
                        reject(new Error(`Unsupported resource type: ${type}`));
                        return;
                }
                
                element.onload = resolve;
                element.onerror = reject;
                
                if (type !== 'image') {
                    document.head.appendChild(element);
                }
            });
        });
        
        return Promise.all(promises);
    }

    /**
     * Measure function execution time
     * @param {Function} func - Function to measure
     * @param {string} label - Label for the measurement
     * @returns {Function} Wrapped function that measures execution time
     */
    static measureExecutionTime(func, label = 'Function') {
        return function(...args) {
            const startTime = performance.now();
            const result = func.apply(this, args);
            const endTime = performance.now();
            
            console.log(`⏱️ ${label} execution time: ${(endTime - startTime).toFixed(2)}ms`);
            
            return result;
        };
    }

    /**
     * Measure async function execution time
     * @param {Function} asyncFunc - Async function to measure
     * @param {string} label - Label for the measurement
     * @returns {Function} Wrapped async function that measures execution time
     */
    static measureAsyncExecutionTime(asyncFunc, label = 'Async Function') {
        return async function(...args) {
            const startTime = performance.now();
            const result = await asyncFunc.apply(this, args);
            const endTime = performance.now();
            
            console.log(`⏱️ ${label} execution time: ${(endTime - startTime).toFixed(2)}ms`);
            
            return result;
        };
    }

    /**
     * Create a simple cache with LRU eviction
     * @param {number} maxSize - Maximum cache size
     * @returns {Object} Cache object with get, set, and clear methods
     */
    static createLRUCache(maxSize = 100) {
        const cache = new Map();
        
        return {
            get(key) {
                if (cache.has(key)) {
                    // Move to end (most recently used)
                    const value = cache.get(key);
                    cache.delete(key);
                    cache.set(key, value);
                    return value;
                }
                return undefined;
            },
            
            set(key, value) {
                if (cache.has(key)) {
                    cache.delete(key);
                } else if (cache.size >= maxSize) {
                    // Remove least recently used (first item)
                    const firstKey = cache.keys().next().value;
                    cache.delete(firstKey);
                }
                cache.set(key, value);
            },
            
            clear() {
                cache.clear();
            },
            
            size() {
                return cache.size;
            },
            
            has(key) {
                return cache.has(key);
            }
        };
    }

    /**
     * Batch DOM operations to minimize reflows
     * @param {Function} operations - Function containing DOM operations
     * @param {Element} container - Container element (optional)
     */
    static batchDOMOperations(operations, container = document.body) {
        // Create document fragment for batching
        const fragment = document.createDocumentFragment();
        const originalParent = container.parentNode;
        
        // Temporarily remove container from DOM
        if (originalParent) {
            originalParent.removeChild(container);
        }
        
        try {
            // Execute operations
            operations(fragment, container);
        } finally {
            // Re-attach container to DOM
            if (originalParent) {
                originalParent.appendChild(container);
            }
        }
    }

    /**
     * Monitor memory usage
     * @returns {Object} Memory usage information
     */
    static getMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            return {
                usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // MB
                totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // MB
                jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
                usagePercentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
            };
        }
        return null;
    }

    /**
     * Monitor performance metrics
     * @returns {Object} Performance metrics
     */
    static getPerformanceMetrics() {
        if ('performance' in window && 'timing' in performance) {
            const timing = performance.timing;
            const navigation = performance.navigation;
            
            return {
                // Page load metrics
                pageLoadTime: timing.loadEventEnd - timing.navigationStart,
                domContentLoadedTime: timing.domContentLoadedEventEnd - timing.navigationStart,
                domReadyTime: timing.domComplete - timing.domLoading,
                
                // Network metrics
                dnsLookupTime: timing.domainLookupEnd - timing.domainLookupStart,
                tcpConnectTime: timing.connectEnd - timing.connectStart,
                requestTime: timing.responseEnd - timing.requestStart,
                
                // Navigation type
                navigationType: navigation.type,
                redirectCount: navigation.redirectCount,
                
                // Memory (if available)
                memory: this.getMemoryUsage()
            };
        }
        return null;
    }

    /**
     * Create a performance observer for monitoring
     * @param {Array} entryTypes - Entry types to observe
     * @param {Function} callback - Callback function for entries
     * @returns {PerformanceObserver} Performance observer instance
     */
    static createPerformanceObserver(entryTypes = ['measure', 'navigation'], callback = null) {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                
                if (callback) {
                    callback(entries);
                } else {
                    entries.forEach(entry => {
                        console.log(`📊 Performance: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
                    });
                }
            });
            
            try {
                observer.observe({ entryTypes });
                return observer;
            } catch (error) {
                console.warn('Performance observer not supported for entry types:', entryTypes);
            }
        }
        return null;
    }

    /**
     * Optimize table rendering for large datasets
     * @param {Array} data - Data array
     * @param {Function} renderRow - Function to render a single row
     * @param {Element} container - Container element
     * @param {Object} options - Options for optimization
     */
    static optimizeTableRendering(data, renderRow, container, options = {}) {
        const {
            batchSize = 50,
            delay = 10,
            startIndex = 0
        } = options;
        
        let currentIndex = startIndex;
        
        const renderBatch = () => {
            const fragment = document.createDocumentFragment();
            const endIndex = Math.min(currentIndex + batchSize, data.length);
            
            for (let i = currentIndex; i < endIndex; i++) {
                const row = renderRow(data[i], i);
                if (row) {
                    fragment.appendChild(row);
                }
            }
            
            container.appendChild(fragment);
            currentIndex = endIndex;
            
            if (currentIndex < data.length) {
                setTimeout(renderBatch, delay);
            }
        };
        
        renderBatch();
    }

    /**
     * Clean up event listeners and intervals
     * @param {Object} cleanup - Cleanup configuration
     */
    static cleanup(cleanup = {}) {
        const {
            eventListeners = [],
            intervals = [],
            timeouts = [],
            observers = []
        } = cleanup;
        
        // Remove event listeners
        eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        
        // Clear intervals
        intervals.forEach(intervalId => {
            clearInterval(intervalId);
        });
        
        // Clear timeouts
        timeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        
        // Disconnect observers
        observers.forEach(observer => {
            if (observer && typeof observer.disconnect === 'function') {
                observer.disconnect();
            }
        });
        
        console.log('🧹 Performance cleanup completed');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceUtils;
}
