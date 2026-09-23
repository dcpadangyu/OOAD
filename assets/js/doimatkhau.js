document.addEventListener("DOMContentLoaded", () => {
  const sectionDoiMatKhau = document.getElementById("section-doimatkhau");
  if (!sectionDoiMatKhau) return;

  const sideAvatar = document.getElementById("sideAvatar-doimatkhau");
  const sideUsername = document.getElementById("sideUsername-doimatkhau");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if(currentUser){
    if(sideAvatar) sideAvatar.src = currentUser.avatar || "./assets/img/Avatar/avtuser.jpg";
    if(sideUsername) sideUsername.textContent = currentUser.userName || "Người dùng";
}
  const changePasswordForm = document.getElementById("changePasswordForm");

  if (!changePasswordForm) return;

  const currentPasswordInput = document.getElementById("currentPassword");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmNewPasswordInput = document.getElementById("confirmNewPassword");

  const DEFAULT_AVATAR = "./assets/img/Avatar/avtuser.jpg";


  function updateSidebar(currentUser) {
    if (!currentUser) return;
    sideAvatar && (sideAvatar.src = currentUser.avatar || DEFAULT_AVATAR);
    sideUsername && (sideUsername.textContent = currentUser.userName || "Người dùng");

    // Đồng bộ với hồ sơ và thông tin cá nhân
    const hosoAvatar = document.getElementById("sideAvatar-hoso");
    const hosoUsername = document.getElementById("sideUsername-hoso");
    if (hosoAvatar) hosoAvatar.src = currentUser.avatar || DEFAULT_AVATAR;
    if (hosoUsername) hosoUsername.textContent = currentUser.userName || "Người dùng";
  }

  // Hiển thị section đổi mật khẩu
  window.showDoiMatKhauSection = function() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
      Swal.fire({
        icon: "warning",
        title: "Cần đăng nhập",
        text: "Bạn phải đăng nhập để đổi mật khẩu.",
        confirmButtonText: "Đăng nhập"
      }).then(() => {
        if (typeof window.navigateTo === "function") window.navigateTo("login");
      });
      return;
    }

    sectionDoiMatKhau.style.display = "block";
    updateSidebar(currentUser);
  };

  changePasswordForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) return;

    const currentPassword = currentPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmNewPassword = confirmNewPasswordInput.value.trim();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Swal.fire({ icon: "error", title: "Lỗi!", text: "Vui lòng điền đầy đủ thông tin!" });
      return;
    }

    if (currentPassword !== currentUser.password) {
      Swal.fire({ icon: "error", title: "Lỗi!", text: "Mật khẩu hiện tại không đúng!" });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Swal.fire({ icon: "error", title: "Lỗi!", text: "Mật khẩu mới và xác nhận không khớp!" });
      return;
    }


    // Cập nhật currentUser và userList
    currentUser.password = newPassword;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    const userList = JSON.parse(localStorage.getItem("userList")) || [];
    const idx = userList.findIndex(u =>
      (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      (u.userName && currentUser.userName && u.userName === currentUser.userName)
    );
    if (idx !== -1) {
      userList[idx] = { ...userList[idx], password: newPassword };
      localStorage.setItem("userList", JSON.stringify(userList));
    }

    localStorage.removeItem("currentUser");
    changePasswordForm.reset();

    Swal.fire({ icon: "success", title: "Thành công!", text: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới." }).then(() => {
      if (typeof window.updateHeaderUI === "function") window.updateHeaderUI();
      if (typeof window.navigateTo === "function") window.navigateTo("login");
    });
  });
});
