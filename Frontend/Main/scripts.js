// Extracted UI Logic from HTML files

// --- INDEX.HTML LOGIC ---
const cartToggle = document.getElementById('cart-toggle-btn');
const cartPanel = document.getElementById('cart-panel');
const closeCart = document.getElementById('close-cart');

if (cartToggle && cartPanel) {
    cartToggle.addEventListener('click', () => cartPanel.classList.add('open'));
}
if (closeCart && cartPanel) {
    closeCart.addEventListener('click', () => cartPanel.classList.remove('open'));
}

const QUOTES = [
    { text: "Kitabsız yaşamaq, kor-karana yaşamaqdır.", author: "Seneca" },
    { text: "Yaxşı kitab, yaxşı dostdur.", author: "Hafiz Şirazi" },
    { text: "Kitablar da insanlar kimidir, ruhu olanlar yaşayır.", author: "Naməlum" },
    { text: "Oxumaq, insanı yetkinləşdirər, danışmaq ağıllı edər.", author: "Francis Bacon" },
    { text: "Bir insanın dəyəri oxuduğu kitablarla ölçülür.", author: "Herbert Spencer" },
    { text: "Kitab oxumaq boş vaxtı doldurmaq deyil, ruhu bəsləməkdir.", author: "Sokrat" }
];

window.generateRandomQuote = () => {
    const quoteDisplay = document.getElementById('quote-display');
    const quoteAuthor = document.getElementById('quote-author-display');
    const quoteCard = document.querySelector('.quote-widget');

    if (!quoteCard) return;
    quoteCard.style.transform = 'scale(0.95)';
    quoteCard.style.opacity = '0.5';

    setTimeout(() => {
        const random = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        if (quoteDisplay) quoteDisplay.textContent = `"${random.text}"`;
        if (quoteAuthor) quoteAuthor.textContent = `— ${random.author}`;
        quoteCard.style.transform = '';
        quoteCard.style.opacity = '1';
    }, 300);
};

window.calculateReadingTime = () => {
    const pages = parseInt(document.getElementById('calc-pages')?.value) || 0;
    const speed = document.getElementById('calc-speed')?.value;
    const resultText = document.getElementById('calc-result-text');

    if (!resultText) return;
    if (pages <= 0) {
        resultText.innerHTML = "Lütfən doğru səhifə sayı daxil edin.";
        return;
    }

    const totalWords = pages * 250;
    let speedWordsPerMin = 45;
    if (speed === 'slow') speedWordsPerMin = 30;
    else if (speed === 'fast') speedWordsPerMin = 60;

    const minutes = totalWords / speedWordsPerMin;
    const hours = (minutes / 60).toFixed(1);
    const days = Math.ceil(parseFloat(hours));

    resultText.innerHTML = `Təxmini oxu vaxtı: <strong>${hours} saat</strong> (gündə 1 saat oxumaqla <strong>${days} gün</strong>)`;
};

