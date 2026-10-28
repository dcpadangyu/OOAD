class EmployeeSession {
  constructor() {
    this.sessionKey = "nvLoggedIn";
    this.usernameKey = "nvUsername";
    this.fullNameKey = "nvFullName";
    this.chucVuKey = "nvChucVu";
    this.loginTimeKey = "nvLoginTime";
    this.suspendedKey = "nvBiNgung"; // co: tai khoan bi khoa/xoa khi dang dang nhap
    this._popupShown = false;
    this.sessionTimeout = 24 * 60 * 60 * 1000;
  }

  login(employee) {
    sessionStorage.setItem(this.sessionKey, "true");
    sessionStorage.setItem(this.usernameKey, employee.tenDangNhap);
    sessionStorage.setItem(this.fullNameKey, employee.tenNhanVien);
    sessionStorage.setItem(this.chucVuKey, employee.chucVu);
    sessionStorage.setItem(this.loginTimeKey, new Date().toISOString());
  }

  isLoggedIn() {
    const loggedIn = sessionStorage.getItem(this.sessionKey);
    const loginTime = sessionStorage.getItem(this.loginTimeKey);
    if (!loggedIn || loggedIn !== "true") return false;
    if (loginTime) {
      const timeDiff = Date.now() - new Date(loginTime).getTime();
      if (timeDiff > this.sessionTimeout) {
        this.logout();
        return false;
      }
    }
    return this.revalidate();
  }

  // Đọc lại hồ sơ nhân viên mỗi lần kiểm tra: bị xóa / bị khóa -> đăng xuất;
  // đổi chức vụ -> cập nhật sessionStorage để quyền theo chức vụ mới.
  revalidate() {
    if (typeof findNhanVienByUsername !== "function") return true;
    const username = sessionStorage.getItem(this.usernameKey);
    let record = null;
    try {
      record = findNhanVienByUsername(username);
    } catch (e) {
      return true; // không đọc được dữ liệu -> không đăng xuất oan
    }
    if (!record || record.trangThai === "khoa") {
      // Ghi lai ly do de hien popup "Tai khoan da bi ngung hoat dong" (khong chi dang xuat im lang).
      try { sessionStorage.setItem(this.suspendedKey, "1"); } catch (e) { /* bo qua */ }
      this.logout();
      return false;
    }
    if (record.chucVu && sessionStorage.getItem(this.chucVuKey) !== record.chucVu) {
      sessionStorage.setItem(this.chucVuKey, record.chucVu);
    }
    if (record.tenNhanVien && sessionStorage.getItem(this.fullNameKey) !== record.tenNhanVien) {
      sessionStorage.setItem(this.fullNameKey, record.tenNhanVien);
    }
    return true;
  }

  getCurrentEmployee() {
    if (!this.isLoggedIn()) return null;
    const username = sessionStorage.getItem(this.usernameKey);
    return {
      username: username,
      tenNhanVien: sessionStorage.getItem(this.fullNameKey),
      chucVu: sessionStorage.getItem(this.chucVuKey),
      loginTime: sessionStorage.getItem(this.loginTimeKey)
    };
  }

  // Popup chan man hinh khi tai khoan bi ngung hoat dong, sau do ve trang dang nhap nhan vien.
  showSuspendedPopup() {
    if (this._popupShown) return;
    this._popupShown = true;
    const goLogin = () => { window.location.href = "DangNhap_NhanVien.html"; };
    const overlay = document.createElement("div");
    overlay.setAttribute("role", "alertdialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:rgba(15,23,42,.72);display:flex;align-items:center;justify-content:center;padding:16px;font-family:'Segoe UI',Tahoma,sans-serif";
    overlay.innerHTML = '<div style="background:#fff;border-radius:14px;max-width:380px;width:100%;padding:28px 26px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.35)">' +
      '<div style="width:56px;height:56px;border-radius:50%;background:#fee2e2;color:#dc2626;font-size:30px;line-height:56px;margin:0 auto 14px;font-weight:700">!</div>' +
      '<h3 style="margin:0 0 8px;font-size:19px;color:#0f172a">Tài khoản đã bị ngừng hoạt động</h3>' +
      '<p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.5">Bạn đã bị đăng xuất. Vui lòng liên hệ quản trị viên để được hỗ trợ.</p>' +
      '<button type="button" style="border:0;background:#2563eb;color:#fff;border-radius:10px;padding:10px 26px;font-size:14px;font-weight:700;cursor:pointer">Đã hiểu</button></div>';
    const btn = overlay.querySelector("button");
    btn.addEventListener("click", goLogin);
    (document.body || document.documentElement).appendChild(overlay);
    try { sessionStorage.removeItem(this.suspendedKey); } catch (e) { /* bo qua */ }
    setTimeout(goLogin, 6000);
    btn.focus();
  }

  // Kiem tra ngay: neu tai khoan dang dung vua bi khoa/xoa -> dang xuat + hien popup.
  checkAccountNow() {
    if (sessionStorage.getItem(this.sessionKey) !== "true") {
      if (sessionStorage.getItem(this.suspendedKey) === "1") this.showSuspendedPopup();
      return;
    }
    if (!this.isLoggedIn() && sessionStorage.getItem(this.suspendedKey) === "1") this.showSuspendedPopup();
  }

  // Theo doi: Admin khoa o tab khac -> su kien storage (lap tuc); them kiem tra dinh ky va khi quay lai tab.
  startAccountWatch() {
    if (this._watching) return;
    this._watching = true;
    const check = () => this.checkAccountNow();
    window.addEventListener("storage", (e) => { if (e.key === "employeeList" || e.key === null) check(); });
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
    setInterval(check, 3000);
    check();
  }

  logout() {
    sessionStorage.removeItem(this.sessionKey);
    sessionStorage.removeItem(this.usernameKey);
    sessionStorage.removeItem(this.fullNameKey);
    sessionStorage.removeItem(this.chucVuKey);
    sessionStorage.removeItem(this.loginTimeKey);
  }
}

window.EmployeeSession = EmployeeSession;
window.employeeSession = new EmployeeSession();
// Chi bat theo doi tren trang quan tri (co phien nhan vien dang mo).
document.addEventListener("DOMContentLoaded", function () {
  if (/TrangChu_Admin\.html$/i.test(location.pathname) && sessionStorage.getItem("nvLoggedIn") === "true") {
    window.employeeSession.startAccountWatch();
  }
});