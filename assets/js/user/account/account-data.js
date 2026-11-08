// Seed the User-side demo accounts without overwriting real user data.
(function () {
  "use strict";

  const DATA_VERSION = "v2";
  const DEFAULT_AVATAR = "assets/img/Avatar/avtuser.jpg";
  const defaultUsers = [
    { maKhachHang: "user_admin_example", tenDangNhap: "admin", hoTen: "admin", thuDienTu: "admin@example.com", matKhau: "Admin123", diaChi: "Hà Nội", soDienThoai: "0909000001", anhDaiDien: "assets/img/Avatar/Ava1.jpg", isLoggedIn: false },
    { maKhachHang: "user_demo_example", tenDangNhap: "demo", hoTen: "demo", thuDienTu: "demo@example.com", matKhau: "Demo1234", diaChi: "TP. Hồ Chí Minh", soDienThoai: "0909000002", anhDaiDien: "assets/img/Avatar/ava2.jpg", isLoggedIn: false },
    { maKhachHang: "user_john_example", tenDangNhap: "john", hoTen: "john", thuDienTu: "john@example.com", matKhau: "John1234", diaChi: "Đà Nẵng", soDienThoai: "0909000003", anhDaiDien: "assets/img/Avatar/ava3.jpg", isLoggedIn: false }
  ];

  // Chỉ gieo tài khoản demo khi khóa userList CHƯA TỒN TẠI (lần đầu chạy). Không bao giờ thêm lại sau khi
  // đã bị xóa và không ghi đè danh sách hiện có.
  if (localStorage.getItem("userList") === null) {
    const users = defaultUsers.map((demoUser) => window.UserSession?.normalizeUser?.({ ...demoUser, anhDaiDien: demoUser.anhDaiDien || DEFAULT_AVATAR }) || { ...demoUser });
    localStorage.setItem("userList", JSON.stringify(users));
  }
  localStorage.setItem("dataVersion", DATA_VERSION);
})();