// Quản lý loại sản phẩm JavaScript
// Ensure initialization runs whether DOMContentLoaded already fired or not
// (tên riêng để không trùng với onReady của các script admin khác)
function onReadyLoai(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}

// Initialize after function declarations so functions are global
onReadyLoai(function() {
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

// Function definitions (below). Initialization will run after definitions via onReadyLoai at file end.

function initializeCategoryManagement() {
    console.log('Category Management initialized');

    // Attach direct event listeners to buttons
    // Chỉ xử lý nút nằm trong trang Loại sản phẩm (#page-categories): các trang khác (vd. nhân viên)
    // dùng cùng class .btn-edit/.btn-delete/.btn-toggle nên không được bắt ở phạm vi toàn tài liệu.
    document.addEventListener('click', function(event) {
        const target = event.target;
        const section = document.getElementById('page-categories');
        if (!section) return;

        // Find the closest button if clicked on an icon inside button
        const button = target.closest('button');
        if (!button || !section.contains(button)) return;

        // Handle add category button
        if (button.matches('.btn-primary') && button.textContent.trim() === 'Thêm loại sản phẩm') {
            event.preventDefault();
            console.log('Add category button clicked');
            showAddCategoryModal();
            return;
        }

        const isEdit = button.classList.contains('btn-edit');
        const isDelete = button.classList.contains('btn-delete');
        const isToggle = button.classList.contains('btn-toggle');
        if (!isEdit && !isDelete && !isToggle) return;

        const row = button.closest('tr');
        const categoryName = row ? row.getAttribute('data-category-name') : null;
        if (categoryName === null || categoryName === undefined) return; // không phải dòng loại sản phẩm
        event.preventDefault();

        if (isEdit) {
            console.log('Edit button clicked for category:', categoryName);
            editCategoryByName(categoryName);
        } else if (isDelete) {
            console.log('Delete button clicked for category:', categoryName);
            deleteCategoryByName(categoryName);
        } else if (isToggle) {
            console.log('Toggle button clicked for category:', categoryName);
            toggleCategoryStatusByName(categoryName);
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

    // Số sản phẩm của loại thay đổi khi sản phẩm thêm/xóa/đổi loại
    window.addEventListener('productsUpdated', function() {
        loadCategories();
    });
}

const sampleCategories = [
    { maLoai: 'Nike', tenLoai: 'Nike', moTa: 'Các sản phẩm giày Nike chính hãng', soSanPham: 20, trangThai: 'active', ngayTao: '2024-01-15' },
    { maLoai: 'Adidas', tenLoai: 'Adidas', moTa: 'Các sản phẩm giày Adidas chính hãng', soSanPham: 22, trangThai: 'active', ngayTao: '2024-01-20' },
    { maLoai: 'Converse', tenLoai: 'Converse', moTa: 'Các sản phẩm giày Converse chính hãng', soSanPham: 20, trangThai: 'active', ngayTao: '2024-01-25' },
    { maLoai: 'MLB', tenLoai: 'MLB', moTa: 'Các sản phẩm giày MLB chính hãng', soSanPham: 20, trangThai: 'active', ngayTao: '2024-01-30' },
    { maLoai: 'Vans', tenLoai: 'Vans', moTa: 'Các sản phẩm giày Vans chính hãng', soSanPham: 18, trangThai: 'active', ngayTao: '2024-02-01' }
];

function loadCategories() {
    try {
        const section = document.getElementById('page-categories');
        const tbody = section ? section.querySelector('#categoriesTableBody') : document.getElementById('categoriesTableBody');
        if (!tbody) return;

        const products = typeof getLocalProducts === 'function' ? getLocalProducts() : JSON.parse(localStorage.getItem('productsLocal') || '[]');
        // Đếm SỐ SẢN PHẨM của từng loại (không phải tổng số lượng tồn kho)
        const catalogCounts = {};
        const dangBan = {}; // so san pham dang hien tren trang chu (chua an, co gia, con hang)
        products.forEach(p => {
            const c = (p.maLoai || '').toString();
            if (!c) return;
            catalogCounts[c] = (catalogCounts[c] || 0) + 1;
            if (p.trangThaiHienThi !== 'hidden' && Number(p.giaBan) > 0 && Number(p.soLuongTon) > 0) dangBan[c] = (dangBan[c] || 0) + 1;
        });

        const stored = JSON.parse(localStorage.getItem('categories')) || [];
        const storedMap = {};
        stored.forEach(s => { if (s && s.tenLoai) storedMap[s.tenLoai] = s; });

        const categories = [];
        const seen = new Set();

        Object.keys(catalogCounts).forEach((name, idx) => {
            const meta = storedMap[name] || {};
            categories.push({ maLoai: name, tenLoai: name, moTa: meta.moTa || '', soSanPham: catalogCounts[name] || 0, trangThai: meta.trangThai || 'active', ngayTao: meta.ngayTao || new Date().toISOString().split('T')[0] });
            seen.add(name);
        });

        // Loại đã lưu nhưng hiện chưa có sản phẩm nào => số sản phẩm = 0
        stored.forEach(s => { if (s && s.tenLoai && !seen.has(s.tenLoai)) categories.push({ maLoai: s.tenLoai, tenLoai: s.tenLoai, moTa: s.moTa || '', soSanPham: 0, trangThai: s.trangThai || 'active', ngayTao: s.ngayTao || new Date().toISOString().split('T')[0] }); });

        localStorage.setItem('categories', JSON.stringify(categories));

        tbody.innerHTML = '';
        categories.forEach((cat, idx) => tbody.appendChild(createCategoryRow(cat, idx + 1, dangBan[cat.tenLoai] || 0)));
        // Giữ nguyên nội dung ô tìm kiếm (nếu đang lọc)
        searchCategories();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function createCategoryRow(category, stt, soDangBan) {
    const esc = (value) => (window.ShopCore && ShopCore.esc ? ShopCore.esc(value) : String(value === undefined || value === null ? '' : value));
    const row = document.createElement('tr');
    row.setAttribute('data-category-id', category.maLoai);
    row.setAttribute('data-category-name', category.tenLoai);
    const statusClass = category.trangThai === 'active' ? 'status-active' : 'status-hidden';
    const statusText = category.trangThai === 'active' ? 'Hiển thị' : 'Ẩn';

    // Don't use inline onclick handlers
    // Cột đầu là số thứ tự (khóa tự nhiên maLoai trùng với tên loại nên không hiển thị lại)
    row.innerHTML = `
            <td>${stt}</td>
            <td>${esc(category.tenLoai)}</td>
            <td>${esc(category.moTa || '')}</td>
            <td>${Number(category.soSanPham) || 0}</td>
            <td title="${category.trangThai === 'active' ? 'San pham dang hien tren trang chu' : 'Loai dang an nen khong san pham nao hien tren trang chu'}">${category.trangThai === 'active' ? Number(soDangBan) || 0 : 0}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${esc(formatDateLoai(category.ngayTao))}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" title="Sửa"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon btn-toggle" title="${category.trangThai === 'active' ? 'Ẩn' : 'Hiện'}">${category.trangThai === 'active' ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>'}</button>
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
    form.dataset.originalName = '';
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
    try { return (JSON.parse(localStorage.getItem('categories')) || sampleCategories).find(c => c && c.tenLoai === name) || null; } catch (e) { console.error(e); return null; }
}

function editCategoryByName(name) {
    const category = findCategoryByName(name);
    if (!category) return;
    const modal = document.getElementById('categoryModal');
    const form = document.getElementById('categoryForm');
    if (!modal || !form) return;
    document.getElementById('categoryName').value = category.tenLoai || '';
    document.getElementById('categoryDescription').value = category.moTa || '';
    document.getElementById('categoryStatus').value = category.trangThai || 'active';
    form.dataset.mode = 'edit';
    form.dataset.originalName = category.tenLoai;
    form.dataset.id = category.maLoai;
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
        const duplicate = categories.some(c => c.tenLoai === name && (mode === 'add' || c.tenLoai !== originalName));
        if (duplicate) {
            console.error('Duplicate category name:', name);
            if (typeof AdminDashboard !== 'undefined') {
                AdminDashboard.showNotification('Tên loại sản phẩm đã tồn tại', 'error');
            }
            return;
        }

        let updatedCategories;
        let successMessage;
        let renamedProducts = null; // danh sách sản phẩm đã đổi maLoai (nếu đổi tên loại)
        if (mode === 'add') {
            const newCategory = {
                maLoai: name,
                tenLoai: name,
                moTa: description,
                soSanPham: 0,
                trangThai: status,
                ngayTao: new Date().toISOString().split('T')[0]
            };
            updatedCategories = [...categories, newCategory];
            console.log('Added new category:', newCategory);
            successMessage = 'Thêm loại sản phẩm thành công';
        } else {
            const idx = categories.findIndex(c => c.tenLoai === originalName);
            if (idx === -1) {
                console.error('Category not found:', originalName);
                if (typeof AdminDashboard !== 'undefined') {
                    AdminDashboard.showNotification('Không tìm thấy loại sản phẩm', 'error');
                }
                return;
            }

            // Chỉ đổi trạng thái của LOẠI (không đụng tới trạng thái riêng của từng sản phẩm)
            const updated = {...categories[idx], maLoai: name, tenLoai: name, moTa: description, trangThai: status };
            updatedCategories = [...categories.slice(0, idx), updated, ...categories.slice(idx + 1)];
            console.log('Updated category:', updated);

            // Update product categories if name changed
            if (originalName !== name) {
                const products = typeof getLocalProducts === 'function' ?
                    getLocalProducts() :
                    JSON.parse(localStorage.getItem('productsLocal') || '[]');

                let changed = false;
                products.forEach(p => {
                    if (p.maLoai === originalName) {
                        p.maLoai = name;
                        changed = true;
                    }
                });
                if (changed) renamedProducts = products;
            }
            successMessage = 'Cập nhật loại sản phẩm thành công';
        }

        // Save changes (loại trước, rồi tới sản phẩm; nếu lưu sản phẩm lỗi thì hoàn tác loại)
        const categoriesTruoc = localStorage.getItem('categories');
        localStorage.setItem('categories', JSON.stringify(updatedCategories));
        console.log('Saved categories to localStorage');

        if (renamedProducts) {
            let luuDuoc;
            if (typeof saveLocalProducts === 'function') {
                luuDuoc = saveLocalProducts(renamedProducts) !== false;
            } else {
                try { localStorage.setItem('productsLocal', JSON.stringify(renamedProducts)); luuDuoc = true; } catch (e) { luuDuoc = false; }
            }
            if (!luuDuoc) {
                if (categoriesTruoc === null) localStorage.removeItem('categories');
                else localStorage.setItem('categories', categoriesTruoc);
                if (typeof AdminDashboard !== 'undefined') {
                    AdminDashboard.showNotification('Không thể lưu sản phẩm khi đổi tên loại (bộ nhớ đầy). Đã hoàn tác.', 'error');
                }
                return;
            }
            console.log('Updated product categories');
        }

        if (typeof AdminDashboard !== 'undefined') {
            AdminDashboard.showNotification(successMessage, 'success');
        }

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

// Tên riêng (không dùng formatDate toàn cục để khỏi đè hàm của admin.js / admin-info.js)
function formatDateLoai(dateString) { if (!dateString) return ''; const d = new Date(dateString); if (isNaN(d)) return dateString; try { return d.toLocaleDateString('vi-VN'); } catch { return dateString; } }

// Nút ẩn/hiện CHỈ đổi trạng thái của loại ("active"/"hidden"); cửa hàng lọc sản phẩm theo trạng thái loại,
// còn trạng thái hiển thị riêng của từng sản phẩm được giữ nguyên.
function toggleCategoryStatusByName(name) {
    try {
        const categories = JSON.parse(localStorage.getItem('categories')) || sampleCategories;
        const idx = categories.findIndex(c => c && c.tenLoai === name);
        if (idx === -1) return;

        const newStatus = categories[idx].trangThai === 'active' ? 'hidden' : 'active';
        categories[idx].trangThai = newStatus;
        localStorage.setItem('categories', JSON.stringify(categories));

        // Gửi sự kiện để thông báo thay đổi
        window.dispatchEvent(new CustomEvent('categoriesUpdated', {
            detail: {
                action: 'toggle',
                categoryName: name,
                newStatus: newStatus,
                productsUpdated: false
            }
        }));

        loadCategories();
        if (typeof AdminDashboard !== 'undefined') {
            AdminDashboard.showNotification(
                newStatus === 'active'
                    ? `Đã hiện loại ${name} trên cửa hàng (các sản phẩm giữ nguyên trạng thái riêng)`
                    : `Đã ẩn loại ${name} khỏi cửa hàng (các sản phẩm giữ nguyên trạng thái riêng)`,
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
    if (name === null || name === undefined) return;
    const inUse = (typeof getLocalProducts === 'function' ? getLocalProducts() : JSON.parse(localStorage.getItem('productsLocal') || '[]')).filter(p => p.maLoai === name).length;
    if (inUse > 0) {
        const message = `Không thể xóa loại "${name}" vì vẫn còn ${inUse} sản phẩm thuộc loại này. Hãy chuyển hoặc xóa các sản phẩm trước, hoặc dùng chức năng Ẩn.`;
        if (typeof AdminDashboard !== 'undefined') AdminDashboard.showNotification(message, 'error'); else alert(message);
        return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa loại sản phẩm "${name}"?`)) return;
    try {
        const categories = JSON.parse(localStorage.getItem('categories')) || sampleCategories;
        const category = categories.find(c => c && c.tenLoai === name);
        if (!category) return;
        const filtered = categories.filter(c => c.tenLoai !== name);
        localStorage.setItem('categories', JSON.stringify(filtered));
        // Không còn sản phẩm nào thuộc loại này (đã kiểm tra ở trên) nên không cần sửa sản phẩm.
        window.dispatchEvent(new CustomEvent('categoriesUpdated', { detail: { action: 'delete', categoryName: name } }));
        loadCategories();
        if (typeof AdminDashboard !== 'undefined') AdminDashboard.showNotification(`Đã xóa loại sản phẩm ${name}`, 'success');
    } catch (e) { console.error('Error deleting category:', e); if (typeof AdminDashboard !== 'undefined') AdminDashboard.showNotification('Lỗi khi xóa loại sản phẩm', 'error'); }
}
