// ==================== CẤU HÌNH BAN ĐẦU ====================
const QLSP_itemsPerPage = 10;
let QLSP_currentPage = 1;
let QLSP_productsLocal = [];
let QLSP_mangDaLoc = [];

// ==================== KHI LOAD TRANG ====================
document.addEventListener("DOMContentLoaded", function () {
  try {
    // Đảm bảo có dữ liệu sản phẩm
    if (!localStorage.getItem("productsLocal")) {
      console.log("Khởi tạo dữ liệu sản phẩm từ mẫu...");
      localStorage.setItem("productsLocal", JSON.stringify(products));
    }

    QLSP_productsLocal = getLocalProducts();
    console.log("Đã tải " + QLSP_productsLocal.length + " sản phẩm");

    QLSP_mangDaLoc = QLSP_productsLocal;
    QLSP_khoiTaoTrang();
    QLSP_veBangSanPham(QLSP_productsLocal);
    QLSP_ganSuKien();

    // Cập nhật bộ lọc danh mục
    loadCategoriesIntoDropdowns();
    console.log("Khởi tạo trang thành công");
  } catch (error) {
    console.error("Lỗi khi khởi tạo trang:", error);
  }
});

// tự reaload lại dữ liệu khi nghe thấy thay đổi
window.addEventListener("productsUpdated", () => {
  QLSP_productsLocal = getLocalProducts();
  QLSP_mangDaLoc = QLSP_productsLocal;
});
// ======== HÀM KHỞI TẠO =========
function QLSP_khoiTaoTrang() {
  console.log("Quản lý sản phẩm đã khởi tạo");
  if (typeof adminSession !== "undefined" && adminSession.isLoggedIn()) {
    const adminInfo = adminSession.getCurrentAdmin();
    if (adminInfo && adminInfo.username) {
      const adminNameElement = document.getElementById("adminName");
      if (adminNameElement) adminNameElement.textContent = adminInfo.username;
    }
  }
}
//Debug lỗi modal để fixed so với toàn khung nhìn
//để position: fixed sẽ luôn so với toàn màn hình thật
document.addEventListener("DOMContentLoaded", function () {
  // Di chuyển modals ra ngoài body
  try {
    const modalThem = document.getElementById("QLSP_modalThemSP");
    if (modalThem && modalThem.parentElement !== document.body) {
      document.body.appendChild(modalThem);
    }
    const modalSua = document.getElementById("QLSP_modalSuaSP");
    if (modalSua && modalSua.parentElement !== document.body) {
      document.body.appendChild(modalSua);
    }

    // Khởi tạo các dropdown categories
    loadCategoriesIntoDropdowns();

    // Đăng ký lắng nghe sự kiện thay đổi categories
    window.addEventListener("categoriesUpdated", function (event) {
      console.log("Received categoriesUpdated event");
      try {
        loadCategoriesIntoDropdowns();
        QLSP_locTheoDanhMuc(); // Cập nhật lại bộ lọc
      } catch (error) {
        console.error("Error handling categoriesUpdated event:", error);
      }
    });
  } catch (error) {
    console.error("Error initializing product management:", error);
  }
});

// ======== HÀM XỬ LÍ SỰ KIỆN =========
function QLSP_ganSuKien() {
  document
    .getElementById("QLSP_locDanhMuc")
    .addEventListener("change", QLSP_locTheoDanhMuc);

  document
    .getElementById("QLSP_timId")
    .addEventListener("input", QLSP_timTheoMa);

  // ================== XỬ LÝ CLICK ẨN / HIỆN ==================
  document.addEventListener("click", function (e) {
    if (
      e.target.classList.contains("QLSP_tick-visible") ||
      e.target.classList.contains("QLSP_tick-hidden")
    ) {
      const productId = e.target.getAttribute("data-id");
      const products = getLocalProducts();

      const index = products.findIndex((p) => p.id === productId);
      if (index !== -1) {
        products[index].visibility =
          products[index].visibility === "visible" ? "hidden" : "visible";
        saveLocalProducts(products);

        e.target.classList.toggle("QLSP_tick-visible");
        e.target.classList.toggle("QLSP_tick-hidden");
        e.target.textContent =
          products[index].visibility === "visible" ? "✔" : "";
      }
    }
  });
}

