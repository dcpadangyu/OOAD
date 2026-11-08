// Quản lý người dùng JavaScript
// Run initialization immediately if DOM is ready, otherwise on DOMContentLoaded
function onReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}

onReady(function() {
    // Khởi tạo trang quản lý người dùng
    initializeCustomerManagement();

    // Load dữ liệu khách hàng
    loadCustomers();

    // Khởi tạo các sự kiện
    initializeCustomerEvents();
});

// Escape HTML khi chèn dữ liệu vào innerHTML (dùng ShopCore.esc, có dự phòng)
function escKhach(value) {
    if (window.ShopCore && typeof window.ShopCore.esc === 'function') return window.ShopCore.esc(value);
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Khởi tạo quản lý khách hàng
function initializeCustomerManagement() {
    console.log('Customer Management initialized');

    // Cập nhật thông tin admin
    if (typeof adminSession !== 'undefined' && adminSession.isLoggedIn()) {
        const adminInfo = adminSession.getCurrentAdmin();
        if (adminInfo && adminInfo.username) {
            const adminNameElement = document.getElementById('adminName');
            if (adminNameElement) {
                adminNameElement.textContent = adminInfo.username;
            }
        }
    }
}

// Đọc userList thô từ localStorage (luôn trả về mảng)
function readRawUserList() {
    try {
        const raw = JSON.parse(localStorage.getItem('userList'));
        return Array.isArray(raw) ? raw : [];
    } catch (e) {
        return [];
    }
}

// Tạo mã khách hàng liên tiếp dạng KH001, KH002...
function generateCustomerCode(users) {
    let maxNum = 0;
    (users || []).forEach(u => {
        const m = /KH(\d+)/i.exec(String(u.maKH || ''));
        if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
    });
    return 'KH' + String(maxNum + 1).padStart(3, '0');
}

// Đảm bảo mọi người dùng đều có mã khách hàng, ghi lại nếu có mã mới
function ensureCustomerCodes(raw) {
    if (!Array.isArray(raw) || !raw.length) return raw;
    let changed = false;
    raw.forEach(u => {
        if (!u.maKH) {
            u.maKH = generateCustomerCode(raw);
            changed = true;
        }
    });
    if (changed) localStorage.setItem('userList', JSON.stringify(raw));
    return raw;
}

// Đọc danh sách khách hàng từ userList (rỗng/thiếu -> mảng rỗng, không có dữ liệu giả)
function getCustomersFromStorage() {
    const raw = readRawUserList();
    if (!raw.length) return [];

    ensureCustomerCodes(raw);
    return raw.map((u, idx) => ({
        maKhachHang: u.maKhachHang || idx + 1,
        maKH: u.maKH || generateCustomerCode(raw),
        hoTen: u.hoTen || u.thuDienTu || 'Người dùng',
        thuDienTu: u.thuDienTu || '',
        soDienThoai: u.soDienThoai || '',
        trangThai: (u.biKhoa === true || u.trangThai === 'blocked') ? 'blocked' : (u.trangThai || 'active'),
        ngayTao: u.ngayTao || new Date().toISOString().split('T')[0]
    }));
}

// Load danh sách khách hàng
function loadCustomers() {
    const customers = getCustomersFromStorage();

    const section = document.getElementById('page-customers');
    const tbody = section ? section.querySelector('#customersTableBody') : document.getElementById('customersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!customers.length) {
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'empty-row';
        emptyRow.innerHTML = '<td colspan="7" style="text-align:center;">Chưa có khách hàng nào</td>';
        tbody.appendChild(emptyRow);
        return;
    }

    customers.forEach(customer => {
        const row = createCustomerRow(customer);
        tbody.appendChild(row);
    });
}

// Tạo row cho bảng khách hàng
function createCustomerRow(customer) {
    const row = document.createElement('tr');

    const isActive = customer.trangThai === 'active';
    const statusClass = isActive ? 'status-active' : 'status-blocked';
    const statusText = isActive ? 'Hoạt động' : 'Bị khóa';

    row.innerHTML = `
        <td>${escKhach(customer.maKH || customer.maKhachHang)}</td>
        <td>${escKhach(customer.hoTen)}</td>
        <td>${escKhach(customer.thuDienTu)}</td>
        <td>${escKhach(customer.soDienThoai)}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${escKhach(formatDateKhach(customer.ngayTao))}</td>
        <td>
            <div class="action-buttons">
                <button class="btn-icon btn-reset" data-id="${escKhach(customer.maKhachHang)}" title="Reset mật khẩu">
                    <i class="fa-solid fa-key" aria-hidden="true"></i>
                </button>
                <button class="btn-icon btn-toggle" data-id="${escKhach(customer.maKhachHang)}" title="${isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}">
                    ${isActive ? '<i class="fa-solid fa-lock" aria-hidden="true"></i>' : '<i class="fa-solid fa-lock-open" aria-hidden="true"></i>'}
                </button>
            </div>
        </td>
    `;

    // Gắn sự kiện bằng addEventListener (không nội suy dữ liệu vào thuộc tính onclick)
    const resetBtn = row.querySelector('.btn-reset');
    if (resetBtn) resetBtn.addEventListener('click', () => resetPassword(String(customer.maKhachHang)));
    const toggleBtn = row.querySelector('.btn-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', () => toggleCustomerStatus(String(customer.maKhachHang)));

    return row;
}

// Khởi tạo các sự kiện
function initializeCustomerEvents() {
    // Sự kiện tìm kiếm - scope to customer page
    const section = document.getElementById('page-customers');
    const searchInput = section ? section.querySelector('#searchInput-customers') : document.getElementById('searchInput-customers');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchCustomers();
        });
    }

    // Pagination or other UI events can be initialized here
}

