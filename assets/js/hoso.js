// hoso.js
document.addEventListener("DOMContentLoaded", () => {
  const sectionHoso = document.getElementById("section-hoso");
  if (!sectionHoso) return;

  /** Hiển thị thông tin hồ sơ người dùng */
  function hienHoSo(user) {
    if (!user) return;
    const savedUser = (JSON.parse(localStorage.getItem("userList") || "[]") || [])
      .find(item => item.email && user.email && item.email.toLowerCase() === user.email.toLowerCase());
    const displayName = user.userName || user.username || user.name || savedUser?.userName || savedUser?.username || savedUser?.name || "Chưa cập nhật";

    // Sidebar
    const sideAvatar = document.getElementById("sideAvatar-hoso");
    const sideUsername = document.getElementById("sideUsername-hoso");
    if (sideAvatar) sideAvatar.src = user.avatar || "./assets/img/Avatar/avtuser.jpg";
    if (sideUsername) sideUsername.textContent = displayName;

    // Nội dung trang hồ sơ
    const usernameDisplay = document.getElementById("usernameDisplay-hoso");
    const emailDisplay = document.getElementById("emailDisplay-hoso");
    const phoneDisplay = document.getElementById("phoneDisplay-hoso");
    const addressDisplay = document.getElementById("addressDisplay-hoso");

    if (usernameDisplay) usernameDisplay.textContent = displayName;
    if (emailDisplay) emailDisplay.textContent = user.email || "";
    if (phoneDisplay) phoneDisplay.textContent = user.phone || "Chưa có số điện thoại";
    if (addressDisplay) addressDisplay.textContent = user.address || "Chưa có địa chỉ";
  }

  /** Mở trang hồ sơ, kiểm tra đăng nhập */
  function moHoSo() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) {
      baoDangNhap();
      return;
    }
    sectionHoso.style.display = "block";
    hienHoSo(user);
  }

  /** Thông báo cần đăng nhập */
  function baoDangNhap() {
    Swal.fire({
      icon: "warning",
      title: "Cần đăng nhập",
      text: "Bạn phải đăng nhập để xem hồ sơ.",
      confirmButtonText: "Đăng nhập",
    }).then(() => {
      if (typeof window.navigateTo === "function") {
        window.navigateTo("login");
      } else {
        window.location.href = "#login";
      }
    });
  }

  /** Tự động hiển thị hồ sơ khi đã đăng nhập */
  function tuDongHoSo() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (user) hienHoSo(user);
  }

  // Gán global để router có thể gọi
  window.moHoSo = moHoSo;

  // Khởi chạy
  tuDongHoSo();
});
