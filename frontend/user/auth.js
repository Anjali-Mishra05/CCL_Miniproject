// AWS Configuration
const AWS_REGION = 'ap-south-1';
const COGNITO_POOL_ID = 'ap-south-1_cxxYRwI9X';
const COGNITO_CLIENT_ID = '3cg7oidr4jpl1g22100qapf1og';
const API_GATEWAY_URL = 'https://yy7uzqcse9.execute-api.ap-south-1.amazonaws.com/dev';

let currentUser = null;
let idToken = null;

// Initialize AWS Cognito
const userPool = new AmazonCognitoIdentity.CognitoUserPool({
    UserPoolId: COGNITO_POOL_ID,
    ClientId: COGNITO_CLIENT_ID
});

// Check for existing session on page load
document.addEventListener('DOMContentLoaded', () => {
    // Always start at auth page by default
    showPage('auth-page');
    updateNavbar(false);
    
    // Check if we should auto-login
    checkSession();
    
    // Switch between Login and Signup
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

    // Handle Signup
    document.getElementById('signup-form')?.addEventListener('submit', handleSignup);

    // Handle Login
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);

    // Handle Logout
    document.getElementById('nav-logout')?.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });
});

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const messageDiv = document.getElementById('auth-message');
    
    try {
        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: email,
            Password: password
        });

        const userData = {
            Username: email,
            Pool: userPool
        };

        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function(result) {
                idToken = result.getIdToken().getJwtToken();
                localStorage.setItem('idToken', idToken);
                
                // Store userSub for matching logic
                const payload = result.getIdToken().decodePayload();
                localStorage.setItem('userSub', payload.sub);
                
                showToast('Login successful!', 'success');
                showPage('home-page');
                updateNavbar(true);
                loadHomeStats();
            },
            onFailure: function(err) {
                if (messageDiv) {
                    messageDiv.textContent = 'Login failed: ' + err.message;
                    messageDiv.className = 'auth-message error';
                }
            }
        });
    } catch (error) {
        if (messageDiv) {
            messageDiv.textContent = 'Error: ' + error.message;
            messageDiv.className = 'auth-message error';
        }
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const phone = document.getElementById('signup-phone').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;
    const messageDiv = document.getElementById('auth-message');

    if (password.length < 8) {
        messageDiv.textContent = 'Password must be at least 8 characters long';
        messageDiv.className = 'auth-message error';
        return;
    }

    if (password !== confirmPassword) {
        messageDiv.textContent = 'Passwords do not match';
        messageDiv.className = 'auth-message error';
        return;
    }
    
    try {
        const attributeList = [
            new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'email', Value: email }),
            new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'name', Value: name }),
            new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'phone_number', Value: phone.startsWith('+') ? phone : '+91' + phone })
        ];

        userPool.signUp(email, password, attributeList, null, function(err, result) {
            if (err) {
                console.error('Cognito SignUp Error:', err);
                if (messageDiv) {
                    messageDiv.textContent = 'Sign up failed: ' + err.message;
                    messageDiv.className = 'auth-message error';
                }
            } else {
                if (messageDiv) {
                    messageDiv.textContent = 'Sign up successful! Please check your email for verification, then sign in.';
                    messageDiv.className = 'auth-message success';
                }
                // Switch to login form after success
                setTimeout(() => {
                    document.getElementById('switch-to-login').click();
                }, 3000);
            }
        });
    } catch (error) {
        if (messageDiv) {
            messageDiv.textContent = 'Error: ' + error.message;
            messageDiv.className = 'auth-message error';
        }
    }
}

function handleLogout() {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
        cognitoUser.signOut();
    }
    localStorage.removeItem('idToken');
    idToken = null;
    showPage('auth-page');
    updateNavbar(false);
}

function checkSession() {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
        cognitoUser.getSession((err, session) => {
            if (err || !session.isValid()) {
                updateNavbar(false);
                showPage('auth-page');
            } else {
                idToken = session.getIdToken().getJwtToken();
                localStorage.setItem('idToken', idToken);
                
                // Store userSub for matching logic
                const payload = session.getIdToken().decodePayload();
                localStorage.setItem('userSub', payload.sub);
                
                updateNavbar(true);
                showPage('home-page');
                loadHomeStats();
            }
        });
    } else {
        updateNavbar(false);
        showPage('auth-page');
    }
}

// Utility functions
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': idToken
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(API_GATEWAY_URL + endpoint, options);
    const result = await response.json();

    if (!response.ok) {
        if (response.status === 401) {
            handleLogout();
        }
        throw new Error(result.message || 'API request failed');
    }

    return result;
}

function updateNavbar(isLoggedIn) {
    const nav = document.querySelector('.navbar');
    if (isLoggedIn) {
        nav.style.display = 'block';
    } else {
        nav.style.display = 'none';
    }
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}