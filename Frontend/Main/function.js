const API_URL = 'http://localhost:8080/api/books';
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// ===== ÜMUMİ FUNKSIYALAR =====

// Toast Mesajı
let toastContainer = null;
function showToast(msg) {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    toastContainer.appendChild(t);
    setTimeout(() => t.remove(), 2000);
}

// XSS Qoruması
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== SƏBƏT FUNKSIYALARI =====

window.addToCart = (book) => {
    const found = cart.find(item => item.id === book.id);
    found ? found.quantity++ : cart.push({ ...book, quantity: 1 });
    saveCart();
    updateCartUI();
    showToast("🛒 Səbətə atıldı");
};

function updateCartUI() {
    const cartList = document.getElementById('cart-list');
    const cartTotalElement = document.getElementById('cart-total');
    const cartCountElement = document.getElementById('cart-count');

    if (cartList) cartList.innerHTML = '';
    let total = 0, count = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        count += item.quantity;
        if (cartList) {
            const li = document.createElement('li');
            li.innerHTML = `${item.title} (x${item.quantity}) <span>${(item.price * item.quantity).toFixed(2)} ₼ <button onclick="removeFromCart('${item.id}')">X</button></span>`;
            cartList.appendChild(li);
        }
    });

    if (cartTotalElement) cartTotalElement.textContent = total.toFixed(2) + " ₼";
    if (cartCountElement) cartCountElement.textContent = count;
}

window.removeFromCart = (id) => {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
};

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// ===== INDEX.HTML FUNKSIYALARI =====

// LocalStorage İdarəetmə
function saveToLocal(book) {
    let books = JSON.parse(localStorage.getItem('books')) || [];
    books.push(book);
    localStorage.setItem('books', JSON.stringify(books));
}

function updateInLocal(book) {
    let books = JSON.parse(localStorage.getItem('books')) || [];
    const idx = books.findIndex(b => b.id === book.id);
    if (idx !== -1) books[idx] = book;
    localStorage.setItem('books', JSON.stringify(books));
}

window.deleteBook = (id) => {
    if (confirm("Silinsin?")) {
        let books = JSON.parse(localStorage.getItem('books')).filter(b => b.id !== id);
        localStorage.setItem('books', JSON.stringify(books));
        cart = cart.filter(item => item.id !== id);
        saveCart();
        refreshUI();
        updateCartUI();
    }
};

window.editBook = (book) => {
    document.getElementById('title').value = book.title;
    document.getElementById('author').value = book.author;
    document.getElementById('category-select').value = book.category;
    document.getElementById('pages').value = book.pages;
    document.getElementById('year').value = book.year;
    document.getElementById('price').value = book.price;
    document.getElementById('add-btn').textContent = "Yenilə";
    isEditMode = true;
    editBookId = book.id;
    window.scrollTo(0, 0);
};

function refreshUI() {
    bookList.innerHTML = '';
    loadBooksFromBackend();
}

async function loadBooksFromBackend() {
    try {
        const response = await fetch(`${API_URL}/all`);
        if (response.ok) {
            const books = await response.json();
            console.log('📚 Backend-dən kitablar alındı:', books.length);
            displayBooksInUI(books);
            if (totalCountElement) totalCountElement.textContent = books.length;
            return;
        }
    } catch (error) {
        console.log('⚠️ Backend-dən oxunması mümkün olmadı, LocalStorage istifadə olunur');
    }

    // Fallback LocalStorage
    let books = JSON.parse(localStorage.getItem('books')) || [];
    displayBooksInUI(books);
    if (totalCountElement) totalCountElement.textContent = books.length;
}

function displayBooksInUI(books) {
    if (bookList) bookList.innerHTML = '';
    books.forEach(addBookToUI);
}

function getBooks() {
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
    refreshUI();
}

function addBookToUI(book) {
    const li = document.createElement('li');
    const price = book.price ? book.price.toFixed(2) : "0.00";
    li.innerHTML = `
        <div class="book-info">
            <strong>${escapeHtml(book.title)}</strong>
            <span>${escapeHtml(book.author)}</span>
            <span class="badge">${escapeHtml(book.category)}</span>
            <span class="price-tag">${price} ₼</span>
        </div>
        <div class="action-buttons">
            <button class="add-to-cart-btn" onclick='addToCart(${JSON.stringify(book)})'>🛒 Səbətə at</button>
            <button class="edit-btn" onclick='editBook(${JSON.stringify(book)})'>Redaktə</button>
            <button class="delete-btn" onclick="deleteBook('${book.id}')">Sil</button>
        </div>
    `;
    if (bookList) bookList.appendChild(li);
}

function applyFiltersAndSort() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categoryFilter = document.getElementById('filter-category').value;
    const sortMethod = document.getElementById('sort-books').value;

    applyBackendFiltersAndSort(searchTerm, categoryFilter, sortMethod);
}

