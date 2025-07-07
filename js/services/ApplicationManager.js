/**
 * ApplicationManager - Handles application CRUD operations
 * 
 * Responsibilities:
 * - Manage application data operations
 * - Handle form validation and submission
 * - Manage application table display
 * - Handle search, sort, and pagination
 * 
 * @author Dashboard Team
 * @version 1.0.0
 */

class ApplicationManager {
    constructor(dataService, validationService, stateManager, errorHandler) {
        this.dataService = dataService;
        this.validationService = validationService;
        this.stateManager = stateManager;
        this.errorHandler = errorHandler;
        
        this.setupEventListeners();
        this.setupStateSubscriptions();
        
        console.log('📱 ApplicationManager initialized');
    }

    /**
     * Initialize application management
     * @param {Array} defaultApplications - Default applications from data
     */
    async initialize(defaultApplications = []) {
        try {
            console.log('📱 Initializing application management...');
            
            // Load applications from storage or use defaults
            const applications = this.dataService.initializeApplicationsData(defaultApplications);
            
            // Update state
            this.stateManager.setState({
                applications: applications,
                currentEditingApp: null,
                searchTerm: '',
                currentPageNumber: 1
            });
            
            // Populate table
            this.populateApplicationsTable();
            
            // Set today's date as default for registration
            this.setDefaultRegistrationDate();
            
            console.log(`✅ Application management initialized with ${applications.length} applications`);
            
        } catch (error) {
            this.errorHandler.handle(error, 'Application Manager Initialization');
            throw error;
        }
    }

