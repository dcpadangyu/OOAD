// Admin Session Management
class AdminSession {
    constructor() {
        this.sessionKey = 'adminLoggedIn';
        this.usernameKey = 'adminUsername';
        this.loginTimeKey = 'loginTime';
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 giờ
    }

    // Kiểm tra xem admin đã đăng nhập chưa (admin hoặc nhân viên)
    isLoggedIn() {
        if (typeof employeeSession !== 'undefined' && employeeSession.isLoggedIn()) {
            return true;
        }

        const loggedIn = sessionStorage.getItem(this.sessionKey);
        const loginTime = sessionStorage.getItem(this.loginTimeKey);

        if (!loggedIn || loggedIn !== 'true') {
            return false;
        }

        // Kiểm tra thời gian hết hạn session
        if (loginTime) {
            const loginDate = new Date(loginTime);
            const now = new Date();
            const timeDiff = now - loginDate;

            if (timeDiff > this.sessionTimeout) {
                this.logout();
                return false;
            }
        }

        return true;
    }

    // Lấy thông tin admin / nhân viên hiện tại
    getCurrentAdmin() {
        if (typeof employeeSession !== 'undefined' && employeeSession.isLoggedIn()) {
            const emp = employeeSession.getCurrentEmployee();
            return {
                username: emp ? emp.username : '',
                fullName: emp ? emp.tenNhanVien : '',
                role: emp ? emp.chucVu : '',
                isNhanVien: true,
                loginTime: emp ? emp.loginTime : null
            };
        }

        if (!this.isLoggedIn()) {
            return null;
        }

        return {
            username: sessionStorage.getItem(this.usernameKey),
            role: 'admin',
            fullName: sessionStorage.getItem(this.usernameKey),
            isNhanVien: false,
            loginTime: sessionStorage.getItem(this.loginTimeKey)
        };
    }

    // Chức vụ hiện tại: 'admin' hoặc chức vụ nhân viên
    getCurrentRole() {
        const admin = this.getCurrentAdmin();
        return admin ? admin.role : null;
    }

    // Kiểm tra có phải admin không
    isAdmin() {
        const admin = this.getCurrentAdmin();
        return !!admin && !admin.isNhanVien;
    }

    // Kiểm tra có phải nhân viên không
    isNhanVien() {
        const admin = this.getCurrentAdmin();
        return !!admin && admin.isNhanVien === true;
    }

    // Đăng xuất
    logout() {
        if (typeof employeeSession !== 'undefined') {
            employeeSession.logout();
        }
        sessionStorage.removeItem(this.sessionKey);
        sessionStorage.removeItem(this.usernameKey);
        sessionStorage.removeItem(this.loginTimeKey);
    }

    // Chuyển hướng đến trang đăng nhập phù hợp (admin / nhân viên)
    redirectToLogin() {
        let target = 'DangNhap_Admin.html';
        if (typeof employeeSession !== 'undefined' && employeeSession.isLoggedIn()) {
            target = 'DangNhap_NhanVien.html';
        }
        window.location.href = target;
    }

    // Đăng xuất và quay về đúng trang đăng nhập của tài khoản hiện tại
    handleLogout() {
        const isNhanVien = this.isNhanVien();
        this.logout();
        window.location.href = isNhanVien ? 'DangNhap_NhanVien.html' : 'DangNhap_Admin.html';
    }

    // Kiểm tra và chuyển hướng nếu chưa đăng nhập
    requireLogin() {
        if (!this.isLoggedIn()) {
            this.redirectToLogin();
            return false;
        }
        return true;
    }

    // Ẩn thông báo yêu cầu đăng nhập
    // (Removed notification UI methods: showLoginRequired / hideLoginRequired)
}

// Tạo instance global
const adminSession = new AdminSession();

// Auto-check session khi trang load
document.addEventListener('DOMContentLoaded', function() {
    // Nếu đang ở trang đăng nhập thì không cần kiểm tra session
    if (window.location.pathname.includes('DangNhap_Admin.html')) {
        return;
    }

    // Nếu chưa đăng nhập, chuyển hướng ngay tới trang đăng nhập.
    // Điều này ngăn truy cập trực tiếp vào TrangChu_Admin.html mà không đi qua DangNhap_Admin.html
    if (!adminSession.isLoggedIn()) {
        adminSession.redirectToLogin();
    }
});

// Export để sử dụng trong các file khác
window.AdminSession = AdminSession;
window.adminSession = adminSession;