document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("section-diachi");
  if (!section) return;

  const DEFAULT_AVATAR = window.UserSession?.DEFAULT_AVATAR || "assets/img/Avatar/avtuser.jpg";
  const EMAIL_PATTERN = /^[^\s@"'<>]+@[^\s@"'<>]+\.[^\s@"'<>]+$/;
  const PHONE_PATTERN = /^0\d{9}$/;
  const sideAvatar = document.getElementById("sideAvatar-diachi");
  const sideUsername = document.getElementById("sideUsername-diachi");
  const addressListEl = document.getElementById("addressList");
  const addBtn = document.getElementById("addAddressBtn");
  const addressFormWrap = document.getElementById("addressFormWrap");
  const addressForm = document.getElementById("addressForm");
  const cancelAddr = document.getElementById("cancelAddr");
  const addrName = document.getElementById("addrName");
  const addrPhone = document.getElementById("addrPhone");
  const addEmail = document.getElementById("addEmail");
  const addrAddress = document.getElementById("addAddress");
  const addressFormTitle = document.getElementById("addressFormTitle");
  let user = null;
  let editId = null; // maDiaChi của địa chỉ đang sửa (null = đang thêm mới)

  function popup(icon, title, text) {
    if (window.Swal?.fire) return window.Swal.fire({ icon, title, text });
    alert(`${title}\n${text}`);
    return null;
  }

  function newAddressId() {
    return `dc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  // Mọi địa chỉ phải có maDiaChi duy nhất; trả về true nếu có thay đổi.
  function ensureAddressIds(list) {
    const seen = new Set();
    let changed = false;
    list.forEach((address) => {
      if (!address.maDiaChi || seen.has(address.maDiaChi)) {
        address.maDiaChi = newAddressId();
        changed = true;
      }
      seen.add(address.maDiaChi);
    });
    return changed;
  }

  function save() {
    if (!user) return;
    if (window.UserSession?.saveUser) window.UserSession.saveUser(user, user);
    else localStorage.setItem("currentUser", JSON.stringify(user));
  }

  // Luôn đọc lại bản ghi mới nhất từ phiên/userList trước khi thao tác.
  function loadUser() {
    user = window.UserSession?.getCurrentUser?.() || null;
    if (!user) return null;
    if (!Array.isArray(user.diaChiPhu)) user.diaChiPhu = [];
    if (ensureAddressIds(user.diaChiPhu)) save();
    return user;
  }

  function requireLogin() { window.location.href = "pages/login.html"; }

  function findById(id) {
    return user?.diaChiPhu.find((address) => address.maDiaChi === id) || null;
  }

  function sameAddress(selected, address) {
    if (!selected || !address) return false;
    if (selected.maDiaChi && address.maDiaChi) return selected.maDiaChi === address.maDiaChi;
    return selected.diaChi === address.diaChi && selected.soDienThoai === address.soDienThoai;
  }

  function getSelected() {
    return window.UserSession?.parseJSON?.("selectedAddress", null) || null;
  }

  function setSelected(address) {
    if (address) localStorage.setItem("selectedAddress", JSON.stringify(address));
    else localStorage.removeItem("selectedAddress");
  }

  function defaultAddress() {
    return user.diaChiPhu.find((address) => address.macDinh) || user.diaChiPhu[0] || null;
  }

  function closeForm() {
    editId = null;
    addressForm?.reset();
    addressFormWrap?.classList.add("hidden");
  }

  function render() {
    if (!user || !addressListEl) return;
    if (sideAvatar) sideAvatar.src = user.anhDaiDien || DEFAULT_AVATAR;
    if (sideUsername) sideUsername.textContent = user.hoTen || user.thuDienTu || "Người dùng";
    addressListEl.innerHTML = "";

    if (!user.diaChiPhu.length) {
      addressListEl.innerHTML = `<div class="empty-note">Bạn chưa có địa chỉ nào. Nhấn "Thêm địa chỉ mới" để bắt đầu.</div>`;
      return;
    }

    user.diaChiPhu.forEach((address) => {
      const id = address.maDiaChi;
      const card = document.createElement("div");
      card.className = "address-card";
      card.dataset.id = id;
      const left = document.createElement("div");
      left.className = "address-left";
      const details = [
        ["Người nhận", address.tenNguoiNhan],
        ["Số điện thoại", address.soDienThoai],
        ["Email", address.thuDienTu],
        ["Địa chỉ", address.diaChi]
      ];
      // Giá trị người dùng chỉ được chèn bằng textContent (tự động thoát HTML).
      details.forEach(([label, value]) => {
        const row = document.createElement("div");
        const strong = document.createElement("strong");
        strong.textContent = `${label}:`;
        const span = document.createElement("span");
        span.textContent = value || "";
        row.append(strong, " ", span);
        left.appendChild(row);
      });

      const right = document.createElement("div");
      right.className = "address-right";
      if (address.macDinh) {
        const badge = document.createElement("div");
        badge.className = "addr-badge";
        badge.textContent = "Mặc định";
        right.appendChild(badge);
      }

      const controls = document.createElement("div");
      controls.className = "address-actions";
      if (!address.macDinh) {
        const setDefault = document.createElement("button");
        setDefault.className = "save-btn set-default-btn";
        setDefault.dataset.id = id;
        setDefault.textContent = "Thiết lập mặc định";
        setDefault.addEventListener("click", () => setDefaultAddress(id));
        controls.appendChild(setDefault);
      }
      const edit = document.createElement("button");
      edit.className = "cancel-btn edit-btn";
      edit.dataset.id = id;
      edit.textContent = "Cập nhật";
      edit.addEventListener("click", () => editAddress(id));
      controls.appendChild(edit);

      const del = document.createElement("button");
      del.className = "cancel-btn del-btn";
      del.dataset.id = id;
      del.textContent = "Xóa";
      del.addEventListener("click", () => deleteAddress(id));
      controls.appendChild(del);
      right.appendChild(controls);

      card.append(left, right);
      addressListEl.appendChild(card);
    });
  }

  function setDefaultAddress(id) {
    if (!loadUser()) return requireLogin();
    if (!findById(id)) { render(); return; }
    user.diaChiPhu = user.diaChiPhu.map((address) => ({ ...address, macDinh: address.maDiaChi === id }));
    setSelected(findById(id));
    save();
    render();
  }

  function editAddress(id) {
    if (!loadUser()) return requireLogin();
    const address = findById(id);
    if (!address) { closeForm(); render(); return; }
    editId = id;
    addressFormTitle.textContent = "Cập nhật địa chỉ";
    addrName.value = address.tenNguoiNhan || "";
    addrPhone.value = address.soDienThoai || "";
    addEmail.value = address.thuDienTu || "";
    addrAddress.value = address.diaChi || "";
    addressFormWrap.classList.remove("hidden");
  }

  function deleteAddress(id) {
    if (!window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) return;
    if (!loadUser()) return requireLogin();
    const deleted = findById(id);
    if (!deleted) { render(); return; }
    user.diaChiPhu = user.diaChiPhu.filter((address) => address.maDiaChi !== id);
    if (deleted.macDinh && user.diaChiPhu.length) user.diaChiPhu[0].macDinh = true;
    if (sameAddress(getSelected(), deleted)) setSelected(defaultAddress());
    // Đang mở form sửa đúng địa chỉ vừa xóa: đóng form để không còn tham chiếu cũ.
    if (editId === id) closeForm();
    save();
    render();
  }

  function openAddForm() {
    if (!loadUser()) return requireLogin();
    editId = null;
    addressForm.reset();
    addressFormTitle.textContent = "Thêm địa chỉ";
    addressFormWrap.classList.remove("hidden");
  }

  function validate(name, phone, email, address) {
    if (!name) return "Vui lòng nhập tên người nhận.";
    if (!/^[A-Za-zÀ-ỹ\s]+$/.test(name)) return "Tên không hợp lệ. Chỉ được nhập chữ cái và khoảng trắng.";
    if (!phone) return "Vui lòng nhập số điện thoại.";
    if (!PHONE_PATTERN.test(phone)) return "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.";
    if (email && !EMAIL_PATTERN.test(email)) return "Email không hợp lệ.";
    if (!address) return "Vui lòng nhập địa chỉ.";
    if (address.length < 10) return "Địa chỉ phải có ít nhất 10 ký tự.";
    return null;
  }

  addBtn?.addEventListener("click", openAddForm);
  cancelAddr?.addEventListener("click", closeForm);
  addressForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!loadUser()) return requireLogin();
    const data = {
      tenNguoiNhan: addrName.value.trim(),
      soDienThoai: addrPhone.value.trim(),
      thuDienTu: addEmail.value.trim(),
      diaChi: addrAddress.value.trim()
    };
    const error = validate(data.tenNguoiNhan, data.soDienThoai, data.thuDienTu, data.diaChi);
    if (error) { popup("error", "Dữ liệu chưa hợp lệ", error); return; }

    if (editId === null) {
      const created = { maDiaChi: newAddressId(), ...data, macDinh: user.diaChiPhu.length === 0 };
      user.diaChiPhu.push(created);
      if (!getSelected()) setSelected(defaultAddress());
    } else {
      const index = user.diaChiPhu.findIndex((address) => address.maDiaChi === editId);
      if (index < 0) {
        closeForm();
        render();
        popup("error", "Không tìm thấy địa chỉ", "Địa chỉ này không còn tồn tại (có thể đã bị xóa).");
        return;
      }
      const previous = user.diaChiPhu[index];
      const updated = { ...previous, ...data, maDiaChi: previous.maDiaChi };
      user.diaChiPhu[index] = updated;
      if (sameAddress(getSelected(), previous)) setSelected(updated);
      else if (!getSelected()) setSelected(defaultAddress());
    }
    save();
    closeForm();
    render();
  });

  window.showDiaChiSection = function () {
    if (!loadUser()) return requireLogin();
    section.style.display = "block";
    render();
  };

  if (!loadUser()) {
    // Trang chỉ dành cho người dùng đã đăng nhập: chuyển hướng thay vì hiển thị trang trống.
    requireLogin();
    return;
  }
  section.style.display = "block";
  render();
});
