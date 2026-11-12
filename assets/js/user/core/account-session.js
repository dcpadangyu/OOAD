// Shared User account/session helpers.
(function () {
  "use strict";

  const DEFAULT_AVATAR = "assets/img/Avatar/avtuser.jpg";

  function parseJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function normalizeUser(user) {
    if (!user || typeof user !== "object") return null;
    const normalized = { ...user };
    // tenDangNhap is the immutable login identity; hoTen is the editable display name.
    normalized.tenDangNhap = String(user.tenDangNhap || user.hoTen || "").trim();
    normalized.hoTen = String(user.hoTen || normalized.tenDangNhap || "").trim();
    normalized.thuDienTu = String(user.thuDienTu || "").trim();
    normalized.soDienThoai = String(user.soDienThoai || "").trim();
    normalized.diaChi = String(user.diaChi || "").trim();
    normalized.anhDaiDien = user.anhDaiDien || DEFAULT_AVATAR;
    normalized.diaChiPhu = Array.isArray(user.diaChiPhu) ? user.diaChiPhu : [];
    if (!normalized.maKhachHang) {
      const identity = (normalized.thuDienTu || normalized.tenDangNhap || "user").toLowerCase();
      normalized.maKhachHang = `user_${identity.replace(/[^a-z0-9]+/g, "_")}`;
    }
    return normalized;
  }

  function isLockedRecord(user) {
    return !!user && (user.biKhoa === true || user.trangThai === "blocked");
  }

  // Phiên đăng nhập được kiểm tra lại với userList: tài khoản bị Admin khóa sẽ bị đăng xuất ngay.
  function getCurrentUser() {
    const sessionCopy = normalizeUser(parseJSON("currentUser", null));
    if (!sessionCopy) return null;
    const stored = getUserList().find((user) => userMatches(user, sessionCopy));
    if (isLockedRecord(stored)) {
      clearSession();
      showSuspendedPopup();
      return null;
    }
    if (!stored) return sessionCopy;
    // userList là nguồn dữ liệu mới nhất (Admin có thể đã sửa/đặt lại mật khẩu): bản đã lưu được ưu tiên.
    const fresh = normalizeUser({ ...sessionCopy, ...stored });
    if (JSON.stringify(fresh) !== JSON.stringify(sessionCopy)) {
      try { localStorage.setItem("currentUser", JSON.stringify(fresh)); } catch (_) { /* ignore quota */ }
    }
    return fresh;
  }

  function getUserList() {
    const users = parseJSON("userList", []);
    return Array.isArray(users) ? users.map(normalizeUser).filter(Boolean) : [];
  }

  function userMatches(a, b) {
    if (!a || !b) return false;
    if (a.maKhachHang && b.maKhachHang && a.maKhachHang === b.maKhachHang) return true;
    const aEmail = String(a.thuDienTu || "").trim().toLowerCase();
    const bEmail = String(b.thuDienTu || "").trim().toLowerCase();
    if (aEmail && bEmail && aEmail === bEmail) return true;
    const aName = String(a.tenDangNhap || a.hoTen || "").trim().toLowerCase();
    const bName = String(b.tenDangNhap || b.hoTen || "").trim().toLowerCase();
    return !!aName && !!bName && aName === bName;
  }

  function setCurrentUser(user) {
    const normalized = normalizeUser(user);
    if (!normalized) {
      localStorage.removeItem("currentUser");
      return null;
    }
    localStorage.setItem("currentUser", JSON.stringify(normalized));
    return normalized;
  }

  // Các trường do Admin quản lý: người dùng tự lưu hồ sơ không được ghi đè.
  const ADMIN_FIELDS = ["trangThai", "biKhoa", "ngayKhoa", "maKH", "daDatLaiMatKhau", "ngayDatLaiMatKhau", "ngayTao"];

  // options.silent = true: chỉ cập nhật userList, không tạo/ghi đè phiên đăng nhập.
  // options.passwordChange = true: chỉ khi đó mới được thay matKhau đã lưu (đổi/quên mật khẩu).
  function saveUser(user, previousIdentity, options) {
    const normalized = normalizeUser(user);
    if (!normalized) return null;
    const users = getUserList();
    const index = previousIdentity
      ? users.findIndex((u) => userMatches(u, previousIdentity))
      : users.findIndex((u) => userMatches(u, normalized));
    if (index >= 0) {
      const stored = users[index];
      ADMIN_FIELDS.forEach((key) => {
        if (key in stored) normalized[key] = stored[key];
        else delete normalized[key];
      });
      if (!(options && options.passwordChange === true)) {
        if ("matKhau" in stored) normalized.matKhau = stored.matKhau;
        else delete normalized.matKhau;
      }
      users[index] = normalized;
    } else {
      users.push(normalized);
    }
    localStorage.setItem("userList", JSON.stringify(users));
    if (!(options && options.silent)) setCurrentUser(normalized);
    return normalized;
  }

  // Popup chan man hinh khi Admin khoa tai khoan khach dang dang nhap, sau do ve trang dang nhap.
  let popupShown = false;
  function onAuthPage() {
    return /\/(login|register|forgot-password)\.html$/i.test(location.pathname);
  }
  function showSuspendedPopup() {
    if (popupShown || onAuthPage() || !document.body) return;
    popupShown = true;
    ["cart", "selectedCartItems", "CurrDanhSachDatHang"].forEach((k) => localStorage.removeItem(k));
    const goLogin = () => { window.location.href = new URL("pages/login.html", document.baseURI).href; };
    const overlay = document.createElement("div");
    overlay.setAttribute("role", "alertdialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:rgba(15,23,42,.72);display:flex;align-items:center;justify-content:center;padding:16px;font-family:'Segoe UI',Tahoma,sans-serif";
    overlay.innerHTML = '<div style="background:#fff;border-radius:14px;max-width:380px;width:100%;padding:28px 26px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.35)">' +
      '<div style="width:56px;height:56px;border-radius:50%;background:#fee2e2;color:#dc2626;font-size:30px;line-height:56px;margin:0 auto 14px;font-weight:700">!</div>' +
      '<h3 style="margin:0 0 8px;font-size:19px;color:#0f172a">Tài khoản đã bị ngừng hoạt động</h3>' +
      '<p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.5">Bạn đã bị đăng xuất. Vui lòng liên hệ cửa hàng để được hỗ trợ.</p>' +
      '<button type="button" style="border:0;background:#2563eb;color:#fff;border-radius:10px;padding:10px 26px;font-size:14px;font-weight:700;cursor:pointer">Đã hiểu</button></div>';
    const btn = overlay.querySelector("button");
    btn.addEventListener("click", goLogin);
    document.body.appendChild(overlay);
    setTimeout(goLogin, 6000);
    btn.focus();
  }

  // Theo doi khach dang dang nhap: Admin khoa/xoa -> dang xuat + popup (tuc thi o tab khac nho su kien storage).
  let watchedId = null;
  function checkNow() {
    if (!watchedId) return;
    const stored = getUserList().find((u) => u.maKhachHang === watchedId);
    // Bi khoa HOAC bi Admin xoa khoi danh sach (ban ghi da ton tai luc bat dau theo doi) => popup + dang xuat.
    if (isLockedRecord(stored) || !stored) {
      clearSession();
      showSuspendedPopup();
      watchedId = null;
      return;
    }
    // Phien bi xoa o tab khac (dang xuat binh thuong): ngung theo doi, khong hien popup.
    if (!parseJSON("currentUser", null)) watchedId = null;
  }
  function startWatch() {
    const cur = getCurrentUser();
    if (!cur) return;
    // Chi theo doi khi tai khoan co trong userList (tai khoan cu ngoai danh sach khong bi dang xuat oan).
    if (!getUserList().some((u) => u.maKhachHang === cur.maKhachHang)) return;
    watchedId = cur.maKhachHang;
    window.addEventListener("storage", (e) => { if (e.key === "userList" || e.key === null) checkNow(); });
    window.addEventListener("focus", checkNow);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) checkNow(); });
    setInterval(checkNow, 3000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startWatch);
  else startWatch();

  function clearSession() {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("selectedAddress");
  }

  window.UserSession = Object.freeze({
    DEFAULT_AVATAR,
    parseJSON,
    normalizeUser,
    getCurrentUser,
    getUserList,
    userMatches,
    setCurrentUser,
    saveUser,
    clearSession
  });
  window.getCurrentUser = getCurrentUser;
})();
