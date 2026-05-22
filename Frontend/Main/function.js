/**
 * BookShop Frontend Logic
 * Refactored for better performance, modularity, and premium UI interactions.
 */

// Configuration
const API_URL = 'http://localhost:8080/api/books';
const API_BASE_URL = new URL(API_URL).origin;

// State Management
const state = {
    books: [],
    cart: [],
    isEditMode: false,
    editBookId: null,
    theme: localStorage.getItem('theme') || 'dark',
    user: JSON.parse(localStorage.getItem('user')) || null
};
window.state = state;

// Initialization
const initApp = () => {
    applyTheme();
    updateCartUI();
    updateHeaderAuthUI();
    applyNavigationAccess();

    // Load categories for filters / genre badges / admin & addbook selects
    // (if backend provides /api/books/categories)
    if (typeof loadCategories === 'function') loadCategories();

    const path = window.location.pathname;
    if (path.includes('index.html') || path === '/' || path.endsWith('Main/') || path.endsWith('Main')) {
        loadBooks();
    } else if (path.includes('admin.html')) {
        checkConnection();
    } else if (path.includes('addbook.html')) {
        loadRecentBooks();
        setupImagePreview('book-image', 'image-preview', 'preview-img');
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ===== UTILS =====

const getImageUrl = (url) => {
    if (!url) return `${API_BASE_URL}/images/placeholder.png`;
    if (/^(https?:\/\/|data:)/.test(url)) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};
window.getImageUrl = getImageUrl;

const handleImageError = (img) => {
    img.src = `${API_BASE_URL}/images/placeholder.png`;
    img.onerror = null;
};
window.handleImageError = handleImageError;

const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};
window.escapeHtml = escapeHtml;

const showToast = (msg, type = 'info') => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};
window.showToast = showToast;

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
                errData = {error: `HTTP error! status: ${response.status}`};
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
        state.books = await apiRequest(`${API_URL}`);
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
        const books = await apiRequest(`${API_URL}`);
        const recent = books.slice(-5).reverse();
        renderBooks(recent);
    } catch (error) {
        console.error('Recent books load failed', error);
    }
}

