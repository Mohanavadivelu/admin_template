/**
 * ErrorHandler - Centralized error handling and reporting
 * 
 * Responsibilities:
 * - Handle and log errors consistently
 * - Show user-friendly error messages
 * - Report errors to monitoring services
 * - Provide error recovery mechanisms
 * 
 * @author Dashboard Team
 * @version 1.0.0
 */

class ErrorHandler {
    constructor() {
        this.errorQueue = [];
        this.maxQueueSize = 100;
        this.isOnline = navigator.onLine;
        
        this.setupGlobalErrorHandlers();
        this.setupNetworkStatusHandlers();
        
        console.log('🛡️ ErrorHandler initialized');
    }

    /**
     * Setup global error handlers
     */
    setupGlobalErrorHandlers() {
        // Handle uncaught JavaScript errors
        window.addEventListener('error', (event) => {
            this.handle(event.error, 'Global Error', {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handle(event.reason, 'Unhandled Promise Rejection');
            event.preventDefault(); // Prevent console error
        });
    }

    /**
     * Setup network status handlers
     */
    setupNetworkStatusHandlers() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showUserMessage('Connection restored', 'success');
            this.processErrorQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showUserMessage('Connection lost. Working offline.', 'warning');
        });
    }

    /**
     * Main error handling method
     * @param {Error|string} error - Error object or message
     * @param {string} context - Context where error occurred
     * @param {Object} additionalInfo - Additional error information
     */
    handle(error, context = '', additionalInfo = {}) {
        const errorInfo = this.createErrorInfo(error, context, additionalInfo);
        
        // Log to console
        this.logError(errorInfo);
        
        // Queue for reporting if offline
        if (!this.isOnline) {
            this.queueError(errorInfo);
        } else {
            this.reportError(errorInfo);
        }
        
        // Show user-friendly message
        this.showUserError(errorInfo);
    }

    /**
     * Create standardized error information object
     * @param {Error|string} error - Error object or message
     * @param {string} context - Context where error occurred
     * @param {Object} additionalInfo - Additional error information
     * @returns {Object} Error information object
     */
    createErrorInfo(error, context, additionalInfo) {
        const errorObj = error instanceof Error ? error : new Error(error);
        
        return {
            message: errorObj.message,
            stack: errorObj.stack,
            context,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            userId: this.getCurrentUserId(),
            sessionId: this.getSessionId(),
            ...additionalInfo
        };
    }

    /**
     * Log error to console with formatting
     * @param {Object} errorInfo - Error information
     */
    logError(errorInfo) {
        const logLevel = this.getLogLevel(errorInfo);
        const logMethod = console[logLevel] || console.error;
        
        logMethod.call(console, 
            `🚨 ${logLevel.toUpperCase()}: ${errorInfo.context}`,
            {
                message: errorInfo.message,
                timestamp: errorInfo.timestamp,
                stack: errorInfo.stack
            }
        );
    }

    /**
     * Determine log level based on error type
     * @param {Object} errorInfo - Error information
     * @returns {string} Log level
     */
    getLogLevel(errorInfo) {
        if (errorInfo.message.includes('Network')) return 'warn';
        if (errorInfo.message.includes('Validation')) return 'warn';
        if (errorInfo.context.includes('API')) return 'error';
        return 'error';
    }

    /**
     * Show user-friendly error message
     * @param {Object} errorInfo - Error information
     */
    showUserError(errorInfo) {
        const userMessage = this.getUserFriendlyMessage(errorInfo);
        const messageType = this.getMessageType(errorInfo);
        
        this.showUserMessage(userMessage, messageType);
    }

    /**
     * Convert technical error to user-friendly message
     * @param {Object} errorInfo - Error information
     * @returns {string} User-friendly message
     */
    getUserFriendlyMessage(errorInfo) {
        const { message, context } = errorInfo;
        
        // Network errors
        if (message.includes('fetch') || message.includes('Network')) {
            return 'Unable to connect to the server. Please check your internet connection.';
        }
        
        // Validation errors
        if (message.includes('Validation') || context.includes('Form')) {
            return message; // Validation messages are already user-friendly
        }
        
        // Data loading errors
        if (context.includes('Data') || context.includes('Load')) {
            return 'Failed to load data. Please refresh the page and try again.';
        }
        
        // Chart errors
        if (context.includes('Chart')) {
            return 'Unable to display charts. The data may be temporarily unavailable.';
        }
        
        // Component loading errors
        if (context.includes('Component')) {
            return 'Some parts of the page failed to load. Please refresh the page.';
        }
        
        // Generic fallback
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }

    /**
     * Get message type for styling
     * @param {Object} errorInfo - Error information
     * @returns {string} Message type
     */
    getMessageType(errorInfo) {
        if (errorInfo.message.includes('Network')) return 'warning';
        if (errorInfo.message.includes('Validation')) return 'error';
        return 'error';
    }

    /**
     * Show message to user
     * @param {string} message - Message to show
     * @param {string} type - Message type (success, warning, error)
     */
    showUserMessage(message, type = 'error') {
        // Try to use existing notification system
        if (window.dashboardManager && window.dashboardManager.showMessage) {
            window.dashboardManager.showMessage(message, type);
            return;
        }
        
        // Fallback to creating our own notification
        this.createNotification(message, type);
    }

    /**
     * Create notification element
     * @param {string} message - Message to show
     * @param {string} type - Message type
     */
    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `error-notification error-notification--${type}`;
        notification.innerHTML = `
            <div class="error-notification__content">
                <i class="fas ${this.getIconForType(type)}"></i>
                <span>${message}</span>
                <button class="error-notification__close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add styles if not already present
        this.addNotificationStyles();
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Get icon for message type
     * @param {string} type - Message type
     * @returns {string} Font Awesome icon class
     */
    getIconForType(type) {
        const icons = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.error;
    }

    /**
     * Add notification styles if not present
     */
    addNotificationStyles() {
        if (document.getElementById('error-notification-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'error-notification-styles';
        styles.textContent = `
            .error-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                background: var(--secondary-bg, #1d2d44);
                border: 1px solid var(--border-color, #415a77);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                animation: slideIn 0.3s ease;
            }
            
            .error-notification--error {
                border-left: 4px solid #e83e8c;
            }
            
            .error-notification--warning {
                border-left: 4px solid #ffc107;
            }
            
            .error-notification--success {
                border-left: 4px solid #3ddc97;
            }
            
            .error-notification__content {
                display: flex;
                align-items: center;
                padding: 16px;
                color: var(--text-primary, #e0e0e0);
                gap: 12px;
            }
            
            .error-notification__close {
                background: none;
                border: none;
                color: var(--text-secondary, #a8b2d1);
                cursor: pointer;
                margin-left: auto;
                padding: 4px;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Queue error for later reporting when online
     * @param {Object} errorInfo - Error information
     */
    queueError(errorInfo) {
        if (this.errorQueue.length >= this.maxQueueSize) {
            this.errorQueue.shift(); // Remove oldest error
        }
        
        this.errorQueue.push(errorInfo);
        console.log(`📥 Queued error for later reporting (${this.errorQueue.length} in queue)`);
    }

    /**
     * Process queued errors when back online
     */
    async processErrorQueue() {
        if (this.errorQueue.length === 0) return;
        
        console.log(`📤 Processing ${this.errorQueue.length} queued errors`);
        
        const errors = [...this.errorQueue];
        this.errorQueue = [];
        
        for (const errorInfo of errors) {
            try {
                await this.reportError(errorInfo);
            } catch (reportError) {
                console.warn('Failed to report queued error:', reportError);
                // Re-queue if reporting fails
                this.queueError(errorInfo);
            }
        }
    }

    /**
     * Report error to monitoring service
     * @param {Object} errorInfo - Error information
     */
    async reportError(errorInfo) {
        // In a real application, this would send to an error tracking service
        // like Sentry, LogRocket, or a custom endpoint
        
        try {
            // Simulate API call
            console.log('📊 Reporting error to monitoring service:', {
                message: errorInfo.message,
                context: errorInfo.context,
                timestamp: errorInfo.timestamp
            });
            
            // Example: Send to error tracking service
            // await fetch('/api/errors', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(errorInfo)
            // });
            
        } catch (error) {
            console.warn('Failed to report error to monitoring service:', error);
            throw error;
        }
    }

    /**
     * Get current user ID (placeholder)
     * @returns {string|null} User ID
     */
    getCurrentUserId() {
        // In a real application, get from authentication service
        return localStorage.getItem('userId') || null;
    }

    /**
     * Get session ID
     * @returns {string} Session ID
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    }

    /**
     * Create custom error types
     */
    static createCustomErrors() {
        // Validation Error
        window.ValidationError = class extends Error {
            constructor(message, field = null) {
                super(message);
                this.name = 'ValidationError';
                this.field = field;
            }
        };

        // Network Error
        window.NetworkError = class extends Error {
            constructor(message, status = null) {
                super(message);
                this.name = 'NetworkError';
                this.status = status;
            }
        };

        // Data Error
        window.DataError = class extends Error {
            constructor(message, data = null) {
                super(message);
                this.name = 'DataError';
                this.data = data;
            }
        };
    }
}

// Initialize custom error types
ErrorHandler.createCustomErrors();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}
