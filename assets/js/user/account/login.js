document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  if (!form) return;

  const accountInput = document.getElementById("input-login");
  const passwordInput = document.getElementById("password-login");

  function getUsers() {
    const list = window.UserSession?.getUserList?.() || [];
    return list;
  }

  function popup(icon, title, text, callback) {
    if (typeof Swal === "undefined") {
      alert(`${title}\n${text}`);
      callback?.();
      return;
    }
    Swal.fire({ icon, title, text, showConfirmButton: false, timer: 900, timerProgressBar: true, didClose: callback });
  }

  function setError(input, message) {
    if (!input) return;
    const error = input.parentElement?.querySelector(".error-message");
    if (error) {
      error.textContent = message;
      error.style.display = message ? "block" : "none";
    }
    input.classList.toggle("input-error", !!message);
    input.classList.toggle("input-success", !message);
  }

  const verifyPassword = (plain, stored) =>
    window.PasswordUtil ? window.PasswordUtil.verify(plain, stored) : String(stored ?? "") === plain;

  function authenticate(account, password) {
    const normalized = String(account || "").trim().toLowerCase();
    const users = getUsers();
    const user = users.find((item) => {
      const email = String(item.thuDienTu || "").trim().toLowerCase();
      const name = String(item.tenDangNhap || "").trim().toLowerCase();
      return (email === normalized || name === normalized) && verifyPassword(password, item.matKhau);
    });
    return user || null;
  }

  // Tài khoản còn lưu mật khẩu chữ thường (dữ liệu cũ/demo): đổi sang dạng băm ngay sau khi đăng nhập thành công.
  function upgradePasswordStorage(user, password) {
    if (!window.PasswordUtil || window.PasswordUtil.isHashed(user.matKhau)) return;
    try {
      const list = JSON.parse(localStorage.getItem("userList") || "[]");
      const target = list.find((item) => item && item.maKhachHang === user.maKhachHang);
      if (target) {
        target.matKhau = window.PasswordUtil.hash(password);
        localStorage.setItem("userList", JSON.stringify(list));
      }
    } catch (_) { /* không nâng cấp được thì giữ nguyên */ }
  }

  function isLocked(user) { return user?.biKhoa === true || user?.trangThai === "blocked"; }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    setError(accountInput, "");
    setError(passwordInput, "");

    const account = accountInput.value.trim();
    const password = passwordInput.value;
    if (!account) return setError(accountInput, "Vui lòng nhập tên đăng nhập hoặc email.");
    if (!password) return setError(passwordInput, "Vui lòng nhập mật khẩu.");

    const user = authenticate(account, password);
    if (!user) {
      setError(accountInput, "Tên đăng nhập/Email hoặc mật khẩu không đúng.");
      setError(passwordInput, "Thông tin đăng nhập không đúng.");
      popup("error", "Đăng nhập thất bại!", "Vui lòng kiểm tra lại thông tin.");
      return;
    }
    if (isLocked(user)) {
      popup("warning", "Tài khoản bị khóa", "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị.");
      return;
    }

    upgradePasswordStorage(user, password);
    const currentUser = window.UserSession?.setCurrentUser?.(user);
    if (!currentUser) return;
    // Xoa du lieu con sot cua nguoi dung truoc (dia chi dang chon, don chuyen khoan dang cho).
    localStorage.removeItem("selectedAddress");
    localStorage.removeItem("CurrDanhSachDatHang");
    // Admin vừa cấp mật khẩu tạm: bắt buộc đổi mật khẩu trước khi sử dụng tài khoản.
    const buocDoiMatKhau = user.daDatLaiMatKhau === true;
    popup(buocDoiMatKhau ? "info" : "success",
      buocDoiMatKhau ? "Vui lòng đổi mật khẩu" : "Đăng nhập thành công!",
      buocDoiMatKhau ? "Bạn đang dùng mật khẩu tạm do cửa hàng cấp. Hãy đặt mật khẩu mới để bảo mật tài khoản." : `Chào mừng ${currentUser.hoTen || currentUser.thuDienTu}`,
      () => {
        window.updateHeaderUI?.();
        window.location.href = buocDoiMatKhau ? "pages/change-password.html" : "index.html";
      });
    form.reset();
  });

  accountInput?.addEventListener("input", () => setError(accountInput, ""));
  passwordInput?.addEventListener("input", () => setError(passwordInput, ""));
});
