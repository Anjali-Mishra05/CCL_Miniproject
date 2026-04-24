// ==================== PAGE MANAGEMENT ====================

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });

    const page = document.getElementById(pageId);
    if (page) {
        page.style.display = 'block';
    }

    if (pageId === 'home-page' || pageId === 'auth-page') {
        document.body.classList.add('no-scroll');
    } else {
        document.body.classList.remove('no-scroll');
    }

    const navbar = document.querySelector('.navbar');
    if (pageId !== 'auth-page' && navbar) {
        navbar.style.display = 'block';
    } else if (navbar) {
        navbar.style.display = 'none';
    }
}

// ==================== NAVIGATION ====================

document.getElementById('nav-home')?.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('home-page');
    loadHomeStats();
});

document.getElementById('nav-browse')?.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('browse-page');
    loadPets();
});

document.getElementById('nav-report')?.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('report-page');
});

document.getElementById('nav-matches')?.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('matches-page');
    loadMatches();
});

document.getElementById('nav-profile')?.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('profile-page');
    loadProfile();
});

// ✅ LOGOUT ADDED
document.getElementById('nav-logout')?.addEventListener('click', (e) => {
    e.preventDefault();

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    if (typeof authService !== "undefined") {
        authService.logout && authService.logout();
    }

    showPage('auth-page');

    document.getElementById('login-section')?.classList.add('active');
    document.getElementById('signup-section')?.classList.remove('active');

    document.getElementById('login-form')?.reset();
    document.getElementById('signup-form')?.reset();

    showToast('Logged out successfully', 'success');
});

// ==================== HOME PAGE ====================

async function loadHomeStats() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/pets/stats`, {
            headers: {
                'Authorization': `Bearer ${authService.getAuthToken()}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('stat-lost').textContent = data.lostCount || 0;
            document.getElementById('stat-found').textContent = data.foundCount || 0;
            document.getElementById('stat-matched').textContent = data.matchedCount || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

document.getElementById('btn-report-lost')?.addEventListener('click', () => {
    document.getElementById('pet-type').value = 'lost';
    document.getElementById('lost-or-found').textContent = 'Lost';
    showPage('report-page');
});

document.getElementById('btn-report-found')?.addEventListener('click', () => {
    document.getElementById('pet-type').value = 'found';
    document.getElementById('lost-or-found').textContent = 'Found';
    showPage('report-page');
});

// ==================== BROWSE PAGE ====================
// (UNCHANGED — keeping your code as-is)

// ==================== BROWSE PAGE ====================

async function loadPets() {
    try {
        const type = document.getElementById('filter-type')?.value || '';
        const species = document.getElementById('filter-species')?.value || '';
        const location = document.getElementById('filter-location')?.value || '';

        let endpoint = `${CONFIG.API_BASE_URL}/pets?`;
        if (type) endpoint += `type=${type}&`;
        if (species) endpoint += `species=${species}&`;
        if (location) endpoint += `location=${location}`;

        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${authService.getAuthToken()}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            const petsList = document.getElementById('pets-list');
            petsList.innerHTML = '';

            if (data.pets && data.pets.length > 0) {
                data.pets.forEach(pet => {
                    const card = createPetCard(pet);
                    petsList.appendChild(card);
                });
            } else {
                petsList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #999;">No pets found. Try adjusting your filters.</p>';
            }
        } else {
            showToast(data.message || 'Failed to load pets', 'error');
        }
    } catch (error) {
        console.error('Error loading pets:', error);
        showToast('Error loading pets', 'error');
    }
}

