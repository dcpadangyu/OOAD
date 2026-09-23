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

// Dữ liệu mẫu khách hàng (fallback)
const sampleCustomers = [{
        id: 1,
        name: 'Nguyễn Văn An',
        email: 'nguyenvanan@email.com',
        phone: '0123456789',
        status: 'active',
        createdAt: '2024-01-15'
    },
    {
        id: 2,
        name: 'Trần Thị Bình',
        email: 'tranthibinh@email.com',
        phone: '0987654321',
        status: 'active',
        createdAt: '2024-01-20'
    },
    {
        id: 3,
        name: 'Lê Văn Cường',
        email: 'levancuong@email.com',
        phone: '0369258147',
        status: 'blocked',
        createdAt: '2024-01-25'
    },
    {
        id: 4,
        name: 'Phạm Thị Dung',
        email: 'phamthidung@email.com',
        phone: '0741852963',
        status: 'active',
        createdAt: '2024-02-01'
    },
    {
        id: 5,
        name: 'Hoàng Văn Em',
        email: 'hoangvanem@email.com',
        phone: '0852741963',
        status: 'blocked',
        createdAt: '2024-02-05'
    }
];

// Tạo mã khách hàng liên tiếp dạng KH001, KH002...
function generateCustomerCode(users) {
    let maxNum = 0;
    (users || []).forEach(u => {
        const m = /KH(\d+)/i.exec(String(u.customerCode || ''));
        if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
    });
    return 'KH' + String(maxNum + 1).padStart(3, '0');
}

// Đảm bảo mọi người dùng đều có mã khách hàng, ghi lại nếu có mã mới
function ensureCustomerCodes(raw) {
    if (!Array.isArray(raw) || !raw.length) return raw;
    let changed = false;
    raw.forEach(u => {
        if (!u.customerCode) {
            u.customerCode = generateCustomerCode(raw);
            changed = true;
        }
    });
    if (changed) localStorage.setItem('userList', JSON.stringify(raw));
    return raw;
}

// Đọc danh sách khách hàng từ localStorage hoặc dữ liệu mẫu
function getCustomersFromStorage() {
    const raw = JSON.parse(localStorage.getItem('userList')) || null;
    if (raw && Array.isArray(raw) && raw.length) {
        ensureCustomerCodes(raw);
        // Bảng dữ liệu userList có tồn tại, ánh xạ sang định dạng khách hàng
        return raw.map((u, idx) => ({
            id: u.id || idx + 1,
            customerCode: u.customerCode || generateCustomerCode(raw),
            name: u.userName || u.name || u.email || 'Người dùng',
            email: u.email || '',
            phone: u.phone || u.phoneNumber || '',
            status: u.status || 'active',
            createdAt: u.createdAt || (u.registeredAt || new Date().toISOString().split('T')[0])
        }));
    }

    // Không có userList, kiểm tra khóa 'customers' có sẵn
    const legacy = JSON.parse(localStorage.getItem('customers')) || sampleCustomers;
    return legacy.map((c, idx) => ({
        id: c.id || idx + 1,
        customerCode: c.customerCode || generateCustomerCode(legacy),
        name: c.name || c.userName || c.email || 'Người dùng',
        email: c.email || '',
        phone: c.phone || '',
        status: c.status || 'active',
        createdAt: c.createdAt || (c.registeredAt || new Date().toISOString().split('T')[0])
    }));
}

// Ghi lại danh sách khách hàng vào localStorage (cập nhật userList nếu có)
function writeBackToUserList(updatedCustomers) {
    const raw = JSON.parse(localStorage.getItem('userList')) || [];
    if (!Array.isArray(raw) || raw.length === 0) {
        // if no raw userList, write customers into 'customers' key (legacy)
        localStorage.setItem('customers', JSON.stringify(updatedCustomers));
        return;
    }

    const mapped = raw.map(u => {
        const match = updatedCustomers.find(c => (c.email && u.email && c.email.toLowerCase() === u.email.toLowerCase()) || (c.name && u.userName && c.name === u.userName));
        if (match) {
            return Object.assign({}, u, {
                phone: u.phone || match.phone || '',
                status: match.status || u.status,
                createdAt: u.createdAt || match.createdAt || new Date().toISOString().split('T')[0]
            });
        }
        return u;
    });

    localStorage.setItem('userList', JSON.stringify(mapped));
}

// Load danh sách khách hàng
function loadCustomers() {
    // Ưu tiên tải từ taikhoan.js userList trong localStorage, nếu không có thì sử dụng 'customers' hoặc dữ liệu mẫu
    let customers = getCustomersFromStorage();

    const section = document.getElementById('page-customers');
    const tbody = section ? section.querySelector('#customersTableBody') : document.getElementById('customersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    customers.forEach(customer => {
        const row = createCustomerRow(customer);
        tbody.appendChild(row);
    });
}

