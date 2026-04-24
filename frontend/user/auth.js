// AWS Cognito Configuration using centralized CONFIG
const AWS_CONFIG = {
    region: CONFIG.COGNITO.REGION,
    userPoolId: CONFIG.COGNITO.USER_POOL_ID,
    clientId: CONFIG.COGNITO.CLIENT_ID
};

// ==================== AUTH UTILITY FUNCTIONS ====================

class AuthService {
    constructor() {
        this.currentUser = null;
        this.authToken = localStorage.getItem('authToken');
        this.refreshToken = localStorage.getItem('refreshToken');
    }

    // Validate password strength
    validatePasswordStrength(password) {
        const strength = {
            score: 0,
            feedback: []
        };

        if (password.length >= 8) strength.score++;
        else strength.feedback.push('At least 8 characters');

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

    // Validate email format
    validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Validate phone format
    validatePhone(phone) {
        const regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        return regex.test(phone.replace(/\s/g, ''));
    }

    // Sign Up
    async signUp(formData) {
        try {
            // Validate inputs
            if (!formData.name || formData.name.trim().length < 2) {
                throw new Error('Name must be at least 2 characters');
            }

            if (!this.validateEmail(formData.email)) {
                throw new Error('Invalid email address');
            }

            if (!this.validatePhone(formData.phone)) {
                throw new Error('Invalid phone number');
            }

            if (formData.password !== formData.confirm) {
                throw new Error('Passwords do not match');
            }

            const passwordStrength = this.validatePasswordStrength(formData.password);
            if (passwordStrength.score < 3) {
                throw new Error('Password is too weak. ' + passwordStrength.feedback.join(', '));
            }

            // AWS Cognito signup - call backend API
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    phone: formData.phone
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Sign up failed');
            }

            // Store tokens
            if (data.tokens) {
                this.storeTokens(data.tokens);
                this.currentUser = data.user;
            }

            return data;
        } catch (error) {
            console.error('Sign up error:', error);
            throw error;
        }
    }

    // Sign In
    async signIn(email, password, rememberMe = false) {
        try {
            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            // AWS Cognito signin - call backend API
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Sign in failed');
            }

            // Store tokens
            if (data.tokens) {
                this.storeTokens(data.tokens, rememberMe);
                this.currentUser = data.user;
            }

            return data;
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    }

    // Store authentication tokens
    storeTokens(tokens, rememberMe = false) {
        localStorage.setItem('authToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        
        if (rememberMe && tokens.idToken) {
            localStorage.setItem('idToken', tokens.idToken);
        }

        this.authToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
    }

    // Get current auth token
    getAuthToken() {
        return this.authToken || localStorage.getItem('authToken');
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = this.getAuthToken();
        if (!token) return false;

        // Check token expiry
        try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            return decoded.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    }

    // Logout
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('idToken');
        this.currentUser = null;
        this.authToken = null;
    }

    // Get current user info
    getCurrentUser() {
        return this.currentUser;
    }
}

// Create global auth service instance
const authService = new AuthService();

// ==================== UI EVENT HANDLERS ====================

// Switch between login and signup
document.getElementById('switch-to-signup')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-section').classList.remove('active');
    document.getElementById('signup-section').classList.add('active');
});

document.getElementById('switch-to-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signup-section').classList.remove('active');
    document.getElementById('login-section').classList.add('active');
});

// Handle Login Form
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    showAuthLoader();

    try {
        await authService.signIn(email, password, rememberMe);
        showAuthMessage('Login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'index.html?page=home';
        }, 1500);
    } catch (error) {
        showAuthMessage(error.message || 'Login failed. Please try again.', 'error');
    } finally {
        hideAuthLoader();
    }
});

// Handle Signup Form
document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        name: document.getElementById('signup-name').value,
        email: document.getElementById('signup-email').value,
        phone: document.getElementById('signup-phone').value,
        password: document.getElementById('signup-password').value,
        confirm: document.getElementById('signup-confirm').value
    };

    const agreeTerms = document.getElementById('agree-terms').checked;

    if (!agreeTerms) {
        showAuthMessage('You must agree to the terms and conditions', 'error');
        return;
    }

    showAuthLoader();

    try {
        await authService.signUp(formData);
        showAuthMessage('Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'index.html?page=home';
        }, 1500);
    } catch (error) {
        showAuthMessage(error.message || 'Sign up failed. Please try again.', 'error');
    } finally {
        hideAuthLoader();
    }
});

// ==================== UI HELPER FUNCTIONS ====================

function showAuthLoader() {
    const loader = document.getElementById('auth-loader');
    if (loader) loader.style.display = 'flex';
}

function hideAuthLoader() {
    const loader = document.getElementById('auth-loader');
    if (loader) loader.style.display = 'none';
}

function showAuthMessage(message, type = 'info') {
    const messageEl = document.getElementById('auth-message');
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
    const strengthBar = document.getElementById('strength-bar');
    if (!strengthBar) return;

    const strength = authService.validatePasswordStrength(password);
    const percentage = (strength.score / 5) * 100;

    strengthBar.style.width = percentage + '%';

    // Change color based on strength
    if (strength.score < 2) {
        strengthBar.style.backgroundColor = '#E74C3C'; // Red
    } else if (strength.score < 4) {
        strengthBar.style.backgroundColor = '#F39C12'; // Orange
    } else {
        strengthBar.style.backgroundColor = '#2ECC71'; // Green
    }
}

// ==================== INITIALIZE ====================

// Check if user is already logged in
if (authService.isAuthenticated()) {
    // Redirect to home if on auth page
    if (document.getElementById('auth-page')) {
        showPage('home-page');
        document.querySelector('.navbar').style.display = 'block';
    }
} else {
    // Show auth page
    if (document.getElementById('auth-page')) {
        showPage('auth-page');
        document.querySelector('.navbar').style.display = 'none';
    }
}

console.log('Auth service loaded successfully');
