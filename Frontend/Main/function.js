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
    cart: [],
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
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        document.documentElement.setAttribute('data-theme', 'light');
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
            // 401 Unauthorized means token expired/invalid. 
            // 403 Forbidden means insufficient permissions (should not log out).
            if (response.status === 401) {
                handleAuthError();
            }
            
            let errData = {};
            try {
                errData = await response.json();
            } catch (e) {
                errData = { error: `HTTP error! status: ${response.status}` };
            }
            
            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
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
        selectRandomSpotlightBook();
    } catch (error) {
        showToast('❌ Kitabları yükləmək mümkün olmadı', 'danger');
    }
}

function selectRandomSpotlightBook() {
    const spotlightCard = document.getElementById('spotlight-book-card');
    if (!spotlightCard) return;
    
    if (state.books && state.books.length > 0) {
        const randomIndex = Math.floor(Math.random() * state.books.length);
        const book = state.books[randomIndex];
        
        const img = document.getElementById('spotlight-img');
        const title = document.getElementById('spotlight-title');
        const author = document.getElementById('spotlight-author');
        const price = document.getElementById('spotlight-price');
        
        if (img) img.src = getImageUrl(book.imageUrl);
        if (title) title.textContent = book.title;
        if (author) author.textContent = book.author;
        if (price) price.textContent = `${book.price.toFixed(2)} ₼`;
        
        spotlightCard.style.display = 'block';
        
        spotlightCard.onclick = () => {
            if (window.openBookDetails) {
                window.openBookDetails(book.id);
            }
        };
    } else {
        spotlightCard.style.display = 'none';
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
    div.style.cursor = 'pointer';
    div.onclick = (e) => {
        if (!e.target.closest('.btn-add-cart')) {
            if (typeof window.openBookDetails === 'function') {
                window.openBookDetails(book.id);
            }
        }
    };
    
    const bookImage = getImageUrl(book.imageUrl);
    const price = book.price ? book.price.toFixed(2) : "0.00";

    div.innerHTML = `
        <div class="book-image-container">
            <img src="${bookImage}" alt="${escapeHtml(book.title)}" class="book-image" onerror="handleImageError(this)">
            <div class="book-overlay">
                <button class="btn btn-primary btn-add-cart">
                    <i class="fas fa-shopping-cart"></i> Səbətə at
                </button>
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
                <span class="view-detail-link" style="color: var(--primary); font-size: 0.85rem; font-weight: 600;"><i class="fas fa-eye"></i> Ətraflı</span>
            </div>
        </div>
    `;

    const cartBtn = div.querySelector('.btn-add-cart');
    if (cartBtn) {
        cartBtn.onclick = (e) => {
            e.stopPropagation();
            addToCart(book);
        };
    }

    return div;
}

// ===== CART LOGIC =====

async function fetchServerCart() {
    if (!state.user) return;
    try {
        const cartDto = await apiRequest(`${API_BASE_URL}/api/cart`);
        syncCartState(cartDto);
    } catch(e) { console.error('Cart load err:', e); }
}

function syncCartState(cartDto) {
    if (!cartDto || !cartDto.items) {
        state.cart = [];
    } else {
        state.cart = cartDto.items.map(item => ({
            id: item.bookId,
            title: item.title,
            price: item.price,
            quantity: item.quantity
        }));
    }
    updateCartUI();
}

window.addToCart = async (bookOrId) => {
    if (!state.user) {
        showToast('Səbətə əlavə etmək üçün lütfən daxil olun', 'warning');
        if(window.openAuthModal) window.openAuthModal();
        return;
    }
    
    let book = bookOrId;
    if (typeof bookOrId === 'number' || typeof bookOrId === 'string') {
        book = state.books.find(b => b.id == bookOrId);
    }
    if (!book) return;

    try {
        const cartDto = await apiRequest(`${API_BASE_URL}/api/cart/add/${book.id}?quantity=1`, { method: 'POST' });
        syncCartState(cartDto);
        showToast("🛒 Səbətə əlavə edildi", "success");
    } catch(e) {
        showToast("Xəta baş verdi", "danger");
    }
};

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
                    <h4>${escapeHtml(item.title)}</h4>
                    <p>${item.quantity} x ${item.price.toFixed(2)} ₼</p>
                </div>
                <button class="btn btn-secondary" onclick="removeFromCart('${item.id}')">✕</button>
            `;
            cartList.appendChild(li);
        });
        
        const cartTotal = document.getElementById('cart-total');
        if (cartTotal) cartTotal.textContent = total.toFixed(2) + " ₼";
    }
}

window.removeFromCart = async (id) => {
    if (!state.user) return;
    try {
        const cartDto = await apiRequest(`${API_BASE_URL}/api/cart/remove/${id}`, { method: 'DELETE' });
        syncCartState(cartDto);
    } catch(e) { console.error('Remove item failed', e); }
};

window.checkoutOrder = async () => {
    if (!state.user) {
        showToast('⚠️ Sifariş vermək üçün lütfən daxil olun!', 'warning');
        window.openAuthModal();
        return;
    }
    
    if (state.cart.length === 0) {
        showToast('🛒 Səbətiniz boşdur!', 'warning');
        return;
    }
    
    const userId = state.user.id;
    if (!userId) {
        showToast('❌ İstifadəçi məlumatı tam deyil. Lütfən yenidən daxil olun.', 'danger');
        return;
    }
    
    const items = state.cart.map(item => ({
        bookId: item.id.toString(),
        quantity: item.quantity
    }));
    
    try {
        const orderRequestData = {
            userId: userId,
            items: items
        };
        
        const responseData = await apiRequest(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderRequestData)
        });
        
        if (responseData && responseData.id) {
            showToast('🎉 Sifarişiniz uğurla qəbul edildi!', 'success');
            
            // Səbəti backend-dən təmizlə
            try {
                await apiRequest(`${API_BASE_URL}/api/cart/clear`, { method: 'DELETE' });
                state.cart = [];
                updateCartUI();
            } catch(e) { console.error('Cart clear failed', e); }
            
            // Close cart panel if open
            const cartPanel = document.getElementById('cart-panel');
            if (cartPanel) cartPanel.classList.remove('open');
        } else if (responseData && responseData.error) {
            showToast('❌ Xəta: ' + responseData.error, 'danger');
        } else {
            showToast('❌ Sifariş yerləşdirilərkən xəta baş verdi', 'danger');
        }
    } catch (error) {
        console.error('Order creation error:', error);
        // The error.message now contains the actual backend response (e.g. Stok xətası)
        showToast('❌ ' + error.message, 'danger');
    }
};

// ===== SEARCH & FILTERS =====

let filterTimeout;
window.applyFiltersAndSort = () => {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(async () => {
        const search = document.getElementById('search-input')?.value || '';
        const category = document.getElementById('filter-category')?.value || 'all';
        const sort = document.getElementById('sort-books')?.value || 'default';

        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (category && category !== 'all') params.append('category', category);
        if (sort && sort !== 'default') params.append('sort', sort);

        const bookList = document.getElementById('book-list');
        if (bookList) {
            bookList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
        }

        try {
            const queryStr = params.toString() ? `?${params.toString()}` : '';
            const filteredBooks = await apiRequest(`${API_URL}${queryStr}`);
            renderBooks(filteredBooks);
        } catch (error) {
            console.error('Filtering books failed:', error);
            showToast('❌ Kitabları axtarmaq mümkün olmadı', 'danger');
        }
    }, 300);
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
    document.getElementById('edit-stockQuantity').value = book.stockQuantity || 0;
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

function saveUserSession(token, username, role, id) {
    state.user = { token, username, role, id };
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
        case 'ROLE_USER':
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

function showAuthAnimation(type, username, role) {
    const existing = document.getElementById('auth-animation-overlay');
    if (existing) existing.remove();
    
    let html = '';
    if (type === 'login') {
        html = `
        <div id="auth-animation-overlay" class="auth-anim-overlay">
            <div class="auth-anim-card">
                <div class="auth-anim-icon login-success">
                    <i class="fas fa-check-circle"></i>
                    <div class="sparkles">
                        <span></span><span></span><span></span><span></span>
                    </div>
                </div>
                <div class="auth-anim-title">Xoş Gəldiniz!</div>
                <div class="auth-anim-subtitle">@${escapeHtml(username)}</div>
                <div class="auth-anim-badge">${getFriendlyRole(role)}</div>
            </div>
        </div>
        `;
    } else {
        html = `
        <div id="auth-animation-overlay" class="auth-anim-overlay">
            <div class="auth-anim-card">
                <div class="auth-anim-icon logout-success">
                    <i class="fas fa-door-open"></i>
                    <div class="sparkles">
                        <span></span><span></span><span></span><span></span>
                    </div>
                </div>
                <div class="auth-anim-title">Görüşənədək!</div>
                <div class="auth-anim-subtitle">Sessiyanız uğurla sonlandırıldı.</div>
                <div class="auth-anim-badge" style="background: rgba(239, 68, 68, 0.1); color: var(--danger);">Çıxış Edildi</div>
            </div>
        </div>
        `;
    }
    
    document.body.insertAdjacentHTML('beforeend', html);
    const overlay = document.getElementById('auth-animation-overlay');
    
    // Trigger reflow to start transition
    overlay.offsetHeight;
    overlay.classList.add('active');
    
    return new Promise(resolve => {
        setTimeout(() => {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
                resolve();
            }, 500);
        }, 2200);
    });
}

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
        closeAuthModal();
        
        // Play login success animation
        await showAuthAnimation('login', data.username, data.role);
        
        saveUserSession(data.token, data.username, data.role, data.id);
        
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
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            const errData = await response.json();
            showToast('❌ Qeydiyyat xətası: ' + (errData.error || 'İstifadəçi adı artıq mövcud ola bilər'), 'danger');
            return;
        }
        
        const data = await response.json();
        closeAuthModal();
        
        // Play login success animation
        await showAuthAnimation('login', data.username, data.role);
        
        saveUserSession(data.token, data.username, data.role, data.id);
        
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
        fetchServerCart();
        authDiv.innerHTML = `
            <button class="btn-auth-action btn-orders-header" onclick="openProfileModal()">
                <i class="fas fa-id-card"></i> Profil
            </button>
            <button class="btn-auth-action btn-orders-header" onclick="openOrdersModal()">
                <i class="fas fa-box"></i> Sifarişlərim
            </button>
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

window.logoutUser = async () => {
    // Play logout animation first
    await showAuthAnimation('logout');
    
    clearUserSession();
    showToast('🚪 Hesabdan çıxış edildi', 'info');
    
    const path = window.location.pathname;
    if (!path.includes('index.html') && path !== '/' && !path.endsWith('Main/') && !path.endsWith('Main')) {
        window.location.href = 'index.html';
    }
};

function applyNavigationAccess() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    
    const isSaticiOrAdmin = state.user && (state.user.role === 'ROLE_SATICI' || state.user.role === 'ROLE_ADMIN');
    const path = window.location.pathname;
    
    let linksHtml = `
        <li><a href="index.html" class="${path.includes('index.html') || path === '/' || path.endsWith('Main/') || path.endsWith('Main') ? 'active' : ''}">📚 Kataloq</a></li>
    `;
    
    if (isSaticiOrAdmin) {
        linksHtml += `
            <li><a href="addbook.html" class="${path.includes('addbook.html') ? 'active' : ''}">➕ Əlavə Et</a></li>
            <li><a href="admin.html" class="${path.includes('admin.html') ? 'active' : ''}">⚙️ Admin</a></li>
        `;
    }
    
    navLinks.innerHTML = linksHtml;
    
    // Route guards
    if (path.includes('admin.html') && !isSaticiOrAdmin) {
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

// User Orders History Modal System
function ensureOrdersModal() {
    if (document.getElementById('orders-modal')) return;

    const modalHtml = `
    <div id="orders-modal" class="auth-overlay">
        <div class="auth-container" style="max-width: 700px; width: 95%;">
            <button class="auth-close" onclick="closeOrdersModal()">&times;</button>
            <div class="section-title" style="font-size: 1.5rem; margin-bottom: 20px;">
                <i class="fas fa-box-open" style="color: var(--primary);"></i> Sifarişlərim
            </div>
            <div id="user-orders-list" style="max-height: 450px; overflow-y: auto; padding-right: 5px;">
                <!-- Orders will be injected here -->
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.openOrdersModal = async () => {
    if (!state.user) {
        showToast('⚠️ Lütfən daxil olun', 'warning');
        return;
    }
    ensureOrdersModal();
    
    const container = document.getElementById('user-orders-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    document.getElementById('orders-modal').classList.add('active');
    
    try {
        const orders = await apiRequest(`${API_BASE_URL}/api/orders/user/${state.user.id}`);
        if (!orders || orders.length === 0) {
            container.innerHTML = '<div class="empty" style="text-align: center; padding: 30px; color: var(--text-muted);">📦 Hələ ki heç bir sifarişiniz yoxdur.</div>';
            return;
        }
        
        container.innerHTML = orders.map(order => {
            const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString('az-AZ') : 'Bilinmir';
            const orderBooks = order.items && order.items.length > 0
                ? order.items.map(item => `<div class="user-order-book-item">📖 ${escapeHtml(item.title)} (${item.quantity} ədəd) - ${item.unitPrice.toFixed(2)} ₼</div>`).join('')
                : 'Kitab yoxdur';
            
            let statusBadgeColor = 'background: rgba(245, 158, 11, 0.1); color: var(--warning);';
            let statusText = 'Gözləyir';
            if (order.status === 'COMPLETED') {
                statusBadgeColor = 'background: rgba(34, 197, 94, 0.1); color: var(--success);';
                statusText = 'Tamamlandı';
            } else if (order.status === 'CANCELLED') {
                statusBadgeColor = 'background: rgba(239, 68, 68, 0.1); color: var(--danger);';
                statusText = 'Ləğv edildi';
            }
            
            return `
                <div class="user-order-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-weight: 600; font-size: 0.95rem; color: var(--text-muted);">Sifariş <code style="color: var(--primary);">#${order.id}</code></span>
                        <span class="badge" style="${statusBadgeColor}">${statusText}</span>
                    </div>
                    <div style="margin-bottom: 12px; font-size: 0.9rem;">
                        ${orderBooks}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 10px; font-size: 0.9rem;">
                        <span style="color: var(--text-muted);">${orderDate}</span>
                        <span>Cəmi: <strong style="color: var(--primary); font-size: 1.1rem;">${order.totalPrice.toFixed(2)} ₼</strong></span>
                    </div>
                </div>
            `;
        }).reverse().join('');
    } catch (error) {
        let errorMsg = 'Sifarişləri yükləmək mümkün olmadı.';
        if (error.message && error.message.includes('403')) {
            errorMsg = 'Sifarişlərə baxmaq üçün qadağa qoyulub (Yalnız Alıcı rolu tələb olunur).';
        } else if (error.message) {
            errorMsg = error.message;
        }
        container.innerHTML = `<div class="empty" style="text-align: center; padding: 30px; color: var(--danger);">❌ ${escapeHtml(errorMsg)}</div>`;
    }
};

window.closeOrdersModal = () => {
    const modal = document.getElementById('orders-modal');
    if (modal) modal.classList.remove('active');
};

// User Profile Modal System (Using /api/users/{username})
function ensureProfileModal() {
    if (document.getElementById('profile-modal')) return;

    const modalHtml = `
    <div id="profile-modal" class="auth-overlay">
        <div class="auth-container" style="max-width: 500px; width: 95%;">
            <button class="auth-close" onclick="closeProfileModal()">&times;</button>
            <div class="section-title" style="font-size: 1.5rem; margin-bottom: 20px;">
                <i class="fas fa-user-circle" style="color: var(--primary);"></i> Mənim Profilim
            </div>
            <div id="user-profile-details" style="padding: 10px;">
                <!-- Profile details will be injected here -->
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.openProfileModal = async () => {
    if (!state.user) {
        showToast('⚠️ Lütfən daxil olun', 'warning');
        return;
    }
    ensureProfileModal();
    
    const container = document.getElementById('user-profile-details');
    if (!container) return;
    
    document.getElementById('profile-modal').classList.add('active');
    
    // Backenddə /api/users/{username} endpointinin SecurityConfig-i "Ant pattern" əvəzinə
    // literal "{username}" stringini axtardığı üçün normal istifadəçilərə 403 xətası verir.
    // Buna görə məlumatları birbaşa state (localStorage) üzərindən oxuyuruq.
    const userDetails = state.user;
    
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <div style="display: flex; justify-content: space-between; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                <span style="color: var(--text-muted);"><i class="fas fa-fingerprint"></i> ID:</span>
                <strong style="color: var(--text-main);">${userDetails.id}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                <span style="color: var(--text-muted);"><i class="fas fa-user"></i> İstifadəçi adı:</span>
                <strong style="color: var(--text-main);">@${escapeHtml(userDetails.username)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                <span style="color: var(--text-muted);"><i class="fas fa-shield-alt"></i> Səlahiyyət (Rol):</span>
                <span class="badge" style="background: rgba(99, 102, 241, 0.1); color: var(--primary); font-size: 1rem;">
                    ${getFriendlyRole(userDetails.role)}
                </span>
            </div>
        </div>
    `;
};

window.closeProfileModal = () => {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.classList.remove('active');
};