// Tạo row cho bảng khách hàng
function createCustomerRow(customer) {
    const row = document.createElement('tr');

    const statusClass = customer.status === 'active' ? 'status-active' : 'status-blocked';
    const statusText = customer.status === 'active' ? 'Hoạt động' : 'Bị khóa';
    const safeId = String(customer.id).replace(/'/g, "\\'");

    row.innerHTML = `
        <td>${customer.customerCode || customer.id}</td>
        <td>${customer.name}</td>
        <td>${customer.email}</td>
        <td>${customer.phone}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${formatDate(customer.createdAt)}</td>
        <td>
            <div class="action-buttons">
                <button class="btn-icon btn-reset" onclick="resetPassword('${safeId}')" title="Reset mật khẩu">
                    <i class="fa-solid fa-key" aria-hidden="true"></i>
                </button>
                <button class="btn-icon btn-toggle" onclick="toggleCustomerStatus('${safeId}')" title="${customer.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}">
                    ${customer.status === 'active' ? '<i class="fa-solid fa-lock" aria-hidden="true"></i>' : '<i class="fa-solid fa-lock-open" aria-hidden="true"></i>'}
                </button>
            </div>
        </td>
    `;

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

// Reset mật khẩu khách hàng
function resetPassword(id) {
    if (confirm('Bạn có chắc chắn muốn reset mật khẩu cho khách hàng này?')) {
        try {
            // Lấy danh sách người dùng thô từ userList
            const rawUserList = JSON.parse(localStorage.getItem('userList')) || [];

            // Thử tìm theo id nếu có
            let userIndex = rawUserList.findIndex(u => u.id === id || (typeof u.id !== 'undefined' && String(u.id) === String(id)));

            // Nếu không tìm thấy, ánh xạ id -> email/name qua getCustomersFromStorage()
            if (userIndex === -1) {
                const mapped = getCustomersFromStorage();
                const mappedUser = mapped.find(c => String(c.id) === String(id));
                if (mappedUser) {
                    userIndex = rawUserList.findIndex(u => {
                        return (u.email && mappedUser.email && u.email.toLowerCase() === mappedUser.email.toLowerCase()) ||
                            (u.userName && mappedUser.name && u.userName === mappedUser.name);
                    });
                }
            }

            if (userIndex !== -1) {
                // Tạo mật khẩu mới ngẫu nhiên
                const newPassword = generateRandomPassword();

                // Cập nhật mật khẩu mới trong raw userList
                rawUserList[userIndex].password = newPassword;
                rawUserList[userIndex].passwordReset = true;
                rawUserList[userIndex].resetDate = new Date().toISOString();

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
            } else {
                // Nếu không tìm thấy trong userList, thử cập nhật vào legacy 'customers'
                const legacy = JSON.parse(localStorage.getItem('customers')) || [];
                const legacyIndex = legacy.findIndex(c => String(c.id) === String(id) || (c.email && mappedUser && c.email.toLowerCase() === mappedUser.email.toLowerCase()));
                if (legacyIndex !== -1) {
                    // Tạo mật khẩu mới ngẫu nhiên
                    const newPassword = generateRandomPassword();
                    legacy[legacyIndex].password = newPassword;
                    legacy[legacyIndex].passwordReset = true;
                    legacy[legacyIndex].resetDate = new Date().toISOString();
                    localStorage.setItem('customers', JSON.stringify(legacy));
                    if (typeof AdminDashboard !== 'undefined') {
                        AdminDashboard.showNotification(`Đã reset mật khẩu thành công! Mật khẩu mới: ${newPassword}`, 'success');
                    } else {
                        alert(`Đã reset mật khẩu thành công! Mật khẩu mới: ${newPassword}`);
                    }
                    loadCustomers();
                } else {
                    throw new Error('Không tìm thấy tài khoản!');
                }
            }
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
        const rawUserList = JSON.parse(localStorage.getItem('userList')) || [];

        // Thử tìm theo id nếu có
        let userIndex = rawUserList.findIndex(u => u.id === id || (typeof u.id !== 'undefined' && String(u.id) === String(id)));

        // Nếu không tìm thấy, ánh xạ id -> email/name qua getCustomersFromStorage()
        if (userIndex === -1) {
            const mapped = getCustomersFromStorage();
            const mappedUser = mapped.find(c => String(c.id) === String(id));
            if (mappedUser) {
                userIndex = rawUserList.findIndex(u => {
                    return (u.email && mappedUser.email && u.email.toLowerCase() === mappedUser.email.toLowerCase()) ||
                        (u.userName && mappedUser.name && u.userName === mappedUser.name);
                });
            }
        }

        if (userIndex !== -1) {
            // Toggle trạng thái: cập nhật cả 'status' (active/blocked) và giữ 'locked' cho backward-compat
            const currentlyBlocked = rawUserList[userIndex].status === 'blocked' || rawUserList[userIndex].locked === true;
            const nowBlocked = !currentlyBlocked;

            rawUserList[userIndex].status = nowBlocked ? 'blocked' : 'active';
            rawUserList[userIndex].locked = nowBlocked;

            // Cập nhật thời gian khóa/mở khóa
            rawUserList[userIndex].lockDate = nowBlocked ? new Date().toISOString() : null;

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
        } else {
            // Nếu không có raw userList (legacy), cập nhật vào khóa 'customers'
            const legacy = JSON.parse(localStorage.getItem('customers')) || [];
            const legacyIndex = legacy.findIndex(c => String(c.id) === String(id));
            if (legacyIndex !== -1) {
                const currentlyBlocked = legacy[legacyIndex].status === 'blocked' || legacy[legacyIndex].locked === true;
                const nowBlocked = !currentlyBlocked;
                legacy[legacyIndex].status = nowBlocked ? 'blocked' : 'active';
                legacy[legacyIndex].locked = nowBlocked;
                legacy[legacyIndex].lockDate = nowBlocked ? new Date().toISOString() : null;
                localStorage.setItem('customers', JSON.stringify(legacy));
                if (typeof AdminDashboard !== 'undefined') {
                    AdminDashboard.showNotification(`Tài khoản ${nowBlocked ? 'đã khóa' : 'đã mở khóa'} thành công!`, 'success');
                } else {
                    alert(`Tài khoản ${nowBlocked ? 'đã khóa' : 'đã mở khóa'} thành công!`);
                }
                loadCustomers();
            } else {
                throw new Error('Không tìm thấy tài khoản!');
            }
        }
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

// Format ngày
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}