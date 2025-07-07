/**
 * SecurityUtils - Security utilities and helpers
 * 
 * Provides security-related utility functions including:
 * - Input sanitization
 * - XSS prevention
 * - URL validation
 * - Content Security Policy helpers
 * - Data encryption/decryption
 * 
 * @author Dashboard Team
 * @version 1.0.0
 */

class SecurityUtils {
    /**
     * Sanitize HTML content to prevent XSS attacks
     * @param {string} html - HTML content to sanitize
     * @param {Object} options - Sanitization options
     * @returns {string} Sanitized HTML
     */
    static sanitizeHTML(html, options = {}) {
        if (typeof html !== 'string') {
            return '';
        }

        const {
            allowedTags = ['b', 'i', 'em', 'strong', 'span', 'div', 'p', 'br'],
            allowedAttributes = ['class', 'id'],
            removeScripts = true,
            removeEvents = true
        } = options;

        let sanitized = html;

        // Remove script tags
        if (removeScripts) {
            sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }

        // Remove event handlers
        if (removeEvents) {
            sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');
            sanitized = sanitized.replace(/on\w+='[^']*'/gi, '');
            sanitized = sanitized.replace(/javascript:/gi, '');
        }

        // Remove dangerous protocols
        sanitized = sanitized.replace(/data:/gi, '');
        sanitized = sanitized.replace(/vbscript:/gi, '');

        // Create a temporary element to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sanitized;

        // Recursively clean elements
        this.cleanElement(tempDiv, allowedTags, allowedAttributes);

        return tempDiv.innerHTML;
    }

    /**
     * Clean DOM element recursively
     * @param {Element} element - Element to clean
     * @param {Array} allowedTags - Allowed HTML tags
     * @param {Array} allowedAttributes - Allowed attributes
     */
    static cleanElement(element, allowedTags, allowedAttributes) {
        const children = Array.from(element.children);
        
        children.forEach(child => {
            // Remove disallowed tags
            if (!allowedTags.includes(child.tagName.toLowerCase())) {
                // Move children up and remove the element
                while (child.firstChild) {
                    element.insertBefore(child.firstChild, child);
                }
                element.removeChild(child);
                return;
            }

            // Clean attributes
            const attributes = Array.from(child.attributes);
            attributes.forEach(attr => {
                if (!allowedAttributes.includes(attr.name.toLowerCase())) {
                    child.removeAttribute(attr.name);
                }
            });

            // Recursively clean children
            this.cleanElement(child, allowedTags, allowedAttributes);
        });
    }

    /**
     * Escape HTML entities to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    static escapeHTML(text) {
        if (typeof text !== 'string') {
            return '';
        }

        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Unescape HTML entities
     * @param {string} html - HTML to unescape
     * @returns {string} Unescaped text
     */
    static unescapeHTML(html) {
        if (typeof html !== 'string') {
            return '';
        }

        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    /**
     * Validate URL to prevent malicious redirects
     * @param {string} url - URL to validate
     * @param {Object} options - Validation options
     * @returns {boolean} Is URL valid and safe
     */
    static validateURL(url, options = {}) {
        if (typeof url !== 'string') {
            return false;
        }

        const {
            allowedProtocols = ['http:', 'https:'],
            allowedDomains = null, // null means all domains allowed
            blockLocalhost = false,
            blockPrivateIPs = false
        } = options;

        try {
            const parsed = new URL(url);

            // Check protocol
            if (!allowedProtocols.includes(parsed.protocol)) {
                return false;
            }

            // Check domain whitelist
            if (allowedDomains && !allowedDomains.includes(parsed.hostname)) {
                return false;
            }

            // Block localhost if required
            if (blockLocalhost && (
                parsed.hostname === 'localhost' ||
                parsed.hostname === '127.0.0.1' ||
                parsed.hostname === '::1'
            )) {
                return false;
            }

            // Block private IP ranges if required
            if (blockPrivateIPs && this.isPrivateIP(parsed.hostname)) {
                return false;
            }

            return true;

        } catch (error) {
            return false;
        }
    }

    /**
     * Check if IP address is in private range
     * @param {string} ip - IP address to check
     * @returns {boolean} Is private IP
     */
    static isPrivateIP(ip) {
        const privateRanges = [
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
            /^192\.168\./,
            /^127\./,
            /^169\.254\./,
            /^::1$/,
            /^fc00:/,
            /^fe80:/
        ];

        return privateRanges.some(range => range.test(ip));
    }

    /**
     * Generate secure random string
     * @param {number} length - Length of random string
     * @param {string} charset - Character set to use
     * @returns {string} Random string
     */
    static generateRandomString(length = 32, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
        let result = '';
        
        if (window.crypto && window.crypto.getRandomValues) {
            // Use cryptographically secure random
            const array = new Uint8Array(length);
            window.crypto.getRandomValues(array);
            
            for (let i = 0; i < length; i++) {
                result += charset[array[i] % charset.length];
            }
        } else {
            // Fallback to Math.random (less secure)
            for (let i = 0; i < length; i++) {
                result += charset[Math.floor(Math.random() * charset.length)];
            }
        }
        
        return result;
    }

    /**
     * Generate CSRF token
     * @returns {string} CSRF token
     */
    static generateCSRFToken() {
        return this.generateRandomString(32);
    }

    /**
     * Validate CSRF token
     * @param {string} token - Token to validate
     * @param {string} expectedToken - Expected token
     * @returns {boolean} Is token valid
     */
    static validateCSRFToken(token, expectedToken) {
        if (!token || !expectedToken) {
            return false;
        }
        
        // Use constant-time comparison to prevent timing attacks
        return this.constantTimeCompare(token, expectedToken);
    }

    /**
     * Constant-time string comparison to prevent timing attacks
     * @param {string} a - First string
     * @param {string} b - Second string
     * @returns {boolean} Are strings equal
     */
    static constantTimeCompare(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        
        return result === 0;
    }

    /**
     * Hash password using Web Crypto API
     * @param {string} password - Password to hash
     * @param {string} salt - Salt for hashing
     * @returns {Promise<string>} Hashed password
     */
    static async hashPassword(password, salt = null) {
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error('Web Crypto API not available');
        }

        // Generate salt if not provided
        if (!salt) {
            const saltArray = new Uint8Array(16);
            window.crypto.getRandomValues(saltArray);
            salt = Array.from(saltArray, byte => byte.toString(16).padStart(2, '0')).join('');
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);
        
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
        
        return `${salt}:${hashHex}`;
    }

