// QUẢN LÝ TRANG THÔNG TIN CÁ NHÂN
document.addEventListener("DOMContentLoaded", () => {
  const sectionThongTin = document.getElementById("section-thongtincanhan");
  if (!sectionThongTin) return;

  // Sidebar
  const sideAvatar = document.getElementById("sideAvatar-thongtin");
  const sideUsername = document.getElementById("sideUsername-thongtin");

  // Form
  const nameInput = document.getElementById("nameInput");
  const emailInput = document.getElementById("emailInput");
  const phoneInput = document.getElementById("phoneInput");
  const addressInput = document.getElementById("addressInput");

  const formActions = document.getElementById("profileFormActions");
  const editBtn = document.getElementById("editProfileBtn");
  const cancelBtn = document.getElementById("cancelProfileBtn");
  const profileForm = document.getElementById("profileForm");

  // Điền dữ liệu vào form và sidebar
  function fillForm(user) {
    if (!user) return;
    const savedUser = (JSON.parse(localStorage.getItem("userList") || "[]") || [])
      .find(item => item.email && user.email && item.email.toLowerCase() === user.email.toLowerCase());
    const displayName = user.userName || user.username || user.name || savedUser?.userName || savedUser?.username || savedUser?.name || "";
    nameInput.value = displayName;
    emailInput.value = user.email || "";
    phoneInput.value = user.phone || "";
    addressInput.value = user.address || "";

    if (sideAvatar) sideAvatar.src = user.avatar || "./assets/img/Avatar/avtuser.jpg";
    if (sideUsername) sideUsername.textContent = displayName || "Người dùng";
  }

  // Chỉ cho phép chỉnh sửa
  function enableEdit() {
    [nameInput, emailInput, phoneInput, addressInput].forEach(i => i.removeAttribute("readonly"));
    formActions.classList.remove("hidden");
    editBtn.style.display = "none";
  }

  // Khóa form
  function disableEdit() {
    [nameInput, emailInput, phoneInput, addressInput].forEach(i => i.setAttribute("readonly", true));
    formActions.classList.add("hidden");
    editBtn.style.display = "inline-block";
  }

  // Hiển thị section thông tin cá nhân
  window.showThongTinCaNhan = function () {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Cần đăng nhập",
        text: "Bạn phải đăng nhập để xem thông tin cá nhân.",
        confirmButtonText: "Đăng nhập",
      }).then(() => {
        if (typeof window.navigateTo === "function") window.navigateTo("login");
      });
      return;
    }
    sectionThongTin.style.display = "block";
    fillForm(user);
    disableEdit();
  };

  // Lưu dữ liệu người dùng
  function saveUser() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) return;

    user.userName = nameInput.value.trim();
    user.email = emailInput.value.trim();
    user.phone = phoneInput.value.trim();
    user.address = addressInput.value.trim();

    // Lưu vào currentUser
    localStorage.setItem("currentUser", JSON.stringify(user));

    // Cập nhật userList
    const userList = JSON.parse(localStorage.getItem("userList")) || [];
    const idx = userList.findIndex(u => u.email === user.email);
    if (idx !== -1) userList[idx] = { ...userList[idx], ...user };
    localStorage.setItem("userList", JSON.stringify(userList));
  }

  // Xử lý nút
  editBtn.addEventListener("click", enableEdit);
  cancelBtn.addEventListener("click", () => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    fillForm(user);
    disableEdit();
  });

  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    saveUser();
    Swal.fire({
      icon: "success",
      title: "Thành công",
      text: "Cập nhật thông tin thành công!",
    });
    disableEdit();
  });

  // Khi load trang, nếu đã đăng nhập thì fill form
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (user) fillForm(user);
});