// ===== CATEGORIES (populate filters and genre badges) =====
async function loadCategories() {
    try {
        // Backend endpoint (common pattern): /api/books/categories
        const cats = await apiRequest(`${API_URL}/categories`);
        if (!cats || !Array.isArray(cats)) return;

        const names = cats.map(c => (typeof c === 'string' ? c : (c.name || c.category || JSON.stringify(c))));

        // filter-category select (index)
        const filterEl = document.getElementById('filter-category');
        if (filterEl) {
            filterEl.innerHTML = '<option value="all">Bütün Kateqoriyalar</option>';
            names.forEach(n => {
                const opt = document.createElement('option');
                opt.value = n;
                opt.textContent = n;
                filterEl.appendChild(opt);
            });
        }

        // genre badges (index)
        const badges = document.getElementById('genre-badges');
        if (badges) {
            badges.innerHTML = '<button class="genre-btn active" data-genre="all">🏷️ Hamısı</button>';
            names.forEach(n => {
                const btn = document.createElement('button');
                btn.className = 'genre-btn';
                btn.dataset.genre = n;
                btn.textContent = n;
                badges.appendChild(btn);
            });
        }

        // addbook category-select
        const addSel = document.getElementById('category-select');
        if (addSel) {
            addSel.innerHTML = '<option value="" disabled selected>Kateqoriya seçin...</option>';
            names.forEach(n => {
                const opt = document.createElement('option');
                opt.value = n;
                opt.textContent = n;
                addSel.appendChild(opt);
            });
        }

        // admin category filter
        const adminSel = document.getElementById('admin-category-filter');
        if (adminSel) {
            adminSel.innerHTML = '<option value="">Bütün Kateqoriyalar</option>';
            names.forEach(n => {
                const opt = document.createElement('option');
                opt.value = n;
                opt.textContent = n;
                adminSel.appendChild(opt);
            });
        }

        // edit modal category select
        const editSel = document.getElementById('edit-category');
        if (editSel) {
            editSel.innerHTML = '';
            names.forEach(n => {
                const opt = document.createElement('option');
                opt.value = n;
                opt.textContent = n;
                editSel.appendChild(opt);
            });
        }
    } catch (error) {
        console.error('loadCategories failed', error);
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
    } catch (e) {
        console.error('Cart load err:', e);
    }
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
        if (window.openAuthModal) window.openAuthModal();
        return;
    }

    let book = bookOrId;
    if (typeof bookOrId === 'number' || typeof bookOrId === 'string') {
        book = state.books.find(b => b.id == bookOrId);
    }
    if (!book) return;

    try {
        const cartDto = await apiRequest(`${API_BASE_URL}/api/cart/add/${book.id}?quantity=1`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        syncCartState(cartDto);
        showToast("🛒 Səbətə əlavə edildi", "success");
    } catch (e) {
        console.error('addToCart error:', e);
        // Provide a clearer message for 403 (forbidden) vs other errors
        if (e && e.message && e.message.includes('403')) {
            showToast('❌ Səbətə əlavə oluna bilmədi: 403 Forbidden — Bu əməliyyat üçün kifayət qədər səlahiyyətiniz yoxdur və ya backend parametrləri tələb olunur. Lütfən hesabınızı və rolunuzu yoxlayın (daxil olunmuş olmalısınız).', 'danger');
        } else {
            showToast(`❌ Səbətə əlavə oluna bilmədi: ${e.message || 'Naməlum xəta'}`, "danger");
        }
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
        const cartDto = await apiRequest(`${API_BASE_URL}/api/cart/remove/${id}`, {method: 'DELETE'});
        syncCartState(cartDto);
    } catch (e) {
        console.error('Remove item failed', e);
    }
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
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(orderRequestData)
        });

        if (responseData && responseData.id) {
            showToast('🎉 Sifarişiniz uğurla qəbul edildi!', 'success');

            // Səbəti backend-dən təmizlə
            try {
                await apiRequest(`${API_BASE_URL}/api/cart/clear`, {method: 'DELETE'});
                state.cart = [];
                updateCartUI();
            } catch (e) {
                console.error('Cart clear failed', e);
            }

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
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error();
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
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(bookData)
        });

        if (savedBook && savedBook.id) {
            if (imageFile) {
                await uploadImageToBackend(savedBook.id, imageFile);
            }
            showToast('✅ Kitab uğurla əlavə edildi', 'success');
            return {success: true};
        }
        return {success: false, message: 'Xəta baş verdi'};
    } catch (error) {
        showToast('❌ Kitab əlavə edilərkən xəta baş verdi', 'danger');
        return {success: false};
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
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        showToast('✅ Yeniləndi', 'success');
        return {success: true};
    } catch (error) {
        showToast('❌ Yeniləmə xətası', 'danger');
        return {success: false};
    }
};

// ===== AUTHENTICATION & SECURITY SYSTEM =====