    /**
     * Verify password against hash
     * @param {string} password - Password to verify
     * @param {string} hash - Hash to verify against
     * @returns {Promise<boolean>} Is password valid
     */
    static async verifyPassword(password, hash) {
        try {
            const [salt, expectedHash] = hash.split(':');
            const actualHash = await this.hashPassword(password, salt);
            return this.constantTimeCompare(actualHash, hash);
        } catch (error) {
            return false;
        }
    }

    /**
     * Encrypt data using AES-GCM
     * @param {string} data - Data to encrypt
     * @param {string} password - Password for encryption
     * @returns {Promise<string>} Encrypted data
     */
    static async encryptData(data, password) {
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error('Web Crypto API not available');
        }

        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        
        // Generate key from password
        const passwordBuffer = encoder.encode(password);
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        
        // Generate salt and IV
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        // Derive key
        const key = await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );
        
        // Encrypt data
        const encryptedBuffer = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            dataBuffer
        );
        
        // Combine salt, IV, and encrypted data
        const result = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
        result.set(salt, 0);
        result.set(iv, salt.length);
        result.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);
        
        // Convert to base64
        return btoa(String.fromCharCode(...result));
    }

    /**
     * Decrypt data using AES-GCM
     * @param {string} encryptedData - Encrypted data (base64)
     * @param {string} password - Password for decryption
     * @returns {Promise<string>} Decrypted data
     */
    static async decryptData(encryptedData, password) {
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error('Web Crypto API not available');
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        
        // Convert from base64
        const encryptedBuffer = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
        
        // Extract salt, IV, and encrypted data
        const salt = encryptedBuffer.slice(0, 16);
        const iv = encryptedBuffer.slice(16, 28);
        const data = encryptedBuffer.slice(28);
        
        // Generate key from password
        const passwordBuffer = encoder.encode(password);
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        
        // Derive key
        const key = await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );
        
        // Decrypt data
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );
        
        return decoder.decode(decryptedBuffer);
    }

    /**
     * Check Content Security Policy compliance
     * @param {string} content - Content to check
     * @param {Object} cspRules - CSP rules to check against
     * @returns {Object} Compliance check result
     */
    static checkCSPCompliance(content, cspRules = {}) {
        const violations = [];
        const warnings = [];
        
        // Check for inline scripts
        if (cspRules.scriptSrc && !cspRules.scriptSrc.includes("'unsafe-inline'")) {
            const inlineScripts = content.match(/<script[^>]*>[\s\S]*?<\/script>/gi);
            if (inlineScripts) {
                violations.push({
                    type: 'script-src',
                    message: 'Inline scripts found but not allowed by CSP',
                    count: inlineScripts.length
                });
            }
        }
        
        // Check for inline styles
        if (cspRules.styleSrc && !cspRules.styleSrc.includes("'unsafe-inline'")) {
            const inlineStyles = content.match(/style\s*=\s*["'][^"']*["']/gi);
            if (inlineStyles) {
                violations.push({
                    type: 'style-src',
                    message: 'Inline styles found but not allowed by CSP',
                    count: inlineStyles.length
                });
            }
        }
        
        // Check for eval usage
        if (content.includes('eval(')) {
            violations.push({
                type: 'script-src',
                message: 'eval() usage found - potential security risk'
            });
        }
        
        return {
            compliant: violations.length === 0,
            violations,
            warnings
        };
    }

    /**
     * Rate limiting helper
     * @param {string} key - Rate limit key
     * @param {number} limit - Request limit
     * @param {number} window - Time window in milliseconds
     * @returns {boolean} Is request allowed
     */
    static rateLimit(key, limit = 10, window = 60000) {
        const now = Date.now();
        const storageKey = `rateLimit_${key}`;
        
        let requests = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        // Remove old requests outside the window
        requests = requests.filter(timestamp => now - timestamp < window);
        
        // Check if limit exceeded
        if (requests.length >= limit) {
            return false;
        }
        
        // Add current request
        requests.push(now);
        localStorage.setItem(storageKey, JSON.stringify(requests));
        
        return true;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityUtils;
}
