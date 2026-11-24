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

// UC01: nhân viên nhập sai mật khẩu 5 lần liên tiếp thì tài khoản bị tạm khóa đăng nhập 60 giây.
const NV_SAI_TOI_DA = 5;
const NV_THOI_GIAN_KHOA = 60 * 1000;

function nvDocSaiMatKhau() {
  try { return JSON.parse(localStorage.getItem("nvDangNhapSai") || "{}") || {}; } catch (e) { return {}; }
}

function nvGhiSaiMatKhau(ds) {
  localStorage.setItem("nvDangNhapSai", JSON.stringify(ds));
}

function dangNhap(username, password) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const emp = findNhanVienByUsername(username);
      const khoaTk = emp ? String(emp.tenDangNhap).toLowerCase() : "";
      const dsSai = nvDocSaiMatKhau();
      const ttSai = khoaTk ? dsSai[khoaTk] : null;
      if (ttSai && ttSai.khoaDen > Date.now()) {
        const giay = Math.ceil((ttSai.khoaDen - Date.now()) / 1000);
        resolve({ success: false, message: `Tài khoản tạm khóa đăng nhập do nhập sai ${NV_SAI_TOI_DA} lần. Vui lòng thử lại sau ${giay} giây!` });
        return;
      }
      const dung = emp && (window.PasswordUtil ? PasswordUtil.verify(password, emp.matKhau) : emp.matKhau === password);
      if (!dung) {
        if (emp) {
          const soLan = ((ttSai && ttSai.soLan) || 0) + 1;
          if (soLan >= NV_SAI_TOI_DA) {
            dsSai[khoaTk] = { soLan: 0, khoaDen: Date.now() + NV_THOI_GIAN_KHOA };
            nvGhiSaiMatKhau(dsSai);
            resolve({ success: false, message: `Bạn đã nhập sai ${NV_SAI_TOI_DA} lần liên tiếp. Tài khoản bị tạm khóa đăng nhập 60 giây!` });
            return;
          }
          dsSai[khoaTk] = { soLan: soLan, khoaDen: 0 };
          nvGhiSaiMatKhau(dsSai);
        }
        resolve({ success: false, message: "Tên đăng nhập hoặc mật khẩu không đúng!" });
        return;
      }
      if (khoaTk && dsSai[khoaTk]) {
        delete dsSai[khoaTk];
        nvGhiSaiMatKhau(dsSai);
      }
      if (emp.trangThai === "khoa") {
        resolve({ success: false, message: "Tài khoản của bạn đã bị khóa, liên hệ quản trị viên!" });
        return;
      }
      // Mật khẩu cũ còn chữ thường: băm lại ngay khi đăng nhập đúng.
      if (window.PasswordUtil && !PasswordUtil.isHashed(emp.matKhau)) {
        const ds = getLocalEmployees();
        const k = ds.findIndex((e) => e.maNhanVien === emp.maNhanVien);
        if (k >= 0) { ds[k].matKhau = PasswordUtil.hash(password); saveLocalEmployees(ds); }
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
    localStorage.setItem("rememberedUsername", username);
    localStorage.setItem("rememberLogin", "true");
  } else {
    localStorage.removeItem("rememberedUsername");
    localStorage.removeItem("rememberLogin");
  }
}

function loadSavedLoginInfo() {
  const rememberedUsername = localStorage.getItem("rememberedUsername");
  const rememberLogin = localStorage.getItem("rememberLogin");
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
    const result = await dangNhap(username, password);

    if (result.success) {
      saveLoginInfo(username, remember);
      showNotification(result.message, "success");

      // Xóa phiên admin còn sót lại trong cùng tab (để getCurrentAdmin() trả về đúng nhân viên)
      sessionStorage.removeItem("adminLoggedIn");
      sessionStorage.removeItem("adminUsername");
      sessionStorage.removeItem("loginTime");

      employeeSession.dangXuat();
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