function createPetCard(pet) {
    const card = document.createElement('div');
    card.className = 'pet-card';

    const badgeClass = pet.type === 'lost' ? 'pet-badge lost' : 'pet-badge found';
    const badgeText = pet.type === 'lost' ? '❌ LOST' : '✅ FOUND';

    const dateStr = new Date(pet.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    card.innerHTML = `
        <img src="${pet.imageUrl || 'https://via.placeholder.com/280x250?text=Pet+Photo'}" alt="${pet.name || 'Pet'}" style="width: 100%; height: 250px; object-fit: cover;">
        <div class="pet-card-content">
            <span class="pet-badge ${pet.type === 'lost' ? 'badge-lost' : 'badge-found'}">${pet.type === 'lost' ? '❌ LOST' : '✅ FOUND'}</span>
            <h3>${pet.name || 'Unknown Pet'}</h3>
            <div class="pet-info"><strong>Species:</strong> ${pet.species || 'N/A'}</div>
            <div class="pet-info"><strong>Breed:</strong> ${pet.breed || 'N/A'}</div>
            <div class="pet-info"><strong>Location:</strong> ${pet.location || 'N/A'}</div>
            <div class="pet-info"><strong>Date:</strong> ${dateStr}</div>
            <p style="margin-top: 0.8rem; font-size: 0.9rem; color: #64748b; font-style: italic;">${pet.description?.substring(0, 60) || 'No description provided'}...</p>
        </div>
    `;

    card.addEventListener('click', () => showPetDetail(pet));

    return card;
}

function showPetDetail(pet) {
    const modal = document.getElementById('pet-detail-modal');
    const body = document.getElementById('pet-detail-body');

    const dateStr = new Date(pet.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const badgeClass = pet.type === 'lost' ? 'pet-badge badge-lost' : 'pet-badge badge-found';
    const badgeText = pet.type === 'lost' ? 'LOST' : 'FOUND';

    body.innerHTML = `
        <img src="${pet.imageUrl || 'https://via.placeholder.com/600x400'}" alt="${pet.name}" style="width: 100%; border-radius: 8px; margin-bottom: 1.5rem;">
        <span class="${badgeClass}">${badgeText}</span>
        <h2>${pet.name || 'Unknown Pet'}</h2>
        <div style="margin: 1.5rem 0;">
            <p><strong>Species:</strong> ${pet.species || 'N/A'}</p>
            <p><strong>Breed:</strong> ${pet.breed || 'N/A'}</p>
            <p><strong>Color:</strong> ${pet.color || 'N/A'}</p>
            <p><strong>Location:</strong> ${pet.location || 'N/A'}</p>
            <p><strong>Date:</strong> ${dateStr}</p>
            <p><strong>Description:</strong> ${pet.description || 'N/A'}</p>
            <p><strong>Contact:</strong> ${pet.contactPhone || 'N/A'}</p>
        </div>
        <button class="btn-primary" onclick="contactPetOwner('${pet.id}')">
            <i class="fas fa-phone"></i> Contact Owner
        </button>
    `;

    modal.style.display = 'flex';
}

function closePetDetail() {
    const modal = document.getElementById('pet-detail-modal');
    if (modal) modal.style.display = 'none';
}

document.getElementById('pet-detail-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        closePetDetail();
    }
});

// Setup filter button
document.getElementById('btn-filter')?.addEventListener('click', loadPets);

// ==================== REPORT PAGE ====================

document.getElementById('report-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const petType = document.getElementById('pet-type').value;
    const species = document.getElementById('pet-species').value;
    const name = document.getElementById('pet-name').value;
    const breed = document.getElementById('pet-breed').value;
    const color = document.getElementById('pet-color').value;
    const description = document.getElementById('pet-description').value;
    const location = document.getElementById('pet-location').value;
    const date = document.getElementById('pet-date').value;
    const phone = document.getElementById('pet-phone').value;
    const imageFile = document.getElementById('pet-image').files[0];

    if (!imageFile) {
        showToast('Please select an image', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('type', petType);
    formData.append('species', species);
    formData.append('name', name);
    formData.append('breed', breed);
    formData.append('color', color);
    formData.append('description', description);
    formData.append('location', location);
    formData.append('date', date);
    formData.append('contactPhone', phone);
    formData.append('image', imageFile);

    try {
        showToast('Uploading image...', 'info');

        // Step 1: Get Presigned URL
        const uploadResponse = await fetch(`${CONFIG.API_BASE_URL}/upload/presigned-url`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authService.getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileName: imageFile.name,
                fileType: imageFile.type
            })
        });

        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadData.message || 'Failed to get upload URL');

        // Step 2: Upload to S3
        const s3Response = await fetch(uploadData.presignedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': imageFile.type
            },
            body: imageFile
        });

        if (!s3Response.ok) throw new Error('Failed to upload image to S3');

        // Step 3: Create Pet Record
        const response = await fetch(`${CONFIG.API_BASE_URL}/pets`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authService.getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: petType,
                species: species,
                name: name,
                breed: breed,
                color: color,
                description: description,
                location: location,
                date: date,
                contactPhone: phone,
                imageUrl: uploadData.fileUrl
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Pet reported successfully!', 'success');
            document.getElementById('report-form').reset();
            setTimeout(() => showPage('home-page'), 1500);
        } else {
            showToast(data.message || 'Failed to report pet', 'error');
        }
    } catch (error) {
        console.error('Error reporting pet:', error);
        showToast('Error reporting pet', 'error');
    }
});

document.getElementById('btn-cancel-report')?.addEventListener('click', () => {
    showPage('home-page');
});

