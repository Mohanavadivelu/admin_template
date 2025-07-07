/**
 * ValidationService - Input validation and sanitization
 * 
 * Responsibilities:
 * - Validate form inputs
 * - Sanitize user input to prevent XSS
 * - Provide validation rules and error messages
 * - Format validation results
 * 
 * @author Dashboard Team
 * @version 1.0.0
 */

class ValidationService {
    constructor() {
        this.rules = new Map();
        this.messages = new Map();
        
        this.initializeDefaultRules();
        this.initializeDefaultMessages();
        
        console.log('✅ ValidationService initialized');
    }

    /**
     * Initialize default validation rules
     */
    initializeDefaultRules() {
        // Application name validation
        this.addRule('app_name', {
            required: true,
            minLength: 2,
            maxLength: 100,
            pattern: /^[a-zA-Z0-9\s\-_.()]+$/,
            sanitize: true
        });

        // Application type validation
        this.addRule('app_type', {
            required: true,
            enum: ['desktop', 'web', 'mobile', 'service', 'windows', 'mac', 'linux']
        });

        // Version validation
        this.addRule('current_version', {
            required: true,
            pattern: /^\d+\.\d+(\.\d+)?(\.\d+)?$/,
            maxLength: 20
        });

        // Publisher validation
        this.addRule('publisher', {
            required: true,
            minLength: 2,
            maxLength: 100,
            sanitize: true
        });

        // Description validation
        this.addRule('description', {
            required: false,
            maxLength: 500,
            sanitize: true
        });

        // URL validation
        this.addRule('download_link', {
            required: false,
            url: true,
            maxLength: 500
        });

        // Date validation
        this.addRule('released_date', {
            required: true,
            date: true,
            maxDate: new Date()
        });

        this.addRule('registered_date', {
            required: true,
            date: true,
            maxDate: new Date()
        });

        // Tracking interval validation
        this.addRule('track_interval', {
            required: false,
            number: true,
            min: 1,
            max: 60
        });
    }

    /**
     * Initialize default error messages
     */
    initializeDefaultMessages() {
        this.messages.set('required', 'This field is required');
        this.messages.set('minLength', 'Must be at least {min} characters long');
        this.messages.set('maxLength', 'Must be no more than {max} characters long');
        this.messages.set('pattern', 'Invalid format');
        this.messages.set('enum', 'Must be one of: {values}');
        this.messages.set('url', 'Must be a valid URL');
        this.messages.set('date', 'Must be a valid date');
        this.messages.set('maxDate', 'Date cannot be in the future');
        this.messages.set('number', 'Must be a valid number');
        this.messages.set('min', 'Must be at least {min}');
        this.messages.set('max', 'Must be no more than {max}');
    }

    /**
     * Add validation rule
     * @param {string} field - Field name
     * @param {Object} rule - Validation rule
     */
    addRule(field, rule) {
        this.rules.set(field, rule);
    }

    /**
     * Validate form data
     * @param {Object} data - Data to validate
     * @param {Array} fields - Fields to validate (optional)
     * @returns {Object} Validation result
     */
    validateForm(data, fields = null) {
        const errors = {};
        const sanitizedData = {};
        let isValid = true;

        const fieldsToValidate = fields || Array.from(this.rules.keys());

        for (const field of fieldsToValidate) {
            const rule = this.rules.get(field);
            if (!rule) continue;

            const value = data[field];
            const fieldResult = this.validateField(field, value, rule);

            if (!fieldResult.isValid) {
                errors[field] = fieldResult.errors;
                isValid = false;
            }

            sanitizedData[field] = fieldResult.sanitizedValue;
        }

        return {
            isValid,
            errors,
            sanitizedData
        };
    }

