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

  function fillForm(user) {
    if (!user) return;
    nameInput.value = user.userName || user.email || "";
    emailInput.value = user.email || "";
    phoneInput.value = user.phone || "";
    addressInput.value = user.address || "";
    if (sideAvatar) sideAvatar.src = user.avatar || window.UserSession?.DEFAULT_AVATAR || "assets/img/Avatar/avtuser.jpg";
    if (sideUsername) sideUsername.textContent = user.userName || user.email || "Người dùng";
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
      userName: nameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim(),
      address: addressInput.value.trim()
    };

    if (!updated.userName || !updated.email) {
      Swal?.fire?.({ icon: "error", title: "Thiếu thông tin", text: "Tên và email không được để trống." });
      return;
    }

    window.UserSession.saveUser(updated, current);
    if (typeof window.updateHeaderUI === "function") window.updateHeaderUI();
    disableEdit();
    Swal?.fire?.({ icon: "success", title: "Thành công", text: "Cập nhật thông tin thành công!" });
  });

  const user = getUser();
  if (user) fillForm(user);
});