function saveUserSession(token, username, role, id) {
    state.user = {token, username, role, id};
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
        case 'Admin':
            return 'Admin';
        case 'Owner':
            return 'Satıcı';
        case 'User':
            return 'Alıcı';
        default:
            return role;
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
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
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
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
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

    const isSaticiOrAdmin = state.user && (state.user.role === 'Owner' || state.user.role === 'Admin');
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

// User Profile Modal System (Using /api/users/me or localStorage fallback)
function ensureProfileModal() {
    if (document.getElementById('profile-modal')) return;

    const modalHtml = `
    <div id="profile-modal" class="auth-overlay">
        <div class="auth-container" style="max-width: 600px; width: 95%;">
            <button class="auth-close" onclick="closeProfileModal()">&times;</button>
            <div class="section-title" style="font-size: 1.5rem; margin-bottom: 25px;">
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

    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    document.getElementById('profile-modal').classList.add('active');

    try {
        // Fetch full user details from backend using username
        let userDetails = {...state.user};

        if (state.user && state.user.username) {
            try {
                const fullUserData = await apiRequest(`${API_BASE_URL}/api/users/${state.user.username}`);
                if (fullUserData) {
                    userDetails = {...userDetails, ...fullUserData};
                }
            } catch (e) {
                console.warn('Could not load full user details from backend, using cached data', e);
                // Fallback to state.user if backend call fails
            }
        }

        // Map phoneNumber to phone for display
        const phone = userDetails.phoneNumber || userDetails.phone;

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <!-- Username -->
                <div style="display: flex; justify-content: space-between; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; border-left: 3px solid var(--primary);">
                    <span style="color: var(--text-muted);"><i class="fas fa-user"></i> İstifadəçi adı:</span>
                    <strong style="color: var(--text-main);">@${escapeHtml(userDetails.username)}</strong>
                </div>

                <!-- Email -->
                <div style="display: flex; justify-content: space-between; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; border-left: 3px solid var(--success);">
                    <span style="color: var(--text-muted);"><i class="fas fa-envelope"></i> E-mail:</span>
                    <strong style="color: var(--text-main);">${escapeHtml(userDetails.email || 'Qeyd olunmamış')}</strong>
                </div>

                <!-- Full Name -->
                <div style="display: flex; justify-content: space-between; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; border-left: 3px solid var(--success);">
                    <span style="color: var(--text-muted);"><i class="fas fa-id-card"></i> Tam ad:</span>
                    <strong style="color: var(--text-main);">${escapeHtml(userDetails.fullName || 'Qeyd olunmamış')}</strong>
                </div>

                <!-- Phone -->
                <div style="display: flex; justify-content: space-between; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; border-left: 3px solid var(--info);">
                    <span style="color: var(--text-muted);"><i class="fas fa-phone"></i> Telefon:</span>
                    <strong style="color: var(--text-main);">${escapeHtml(phone || 'Qeyd olunmamış')}</strong>
                </div>

                <!-- Address -->
                <div style="display: flex; justify-content: space-between; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; border-left: 3px solid var(--info);">
                    <span style="color: var(--text-muted);"><i class="fas fa-map-marker-alt"></i> Ünvan:</span>
                    <strong style="color: var(--text-main);">${escapeHtml(userDetails.address || 'Qeyd olunmamış')}</strong>
                </div>

                <!-- Separator -->
                <hr style="border: none; border-top: 1px solid var(--border); margin: 20px 0;">

                <!-- Actions -->
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" id="edit-profile-btn" style="flex: 1;">
                        <i class="fas fa-edit"></i> Redaktə Et
                    </button>
                    <button class="btn btn-secondary" onclick="closeProfileModal()" style="flex: 1;">
                        <i class="fas fa-times"></i> Bağla
                    </button>
                </div>
            </div>
        `;

        const editBtn = container.querySelector('#edit-profile-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                renderProfileEditForm(userDetails, phone);
            });
        }
    } catch (error) {
        console.error('Profile loading error:', error);
        container.innerHTML = `<div class="empty" style="text-align: center; padding: 30px; color: var(--danger);">❌ Profil məlumatları yüklənə bilmədi</div>`;
    }
};