// File upload preview
document.getElementById('pet-image')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            console.log('Image ready for upload:', file.name);
        };
        reader.readAsDataURL(file);
    }
});

// ==================== MATCHES PAGE ====================

async function loadMatches() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/admin/matches`, { // Or user matches if endpoint changes
            headers: {
                'Authorization': `Bearer ${authService.getAuthToken()}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            const matchesList = document.getElementById('matches-list');
            matchesList.innerHTML = '';

            if (data.matches && data.matches.length > 0) {
                data.matches.forEach(match => {
                    const card = createMatchCard(match);
                    matchesList.appendChild(card);
                });
            } else {
                matchesList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #999;">No matches found yet.</p>';
            }
        } else {
            showToast(data.message || 'Failed to load matches', 'error');
        }
    } catch (error) {
        console.error('Error loading matches:', error);
        showToast('Error loading matches', 'error');
    }
}

function createMatchCard(match) {
    const card = document.createElement('div');
    card.className = 'match-card';

    const scorePercentage = Math.round(match.score * 100);

    card.innerHTML = `
        <div class="match-score">
            <p>Match Score</p>
            <div class="score">${scorePercentage}%</div>
        </div>
        <div class="match-card-content">
            <h3>${match.petName}</h3>
            <div class="pet-info"><strong>Species:</strong> ${match.species}</div>
            <div class="pet-info"><strong>Location:</strong> ${match.location}</div>
            <div class="pet-info"><strong>Distance:</strong> ${match.distance || 'N/A'}</div>
            <button class="btn-primary" onclick="viewPetMatch('${match.petId}')">
                <i class="fas fa-eye"></i> View Details
            </button>
        </div>
    `;

    return card;
}

function viewPetMatch(petId) {
    // Redirect to browse and filter to show this pet
    showPage('browse-page');
}

// ==================== PROFILE PAGE ====================

async function loadProfile() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${authService.getAuthToken()}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('profile-name').textContent = data.user.name || 'User';
            document.getElementById('profile-email').textContent = data.user.email || '';
            document.getElementById('profile-reports').textContent = data.stats?.totalReports || 0;
            document.getElementById('profile-matched').textContent = data.stats?.totalMatched || 0;

            // Load user's pet reports
            await loadUserPets();
        } else {
            showToast(data.message || 'Failed to load profile', 'error');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Error loading profile', 'error');
    }
}

async function loadUserPets() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/pets/my-reports`, {
            headers: {
                'Authorization': `Bearer ${authService.getAuthToken()}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            const petsList = document.getElementById('my-pets-list');
            petsList.innerHTML = '';

            if (data.pets && data.pets.length > 0) {
                data.pets.forEach(pet => {
                    const item = document.createElement('div');
                    item.style.cssText = 'background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;';
                    item.innerHTML = `
                        <div>
                            <h4>${pet.name} (${pet.type.toUpperCase()})</h4>
                            <p style="margin: 0.5rem 0; font-size: 0.9rem; color: #7F8C8D;">${pet.location} - ${new Date(pet.date).toLocaleDateString()}</p>
                        </div>
                        <button class="btn-secondary" onclick="editPet('${pet.id}')">Edit</button>
                    `;
                    petsList.appendChild(item);
                });
            } else {
                petsList.innerHTML = '<p style="color: #999;">No pet reports yet.</p>';
            }
        }
    } catch (error) {
        console.error('Error loading user pets:', error);
    }
}

document.getElementById('btn-edit-profile')?.addEventListener('click', () => {
    // TODO: Implement edit profile modal
    showToast('Edit profile coming soon', 'info');
});

document.getElementById('btn-change-password')?.addEventListener('click', () => {
    // TODO: Implement change password modal
    showToast('Change password coming soon', 'info');
});

document.getElementById('btn-delete-account')?.addEventListener('click', () => {
    if (confirm('Are you sure? This action cannot be undone.')) {
        // TODO: Implement account deletion
        showToast('Account deletion coming soon', 'info');
    }
});

// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
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

// ==================== HELPER FUNCTIONS ====================

function contactPetOwner(petId) {
    showToast('Contact feature coming soon', 'info');
}

function editPet(petId) {
    showToast('Edit feature coming soon', 'info');
}

// ==================== INITIALIZE ====================

// Check authentication on load
window.addEventListener('DOMContentLoaded', () => {
    console.log('App initialization (Bypassed for testing)...');
    showPage('home-page');
    // loadHomeStats(); // Disabled to avoid API errors while reviewing UI
});

console.log('App loaded successfully');
