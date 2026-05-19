/**
 * BookShop Frontend Logic
 * Refactored for better performance, modularity, and premium UI interactions.
 */

// Configuration
const API_URL = 'http://localhost:8080/api/books';
const API_BASE_URL = new URL(API_URL).origin;

// State Management
let state = {
    books: [],
    cart: JSON.parse(localStorage.getItem('cart')) || [],
    isEditMode: false,
    editBookId: null,
    theme: localStorage.getItem('theme') || 'dark',
    user: JSON.parse(localStorage.getItem('user')) || null
};

// Initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function initApp() {
    applyTheme();
    updateCartUI();
    updateHeaderAuthUI();
    applyNavigationAccess();
    
    // Page-specific initialization
    const path = window.location.pathname;
    console.log('Current path:', path);

    if (path.includes('index.html') || path === '/' || path.endsWith('Main/') || path.endsWith('Main')) {
        loadBooks();
    } else if (path.includes('admin.html')) {
        checkConnection();
        // Delay to ensure admin script is loaded
        setTimeout(() => {
            if (typeof window.loadAdminBooks === 'function') {
                window.loadAdminBooks();
            }
        }, 100);
    } else if (path.includes('addbook.html')) {
        loadRecentBooks();
        setupImagePreview('book-image', 'image-preview', 'preview-img');
    }
}

// ===== UTILS =====

function getImageUrl(imageUrl) {
    if (!imageUrl) return `${API_BASE_URL}/images/placeholder.png`;
    if (/^(https?:\/\/|data:)/.test(imageUrl)) return imageUrl;
    const cleanUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${API_BASE_URL}${cleanUrl}`;
}

function handleImageError(img) {
    img.src = `${API_BASE_URL}/images/placeholder.png`;
    img.onerror = null;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${msg}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// ===== THEME MANAGEMENT =====

function applyTheme() {
    if (state.theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.innerHTML = state.theme === 'dark' ? '☀️' : '🌙';
        themeBtn.onclick = toggleTheme;
    }
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', state.theme);
    applyTheme();
}

// ===== API CALLS =====

async function apiRequest(endpoint, options = {}) {
    try {
        const token = localStorage.getItem('token');
        if (token) {
            options.headers = options.headers || {};
            if (!options.headers['Authorization']) {
                options.headers['Authorization'] = `Bearer ${token}`;
            }
        }
        const response = await fetch(endpoint, options);
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                handleAuthError();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function loadBooks() {
    const bookList = document.getElementById('book-list');
    if (!bookList) return;

    bookList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        state.books = await apiRequest(`${API_URL}/all`);
        renderBooks(state.books);
        const totalCount = document.getElementById('total-count');
        if (totalCount) totalCount.textContent = state.books.length;
    } catch (error) {
        showToast('❌ Kitabları yükləmək mümkün olmadı', 'danger');
    }
}

async function loadRecentBooks() {
    const bookList = document.getElementById('book-list');
    if (!bookList) return;
    
    try {
        const books = await apiRequest(`${API_URL}/all`);
        const recent = books.slice(-5).reverse();
        renderBooks(recent);
    } catch (error) {
        console.error('Recent books load failed', error);
    }
}

// ===== UI RENDERING =====

function renderBooks(books) {
    const bookList = document.getElementById('book-list');
    if (!bookList) return;

    bookList.innerHTML = '';
    if (books.length === 0) {
        bookList.innerHTML = '<div class="empty">📚 Heç bir kitab tapılmadı</div>';
        return;
    }

    books.forEach(book => {
        const card = createBookCard(book);
        bookList.appendChild(card);
    });
}

function createBookCard(book) {
    const div = document.createElement('div');
    div.className = 'book-card fade-in';
    const bookImage = getImageUrl(book.imageUrl);
    const price = book.price ? book.price.toFixed(2) : "0.00";

    div.innerHTML = `
        <div class="book-image-container">
            <img src="${bookImage}" alt="${escapeHtml(book.title)}" class="book-image" onerror="handleImageError(this)">
            <div class="book-overlay">
                <button class="btn btn-primary" onclick='addToCart(${JSON.stringify(book)})'>🛒 Səbətə at</button>
            </div>
        </div>
        <div class="book-info">
            <div class="badge">${escapeHtml(book.category)}</div>
            <h3 class="book-title">${escapeHtml(book.title)}</h3>
            <p class="book-author">👤 ${escapeHtml(book.author)}</p>
            <div class="book-details">
                <span>📖 ${book.pages} səh</span>
                <span>📅 ${book.year}</span>
            </div>
            <div class="book-meta">
                <span class="book-price">${price} ₼</span>
            </div>
        </div>
    `;
    return div;
}

// ===== CART LOGIC =====

window.addToCart = (book) => {
    const found = state.cart.find(item => item.id === book.id);
    if (found) {
        found.quantity++;
    } else {
        state.cart.push({ ...book, quantity: 1 });
    }
    saveCart();
    updateCartUI();
    showToast("🛒 Səbətə əlavə edildi", "success");
};

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(state.cart));
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = state.cart.reduce((acc, item) => acc + item.quantity, 0);
    }
    
    const cartList = document.getElementById('cart-list');
    if (cartList) {
        cartList.innerHTML = '';
        let total = 0;
        state.cart.forEach(item => {
            total += item.price * item.quantity;
            const li = document.createElement('div');
            li.className = 'cart-item';
            li.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.title}</h4>
                    <p>${item.quantity} x ${item.price.toFixed(2)} ₼</p>
                </div>
                <button class="btn btn-secondary" style="color: var(--danger)" onclick="removeFromCart('${item.id}')">✕</button>
            `;
            cartList.appendChild(li);
        });
        
        const cartTotal = document.getElementById('cart-total');
        if (cartTotal) cartTotal.textContent = total.toFixed(2) + " ₼";
    }
}