function renderProfileEditForm(userDetails, phone) {
    const container = document.getElementById('user-profile-details');
    if (!container) return;

    container.innerHTML = `
        <form id="edit-profile-form" style="display: flex; flex-direction: column; gap: 15px;">
            <!-- Username (Disabled) -->
            <div class="input-group">
                <label style="font-weight: 600; color: var(--text-muted);"><i class="fas fa-user"></i> İstifadəçi adı</label>
                <input type="text" value="@${escapeHtml(userDetails.username)}" disabled style="opacity: 0.6; cursor: not-allowed; width: 100%;">
            </div>

            <!-- Full Name -->
            <div class="input-group">
                <label style="font-weight: 600; color: var(--text-muted);"><i class="fas fa-id-card"></i> Tam ad</label>
                <input type="text" id="profile-fullName" value="${escapeHtml(userDetails.fullName || '')}" placeholder="Tam adınızı daxil edin" style="width: 100%;">
            </div>

            <!-- Email -->
            <div class="input-group">
                <label style="font-weight: 600; color: var(--text-muted);"><i class="fas fa-envelope"></i> E-mail</label>
                <input type="email" id="profile-email" value="${escapeHtml(userDetails.email || '')}" placeholder="E-mail ünvanınızı daxil edin" style="width: 100%;">
            </div>

            <!-- Phone -->
            <div class="input-group">
                <label style="font-weight: 600; color: var(--text-muted);"><i class="fas fa-phone"></i> Telefon</label>
                <input type="text" id="profile-phone" value="${escapeHtml(phone || '')}" placeholder="Telefon nömrənizi daxil edin" style="width: 100%;">
            </div>

            <!-- Address -->
            <div class="input-group">
                <label style="font-weight: 600; color: var(--text-muted);"><i class="fas fa-map-marker-alt"></i> Ünvan</label>
                <input type="text" id="profile-address" value="${escapeHtml(userDetails.address || '')}" placeholder="Ünvanınızı daxil edin" style="width: 100%;">
            </div>

            <!-- Separator -->
            <hr style="border: none; border-top: 1px solid var(--border); margin: 15px 0;">

            <!-- Actions -->
            <div style="display: flex; gap: 10px;">
                <button type="submit" class="btn btn-primary" style="flex: 1;">
                    <i class="fas fa-save"></i> Yadda Saxla
                </button>
                <button type="button" class="btn btn-secondary" id="cancel-profile-edit" style="flex: 1;">
                    <i class="fas fa-times"></i> Ləğv Et
                </button>
            </div>
        </form>
    `;

    const form = container.querySelector('#edit-profile-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('profile-fullName').value.trim();
        const email = document.getElementById('profile-email').value.trim();
        const phoneNumber = document.getElementById('profile-phone').value.trim();
        const address = document.getElementById('profile-address').value.trim();

        try {
            const updated = await apiRequest(`${API_BASE_URL}/api/users/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, phoneNumber, address })
            });

            if (updated) {
                showToast('✅ Profil məlumatları yeniləndi', 'success');
                // Reload profile modal to view mode with updated data
                window.openProfileModal();
            }
        } catch (err) {
            console.error('Profile update failed:', err);
            showToast('❌ Yeniləmə xətası: ' + (err.message || 'Məlumatlar yadda saxlanıla bilmədi'), 'danger');
        }
    });

    const cancelBtn = container.querySelector('#cancel-profile-edit');
    cancelBtn.addEventListener('click', () => {
        window.openProfileModal();
    });
}

window.closeProfileModal = () => {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.classList.remove('active');
};

// ===== BOOK DETAILS MODAL =====
window.openBookDetails = async (bookId) => {
    const modal = document.getElementById('details-modal');
    if (!modal) return;

    let book = state.books.find(b => b.id == bookId);
    if (!book) {
        try {
            book = await apiRequest(`${API_URL}/${bookId}`);
        } catch (e) {
            showToast('❌ Kitab məlumatı yüklənə bilmədi', 'danger');
            return;
        }
    }
    if (!book) return;

    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };
    const img = document.getElementById('modal-book-img');
    if (img) {
        img.src = getImageUrl(book.imageUrl);
        img.onerror = () => handleImageError(img);
    }
    set('modal-book-category', book.category || '');
    set('modal-book-title', book.title || '');
    set('modal-book-author', book.author || '');
    set('modal-book-pages', book.pages || 0);
    set('modal-book-year', book.year || 0);
    set('modal-book-price', `${(book.price || 0).toFixed(2)} ₼`);
    const desc = document.getElementById('modal-book-desc');
    if (desc) desc.textContent = book.description ||
        'Bu kitab haqqında ətraflı məlumat tezliklə əlavə olunacaq.';

    const addBtn = document.getElementById('modal-add-cart-btn');
    if (addBtn) addBtn.onclick = () => window.addToCart(book);

    modal.style.display = 'flex';
};

// ===== ADMIN PANEL =====
window.loadAdminBooks = async () => {
    const container = document.getElementById('admin-books-container');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    const search = document.getElementById('admin-search')?.value || '';
    const category = document.getElementById('admin-category-filter')?.value || '';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);

    try {
        const queryStr = params.toString() ? `?${params.toString()}` : '';
        const books = await apiRequest(`${API_URL}${queryStr}`);

        const totalEl = document.getElementById('total-books');
        if (totalEl) totalEl.textContent = books.length;

        if (!books || books.length === 0) {
            container.innerHTML = '<div class="empty">📚 Heç bir kitab tapılmadı</div>';
            return;
        }

        let html = `<table class="admin-table"><thead><tr>
            <th>Şəkil</th><th>Ad</th><th>Müəllif</th><th>Kateqoriya</th>
            <th>Qiymət</th><th>Stok</th><th>Əməliyyat</th></tr></thead><tbody>`;
        books.forEach(b => {
            html += `<tr>
                <td><img src="${getImageUrl(b.imageUrl)}" onerror="handleImageError(this)" style="width:50px;height:65px;object-fit:cover;border-radius:6px"></td>
                <td>${escapeHtml(b.title)}</td>
                <td>${escapeHtml(b.author)}</td>
                <td><span class="badge">${escapeHtml(b.category)}</span></td>
                <td>${(b.price || 0).toFixed(2)} ₼</td>
                <td>${b.stockQuantity || 0}</td>
                <td>
                    <button class="btn btn-secondary btn-edit-book" data-id="${b.id}">✏️</button>
                    <button class="btn btn-secondary btn-delete-book" data-id="${b.id}">🗑️</button>
                </td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;

        container.querySelectorAll('.btn-edit-book').forEach(btn => {
            btn.addEventListener('click', () => {
                const book = books.find(x => x.id == btn.dataset.id);
                if (book) window.openEditModal(book);
            });
        });
        container.querySelectorAll('.btn-delete-book').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Bu kitabı silmək istədiyinizə əminsiniz?')) return;
                try {
                    await apiRequest(`${API_URL}/${btn.dataset.id}`, {method: 'DELETE'});
                    showToast('🗑️ Kitab silindi', 'success');
                    window.loadAdminBooks();
                } catch (e) {
                    showToast('❌ Silinmə xətası', 'danger');
                }
            });
        });
    } catch (e) {
        container.innerHTML = '<div class="empty">❌ Kitablar yüklənə bilmədi</div>';
    }
};

