// Quản lý loại sản phẩm JavaScript
// Ensure initialization runs whether DOMContentLoaded already fired or not
function onReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}

// Initialize after function declarations so functions are global
onReady(function() {
    console.log('DOM Ready - Initializing category management...');
    try {
        initializeCategoryManagement();
        loadCategories();
        initializeCategoryEvents();
        console.log('Category management initialized successfully');
    } catch (err) {
        console.error('Error initializing category management:', err);
    }
});

// Function definitions (below). Initialization will run after definitions via onReady at file end.

function initializeCategoryManagement() {
    console.log('Category Management initialized');

    // Attach direct event listeners to buttons
    document.addEventListener('click', function(event) {
        const target = event.target;

        // Find the closest button if clicked on an icon inside button
        const button = target.closest('button');
        if (!button) return;

        // Handle add category button
        if (button.matches('.btn-primary') && button.textContent.trim() === 'Thêm loại sản phẩm') {
            event.preventDefault();
            console.log('Add category button clicked');
            showAddCategoryModal();
        }

        // Handle edit button
        if (button.classList.contains('btn-edit')) {
            event.preventDefault();
            const row = button.closest('tr');
            if (row) {
                const categoryName = row.getAttribute('data-category-name');
                console.log('Edit button clicked for category:', categoryName);
                editCategoryByName(categoryName);
            }
        }

        // Handle delete button
        if (button.classList.contains('btn-delete')) {
            event.preventDefault();
            const row = button.closest('tr');
            if (row) {
                const categoryName = row.getAttribute('data-category-name');
                console.log('Delete button clicked for category:', categoryName);
                deleteCategoryByName(categoryName);
            }
        }

        // Handle toggle button
        if (button.classList.contains('btn-toggle')) {
            event.preventDefault();
            const row = button.closest('tr');
            if (row) {
                const categoryName = row.getAttribute('data-category-name');
                console.log('Toggle button clicked for category:', categoryName);
                toggleCategoryStatusByName(categoryName);
            }
        }
    });

    // Add form submit handler
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', function(event) {
            event.preventDefault();
            saveCategory();
        });
    }
}

const sampleCategories = [
    { id: 1, name: 'Nike', description: 'Các sản phẩm giày Nike chính hãng', productCount: 20, status: 'active', createdAt: '2024-01-15' },
    { id: 2, name: 'Adidas', description: 'Các sản phẩm giày Adidas chính hãng', productCount: 22, status: 'active', createdAt: '2024-01-20' },
    { id: 3, name: 'Converse', description: 'Các sản phẩm giày Converse chính hãng', productCount: 20, status: 'active', createdAt: '2024-01-25' },
    { id: 4, name: 'MLB', description: 'Các sản phẩm giày MLB chính hãng', productCount: 20, status: 'active', createdAt: '2024-01-30' },
    { id: 5, name: 'Vans', description: 'Các sản phẩm giày Vans chính hãng', productCount: 18, status: 'active', createdAt: '2024-02-01' }
];

