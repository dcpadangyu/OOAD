document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("section-diachi");
  if (!section) return;

  const DEFAULT_AVATAR = window.UserSession?.DEFAULT_AVATAR || "assets/img/Avatar/avtuser.jpg";
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
  let editIndex = -1;

  function loadUser() { user = window.UserSession?.getCurrentUser?.() || null; return user; }

  function save() {
    if (!user) return;
    if (window.UserSession?.saveUser) window.UserSession.saveUser(user, user);
    else localStorage.setItem("currentUser", JSON.stringify(user));
  }

  function render() {
    if (!user || !addressListEl) return;
    if (!Array.isArray(user.addresses)) user.addresses = [];
    if (sideAvatar) sideAvatar.src = user.avatar || DEFAULT_AVATAR;
    if (sideUsername) sideUsername.textContent = user.userName || user.email || "Người dùng";
    addressListEl.innerHTML = "";

    if (!user.addresses.length) {
      addressListEl.innerHTML = `<div class="empty-note">Bạn chưa có địa chỉ nào. Nhấn "Thêm địa chỉ mới" để bắt đầu.</div>`;
      return;
    }

    user.addresses.forEach((address, index) => {
      const card = document.createElement("div");
      card.className = "address-card";
      const left = document.createElement("div");
      left.className = "address-left";
      const details = [
        ["Người nhận", address.name],
        ["Số điện thoại", address.phone],
        ["Email", address.email],
        ["Địa chỉ", address.address]
      ];
      details.forEach(([label, value]) => {
        const row = document.createElement("div");
        row.innerHTML = `<strong>${label}:</strong> `;
        const span = document.createElement("span");
        span.textContent = value || "";
        row.appendChild(span);
        left.appendChild(row);
      });

      const right = document.createElement("div");
      right.className = "address-right";
      if (address.default) {
        const badge = document.createElement("div");
        badge.className = "addr-badge";
        badge.textContent = "Mặc định";
        right.appendChild(badge);
      }

      const controls = document.createElement("div");
      controls.className = "address-actions";
      if (!address.default) {
        const setDefault = document.createElement("button");
        setDefault.className = "save-btn set-default-btn";
        setDefault.dataset.idx = index;
        setDefault.textContent = "Thiết lập mặc định";
        setDefault.addEventListener("click", () => setDefaultAddress(index));
        controls.appendChild(setDefault);
      }
      const edit = document.createElement("button");
      edit.className = "cancel-btn edit-btn";
      edit.textContent = "Cập nhật";
      edit.addEventListener("click", () => editAddress(index));
      controls.appendChild(edit);

      const del = document.createElement("button");
      del.className = "cancel-btn del-btn";
      del.textContent = "Xóa";
      del.addEventListener("click", () => deleteAddress(index));
      controls.appendChild(del);
      right.appendChild(controls);

      card.append(left, right);
      addressListEl.appendChild(card);
    });
  }

  function setDefaultAddress(index) {
    user.addresses = user.addresses.map((address, i) => ({ ...address, default: i === index }));
    localStorage.setItem("selectedAddress", JSON.stringify(user.addresses[index]));
    save();
    render();
  }

  function editAddress(index) {
    const address = user.addresses[index];
    if (!address) return;
    editIndex = index;
    addressFormTitle.textContent = "Cập nhật địa chỉ";
    addrName.value = address.name || "";
    addrPhone.value = address.phone || "";
    addEmail.value = address.email || "";
    addrAddress.value = address.address || "";
    addressFormWrap.classList.remove("hidden");
  }

  function deleteAddress(index) {
    if (!window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) return;
    const deleted = user.addresses[index];
    user.addresses.splice(index, 1);
    if (deleted?.default && user.addresses.length) user.addresses[0].default = true;
    const selected = window.UserSession?.parseJSON?.("selectedAddress", null);
    if (selected && deleted && selected.address === deleted.address && selected.phone === deleted.phone) {
      const nextDefault = user.addresses.find((a) => a.default) || null;
      if (nextDefault) localStorage.setItem("selectedAddress", JSON.stringify(nextDefault));
      else localStorage.removeItem("selectedAddress");
    }
    save();
    render();
  }

  function openAddForm() {
    if (!loadUser()) {
      window.location.href = "pages/login.html";
      return;
    }
    editIndex = -1;
    addressForm.reset();
    addressFormTitle.textContent = "Thêm địa chỉ";
    addressFormWrap.classList.remove("hidden");
  }

  function validate(name, phone, email, address) {
    if (!name || !phone || !email || !address) return "Vui lòng điền đầy đủ thông tin.";
    if (!/^[A-Za-zÀ-ỹ\s]+$/.test(name)) return "Tên không hợp lệ. Chỉ được nhập chữ cái và khoảng trắng.";
    if (!/^0\d{9}$/.test(phone)) return "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Email không hợp lệ.";
    return null;
  }

  addBtn?.addEventListener("click", openAddForm);
  cancelAddr?.addEventListener("click", () => { addressForm.reset(); addressFormWrap.classList.add("hidden"); });
  addressForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!user) return;
    const data = {
      name: addrName.value.trim(),
      phone: addrPhone.value.trim(),
      email: addEmail.value.trim(),
      address: addrAddress.value.trim()
    };
    const error = validate(data.name, data.phone, data.email, data.address);
    if (error) { Swal?.fire?.({ icon: "error", title: "Dữ liệu chưa hợp lệ", text: error }); return; }
    if (editIndex < 0) user.addresses.push(data);
    else user.addresses[editIndex] = { ...user.addresses[editIndex], ...data };
    save();
    addressForm.reset();
    addressFormWrap.classList.add("hidden");
    render();
  });

  window.showDiaChiSection = function () {
    if (!loadUser()) { window.location.href = "pages/login.html"; return; }
    section.style.display = "block";
    render();
  };

  loadUser();
  if (user) section.style.display = "block";
  render();
});
