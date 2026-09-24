document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forgot-password-form");
  if (!form) return;

  const emailInput = document.getElementById("forgot-email");
  const otpInput = document.getElementById("forgot-otp");
  const newPasswordInput = document.getElementById("forgot-new-password");
  const confirmInput = document.getElementById("forgot-confirm-password");

  function users() {
    return window.UserSession?.getUserList?.() || [];
  }

  function findUser(email) {
    const normalized = email.trim().toLowerCase();
    return users().find((user) => String(user.email || "").toLowerCase() === normalized);
  }

  function popup(icon, title, text) {
    if (window.Swal?.fire) return Swal.fire({ icon, title, text });
    alert(`${title}\n${text}`);
  }

  document.getElementById("send-forgot-otp")?.addEventListener("click", async () => {
    const user = findUser(emailInput.value);
    if (!user) return popup("error", "Không tìm thấy tài khoản", "Email chưa được đăng ký.");
    try {
      await window.UserOtp.request(user.email, "forgot-password");
      popup("success", "Đã gửi OTP", "Kiểm tra Gmail để lấy mã xác thực.");
    } catch (error) {
      popup("error", "Không gửi được OTP", error.message);
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const user = findUser(emailInput.value);
    if (!user) return popup("error", "Không tìm thấy tài khoản", "Email chưa được đăng ký.");
    if (newPasswordInput.value.length < 8) {
      return popup("error", "Mật khẩu không hợp lệ", "Mật khẩu mới phải có ít nhất 8 ký tự.");
    }
    if (newPasswordInput.value !== confirmInput.value) {
      return popup("error", "Mật khẩu không khớp", "Vui lòng nhập lại mật khẩu mới.");
    }
    try {
      await window.UserOtp.verify(user.email, "forgot-password", otpInput.value.trim());
      window.UserSession.saveUser({ ...user, password: newPasswordInput.value }, user);
      await popup("success", "Đổi mật khẩu thành công", "Vui lòng đăng nhập lại.");
      window.location.href = "pages/login.html";
    } catch (error) {
      popup("error", "OTP không hợp lệ", error.message);
    }
  });
});
