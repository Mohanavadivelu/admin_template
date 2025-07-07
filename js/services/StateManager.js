/**
 * StateManager - Centralized state management
 * 
 * Responsibilities:
 * - Manage application state
 * - Provide state subscription system
 * - Handle state persistence
 * - Emit state change events
 * 
 * @author Dashboard Team
 * @version 1.0.0
 */

class StateManager {
    constructor() {
        this.state = this.getInitialState();
        this.listeners = new Map();
        this.history = [];
        this.maxHistorySize = 50;
        this.persistentKeys = ['applications', 'userPreferences'];
        
        this.loadPersistedState();
        this.setupStateLogging();
        
        console.log('🗃️ StateManager initialized');
    }

    /**
     * Get initial state structure
     * @returns {Object} Initial state
     */
    getInitialState() {
        return {
            // Data state
            applications: [],
            dashboardData: null,
            
            // UI state
            currentPage: 'dashboard',
            loading: false,
            error: null,
            
            // Application management state
            currentEditingApp: null,
            searchTerm: '',
            sortField: 'app_name',
            sortDirection: 'asc',
            currentPageNumber: 1,
            itemsPerPage: 10,
            
            // Chart state
            charts: {},
            chartsInitialized: false,
            
            // Modal state
            activeModal: null,
            modalData: null,
            
            // User preferences
            userPreferences: {
                theme: 'dark',
                language: 'en',
                autoRefresh: true,
                refreshInterval: 30000
            },
            
            // System state
            isOnline: navigator.onLine,
            lastUpdated: null,
            version: '1.0.0'
        };
    }

    /**
     * Subscribe to state changes
     * @param {string|Array} keys - State key(s) to watch
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(keys, callback) {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        const listenerId = this.generateListenerId();
        
        keyArray.forEach(key => {
            if (!this.listeners.has(key)) {
                this.listeners.set(key, new Map());
            }
            this.listeners.get(key).set(listenerId, callback);
        });
        
        console.log(`📡 Subscribed to state changes: ${keyArray.join(', ')}`);
        
        // Return unsubscribe function
        return () => {
            keyArray.forEach(key => {
                if (this.listeners.has(key)) {
                    this.listeners.get(key).delete(listenerId);
                    if (this.listeners.get(key).size === 0) {
                        this.listeners.delete(key);
                    }
                }
            });
            console.log(`📡 Unsubscribed from state changes: ${keyArray.join(', ')}`);
        };
    }

    /**
     * Update state
     * @param {Object|Function} updates - State updates or updater function
     */
    setState(updates) {
        const prevState = { ...this.state };
        
        // Handle function updates
        if (typeof updates === 'function') {
            updates = updates(this.state);
        }
        
        // Apply updates
        this.state = { ...this.state, ...updates };
        
        // Add to history
        this.addToHistory(prevState, this.state, updates);
        
        // Persist state if needed
        this.persistState(Object.keys(updates));
        
        // Notify listeners
        this.notifyListeners(updates, prevState);
        
        // Update last updated timestamp
        this.state.lastUpdated = new Date().toISOString();
        
        console.log('🔄 State updated:', Object.keys(updates));
    }

    /**
     * Get current state
     * @param {string} key - State key (optional)
     * @returns {any} State value or entire state
     */
    getState(key = null) {
        if (key === null) {
            return { ...this.state };
        }
        
        return this.getNestedValue(this.state, key);
    }

    /**
     * Get nested value from object using dot notation
     * @param {Object} obj - Object to search
     * @param {string} path - Dot notation path
     * @returns {any} Value at path
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Set nested value using dot notation
     * @param {Object} obj - Object to update
     * @param {string} path - Dot notation path
     * @param {any} value - Value to set
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        
        target[lastKey] = value;
    }

    /**
     * Notify listeners of state changes
     * @param {Object} updates - State updates
     * @param {Object} prevState - Previous state
     */
    notifyListeners(updates, prevState) {
        Object.keys(updates).forEach(key => {
            if (this.listeners.has(key)) {
                const callbacks = this.listeners.get(key);
                callbacks.forEach(callback => {
                    try {
                        callback(this.state[key], prevState[key], key);
                    } catch (error) {
                        console.error(`Error in state listener for ${key}:`, error);
                    }
                });
            }
        });
        
        // Notify wildcard listeners
        if (this.listeners.has('*')) {
            const callbacks = this.listeners.get('*');
            callbacks.forEach(callback => {
                try {
                    callback(this.state, prevState, Object.keys(updates));
                } catch (error) {
                    console.error('Error in wildcard state listener:', error);
                }
            });
        }
    }

