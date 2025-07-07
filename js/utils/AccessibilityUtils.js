/**
 * AccessibilityUtils - Accessibility utilities and helpers
 * 
 * Provides accessibility-related utility functions including:
 * - ARIA management
 * - Keyboard navigation
 * - Screen reader support
 * - Focus management
 * - Color contrast checking
 * 
 * @author Dashboard Team
 * @version 1.0.0
 */

class AccessibilityUtils {
    constructor() {
        this.focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]'
        ].join(', ');
        
        this.setupGlobalKeyboardHandlers();
    }

    /**
     * Setup global keyboard handlers
     */
    setupGlobalKeyboardHandlers() {
        document.addEventListener('keydown', (e) => {
            // Handle Escape key globally
            if (e.key === 'Escape') {
                this.handleEscapeKey(e);
            }
            
            // Handle Tab key for focus management
            if (e.key === 'Tab') {
                this.handleTabKey(e);
            }
        });
    }

    /**
     * Handle Escape key press
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleEscapeKey(event) {
        // Close active modal
        const activeModal = document.querySelector('.modal-overlay.active, .modal.show');
        if (activeModal) {
            this.closeModal(activeModal);
            event.preventDefault();
            return;
        }
        
        // Close active dropdown
        const activeDropdown = document.querySelector('.dropdown.show');
        if (activeDropdown) {
            this.closeDropdown(activeDropdown);
            event.preventDefault();
            return;
        }
        
        // Clear active search
        const activeSearch = document.querySelector('input[type="search"]:focus');
        if (activeSearch && activeSearch.value) {
            activeSearch.value = '';
            activeSearch.dispatchEvent(new Event('input'));
            event.preventDefault();
        }
    }

    /**
     * Handle Tab key for focus trapping
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleTabKey(event) {
        const activeModal = document.querySelector('.modal-overlay.active, .modal.show');
        if (activeModal) {
            this.trapFocus(event, activeModal);
        }
    }

    /**
     * Trap focus within a container
     * @param {KeyboardEvent} event - Keyboard event
     * @param {Element} container - Container element
     */
    trapFocus(event, container) {
        const focusableElements = container.querySelectorAll(this.focusableSelectors);
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstFocusable) {
                lastFocusable.focus();
                event.preventDefault();
            }
        } else {
            // Tab
            if (document.activeElement === lastFocusable) {
                firstFocusable.focus();
                event.preventDefault();
            }
        }
    }

    /**
     * Set focus to element with proper handling
     * @param {Element|string} element - Element or selector
     * @param {Object} options - Focus options
     */
    setFocus(element, options = {}) {
        const {
            preventScroll = false,
            restoreFocus = true,
            announceToScreenReader = false,
            announcement = ''
        } = options;
        
        const targetElement = typeof element === 'string' 
            ? document.querySelector(element) 
            : element;
            
        if (!targetElement) {
            console.warn('Focus target not found:', element);
            return;
        }
        
        // Store previous focus for restoration
        if (restoreFocus) {
            targetElement.dataset.previousFocus = document.activeElement?.id || '';
        }
        
        // Set focus
        targetElement.focus({ preventScroll });
        
        // Announce to screen reader if requested
        if (announceToScreenReader && announcement) {
            this.announceToScreenReader(announcement);
        }
    }

    /**
     * Restore focus to previously focused element
     * @param {Element} container - Container that had focus trapped
     */
    restoreFocus(container) {
        const previousFocusId = container.dataset.previousFocus;
        if (previousFocusId) {
            const previousElement = document.getElementById(previousFocusId);
            if (previousElement) {
                previousElement.focus();
            }
        }
    }

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     * @param {string} priority - Priority level (polite, assertive)
     */
    announceToScreenReader(message, priority = 'polite') {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            if (announcement.parentNode) {
                document.body.removeChild(announcement);
            }
        }, 1000);
    }

    /**
     * Add ARIA attributes to element
     * @param {Element} element - Target element
     * @param {Object} attributes - ARIA attributes to add
     */
    addAriaAttributes(element, attributes) {
        Object.keys(attributes).forEach(key => {
            const ariaKey = key.startsWith('aria-') ? key : `aria-${key}`;
            element.setAttribute(ariaKey, attributes[key]);
        });
    }

    /**
     * Create accessible button
     * @param {Object} config - Button configuration
     * @returns {Element} Button element
     */
    createAccessibleButton(config) {
        const {
            text,
            ariaLabel,
            onClick,
            className = '',
            disabled = false,
            type = 'button'
        } = config;
        
        const button = document.createElement('button');
        button.type = type;
        button.className = className;
        button.textContent = text;
        button.disabled = disabled;
        
        if (ariaLabel) {
            button.setAttribute('aria-label', ariaLabel);
        }
        
        if (onClick) {
            button.addEventListener('click', onClick);
        }
        
        return button;
    }

    /**
     * Create accessible modal
     * @param {Object} config - Modal configuration
     * @returns {Element} Modal element
     */
    createAccessibleModal(config) {
        const {
            id,
            title,
            content,
            closeButtonText = 'Close',
            className = ''
        } = config;
        
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = `modal-overlay ${className}`;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', `${id}-title`);
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="${id}-title" class="modal-title">${title}</h2>
                    <button type="button" class="modal-close" aria-label="${closeButtonText}">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        // Add event listeners
        const closeButton = modal.querySelector('.modal-close');
        closeButton.addEventListener('click', () => this.closeModal(modal));
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
        
        return modal;
    }

    /**
     * Open modal with accessibility features
     * @param {Element} modal - Modal element
     */
    openModal(modal) {
        // Store current focus
        modal.dataset.previousFocus = document.activeElement?.id || '';
        
        // Show modal
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        
        // Set focus to first focusable element
        const firstFocusable = modal.querySelector(this.focusableSelectors);
        if (firstFocusable) {
            firstFocusable.focus();
        }
        
        // Announce to screen reader
        const title = modal.querySelector('.modal-title')?.textContent;
        if (title) {
            this.announceToScreenReader(`Dialog opened: ${title}`, 'assertive');
        }
    }

    /**
     * Close modal with accessibility features
     * @param {Element} modal - Modal element
     */
    closeModal(modal) {
        // Hide modal
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        
        // Restore focus
        this.restoreFocus(modal);
        
        // Announce to screen reader
        this.announceToScreenReader('Dialog closed', 'polite');
    }

    /**
     * Close dropdown with accessibility features
     * @param {Element} dropdown - Dropdown element
     */
    closeDropdown(dropdown) {
        dropdown.classList.remove('show');
        
        // Restore focus to trigger
        const trigger = dropdown.querySelector('[aria-expanded="true"]');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
            trigger.focus();
        }
    }

    /**
     * Create accessible table
     * @param {Object} config - Table configuration
     * @returns {Element} Table element
     */
    createAccessibleTable(config) {
        const {
            caption,
            headers,
            data,
            sortable = false,
            className = ''
        } = config;
        
        const table = document.createElement('table');
        table.className = className;
        table.setAttribute('role', 'table');
        
        if (caption) {
            const captionEl = document.createElement('caption');
            captionEl.textContent = caption;
            table.appendChild(captionEl);
        }
        
        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.setAttribute('role', 'row');
        
        headers.forEach((header, index) => {
            const th = document.createElement('th');
            th.setAttribute('role', 'columnheader');
            th.textContent = header.text || header;
            
            if (sortable) {
                th.setAttribute('tabindex', '0');
                th.setAttribute('aria-sort', 'none');
                th.className = 'sortable';
                
                // Add sort functionality
                th.addEventListener('click', () => this.handleTableSort(th, index));
                th.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.handleTableSort(th, index);
                    }
                });
            }
            
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        tbody.setAttribute('role', 'rowgroup');
        
        data.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            tr.setAttribute('role', 'row');
            
            row.forEach((cell, cellIndex) => {
                const td = document.createElement('td');
                td.setAttribute('role', 'cell');
                td.textContent = cell;
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        return table;
    }

    /**
     * Handle table sorting with accessibility
     * @param {Element} header - Header element
     * @param {number} columnIndex - Column index
     */
    handleTableSort(header, columnIndex) {
        const currentSort = header.getAttribute('aria-sort');
        let newSort = 'ascending';
        
        if (currentSort === 'ascending') {
            newSort = 'descending';
        } else if (currentSort === 'descending') {
            newSort = 'none';
        }
        
        // Reset all headers
        header.parentNode.querySelectorAll('th').forEach(th => {
            th.setAttribute('aria-sort', 'none');
        });
        
        // Set new sort
        header.setAttribute('aria-sort', newSort);
        
        // Announce sort change
        const columnName = header.textContent;
        const sortDirection = newSort === 'none' ? 'unsorted' : newSort;
        this.announceToScreenReader(`Table sorted by ${columnName}, ${sortDirection}`, 'polite');
    }

    /**
     * Check color contrast ratio
     * @param {string} foreground - Foreground color (hex)
     * @param {string} background - Background color (hex)
     * @returns {Object} Contrast information
     */
    checkColorContrast(foreground, background) {
        const getLuminance = (color) => {
            const rgb = parseInt(color.slice(1), 16);
            const r = (rgb >> 16) & 0xff;
            const g = (rgb >> 8) & 0xff;
            const b = (rgb >> 0) & 0xff;
            
            const [rs, gs, bs] = [r, g, b].map(c => {
                c = c / 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            
            return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };
        
        const l1 = getLuminance(foreground);
        const l2 = getLuminance(background);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        
        return {
            ratio: Math.round(ratio * 100) / 100,
            passAA: ratio >= 4.5,
            passAAA: ratio >= 7,
            passAALarge: ratio >= 3,
            passAAALarge: ratio >= 4.5
        };
    }

    /**
     * Add skip links for keyboard navigation
     * @param {Array} links - Array of skip link configurations
     */
    addSkipLinks(links = []) {
        const defaultLinks = [
            { href: '#main-content', text: 'Skip to main content' },
            { href: '#sidebar-nav', text: 'Skip to navigation' },
            { href: '#footer', text: 'Skip to footer' }
        ];
        
        const skipLinks = links.length > 0 ? links : defaultLinks;
        
        const skipContainer = document.createElement('div');
        skipContainer.className = 'skip-links';
        skipContainer.innerHTML = skipLinks
            .map(link => `<a href="${link.href}" class="skip-link">${link.text}</a>`)
            .join('');
        
        document.body.insertBefore(skipContainer, document.body.firstChild);
    }

    /**
     * Validate accessibility of element
     * @param {Element} element - Element to validate
     * @returns {Object} Validation results
     */
    validateAccessibility(element) {
        const issues = [];
        const warnings = [];
        
        // Check for missing alt text on images
        element.querySelectorAll('img').forEach(img => {
            if (!img.hasAttribute('alt')) {
                issues.push({
                    element: img,
                    issue: 'Missing alt attribute',
                    severity: 'error'
                });
            }
        });
        
        // Check for missing labels on form controls
        element.querySelectorAll('input, select, textarea').forEach(control => {
            const hasLabel = control.labels && control.labels.length > 0;
            const hasAriaLabel = control.hasAttribute('aria-label');
            const hasAriaLabelledby = control.hasAttribute('aria-labelledby');
            
            if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby) {
                issues.push({
                    element: control,
                    issue: 'Form control missing accessible label',
                    severity: 'error'
                });
            }
        });
        
        // Check for missing headings structure
        const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let previousLevel = 0;
        
        headings.forEach(heading => {
            const level = parseInt(heading.tagName.charAt(1));
            if (level > previousLevel + 1) {
                warnings.push({
                    element: heading,
                    issue: `Heading level skipped (h${previousLevel} to h${level})`,
                    severity: 'warning'
                });
            }
            previousLevel = level;
        });
        
        return {
            passed: issues.length === 0,
            issues,
            warnings
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityUtils;
}
