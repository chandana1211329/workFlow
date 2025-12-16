// Authentication utility functions
class AuthManager {
    constructor() {
        this.API_BASE_URL = '/api';
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token && (!!this.user.id || !!this.user._id);
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Get user role
    getUserRole() {
        return this.user.role;
    }

    // Check if user is admin
    isAdmin() {
        return this.user.role === 'admin';
    }

    // Check if user is intern
    isIntern() {
        return this.user.role === 'intern';
    }

    // Get auth headers for API requests
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`
        };
    }

    // Make authenticated API request
    async authenticatedRequest(url, options = {}) {
        const headers = {
            ...this.getAuthHeaders(),
            ...options.headers
        };

        // Don't set Content-Type for FormData - let browser set it automatically
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        } else {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(`${this.API_BASE_URL}${url}`, {
            ...options,
            headers
        });

        // Handle 401 Unauthorized (token expired)
        if (response.status === 401) {
            this.logout();
            return null;
        }

        return response;
    }

    // Logout user
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/';
    }

    // Redirect based on role
    redirectBasedOnRole() {
        if (!this.isAuthenticated()) {
            window.location.href = '/';
            return;
        }

        if (this.isAdmin()) {
            window.location.href = '/admin-dashboard.html';
        } else if (this.isIntern()) {
            window.location.href = '/user-dashboard.html';
        } else {
            this.logout();
        }
    }

    // Protect route - redirect if not authenticated or wrong role
    protectRoute(requiredRole = null) {
        if (!this.isAuthenticated()) {
            window.location.href = '/';
            return false;
        }

        if (requiredRole && this.getUserRole() !== requiredRole) {
            // If wrong role, redirect to appropriate dashboard
            this.redirectBasedOnRole();
            return false;
        }

        return true;
    }

    // Update user profile display
    updateUserProfile() {
        const userNameElements = document.querySelectorAll('.user-name');
        const userEmailElements = document.querySelectorAll('.user-email');
        const userRoleElements = document.querySelectorAll('.user-role');

        userNameElements.forEach(el => {
            el.textContent = this.user.fullName || `${this.user.firstName} ${this.user.lastName}`;
        });

        userEmailElements.forEach(el => {
            el.textContent = this.user.email;
        });

        userRoleElements.forEach(el => {
            el.textContent = this.user.role === 'admin' ? 'Administrator' : 'Intern';
        });
    }

    // Handle API errors
    handleApiError(response, data) {
        if (response.status === 401) {
            this.logout();
            return 'Session expired. Please login again.';
        } else if (response.status === 403) {
            return 'Access denied. You don\'t have permission to perform this action.';
        } else if (response.status === 404) {
            return 'Resource not found.';
        } else if (response.status >= 500) {
            return 'Server error. Please try again later.';
        }
        return data.error || 'An error occurred';
    }
}

// Global auth instance
const auth = new AuthManager();

// Make it available globally
window.auth = auth;