window.filterGenre = (category) => {
    const genreBtns = document.querySelectorAll('.genre-btn');
    genreBtns.forEach(btn => {
        if (btn.textContent.includes(category === 'all' ? 'Hamısı' : category)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const categorySelect = document.getElementById('filter-category');
    if (categorySelect) {
        categorySelect.value = category;
        if(window.applyFiltersAndSort) window.applyFiltersAndSort();
    }
};

window.openBookDetails = async (bookId) => {
    const modal = document.getElementById('details-modal');
    if (modal) modal.style.display = 'flex';
    
    const titleEl = document.getElementById('modal-book-title');
    const authorEl = document.getElementById('modal-book-author');
    const descEl = document.getElementById('modal-book-desc');
    
    if (titleEl) titleEl.textContent = 'Yüklənir...';
    if (authorEl) authorEl.textContent = 'Gözləyin';
    if (descEl) descEl.textContent = 'Kitab məlumatları serverdən gətirilir...';

    try {
        const book = await window.apiRequest(`${window.API_BASE_URL}/api/books/${bookId}`);
        if (!book) return;

        const imgEl = document.getElementById('modal-book-img');
        if (imgEl) imgEl.src = book.imageUrl ? window.getImageUrl(book.imageUrl) : 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop';
        
        const catEl = document.getElementById('modal-book-category');
        if (catEl) catEl.textContent = book.category;
        if (titleEl) titleEl.textContent = book.title;
        if (authorEl) authorEl.textContent = book.author;
        
        const pagesEl = document.getElementById('modal-book-pages');
        if (pagesEl) pagesEl.textContent = book.pages;
        const yearEl = document.getElementById('modal-book-year');
        if (yearEl) yearEl.textContent = book.year;
        const priceEl = document.getElementById('modal-book-price');
        if (priceEl) priceEl.textContent = `${book.price.toFixed(2)} ₼`;

        const descMap = {
            'Bədii': `Bu möhtəşəm bədii əsər oxucunu xəyallar aləminə və dərin hisslərə qərq edəcək. Yazarın zəngin dili və təsirli hekayəsi ilə hər bir personajın hisslərini özünüz yaşayacaqsınız.`,
            'Elmi': `Ən son elmi araşdırmalar və kəşfləri özündə cəmləşdirən bu kitab, ətrafımızdakı dünyanı anlamaq və intellektual üfüqlərimizi genişləndirmək üçün əvəzolunmaz vəsaitdir.`,
            'Tarix': `Keçmişin qaranlıq səhifələrinə işıq salan bu əsər, tarixi faktları canlı və cəlbedici şəkildə təqdim edir. Keçmişimizin bu günü necə formalaşdırdığını birlikdə kəşf edin.`,
            'Dedektiv': `Gözlənilməz sonluqlar, sirli hadisələr və intriqalarla dolu bu dedektiv romanı son səhifəsinə qədər sizi gərginlikdə saxlayacaq. Sirri ilk kim tapacaq?`
        };
        if (descEl) descEl.textContent = descMap[book.category] || `Bu maraqlı kitab sizi heyranedici məlumatlar və fərqli hekayələr dünyasına aparacaq. Hər səhifədə fərqli bir macəra sizi gözləyir.`;

        const addBtn = document.getElementById('modal-add-cart-btn');
        if (addBtn) {
            addBtn.onclick = () => {
                if(window.addToCart) window.addToCart(book);
                window.closeBookDetails();
            };
        }
    } catch (error) {
        if (titleEl) titleEl.textContent = 'Xəta!';
        if (descEl) descEl.textContent = 'Kitab məlumatlarını yükləmək mümkün olmadı.';
    }
};

window.closeBookDetails = () => {
    const m = document.getElementById('details-modal');
    if (m) m.style.display = 'none';
};


// --- ADDBOOK.HTML LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const bookForm = document.getElementById('book-form');
    if(bookForm) {
        bookForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const imageInput = document.getElementById('book-image');
            const file = imageInput?.files[0];

            const bookData = {
                title: document.getElementById('title')?.value,
                author: document.getElementById('author')?.value,
                category: document.getElementById('category-select')?.value,
                pages: parseInt(document.getElementById('pages')?.value || 0),
                year: parseInt(document.getElementById('year')?.value || 0),
                price: parseFloat(document.getElementById('price')?.value || 0),
                stockQuantity: parseInt(document.getElementById('stockQuantity')?.value || 0)
            };

            if(window.submitBookForm) {
                const result = await window.submitBookForm(bookData, file);
                if (result && result.success) {
                    bookForm.reset();
                    const preview = document.getElementById('image-preview');
                    if(preview) preview.style.display = 'none';
                    if(typeof window.loadRecentBooks === 'function') window.loadRecentBooks();
                }
            }
        });
    }
});


// --- ADMIN.HTML LOGIC ---
window.setupAdminTabs = () => {
    const isSeller = window.state?.user && window.state.user.role === 'ROLE_SATICI';
    const tabUsers = document.getElementById('tab-users');
    const tabOrders = document.getElementById('tab-orders');
    if (isSeller) {
        if (tabUsers) tabUsers.style.display = 'none';
        if (tabOrders) tabOrders.style.display = 'none';
    } else {
        if (tabUsers) tabUsers.style.display = 'inline-block';
        if (tabOrders) tabOrders.style.display = 'inline-block';
    }
};

