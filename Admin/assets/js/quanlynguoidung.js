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

// Hộp thoại hiện mật khẩu tạm ĐÚNG MỘT LẦN (không để trong thông báo toast). Đóng hộp thoại là không xem lại được.
function showTemporaryPassword(customerName, password) {
    const old = document.getElementById('tempPasswordOverlay');
    if (old) old.remove();
    const overlay = document.createElement('div');
    overlay.id = 'tempPasswordOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.6);display:flex;align-items:center;justify-content:center;padding:16px';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:12px;max-width:420px;width:100%;padding:24px;box-shadow:0 20px 50px rgba(0,0,0,.3);font-family:inherit">
        <h3 style="margin:0 0 6px;font-size:18px;color:#0f172a">Đã cấp mật khẩu tạm</h3>
        <p style="margin:0 0 14px;color:#475569;font-size:14px">Tài khoản: <b>${escKhach(customerName)}</b></p>
        <div style="display:flex;gap:8px;align-items:center;padding:12px;border:1px dashed #94a3b8;border-radius:8px;background:#f8fafc">
          <code id="tempPasswordValue" style="flex:1;font-size:20px;letter-spacing:1px;color:#0f172a;user-select:all">${escKhach(password)}</code>
          <button type="button" id="tempPasswordCopy" style="padding:6px 12px;border:1px solid #2563eb;border-radius:6px;background:#fff;color:#2563eb;cursor:pointer">Sao chép</button>
        </div>
        <ul style="margin:14px 0 0;padding-left:18px;color:#b45309;font-size:13px;line-height:1.5">
          <li>Mật khẩu này <b>chỉ hiện một lần</b>; hệ thống chỉ lưu bản đã mã hóa.</li>
          <li>Hãy gửi cho khách qua kênh riêng tư. Khách sẽ bị yêu cầu đổi mật khẩu ngay lần đăng nhập tới.</li>
        </ul>
        <div style="margin-top:18px;text-align:right"><button type="button" id="tempPasswordClose" style="padding:8px 18px;border:0;border-radius:8px;background:#2563eb;color:#fff;cursor:pointer">Đã ghi nhận, đóng</button></div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#tempPasswordClose').addEventListener('click', close);
    overlay.querySelector('#tempPasswordCopy').addEventListener('click', (event) => {
        const btn = event.currentTarget;
        const done = () => { btn.textContent = 'Đã sao chép'; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(password).then(done, () => {});
        else { const range = document.createRange(); range.selectNodeContents(overlay.querySelector('#tempPasswordValue')); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); }
    });
}

// Reset mật khẩu khách hàng: cấp mật khẩu tạm, lưu dạng băm, bắt khách đổi mật khẩu khi đăng nhập lại.
function resetPassword(id) {
    if (!confirm('Cấp lại mật khẩu cho khách hàng này? Mật khẩu hiện tại sẽ không còn dùng được.')) return;
    try {
        const rawUserList = readRawUserList();
        const userIndex = findRawUserIndex(rawUserList, id);
        if (userIndex === -1) throw new Error('Không tìm thấy tài khoản!');
        if (!window.PasswordUtil) throw new Error('Thiếu module mã hóa mật khẩu (database/password-util.js).');

        const temp = window.PasswordUtil.generateTemporary(10);
        const target = rawUserList[userIndex];
        target.matKhau = window.PasswordUtil.hash(temp);
        target.daDatLaiMatKhau = true;
        target.ngayDatLaiMatKhau = new Date().toISOString();
        delete target.resetDate;
        localStorage.setItem('userList', JSON.stringify(rawUserList));

        showTemporaryPassword(target.hoTen || target.tenDangNhap || id, temp);
        loadCustomers();
    } catch (error) {
        console.error('Lỗi khi reset mật khẩu:', error);
        const msg = 'Không thể reset mật khẩu. ' + (error && error.message ? error.message : 'Vui lòng thử lại!');
        if (typeof AdminDashboard !== 'undefined') AdminDashboard.showNotification(msg, 'error');
        else alert(msg);
    }
}

// Thay đổi trạng thái khóa/mở khóa của khách hàng
function toggleCustomerStatus(id) {
    try {
        const preview = readRawUserList()[findRawUserIndex(readRawUserList(), id)];
        const willBlock = preview && !(preview.trangThai === 'blocked' || preview.biKhoa === true);
        const who = preview ? (preview.hoTen || preview.tenDangNhap || id) : id;
        const question = willBlock
            ? `Khóa tài khoản "${who}"? Khách sẽ bị đăng xuất và không thể đăng nhập hoặc đặt hàng.`
            : `Mở khóa tài khoản "${who}"?`;
        if (!confirm(question)) return;
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
