const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const rememberCheckbox = document.getElementById("remember");
const loginBtn = document.querySelector(".login-btn");
const notification = document.getElementById("notification");

function showNotification(message, type = "success") {
  notification.textContent = message;
  notification.className = `notification ${type} show`;
  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

function validateLogin(username, password) {
  if (!username || !password) {
    showNotification("Vui lòng nhập đầy đủ thông tin!", "error");
    return false;
  }
  if (username.length < 3) {
    showNotification("Tên đăng nhập phải có ít nhất 3 ký tự!", "error");
    return false;
  }
  if (password.length < 6) {
    showNotification("Mật khẩu phải có ít nhất 6 ký tự!", "error");
    return false;
  }
  return true;
}

// Chống dò mật khẩu: sai MAX_FAIL lần liên tiếp thì khóa đăng nhập tài khoản đó trong LOCK_MS.
const MAX_FAIL = 5;
const LOCK_MS = 60 * 1000;
function failKey(username) { return "nvLoginFail:" + String(username).toLowerCase(); }
function readFail(username) {
  try { return JSON.parse(localStorage.getItem(failKey(username)) || "null") || { count: 0, until: 0 }; }
  catch (e) { return { count: 0, until: 0 }; }
}
function lockRemaining(username) {
  const f = readFail(username);
  return f.until > Date.now() ? Math.ceil((f.until - Date.now()) / 1000) : 0;
}
function recordFail(username) {
  const f = readFail(username);
  if (f.until && f.until <= Date.now()) { f.count = 0; f.until = 0; } // hết thời gian khóa -> đếm lại
  f.count += 1;
  if (f.count >= MAX_FAIL) f.until = Date.now() + LOCK_MS;
  try { localStorage.setItem(failKey(username), JSON.stringify(f)); } catch (e) { /* bỏ qua */ }
  return f;
}
function clearFail(username) { try { localStorage.removeItem(failKey(username)); } catch (e) { /* bỏ qua */ } }

function handleLogin(username, password) {
  return new Promise((resolve) => {
    const wait = lockRemaining(username);
    if (wait > 0) {
      resolve({ success: false, message: "Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau " + wait + " giây." });
      return;
    }
    setTimeout(() => {
      const emp = findNhanVienByUsername(username);
      if (!emp || !(window.PasswordUtil ? window.PasswordUtil.verify(password, emp.matKhau) : emp.matKhau === password)) {
        const f = recordFail(username);
        const left = MAX_FAIL - f.count;
        resolve({ success: false, message: left > 0
          ? "Tên đăng nhập hoặc mật khẩu không đúng! (còn " + left + " lần thử)"
          : "Đăng nhập sai quá nhiều lần. Tài khoản bị tạm khóa đăng nhập " + (LOCK_MS / 1000) + " giây." });
        return;
      }
      clearFail(username);
      if (emp.trangThai === "khoa") {
        resolve({ success: false, message: "Tài khoản của bạn đã bị khóa, liên hệ quản trị viên!" });
        return;
      }
      // Nâng cấp mật khẩu chữ thường (dữ liệu mẫu cũ) sang dạng băm sau lần đăng nhập đúng.
      if (window.PasswordUtil && !window.PasswordUtil.isHashed(emp.matKhau)) {
        try {
          const list = getLocalEmployees() || [];
          const target = list.find((e) => e.maNhanVien === emp.maNhanVien);
          if (target) { target.matKhau = window.PasswordUtil.hash(password); saveLocalEmployees(list); }
        } catch (e) { /* giữ nguyên */ }
      }
      resolve({
        success: true,
        message: "Đăng nhập thành công!",
        employee: emp
      });
    }, 1500);
  });
}

function saveLoginInfo(username, remember) {
  if (remember) {
    localStorage.setItem("nvRememberedUsername", username);
    localStorage.setItem("nvRememberLogin", "true");
  } else {
    localStorage.removeItem("nvRememberedUsername");
    localStorage.removeItem("nvRememberLogin");
  }
}

function loadSavedLoginInfo() {
  const rememberedUsername = localStorage.getItem("nvRememberedUsername");
  const rememberLogin = localStorage.getItem("nvRememberLogin");
  if (rememberedUsername && rememberLogin === "true") {
    usernameInput.value = rememberedUsername;
    rememberCheckbox.checked = true;
    passwordInput.focus();
  }
}

function setLoadingState(loading) {
  if (loading) {
    loginBtn.disabled = true;
    loginBtn.classList.add("loading");
    loginBtn.textContent = "Đang xử lý...";
  } else {
    loginBtn.disabled = false;
    loginBtn.classList.remove("loading");
    loginBtn.textContent = "Đăng nhập";
  }
}

// Neu vua bi dang xuat vi tai khoan bi ngung hoat dong (ma chua kip hien popup), bao tren trang dang nhap.
try {
  if (sessionStorage.getItem("nvBiNgung") === "1") {
    sessionStorage.removeItem("nvBiNgung");
    showNotification("Tài khoản đã bị ngừng hoạt động. Vui lòng liên hệ quản trị viên.", "error");
  }
} catch (e) { /* bo qua */ }

loginForm.addEventListener("submit", async function(e) {
  e.preventDefault();
  if (loginBtn.disabled) return; // đang xử lý một lần đăng nhập

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const remember = rememberCheckbox.checked;

  if (!validateLogin(username, password)) return;

  setLoadingState(true);

  try {
    const result = await handleLogin(username, password);

    if (result.success) {
      saveLoginInfo(username, remember);
      showNotification(result.message, "success");

      // Xóa phiên admin còn sót lại trong cùng tab (để getCurrentAdmin() trả về đúng nhân viên)
      sessionStorage.removeItem("adminLoggedIn");
      sessionStorage.removeItem("adminUsername");
      sessionStorage.removeItem("loginTime");

      employeeSession.logout();
      employeeSession.login(result.employee);

      setTimeout(() => {
        showNotification("Chuyển hướng đến trang quản trị...", "success");
        window.location.href = "TrangChu_Admin.html";
      }, 1500);
    } else {
      showNotification(result.message, "error");
    }
  } catch (error) {
    showNotification("Có lỗi xảy ra, vui lòng thử lại!", "error");
    console.error("Login error:", error);
  } finally {
    setLoadingState(false);
  }
});

usernameInput.addEventListener("input", function() {
  const icon = this.parentElement.querySelector(".input-icon");
  if (this.value.length > 0) {
    this.style.borderColor = "#333";
    icon.style.color = "#333";
  } else {
    this.style.borderColor = "#e0e0e0";
    icon.style.color = "#666";
  }
});

passwordInput.addEventListener("input", function() {
  const icon = this.parentElement.querySelector(".input-icon");
  if (this.value.length > 0) {
    this.style.borderColor = "#333";
    icon.style.color = "#333";
  } else {
    this.style.borderColor = "#e0e0e0";
    icon.style.color = "#666";
  }
});

// Phím Enter: dùng submit gốc của form (nút type="submit"), không tự phát sự kiện submit lần nữa

document.querySelector(".login-footer a") &&
  document.querySelector(".login-footer a").addEventListener("click", function(e) {
    e.preventDefault();
    window.location.href = this.getAttribute("href");
  });

document.addEventListener("DOMContentLoaded", function() {
  loadSavedLoginInfo();
  if (!usernameInput.value) {
    usernameInput.focus();
  } else {
    passwordInput.focus();
  }
});