async function applyBackendFiltersAndSort(search, category, sort) {
    try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (category && category !== 'all') params.append('category', category);
        if (sort && sort !== 'default') params.append('sort', sort);

        let url = API_URL + '/all';
        if (params.toString()) {
            url = API_URL + '?' + params.toString();
        }

        const response = await fetch(url);
        if (response.ok) {
            const books = await response.json();
            console.log('🔍 Filtered books:', books.length);
            displayBooksInUI(books);
            return;
        }
    } catch (error) {
        console.log('Backend filter xətası, LocalStorage istifadə olunur:', error);
    }

    // Fallback: LocalStorage-dən filter et
    let books = JSON.parse(localStorage.getItem('books')) || [];

    books = books.filter(book => {
        const matchesSearch = search === '' || book.title.toLowerCase().includes(search) || book.author.toLowerCase().includes(search);
        const matchesCategory = category === 'all' || category === '' || book.category === category;
        return matchesSearch && matchesCategory;
    });

    if (sort === 'pages-asc') books.sort((a, b) => a.pages - b.pages);
    else if (sort === 'pages-desc') books.sort((a, b) => b.pages - a.pages);
    else if (sort === 'title-az') books.sort((a, b) => a.title.localeCompare(b.title));

    displayBooksInUI(books);
}

// ===== API FUNKSIYALARI =====

// API Bağlantısını Yoxla
async function checkConnection() {
    try {
        const response = await fetch(`${API_URL}/health`);
        if (response.ok) {
            const statusEl = document.getElementById('status');
            if (statusEl) {
                statusEl.className = 'status connected';
                statusEl.textContent = '🟢 Backend Aktiv (MySQL Bağlı)';
            }
        } else {
            throw new Error('Cavab xətası');
        }
    } catch (error) {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.className = 'status disconnected';
            statusEl.textContent = '🔴 Backend Offline - Localhost:8080 bağlantısını yoxla';
        }
    }
}

// Kitab Əlavə Et - Backend API-yə
async function submitBookForm(bookData) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData)
        });

        if (response.ok) {
            const savedBook = await response.json();
            console.log('✅ Kitab Backend-ə əlavə edildi:', savedBook);
            return { success: true, message: '✅ Kitab uğurla əlavə edildi!' };
        } else {
            const errorText = await response.text();
            console.error('❌ Backend xətası:', response.status, errorText);
            return { success: false, message: `❌ Xəta: ${response.status}` };
        }
    } catch (error) {
        console.error('❌ Bağlantı xətası:', error);
        return { success: false, message: '❌ Bağlantı xətası' };
    }
}

// ===== ADMIN PANEL FUNKSIYALARI =====

