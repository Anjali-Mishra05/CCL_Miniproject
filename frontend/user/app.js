// Navigation
document.getElementById('nav-home').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('home-page');
    loadHomeStats();
});

document.getElementById('nav-browse').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('browse-page');
    // Clear previous results and show prompt
    document.getElementById('pets-list').innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #64748b;">Please select filters and click Search to find pets.</p>';
});

document.getElementById('nav-report').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('report-page');
});

document.getElementById('nav-matches').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('matches-page');
    loadMatches();
});

document.getElementById('nav-profile').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('profile-page');
    loadProfile();
});

// Home Page - Load Stats
async function loadHomeStats() {
    try {
        // Fetch personal stats for the logged-in user
        const data = await apiCall('/users/pets');
        const pets = data.pets || [];
        
        const lostCount = pets.filter(p => p.type === 'lost').length;
        const foundCount = pets.filter(p => p.type === 'found').length;
        
        document.getElementById('stat-lost').textContent = lostCount;
        document.getElementById('stat-found').textContent = foundCount;
        document.getElementById('stat-matched').textContent = 0; 
    } catch (error) {
        console.error('Error loading personal stats:', error);
    }
}

// Home Page - Quick Actions
document.getElementById('btn-report-lost').addEventListener('click', () => {
    document.getElementById('pet-type').value = 'lost';
    showPage('report-page');
});

document.getElementById('btn-report-found').addEventListener('click', () => {
    document.getElementById('pet-type').value = 'found';
    showPage('report-page');
});

// Browse Page - Load Pets
async function loadPets() {
    try {
        const type = document.getElementById('filter-type').value;
        const species = document.getElementById('filter-species').value;
        const location = document.getElementById('filter-location').value;
        
        let endpoint = '/pets?';
        if (type) endpoint += `type=${type}&`;
        if (species) endpoint += `species=${species}&`;
        if (location) endpoint += `location=${location}`;
        
        const data = await apiCall(endpoint);
        
        const petsList = document.getElementById('pets-list');
        petsList.innerHTML = '';
        
        if (data.pets && data.pets.length > 0) {
            data.pets.forEach(pet => {
                const card = createPetCard(pet);
                petsList.appendChild(card);
            });
        } else {
            petsList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No pets found.</p>';
        }
    } catch (error) {
        console.error('Error loading pets:', error);
        alert('Failed to load pets');
    }
}

// Create Pet Card
function createPetCard(pet) {
    const card = document.createElement('div');
    card.className = 'pet-card';
    
    const badgeClass = pet.type === 'lost' ? 'pet-badge lost' : 'pet-badge found';
    const badgeText = pet.type === 'lost' ? 'LOST' : 'FOUND';
    
    card.innerHTML = `
        <img src="${pet.imageUrl || 'https://via.placeholder.com/280x250'}" alt="${pet.name || 'Pet'}">
        <div class="pet-card-content">
            <div class="${badgeClass}">${badgeText}</div>
            <h3 style="font-size: 1rem; margin-bottom: 0.2rem;">${pet.name || 'Unknown Pet'}</h3>
            <div class="pet-info" style="font-size: 0.75rem;"><strong>Species:</strong> ${pet.species}</div>
            <div class="pet-info" style="font-size: 0.75rem;"><strong>Location:</strong> ${pet.location}</div>
            <div class="pet-info" style="font-size: 0.75rem;"><strong>Date:</strong> ${new Date(pet.date).toLocaleDateString()}</div>
            <p style="margin-top: 0.3rem; font-size: 0.7rem; color: #64748b; line-height: 1.3;">${pet.description.substring(0, 40)}...</p>
        </div>
    `;
    
    card.addEventListener('click', () => {
        showPetDetail(pet);
    });
    
    return card;
}

// Show Pet Detail
function showPetDetail(pet) {
    alert(`
Pet: ${pet.name || 'Unknown'}
Type: ${pet.type}
Species: ${pet.species}
Location: ${pet.location}
Description: ${pet.description}
Date: ${new Date(pet.date).toLocaleDateString()}

Contact: ${pet.contactPhone}
    `);
}

// Search button on Browse page
document.getElementById('btn-filter').addEventListener('click', loadPets);

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Report Form - Image Preview
document.getElementById('pet-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const preview = document.getElementById('image-preview');
            preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
});

// Report Form - Submit
document.getElementById('report-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const messageDiv = document.getElementById('report-message');
    messageDiv.textContent = 'Submitting...';
    messageDiv.classList.remove('success', 'error');
    
    try {
        const imageFile = document.getElementById('pet-image').files[0];
        
        if (!imageFile) {
            throw new Error('Please select an image');
        }
        
        // Upload image to S3
        const imageUrl = await uploadImageToS3(imageFile);
        
        // Submit pet report
        const petData = {
            type: document.getElementById('pet-type').value,
            species: document.getElementById('pet-species').value,
            name: document.getElementById('pet-name').value,
            description: document.getElementById('pet-description').value,
            location: document.getElementById('pet-location').value,
            date: document.getElementById('pet-date').value,
            imageUrl: imageUrl,
            contactPhone: document.getElementById('pet-phone').value,
            receiveNotifications: document.getElementById('receive-notifications').checked
        };
        
        const result = await apiCall('/pets', 'POST', petData);
        
        messageDiv.textContent = 'Pet report submitted successfully!';
        messageDiv.classList.add('success');
        
        // Reset form
        document.getElementById('report-form').reset();
        document.getElementById('image-preview').innerHTML = '';
        
        setTimeout(() => {
            showPage('home-page');
            loadHomeStats(); // Refresh the counts!
            messageDiv.textContent = '';
        }, 2000);
        
    } catch (error) {
        messageDiv.textContent = 'Error: ' + error.message;
        messageDiv.classList.add('error');
    }
});

