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

    // Quyền theo THAO TÁC (ngoài việc được vào màn hình nào, xem ROLE_ROUTES ở admin-spa-nav.js).
    // Admin có mọi quyền. Nhân viên chỉ có các quyền ghi trong bảng dưới đây (theo đặc tả use case):
    //   product.edit     thêm / sửa / ẩn-hiện sản phẩm          (UC15, UC17)
    //   product.delete   xóa sản phẩm                           (UC16)
    //   product.size     thêm/bớt size của sản phẩm             (UC51) - không sửa các thông tin khác
    //   import.manage    lập, sửa, xóa, hoàn thành phiếu nhập   (UC34-36)
    //   import.cancel    hủy phiếu đã hoàn thành (trừ lại tồn kho, chỉ Admin)
    //   order.process    xác nhận / giao đơn hàng               (UC30)
    //   order.cancel     hủy đơn hàng
    can(permission) {
        if (!this.isNhanVien()) return this.isLoggedIn();
        const role = String(this.getCurrentRole() || '');
        const table = {
            'Nhân viên bán hàng': ['product.edit', 'product.delete', 'order.process', 'order.cancel'],
            'Nhân viên kho': ['product.size', 'import.manage'],
            'Nhân viên CSKH': ['order.cancel'],
            'Nhân viên kiểm kho': []
        };
        return (table[role] || []).indexOf(permission) !== -1;
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
    // forceStaff: true khi phiên vừa bị hủy là phiên nhân viên (hết hạn / bị khóa / bị xóa)
    redirectToLogin(forceStaff) {
        let target = 'DangNhap_Admin.html';
        if (forceStaff === true || (typeof employeeSession !== 'undefined' && employeeSession.isLoggedIn())) {
            target = 'DangNhap_NhanVien.html';
        }
        window.location.href = target;
    }

    // Có phiên nhân viên đang được lưu (chưa kiểm tra hợp lệ) hay không
    hadStaffSession() {
        try {
            return sessionStorage.getItem('nvLoggedIn') === 'true';
        } catch (e) {
            return false;
        }
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
    const wasStaff = adminSession.hadStaffSession();
    if (!adminSession.isLoggedIn()) {
        adminSession.redirectToLogin(wasStaff);
    }
});

// Gắn class lên <body> để ẩn nút thao tác mà vai trò hiện tại không được dùng (xem admin.css: perm-no-*).
// Việc kiểm tra thật vẫn nằm ở từng hàm xử lý (adminSession.can) để không lách được bằng DevTools/hash.
document.addEventListener('DOMContentLoaded', function () {
    if (!adminSession.isLoggedIn() || !adminSession.isNhanVien()) return;
    ['product.edit', 'product.delete', 'product.size', 'import.manage', 'import.cancel'].forEach(function (perm) {
        if (!adminSession.can(perm)) document.body.classList.add('perm-no-' + perm.replace('.', '-'));
    });
});

// Export để sử dụng trong các file khác
window.AdminSession = AdminSession;
window.adminSession = adminSession;