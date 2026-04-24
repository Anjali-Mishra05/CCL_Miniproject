// Admin Authentication Service

class AdminAuthService {
    constructor() {
        this.currentAdmin = null;
        this.authToken = localStorage.getItem('adminAuthToken');
        this.role = localStorage.getItem('adminRole') || 'admin';
    }

    // Validate password strength
    validatePasswordStrength(password) {
        const strength = {
            score: 0,
            feedback: []
        };

        if (password.length >= 10) strength.score++;
        else strength.feedback.push('At least 10 characters');

        if (/[A-Z]/.test(password)) strength.score++;
        else strength.feedback.push('One uppercase letter');

        if (/[a-z]/.test(password)) strength.score++;
        else strength.feedback.push('One lowercase letter');

        if (/[0-9]/.test(password)) strength.score++;
        else strength.feedback.push('One number');

        if (/[!@#$%^&*]/.test(password)) strength.score++;
        else strength.feedback.push('One special character');

        return strength;
    }

    // Sign In
    async signIn(email, password, rememberMe = false) {
        try {
            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            const response = await fetch('/api/admin/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Admin login failed');
            }

            // Store tokens
            localStorage.setItem('adminAuthToken', data.tokens.accessToken);
            localStorage.setItem('adminRole', data.admin.role);

            if (rememberMe) {
                localStorage.setItem('adminIdToken', data.tokens.idToken);
            }

            this.authToken = data.tokens.accessToken;
            this.currentAdmin = data.admin;

            return data;
        } catch (error) {
            console.error('Admin sign in error:', error);
            throw error;
        }
    }

    // Request Admin Access
    async requestAccess(formData) {
        try {
            if (!formData.name || formData.name.trim().length < 2) {
                throw new Error('Name must be at least 2 characters');
            }

            if (formData.password !== formData.confirm) {
                throw new Error('Passwords do not match');
            }

            const passwordStrength = this.validatePasswordStrength(formData.password);
            if (passwordStrength.score < 4) {
                throw new Error('Password is too weak. ' + passwordStrength.feedback.join(', '));
            }

            const response = await fetch('/api/admin/request-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Access request failed');
            }

            return data;
        } catch (error) {
            console.error('Access request error:', error);
            throw error;
        }
    }

    // Check if admin is authenticated
    isAuthenticated() {
        const token = this.authToken || localStorage.getItem('adminAuthToken');
        if (!token) return false;

        try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            return decoded.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    }

    // Logout
    logout() {
        localStorage.removeItem('adminAuthToken');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('adminIdToken');
        this.currentAdmin = null;
        this.authToken = null;
    }

    // Get auth token
    getAuthToken() {
        return this.authToken || localStorage.getItem('adminAuthToken');
    }

    // Get current admin
    getCurrentAdmin() {
        return this.currentAdmin;
    }
}

// Create instance
const adminAuthService = new AdminAuthService();

// ==================== UI EVENT HANDLERS ====================

// Switch forms
document.getElementById('switch-to-admin-signup')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('admin-login-section').classList.remove('active');
    document.getElementById('admin-signup-section').classList.add('active');
});

document.getElementById('switch-to-admin-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('admin-signup-section').classList.remove('active');
    document.getElementById('admin-login-section').classList.add('active');
});

// Admin Login Form
document.getElementById('admin-login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('admin-login-email').value;
    const password = document.getElementById('admin-login-password').value;
    const rememberMe = document.getElementById('admin-remember-me').checked;

    showAdminAuthLoader();

    try {
        await adminAuthService.signIn(email, password, rememberMe);
        showAdminAuthMessage('Login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'index.html?page=dashboard';
        }, 1500);
    } catch (error) {
        showAdminAuthMessage(error.message || 'Login failed. Please try again.', 'error');
    } finally {
        hideAdminAuthLoader();
    }
});

// Admin Signup Form
document.getElementById('admin-signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        name: document.getElementById('admin-signup-name').value,
        email: document.getElementById('admin-signup-email').value,
        phone: document.getElementById('admin-signup-phone').value,
        password: document.getElementById('admin-signup-password').value,
        confirm: document.getElementById('admin-signup-confirm').value
    };

    const agreeTerms = document.getElementById('admin-agree-terms').checked;

    if (!agreeTerms) {
        showAdminAuthMessage('You must agree to the admin terms', 'error');
        return;
    }

    showAdminAuthLoader();

    try {
        await adminAuthService.requestAccess(formData);
        showAdminAuthMessage('Access request submitted! Please check your email.', 'success');
        setTimeout(() => {
            document.getElementById('admin-signup-section').classList.remove('active');
            document.getElementById('admin-login-section').classList.add('active');
            document.getElementById('admin-signup-form').reset();
        }, 2000);
    } catch (error) {
        showAdminAuthMessage(error.message || 'Request failed. Please try again.', 'error');
    } finally {
        hideAdminAuthLoader();
    }
});

// ==================== UI HELPER FUNCTIONS ====================

function showAdminAuthLoader() {
    const loader = document.getElementById('admin-auth-loader');
    if (loader) loader.style.display = 'flex';
}

function hideAdminAuthLoader() {
    const loader = document.getElementById('admin-auth-loader');
    if (loader) loader.style.display = 'none';
}

function showAdminAuthMessage(message, type = 'info') {
    const messageEl = document.getElementById('admin-auth-message');
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.className = `auth-message show ${type}`;

    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 4000);
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
}

function checkPasswordStrength(password) {
    const strengthBar = document.getElementById('admin-strength-bar');
    if (!strengthBar) return;

    const strength = adminAuthService.validatePasswordStrength(password);
    const percentage = (strength.score / 5) * 100;

    strengthBar.style.width = percentage + '%';

    if (strength.score < 2) {
        strengthBar.style.backgroundColor = '#E74C3C';
    } else if (strength.score < 4) {
        strengthBar.style.backgroundColor = '#F39C12';
    } else {
        strengthBar.style.backgroundColor = '#2ECC71';
    }
}

// ==================== INITIALIZE ====================

if (adminAuthService.isAuthenticated()) {
    document.getElementById('admin-auth-page').style.display = 'none';
    document.getElementById('admin-dashboard-page').style.display = 'block';
} else {
    document.getElementById('admin-auth-page').style.display = 'block';
    document.getElementById('admin-dashboard-page').style.display = 'none';
}

// Logout handler
document.getElementById('nav-admin-logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Are you sure you want to logout?')) {
        adminAuthService.logout();
        window.location.href = 'index.html';
    }
});

console.log('Admin Auth service loaded successfully');