// Upload image to S3
async function uploadImageToS3(file) {
    try {
        // Get presigned URL from API
        const response = await apiCall('/upload/presigned-url', 'POST', {
            fileName: file.name,
            fileType: file.type
        });
        
        // Upload file to S3
        await fetch(response.presignedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type
            },
            body: file
        });
        
        return response.fileUrl;
    } catch (error) {
        throw new Error('Failed to upload image: ' + error.message);
    }
}

// Profile Page
async function loadProfile() {
    try {
        const userData = await apiCall('/users/profile');
        
        document.getElementById('profile-name').textContent = userData.name || 'User';
        document.getElementById('profile-email').textContent = userData.email;
        // document.getElementById('profile-phone').textContent = userData.phone; // Hidden in some layouts
        
        // Load user's pet reports
        const petsData = await apiCall('/users/pets');
        
        // Update stats bubbles
        document.getElementById('profile-reports').textContent = petsData.count || 0;
        // document.getElementById('profile-matched').textContent = 0; // Matched logic placeholder
        
        const reportsContainer = document.getElementById('my-pets-list');
        reportsContainer.innerHTML = '';
        
        if (petsData.pets && petsData.pets.length > 0) {
            petsData.pets.forEach(pet => {
                const card = createPetCard(pet);
                reportsContainer.appendChild(card);
            });
        } else {
            reportsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #64748b;">You haven\'t reported any pets yet.</p>';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

document.getElementById('btn-edit-profile').addEventListener('click', () => {
    alert('Edit Profile feature coming soon!');
});

async function loadMatches() {
    const matchesList = document.getElementById('matches-list');
    matchesList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 3rem;">Checking for matches...</p>';
    
    try {
        const data = await apiCall('/users/matches');
        
        matchesList.innerHTML = '';
        
        if (data.matches && data.matches.length > 0) {
            data.matches.forEach(match => {
                const card = createMatchCard(match);
                matchesList.appendChild(card);
            });
        } else {
            matchesList.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem;">
                    <i class="fas fa-search" style="font-size: 3rem; color: #e2e8f0; margin-bottom: 1rem;"></i>
                    <h3>No matches found yet</h3>
                    <p style="color: #64748b;">Our AI is scanning new reports constantly. Check back soon!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading matches:', error);
        matchesList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #e11d48; padding: 3rem;">Failed to load matches. Please try again later.</p>';
    }
}

function createMatchCard(match) {
    const card = document.createElement('div');
    card.className = 'match-card';
    
    const similarity = Math.round(match.confidence || match.similarity || 0);
    
    // Get user ID with fallback
    let currentUserSub = localStorage.getItem('userSub');
    if (!currentUserSub && localStorage.getItem('idToken')) {
        try {
            const token = localStorage.getItem('idToken');
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUserSub = payload.sub;
            localStorage.setItem('userSub', currentUserSub);
        } catch (e) { console.error('Token parse error', e); }
    }
    
    // Determine which side is the "other" person
    const isUserOwner = match.lostPet?.userId === currentUserSub;
    const isUserFinder = match.foundPet?.userId === currentUserSub;
    
    let otherPet = match.foundPet; // Default
    let myRole = "Viewer";
    
    if (isUserOwner) {
        otherPet = match.foundPet;
        myRole = "Owner";
    } else if (isUserFinder) {
        otherPet = match.lostPet;
        myRole = "Finder";
    }
    
    const otherRole = myRole === "Owner" ? "Finder" : "Owner";
    
    card.innerHTML = `
        <div class="match-header-fancy">
            <div style="display: flex; flex-direction: column;">
                <h3 style="font-size: 1.1rem; font-weight: 800;">Match for ${isUserOwner ? match.lostPet?.name : (match.foundPet?.name || 'Your Found Pet')}</h3>
                <span style="font-size: 0.7rem; color: var(--primary); font-weight: 700;">You are the ${myRole}</span>
            </div>
            <div class="match-score-pill">${similarity}% Match</div>
        </div>
        
        <div class="match-comparison-hero">
            <div class="match-pet-frame" style="opacity: ${myRole === 'Owner' ? '1' : '0.6'}">
                <span>LOST PET</span>
                <img src="${match.lostPet?.imageUrl || 'https://via.placeholder.com/150'}" alt="Lost">
                <h4>${match.lostPet?.name || 'Unknown'}</h4>
            </div>
            
            <div class="match-vs-icon">
                <i class="fas fa-exchange-alt"></i>
            </div>
            
            <div class="match-pet-frame" style="opacity: ${myRole === 'Finder' ? '1' : '0.6'}">
                <span>FOUND PET</span>
                <img src="${match.foundPet?.imageUrl || 'https://via.placeholder.com/150'}" alt="Found">
                <h4>${match.foundPet?.name || 'Unknown'}</h4>
            </div>
        </div>
        
        <div class="match-details-premium">
            <div class="match-info-pill">
                <div class="info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${otherPet?.location || 'Unknown location'}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-phone-alt"></i>
                    <span style="font-weight: 700; color: var(--primary);">${otherRole}'s Phone: ${otherPet?.contactPhone || 'No phone'}</span>
                </div>
            </div>
            
            <button class="btn-primary" style="width: 100%; height: 55px; font-size: 1.05rem; border-radius: 15px;" onclick="window.location.href='tel:${otherPet?.contactPhone}'">
                <i class="fas fa-phone-alt"></i> Call ${otherRole} Now
            </button>
        </div>
    `;
    
    return card;
}

document.getElementById('btn-change-password').addEventListener('click', () => {
    alert('Change Password feature coming soon!');
});
