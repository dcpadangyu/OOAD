// DOM Elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const rememberCheckbox = document.getElementById('remember');
const loginBtn = document.querySelector('.login-btn');
const notification = document.getElementById('notification');

// Dữ liệu đăng nhập mẫu
// Mật khẩu quản trị lưu dạng băm (xem database/password-util.js), không để chữ thường trong mã nguồn.
const adminCredentials = {
    'admin01': 'sha256$f8c652c2606589b2$46ccf139b16c25b3f948371003d2482eb7a92ec13270c20cf4238d4867f993ad',
    'admin02': 'sha256$080e9f55a6f461b4$cf9a10676d92394ea92a355f9f53973020685ee515b8a4a73ea23e670489a5f3',
    'admin03': 'sha256$b8bad3ef629b21e4$1e8a27f2c4ae5ed618ce33ec1ef622db88df3269007f938294703c4debce3202'
};

// Hàm hiển thị thông báo
function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Hàm kiểm tra đăng nhập
function validateLogin(username, password) {
    // Kiểm tra thông tin đăng nhập
    if (!username || !password) {
        showNotification('Vui lòng nhập đầy đủ thông tin!', 'error');
        return false;
    }

    // Kiểm tra độ dài username
    if (username.length < 3) {
        showNotification('Tên đăng nhập phải có ít nhất 3 ký tự!', 'error');
        return false;
    }

    // Kiểm tra độ dài password
    if (password.length < 6) {
        showNotification('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
        return false;
    }

    return true;
}

// Hàm xử lý đăng nhập
function handleLogin(username, password) {
    // Giả lập thời gian xử lý
    return new Promise((resolve) => {
        setTimeout(() => {
            // Kiểm tra thông tin đăng nhập
            if (adminCredentials[username] && window.PasswordUtil && window.PasswordUtil.verify(password, adminCredentials[username])) {
                resolve({
                    success: true,
                    message: 'Đăng nhập thành công!'
                });
            } else {
                resolve({
                    success: false,
                    message: 'Tên đăng nhập hoặc mật khẩu không đúng!'
                });
            }
        }, 1500);
    });
}

// Hàm lưu thông tin đăng nhập
function saveLoginInfo(username, remember) {
    if (remember) {
        localStorage.setItem('rememberedUsername', username);
        localStorage.setItem('rememberLogin', 'true');
    } else {
        localStorage.removeItem('rememberedUsername');
        localStorage.removeItem('rememberLogin');
    }
}

// Hàm khôi phục thông tin đăng nhập
function loadSavedLoginInfo() {
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    const rememberLogin = localStorage.getItem('rememberLogin');

    if (rememberedUsername && rememberLogin === 'true') {
        usernameInput.value = rememberedUsername;
        rememberCheckbox.checked = true;
        passwordInput.focus();
    }
}

// Hàm thêm hiệu ứng loading
function setLoadingState(loading) {
    if (loading) {
        loginBtn.disabled = true;
        loginBtn.classList.add('loading');
        loginBtn.textContent = 'Đang xử lý...';
    } else {
        loginBtn.disabled = false;
        loginBtn.classList.remove('loading');
        loginBtn.textContent = 'Đăng nhập';
    }
}

// Event listener cho form submit
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (loginBtn.disabled) return; // đang xử lý một lần đăng nhập

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const remember = rememberCheckbox.checked;

    // Kiểm tra dữ liệu đầu vào
    if (!validateLogin(username, password)) {
        return;
    }

    // Thêm hiệu ứng loading
    setLoadingState(true);

    try {
        // Xử lý đăng nhập
        const result = await handleLogin(username, password);

        if (result.success) {
            // Lưu thông tin đăng nhập nếu được chọn
            saveLoginInfo(username, remember);

            // Hiển thị thông báo thành công
            showNotification(result.message, 'success');

            // Xóa phiên nhân viên còn sót lại trong cùng tab (để getCurrentAdmin() trả về đúng admin)
            if (typeof employeeSession !== 'undefined' && typeof employeeSession.logout === 'function') {
                employeeSession.logout();
            }
            ['nvLoggedIn', 'nvUsername', 'nvFullName', 'nvChucVu', 'nvLoginTime'].forEach(function(key) {
                sessionStorage.removeItem(key);
            });

            // Lưu session và chuyển hướng
            sessionStorage.setItem('adminLoggedIn', 'true');
            sessionStorage.setItem('adminUsername', username);
            sessionStorage.setItem('loginTime', new Date().toISOString());

            setTimeout(() => {
                showNotification('Chuyển hướng đến trang quản trị...', 'success');
                window.location.href = 'TrangChu_Admin.html';
            }, 2000);
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Có lỗi xảy ra, vui lòng thử lại!', 'error');
        console.error('Login error:', error);
    } finally {
        // Tắt hiệu ứng loading
        setLoadingState(false);
    }
});

// Event listener cho input validation
usernameInput.addEventListener('input', function() {
    const icon = this.parentElement.querySelector('.input-icon');
    if (this.value.length > 0) {
        this.style.borderColor = '#333';
        icon.style.color = '#333';
    } else {
        this.style.borderColor = '#e0e0e0';
        icon.style.color = '#666';
    }
});

passwordInput.addEventListener('input', function() {
    const icon = this.parentElement.querySelector('.input-icon');
    if (this.value.length > 0) {
        this.style.borderColor = '#333';
        icon.style.color = '#333';
    } else {
        this.style.borderColor = '#e0e0e0';
        icon.style.color = '#666';
    }
});

// Event listener cho focus/blur
usernameInput.addEventListener('focus', function() {
    const icon = this.parentElement.querySelector('.input-icon');
    icon.style.color = '#333';
    icon.style.transform = 'scale(1.1)';
});

usernameInput.addEventListener('blur', function() {
    const icon = this.parentElement.querySelector('.input-icon');
    icon.style.transform = 'scale(1)';
    if (this.value.length === 0) {
        icon.style.color = '#666';
    }
});

passwordInput.addEventListener('focus', function() {
    const icon = this.parentElement.querySelector('.input-icon');
    icon.style.color = '#333';
    icon.style.transform = 'scale(1.1)';
});

passwordInput.addEventListener('blur', function() {
    const icon = this.parentElement.querySelector('.input-icon');
    icon.style.transform = 'scale(1)';
    if (this.value.length === 0) {
        icon.style.color = '#666';
    }
});

// Phím Enter: dùng submit gốc của form (nút type="submit"), không tự phát sự kiện submit lần nữa

// Event listener cho forgot password
document.querySelector('.forgot-password').addEventListener('click', function(e) {
    e.preventDefault();
    showNotification('Liên hệ quản trị viên để được hỗ trợ!', 'warning');
});

// Khôi phục thông tin đăng nhập đã lưu khi trang load
document.addEventListener('DOMContentLoaded', function() {
    loadSavedLoginInfo();

    // Focus vào input đầu tiên trống
    if (!usernameInput.value) {
        usernameInput.focus();
    } else {
        passwordInput.focus();
    }
});
