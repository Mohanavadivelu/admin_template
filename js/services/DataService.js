/**
 * DataService - Handles all data loading and caching operations
 * 
 * Responsibilities:
 * - Load dashboard data from JSON files or APIs
 * - Cache data to improve performance
 * - Handle data fetching with retry logic
 * - Manage data persistence (localStorage)
 * 
 * @author Dashboard Team
 * @version 1.0.0
 */

class DataService {
    constructor() {
        this.cache = new Map();
        this.baseUrl = 'http://localhost:8000/'; // Base URL for FastAPI backend
        this.retryAttempts = 3;
        this.retryDelay = 1000; // Base delay in ms
        
        console.log('📊 DataService initialized');
    }

    /**
     * Load dashboard data with caching
     * @returns {Promise<Object>} Dashboard data
     */
    async loadDashboardData() {
        const cacheKey = 'dashboard-data';
        
        if (this.cache.has(cacheKey)) {
            console.log('📊 Loading dashboard data from cache');
            return this.cache.get(cacheKey);
        }
        
        try {
            console.log('📊 Loading dashboard data from server');
            const data = await this.fetchWithRetry('dashboard-data.json');
            this.cache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error('❌ Failed to load dashboard data:', error);
            throw new Error(`Failed to load dashboard configuration: ${error.message}`);
        }
    }

    /**
     * Fetch data with exponential backoff retry logic
     * @param {string} url - URL to fetch
     * @param {number} retries - Number of retry attempts
     * @returns {Promise<Object>} Fetched data
     */
    async fetchWithRetry(url, retries = this.retryAttempts) {
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                
                const response = await fetch(`${this.baseUrl}${url}`, {
                    signal: controller.signal,
                    headers: {
                        'X-API-Key-725d9439': 'CyRLgKg-FL7RuTtVvb7BPr8wmUoI1PamDj4Xdb3eT9w' // Include API Key
                    }
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log(`✅ Successfully fetched ${url} on attempt ${attempt + 1}`);
                return data;
                
            } catch (error) {
                console.warn(`⚠️ Attempt ${attempt + 1} failed for ${url}:`, error.message);
                
                if (attempt === retries - 1) {
                    throw error;
                }
                
                // Exponential backoff
                const delay = this.retryDelay * Math.pow(2, attempt);
                console.log(`⏳ Retrying in ${delay}ms...`);
                await this.delay(delay);
            }
        }
    }

    /**
     * Load applications from localStorage or default data
     * @returns {Array} Applications array
     */
    loadApplicationsFromStorage() {
        try {
            const stored = localStorage.getItem('dashboard_applications');
            if (stored) {
                const applications = JSON.parse(stored);
                console.log(`📱 Loaded ${applications.length} applications from localStorage`);
                return applications;
            }
        } catch (error) {
            console.error('❌ Failed to load applications from localStorage:', error);
        }
        
        return [];
    }

    /**
     * Save applications to localStorage
     * @param {Array} applications - Applications to save
     */
    saveApplicationsToStorage(applications) {
        try {
            localStorage.setItem('dashboard_applications', JSON.stringify(applications));
            console.log(`💾 Saved ${applications.length} applications to localStorage`);
        } catch (error) {
            console.error('❌ Failed to save applications to localStorage:', error);
            throw new Error('Failed to save applications data');
        }
    }

    /**
     * Initialize applications data from JSON if localStorage is empty
     * @param {Array} defaultApplications - Default applications from JSON
     * @returns {Array} Applications array
     */
    initializeApplicationsData(defaultApplications = []) {
        const storedApps = this.loadApplicationsFromStorage();
        
        if (storedApps.length === 0 && defaultApplications.length > 0) {
            console.log('📱 Initializing applications from default data');
            this.saveApplicationsToStorage(defaultApplications);
            return defaultApplications;
        }
        
        return storedApps;
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    /**
     * Utility method for delays
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Validate data structure
     * @param {Object} data - Data to validate
     * @param {Array} requiredFields - Required fields
     * @returns {boolean} Is valid
     */
    validateDataStructure(data, requiredFields = []) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        return requiredFields.every(field => {
            const hasField = field.split('.').reduce((obj, key) => {
                return obj && obj[key] !== undefined;
            }, data);
            
            if (!hasField) {
                console.warn(`⚠️ Missing required field: ${field}`);
            }
            
            return hasField;
        });
    }

    /**
     * Export applications data
     * @param {Array} applications - Applications to export
     * @returns {string} JSON string
     */
    exportApplicationsData(applications) {
        try {
            const exportData = {
                exportDate: new Date().toISOString(),
                version: '1.0.0',
                applications: applications
            };
            
            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('❌ Failed to export applications data:', error);
            throw new Error('Failed to export applications data');
        }
    }

    /**
     * Import applications data
     * @param {string} jsonData - JSON string to import
     * @returns {Array} Imported applications
     */
    importApplicationsData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.applications && Array.isArray(data.applications)) {
                return data.applications;
            }
            
            throw new Error('Invalid data format');
        } catch (error) {
            console.error('❌ Failed to import applications data:', error);
            throw new Error('Failed to import applications data: Invalid format');
        }
    }

    /**
     * Fetch list of all legacy applications.
     * @returns {Promise<Array>} List of application objects.
     */
    async fetchApplications() {
        try {
            console.log('📊 Fetching application list from backend...');
            const data = await this.fetchWithRetry('app_list/');
            if (data && Array.isArray(data.application_list)) {
                console.log(`✅ Fetched ${data.application_list.length} applications.`);
                return data.application_list;
            }
            throw new Error('Invalid application list data structure.');
        } catch (error) {
            console.error('❌ Failed to fetch application list:', error);
            throw new Error(`Failed to fetch application list: ${error.message}`);
        }
    }

    /**
     * Fetch analytics for a specific application.
     * @param {string} applicationName - The name of the application.
     * @returns {Promise<Object>} Application analytics data.
     */
    async fetchApplicationAnalytics(applicationName) {
        try {
            console.log(`📊 Fetching analytics for application: ${applicationName}`);
            const data = await this.fetchWithRetry(`usage_data/analytics/${applicationName}`);
            if (data && typeof data === 'object') {
                console.log(`✅ Fetched analytics for ${applicationName}.`);
                return data;
            }
            throw new Error('Invalid application analytics data structure.');
        } catch (error) {
            console.error(`❌ Failed to fetch analytics for ${applicationName}:`, error);
            throw new Error(`Failed to fetch analytics for ${applicationName}: ${error.message}`);
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataService;
}