    /**
     * Setup event listeners for form and table interactions
     */
    setupEventListeners() {
        // Use event delegation for better performance and dynamic content
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'app-form') {
                e.preventDefault();
                this.handleFormSubmission();
            }
        });

        document.addEventListener('click', (e) => {
            // Form buttons
            if (e.target.id === 'reset-form') {
                this.resetForm();
            } else if (e.target.id === 'clear-form') {
                this.clearForm();
            } else if (e.target.id === 'refresh-table') {
                this.refreshTable();
            } else if (e.target.id === 'export-data') {
                this.exportApplicationData();
            }
            
            // Table actions
            else if (e.target.closest('[data-action="view-app"]')) {
                const appId = parseInt(e.target.closest('[data-action="view-app"]').dataset.appId);
                this.viewApplication(appId);
            } else if (e.target.closest('[data-action="edit-app"]')) {
                const appId = parseInt(e.target.closest('[data-action="edit-app"]').dataset.appId);
                this.editApplication(appId);
            } else if (e.target.closest('[data-action="delete-app"]')) {
                const appId = parseInt(e.target.closest('[data-action="delete-app"]').dataset.appId);
                this.confirmDeleteApplication(appId);
            }
            
            // Sorting
            else if (e.target.closest('.sortable')) {
                const field = e.target.closest('.sortable').dataset.sort;
                this.handleSort(field);
            }
            
            // Pagination
            else if (e.target.closest('[data-action="change-page"]')) {
                const page = parseInt(e.target.closest('[data-action="change-page"]').dataset.page);
                this.changePage(page);
            }
        });

        document.addEventListener('input', (e) => {
            // Search functionality
            if (e.target.id === 'app-search') {
                this.handleSearch(e.target.value);
            }
            
            // Form toggles
            else if (e.target.id === 'enable_tracking') {
                this.toggleTrackingOptions(e.target.checked);
            } else if (e.target.id === 'track_cpu_memory') {
                this.toggleCpuMemoryOptions(e.target.checked);
            }
        });
    }

    /**
     * Setup state subscriptions
     */
    setupStateSubscriptions() {
        // Subscribe to applications changes
        this.stateManager.subscribe('applications', () => {
            this.populateApplicationsTable();
        });

        // Subscribe to search/sort/pagination changes
        this.stateManager.subscribe(['searchTerm', 'sortField', 'sortDirection', 'currentPageNumber'], () => {
            this.populateApplicationsTable();
        });
    }

    /**
     * Handle form submission
     */
    async handleFormSubmission() {
        try {
            const formData = this.getFormData();
            
            // Validate form data
            const validationResult = this.validationService.validateApplicationData(formData);
            
            if (!validationResult.isValid) {
                this.showValidationErrors(validationResult.errors);
                return;
            }

            const sanitizedData = validationResult.sanitizedData;
            const currentEditingApp = this.stateManager.getState('currentEditingApp');

            if (currentEditingApp) {
                await this.updateApplication(sanitizedData);
                this.showMessage('Application updated successfully!', 'success');
            } else {
                await this.addApplication(sanitizedData);
                this.showMessage('Application added successfully!', 'success');
            }

            this.clearForm();
            
        } catch (error) {
            this.errorHandler.handle(error, 'Form Submission');
            this.showMessage('Failed to save application. Please try again.', 'error');
        }
    }

    /**
     * Get form data
     * @returns {Object} Form data
     */
    getFormData() {
        const form = document.getElementById('app-form');
        if (!form) {
            throw new Error('Application form not found');
        }

        const formData = new FormData(form);
        const currentEditingApp = this.stateManager.getState('currentEditingApp');
        
        return {
            id: currentEditingApp ? currentEditingApp.id : Date.now(),
            app_name: formData.get('app_name') || '',
            app_type: formData.get('app_type') || '',
            current_version: formData.get('current_version') || '',
            released_date: formData.get('released_date') || '',
            publisher: formData.get('publisher') || '',
            description: formData.get('description') || '',
            download_link: formData.get('download_link') || '',
            enable_tracking: formData.get('enable_tracking') === 'on',
            track: {
                usage: formData.get('track_usage') === 'on',
                location: formData.get('track_location') === 'on',
                cpu_memory: {
                    track_cm: formData.get('track_cpu_memory') === 'on',
                    track_intr: parseInt(formData.get('track_interval')) || 1
                }
            },
            registered_date: formData.get('registered_date') || new Date().toISOString().split('T')[0]
        };
    }

    /**
     * Add new application
     * @param {Object} appData - Application data
     */
    async addApplication(appData) {
        try {
            const applications = [...this.stateManager.getState('applications')];
            applications.push(appData);
            
            // Save to storage
            this.dataService.saveApplicationsToStorage(applications);
            
            // Update state
            this.stateManager.setState({ applications });
            
            console.log('📱 Application added:', appData.app_name);
            
        } catch (error) {
            throw new Error(`Failed to add application: ${error.message}`);
        }
    }

    /**
     * Update existing application
     * @param {Object} appData - Application data
     */
    async updateApplication(appData) {
        try {
            const applications = [...this.stateManager.getState('applications')];
            const currentEditingApp = this.stateManager.getState('currentEditingApp');
            
            const index = applications.findIndex(app => app.id === currentEditingApp.id);
            if (index === -1) {
                throw new Error('Application not found for update');
            }
            
            applications[index] = appData;
            
            // Save to storage
            this.dataService.saveApplicationsToStorage(applications);
            
            // Update state
            this.stateManager.setState({ 
                applications,
                currentEditingApp: null 
            });
            
            console.log('📱 Application updated:', appData.app_name);
            
        } catch (error) {
            throw new Error(`Failed to update application: ${error.message}`);
        }
    }

    /**
     * Delete application
     * @param {number} appId - Application ID
     */
    async deleteApplication(appId) {
        try {
            const applications = this.stateManager.getState('applications');
            const filteredApplications = applications.filter(app => app.id !== appId);
            
            // Save to storage
            this.dataService.saveApplicationsToStorage(filteredApplications);
            
            // Update state
            this.stateManager.setState({ applications: filteredApplications });
            
            this.showMessage('Application deleted successfully!', 'success');
            console.log('📱 Application deleted:', appId);
            
        } catch (error) {
            this.errorHandler.handle(error, 'Delete Application');
            this.showMessage('Failed to delete application.', 'error');
        }
    }

    /**
     * View application details
     * @param {number} appId - Application ID
     */
    viewApplication(appId) {
        const applications = this.stateManager.getState('applications');
        const app = applications.find(a => a.id === appId);
        
        if (!app) {
            this.showMessage('Application not found.', 'error');
            return;
        }

        this.showApplicationModal(app);
    }

    /**
     * Edit application
     * @param {number} appId - Application ID
     */
    editApplication(appId) {
        const applications = this.stateManager.getState('applications');
        const app = applications.find(a => a.id === appId);
        
        if (!app) {
            this.showMessage('Application not found.', 'error');
            return;
        }

        // Update state
        this.stateManager.setState({ currentEditingApp: app });

        // Populate form
        this.populateForm(app);

        // Update form title
        this.updateFormTitle('EDIT APPLICATION');

        // Scroll to form
        this.scrollToForm();
    }

    /**
     * Confirm delete application
     * @param {number} appId - Application ID
     */
    confirmDeleteApplication(appId) {
        const applications = this.stateManager.getState('applications');
        const app = applications.find(a => a.id === appId);
        
        if (!app) {
            this.showMessage('Application not found.', 'error');
            return;
        }

        // Show delete confirmation modal
        this.showDeleteConfirmationModal(app);
    }

    /**
     * Handle search input
     * @param {string} searchTerm - Search term
     */
    handleSearch(searchTerm) {
        this.stateManager.setState({
            searchTerm: searchTerm.toLowerCase(),
            currentPageNumber: 1 // Reset to first page
        });
    }

    /**
     * Handle table sorting
     * @param {string} field - Field to sort by
     */
    handleSort(field) {
        const currentSortField = this.stateManager.getState('sortField');
        const currentSortDirection = this.stateManager.getState('sortDirection');
        
        let newDirection = 'asc';
        if (currentSortField === field && currentSortDirection === 'asc') {
            newDirection = 'desc';
        }

        this.stateManager.setState({
            sortField: field,
            sortDirection: newDirection
        });

        // Update sort indicators in UI
        this.updateSortIndicators(field, newDirection);
    }

    /**
     * Change page
     * @param {number} page - Page number
     */
    changePage(page) {
        const applications = this.getFilteredAndSortedApplications();
        const itemsPerPage = this.stateManager.getState('itemsPerPage');
        const totalPages = Math.ceil(applications.length / itemsPerPage);
        
        if (page >= 1 && page <= totalPages) {
            this.stateManager.setState({ currentPageNumber: page });
        }
    }

    /**
     * Get filtered and sorted applications
     * @returns {Array} Filtered and sorted applications
     */
    getFilteredAndSortedApplications() {
        const applications = this.stateManager.getState('applications');
        const searchTerm = this.stateManager.getState('searchTerm');
        const sortField = this.stateManager.getState('sortField');
        const sortDirection = this.stateManager.getState('sortDirection');

        // Filter applications
        let filteredApps = applications.filter(app => {
            if (!searchTerm) return true;
            return (
                app.app_name.toLowerCase().includes(searchTerm) ||
                app.publisher.toLowerCase().includes(searchTerm) ||
                app.current_version.toLowerCase().includes(searchTerm) ||
                app.app_type.toLowerCase().includes(searchTerm)
            );
        });

        // Sort applications
        filteredApps.sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return filteredApps;
    }

    /**
     * Populate applications table
     */
    populateApplicationsTable() {
        try {
            const tbody = document.getElementById('applications-tbody');
            const emptyState = document.getElementById('empty-state');
            
            if (!tbody) {
                console.warn('Applications table body not found');
                return;
            }

            const filteredApps = this.getFilteredAndSortedApplications();
            
            // Show empty state if no applications
            if (filteredApps.length === 0) {
                tbody.innerHTML = '';
                if (emptyState) emptyState.style.display = 'block';
                return;
            }

            if (emptyState) emptyState.style.display = 'none';

            // Pagination
            const currentPage = this.stateManager.getState('currentPageNumber');
            const itemsPerPage = this.stateManager.getState('itemsPerPage');
            const startIndex = (currentPage - 1) * itemsPerPage;
            const paginatedApps = filteredApps.slice(startIndex, startIndex + itemsPerPage);

            // Generate table rows
            tbody.innerHTML = this.generateTableRows(paginatedApps);

            // Update pagination
            this.updatePagination(filteredApps.length);
            
            console.log(`📱 Table populated with ${paginatedApps.length} applications`);
            
        } catch (error) {
            this.errorHandler.handle(error, 'Populate Applications Table');
        }
    }

    /**
     * Generate table rows HTML
     * @param {Array} applications - Applications to display
     * @returns {string} Table rows HTML
     */
    generateTableRows(applications) {
        return applications.map(app => `
            <tr>
                <td>
                    <div>
                        <strong>${this.escapeHtml(app.app_name)}</strong>
                        <br>
                        <small class="text-muted">${app.description ? this.escapeHtml(app.description.substring(0, 50)) + '...' : 'No description'}</small>
                    </div>
                </td>
                <td>${this.escapeHtml(app.current_version)}</td>
                <td>${this.escapeHtml(app.publisher)}</td>
                <td>
                    <span class="status-badge ${app.enable_tracking ? 'active' : 'inactive'}">
                        <span class="status-dot"></span>
                        ${app.enable_tracking ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn" data-action="view-app" data-app-id="${app.id}" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn" data-action="edit-app" data-app-id="${app.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn danger" data-action="delete-app" data-app-id="${app.id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Update pagination display
     * @param {number} totalItems - Total number of items
     */
    updatePagination(totalItems) {
        const itemsPerPage = this.stateManager.getState('itemsPerPage');
        const currentPage = this.stateManager.getState('currentPageNumber');
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        const paginationContainer = document.getElementById('pagination-container');

        if (totalPages <= 1) {
            if (paginationContainer) paginationContainer.style.display = 'none';
            return;
        }

        if (paginationContainer) paginationContainer.style.display = 'block';

        // Update pagination info
        this.updatePaginationInfo(currentPage, itemsPerPage, totalItems);

        // Generate pagination buttons
        this.generatePaginationButtons(currentPage, totalPages);
    }

    /**
     * Update pagination info display
     * @param {number} currentPage - Current page
     * @param {number} itemsPerPage - Items per page
     * @param {number} totalItems - Total items
     */
    updatePaginationInfo(currentPage, itemsPerPage, totalItems) {
        const showingStart = document.getElementById('showing-start');
        const showingEnd = document.getElementById('showing-end');
        const totalRecords = document.getElementById('total-records');

        if (showingStart) showingStart.textContent = (currentPage - 1) * itemsPerPage + 1;
        if (showingEnd) showingEnd.textContent = Math.min(currentPage * itemsPerPage, totalItems);
        if (totalRecords) totalRecords.textContent = totalItems;
    }

    /**
     * Generate pagination buttons
     * @param {number} currentPage - Current page
     * @param {number} totalPages - Total pages
     */
    generatePaginationButtons(currentPage, totalPages) {
        const paginationList = document.getElementById('pagination-list');
        if (!paginationList) return;

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-action="change-page" data-page="${currentPage - 1}">Previous</a>
            </li>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                paginationHTML += `
                    <li class="page-item ${i === currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-action="change-page" data-page="${i}">${i}</a>
                    </li>
                `;
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-action="change-page" data-page="${currentPage + 1}">Next</a>
            </li>
        `;

        paginationList.innerHTML = paginationHTML;
    }

    /**
     * Show validation errors
     * @param {Object} errors - Validation errors
     */
    showValidationErrors(errors) {
        const errorMessages = this.validationService.formatErrorsForDisplay(errors);
        const errorText = errorMessages.join('\n');
        this.showMessage(errorText, 'error');

        // Highlight invalid fields
        this.highlightInvalidFields(errors);
    }

    /**
     * Highlight invalid form fields
     * @param {Object} errors - Validation errors
     */
    highlightInvalidFields(errors) {
        // Clear previous highlights
        document.querySelectorAll('.form-control.is-invalid').forEach(field => {
            field.classList.remove('is-invalid');
        });

        // Add highlights to invalid fields
        Object.keys(errors).forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (field) {
                field.classList.add('is-invalid');
            }
        });
    }

    /**
     * Populate form with application data
     * @param {Object} app - Application data
     */
    populateForm(app) {
        const fields = [
            'app_name', 'app_type', 'current_version', 'released_date',
            'publisher', 'description', 'download_link', 'registered_date'
        ];

        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && app[field] !== undefined) {
                element.value = app[field];
            }
        });

        // Set tracking options
        const enableTrackingEl = document.getElementById('enable_tracking');
        if (enableTrackingEl) {
            enableTrackingEl.checked = app.enable_tracking;
            this.toggleTrackingOptions(app.enable_tracking);
        }

        if (app.enable_tracking && app.track) {
            const trackUsageEl = document.getElementById('track_usage');
            const trackLocationEl = document.getElementById('track_location');
            const trackCpuMemoryEl = document.getElementById('track_cpu_memory');
            const trackIntervalEl = document.getElementById('track_interval');

            if (trackUsageEl) trackUsageEl.checked = app.track.usage;
            if (trackLocationEl) trackLocationEl.checked = app.track.location;
            if (trackCpuMemoryEl) {
                trackCpuMemoryEl.checked = app.track.cpu_memory.track_cm;
                this.toggleCpuMemoryOptions(app.track.cpu_memory.track_cm);
            }
            if (trackIntervalEl) trackIntervalEl.value = app.track.cpu_memory.track_intr;
        }
    }

    /**
     * Reset form to initial state
     */
    resetForm() {
        const form = document.getElementById('app-form');
        if (form) {
            form.reset();

            // Clear validation highlights
            document.querySelectorAll('.form-control.is-invalid').forEach(field => {
                field.classList.remove('is-invalid');
            });

            // Reset state
            this.stateManager.setState({ currentEditingApp: null });

            // Reset form title
            this.updateFormTitle('ADD NEW APPLICATION');

            // Set default date
            this.setDefaultRegistrationDate();

            // Reset tracking options
            this.toggleTrackingOptions(false);
            this.toggleCpuMemoryOptions(false);
        }
    }

    /**
     * Clear form and show success message
     */
    clearForm() {
        this.resetForm();
        this.showMessage('Form cleared successfully', 'success');
    }

    /**
     * Refresh table data
     */
    refreshTable() {
        this.populateApplicationsTable();
        this.showMessage('Table refreshed successfully', 'success');
    }

    /**
     * Export application data
     */
    async exportApplicationData() {
        try {
            const applications = this.stateManager.getState('applications');
            const exportData = this.dataService.exportApplicationsData(applications);

            const blob = new Blob([exportData], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `applications_export_${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            this.showMessage('Application data exported successfully!', 'success');

        } catch (error) {
            this.errorHandler.handle(error, 'Export Application Data');
            this.showMessage('Failed to export data. Please try again.', 'error');
        }
    }

    /**
     * Toggle tracking options visibility
     * @param {boolean} enabled - Whether tracking is enabled
     */
    toggleTrackingOptions(enabled) {
        const trackingOptions = document.getElementById('tracking-options');
        if (trackingOptions) {
            trackingOptions.style.display = enabled ? 'block' : 'none';
        }
    }

    /**
     * Toggle CPU/Memory options visibility
     * @param {boolean} enabled - Whether CPU/Memory tracking is enabled
     */
    toggleCpuMemoryOptions(enabled) {
        const cpuMemoryOptions = document.getElementById('cpu-memory-options');
        if (cpuMemoryOptions) {
            cpuMemoryOptions.style.display = enabled ? 'block' : 'none';
        }
    }

    /**
     * Set default registration date to today
     */
    setDefaultRegistrationDate() {
        const registeredDateInput = document.getElementById('registered_date');
        if (registeredDateInput) {
            registeredDateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    /**
     * Update form title
     * @param {string} title - Form title
     */
    updateFormTitle(title) {
        const panelTitle = document.querySelector('#app-form-panel-container .panel-title');
        if (panelTitle) {
            panelTitle.textContent = title;
        }
    }

    /**
     * Scroll to form
     */
    scrollToForm() {
        const formContainer = document.getElementById('app-form-panel-container');
        if (formContainer) {
            formContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * Update sort indicators in table headers
     * @param {string} field - Sort field
     * @param {string} direction - Sort direction
     */
    updateSortIndicators(field, direction) {
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
            if (header.dataset.sort === field) {
                header.classList.add(`sort-${direction}`);
            }
        });
    }

    /**
     * Show application details modal
     * @param {Object} app - Application data
     */
    showApplicationModal(app) {
        // This will be implemented when we create the ModalManager
        console.log('📱 Showing application modal for:', app.app_name);

        // For now, use the existing modal system
        if (window.dashboardManager && window.dashboardManager.showApplicationModal) {
            window.dashboardManager.showApplicationModal(app);
        }
    }

    /**
     * Show delete confirmation modal
     * @param {Object} app - Application data
     */
    showDeleteConfirmationModal(app) {
        // This will be implemented when we create the ModalManager
        console.log('📱 Showing delete confirmation for:', app.app_name);

        // For now, use the existing modal system
        if (window.dashboardManager && window.dashboardManager.confirmDeleteApplication) {
            window.dashboardManager.confirmDeleteApplication(app.id);
        }
    }

    /**
     * Show message to user
     * @param {string} message - Message text
     * @param {string} type - Message type
     */
    showMessage(message, type = 'success') {
        // Use existing message system if available
        if (window.dashboardManager && window.dashboardManager.showMessage) {
            window.dashboardManager.showMessage(message, type);
        } else {
            // Fallback to console
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApplicationManager;
}
