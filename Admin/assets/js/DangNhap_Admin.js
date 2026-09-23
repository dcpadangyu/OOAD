// DOM Elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const rememberCheckbox = document.getElementById('remember');
const loginBtn = document.querySelector('.login-btn');
const notification = document.getElementById('notification');

// Dữ liệu đăng nhập mẫu
const adminCredentials = {
    'admin01': 'admin123',
    'admin02': 'admin456',
    'admin03': 'admin789'
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
            if (adminCredentials[username] && adminCredentials[username] === password) {
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

// Event listener cho Enter key
passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
    }
});

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

// Hàm demo thông tin đăng nhập
function showDemoCredentials() {
    const credentials = Object.keys(adminCredentials).map(username =>
        `Tên đăng nhập: ${username} | Mật khẩu: ${adminCredentials[username]}`
    ).join('\n');

    showNotification(`Thông tin demo:\n${credentials}`, 'warning');
}

// Thêm nút demo (chỉ để test)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const demoBtn = document.createElement('button');
    demoBtn.textContent = 'Xem thông tin demo';
    demoBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px;
        background: #666;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
    `;
    demoBtn.addEventListener('click', showDemoCredentials);
    document.body.appendChild(demoBtn);
}