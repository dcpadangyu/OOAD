document.addEventListener("DOMContentLoaded", () => {
  const sectionHoso = document.getElementById("section-hoso");
  if (!sectionHoso) return;

  const DEFAULT_AVATAR = window.UserSession?.DEFAULT_AVATAR || "assets/img/Avatar/avtuser.jpg";

  function getUser() {
    return window.UserSession?.getCurrentUser?.() || null;
  }

  function fillProfile(user) {
    if (!user) return;
    const displayName = user.userName || user.email || "Chưa cập nhật";
    const sideAvatar = document.getElementById("sideAvatar-hoso");
    const sideUsername = document.getElementById("sideUsername-hoso");
    const usernameDisplay = document.getElementById("usernameDisplay-hoso");
    const emailDisplay = document.getElementById("emailDisplay-hoso");
    const phoneDisplay = document.getElementById("phoneDisplay-hoso");
    const addressDisplay = document.getElementById("addressDisplay-hoso");

    if (sideAvatar) sideAvatar.src = user.avatar || DEFAULT_AVATAR;
    if (sideUsername) sideUsername.textContent = displayName;
    if (usernameDisplay) usernameDisplay.textContent = displayName;
    if (emailDisplay) emailDisplay.textContent = user.email || "Chưa cập nhật";
    if (phoneDisplay) phoneDisplay.textContent = user.phone || "Chưa có số điện thoại";
    if (addressDisplay) addressDisplay.textContent = user.address || "Chưa có địa chỉ";
  }

  function requireLogin() {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "warning",
        title: "Cần đăng nhập",
        text: "Bạn phải đăng nhập để xem hồ sơ.",
        confirmButtonText: "Đăng nhập"
      }).then(() => { window.location.href = "pages/login.html"; });
    } else {
      window.location.href = "pages/login.html";
    }
  }

  function moHoSo() {
    const user = getUser();
    if (!user) return requireLogin();
    sectionHoso.style.display = "block";
    fillProfile(user);
  }

  window.moHoSo = moHoSo;

  const refreshProfile = () => {
    const user = getUser();
    if (user) {
      sectionHoso.style.display = "block";
      fillProfile(user);
    } else {
      sectionHoso.style.display = "none";
    }
  };

  refreshProfile();
  window.addEventListener("pageshow", refreshProfile);
  window.addEventListener("storage", (event) => {
    if (event.key === "currentUser" || event.key === "userList") refreshProfile();
  });
});
