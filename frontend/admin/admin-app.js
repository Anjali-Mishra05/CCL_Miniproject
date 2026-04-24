// ==================== ADMIN NAVIGATION ====================

document.getElementById('nav-dashboard')?.addEventListener('click', (e) => {
    e.preventDefault();
    showAdminPage('dashboard-page');
    loadDashboardStats();
    setActiveNav('nav-dashboard');
});

document.getElementById('nav-users')?.addEventListener('click', (e) => {
    e.preventDefault();
    showAdminPage('users-page');
    loadUsers();
    setActiveNav('nav-users');
});

document.getElementById('nav-pets')?.addEventListener('click', (e) => {
    e.preventDefault();
    showAdminPage('pets-page');
    loadPets();
    setActiveNav('nav-pets');
});

document.getElementById('nav-matches')?.addEventListener('click', (e) => {
    e.preventDefault();
    showAdminPage('matches-page');
    loadMatches();
    setActiveNav('nav-matches');
});

document.getElementById('nav-reports')?.addEventListener('click', (e) => {
    e.preventDefault();
    showAdminPage('reports-page');
    loadReports();
    setActiveNav('nav-reports');
});

document.getElementById('nav-notifications')?.addEventListener('click', (e) => {
    e.preventDefault();
    showAdminPage('notifications-page');
    loadNotifications();
    setActiveNav('nav-notifications');
});

document.getElementById('nav-settings')?.addEventListener('click', (e) => {
    e.preventDefault();
    showAdminPage('settings-page');
    setActiveNav('nav-settings');
});

// ==================== PAGE MANAGEMENT ====================

function showAdminPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.admin-page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
    }
}

function setActiveNav(navId) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const navItem = document.getElementById(navId);
    if (navItem) {
        navItem.classList.add('active');
    }
}

// ==================== DASHBOARD ====================

