document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("section-thongtincanhan");
  if (!section) return;

  const sideAvatar = document.getElementById("sideAvatar-thongtin");
  const sideUsername = document.getElementById("sideUsername-thongtin");
  const nameInput = document.getElementById("nameInput");
  const emailInput = document.getElementById("emailInput");
  const phoneInput = document.getElementById("phoneInput");
  const addressInput = document.getElementById("addressInput");
  const formActions = document.getElementById("profileFormActions");
  const editBtn = document.getElementById("editProfileBtn");
  const cancelBtn = document.getElementById("cancelProfileBtn");
  const profileForm = document.getElementById("profileForm");

  function getUser() { return window.UserSession?.getCurrentUser?.() || null; }

  // Thông báo lỗi/thành công: dùng SweetAlert2 (dạng text, không html) và dự phòng bằng alert.
  function popup(icon, title, text) {
    if (window.Swal?.fire) return window.Swal.fire({ icon, title, text });
    alert(`${title}\n${text}`);
    return null;
  }

  const EMAIL_PATTERN = /^[^\s@"'<>]+@[^\s@"'<>]+\.[^\s@"'<>]+$/;
  const PHONE_PATTERN = /^0\d{9}$/;

  // Trả về thông báo lỗi (hoặc null) cho dữ liệu hồ sơ; so sánh trùng với CÁC tài khoản khác.
  function validateProfile(data, current) {
    if (!data.hoTen) return "Họ tên không được để trống.";
    if (data.hoTen.length > 60) return "Họ tên không được vượt quá 60 ký tự.";
    if (/[<>]/.test(data.hoTen)) return "Họ tên không được chứa ký tự < hoặc >.";
    if (!data.thuDienTu) return "Email không được để trống.";
    if (!EMAIL_PATTERN.test(data.thuDienTu)) return "Email không hợp lệ.";
    if (!PHONE_PATTERN.test(data.soDienThoai)) return "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.";
    if (data.diaChi.length < 10) return "Địa chỉ phải có ít nhất 10 ký tự.";
    const others = (window.UserSession?.getUserList?.() || []).filter((item) => item.maKhachHang !== current.maKhachHang);
    const emailKey = data.thuDienTu.toLowerCase();
    if (others.some((item) => String(item.thuDienTu || "").trim().toLowerCase() === emailKey)) {
      return "Email này đã được sử dụng bởi tài khoản khác.";
    }
    if (others.some((item) => String(item.soDienThoai || "").trim() === data.soDienThoai)) {
      return "Số điện thoại này đã được sử dụng bởi tài khoản khác.";
    }
    return null;
  }

  function fillForm(user) {
    if (!user) return;
    nameInput.value = user.hoTen || user.thuDienTu || "";
    emailInput.value = user.thuDienTu || "";
    phoneInput.value = user.soDienThoai || "";
    addressInput.value = user.diaChi || "";
    if (sideAvatar) sideAvatar.src = user.anhDaiDien || window.UserSession?.DEFAULT_AVATAR || "assets/img/Avatar/avtuser.jpg";
    if (sideUsername) sideUsername.textContent = user.hoTen || user.thuDienTu || "Người dùng";
  }

  function enableEdit() {
    [nameInput, emailInput, phoneInput, addressInput].forEach((input) => input?.removeAttribute("readonly"));
    formActions?.classList.remove("hidden");
    if (editBtn) editBtn.style.display = "none";
  }

  function disableEdit() {
    [nameInput, emailInput, phoneInput, addressInput].forEach((input) => input?.setAttribute("readonly", "true"));
    formActions?.classList.add("hidden");
    if (editBtn) editBtn.style.display = "inline-block";
  }

  function requireLogin() {
    if (typeof Swal !== "undefined") {
      Swal.fire({ icon: "warning", title: "Cần đăng nhập", text: "Bạn phải đăng nhập để xem thông tin cá nhân.", confirmButtonText: "Đăng nhập" })
        .then(() => { window.location.href = "pages/login.html"; });
    } else window.location.href = "pages/login.html";
  }

  window.showThongTinCaNhan = function () {
    const user = getUser();
    if (!user) return requireLogin();
    section.style.display = "block";
    fillForm(user);
    disableEdit();
  };

  editBtn?.addEventListener("click", enableEdit);
  cancelBtn?.addEventListener("click", () => {
    fillForm(getUser());
    disableEdit();
  });

  profileForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const current = getUser();
    if (!current) return requireLogin();

    const updated = {
      ...current,
      hoTen: nameInput.value.trim(),
      tenDangNhap: current.tenDangNhap || current.hoTen,
      thuDienTu: emailInput.value.trim(),
      soDienThoai: phoneInput.value.trim(),
      diaChi: addressInput.value.trim()
    };

    const error = validateProfile(updated, current);
    if (error) {
      popup("error", "Dữ liệu chưa hợp lệ", error);
      return;
    }

    window.UserSession.saveUser(updated, current);
    if (typeof window.updateHeaderUI === "function") window.updateHeaderUI();
    fillForm(getUser());
    disableEdit();
    popup("success", "Thành công", "Cập nhật thông tin thành công!");
  });

  const user = getUser();
  if (!user) {
    // Trang chỉ dành cho người dùng đã đăng nhập: chuyển hướng thay vì hiển thị trang trống.
    window.location.href = "pages/login.html";
    return;
  }
  fillForm(user);
});
