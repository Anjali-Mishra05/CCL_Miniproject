// ==================== CONFIG ====================
const API_BASE = CONFIG.API_BASE_URL;

// ==================== AUTH SERVICE ====================

class AuthService {
    constructor() {
        this.currentUser = null;
        this.authToken = localStorage.getItem('authToken');
        this.refreshToken = localStorage.getItem('refreshToken');
    }

    getAuthToken() {
        return this.authToken || localStorage.getItem("authToken");
    }

    // ==================== VALIDATIONS ====================
    

    validatePasswordStrength(password) {
        let score = 0;

        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[!@#$%^&*]/.test(password)) score++;

        return score;
    }

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    validatePhone(phone) {
        return /^[0-9]{10,15}$/.test(phone.replace(/\s/g, ''));
    }

    // ==================== SIGNUP ====================

    async signUp(formData) {
        try {
            console.log("🔥 SIGNUP STARTED");

            if (!formData.name || formData.name.length < 2)
                throw new Error("Invalid name");

            if (!this.validateEmail(formData.email))
                throw new Error("Invalid email");

            if (!this.validatePhone(formData.phone))
                throw new Error("Invalid phone");

            if (this.validatePasswordStrength(formData.password) < 3)
                throw new Error("Weak password");

            console.log("📡 API CALL:", `${API_BASE}/users`);

            const response = await fetch(`${API_BASE}${CONFIG.ENDPOINTS.SIGNUP}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password
                })
            });

            const data = await response.json();
            console.log("📥 RESPONSE:", data);

            if (!response.ok) {
                throw new Error(data.message || "Signup failed");
            }

            return data;

        } catch (err) {
            console.error("❌ SIGNUP ERROR:", err);
            throw err;
        }
    }

    // ==================== LOGIN ====================

    async signIn(email, password) {
        try {
            console.log("🔥 LOGIN STARTED");

            if (!email || !password)
                throw new Error("Email & password required");

            console.log("📡 API CALL:", `${API_BASE}${CONFIG.ENDPOINTS.LOGIN}`);

            const response = await fetch(`${API_BASE}${CONFIG.ENDPOINTS.LOGIN}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();
            console.log("📥 RESPONSE:", data);

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            // store tokens if backend returns them
            if (data.tokens) {
                this.storeTokens(data.tokens);
                this.currentUser = data.user;
                const user = {
                    name: data.user?.name,
                    email: data.user?.email || data.email // fallback
                };
                localStorage.setItem("user", JSON.stringify(user));
            }

            return data;

        } catch (err) {
            console.error("❌ LOGIN ERROR:", err);
            throw err;
        }
    }

    // ==================== TOKEN STORAGE ====================

    storeTokens(tokens) {
        localStorage.setItem("authToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
        this.authToken = tokens.accessToken;
    }

    isAuthenticated() {
        return !!this.authToken;
    }

    logout() {
        localStorage.clear();
        this.currentUser = null;
        this.authToken = null;
    }
}

const authService = new AuthService();

// ==================== DOM EVENTS ====================

document.addEventListener("DOMContentLoaded", () => {

    console.log("✅ DOM LOADED");

    // SWITCH FORMS
    document.getElementById("switch-to-signup")?.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("login-section")?.classList.remove("active");
        document.getElementById("signup-section")?.classList.add("active");
    });

    document.getElementById("switch-to-login")?.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("signup-section")?.classList.remove("active");
        document.getElementById("login-section")?.classList.add("active");
    });

    // ==================== LOGIN ====================

    const loginForm = document.getElementById("login-form");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("login-email")?.value;
            const password = document.getElementById("login-password")?.value;

            try {
                await authService.signIn(email, password);
                showMessage("Login success!", "success");

                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1000);

            } catch (err) {
                showMessage(err.message, "error");
            }
        });
    }

    // ==================== SIGNUP ====================

    const signupForm = document.getElementById("signup-form");

    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const formData = {
                name: document.getElementById("signup-name")?.value,
                email: document.getElementById("signup-email")?.value,
                phone: document.getElementById("signup-phone")?.value,
                password: document.getElementById("signup-password")?.value
            };

            const agree = document.getElementById("agree-terms")?.checked;

            if (!agree) {
                showMessage("Accept terms", "error");
                return;
            }

            try {
                await authService.signUp(formData);
                localStorage.setItem("user", JSON.stringify({
                    name: formData.name,
                    email: formData.email
                }));
                showMessage("Signup success!", "success");

                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1000);

            } catch (err) {
                showMessage(err.message, "error");
            }
        });
    }
});

// ==================== UI ====================

function showMessage(msg, type) {
    console.log(`${type.toUpperCase()}:`, msg);

    const el = document.getElementById("auth-message");
    if (!el) return;

    el.textContent = msg;
    el.className = `auth-message ${type}`;
}

function checkPasswordStrength(password) {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return score;
}