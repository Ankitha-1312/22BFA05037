// Helper functions
function showMessage(text, type = 'error') {
    // Remove any existing alerts
    const oldAlert = document.querySelector('.alert');
    if (oldAlert) oldAlert.remove();
    
    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.textContent = text;
    
    // Add to page
    const form = document.querySelector('form');
    if (form) {
        form.parentNode.insertBefore(alert, form);
    }
    
    // Remove after 4 seconds
    setTimeout(() => {
        if (alert.parentNode) alert.remove();
    }, 4000);
}

function makeShortUrl() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return `https://short.ly/${result}`;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Registration page
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim().toLowerCase();
        const mobile = document.getElementById('mobile').value.trim();
        const github = document.getElementById('github').value.trim();
        const rollno = document.getElementById('rollno').value.trim();
        const accesscode = document.getElementById('accesscode').value;
        
        // Check if all fields are filled
        if (!name || !email || !mobile || !github || !rollno || !accesscode) {
            showMessage('Please fill in all the fields!');
            return;
        }
        
        // Validate email
        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address');
            return;
        }
        
        // Check if user already exists
        if (localStorage.getItem('user_' + email)) {
            showMessage('Someone with this email already has an account!');
            return;
        }
        
        // Save user
        const userData = { name, email, mobile, github, rollno, accesscode };
        localStorage.setItem('user_' + email, JSON.stringify(userData));
        
        showMessage('Account created! Taking you to sign in...', 'success');
        
        setTimeout(() => {
            window.location.href = './login.html';
        }, 1500);
    });
}

// Login page
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const rollno = document.getElementById('loginRollno').value.trim();
        
        if (!email || !rollno) {
            showMessage('Please fill in both fields');
            return;
        }
        
        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address');
            return;
        }
        
        // Check if user exists
        const userDataStr = localStorage.getItem('user_' + email);
        if (!userDataStr) {
            showMessage('No account found with this email. Want to create one?');
            return;
        }
        
        const userData = JSON.parse(userDataStr);
        if (userData.rollno !== rollno) {
            showMessage('Email and roll number don\'t match. Try again!');
            return;
        }
        
        // Save login session
        localStorage.setItem('currentUser', email);
        
        showMessage('Welcome back! Loading your dashboard...', 'success');
        
        setTimeout(() => {
            window.location.href = './dashboard.html';
        }, 1000);
    });
}

// Dashboard page
if (window.location.pathname.includes('dashboard.html')) {
    // Check if user is logged in
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = './login.html';
        return;
    }
    
    const userDataStr = localStorage.getItem('user_' + currentUser);
    if (!userDataStr) {
        localStorage.removeItem('currentUser');
        window.location.href = './login.html';
        return;
    }
    
    const userData = JSON.parse(userDataStr);
    
    // Update welcome message
    document.getElementById('welcomeMessage').textContent = `Hey ${userData.name}! 👋`;
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        window.location.href = './index.html';
    });
    
    // URL shortening
    document.getElementById('urlForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const longUrl = document.getElementById('longUrl').value.trim();
        
        if (!longUrl) {
            showMessage('Please enter a URL to shorten');
            return;
        }
        
        if (!isValidUrl(longUrl)) {
            showMessage('Please enter a valid URL (don\'t forget http:// or https://)');
            return;
        }
        
        // Create short URL
        const shortUrl = makeShortUrl();
        const linkData = {
            longUrl,
            shortUrl,
            createdAt: new Date().toISOString(),
            userEmail: currentUser
        };
        
        // Save to localStorage
        const userLinks = JSON.parse(localStorage.getItem('links_' + currentUser) || '[]');
        userLinks.unshift(linkData);
        localStorage.setItem('links_' + currentUser, JSON.stringify(userLinks));
        
        // Clear form
        document.getElementById('longUrl').value = '';
        
        // Update display
        showLinks();
        
        showMessage('Link shortened! 🎉', 'success');
    });
    
    // Show links function
    function showLinks() {
        const linksList = document.getElementById('linksList');
        const userLinks = JSON.parse(localStorage.getItem('links_' + currentUser) || '[]');
        
        if (userLinks.length === 0) {
            linksList.innerHTML = `
                <div class="empty-state">
                    <p>No links yet! Create your first short link above 👆</p>
                </div>
            `;
            return;
        }
        
        linksList.innerHTML = userLinks.map(link => {
            const date = new Date(link.createdAt);
            const dateStr = date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            return `
                <div class="link-item">
                    <div class="original">Original: ${link.longUrl}</div>
                    <a href="${link.longUrl}" target="_blank" class="short">${link.shortUrl}</a>
                    <div class="date">Created ${dateStr}</div>
                </div>
            `;
        }).join('');
    }
    
    // Show links on page load
    showLinks();
}

// Prevent going back to dashboard after logout
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        if (window.location.pathname.includes('dashboard.html')) {
            const currentUser = localStorage.getItem('currentUser');
            if (!currentUser) {
                window.location.replace('./login.html');
            }
        }
    }
});