function loadCategories() {
    try {
        const section = document.getElementById('page-categories');
        const tbody = section ? section.querySelector('#categoriesTableBody') : document.getElementById('categoriesTableBody');
        if (!tbody) return;

        const products = typeof getLocalProducts === 'function' ? getLocalProducts() : JSON.parse(localStorage.getItem('productsLocal') || '[]');
        const catalogCounts = {};
        products.forEach(p => {
            const c = (p.catalog || '').toString();
            if (!c) return;
            catalogCounts[c] = (catalogCounts[c] || 0) + (p.quantity || 0);
        });

        const stored = JSON.parse(localStorage.getItem('categories')) || [];
        const storedMap = {};
        stored.forEach(s => { if (s && s.name) storedMap[s.name] = s; });

        const categories = [];
        const seen = new Set();

        Object.keys(catalogCounts).forEach((name, idx) => {
            const meta = storedMap[name] || {};
            categories.push({ id: meta.id || (idx + 1), name, description: meta.description || '', productCount: catalogCounts[name] || 0, status: meta.status || 'active', createdAt: meta.createdAt || new Date().toISOString().split('T')[0] });
            seen.add(name);
        });

        stored.forEach(s => { if (s && s.name && !seen.has(s.name)) categories.push({ id: s.id || (categories.length + 1), name: s.name, description: s.description || '', productCount: s.productCount || 0, status: s.status || 'active', createdAt: s.createdAt || new Date().toISOString().split('T')[0] }); });

        localStorage.setItem('categories', JSON.stringify(categories));

        tbody.innerHTML = '';
        categories.forEach(cat => tbody.appendChild(createCategoryRow(cat)));
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function createCategoryRow(category) {
    const row = document.createElement('tr');
    row.setAttribute('data-category-id', category.id);
    row.setAttribute('data-category-name', category.name);
    const statusClass = category.status === 'active' ? 'status-active' : 'status-hidden';
    const statusText = category.status === 'active' ? 'Hiển thị' : 'Ẩn';

    // Don't use inline onclick handlers
    row.innerHTML = `
            <td>${category.id}</td>
            <td>${category.name}</td>
            <td>${category.description || ''}</td>
            <td>${category.productCount || 0}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${formatDate(category.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" title="Sửa"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon btn-toggle" title="${category.status === 'active' ? 'Ẩn' : 'Hiện'}">${category.status === 'active' ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>'}</button>
                    <button class="btn-icon btn-delete" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
    return row;
}

function initializeCategoryEvents() {
    const section = document.getElementById('page-categories');
    const searchInput = section ? section.querySelector('#searchInput-categories') : document.getElementById('searchInput-categories');
    if (searchInput) searchInput.addEventListener('input', searchCategories);
}

function searchCategories() {
    const section = document.getElementById('page-categories');
    const searchInput = section ? section.querySelector('#searchInput-categories') : document.getElementById('searchInput-categories');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const tbody = section ? section.querySelector('#categoriesTableBody') : document.getElementById('categoriesTableBody');
    if (!tbody) return;
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(r => {
        const name = (r.cells[1] && r.cells[1].textContent || '').toLowerCase();
        const desc = (r.cells[2] && r.cells[2].textContent || '').toLowerCase();
        r.style.display = (name.includes(searchTerm) || desc.includes(searchTerm)) ? '' : 'none';
    });
}

function showAddCategoryModal() {
    console.log('Showing add category modal...');
    const modal = document.getElementById('categoryModal');
    const form = document.getElementById('categoryForm');
    if (!modal || !form) {
        console.error('Modal or form not found:', { modal: !!modal, form: !!form });
        return;
    }
    form.reset();
    form.dataset.mode = 'add';
    form.dataset.id = '';
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.classList.add('show');
    document.getElementById('categoryName').focus();
    console.log('Add category modal shown successfully');
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

function findCategoryByName(name) {
    try { return (JSON.parse(localStorage.getItem('categories')) || sampleCategories).find(c => c && c.name === name) || null; } catch (e) { console.error(e); return null; }
}

function editCategoryByName(name) {
    const category = findCategoryByName(name);
    if (!category) return;
    const modal = document.getElementById('categoryModal');
    const form = document.getElementById('categoryForm');
    if (!modal || !form) return;
    document.getElementById('categoryName').value = category.name || '';
    document.getElementById('categoryDescription').value = category.description || '';
    document.getElementById('categoryStatus').value = category.status || 'active';
    form.dataset.mode = 'edit';
    form.dataset.originalName = category.name;
    form.dataset.id = category.id;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function saveCategory() {
    console.log('Saving category...');
    const form = document.getElementById('categoryForm');
    if (!form) {
        console.error('Category form not found');
        return;
    }

    try {
        // Get form values
        const name = (document.getElementById('categoryName').value || '').trim();
        const description = (document.getElementById('categoryDescription').value || '').trim();
        const status = (document.getElementById('categoryStatus').value || 'active');
        const mode = form.dataset.mode || 'add';
        const originalName = form.dataset.originalName || '';

        console.log('Form data:', { name, description, status, mode, originalName });

        // Validate
        if (!name) {
            console.error('Category name is required');
            if (typeof AdminDashboard !== 'undefined') {
                AdminDashboard.showNotification('Vui lòng nhập tên loại sản phẩm', 'error');
            }
            return;
        }

        // Load existing categories
        let categories = [];
        try {
            categories = JSON.parse(localStorage.getItem('categories')) || sampleCategories;
        } catch (e) {
            console.warn('Error loading categories, using sample data:', e);
            categories = [...sampleCategories];
        }

        // Check for duplicates
        const duplicate = categories.some(c => c.name === name && (mode === 'add' || c.name !== originalName));
        if (duplicate) {
            console.error('Duplicate category name:', name);
            if (typeof AdminDashboard !== 'undefined') {
                AdminDashboard.showNotification('Tên loại sản phẩm đã tồn tại', 'error');
            }
            return;
        }

        let updatedCategories;
        if (mode === 'add') {
            const newId = categories.length ? Math.max(...categories.map(c => c.id)) + 1 : 1;
            const newCategory = {
                id: newId,
                name,
                description,
                productCount: 0,
                status,
                createdAt: new Date().toISOString().split('T')[0]
            };
            updatedCategories = [...categories, newCategory];
            console.log('Added new category:', newCategory);

            if (typeof AdminDashboard !== 'undefined') {
                AdminDashboard.showNotification('Thêm loại sản phẩm thành công', 'success');
            }
        } else {
            const idx = categories.findIndex(c => c.name === originalName);
            if (idx === -1) {
                console.error('Category not found:', originalName);
                if (typeof AdminDashboard !== 'undefined') {
                    AdminDashboard.showNotification('Không tìm thấy loại sản phẩm', 'error');
                }
                return;
            }

            const updated = {...categories[idx], name, description, status };
            updatedCategories = [...categories.slice(0, idx), updated, ...categories.slice(idx + 1)];
            console.log('Updated category:', updated);

            // Update product categories if name changed
            if (originalName !== name) {
                const products = typeof getLocalProducts === 'function' ?
                    getLocalProducts() :
                    JSON.parse(localStorage.getItem('productsLocal') || '[]');

                let changed = false;
                products.forEach(p => {
                    if (p.catalog === originalName) {
                        p.catalog = name;
                        changed = true;
                    }
                });

                if (changed) {
                    if (typeof saveLocalProducts === 'function') {
                        saveLocalProducts(products);
                    } else {
                        localStorage.setItem('productsLocal', JSON.stringify(products));
                    }
                    window.dispatchEvent(new Event('productsUpdated'));
                    console.log('Updated product categories');
                }
            }

            if (typeof AdminDashboard !== 'undefined') {
                AdminDashboard.showNotification('Cập nhật loại sản phẩm thành công', 'success');
            }
        }

        // Save changes
        localStorage.setItem('categories', JSON.stringify(updatedCategories));
        console.log('Saved categories to localStorage');

        // Notify changes
        window.dispatchEvent(new CustomEvent('categoriesUpdated', {
            detail: {
                action: mode,
                categoryName: name,
                previousName: mode === 'edit' ? originalName : null
            }
        }));

        // Refresh UI
        loadCategories();
        closeCategoryModal();
        console.log('Category saved successfully');

    } catch (err) {
        console.error('Error saving category:', err);
        if (typeof AdminDashboard !== 'undefined') {
            AdminDashboard.showNotification('Lỗi khi lưu loại sản phẩm', 'error');
        }
    }
}

function previousPage() { if (typeof AdminDashboard !== 'undefined') AdminDashboard.showNotification('Chức năng phân trang đang được phát triển', 'info'); }

function nextPage() { if (typeof AdminDashboard !== 'undefined') AdminDashboard.showNotification('Chức năng phân trang đang được phát triển', 'info'); }

function formatDate(dateString) { if (!dateString) return ''; const d = new Date(dateString); if (isNaN(d)) return dateString; try { return d.toLocaleDateString('vi-VN'); } catch { return dateString; } }

function toggleCategoryStatusByName(name) {
    try {
        // Cập nhật trạng thái danh mục
        const categories = JSON.parse(localStorage.getItem('categories')) || sampleCategories;
        const idx = categories.findIndex(c => c && c.name === name);
        if (idx === -1) return;

        const newStatus = categories[idx].status === 'active' ? 'hidden' : 'active';
        categories[idx].status = newStatus;
        localStorage.setItem('categories', JSON.stringify(categories));

        // Cập nhật trạng thái hiển thị của tất cả sản phẩm trong danh mục
        const products = getLocalProducts();
        let hasChanges = false;
        products.forEach(product => {
            if (product.catalog === name) {
                product.visibility = newStatus === 'active' ? 'visible' : 'hidden';
                hasChanges = true;
            }
        });

        // Lưu lại các thay đổi sản phẩm nếu có
        if (hasChanges) {
            saveLocalProducts(products);
            console.log(`Đã cập nhật trạng thái hiển thị cho các sản phẩm thuộc danh mục ${name}`);
        }

        // Gửi sự kiện để thông báo thay đổi
        window.dispatchEvent(new CustomEvent('categoriesUpdated', {
            detail: {
                action: 'toggle',
                categoryName: name,
                newStatus: newStatus,
                productsUpdated: hasChanges
            }
        }));

        loadCategories();
        if (typeof AdminDashboard !== 'undefined') {
            AdminDashboard.showNotification(
                `Đã ${newStatus === 'active' ? 'hiện' : 'ẩn'} loại sản phẩm ${name} và các sản phẩm liên quan`,
                'success'
            );
        }
    } catch (e) {
        console.error('Error toggling category status:', e);
        if (typeof AdminDashboard !== 'undefined') {
            AdminDashboard.showNotification('Có lỗi xảy ra khi thay đổi trạng thái danh mục', 'error');
        }
    }
}

function deleteCategoryByName(name) {
    if (!confirm(`Bạn có chắc chắn muốn xóa loại sản phẩm "${name}"?`)) return;
    try {
        const categories = JSON.parse(localStorage.getItem('categories')) || sampleCategories;
        const category = categories.find(c => c && c.name === name);
        if (!category) return;
        const filtered = categories.filter(c => c.name !== name);
        localStorage.setItem('categories', JSON.stringify(filtered));
        const products = typeof getLocalProducts === 'function' ? getLocalProducts() : JSON.parse(localStorage.getItem('productsLocal') || '[]');
        let changed = false;
        products.forEach(p => {
            if (p.catalog === name) {
                p.catalog = '';
                changed = true;
            }
        });
        if (changed) {
            if (typeof saveLocalProducts === 'function') saveLocalProducts(products);
            else localStorage.setItem('productsLocal', JSON.stringify(products));
            window.dispatchEvent(new Event('productsUpdated'));
        }
        window.dispatchEvent(new CustomEvent('categoriesUpdated', { detail: { action: 'delete', categoryName: name } }));
        loadCategories();
        if (typeof AdminDashboard !== 'undefined') AdminDashboard.showNotification(`Đã xóa loại sản phẩm ${name}`, 'success');
    } catch (e) { console.error('Error deleting category:', e); if (typeof AdminDashboard !== 'undefined') AdminDashboard.showNotification('Lỗi khi xóa loại sản phẩm', 'error'); }
}