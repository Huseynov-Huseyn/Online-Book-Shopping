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
    theme: localStorage.getItem('theme') || 'dark'
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
        const response = await fetch(endpoint, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
        const response = await fetch(`${API_URL}/${bookId}/upload-image`, {
            method: 'POST',
            body: formData
        });
        return response.ok;
    } catch (error) {
        console.error('Image upload failed', error);
        return false;
    }
}

window.submitBookForm = async (bookData, imageFile) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData)
        });

        if (response.ok) {
            const savedBook = await response.json();
            if (imageFile && savedBook.id) {
                await uploadImageToBackend(savedBook.id, imageFile);
            }
            showToast('✅ Kitab uğurla əlavə edildi', 'success');
            return { success: true };
        }
        return { success: false, message: 'Xəta baş verdi' };
    } catch (error) {
        showToast('❌ Bağlantı xətası', 'danger');
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