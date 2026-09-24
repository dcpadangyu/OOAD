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
    if (sideAvatar) sideAvatar.src = user.avatar || "assets/img/Avatar/avtuser.jpg";
    if (sideUsername) sideUsername.textContent = user.userName || user.email || "Người dùng";
  }
  function requireLogin() { window.location.href = "pages/login.html"; }

  window.showDoiMatKhauSection = function () {
    const user = getUser();
    if (!user) return requireLogin();
    section.style.display = "block";
    updateSidebar(user);
  };

  document.getElementById("send-change-password-otp")?.addEventListener("click", async () => {
    const user = getUser();
    if (!user?.email) return requireLogin();
    try {
      await window.UserOtp.request(user.email, "change-password");
      Swal?.fire?.({ icon: "success", title: "Đã gửi OTP", text: "Kiểm tra Gmail để xác thực đổi mật khẩu." });
    } catch (error) {
      Swal?.fire?.({ icon: "error", title: "Không gửi được OTP", text: error.message });
    }
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const currentUser = getUser();
    if (!currentUser) return requireLogin();

    const currentPassword = currentInput.value;
    const newPassword = newInput.value;
    const confirmPassword = confirmInput.value;
    if (!newPassword || !confirmPassword) {
      Swal?.fire?.({ icon: "error", title: "Lỗi", text: "Vui lòng nhập mật khẩu mới và xác nhận mật khẩu!" });
      return;
    }
    if (!currentPassword && !otpInput?.value.trim()) {
      Swal?.fire?.({ icon: "error", title: "Lỗi", text: "Vui lòng nhập mật khẩu cũ hoặc mã OTP Gmail!" });
      return;
    }
    const hasValidOldPassword = currentPassword && currentPassword === String(currentUser.password ?? "");
    let hasValidOtp = false;
    if (otpInput?.value.trim()) {
      try {
        await window.UserOtp.verify(currentUser.email, "change-password", otpInput.value.trim());
        hasValidOtp = true;
      } catch (error) {
        Swal?.fire?.({ icon: "error", title: "OTP không hợp lệ", text: error.message });
        return;
      }
    }
    if (!hasValidOldPassword && !hasValidOtp) {
      Swal?.fire?.({ icon: "error", title: "Lỗi", text: "Mật khẩu cũ hoặc mã OTP không đúng!" });
      return;
    }
    if (newPassword.length < 8) {
      Swal?.fire?.({ icon: "error", title: "Lỗi", text: "Mật khẩu mới phải có ít nhất 8 ký tự!" });
      return;
    }
    if (newPassword !== confirmPassword) {
      Swal?.fire?.({ icon: "error", title: "Lỗi", text: "Mật khẩu mới và xác nhận không khớp!" });
      return;
    }

    const updated = { ...currentUser, password: newPassword };
    window.UserSession.saveUser(updated, currentUser);
    window.UserSession.clearSession();
    form.reset();

    Swal?.fire?.({
      icon: "success",
      title: "Thành công!",
      text: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới."
    }).then(() => { window.location.href = "pages/login.html"; });
  });

  const user = getUser();
  if (user) {
    section.style.display = "block";
    updateSidebar(user);
  }
});