    /**
     * Add state change to history
     * @param {Object} prevState - Previous state
     * @param {Object} newState - New state
     * @param {Object} updates - Updates applied
     */
    addToHistory(prevState, newState, updates) {
        const historyEntry = {
            timestamp: new Date().toISOString(),
            updates: Object.keys(updates),
            prevValues: {},
            newValues: {}
        };
        
        // Store only the changed values
        Object.keys(updates).forEach(key => {
            historyEntry.prevValues[key] = prevState[key];
            historyEntry.newValues[key] = newState[key];
        });
        
        this.history.push(historyEntry);
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    /**
     * Get state history
     * @param {number} limit - Number of entries to return
     * @returns {Array} State history
     */
    getHistory(limit = 10) {
        return this.history.slice(-limit);
    }

    /**
     * Reset state to initial values
     * @param {Array} keys - Keys to reset (optional)
     */
    resetState(keys = null) {
        const initialState = this.getInitialState();
        
        if (keys) {
            const updates = {};
            keys.forEach(key => {
                updates[key] = initialState[key];
            });
            this.setState(updates);
        } else {
            this.state = initialState;
            this.notifyListeners(this.state, {});
        }
        
        console.log('🔄 State reset:', keys || 'all');
    }

    /**
     * Load persisted state from localStorage
     */
    loadPersistedState() {
        this.persistentKeys.forEach(key => {
            try {
                const stored = localStorage.getItem(`dashboard_state_${key}`);
                if (stored) {
                    const value = JSON.parse(stored);
                    this.state[key] = value;
                    console.log(`💾 Loaded persisted state for ${key}`);
                }
            } catch (error) {
                console.warn(`Failed to load persisted state for ${key}:`, error);
            }
        });
    }

    /**
     * Persist state to localStorage
     * @param {Array} keys - Keys to persist
     */
    persistState(keys) {
        keys.forEach(key => {
            if (this.persistentKeys.includes(key)) {
                try {
                    localStorage.setItem(
                        `dashboard_state_${key}`, 
                        JSON.stringify(this.state[key])
                    );
                    console.log(`💾 Persisted state for ${key}`);
                } catch (error) {
                    console.warn(`Failed to persist state for ${key}:`, error);
                }
            }
        });
    }

    /**
     * Clear persisted state
     * @param {Array} keys - Keys to clear (optional)
     */
    clearPersistedState(keys = null) {
        const keysToClear = keys || this.persistentKeys;
        
        keysToClear.forEach(key => {
            try {
                localStorage.removeItem(`dashboard_state_${key}`);
                console.log(`🗑️ Cleared persisted state for ${key}`);
            } catch (error) {
                console.warn(`Failed to clear persisted state for ${key}:`, error);
            }
        });
    }

    /**
     * Setup state change logging
     */
    setupStateLogging() {
        if (process.env.NODE_ENV === 'development') {
            this.subscribe('*', (newState, prevState, changedKeys) => {
                console.group('🗃️ State Change');
                console.log('Changed keys:', changedKeys);
                console.log('Previous state:', prevState);
                console.log('New state:', newState);
                console.groupEnd();
            });
        }
    }

    /**
     * Generate unique listener ID
     * @returns {string} Listener ID
     */
    generateListenerId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get state statistics
     * @returns {Object} State statistics
     */
    getStats() {
        return {
            stateKeys: Object.keys(this.state).length,
            listeners: Array.from(this.listeners.keys()).reduce((total, key) => {
                return total + this.listeners.get(key).size;
            }, 0),
            historySize: this.history.length,
            lastUpdated: this.state.lastUpdated,
            persistentKeys: this.persistentKeys.length
        };
    }

    /**
     * Batch state updates
     * @param {Function} updater - Function that performs multiple updates
     */
    batch(updater) {
        const prevState = { ...this.state };
        const updates = {};
        
        // Temporarily override setState to collect updates
        const originalSetState = this.setState.bind(this);
        this.setState = (newUpdates) => {
            Object.assign(updates, newUpdates);
            Object.assign(this.state, newUpdates);
        };
        
        try {
            updater();
        } finally {
            // Restore original setState
            this.setState = originalSetState;
        }
        
        // Apply all updates at once
        if (Object.keys(updates).length > 0) {
            this.addToHistory(prevState, this.state, updates);
            this.persistState(Object.keys(updates));
            this.notifyListeners(updates, prevState);
            this.state.lastUpdated = new Date().toISOString();
            
            console.log('🔄 Batch state update:', Object.keys(updates));
        }
    }

    /**
     * Create computed state getter
     * @param {Function} computer - Function that computes derived state
     * @param {Array} dependencies - State keys this computation depends on
     * @returns {Function} Getter function
     */
    createComputed(computer, dependencies = []) {
        let cachedValue;
        let lastDependencyValues = {};
        
        return () => {
            // Check if dependencies have changed
            const currentDependencyValues = {};
            let hasChanged = false;
            
            dependencies.forEach(dep => {
                currentDependencyValues[dep] = this.getState(dep);
                if (currentDependencyValues[dep] !== lastDependencyValues[dep]) {
                    hasChanged = true;
                }
            });
            
            // Recompute if dependencies changed or first time
            if (hasChanged || cachedValue === undefined) {
                cachedValue = computer(this.state);
                lastDependencyValues = currentDependencyValues;
            }
            
            return cachedValue;
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}