// ======== HÀM TẠO BẢNG SẢN PHẨM =========
function QLSP_veBangSanPham(dsSP) {
  console.log("Vẽ bảng sản phẩm với " + dsSP.length + " sản phẩm");

  const tableContent = document.querySelector(".QLSP_table-content");
  if (!tableContent) {
    console.error("Không tìm thấy phần tử .QLSP_table-content");
    return;
  }

  tableContent.innerHTML = "";

  let table = document.createElement("table");
  table.classList.add("QLSP_admin-table");

  let tbody = document.createElement("tbody");

  const start = (QLSP_currentPage - 1) * QLSP_itemsPerPage;
  const end = start + QLSP_itemsPerPage;
  const productsToShow = dsSP.slice(start, end);

  productsToShow.forEach((sp, index) => {
    const stt = start + index + 1;
    const isBase64 = sp.image.startsWith("data:");
    const imgSrc = (sp.image.startsWith("http") || isBase64) ? sp.image : `../${sp.image}`;
    const tickClass =
      sp.visibility === "visible" ? "QLSP_tick-visible" : "QLSP_tick-hidden";
    const tickSymbol = sp.visibility === "visible" ? "✔" : "";

    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${stt}</td>
      <td>${sp.id}</td>
      <td>${sp.name}</td>
      <td>${sp.catalog}</td>
      <td>${sp.desc}</td>
      <td><img src="${imgSrc}" alt="${sp.name}" class="QLSP_img"></td>
      <td><div class="${tickClass}" data-id="${sp.id}">${tickSymbol}</div></td>
      <td>
        <button class="QLSP_btn-sua">Sửa</button>
        <button class="QLSP_btn-xoa">Xóa</button>
      </td>`;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableContent.appendChild(table);

  // ======== CẬP NHẬT PHÂN TRANG =========
  const totalPages = Math.ceil(dsSP.length / QLSP_itemsPerPage);
  document.getElementById(
    "QLSP_pageInfo"
  ).textContent = `Trang ${QLSP_currentPage} / ${totalPages}`;
  document.getElementById("QLSP_prevPage").disabled = QLSP_currentPage === 1;
  document.getElementById("QLSP_nextPage").disabled =
    QLSP_currentPage === totalPages;

  document.getElementById("QLSP_prevPage").onclick = () => QLSP_prevPage();
  document.getElementById("QLSP_nextPage").onclick = () => QLSP_nextPage();
}

function QLSP_nextPage() {
  const totalPages = Math.ceil(QLSP_mangDaLoc.length / QLSP_itemsPerPage);
  if (QLSP_currentPage < totalPages) {
    QLSP_currentPage++;
    QLSP_veBangSanPham(QLSP_mangDaLoc);
  }
}

function QLSP_prevPage() {
  if (QLSP_currentPage > 1) {
    QLSP_currentPage--;
    QLSP_veBangSanPham(QLSP_mangDaLoc);
  }
}

// ================== MODAL THÊM ==================
const QLSP_modal = document.getElementById("QLSP_modalThemSP");
const QLSP_btnThemMoi = document.getElementById("QLSP_btnThemMoiSP");
const QLSP_btnClose = document.getElementById("QLSP_btnCloseModal");
const QLSP_btnCancel = document.getElementById("QLSP_btnCancelSP");
const QLSP_form = document.getElementById("QLSP_formThemSP");
const QLSP_preview = document.getElementById("QLSP_previewImage");
const QLSP_inputImage = document.getElementById("QLSP_spImage");

QLSP_btnThemMoi.addEventListener("click", () => {
  QLSP_modal.style.display = "flex";
});
QLSP_btnClose.addEventListener("click", QLSP_closeModal);
QLSP_btnCancel.addEventListener("click", QLSP_closeModal);

function QLSP_closeModal() {
  QLSP_modal.style.display = "none";
  QLSP_form.reset();
  QLSP_preview.innerHTML = "";
}

// ========== XỬ LÝ UPLOAD ẢNH (THÊM MỚI) ==========
// Nén ảnh trước khi lưu để tránh vỡ localStorage (base64 quá lớn)
function QLSP_compressImage(file, done) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const MAX = 400;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      try {
        done(canvas.toDataURL("image/jpeg", 0.82));
      } catch (err) {
        done(e.target.result);
      }
    };
    img.onerror = function () { done(e.target.result); };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

QLSP_inputImage.addEventListener("change", function() {
  const file = this.files[0];
  if (file) {
    QLSP_compressImage(file, function(data) {
      QLSP_preview.innerHTML = `<img src="${data}" alt="Ảnh sản phẩm" style="max-width:100%; max-height:200px;">`;
      // Lưu base64 vào biến tạm (dùng khi lưu sản phẩm)
      QLSP_inputImage.dataset.imageData = data;
    });
  }
});

// ================== THÊM SẢN PHẨM ==================
QLSP_formThemSP.addEventListener("submit", function (e) {
  e.preventDefault();
  let dsSanPham = getLocalProducts();
  const idInput = document.getElementById("QLSP_spId");
  const idValue = idInput.value.trim();

  if (dsSanPham.some((sp) => sp.id.toLowerCase() === idValue.toLowerCase())) {
    idInput.focus();
    alert("Mã sản phẩm đã tồn tại!");
    return;
  }

  let ktrGiaNhap = document.getElementById("QLSP_spImportPrice");
  let giaNhapValue = parseFloat(ktrGiaNhap.value);
  if (isNaN(giaNhapValue) || giaNhapValue < 0) {
    alert("Giá nhập phải lớn hơn 0!");
    ktrGiaNhap.focus();
    return;
  }

  // Lấy dữ liệu ảnh từ file upload
  let imageData = QLSP_inputImage.dataset.imageData || "";
  if (!imageData) {
    alert("Vui lòng chọn ảnh sản phẩm!");
    QLSP_inputImage.focus();
    return;
  }

  const spMoi = {
    id: idValue,
    catalog: document.getElementById("QLSP_spCatalog").value,
    name: document.getElementById("QLSP_spName").value.trim(),
    gender: document.getElementById("QLSP_spGender").value,
    desc: document.getElementById("QLSP_spDesc").value.trim(),
    color: document.getElementById("QLSP_spColor").value,
    importPrice: giaNhapValue,
    priceValue: 0,
    quantity: 0,
    image: imageData,
    price: "0₫",
    visibility: "visible",
    size: document.getElementById("QLSP_spSize").value.trim(),
    material: document.getElementById("QLSP_spGlass").value.trim(),
    style: document.getElementById("QLSP_spStrap").value.trim(),
    importQuantity: 0,
    soldQuantity: 0,
    description: document.getElementById("QLSP_spDescription").value.trim(),
    origin: "Việt Nam",
  };

  dsSanPham.push(spMoi);
  saveLocalProducts(dsSanPham);
  QLSP_productsLocal = dsSanPham;
  QLSP_mangDaLoc = dsSanPham;
  QLSP_veBangSanPham(QLSP_mangDaLoc);
  QLSP_closeModal();
  alert("Thêm sản phẩm thành công!");
});

// ================== SỬA & XÓA ==================
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("QLSP_btn-sua")) {
    const id = e.target.closest("tr").children[1].textContent.trim();
    const product = QLSP_productsLocal.find((p) => p.id === id);
    if (product) QLSP_openEditModal(product);
  }

  if (e.target.classList.contains("QLSP_btn-xoa")) {
    const id = e.target.closest("tr").children[1].textContent.trim();
    if (confirm("Bạn có chắc muốn xóa sản phẩm này không?")) {
      QLSP_productsLocal = QLSP_productsLocal.filter((sp) => sp.id !== id);
      saveLocalProducts(QLSP_productsLocal);
      QLSP_mangDaLoc = QLSP_productsLocal;
      QLSP_veBangSanPham(QLSP_mangDaLoc);
      alert("Xóa sản phẩm thành công!");
    }
  }
});

// ================== MODAL SỬA ==================
function QLSP_openEditModal(product) {
  const modal = document.getElementById("QLSP_modalSuaSP");
  modal.style.display = "flex";

  document.getElementById("QLSP_editId").value = product.id;
  document.getElementById("QLSP_editCatalog").value = product.catalog;
  document.getElementById("QLSP_editName").value = product.name;
  document.getElementById("QLSP_editGender").value = product.gender;
  document.getElementById("QLSP_editDesc").value = product.desc;
  document.getElementById("QLSP_editColor").value = product.color;
  document.getElementById("QLSP_editImportPrice").value = product.importPrice;
  document.getElementById("QLSP_editVisibility").value = product.visibility;
  document.getElementById("QLSP_editSize").value = product.size || "";
  document.getElementById("QLSP_editGlass").value = product.material || "";
  document.getElementById("QLSP_editStrap").value = product.style || "";
  document.getElementById("QLSP_editDescription").value =
    product.description || "";

  // Hiển thị ảnh cũ
  document.getElementById("QLSP_previewEditImg").src = product.image;
  
  // Lưu dữ liệu ảnh cũ vào file input
  const editImageInput = document.getElementById("QLSP_editImage");
  editImageInput.dataset.currentImage = product.image;
  editImageInput.value = ""; // Reset input file
}

// ========== XỬ LÝ UPLOAD ẢNH (SỬA) ==========
document
  .getElementById("QLSP_editImage")
  .addEventListener("change", function() {
    const file = this.files[0];
    if (file) {
      QLSP_compressImage(file, function(data) {
        document.getElementById("QLSP_previewEditImg").src = data;
        // Lưu base64 vào data attribute
        document.getElementById("QLSP_editImage").dataset.imageData = data;
      });
    }
  });

document
  .getElementById("QLSP_btnUpdateSP")
  .addEventListener("click", function () {
    const id = document.getElementById("QLSP_editId").value.trim();
    let dsSanPham = getLocalProducts();
    const index = dsSanPham.findIndex((sp) => sp.id === id);
    if (index === -1) {
      alert("Không tìm thấy sản phẩm cần sửa!");
      return;
    }
    const idInput = document.getElementById("QLSP_spId");
    const idValue = idInput.value.trim();

    if (dsSanPham.some((sp) => sp.id.toLowerCase() === idValue.toLowerCase())) {
      idInput.focus();
      alert("Mã sản phẩm đã tồn tại!");
      return;
    }

    let ktrGiaSua = document.getElementById("QLSP_editImportPrice");
    let giaSuaValue = parseFloat(ktrGiaSua.value);
    if (isNaN(giaSuaValue) || giaSuaValue < 0) {
      alert("Giá nhập phải lớn hơn 0!");
      ktrGiaSua.focus();
      return;
    }

    // Lấy ảnh mới (nếu user chọn file) hoặc ảnh cũ (nếu user không chọn file)
    const editImageInput = document.getElementById("QLSP_editImage");
    let imageData = editImageInput.dataset.imageData || dsSanPham[index].image;

    dsSanPham[index] = {
      ...dsSanPham[index],
      catalog: document.getElementById("QLSP_editCatalog").value,
      name: document.getElementById("QLSP_editName").value.trim(),
      gender: document.getElementById("QLSP_editGender").value,
      desc: document.getElementById("QLSP_editDesc").value.trim(),
      color: document.getElementById("QLSP_editColor").value,
      importPrice: giaSuaValue,
      visibility: document.getElementById("QLSP_editVisibility").value,
      size: document.getElementById("QLSP_editSize").value.trim(),
      material: document.getElementById("QLSP_editGlass").value.trim(),
      style: document.getElementById("QLSP_editStrap").value.trim(),
      description: document.getElementById("QLSP_editDescription").value.trim(),
      image: imageData,
    };

    saveLocalProducts(dsSanPham);
    QLSP_productsLocal = dsSanPham;
    QLSP_mangDaLoc = dsSanPham;
    QLSP_veBangSanPham(QLSP_mangDaLoc);
    QLSP_closeEditModal();
    alert("Cập nhật sản phẩm thành công!");
  });

document
  .getElementById("QLSP_btnCloseModalSua")
  .addEventListener("click", QLSP_closeEditModal);
document
  .getElementById("QLSP_btnCancelEdit")
  .addEventListener("click", QLSP_closeEditModal);

function QLSP_closeEditModal() {
  document.getElementById("QLSP_modalSuaSP").style.display = "none";
}

// ==================== LỌC & TÌM KIẾM ====================
function QLSP_locTheoDanhMuc() {
  const danhMuc = document.getElementById("QLSP_locDanhMuc").value;
  if (danhMuc === "all") {
    QLSP_mangDaLoc = QLSP_productsLocal;
  } else {
    QLSP_mangDaLoc = QLSP_productsLocal.filter(
      (sp) => sp.catalog.toUpperCase() === danhMuc.toUpperCase()
    );
  }
  QLSP_currentPage = 1;
  QLSP_veBangSanPham(QLSP_mangDaLoc);
}

function QLSP_timTheoMa() {
  const input = document.getElementById("QLSP_timId");
  const searchValue = input.value.trim().toLowerCase();
  const selectedCatalog = document.getElementById("QLSP_locDanhMuc").value;
  const goiYBox = document.getElementById("QLSP_goiY");

  // Nếu người dùng xóa hết -> ẩn gợi ý
  if (!searchValue) {
    goiYBox.style.display = "none";
    return;
  }
  // Tìm theo id hoặc tên
  const goiY = QLSP_productsLocal.filter((sp) => {
    const matchId = sp.id.toLowerCase().includes(searchValue);
    const matchName = sp.name.toLowerCase().includes(searchValue);
    const matchCatalog =
      selectedCatalog === "all" ||
      sp.catalog.toUpperCase() === selectedCatalog.toUpperCase();
    return (matchId || matchName) && matchCatalog;
  });

  // Render danh sách gợi ý
  if (goiY.length > 0) {
    goiYBox.innerHTML = goiY
      .slice(0, 10) // giới hạn 10 kết quả
      .map(
        (sp) =>
          `<div data-id="${sp.id}">
             <strong>${sp.id}</strong> - ${sp.name}
           </div>`
      )
      .join("");
    goiYBox.style.display = "block";
  } else {
    goiYBox.innerHTML = `<div>Không tìm thấy sản phẩm</div>`;
    goiYBox.style.display = "block";
  }
  // Khi chọn 1 sản phẩm từ gợi ý
  goiYBox.querySelectorAll("div[data-id]").forEach((item) => {
    item.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      input.value = id;
      goiYBox.style.display = "none";
      QLSP_thucHienTimKiem(id);
    });
  });
  // Khi nhấn Enter vẽ lại bảng gốc (tương tự như "reset")
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      goiYBox.style.display = "none";
      input.value = "";
      QLSP_veBangSanPham(QLSP_productsLocal);
    }
  });
  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !goiYBox.contains(e.target)) {
      goiYBox.style.display = "none";
    }
  });
}

// Hàm thực hiện tìm kiếm thật sự và vẽ bảng
function QLSP_thucHienTimKiem(id) {
  QLSP_mangDaLoc = QLSP_productsLocal.filter(
    (sp) => sp.id.toLowerCase() === id.toLowerCase()
  );
  QLSP_currentPage = 1;
  QLSP_veBangSanPham(QLSP_mangDaLoc);
}
// ==================== ĐỒNG BỘ GIỮA CÁC TAB ====================
window.addEventListener("storage", (event) => {
  if (event.key === "productsLocal") {
    QLSP_productsLocal = getLocalProducts();
    QLSP_mangDaLoc = QLSP_productsLocal;
    QLSP_veBangSanPham(QLSP_mangDaLoc);
  }
});

// Load categories vào dropdown chọn danh mục
function loadCategoriesIntoDropdowns() {
  console.log("Loading categories into dropdowns...");
  try {
    // Load categories from localStorage
    const categoriesJson = localStorage.getItem("categories");
    if (!categoriesJson) {
      console.warn("No categories found in localStorage");
      return;
    }

    const categories = JSON.parse(categoriesJson);
    if (!Array.isArray(categories)) {
      console.error("Invalid categories data:", categories);
      return;
    }

    console.log("Loaded categories:", categories);

    const dropdowns = ["QLSP_locDanhMuc", "QLSP_spCatalog", "QLSP_editCatalog"];

    dropdowns.forEach((id) => {
      let select = document.getElementById(id);
      if (!select) {
        console.log(`Dropdown ${id} not found`);
        return;
      }

      // Lưu giá trị đang chọn
      const currentValue = select.value;
      console.log(`Current value for ${id}:`, currentValue);

      // Backup any existing event listeners
      const oldElement = select;
      const newElement = oldElement.cloneNode(false);
      const parent = oldElement.parentElement;
      if (parent) parent.replaceChild(newElement, oldElement);
      select = newElement;

      // Xóa các option cũ (trừ option "Tất cả" nếu có)
      const allOption = document.createElement("option");
      allOption.value = "all";
      allOption.textContent = "Tất cả";
      select.appendChild(allOption);

      // Lọc và thêm categories từ localStorage
      const activeCategories = categories.filter(
        (cat) => cat && cat.status === "active"
      );
      console.log("Active categories:", activeCategories);

      activeCategories.forEach((cat) => {
        if (!cat || !cat.name) return;
        const option = document.createElement("option");
        option.value = cat.name;
        option.textContent = cat.name;
        select.appendChild(option);
      });

      // Khôi phục giá trị đang chọn nếu vẫn còn tồn tại trong danh sách active
      const stillExists = activeCategories.some(
        (cat) => cat.name === currentValue
      );
      select.value = stillExists ? currentValue : "all";
      console.log(`Setting ${id} to:`, select.value);

      // Re-attach event listener for category filter dropdown
      if (id === "QLSP_locDanhMuc") {
        select.addEventListener("change", QLSP_locTheoDanhMuc);
      }
    });
  } catch (error) {
    console.error("Error loading categories into dropdowns:", error);
  }
}

// Load categories khi khởi tạo
document.addEventListener("DOMContentLoaded", loadCategoriesIntoDropdowns);

// Cập nhật khi categories thay đổi và reload sản phẩm
window.addEventListener("categoriesUpdated", function (event) {
  console.log("categoriesUpdated event received:", event);

  try {
    // Reload categories vào dropdowns
    loadCategoriesIntoDropdowns();

    // Lưu bộ lọc hiện tại
    const currentFilter = document.getElementById("QLSP_locDanhMuc").value;
    console.log("Current filter:", currentFilter);

    // Reload sản phẩm
    QLSP_productsLocal = getLocalProducts();

    // Áp dụng lọc nếu cần
    if (currentFilter && currentFilter !== "all") {
      QLSP_mangDaLoc = QLSP_productsLocal.filter(
        (sp) => (sp.catalog || "").toUpperCase() === currentFilter.toUpperCase()
      );
    } else {
      QLSP_mangDaLoc = [...QLSP_productsLocal];
    }

    // Reset về trang 1 và cập nhật UI
    QLSP_currentPage = 1;
    QLSP_veBangSanPham(QLSP_mangDaLoc);

    console.log("Product table updated after category change");
  } catch (error) {
    console.error("Error handling categoriesUpdated event:", error);
  }
});

// Nghe thay đổi localStorage từ tab khác
window.addEventListener("storage", function (event) {
  if (!event || !event.key) return;

  console.log("Storage event received:", event.key);

  if (event.key === "productsLocal") {
    console.log("Products changed in another tab");
    QLSP_productsLocal = getLocalProducts();
    QLSP_mangDaLoc = [...QLSP_productsLocal];
    QLSP_veBangSanPham(QLSP_mangDaLoc);
    window.dispatchEvent(new Event("productsUpdated"));
  }

  if (event.key === "categories") {
    console.log("Categories changed in another tab");
    try {
      // Reload categories into dropdowns
      loadCategoriesIntoDropdowns();

      // Preserve current filter if any
      const currentFilter = document.getElementById("QLSP_locDanhMuc").value;

      // Reload products
      QLSP_productsLocal = getLocalProducts();

      // Apply filter if needed
      if (currentFilter && currentFilter !== "all") {
        QLSP_mangDaLoc = QLSP_productsLocal.filter(
          (sp) =>
            (sp.catalog || "").toUpperCase() === currentFilter.toUpperCase()
        );
      } else {
        QLSP_mangDaLoc = [...QLSP_productsLocal];
      }

      // Reset to first page and update UI
      QLSP_currentPage = 1;
      QLSP_veBangSanPham(QLSP_mangDaLoc);

      console.log("Product table updated after category change");
    } catch (error) {
      console.error("Error handling category change:", error);
    }
  }
});