window.loadAdminUsers = async () => {
    const container = document.getElementById('admin-users-container');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    try {
        const users = await apiRequest(`${API_BASE_URL}/api/users`);
        if (!users || users.length === 0) {
            container.innerHTML = '<div class="empty">👥 İstifadəçi yoxdur</div>';
            return;
        }
        let html = `<table class="admin-table"><thead><tr>
            <th>ID</th><th>İstifadəçi adı</th><th>Rol</th><th>Email</th><th>Tam ad</th></tr></thead><tbody>`;
        users.forEach(u => {
            html += `<tr>
                <td>${u.id}</td>
                <td>@${escapeHtml(u.username)}</td>
                <td><span class="badge">${getFriendlyRole(u.role)}</span></td>
                <td>${escapeHtml(u.email || '-')}</td>
                <td>${escapeHtml(u.fullName || '-')}</td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '<div class="empty">❌ İstifadəçilər yüklənə bilmədi (Yalnız Admin)</div>';
    }
};

window.loadAdminOrders = async () => {
    const container = document.getElementById('admin-orders-container');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    try {
        const orders = await apiRequest(`${API_BASE_URL}/api/orders`);
        if (!orders || orders.length === 0) {
            container.innerHTML = '<div class="empty">📦 Sifariş yoxdur</div>';
            return;
        }
        let html = `<table class="admin-table"><thead><tr>
            <th>ID</th><th>İstifadəçi</th><th>Məbləğ</th><th>Status</th><th>Tarix</th><th>Əməliyyat</th></tr></thead><tbody>`;
        orders.forEach(o => {
            const date = o.createdAt ? new Date(o.createdAt).toLocaleString('az-AZ') : '-';
            
            let actionButtons = '';
            if (o.status === 'PENDING') {
                actionButtons = `
                    <div class="order-action-buttons">
                        <button class="btn-order-action btn-order-complete" data-id="${o.id}" data-status="COMPLETED" title="Tamamla">
                            <i class="fas fa-check"></i> Tamamla
                        </button>
                        <button class="btn-order-action btn-order-cancel" data-id="${o.id}" data-status="CANCELLED" title="Ləğv et">
                            <i class="fas fa-times"></i> Ləğv et
                        </button>
                    </div>
                `;
            } else if (o.status === 'COMPLETED') {
                actionButtons = `
                    <div class="order-action-buttons">
                        <button class="btn-order-action btn-order-revert" data-id="${o.id}" data-status="PENDING" title="Gözlət">
                            <i class="fas fa-undo"></i> Gözlət
                        </button>
                        <button class="btn-order-action btn-order-cancel" data-id="${o.id}" data-status="CANCELLED" title="Ləğv et">
                            <i class="fas fa-times"></i> Ləğv et
                        </button>
                    </div>
                `;
            } else if (o.status === 'CANCELLED') {
                actionButtons = `
                    <div class="order-action-buttons">
                        <button class="btn-order-action btn-order-revert" data-id="${o.id}" data-status="PENDING" title="Gözlət">
                            <i class="fas fa-undo"></i> Gözlət
                        </button>
                        <button class="btn-order-action btn-order-complete" data-id="${o.id}" data-status="COMPLETED" title="Tamamla">
                            <i class="fas fa-check"></i> Tamamla
                        </button>
                    </div>
                `;
            } else {
                actionButtons = `
                    <div class="order-action-buttons">
                        <button class="btn-order-action btn-order-complete" data-id="${o.id}" data-status="COMPLETED" title="Tamamla">
                            <i class="fas fa-check"></i> Tamamla
                        </button>
                        <button class="btn-order-action btn-order-cancel" data-id="${o.id}" data-status="CANCELLED" title="Ləğv et">
                            <i class="fas fa-times"></i> Ləğv et
                        </button>
                    </div>
                `;
            }

            html += `<tr>
                <td>#${o.id}</td>
                <td>${escapeHtml(o.username || ('User#' + o.userId))}</td>
                <td><strong>${(o.totalPrice || 0).toFixed(2)} ₼</strong></td>
                <td><span class="badge">${escapeHtml(o.status || 'PENDING')}</span></td>
                <td>${date}</td>
                <td>${actionButtons}</td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;

        container.querySelectorAll('.btn-order-action').forEach(btn => {
            btn.addEventListener('click', async () => {
                const status = btn.dataset.status;
                const orderId = btn.dataset.id;
                try {
                    await apiRequest(`${API_BASE_URL}/api/orders/${orderId}/status?status=${status}`, {method: 'PUT'});
                    showToast('✅ Status yeniləndi', 'success');
                    window.loadAdminOrders();
                } catch (e) {
                    showToast('❌ Status yenilənə bilmədi', 'danger');
                }
            });
        });
    } catch (e) {
        container.innerHTML = '<div class="empty">❌ Sifarişlər yüklənə bilmədi</div>';
    }
};
