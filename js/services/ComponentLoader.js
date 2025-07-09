/**
 * ComponentLoader - Dynamic component loading service
 * 
 * Responsibilities:
 * - Load HTML components dynamically
 * - Cache loaded components
 * - Handle component loading errors
 * - Manage component dependencies
 * 
 * @author Dashboard Team
 * @version 1.0.0
 */

class ComponentLoader {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.componentConfig = new Map();
        this.retryAttempts = 3;
        this.timeout = 5000;
        
        this.initializeComponentConfig();
        
        console.log('🧩 ComponentLoader initialized');
    }

    /**
     * Initialize component configuration
     */
    initializeComponentConfig() {
        const components = [
            // Common components
            {
                id: 'sidebar',
                selector: '#sidebar-container',
                url: './components/common/sidebar.html',
                name: 'Sidebar',
                priority: 1,
                dependencies: []
            },
            {
                id: 'topbar',
                selector: '#topbar-container',
                url: './components/common/topbar.html',
                name: 'Top Navigation',
                priority: 1,
                dependencies: []
            },
            
            // Dashboard components
            {
                id: 'visitors-panel',
                selector: '#visitors-panel-container',
                url: './components/pages/dashboard/usage-statistics-panel.html',
                name: 'Usage Statistics Panel',
                priority: 2,
                dependencies: []
            },
            {
                id: 'user-statistics-panel',
                selector: '#user-statistics-panel-container',
                url: './components/pages/dashboard/user-statistics-panel.html',
                name: 'User Statistics Panel',
                priority: 2,
                dependencies: []
            },
            {
                id: 'members-panel',
                selector: '#members-panel-container',
                url: './components/pages/dashboard/members-panel.html',
                name: 'Members Panel',
                priority: 2,
                dependencies: []
            },
            {
                id: 'bandwidth-panel',
                selector: '#bandwidth-panel-container',
                url: './components/pages/dashboard/bandwidth-panel.html',
                name: 'Bandwidth Panel',
                priority: 2,
                dependencies: []
            },
            {
                id: 'server-panel',
                selector: '#server-panel-container',
                url: './components/pages/dashboard/server-panel.html',
                name: 'Server Panel',
                priority: 2,
                dependencies: []
            },
            {
                id: 'traffic-panel',
                selector: '#traffic-panel-container',
                url: './components/pages/dashboard/traffic-panel.html',
                name: 'Traffic Panel',
                priority: 2,
                dependencies: []
            },
            
            // App Manager components
            {
                id: 'app-form-panel',
                selector: '#app-form-panel-container',
                url: './components/pages/app-manager/app-form-panel.html',
                name: 'Application Form Panel',
                priority: 2,
                dependencies: []
            },
            {
                id: 'app-table-panel',
                selector: '#app-table-panel-container',
                url: './components/pages/app-manager/app-table-panel.html',
                name: 'Applications Table Panel',
                priority: 2,
                dependencies: []
            }
        ];

        components.forEach(component => {
            this.componentConfig.set(component.id, component);
        });
    }

    /**
     * Load all components
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise<Object>} Loading results
     */
    async loadAllComponents(progressCallback = null) {
        const components = Array.from(this.componentConfig.values());
        const results = {
            loaded: [],
            failed: [],
            total: components.length
        };

        // Sort by priority
        components.sort((a, b) => a.priority - b.priority);

        console.log(`🧩 Loading ${components.length} components...`);

        for (let i = 0; i < components.length; i++) {
            const component = components[i];
            
            try {
                if (progressCallback) {
                    progressCallback({
                        current: i + 1,
                        total: components.length,
                        component: component.name
                    });
                }

                await this.loadComponent(component.id);
                results.loaded.push(component.id);
                
                console.log(`✅ Loaded component: ${component.name}`);
                
            } catch (error) {
                console.error(`❌ Failed to load component ${component.name}:`, error);
                results.failed.push({
                    id: component.id,
                    name: component.name,
                    error: error.message
                });
            }
        }

        console.log(`🧩 Component loading complete: ${results.loaded.length}/${results.total} successful`);
        return results;
    }

    /**
     * Load single component
     * @param {string} componentId - Component ID
     * @returns {Promise<string>} Component HTML
     */
    async loadComponent(componentId) {
        const config = this.componentConfig.get(componentId);
        if (!config) {
            throw new Error(`Component configuration not found: ${componentId}`);
        }

        // Check cache first
        if (this.cache.has(componentId)) {
            console.log(`🧩 Loading ${config.name} from cache`);
            const html = this.cache.get(componentId);
            this.injectComponent(config, html);
            return html;
        }

        // Check if already loading
        if (this.loadingPromises.has(componentId)) {
            console.log(`🧩 ${config.name} already loading, waiting...`);
            return await this.loadingPromises.get(componentId);
        }

        // Load dependencies first
        await this.loadDependencies(config.dependencies);

        // Start loading
        const loadingPromise = this.fetchComponent(config);
        this.loadingPromises.set(componentId, loadingPromise);

        try {
            const html = await loadingPromise;
            
            // Cache the result
            this.cache.set(componentId, html);
            
            // Inject into DOM
            this.injectComponent(config, html);
            
            // Clean up loading promise
            this.loadingPromises.delete(componentId);
            
            return html;
            
        } catch (error) {
            this.loadingPromises.delete(componentId);
            throw error;
        }
    }

    /**
     * Fetch component HTML with retry logic
     * @param {Object} config - Component configuration
     * @returns {Promise<string>} Component HTML
     */
    async fetchComponent(config) {
        for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
            try {
                console.log(`🧩 Fetching ${config.name} (attempt ${attempt + 1})`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);
                
                const response = await fetch(config.url, {
                    signal: controller.signal,
                    cache: 'no-cache' // Ensure fresh content during development
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const html = await response.text();
                
                if (!html.trim()) {
                    throw new Error('Empty component content');
                }
                
                console.log(`✅ Fetched ${config.name} (${html.length} characters)`);
                return html;
                
            } catch (error) {
                console.warn(`⚠️ Attempt ${attempt + 1} failed for ${config.name}:`, error.message);
                
                if (attempt === this.retryAttempts - 1) {
                    throw new Error(`Failed to load ${config.name} after ${this.retryAttempts} attempts: ${error.message}`);
                }
                
                // Exponential backoff
                const delay = 1000 * Math.pow(2, attempt);
                await this.delay(delay);
            }
        }
    }

    /**
     * Load component dependencies
     * @param {Array} dependencies - Dependency component IDs
     * @returns {Promise<void>}
     */
    async loadDependencies(dependencies) {
        if (!dependencies || dependencies.length === 0) {
            return;
        }

        console.log(`🧩 Loading dependencies: ${dependencies.join(', ')}`);
        
        const dependencyPromises = dependencies.map(depId => this.loadComponent(depId));
        await Promise.all(dependencyPromises);
    }

    /**
     * Inject component HTML into DOM
     * @param {Object} config - Component configuration
     * @param {string} html - Component HTML
     */
    injectComponent(config, html) {
        const container = document.querySelector(config.selector);
        
        if (!container) {
            console.warn(`⚠️ Container not found for ${config.name}: ${config.selector}`);
            return;
        }

        // Sanitize HTML before injection
        const sanitizedHtml = this.sanitizeHTML(html);
        
        container.innerHTML = sanitizedHtml;
        
        // Trigger custom event for component loaded
        this.dispatchComponentEvent('componentLoaded', {
            componentId: config.id,
            componentName: config.name,
            selector: config.selector
        });
        
        console.log(`🧩 Injected ${config.name} into ${config.selector}`);
    }

    /**
     * Basic HTML sanitization
     * @param {string} html - HTML to sanitize
     * @returns {string} Sanitized HTML
     */
    sanitizeHTML(html) {
        // Basic sanitization - remove script tags and dangerous attributes
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/javascript:/gi, '');
    }

    /**
     * Dispatch component event
     * @param {string} eventType - Event type
     * @param {Object} detail - Event detail
     */
    dispatchComponentEvent(eventType, detail) {
        const event = new CustomEvent(eventType, {
            detail,
            bubbles: true,
            cancelable: true
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Reload component
     * @param {string} componentId - Component ID
     * @returns {Promise<string>} Component HTML
     */
    async reloadComponent(componentId) {
        // Clear from cache
        this.cache.delete(componentId);
        
        // Load fresh
        return await this.loadComponent(componentId);
    }

    /**
     * Preload components
     * @param {Array} componentIds - Component IDs to preload
     * @returns {Promise<Array>} Preload results
     */
    async preloadComponents(componentIds) {
        console.log(`🧩 Preloading components: ${componentIds.join(', ')}`);
        
        const results = await Promise.allSettled(
            componentIds.map(id => this.loadComponent(id))
        );
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`🧩 Preloaded ${successful}/${componentIds.length} components`);
        
        return results;
    }

    /**
     * Get component status
     * @param {string} componentId - Component ID
     * @returns {Object} Component status
     */
    getComponentStatus(componentId) {
        const config = this.componentConfig.get(componentId);
        if (!config) {
            return { exists: false };
        }

        return {
            exists: true,
            loaded: this.cache.has(componentId),
            loading: this.loadingPromises.has(componentId),
            config: config
        };
    }

    /**
     * Get all component statuses
     * @returns {Object} All component statuses
     */
    getAllComponentStatuses() {
        const statuses = {};
        
        for (const [id, config] of this.componentConfig) {
            statuses[id] = this.getComponentStatus(id);
        }
        
        return statuses;
    }

    /**
     * Clear component cache
     * @param {string} componentId - Component ID (optional)
     */
    clearCache(componentId = null) {
        if (componentId) {
            this.cache.delete(componentId);
            console.log(`🗑️ Cleared cache for component: ${componentId}`);
        } else {
            this.cache.clear();
            console.log('🗑️ Cleared all component cache');
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        const totalSize = Array.from(this.cache.values())
            .reduce((size, html) => size + html.length, 0);
        
        return {
            cachedComponents: this.cache.size,
            totalComponents: this.componentConfig.size,
            totalCacheSize: totalSize,
            averageComponentSize: this.cache.size > 0 ? Math.round(totalSize / this.cache.size) : 0
        };
    }

    /**
     * Utility delay function
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Add component configuration
     * @param {Object} config - Component configuration
     */
    addComponent(config) {
        this.componentConfig.set(config.id, config);
        console.log(`🧩 Added component configuration: ${config.name}`);
    }

    /**
     * Remove component configuration
     * @param {string} componentId - Component ID
     */
    removeComponent(componentId) {
        this.componentConfig.delete(componentId);
        this.cache.delete(componentId);
        this.loadingPromises.delete(componentId);
        console.log(`🗑️ Removed component: ${componentId}`);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLoader;
}
