const API_URL = 'http://localhost:8080/api/books';
const API_BASE_URL = new URL(API_URL).origin;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function getImageUrl(imageUrl) {
    if (!imageUrl) return '';
    if (/^(https?:\/\/|data:)/.test(imageUrl)) return imageUrl;
    if (imageUrl.startsWith('/')) return `${API_BASE_URL}${imageUrl}`;
    return `${API_BASE_URL}/${imageUrl}`;
}

// ===== ÜMUMİ FUNKSIYALAR =====

// Fəyls Şəklini Base64-ə Çevir
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Backend-ə Şəkil Yüklə
async function uploadImageToBackend(bookId, file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_URL}/${bookId}/upload-image`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            console.log('✅ Şəkil uğurla yükləndi:', bookId);
            return { success: true };
        } else {
            const errorText = await response.text();
            console.error('❌ Şəkil yükleme xətası:', response.status, errorText);
            return { success: false, message: `Şəkil yükləmə xətası: ${response.status}` };
        }
    } catch (error) {
        console.error('❌ Şəkil yükleme bağlantı xətası:', error);
        return { success: false, message: 'Şəkil yükleme bağlantı xətası' };
    }
}

// Şəkil Önizləməsini Göstər
function setupImagePreview(imageInputId, previewContainerId, previewImgId) {
    const imageInput = document.getElementById(imageInputId);
    if (!imageInput) return;

    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const previewContainer = document.getElementById(previewContainerId);
                const previewImg = document.getElementById(previewImgId);
                if (previewContainer && previewImg) {
                    previewImg.src = event.target.result;
                    previewContainer.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

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
    const div = document.createElement('div');
    const price = book.price ? book.price.toFixed(2) : "0.00";
    
    // Kitab şəklini təyin et - backend-dən imageUrl istifadə et
    const bookImage = book.imageUrl ? getImageUrl(book.imageUrl) : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140"><rect fill="%23ddd" width="100" height="140"/><text x="50" y="70" text-anchor="middle" font-size="12" fill="%23999">📚</text></svg>';
    
    div.className = 'book-card';
    div.innerHTML = `
        <div class="book-image-container">
            <img src="${bookImage}" alt="${escapeHtml(book.title)}" class="book-image">
            <div class="book-overlay">
                <button class="add-to-cart-btn" onclick='addToCart(${JSON.stringify(book)})'>🛒 Səbətə at</button>
            </div>
        </div>
        <div class="book-info">
            <h3>${escapeHtml(book.title)}</h3>
            <p class="author">👤 ${escapeHtml(book.author)}</p>
            <p class="category"><span class="badge">${escapeHtml(book.category)}</span></p>
            <p class="details">📖 ${book.pages} səhifə | 📅 ${book.year}</p>
            <div class="book-footer">
                <span class="price">${price} ₼</span>
                <div class="action-buttons">
                    <button class="edit-btn" onclick='editBook(${JSON.stringify(book)})' title="Redaktə Et">✏️</button>
                    <button class="delete-btn" onclick="deleteBook('${book.id}')" title="Sil">🗑️</button>
                </div>
            </div>
        </div>
    `;
    if (bookList) bookList.appendChild(div);
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
    else if (sort === 'price-asc') books.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') books.sort((a, b) => b.price - a.price);
    else if (sort === 'year-asc') books.sort((a, b) => a.year - b.year);
    else if (sort === 'year-desc') books.sort((a, b) => b.year - a.year);
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
async function submitBookForm(bookData, imageFile) {
    try {
        // Kitabı əvvəlcə yaradın (şəkil olmadan)
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData)
        });

        if (response.ok) {
            const savedBook = await response.json();
            console.log('✅ Kitab Backend-ə əlavə edildi:', savedBook);
            
            // Əgər şəkil varsa, onu ayrıca yüklə
            if (imageFile && savedBook.id) {
                const uploadResult = await uploadImageToBackend(savedBook.id, imageFile);
                if (!uploadResult.success) {
                    console.warn('⚠️ Şəkil yükləmə xətası:', uploadResult.message);
                    // Kitab uğurla yaranıb, amma şəkil yükləmə xətası verdi
                    return { success: true, message: '✅ Kitab əlavə edildi (şəkil yükləmə gecikdi)' };
                }
            }
            
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
                <th>Şəkil</th>
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
        
        const bookImage = book.imageUrl ? getImageUrl(book.imageUrl) : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140"><rect fill="%23ddd" width="100" height="140"/><text x="50" y="70" text-anchor="middle" font-size="12" fill="%23999">📚</text></svg>';
        
        tr.innerHTML = `
            <td><img src="${bookImage}" alt="${escapeHtml(book.title)}" style="max-width: 40px; max-height: 60px; border-radius: 4px;"></td>
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
    
    // Şəkil Önizləməsini Göstər (əgər varsa)
    if (book.imageUrl) {
        const previewContainer = document.getElementById('edit-image-preview');
        const previewImg = document.getElementById('edit-preview-img');
        if (previewContainer && previewImg) {
            previewImg.src = getImageUrl(book.imageUrl);
            previewContainer.style.display = 'block';
        }
    } else {
        const previewContainer = document.getElementById('edit-image-preview');
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
    }

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
    bookList.style.display = 'grid';
    bookList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr))';
    bookList.style.gap = '15px';
    
    books.forEach(book => {
        const div = document.createElement('div');
        div.style.cssText = `
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        `;
        div.className = 'book-card-small';
        
        const bookImage = book.imageUrl ? getImageUrl(book.imageUrl) : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140"><rect fill="%23ddd" width="100" height="140"/><text x="50" y="70" text-anchor="middle" font-size="12" fill="%23999">📚</text></svg>';
        
        div.innerHTML = `
            <div style="position: relative; width: 100%; padding-bottom: 140%; overflow: hidden; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <img src="${bookImage}" alt="${escapeHtml(book.title)}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div style="padding: 10px;">
                <div style="font-weight: bold; font-size: 0.85rem; color: #1a252f; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 5px;">${escapeHtml(book.title)}</div>
                <div style="color: #666; font-size: 0.75rem; margin-bottom: 5px;">${escapeHtml(book.author)}</div>
                <div style="color: #27ae60; font-weight: bold; font-size: 0.9rem; margin-bottom: 8px;">${book.price?.toFixed(2) || '0.00'} ₼</div>
                <button onclick="addToCart(${JSON.stringify(book)})" style="background: #3498db; color: white; border: none; padding: 5px; border-radius: 4px; cursor: pointer; width: 100%; font-size: 0.8rem; font-weight: bold;">🛒 Əlavə Et</button>
            </div>
        `;
        bookList.appendChild(div);
    });
}

// ===== GLOBALLAR =====
let isEditMode = false;
let editBookId = null;
let bookList = document.getElementById('book-list');
let totalCountElement = document.getElementById('total-count');