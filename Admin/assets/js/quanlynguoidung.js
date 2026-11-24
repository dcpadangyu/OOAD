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
                <button class="btn-icon btn-history" data-id="${escKhach(customer.maKhachHang)}" title="Lịch sử mua hàng">
                    <i class="fa-solid fa-receipt" aria-hidden="true"></i>
                </button>
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
    const historyBtn = row.querySelector('.btn-history');
    if (historyBtn) historyBtn.addEventListener('click', () => xemLichSuMuaHang(customer));
    const resetBtn = row.querySelector('.btn-reset');
    if (resetBtn) resetBtn.addEventListener('click', () => resetPass(String(customer.maKhachHang)));
    const toggleBtn = row.querySelector('.btn-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', () => capNhatTrangThaiTaiKhoan(String(customer.maKhachHang)));

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
function resetPass(id) {
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
            // Lưu dạng băm; mật khẩu tạm chỉ hiện một lần cho Admin để báo khách.
            rawUserList[userIndex].matKhau = window.PasswordUtil ? PasswordUtil.hash(newPassword) : newPassword;
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
function capNhatTrangThaiTaiKhoan(id) {
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

// ==================== UC08: Lịch sử mua hàng của khách hàng ====================
const LSMH_TRANG_THAI = { moiDat: 'Mới đặt', daXuLy: 'Đã xử lý', daGiao: 'Đã giao', huy: 'Hủy' };
const LSMH_THANH_TOAN = { paid: 'Đã thanh toán', unpaid: 'Chưa thanh toán' };
const LSMH_PHUONG_THUC = { COD: 'Thanh toán khi nhận hàng', PayBank: 'Chuyển khoản', PayStore: 'Nhận tại cửa hàng' };

function lsmhTien(v) {
    return (Number(v) || 0).toLocaleString('vi-VN') + '₫';
}

// Gộp đơn từ kho quản trị (ordersLocal) và kho của khách (DanhSachDatHang), bỏ trùng theo mã đơn
function lsmhDocDon() {
    const map = {};
    ['DanhSachDatHang', 'ordersLocal'].forEach(key => {
        let list = [];
        try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { list = []; }
        (Array.isArray(list) ? list : []).forEach(o => { if (o && o.maDonHang) map[o.maDonHang] = Object.assign({}, map[o.maDonHang] || {}, o); });
    });
    return Object.values(map);
}

function lsmhCuaKhach(customer) {
    const id = String(customer.maKhachHang || '');
    const email = String(customer.thuDienTu || '').toLowerCase();
    return lsmhDocDon()
        .filter(o => {
            if (id && String(o.maKhachHang || '') === id) return true;
            if (id && o.khachHang && String(o.khachHang.maKhachHang || '') === id) return true;
            return !!email && o.khachHang && String(o.khachHang.thuDienTu || '').toLowerCase() === email;
        })
        .sort((a, b) => (new Date(b.ngayDat).getTime() || 0) - (new Date(a.ngayDat).getTime() || 0));
}

function lsmhModal() {
    let modal = document.getElementById('LSMH_modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'LSMH_modal';
    modal.className = 'LSMH_modal';
    modal.innerHTML = `
        <div class="LSMH_box" role="dialog" aria-modal="true" aria-labelledby="LSMH_title">
            <div class="LSMH_head">
                <h3 id="LSMH_title">Lịch sử mua hàng</h3>
                <button type="button" class="LSMH_close" aria-label="Đóng">&times;</button>
            </div>
            <div class="LSMH_body" id="LSMH_body"></div>
        </div>`;
    document.body.appendChild(modal);
    const dong = () => { modal.style.display = 'none'; };
    modal.querySelector('.LSMH_close').addEventListener('click', dong);
    modal.addEventListener('click', e => { if (e.target === modal) dong(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.style.display === 'flex') dong(); });
    return modal;
}

function lsmhChiTiet(o) {
    const dong = (o.chiTiet || []).map((it, i) => {
        const gia = Number(it.donGia != null ? it.donGia : it.giaBan) || 0;
        const sl = Number(it.soLuong) || 0;
        return `<tr><td>${i + 1}</td><td>${escKhach(it.maSanPham)}</td><td>${escKhach(it.tenSanPham)}</td>
            <td>${escKhach(it.kichCoDaChon || '—')}</td><td>${sl}</td><td>${lsmhTien(gia)}</td><td>${lsmhTien(gia * sl)}</td></tr>`;
    }).join('') || '<tr><td colspan="7" style="text-align:center">Không có sản phẩm</td></tr>';
    return `
        <div class="LSMH_detail">
            <div class="LSMH_info">
                <div><b>Người nhận:</b> ${escKhach(o.tenNguoiNhan || '—')} · ${escKhach(o.soDienThoaiNhan || '')}</div>
                <div><b>Địa chỉ:</b> ${escKhach(o.diaChiGiaoHang || '—')}</div>
                <div><b>Thanh toán:</b> ${escKhach(LSMH_PHUONG_THUC[o.phuongThucThanhToan] || o.phuongThucThanhToan || '—')} (${escKhach(LSMH_THANH_TOAN[o.trangThaiThanhToan] || 'Chưa thanh toán')})</div>
            </div>
            <table class="LSMH_table">
                <thead><tr><th>STT</th><th>Mã SP</th><th>Tên</th><th>Size</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
                <tbody>${dong}</tbody>
            </table>
            <div class="LSMH_sum">
                <span>Tiền hàng: <b>${lsmhTien(o.tamTinh)}</b></span>
                <span>Giảm giá voucher${o.maVoucher ? ' (' + escKhach(o.maVoucher) + ')' : ''}: <b>-${lsmhTien(o.giamGia)}</b></span>
                <span>Phí vận chuyển: <b>${lsmhTien(o.tienVanChuyen)}</b></span>
                <span>Tổng tiền: <b>${lsmhTien(o.tongTien)}</b></span>
            </div>
        </div>`;
}

function xemLichSuMuaHang(customer) {
    const modal = lsmhModal();
    const body = modal.querySelector('#LSMH_body');
    modal.querySelector('#LSMH_title').textContent = `Lịch sử mua hàng – ${customer.hoTen || ''} (${customer.maKH || customer.maKhachHang})`;
    const raw = readRawUserList();
    if (findRawUserIndex(raw, String(customer.maKhachHang)) === -1) {
        body.innerHTML = '<p class="LSMH_empty">Tài khoản khách hàng không còn tồn tại.</p>';
        modal.style.display = 'flex';
        return;
    }
    const don = lsmhCuaKhach(customer);
    if (!don.length) {
        body.innerHTML = '<p class="LSMH_empty">Khách hàng chưa có đơn hàng nào.</p>';
    } else {
        body.innerHTML = `
            <p class="LSMH_note">${don.length} đơn hàng · bấm vào một đơn để xem chi tiết</p>
            <table class="LSMH_table LSMH_list">
                <thead><tr><th>Mã đơn</th><th>Ngày đặt</th><th>Tổng tiền</th><th>Trạng thái</th><th></th></tr></thead>
                <tbody>${don.map(o => `
                    <tr class="LSMH_row" data-id="${escKhach(o.maDonHang)}">
                        <td><b>${escKhach(o.maDonHang)}</b></td>
                        <td>${escKhach(new Date(o.ngayDat).toLocaleString('vi-VN'))}</td>
                        <td>${lsmhTien(o.tongTien)}</td>
                        <td>${escKhach(LSMH_TRANG_THAI[o.trangThaiQuanTri] || o.trangThaiQuanTri || 'Mới đặt')}</td>
                        <td><button type="button" class="LSMH_toggle">Chi tiết</button></td>
                    </tr>
                    <tr class="LSMH_detailRow" data-for="${escKhach(o.maDonHang)}" hidden><td colspan="5">${lsmhChiTiet(o)}</td></tr>`).join('')}
                </tbody>
            </table>`;
        body.querySelectorAll('.LSMH_row').forEach(tr => tr.addEventListener('click', () => {
            const detail = body.querySelector(`.LSMH_detailRow[data-for="${CSS.escape(tr.dataset.id)}"]`);
            if (!detail) return;
            detail.hidden = !detail.hidden;
            const btn = tr.querySelector('.LSMH_toggle');
            if (btn) btn.textContent = detail.hidden ? 'Chi tiết' : 'Thu gọn';
        }));
    }
    modal.style.display = 'flex';
}