async function loadDashboardStats() {
    try {
        const response = await fetch('/api/admin/stats', {
            headers: {
                'Authorization': `Bearer ${adminAuthService.getAuthToken()}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('total-users').textContent = data.totalUsers || 0;
            document.getElementById('total-lost').textContent = data.lostPets || 0;
            document.getElementById('total-found').textContent = data.foundPets || 0;
            document.getElementById('total-matches').textContent = data.matches || 0;

            // Load recent activity
            if (data.recentActivity) {
                loadRecentActivity(data.recentActivity);
            }
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showAdminToast('Error loading stats', 'error');
    }
}

function loadRecentActivity(activities) {
    const tbody = document.getElementById('activity-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    activities.forEach(activity => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="badge badge-info">${activity.type}</span></td>
            <td>${activity.description}</td>
            <td>${activity.user || 'System'}</td>
            <td>${new Date(activity.date).toLocaleDateString()}</td>
            <td><span class="status-badge ${activity.status}">${activity.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// ==================== USERS MANAGEMENT ====================

async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${adminAuthService.getAuthToken()}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            const tbody = document.getElementById('users-tbody');
            tbody.innerHTML = '';

            data.users.forEach(user => {
                const row = document.createElement('tr');
                const joinDate = new Date(user.createdAt).toLocaleDateString();
                row.innerHTML = `
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.phone || '-'}</td>
                    <td>${joinDate}</td>
                    <td>${user.reports || 0}</td>
                    <td><span class="status-badge active">Active</span></td>
                    <td>
                        <button class="btn-secondary" onclick="viewUserDetails('${user.id}')">View</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            showAdminToast(data.message || 'Failed to load users', 'error');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showAdminToast('Error loading users', 'error');
    }
}

function viewUserDetails(userId) {
    showAdminToast('User details coming soon', 'info');
}

// ==================== PETS MANAGEMENT ====================

async function loadPets() {
    try {
        const response = await fetch('/api/admin/pets', {
            headers: {
                'Authorization': `Bearer ${adminAuthService.getAuthToken()}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            const tbody = document.getElementById('pets-tbody');
            tbody.innerHTML = '';

            data.pets.forEach(pet => {
                const row = document.createElement('tr');
                const reportDate = new Date(pet.date).toLocaleDateString();
                const typeClass = pet.type === 'lost' ? 'pending' : 'verified';
                row.innerHTML = `
                    <td>${pet.name}</td>
                    <td><span class="badge badge-info">${pet.type.toUpperCase()}</span></td>
                    <td>${pet.species}</td>
                    <td>${pet.location}</td>
                    <td>${pet.reportedBy}</td>
                    <td>${reportDate}</td>
                    <td><span class="status-badge ${typeClass}">${pet.status || 'Pending'}</span></td>
                    <td>
                        <button class="btn-secondary" onclick="reviewPet('${pet.id}')">Review</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            showAdminToast(data.message || 'Failed to load pets', 'error');
        }
    } catch (error) {
        console.error('Error loading pets:', error);
        showAdminToast('Error loading pets', 'error');
    }
}

function reviewPet(petId) {
    showAdminToast('Pet review coming soon', 'info');
}

// ==================== MATCHES ====================

async function loadMatches() {
    try {
        const response = await fetch('/api/admin/matches', {
            headers: {
                'Authorization': `Bearer ${adminAuthService.getAuthToken()}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            const tbody = document.getElementById('pets-tbody');
            tbody.innerHTML = '';

            // Reuse the table for matches display
            if (data.matches && data.matches.length > 0) {
                const matchesGrid = document.querySelector('.matches-grid');
                if (matchesGrid) {
                    matchesGrid.innerHTML = '';
                    data.matches.forEach(match => {
                        const card = document.createElement('div');
                        card.style.cssText = 'background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';
                        card.innerHTML = `
                            <div style="background: linear-gradient(135deg, #FF6B6B, #FF5252); color: white; padding: 1rem; text-align: center; border-radius: 8px; margin-bottom: 1rem;">
                                <p>Match Score</p>
                                <div style="font-size: 2rem; font-weight: 700;">${Math.round(match.score * 100)}%</div>
                            </div>
                            <h3>${match.petName1} ↔ ${match.petName2}</h3>
                            <p><strong>Location:</strong> ${match.location || 'N/A'}</p>
                            <p><strong>Distance:</strong> ${match.distance || 'N/A'}</p>
                            <button class="btn-primary" onclick="handleMatch('${match.id}')">Review Match</button>
                        `;
                        matchesGrid.appendChild(card);
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error loading matches:', error);
        showAdminToast('Error loading matches', 'error');
    }
}

function handleMatch(matchId) {
    showAdminToast('Match handling coming soon', 'info');
}

// ==================== REPORTS ====================

async function loadReports() {
    try {
        const response = await fetch('/api/admin/reports', {
            headers: {
                'Authorization': `Bearer ${adminAuthService.getAuthToken()}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            const tbody = document.getElementById('reports-tbody');
            tbody.innerHTML = '';

            data.reports.forEach(report => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${report.id}</td>
                    <td><span class="badge badge-info">${report.type}</span></td>
                    <td>${report.reason}</td>
                    <td>${report.reportedBy}</td>
                    <td>${new Date(report.date).toLocaleDateString()}</td>
                    <td><span class="status-badge pending">${report.status}</span></td>
                    <td>
                        <button class="btn-secondary" onclick="resolveReport('${report.id}')">Resolve</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading reports:', error);
        showAdminToast('Error loading reports', 'error');
    }
}

function resolveReport(reportId) {
    showAdminToast('Report resolution coming soon', 'info');
}

// ==================== NOTIFICATIONS ====================

async function loadNotifications() {
    try {
        const response = await fetch('/api/admin/notifications', {
            headers: {
                'Authorization': `Bearer ${adminAuthService.getAuthToken()}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            const container = document.querySelector('.notifications-list');
            if (container) {
                container.innerHTML = '';
                data.notifications.forEach(notification => {
                    const notif = document.createElement('div');
                    notif.style.cssText = 'background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #FF6B6B;';
                    notif.innerHTML = `
                        <h4>${notification.title}</h4>
                        <p style="margin: 0.5rem 0; color: #666;">${notification.message}</p>
                        <small style="color: #999;">${new Date(notification.date).toLocaleString()}</small>
                    `;
                    container.appendChild(notif);
                });
            }
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        showAdminToast('Error loading notifications', 'error');
    }
}

// ==================== TOAST NOTIFICATIONS ====================

function showAdminToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// ==================== INITIALIZE ====================

window.addEventListener('DOMContentLoaded', () => {
    if (!adminAuthService.isAuthenticated()) {
        document.getElementById('admin-dashboard-page').style.display = 'none';
        document.getElementById('admin-auth-page').style.display = 'block';
    } else {
        // Load dashboard on page load
        document.getElementById('admin-email').textContent = adminAuthService.currentAdmin?.email || 'admin@petmatch.com';
        showAdminPage('dashboard-page');
        loadDashboardStats();
    }
});

console.log('Admin App loaded successfully');