    /**
     * Validate single field
     * @param {string} field - Field name
     * @param {any} value - Field value
     * @param {Object} rule - Validation rule
     * @returns {Object} Field validation result
     */
    validateField(field, value, rule) {
        const errors = [];
        let sanitizedValue = value;

        // Sanitize input first if required
        if (rule.sanitize && typeof value === 'string') {
            sanitizedValue = this.sanitizeInput(value);
        }

        // Required validation
        if (rule.required && this.isEmpty(sanitizedValue)) {
            errors.push(this.getMessage('required'));
        }

        // Skip other validations if value is empty and not required
        if (this.isEmpty(sanitizedValue) && !rule.required) {
            return {
                isValid: true,
                errors: [],
                sanitizedValue: sanitizedValue
            };
        }

        // String validations
        if (typeof sanitizedValue === 'string') {
            // Min length
            if (rule.minLength && sanitizedValue.length < rule.minLength) {
                errors.push(this.getMessage('minLength', { min: rule.minLength }));
            }

            // Max length
            if (rule.maxLength && sanitizedValue.length > rule.maxLength) {
                errors.push(this.getMessage('maxLength', { max: rule.maxLength }));
            }

            // Pattern validation
            if (rule.pattern && !rule.pattern.test(sanitizedValue)) {
                errors.push(this.getMessage('pattern'));
            }

            // Enum validation
            if (rule.enum && !rule.enum.includes(sanitizedValue.toLowerCase())) {
                errors.push(this.getMessage('enum', { values: rule.enum.join(', ') }));
            }

            // URL validation
            if (rule.url && !this.isValidUrl(sanitizedValue)) {
                errors.push(this.getMessage('url'));
            }
        }

        // Date validation
        if (rule.date) {
            const dateResult = this.validateDate(sanitizedValue, rule);
            if (!dateResult.isValid) {
                errors.push(...dateResult.errors);
            }
        }

        // Number validation
        if (rule.number) {
            const numberResult = this.validateNumber(sanitizedValue, rule);
            if (!numberResult.isValid) {
                errors.push(...numberResult.errors);
                sanitizedValue = numberResult.sanitizedValue;
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            sanitizedValue
        };
    }

    /**
     * Validate date field
     * @param {any} value - Date value
     * @param {Object} rule - Validation rule
     * @returns {Object} Date validation result
     */
    validateDate(value, rule) {
        const errors = [];
        
        if (typeof value === 'string' && value.trim() === '') {
            return { isValid: true, errors: [] };
        }

        const date = new Date(value);
        
        if (isNaN(date.getTime())) {
            errors.push(this.getMessage('date'));
            return { isValid: false, errors };
        }

        // Max date validation
        if (rule.maxDate && date > rule.maxDate) {
            errors.push(this.getMessage('maxDate'));
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate number field
     * @param {any} value - Number value
     * @param {Object} rule - Validation rule
     * @returns {Object} Number validation result
     */
    validateNumber(value, rule) {
        const errors = [];
        let sanitizedValue = value;

        // Convert to number if it's a string
        if (typeof value === 'string') {
            sanitizedValue = parseFloat(value);
        }

        if (isNaN(sanitizedValue)) {
            errors.push(this.getMessage('number'));
            return { isValid: false, errors, sanitizedValue: value };
        }

        // Min value validation
        if (rule.min !== undefined && sanitizedValue < rule.min) {
            errors.push(this.getMessage('min', { min: rule.min }));
        }

        // Max value validation
        if (rule.max !== undefined && sanitizedValue > rule.max) {
            errors.push(this.getMessage('max', { max: rule.max }));
        }

        return {
            isValid: errors.length === 0,
            errors,
            sanitizedValue
        };
    }

    /**
     * Sanitize input to prevent XSS
     * @param {string} input - Input to sanitize
     * @returns {string} Sanitized input
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;

        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .substring(0, 1000); // Limit length
    }

    /**
     * Validate URL
     * @param {string} url - URL to validate
     * @returns {boolean} Is valid URL
     */
    isValidUrl(url) {
        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    }

    /**
     * Check if value is empty
     * @param {any} value - Value to check
     * @returns {boolean} Is empty
     */
    isEmpty(value) {
        return value === null || 
               value === undefined || 
               (typeof value === 'string' && value.trim() === '') ||
               (Array.isArray(value) && value.length === 0);
    }

    /**
     * Get error message with interpolation
     * @param {string} key - Message key
     * @param {Object} params - Parameters for interpolation
     * @returns {string} Error message
     */
    getMessage(key, params = {}) {
        let message = this.messages.get(key) || 'Invalid value';
        
        // Simple interpolation
        Object.keys(params).forEach(param => {
            message = message.replace(`{${param}}`, params[param]);
        });
        
        return message;
    }

    /**
     * Validate application data specifically
     * @param {Object} appData - Application data
     * @returns {Object} Validation result
     */
    validateApplicationData(appData) {
        const requiredFields = [
            'app_name', 'app_type', 'current_version', 
            'released_date', 'publisher', 'registered_date'
        ];

        const result = this.validateForm(appData, requiredFields);

        // Additional business logic validation
        if (result.isValid) {
            // Check if release date is not after registration date
            const releaseDate = new Date(result.sanitizedData.released_date);
            const registrationDate = new Date(result.sanitizedData.registered_date);

            if (releaseDate > registrationDate) {
                result.isValid = false;
                result.errors.released_date = result.errors.released_date || [];
                result.errors.released_date.push('Release date cannot be after registration date');
            }
        }

        return result;
    }

    /**
     * Get validation summary for display
     * @param {Object} validationResult - Validation result
     * @returns {Object} Summary for display
     */
    getValidationSummary(validationResult) {
        const { isValid, errors } = validationResult;
        
        if (isValid) {
            return {
                isValid: true,
                message: 'All fields are valid',
                errorCount: 0
            };
        }

        const errorFields = Object.keys(errors);
        const totalErrors = errorFields.reduce((count, field) => {
            return count + (Array.isArray(errors[field]) ? errors[field].length : 1);
        }, 0);

        return {
            isValid: false,
            message: `${totalErrors} validation error${totalErrors > 1 ? 's' : ''} found`,
            errorCount: totalErrors,
            fields: errorFields
        };
    }

    /**
     * Format errors for display
     * @param {Object} errors - Validation errors
     * @returns {Array} Formatted error messages
     */
    formatErrorsForDisplay(errors) {
        const messages = [];
        
        Object.keys(errors).forEach(field => {
            const fieldErrors = Array.isArray(errors[field]) ? errors[field] : [errors[field]];
            const fieldName = this.getFieldDisplayName(field);
            
            fieldErrors.forEach(error => {
                messages.push(`${fieldName}: ${error}`);
            });
        });
        
        return messages;
    }

    /**
     * Get display name for field
     * @param {string} field - Field name
     * @returns {string} Display name
     */
    getFieldDisplayName(field) {
        const displayNames = {
            app_name: 'Application Name',
            app_type: 'Application Type',
            current_version: 'Version',
            released_date: 'Release Date',
            publisher: 'Publisher',
            description: 'Description',
            download_link: 'Download Link',
            registered_date: 'Registration Date',
            track_interval: 'Tracking Interval'
        };
        
        return displayNames[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationService;
}
