document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("section-doimatkhau");
  if (!section) return;

  const sideAvatar = document.getElementById("sideAvatar-doimatkhau");
  const sideUsername = document.getElementById("sideUsername-doimatkhau");
  const form = document.getElementById("changePasswordForm");
  const currentInput = document.getElementById("currentPassword");
  const newInput = document.getElementById("newPassword");
  const confirmInput = document.getElementById("confirmNewPassword");

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

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const currentUser = getUser();
    if (!currentUser) return requireLogin();

    const currentPassword = currentInput.value;
    const newPassword = newInput.value;
    const confirmPassword = confirmInput.value;
    if (!currentPassword || !newPassword || !confirmPassword) {
      Swal?.fire?.({ icon: "error", title: "Lỗi", text: "Vui lòng điền đầy đủ thông tin!" });
      return;
    }
    if (currentPassword !== String(currentUser.password ?? "")) {
      Swal?.fire?.({ icon: "error", title: "Lỗi", text: "Mật khẩu hiện tại không đúng!" });
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
