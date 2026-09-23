document.addEventListener("DOMContentLoaded", () => {
  const sectionDiaChi = document.getElementById("section-diachi");
  if (!sectionDiaChi) return;

  //  Các Element
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

  const DEFAULT_AVATAR = "./assets/img/Avatar/avtuser.jpg";
  let user = JSON.parse(localStorage.getItem("currentUser")) || null;
  let editIndex = -1;


  /** Hiển thị danh sách địa chỉ */
  function renderAddresses() {
    if (!user) return;
    if (!Array.isArray(user.addresses)) user.addresses = [];

    // Cập nhật sidebar
    if (sideAvatar) sideAvatar.src = user.avatar || DEFAULT_AVATAR;
    if (sideUsername) sideUsername.textContent = user.userName || "Người dùng";

    addressListEl.innerHTML = "";

    if (user.addresses.length === 0) {
      addressListEl.innerHTML = `<div class="empty-note">Bạn chưa có địa chỉ nào. Nhấn "Thêm địa chỉ mới" để bắt đầu.</div>`;
      return;
    }

    user.addresses.forEach((a, idx) => {
      const card = createAddressCard(a, idx);
      addressListEl.appendChild(card);
    });

    attachAddressEventHandlers();
  }

  /** Tạo thẻ hiển thị từng địa chỉ */
  function createAddressCard(a, idx) {
    const card = document.createElement("div");
    card.className = "address-card";

    const left = document.createElement("div");
    left.className = "address-left";
    left.innerHTML = `
      <div><strong>Người nhận:</strong> ${a.name}</div>
      <div><strong>Số điện thoại:</strong> ${a.phone}</div>
      <div><strong>Email:</strong> ${a.email}</div>
      <div><strong>Địa chỉ:</strong> ${a.address}</div>
    `;

    const right = document.createElement("div");
    right.className = "address-right";
    right.innerHTML = a.default
      ? `<div class="addr-badge">Mặc định</div>`
      : `<div style="height:18px;"></div>`;

    const btns = document.createElement("div");
    btns.style.marginTop = "8px";
    btns.innerHTML = `
      ${a.default ? "" : `<button class="save-btn set-default-btn" data-idx="${idx}">Thiết lập mặc định</button>`}
      <button class="cancel-btn edit-btn" data-idx="${idx}">Cập nhật</button>
      <button class="cancel-btn del-btn" data-idx="${idx}">Xóa</button>
    `;

    right.appendChild(btns);
    card.appendChild(left);
    card.appendChild(right);


    return card;
  }

  /** Gắn sự kiện cho các nút (mặc định, sửa, xóa) */
  function attachAddressEventHandlers() {
    // Thiết lập mặc định
    document.querySelectorAll(".set-default-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        const i = Number(e.currentTarget.dataset.idx);
        setDefaultAddress(i);
      });
    });

    // Cập nhật
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        editIndex = Number(e.currentTarget.dataset.idx);
        editAddress(editIndex);
      });
    });

    // Xóa
    document.querySelectorAll(".del-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        const i = Number(e.currentTarget.dataset.idx);
        deleteAddress(i);
      });
    });
  }

  /** Thiết lập địa chỉ mặc định */
  function setDefaultAddress(index) {
    user.addresses = user.addresses.map((ad, j) => ({ ...ad, default: j === index }));
    localStorage.setItem("selectedAddress", JSON.stringify(user.addresses[index]));
    saveUserAndRender();
  }

  /** Mở form cập nhật địa chỉ */
  function editAddress(index) {
    const a = user.addresses[index];
    addressFormWrap.classList.remove("hidden");
    addressFormTitle.textContent = "Cập nhật địa chỉ";
    addrName.value = a.name;
    addrPhone.value = a.phone;
    addEmail.value = a.email;
    addrAddress.value = a.address;
  }

  /** Xóa địa chỉ */
  function deleteAddress(index) {
    if (!confirm("Bạn có chắc muốn xóa địa chỉ này?")) return;
    user.addresses.splice(index, 1);
    if (!user.addresses.some(a => a.default) && user.addresses.length > 0) {
      user.addresses[0].default = true;
    }
    saveUserAndRender();
  }

  /** Lưu thông tin user và render lại */
  function saveUserAndRender() {
    localStorage.setItem("currentUser", JSON.stringify(user));
    const users = JSON.parse(localStorage.getItem("userList")) || [];
    const idx = users.findIndex(u => u.email === user.email);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...user };
      localStorage.setItem("userList", JSON.stringify(users));
    }
    renderAddresses();
  }

  /** Mở form thêm mới */
  function openAddForm() {
    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Cần đăng nhập",
        text: "Bạn phải đăng nhập để thêm địa chỉ.",
        confirmButtonText: "Đăng nhập",
      }).then(() => {
        if (typeof window.navigateTo === "function") window.navigateTo("login");
      });
      return;
    }

    editIndex = -1;
    addressFormTitle.textContent = "Thêm địa chỉ";
    addressForm.reset();
    addressFormWrap.classList.remove("hidden");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  /** Đóng form */
  function closeForm() {
    addressForm.reset();
    addressFormWrap.classList.add("hidden");
  }

  /** Kiểm tra hợp lệ form */
  function validateForm(name, phone, email, address) {
    if (!name || !phone || !email || !address) {
      alert("Vui lòng điền đầy đủ thông tin.");
      return false;
    }
    if (!/^[A-Za-zÀ-ỹ\s]+$/.test(name)) {
      alert("Tên không hợp lệ. Chỉ được nhập chữ cái và khoảng trắng.");
      return false;
    }
    if (!/^[0][0-9]{9}$/.test(phone)) {
      alert("Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số, bắt đầu bằng 0.");
      return false;
    }
    return true;
  }

  /** Xử lý submit form */
  function handleFormSubmit(e) {
    e.preventDefault();
    if (!user) return;

    const name = addrName.value.trim();
    const phone = addrPhone.value.trim();
    const email = addEmail.value.trim();
    const address = addrAddress.value.trim();

    if (!validateForm(name, phone, email, address)) return;

    if (!Array.isArray(user.addresses)) user.addresses = [];

    if (editIndex === -1) {
      user.addresses.push({ name, phone, email, address });
    } else {
      user.addresses[editIndex] = { ...user.addresses[editIndex], name, phone, email, address };
    }

    saveUserAndRender();
    closeForm();
  }

  /** Hiển thị khi mở trang */
  window.showDiaChiSection = function () {
    user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Cần đăng nhập",
        text: "Bạn phải đăng nhập để xem địa chỉ.",
        confirmButtonText: "Đăng nhập",
      }).then(() => {
        if (typeof window.navigateTo === "function") window.navigateTo("login");
      });
      return;
    }
    sectionDiaChi.style.display = "block";
    renderAddresses();
  };

  // GẮN SỰ KIỆN
  addBtn.addEventListener("click", openAddForm);
  cancelAddr.addEventListener("click", closeForm);
  addressForm.addEventListener("submit", handleFormSubmit);

  // Tự động hiển thị nếu đang trong trang địa chỉ
  renderAddresses();
});
