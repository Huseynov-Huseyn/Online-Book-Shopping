/**
 * BookShop Frontend - DOM Event Bindings
 * Bütün hadisə bağlamaları (event listeners) bu fayldadır.
 * Görüntü dəyişmir, sadəcə HTML-dəki ID-lərə listener bağlanır.
 */

(function () {
    const ready = (fn) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    };

    ready(() => {
        const path = window.location.pathname;
        const isIndex = path.includes('index.html') || path === '/' ||
            path.endsWith('Main/') || path.endsWith('Main') ||
            (!path.includes('admin.html') && !path.includes('addbook.html'));

        bindCommon();

        if (isIndex) bindIndexPage();
        if (path.includes('addbook.html')) bindAddBookPage();
        if (path.includes('admin.html')) bindAdminPage();
    });

    // ===== COMMON (header cart) =====
    // Qeyd: tema düyməsi function.js (applyTheme) tərəfindən bağlanır.
    function bindCommon() {
        const cartToggle = document.getElementById('cart-toggle-btn');
        const cartPanel = document.getElementById('cart-panel');
        const closeCart = document.getElementById('close-cart');
        if (cartToggle && cartPanel) {
            cartToggle.addEventListener('click', () => cartPanel.classList.toggle('open'));
        }
        if (closeCart && cartPanel) {
            closeCart.addEventListener('click', () => cartPanel.classList.remove('open'));
        }

        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => window.checkoutOrder && window.checkoutOrder());
        }
    }

    // ===== INDEX PAGE =====
    function bindIndexPage() {
        // Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => window.applyFiltersAndSort && window.applyFiltersAndSort());
        }
        // Filter & sort
        const cat = document.getElementById('filter-category');
        const sort = document.getElementById('sort-books');
        if (cat) cat.addEventListener('change', () => window.applyFiltersAndSort && window.applyFiltersAndSort());
        if (sort) sort.addEventListener('change', () => window.applyFiltersAndSort && window.applyFiltersAndSort());

        // Genre badges
        document.querySelectorAll('.genre-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const genre = btn.dataset.genre;
                const catEl = document.getElementById('filter-category');
                if (catEl) {
                    catEl.value = genre === 'all' ? 'all' : genre;
                    window.applyFiltersAndSort && window.applyFiltersAndSort();
                }
            });
        });

        // Details modal close
        const closeDetails = document.getElementById('close-details-btn');
        const detailsModal = document.getElementById('details-modal');
        if (closeDetails && detailsModal) {
            closeDetails.addEventListener('click', () => detailsModal.style.display = 'none');
            detailsModal.addEventListener('click', (e) => {
                if (e.target === detailsModal) detailsModal.style.display = 'none';
            });
        }

        // Quote widget
        initQuoteWidget();

        // Reading calculator
        initReadingCalc();
    }

    function initQuoteWidget() {
        const quotes = [
            {text: '"Kitabsız yaşamaq, kor-karana yaşamaqdır."', author: '— Seneca'},
            {text: '"Kitab insanın ən sədaqətli dostudur."', author: '— Cicero'},
            {text: '"Oxumaq ağıl üçün idmandır."', author: '— Joseph Addison'},
            {text: '"Bir kitab oxumaq min həyat yaşamaqdır."', author: '— Geo. R.R. Martin'},
            {text: '"Yaxşı kitab əbədi dostdur."', author: '— Tupper'},
            {text: '"Kitab pəncərədir başqa dünyalara."', author: '— Anonim'}
        ];
        const widget = document.getElementById('quote-widget');
        const disp = document.getElementById('quote-display');
        const auth = document.getElementById('quote-author-display');
        if (!widget || !disp || !auth) return;

        const refresh = () => {
            const q = quotes[Math.floor(Math.random() * quotes.length)];
            disp.textContent = q.text;
            auth.textContent = q.author;
        };
        widget.addEventListener('click', refresh);
        refresh();
    }

    function initReadingCalc() {
        const pages = document.getElementById('calc-pages');
        const speed = document.getElementById('calc-speed');
        const result = document.getElementById('calc-result-text');
        if (!pages || !speed || !result) return;

        const calc = () => {
            const p = parseInt(pages.value) || 0;
            const wordsPerPage = 250;
            const speedMap = {slow: 30, normal: 45, fast: 60};
            const wpm = speedMap[speed.value] || 45;
            const totalMinutes = (p * wordsPerPage) / wpm;
            const hours = (totalMinutes / 60).toFixed(1);
            const days = Math.max(1, Math.ceil(totalMinutes / 60));
            result.innerHTML = `Təxmini oxu vaxtı: <strong>${hours} saat</strong> (cəmi <strong>${days} gün</strong>)`;
        };
        pages.addEventListener('input', calc);
        speed.addEventListener('change', calc);
        calc();
    }

    // ===== ADD BOOK PAGE =====
    function bindAddBookPage() {
        const form = document.getElementById('book-form');
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const bookData = {
                title: document.getElementById('title').value.trim(),
                author: document.getElementById('author').value.trim(),
                category: document.getElementById('category-select').value,
                pages: parseInt(document.getElementById('pages').value),
                year: parseInt(document.getElementById('year').value),
                price: parseFloat(document.getElementById('price').value),
                stockQuantity: parseInt(document.getElementById('stockQuantity').value)
            };
            const fileInput = document.getElementById('book-image');
            const file = fileInput && fileInput.files[0];

            const res = await window.submitBookForm(bookData, file);
            if (res && res.success) {
                form.reset();
                const preview = document.getElementById('image-preview');
                if (preview) preview.style.display = 'none';
                if (window.loadRecentBooks) window.loadRecentBooks();
            }
        });
    }

    // ===== ADMIN PAGE =====
    function bindAdminPage() {
        // Tabs
        const tabBooks = document.getElementById('tab-books');
        const tabUsers = document.getElementById('tab-users');
        const tabOrders = document.getElementById('tab-orders');
        const pBooks = document.getElementById('books-panel');
        const pUsers = document.getElementById('users-panel');
        const pOrders = document.getElementById('orders-panel');

        const switchTab = (active) => {
            [tabBooks, tabUsers, tabOrders].forEach(t => t && t.classList.remove('active'));
            [pBooks, pUsers, pOrders].forEach(p => p && (p.style.display = 'none'));
            active.btn.classList.add('active');
            active.panel.style.display = 'block';
            if (active.load) active.load();
        };

        if (tabBooks) tabBooks.addEventListener('click', () => switchTab({btn: tabBooks, panel: pBooks, load: window.loadAdminBooks}));
        if (tabUsers) tabUsers.addEventListener('click', () => switchTab({btn: tabUsers, panel: pUsers, load: window.loadAdminUsers}));
        if (tabOrders) tabOrders.addEventListener('click', () => switchTab({btn: tabOrders, panel: pOrders, load: window.loadAdminOrders}));

        // Refresh & filter
        const refreshBtn = document.getElementById('refresh-admin-books');
        if (refreshBtn) refreshBtn.addEventListener('click', () => window.loadAdminBooks && window.loadAdminBooks());

        const search = document.getElementById('admin-search');
        const catFilter = document.getElementById('admin-category-filter');
        if (search) search.addEventListener('input', () => window.loadAdminBooks && window.loadAdminBooks());
        if (catFilter) catFilter.addEventListener('change', () => window.loadAdminBooks && window.loadAdminBooks());

        // Edit modal
        const closeEditModal = document.getElementById('close-edit-modal');
        const cancelEdit = document.getElementById('cancel-edit-btn');
        if (closeEditModal) closeEditModal.addEventListener('click', () => window.closeEditModal && window.closeEditModal());
        if (cancelEdit) cancelEdit.addEventListener('click', () => window.closeEditModal && window.closeEditModal());

        const editForm = document.getElementById('admin-edit-form');
        if (editForm) {
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = document.getElementById('edit-book-id').value;
                const data = {
                    title: document.getElementById('edit-title').value.trim(),
                    author: document.getElementById('edit-author').value.trim(),
                    category: document.getElementById('edit-category').value,
                    pages: parseInt(document.getElementById('edit-pages').value),
                    year: parseInt(document.getElementById('edit-year').value),
                    price: parseFloat(document.getElementById('edit-price').value),
                    stockQuantity: parseInt(document.getElementById('edit-stockQuantity').value)
                };
                const res = await window.updateAdminBook(id, data);
                if (res && res.success) {
                    window.closeEditModal && window.closeEditModal();
                    window.loadAdminBooks && window.loadAdminBooks();
                }
            });
        }

        // İlk yükləmə
        if (window.loadAdminBooks) window.loadAdminBooks();
    }
})();
