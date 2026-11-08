document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("section-doimatkhau");
  if (!section) return;

  const sideAvatar = document.getElementById("sideAvatar-doimatkhau");
  const sideUsername = document.getElementById("sideUsername-doimatkhau");
  const form = document.getElementById("changePasswordForm");
  const currentInput = document.getElementById("currentPassword");
  const newInput = document.getElementById("newPassword");
  const confirmInput = document.getElementById("confirmNewPassword");
  const otpInput = document.getElementById("changePasswordOtp");

  function getUser() { return window.UserSession?.getCurrentUser?.() || null; }
  function updateSidebar(user) {
    if (!user) return;
    if (sideAvatar) sideAvatar.src = user.anhDaiDien || "assets/img/Avatar/avtuser.jpg";
    if (sideUsername) sideUsername.textContent = user.hoTen || user.thuDienTu || "Người dùng";
  }
  function requireLogin() { window.location.href = "pages/login.html"; }

  // SweetAlert2 có thể bị chặn (CDN): luôn có phương án dự phòng bằng alert.
  function popup(icon, title, text, extra) {
    if (window.Swal?.fire) return Promise.resolve(window.Swal.fire({ icon, title, text, ...(extra || {}) }));
    alert(`${title}\n${text}`);
    return Promise.resolve();
  }

  // Lấy bản ghi MỚI NHẤT trong userList (nguồn xác thực mật khẩu cũ), không dùng bản sao phiên.
  function getStoredUser(sessionUser) {
    const list = window.UserSession?.getUserList?.() || [];
    return list.find((item) => window.UserSession.userMatches(item, sessionUser)) || sessionUser;
  }

  window.showDoiMatKhauSection = function () {
    const user = getUser();
    if (!user) return requireLogin();
    section.style.display = "block";
    updateSidebar(user);
  };

  document.getElementById("send-change-password-otp")?.addEventListener("click", async () => {
    const user = getUser();
    if (!user?.thuDienTu) return requireLogin();
    try {
      await window.UserOtp.request(user.thuDienTu, "change-password");
      popup("success", "Đã gửi OTP", "Kiểm tra Gmail để xác thực đổi mật khẩu.");
    } catch (error) {
      popup("error", "Không gửi được OTP", error.message);
    }
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const sessionUser = getUser();
    if (!sessionUser) return requireLogin();
    const storedUser = getStoredUser(sessionUser);
    const storedPassword = String(storedUser.matKhau ?? "");

    const currentPassword = currentInput.value;
    const newPassword = newInput.value;
    const confirmPassword = confirmInput.value;
    const otpValue = otpInput?.value.trim() || "";

    // Kiểm tra mật khẩu mới TRƯỚC khi xác minh/tiêu thụ OTP.
    if (!newPassword || !confirmPassword) {
      popup("error", "Lỗi", "Vui lòng nhập mật khẩu mới và xác nhận mật khẩu!");
      return;
    }
    if (!currentPassword && !otpValue) {
      popup("error", "Lỗi", "Vui lòng nhập mật khẩu cũ hoặc mã OTP Gmail!");
      return;
    }
    if (newPassword.length < 8) {
      popup("error", "Lỗi", "Mật khẩu mới phải có ít nhất 8 ký tự!");
      return;
    }
    if (newPassword === currentPassword || newPassword === storedPassword) {
      popup("error", "Lỗi", "Mật khẩu mới phải khác mật khẩu cũ!");
      return;
    }
    if (newPassword !== confirmPassword) {
      popup("error", "Lỗi", "Mật khẩu mới và xác nhận không khớp!");
      return;
    }

    const hasValidOldPassword = !!currentPassword && currentPassword === storedPassword;
    let hasValidOtp = false;
    if (otpValue) {
      try {
        await window.UserOtp.verify(storedUser.thuDienTu, "change-password", otpValue);
        hasValidOtp = true;
      } catch (error) {
        popup("error", "OTP không hợp lệ", error.message);
        return;
      }
    }
    if (!hasValidOldPassword && !hasValidOtp) {
      popup("error", "Lỗi", "Mật khẩu cũ hoặc mã OTP không đúng!");
      return;
    }

    const updated = { ...storedUser, matKhau: newPassword };
    window.UserSession.saveUser(updated, storedUser, { passwordChange: true });
    window.UserSession.clearSession();
    form.reset();

    await popup("success", "Thành công!", "Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.");
    window.location.href = "pages/login.html";
  });

  const user = getUser();
  if (!user) {
    requireLogin();
    return;
  }
  section.style.display = "block";
  updateSidebar(user);
});