window.removeFromCart = (id) => {
    state.cart = state.cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
};

// ===== SEARCH & FILTERS =====

window.applyFiltersAndSort = () => {
    const search = document.getElementById('search-input')?.value.toLowerCase() || '';
    const category = document.getElementById('filter-category')?.value || 'all';
    const sort = document.getElementById('sort-books')?.value || 'default';

    let filtered = state.books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(search) || book.author.toLowerCase().includes(search);
        const matchesCategory = category === 'all' || book.category === category;
        return matchesSearch && matchesCategory;
    });

    if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    else if (sort === 'title-az') filtered.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'year-desc') filtered.sort((a, b) => b.year - a.year);

    renderBooks(filtered);
};

// ===== ADMIN & FORM LOGIC =====

async function checkConnection() {
    const statusEl = document.getElementById('status');
    if (!statusEl) return;
    
    try {
        await fetch(`${API_URL}/health`);
        statusEl.className = 'status connected';
        statusEl.textContent = '🟢 Backend Aktiv';
    } catch {
        statusEl.className = 'status disconnected';
        statusEl.textContent = '🔴 Backend Offline';
    }
}

function setupImagePreview(inputId, containerId, imgId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = document.getElementById(imgId);
                const container = document.getElementById(containerId);
                if (img && container) {
                    img.src = ev.target.result;
                    container.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        }
    };
}

async function uploadImageToBackend(bookId, file) {
    const formData = new FormData();
    formData.append('file', file);
    try {
        const headers = {};
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`${API_URL}/${bookId}/upload-image`, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                handleAuthError();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.ok;
    } catch (error) {
        console.error('Image upload failed', error);
        return false;
    }
}

window.submitBookForm = async (bookData, imageFile) => {
    try {
        const savedBook = await apiRequest(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData)
        });

        if (savedBook && savedBook.id) {
            if (imageFile) {
                await uploadImageToBackend(savedBook.id, imageFile);
            }
            showToast('✅ Kitab uğurla əlavə edildi', 'success');
            return { success: true };
        }
        return { success: false, message: 'Xəta baş verdi' };
    } catch (error) {
        showToast('❌ Kitab əlavə edilərkən xəta baş verdi', 'danger');
        return { success: false };
    }
};

window.openEditModal = (book) => {
    document.getElementById('edit-book-id').value = book.id;
    document.getElementById('edit-title').value = book.title;
    document.getElementById('edit-author').value = book.author;
    document.getElementById('edit-category').value = book.category;
    document.getElementById('edit-pages').value = book.pages;
    document.getElementById('edit-year').value = book.year;
    document.getElementById('edit-price').value = book.price;
    document.getElementById('editModal').style.display = 'block';
};