window.loadAdminBooks = async () => {
    if(window.setupAdminTabs) window.setupAdminTabs();
    const container = document.getElementById('admin-books-container');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const books = await window.apiRequest(`${window.API_URL}/all`);
        window.adminBooks = books; 
        const t = document.getElementById('total-books');
        if(t) t.textContent = books.length;
        if(window.renderAdminTable) window.renderAdminTable(books);
    } catch (error) {
        container.innerHTML = '<div class="empty">Xəta baş verdi</div>';
    }
};

window.renderAdminTable = (books) => {
    const container = document.getElementById('admin-books-container');
    if (!container) return;
    
    if (books.length === 0) {
        container.innerHTML = '<div class="empty">📚 Heç bir kitab tapılmadı</div>';
        return;
    }

    const isSeller = window.state?.user && window.state.user.role === 'ROLE_SATICI';

    container.innerHTML = \`
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Şəkil</th>
                    <th>Kitab</th>
                    <th>Müəllif</th>
                    <th>Kateqoriya</th>
                    <th>Stok</th>
                    <th>Qiymət</th>
                    <th>Əməliyyat</th>
                </tr>
            </thead>
            <tbody>
                \${books.map(book => \`
                    <tr>
                        <td><img src="\${window.getImageUrl ? window.getImageUrl(book.imageUrl) : ''}" style="width: 40px; border-radius: 4px;" onerror="window.handleImageError ? window.handleImageError(this) : null"></td>
                        <td><strong>\${window.escapeHtml ? window.escapeHtml(book.title) : book.title}</strong></td>
                        <td>\${window.escapeHtml ? window.escapeHtml(book.author) : book.author}</td>
                        <td><span class="badge">\${book.category}</span></td>
                        <td>\${book.stockQuantity || 0} ədəd</td>
                        <td>\${book.price.toFixed(2)} ₼</td>
                        <td>
                            <button class="btn btn-secondary" onclick="openEditModalById('\${book.id}')">✏️</button>
                            \${isSeller ? '' : \`<button class="btn btn-secondary" style="color: var(--danger)" onclick="deleteAdminBook('\${book.id}')">🗑️</button>\`}
                        </td>
                    </tr>
                \`).join('')}
            </tbody>
        </table>
    \`;
};

window.openEditModalById = (id) => {
    if (window.adminBooks) {
        const book = window.adminBooks.find(b => b.id == id);
        if (book && window.openEditModal) {
            window.openEditModal(book);
        }
    }
};

let adminFilterTimeout;
window.adminSearchBooks = async () => {
    clearTimeout(adminFilterTimeout);
    adminFilterTimeout = setTimeout(async () => {
        const search = document.getElementById('admin-search')?.value;
        const category = document.getElementById('admin-category-filter')?.value;
        
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        
        try {
            const queryStr = params.toString() ? \`?\${params.toString()}\` : '';
            const filtered = await window.apiRequest(\`\${window.API_URL}\${queryStr}\`);
            window.adminBooks = filtered; 
            if(window.renderAdminTable) window.renderAdminTable(filtered);
        } catch (error) {
            console.error('Search failed', error);
        }
    }, 300);
};

window.deleteAdminBook = async (id) => {
    if (!confirm('Silmək istədiyinizdən əminsiniz?')) return;
    try {
        await window.apiRequest(\`\${window.API_URL}/\${id}\`, { method: 'DELETE' });
        if(window.showToast) window.showToast('Kitab silindi', 'success');
        if(window.loadAdminBooks) window.loadAdminBooks();
    } catch (error) {
        if(window.showToast) window.showToast('Silmə zamanı xəta baş verdi və ya səlahiyyətiniz yoxdur', 'danger');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const adminEditForm = document.getElementById('admin-edit-form');
    if(adminEditForm) {
        adminEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-book-id')?.value;
            const data = {
                title: document.getElementById('edit-title')?.value,
                author: document.getElementById('edit-author')?.value,
                category: document.getElementById('edit-category')?.value,
                pages: parseInt(document.getElementById('edit-pages')?.value || 0),
                year: parseInt(document.getElementById('edit-year')?.value || 0),
                price: parseFloat(document.getElementById('edit-price')?.value || 0),
                stockQuantity: parseInt(document.getElementById('edit-stockQuantity')?.value || 0)
            };
            
            if(window.updateAdminBook) {
                const result = await window.updateAdminBook(id, data);
                if (result && result.success) {
                    if(window.closeEditModal) window.closeEditModal();
                    if(window.loadAdminBooks) window.loadAdminBooks();
                }
            }
        });
    }

    if (document.getElementById('admin-books-container')) {
        if (typeof window.loadAdminBooks === 'function') window.loadAdminBooks();
    }
    if (document.getElementById('calc-pages')) {
        if(window.generateRandomQuote) window.generateRandomQuote();
        if(window.calculateReadingTime) window.calculateReadingTime();
    }
});

window.switchAdminTab = (tab) => {
    const booksPanel = document.getElementById('books-panel');
    const usersPanel = document.getElementById('users-panel');
    const ordersPanel = document.getElementById('orders-panel');
    const tabBooks = document.getElementById('tab-books');
    const tabUsers = document.getElementById('tab-users');
    const tabOrders = document.getElementById('tab-orders');

    if (tab === 'books') {
        if(booksPanel) booksPanel.style.display = 'block';
        if(usersPanel) usersPanel.style.display = 'none';
        if(ordersPanel) ordersPanel.style.display = 'none';
        if(tabBooks) tabBooks.classList.add('active');
        if(tabUsers) tabUsers.classList.remove('active');
        if(tabOrders) tabOrders.classList.remove('active');
        if(window.loadAdminBooks) window.loadAdminBooks();
    } else if (tab === 'users') {
        if(booksPanel) booksPanel.style.display = 'none';
        if(usersPanel) usersPanel.style.display = 'block';
        if(ordersPanel) ordersPanel.style.display = 'none';
        if(tabBooks) tabBooks.classList.remove('active');
        if(tabUsers) tabUsers.classList.add('active');
        if(tabOrders) tabOrders.classList.remove('active');
        if(window.loadAdminUsers) window.loadAdminUsers();
    } else {
        if(booksPanel) booksPanel.style.display = 'none';
        if(usersPanel) usersPanel.style.display = 'none';
        if(ordersPanel) ordersPanel.style.display = 'block';
        if(tabBooks) tabBooks.classList.remove('active');
        if(tabUsers) tabUsers.classList.remove('active');
        if(tabOrders) tabOrders.classList.add('active');
        if(window.loadAdminOrders) window.loadAdminOrders();
    }
};

window.loadAdminOrders = async () => {
    const container = document.getElementById('admin-orders-container');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const orders = await window.apiRequest(\`\${window.API_BASE_URL}/api/orders\`);
        const users = await window.apiRequest(\`\${window.API_BASE_URL}/api/users\`);
        const books = await window.apiRequest(\`\${window.API_URL}/all\`);
        
        if(window.renderOrdersTable) window.renderOrdersTable(orders, users, books);
    } catch (error) {
        container.innerHTML = '<div class="empty">Sifarişləri yükləmək mümkün olmadı</div>';
    }
};

window.renderOrdersTable = (orders, users, books) => {
    const container = document.getElementById('admin-orders-container');
    if (!container) return;
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '<div class="empty">📦 Heç bir sifariş tapılmadı</div>';
        return;
    }
    
    container.innerHTML = \`
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Sifariş ID</th>
                    <th>Müştəri</th>
                    <th>Kitablar</th>
                    <th>Məbləğ</th>
                    <th>Status</th>
                    <th>Tarix</th>
                    <th>Əməliyyatlar</th>
                </tr>
            </thead>
            <tbody>
                \${orders.map(order => {
                    const user = users.find(u => u.id == order.userId);
                    const username = user ? user.username : \`İstifadəçi #\${order.userId}\`;
                    const orderBooks = order.items && order.items.length > 0
                        ? order.items.map(item => \`\${item.title} (\${item.quantity} ədəd)\`).join(', ')
                        : 'Kitab yoxdur';
                    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString('az-AZ') : 'Bilinmir';
                    
                    let statusBadgeColor = 'background: rgba(245, 158, 11, 0.1); color: var(--warning);';
                    let statusText = 'Gözləyir';
                    if (order.status === 'COMPLETED') {
                        statusBadgeColor = 'background: rgba(34, 197, 94, 0.1); color: var(--success);';
                        statusText = 'Tamamlandı';
                    } else if (order.status === 'CANCELLED') {
                        statusBadgeColor = 'background: rgba(239, 68, 68, 0.1); color: var(--danger);';
                        statusText = 'Ləğv edildi';
                    }
                    
                    const displayPrice = typeof order.totalPrice === 'number'
                        ? order.totalPrice.toFixed(2)
                        : parseFloat(order.totalPrice || 0).toFixed(2);
                    
                    return \`
                        <tr>
                            <td><code>#\${order.id}</code></td>
                            <td><strong>@\${window.escapeHtml ? window.escapeHtml(username) : username}</strong></td>
                            <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="\${window.escapeHtml ? window.escapeHtml(orderBooks) : orderBooks}">\${window.escapeHtml ? window.escapeHtml(orderBooks) : orderBooks}</td>
                            <td><strong>\${displayPrice} ₼</strong></td>
                            <td><span class="badge" style="\${statusBadgeColor}">\${statusText}</span></td>
                            <td><span style="font-size: 0.85rem; color: var(--text-muted);">\${orderDate}</span></td>
                            <td>
                                <div style="display: flex; gap: 5px;">
                                    <button class="btn btn-secondary" style="color: var(--success); padding: 5px 10px;" onclick="updateOrderStatusAction(\${order.id}, 'COMPLETED')">✓</button>
                                    <button class="btn btn-secondary" style="color: var(--warning); padding: 5px 10px;" onclick="updateOrderStatusAction(\${order.id}, 'CANCELLED')">✕</button>
                                    <button class="btn btn-secondary" style="color: var(--danger); padding: 5px 10px;" onclick="deleteOrderAction(\${order.id})"><i class="fas fa-trash-alt"></i></button>
                                </div>
                            </td>
                        </tr>
                    \`;
                }).join('')}
            </tbody>
        </table>
    \`;
};

window.updateOrderStatusAction = async (orderId, status) => {
    try {
        await window.apiRequest(\`\${window.API_BASE_URL}/api/orders/\${orderId}/status?status=\${status}\`, {
            method: 'PUT'
        });
        if(window.showToast) window.showToast(\`Sifariş statusu yeniləndi: \${status}\`, 'success');
        if(window.loadAdminOrders) window.loadAdminOrders();
    } catch (error) {
        if(window.showToast) window.showToast('Status yenilənərkən xəta baş verdi', 'danger');
    }
};

window.deleteOrderAction = async (orderId) => {
    if (!confirm('Sifarişi silmək istədiyinizdən əminsiniz?')) return;
    try {
        await window.apiRequest(\`\${window.API_BASE_URL}/api/orders/\${orderId}\`, {
            method: 'DELETE'
        });
        if(window.showToast) window.showToast('Sifariş silindi', 'success');
        if(window.loadAdminOrders) window.loadAdminOrders();
    } catch (error) {
        if(window.showToast) window.showToast('Sifariş silinərkən xəta baş verdi', 'danger');
    }
};

window.loadAdminUsers = async () => {
    const container = document.getElementById('admin-users-container');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const users = await window.apiRequest(\`\${window.API_BASE_URL}/api/users\`);
        if(window.renderAdminUsersTable) window.renderAdminUsersTable(users);
    } catch (error) {
        container.innerHTML = '<div class="empty">İstifadəçiləri yükləmək mümkün olmadı</div>';
    }
};

window.renderAdminUsersTable = (users) => {
    const container = document.getElementById('admin-users-container');
    if (!container) return;
    
    if (users.length === 0) {
        container.innerHTML = '<div class="empty">👥 Heç bir istifadəçi tapılmadı</div>';
        return;
    }

    container.innerHTML = \`
        <table class="admin-table">
            <thead>
                <tr>
                    <th>İstifadəçi ID</th>
                    <th>İstifadəçi Adı</th>
                    <th>Səlahiyyət (Rol)</th>
                </tr>
            </thead>
            <tbody>
                \${users.map(user => \`
                    <tr>
                        <td><code>\${user.id}</code></td>
                        <td><strong>\${window.escapeHtml ? window.escapeHtml(user.username) : user.username}</strong></td>
                        <td><span class="badge" style="background: rgba(99, 102, 241, 0.1);">\${window.getFriendlyRole ? window.getFriendlyRole(user.role) : user.role}</span></td>
                    </tr>
                \`).join('')}
            </tbody>
        </table>
    \`;
};