// Bütün Kitabları Yükləyin (Table)
async function loadAllBooks() {
    const container = document.getElementById('admin-books-container');
    if (!container) return;

    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Yüklənir...</p></div>';

    try {
        const response = await fetch(`${API_URL}/all`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const books = await response.json();

        // Statistika update et
        const totalBooksEl = document.getElementById('total-books');
        if (totalBooksEl) totalBooksEl.textContent = books.length;

        if (!Array.isArray(books) || books.length === 0) {
            container.innerHTML = '<div class="empty">📚 Heç bir kitab tapılmadı</div>';
            return;
        }

        displayAdminTable(books);
    } catch (error) {
        container.innerHTML = `<div class="empty">❌ Xəta: ${error.message}</div>`;
    }
}

// Admin Cədvəlini Göstər
function displayAdminTable(books) {
    const container = document.getElementById('admin-books-container');
    if (!container) return;

    container.innerHTML = '';

    const table = document.createElement('table');
    table.className = 'admin-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Kitab Adı</th>
                <th>Müəllif</th>
                <th>Kateqoriya</th>
                <th>Səhifə</th>
                <th>Il</th>
                <th>Qiymət</th>
                <th>Əməliyyat</th>
            </tr>
        </thead>
        <tbody id="admin-table-body">
        </tbody>
    `;

    container.appendChild(table);

    const tbody = document.getElementById('admin-table-body');
    books.forEach(book => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><small>${escapeHtml(book.id)}</small></td>
            <td><strong>${escapeHtml(book.title)}</strong></td>
            <td>${escapeHtml(book.author)}</td>
            <td><span class="badge">${escapeHtml(book.category)}</span></td>
            <td>${book.pages}</td>
            <td>${book.year}</td>
            <td><span class="price-badge">${book.price?.toFixed(2) || '0.00'} ₼</span></td>
            <td>
                <button onclick="openEditModal(${JSON.stringify(book)})" class="btn-edit" title="Redaktə Et">✏️</button>
                <button onclick="deleteAdminBook('${book.id}')" class="btn-delete" title="Sil">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Kitabları Axtar
async function adminSearchBooks() {
    const container = document.getElementById('admin-books-container');
    if (!container) return;

    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Yüklənir...</p></div>';

    const search = document.getElementById('admin-search')?.value || '';
    const category = document.getElementById('admin-category-filter')?.value || '';

    try {
        let url = API_URL + '/all';

        if (search || category) {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (category) params.append('category', category);
            url = API_URL + '?' + params.toString();
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        let books = await response.json();

        // Client-side filtering
        if (search) {
            const searchLower = search.toLowerCase();
            books = books.filter(b =>
                b.title.toLowerCase().includes(searchLower) ||
                b.author.toLowerCase().includes(searchLower)
            );
        }

        if (!Array.isArray(books) || books.length === 0) {
            container.innerHTML = '<div class="empty">📖 Nəticə tapılmadı</div>';
            return;
        }

        displayAdminTable(books);
    } catch (error) {
        container.innerHTML = `<div class="empty">❌ Xəta: ${error.message}</div>`;
    }
}

// Redaktə Modalını Aç
function openEditModal(book) {
    document.getElementById('edit-book-id').value = book.id;
    document.getElementById('edit-title').value = book.title;
    document.getElementById('edit-author').value = book.author;
    document.getElementById('edit-category').value = book.category;
    document.getElementById('edit-pages').value = book.pages;
    document.getElementById('edit-year').value = book.year;
    document.getElementById('edit-price').value = book.price;

    document.getElementById('editModal').style.display = 'block';
}

// Redaktə Modalını Bağla
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('admin-edit-form').reset();
}

// Kitabı Yənilə (PUT)
async function updateAdminBook(id, bookData) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData)
        });

        if (response.ok) {
            const updatedBook = await response.json();
            console.log('✅ Kitab yeniləndi:', updatedBook);
            return { success: true, message: '✅ Kitab uğurla yeniləndi!' };
        } else {
            const errorText = await response.text();
            console.error('❌ Backend xətası:', response.status, errorText);
            return { success: false, message: `❌ Xəta: ${response.status}` };
        }
    } catch (error) {
        console.error('❌ Bağlantı xətası:', error);
        return { success: false, message: '❌ Bağlantı xətası' };
    }
}

// Kitabı Sil (DELETE)
async function deleteAdminBook(id) {
    if (!confirm('Bu kitabı silmək istədiniz?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            console.log('✅ Kitab silindi');
            showToast('✅ Kitab uğurla silindi!');
            loadAllBooks();
        } else {
            const errorText = await response.text();
            console.error('❌ Backend xətası:', response.status, errorText);
            showToast(`❌ Xəta: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Bağlantı xətası:', error);
        showToast('❌ Bağlantı xətası');
    }
}

// Modal dışı kapa
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (modal && event.target === modal) {
        modal.style.display = 'none';
    }
}

// ===== ADDBOOK.HTML FUNKSIYALARI =====

// Son Kitabları Göstər (Backend + LocalStorage)
async function displayRecentBooks() {
    try {
        const response = await fetch(`${API_URL}/all`);
        if (response.ok) {
            let books = await response.json();
            books = books.slice(-5).reverse();

            if (books.length > 0) {
                displayBooksForAddForm(books);
                return;
            }
        }
    } catch (error) {
        console.log('Backend-dən oxunması mümkün olmadı, LocalStorage istifadə olunur');
    }

    // Fallback: LocalStorage-dan al
    let books = JSON.parse(localStorage.getItem('books')) || [];
    books = books.slice(-5).reverse();
    displayBooksForAddForm(books);
}

// Kitabları Göstər (Əlavə Et sehifəsi üçün)
function displayBooksForAddForm(books) {
    const bookList = document.getElementById('book-list');
    if (!bookList) return;

    if (books.length === 0) {
        bookList.innerHTML = '<p style="text-align: center; color: #999;">Hələ kitab əlavə edilməmişdir</p>';
        return;
    }

    bookList.innerHTML = '';
    books.forEach(book => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.padding = '12px';
        li.style.borderBottom = '1px solid #eee';

        li.innerHTML = `
            <div>
                <strong>${escapeHtml(book.title)}</strong>
                <br>
                <small style="color: #666;">👤 ${escapeHtml(book.author)} | 📖 ${escapeHtml(book.category)}</small>
            </div>
            <div style="text-align: right;">
                <div style="color: #27ae60; font-weight: bold;">${book.price?.toFixed(2) || '0.00'} ₼</div>
                <button onclick="addToCart(${JSON.stringify(book)})" style="background: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-top: 5px;">🛒 Əlavə Et</button>
            </div>
        `;
        bookList.appendChild(li);
    });
}

// ===== GLOBALLAR =====
let isEditMode = false;
let editBookId = null;
let bookList = document.getElementById('book-list');
let totalCountElement = document.getElementById('total-count');