window.closeEditModal = () => {
    document.getElementById('editModal').style.display = 'none';
};

window.updateAdminBook = async (id, data) => {
    try {
        const response = await apiRequest(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        showToast('✅ Yeniləndi', 'success');
        return { success: true };
    } catch (error) {
        showToast('❌ Yeniləmə xətası', 'danger');
        return { success: false };
    }
};

// ===== AUTHENTICATION & SECURITY SYSTEM =====

function saveUserSession(token, username, role) {
    state.user = { token, username, role };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(state.user));
    updateHeaderAuthUI();
    applyNavigationAccess();
}

function clearUserSession() {
    state.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateHeaderAuthUI();
    applyNavigationAccess();
}

function getFriendlyRole(role) {
    switch (role) {
        case 'ROLE_ADMIN': return 'Admin';
        case 'ROLE_SATICI': return 'Satıcı';
        case 'ROLE_ALICI': return 'Alıcı';
        default: return role;
    }
}

function ensureAuthModal() {
    if (document.getElementById('auth-modal')) return;

    const modalHtml = `
    <div id="auth-modal" class="auth-overlay">
        <div class="auth-container">
            <button class="auth-close" onclick="closeAuthModal()">&times;</button>
            <div class="auth-tabs">
                <button id="tab-login-btn" class="auth-tab-btn active" onclick="switchAuthTab('login')">Giriş</button>
                <button id="tab-register-btn" class="auth-tab-btn" onclick="switchAuthTab('register')">Qeydiyyat</button>
            </div>
            
            <!-- Login Form -->
            <form id="login-form" class="auth-form active" onsubmit="handleLoginSubmit(event)">
                <div class="input-group">
                    <label for="login-username">İstifadəçi adı</label>
                    <input type="text" id="login-username" placeholder="İstifadəçi adınızı daxil edin" required autocomplete="username">
                </div>
                <div class="input-group" style="margin-top: 15px;">
                    <label for="login-password">Şifrə</label>
                    <input type="password" id="login-password" placeholder="Şifrənizi daxil edin" required autocomplete="current-password">
                </div>
                <button type="submit" class="btn btn-primary" style="margin-top: 25px; width: 100%;">Daxil Ol</button>
            </form>
            
            <!-- Register Form -->
            <form id="register-form" class="auth-form" onsubmit="handleRegisterSubmit(event)">
                <div class="input-group">
                    <label for="register-username">İstifadəçi adı</label>
                    <input type="text" id="register-username" placeholder="Yeni istifadəçi adı" required autocomplete="username">
                </div>
                <div class="input-group" style="margin-top: 15px;">
                    <label for="register-password">Şifrə</label>
                    <input type="password" id="register-password" placeholder="Şifrənizi təyin edin" required autocomplete="new-password">
                </div>
                <div class="input-group" style="margin-top: 15px;">
                    <label for="register-role">Rol seçin</label>
                    <select id="register-role" required>
                        <option value="ROLE_ALICI">Alıcı (Kitab alışı və kataloq)</option>
                        <option value="ROLE_SATICI">Satıcı (Kitab əlavə etmək/redaktə)</option>
                        <option value="ROLE_ADMIN">Admin (Tam səlahiyyət)</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="margin-top: 25px; width: 100%;">Qeydiyyatdan Keç</button>
            </form>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.openAuthModal = () => {
    ensureAuthModal();
    document.getElementById('auth-modal').classList.add('active');
    switchAuthTab('login');
};

window.closeAuthModal = () => {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('active');
};

window.switchAuthTab = (tab) => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginTab = document.getElementById('tab-login-btn');
    const registerTab = document.getElementById('tab-register-btn');
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
    }
};

window.handleLoginSubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            const errData = await response.json();
            showToast('❌ Giriş uğursuzdur: ' + (errData.error || 'Username və ya şifrə yanlışdır'), 'danger');
            return;
        }
        
        const data = await response.json();
        saveUserSession(data.token, data.username, data.role);
        closeAuthModal();
        showToast('✅ Giriş uğurludur! Xoş gəldiniz, ' + data.username, 'success');
        
        // Reload admin / addbook page if they login from home, or keep them there
        const path = window.location.pathname;
        if (path.includes('admin.html') || path.includes('addbook.html')) {
            window.location.reload();
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('❌ Giriş zamanı xəta baş verdi', 'danger');
    }
};

window.handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });
        
        if (!response.ok) {
            const errData = await response.json();
            showToast('❌ Qeydiyyat xətası: ' + (errData.error || 'İstifadəçi adı artıq mövcud ola bilər'), 'danger');
            return;
        }
        
        const data = await response.json();
        saveUserSession(data.token, data.username, data.role);
        closeAuthModal();
        showToast('✅ Qeydiyyat uğurludur! Rolunuz: ' + getFriendlyRole(data.role), 'success');
        
        const path = window.location.pathname;
        if (path.includes('admin.html') || path.includes('addbook.html')) {
            window.location.reload();
        }
    } catch (error) {
        console.error('Register error:', error);
        showToast('❌ Qeydiyyat zamanı xəta baş verdi', 'danger');
    }
};

function updateHeaderAuthUI() {
    const actionsContainer = document.querySelector('.header-actions');
    if (!actionsContainer) return;
    
    const existingAuth = actionsContainer.querySelector('.header-auth-section');
    if (existingAuth) existingAuth.remove();
    
    const authDiv = document.createElement('div');
    authDiv.className = 'header-auth-section';
    authDiv.style.display = 'flex';
    authDiv.style.alignItems = 'center';
    authDiv.style.gap = '10px';
    
    if (state.user) {
        authDiv.innerHTML = `
            <div class="user-badge">
                <i class="fas fa-user"></i>
                <span>${escapeHtml(state.user.username)}</span>
                <span class="user-role-lbl">${getFriendlyRole(state.user.role)}</span>
            </div>
            <button class="btn-auth-action btn-logout-header" onclick="logoutUser()">
                <i class="fas fa-sign-out-alt"></i> Çıxış
            </button>
        `;
    } else {
        authDiv.innerHTML = `
            <button class="btn-auth-action btn-login-header" onclick="openAuthModal()">
                <i class="fas fa-sign-in-alt"></i> Giriş
            </button>
        `;
    }
    
    actionsContainer.insertBefore(authDiv, actionsContainer.firstChild);
}

window.logoutUser = () => {
    clearUserSession();
    showToast('🚪 Hesabdan çıxış edildi', 'info');
    // Redirect to index page
    const path = window.location.pathname;
    if (!path.includes('index.html') && path !== '/' && !path.endsWith('Main/') && !path.endsWith('Main')) {
        window.location.href = 'index.html';
    }
};

function applyNavigationAccess() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    
    const isSaticiOrAdmin = state.user && (state.user.role === 'ROLE_SATICI' || state.user.role === 'ROLE_ADMIN');
    const isAdmin = state.user && state.user.role === 'ROLE_ADMIN';
    const path = window.location.pathname;
    
    let linksHtml = `
        <li><a href="index.html" class="${path.includes('index.html') || path === '/' || path.endsWith('Main/') || path.endsWith('Main') ? 'active' : ''}">📚 Kataloq</a></li>
    `;
    
    if (isSaticiOrAdmin) {
        linksHtml += `
            <li><a href="addbook.html" class="${path.includes('addbook.html') ? 'active' : ''}">➕ Əlavə Et</a></li>
        `;
    }
    
    if (isAdmin) {
        linksHtml += `
            <li><a href="admin.html" class="${path.includes('admin.html') ? 'active' : ''}">⚙️ Admin</a></li>
        `;
    }
    
    navLinks.innerHTML = linksHtml;
    
    // Route guards
    if (path.includes('admin.html') && !isAdmin) {
        window.location.href = 'index.html';
    } else if (path.includes('addbook.html') && !isSaticiOrAdmin) {
        window.location.href = 'index.html';
    }
}

function handleAuthError() {
    clearUserSession();
    showToast('⚠️ Sessiya bitmişdir və ya səlahiyyətiniz yoxdur!', 'danger');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}