// Tìm kiếm khách hàng
function searchCustomers() {
    const section = document.getElementById('page-customers');
    const searchInput = section ? section.querySelector('#searchInput-customers') : document.getElementById('searchInput-customers');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const tbody = section ? section.querySelector('#customersTableBody') : document.getElementById('customersTableBody');

    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        if (row.cells.length < 4) return; // dòng "Chưa có khách hàng nào"
        const code = row.cells[0].textContent.toLowerCase();
        const name = row.cells[1].textContent.toLowerCase();
        const email = row.cells[2].textContent.toLowerCase();
        const phone = row.cells[3].textContent.toLowerCase();

        if (code.includes(searchTerm) || name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Tìm vị trí người dùng trong userList thô theo id (maKhachHang); nếu không có thì khớp email/tên
function findRawUserIndex(rawUserList, id) {
    let userIndex = rawUserList.findIndex(u => typeof u.maKhachHang !== 'undefined' && String(u.maKhachHang) === String(id));

    // Nếu không tìm thấy, ánh xạ id -> email/name qua getCustomersFromStorage()
    if (userIndex === -1) {
        const mapped = getCustomersFromStorage();
        const mappedUser = mapped.find(c => String(c.maKhachHang) === String(id));
        if (mappedUser) {
            userIndex = rawUserList.findIndex(u => {
                return (u.thuDienTu && mappedUser.thuDienTu && u.thuDienTu.toLowerCase() === mappedUser.thuDienTu.toLowerCase()) ||
                    (u.hoTen && mappedUser.hoTen && u.hoTen === mappedUser.hoTen);
            });
        }
    }
    return userIndex;
}

// Reset mật khẩu khách hàng
function resetPassword(id) {
    if (confirm('Bạn có chắc chắn muốn reset mật khẩu cho khách hàng này?')) {
        try {
            // Lấy danh sách người dùng thô từ userList
            const rawUserList = readRawUserList();
            const userIndex = findRawUserIndex(rawUserList, id);

            if (userIndex === -1) {
                throw new Error('Không tìm thấy tài khoản!');
            }

            // Tạo mật khẩu mới ngẫu nhiên
            const newPassword = generateRandomPassword();

            // Cập nhật mật khẩu mới trong raw userList
            rawUserList[userIndex].matKhau = newPassword;
            rawUserList[userIndex].daDatLaiMatKhau = true;
            rawUserList[userIndex].ngayDatLaiMatKhau = new Date().toISOString();
            delete rawUserList[userIndex].resetDate;

            // Lưu lại vào localStorage
            localStorage.setItem('userList', JSON.stringify(rawUserList));

            // Hiển thị thông báo cho quản trị viên
            if (typeof AdminDashboard !== 'undefined') {
                AdminDashboard.showNotification(
                    `Đã reset mật khẩu thành công! Mật khẩu mới: ${newPassword}`,
                    'success'
                );
            } else {
                alert(`Đã reset mật khẩu thành công! Mật khẩu mới: ${newPassword}`);
            }

            // Cập nhật lại giao diện
            loadCustomers();
        } catch (error) {
            console.error('Lỗi khi reset mật khẩu:', error);
            if (typeof AdminDashboard !== 'undefined') {
                AdminDashboard.showNotification('Không thể reset mật khẩu. Vui lòng thử lại!', 'error');
            } else {
                alert('Không thể reset mật khẩu. Vui lòng thử lại!');
            }
        }
    }
}

// Thay đổi trạng thái khóa/mở khóa của khách hàng
function toggleCustomerStatus(id) {
    try {
        // Lấy danh sách người dùng thô từ userList
        const rawUserList = readRawUserList();
        const userIndex = findRawUserIndex(rawUserList, id);

        if (userIndex === -1) {
            throw new Error('Không tìm thấy tài khoản!');
        }

        // Toggle trạng thái: cập nhật cả 'trangThai' (active/blocked) và giữ 'biKhoa' cho backward-compat
        const currentlyBlocked = rawUserList[userIndex].trangThai === 'blocked' || rawUserList[userIndex].biKhoa === true;
        const nowBlocked = !currentlyBlocked;

        rawUserList[userIndex].trangThai = nowBlocked ? 'blocked' : 'active';
        rawUserList[userIndex].biKhoa = nowBlocked;

        // Cập nhật thời gian khóa/mở khóa
        rawUserList[userIndex].ngayKhoa = nowBlocked ? new Date().toISOString() : null;

        // Lưu lại vào localStorage
        localStorage.setItem('userList', JSON.stringify(rawUserList));

        // Hiển thị thông báo cho quản trị viên
        const statusMessage = nowBlocked ? 'đã khóa' : 'đã mở khóa';
        if (typeof AdminDashboard !== 'undefined') {
            AdminDashboard.showNotification(
                `Tài khoản ${statusMessage} thành công!`,
                'success'
            );
        } else {
            alert(`Tài khoản ${statusMessage} thành công!`);
        }

        // Cập nhật lại giao diện
        loadCustomers();
    } catch (error) {
        console.error('Lỗi khi thay đổi trạng thái tài khoản:', error);
        if (typeof AdminDashboard !== 'undefined') {
            AdminDashboard.showNotification('Không thể thay đổi trạng thái tài khoản. Vui lòng thử lại!', 'error');
        } else {
            alert('Không thể thay đổi trạng thái tài khoản. Vui lòng thử lại!');
        }
    }
}

// Tạo mật khẩu ngẫu nhiên
function generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}



// Phân trang
function previousPage() {
    if (typeof AdminDashboard !== 'undefined') {
        AdminDashboard.showNotification('Chuyển về trang trước', 'info');
    }
}

function nextPage() {
    if (typeof AdminDashboard !== 'undefined') {
        AdminDashboard.showNotification('Chuyển đến trang sau', 'info');
    }
}

// Format ngày (tên riêng để không đè hàm formatDate toàn cục của file khác)
function formatDateKhach(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('vi-VN');
}
