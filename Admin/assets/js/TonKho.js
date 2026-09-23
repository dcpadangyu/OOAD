// ========== QUẢN LÝ TỒN KHO ==========

// === BIẾN NGƯỠNG ===
let nguongSapHet = 10;
// === LẤY & LƯU NGƯỠNG ===
function layNguong() {
  const saved = localStorage.getItem("nguongSapHet");
  return saved ? parseInt(saved) : 10;
}
function luuNguong(value) {
  localStorage.setItem("nguongSapHet", value);
  nguongSapHet = value;
  capNhatBang();
}

// --- Hàm lấy dữ liệu từ localStorage ---
function TK_getLocalProducts() {
  try {
    const data = localStorage.getItem("productsLocal");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting products from localStorage:", error);
    return [];
  }
}

// --- Cấu hình ---
const TK_itemsPerPage = 10;
let TK_currentPage = 1;
let TK_productsLocal = []; // Dữ liệu từ localStorage
let TK_mangDaLoc = []; // Mảng tạm sau khi lọc
document.addEventListener("DOMContentLoaded", function () {
  try {
    //Ngưỡng sắp hết hàng
    nguongSapHet = layNguong();
    const input = document.getElementById("nguong-input");
    if (input) {
      input.value = nguongSapHet;
      input.addEventListener("change", function () {
        let v = parseInt(this.value);
        if (isNaN(v) || v < 1) v = 1;
        if (v > 1000) v = 1000;
        this.value = v;
        luuNguong(v);
      });
    }

    TK_khoiTaoTrang();
    TK_productsLocal = TK_getLocalProducts() || [];
    TK_mangDaLoc = TK_productsLocal;
    TK_ganSuKien();
    TK_veBangTonKho(TK_mangDaLoc);
  } catch (error) {
    console.error("Error initializing inventory management:", error);
    TK_productsLocal = [];
    TK_mangDaLoc = [];
    TK_veBangTonKho([]);
  }
});
function capNhatBang() {
  TK_veBangTonKho(TK_mangDaLoc);
}
// tự reaload lại dữ liệu khi nghe thấy thay đổi
window.addEventListener("productsUpdated", () => {
  TK_productsLocal = TK_getLocalProducts();
  TK_mangDaLoc = TK_productsLocal;
  TK_veBangTonKho(TK_mangDaLoc);
});

// ======== HÀM KHỞI TẠO =========
function TK_khoiTaoTrang() {
  console.log("Inventory Management initialized");

  // Kiểm tra và khởi tạo products nếu chưa có trong localStorage
  if (!localStorage.getItem("productsLocal")) {
    console.log("Initializing products in localStorage...");
    localStorage.setItem("productsLocal", JSON.stringify([]));
  }

  // Cập nhật thông tin admin
  if (typeof adminSession !== "undefined" && adminSession.isLoggedIn()) {
    const adminInfo = adminSession.getCurrentAdmin();
    if (adminInfo && adminInfo.username) {
      const adminNameElement = document.getElementById("adminName");
      if (adminNameElement) {
        adminNameElement.textContent = adminInfo.username;
      }
    }
  }
}
// --- Hàm render bảng ---
function TK_veBangTonKho(data) {
  const tbody = document.getElementById("TK_table-content");
  if (!tbody) {
    console.error("Table body element not found");
    return;
  }
  tbody.innerHTML = "";

  const start = (TK_currentPage - 1) * TK_itemsPerPage;
  const end = start + TK_itemsPerPage;
  const pageData = data.slice(start, end);

  // Dòng tổng (chỉ hiện ở trang đầu)
  if (TK_currentPage === 1 && data.length > 0) {
    let tongSoLuong = 0;
    let tongSoLuongNhap = 0;
    let tongDaBan = 0;
    let tongGiaTri = 0;
    data.forEach((sp) => {
      tongSoLuong += sp.quantity;
      tongSoLuongNhap += sp.importQuantity || 0;
      tongDaBan += sp.soldQuantity || 0;
      tongGiaTri += sp.priceValue * sp.quantity;
    });
    const trTong = document.createElement("tr");
    trTong.classList.add("row-total");
    trTong.innerHTML = `
      <td><strong>Tổng</strong></td>
      <td colspan="3"></td>
      <td><strong>${tongSoLuong}</strong></td>
      <td><strong>${tongSoLuongNhap}</strong></td>
      <td><strong>${tongDaBan}</strong></td>
      <td></td>
      <td><strong>${tongGiaTri.toLocaleString()}₫</strong></td>
    `;
    tbody.appendChild(trTong);
  }

  // Dòng sản phẩm
  pageData.forEach((sp, index) => {
    const stt = start + index + 1;
    const giaTriTon = sp.priceValue * sp.quantity;

    // Trạng thái
    let statusClass = "TK_status-normal";
    let statusText = "Bình thường";
    if (sp.quantity === 0) {
      statusClass = "TK_status-out";
      statusText = "Hết hàng";
    } else if (sp.quantity < nguongSapHet) {
      statusClass = "TK_status-low";
      statusText = "Sắp hết hàng";
    } else {
      statusClass = "TK_status-normal";
      statusText = "Bình thường";
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${stt}</td>
      <td>${
        sp.id
      }<br><span class="TK_status-tag ${statusClass}">${statusText}</span></td>
      <td><img src="${
        sp.image.startsWith("http") || sp.image.startsWith("data:") ? sp.image : "../" + sp.image
      }" 
               onerror="this.onerror=null; this.src='../assets/img/no-image.png';" 
               alt="${
                 sp.name
               }" style="width:50px;height:50px;border-radius:6px;object-fit:cover;"></td>
      <td>${sp.name}</td>
      <td>${sp.quantity}</td>
      <td><strong>${sp.importQuantity || 0}</strong></td>
      <td><strong>${sp.soldQuantity || 0}</strong></td>
      <td>${sp.priceValue.toLocaleString()}₫</td>
      <td>${giaTriTon.toLocaleString()}₫</td>
    `;
    tbody.appendChild(tr);
  });

  // Cập nhật phân trang
  const totalPages = Math.ceil(data.length / TK_itemsPerPage) || 1;
  const pageInfo = document.getElementById("TK_pageInfo");
  const prevBtn = document.getElementById("TK_prevPage");
  const nextBtn = document.getElementById("TK_nextPage");

  if (pageInfo)
    pageInfo.textContent = `Trang ${TK_currentPage} / ${totalPages}`;
  if (prevBtn) prevBtn.disabled = TK_currentPage === 1;
  if (nextBtn) nextBtn.disabled = TK_currentPage === totalPages;
}

// --- Chuyển trang ---
function TK_nextPage() {
  const totalPages = Math.ceil(TK_mangDaLoc.length / TK_itemsPerPage);
  if (TK_currentPage < totalPages) {
    TK_currentPage++;
    TK_veBangTonKho(TK_mangDaLoc);
  }
}

function TK_prevPage() {
  if (TK_currentPage > 1) {
    TK_currentPage--;
    TK_veBangTonKho(TK_mangDaLoc);
  }
}

// --- Gán sự kiện ---
function TK_ganSuKien() {
  // Previous page button
  const prevBtn = document.getElementById("TK_prevPage");
  if (prevBtn) {
    prevBtn.addEventListener("click", TK_prevPage);
  }

  // Next page button
  const nextBtn = document.getElementById("TK_nextPage");
  if (nextBtn) {
    nextBtn.addEventListener("click", TK_nextPage);
  }

  // Lọc danh mục
  const locDanhMucSelect = document.getElementById("TK_locDanhMuc");
  if (locDanhMucSelect) {
    // Xóa tất cả options cũ
    locDanhMucSelect.innerHTML = '<option value="all">Tất cả sản phẩm</option>';

    // Tạo map để đếm số lượng theo danh mục
    const categoryCount = new Map();
    TK_productsLocal.forEach((product) => {
      const catalog = product.catalog;
      const count = categoryCount.get(catalog) || 0;
      categoryCount.set(catalog, count + product.quantity);
    });

    // Thêm options mới với số lượng tồn kho
    categoryCount.forEach((quantity, catalog) => {
      const option = document.createElement("option");
      option.value = catalog;
      option.textContent = `${catalog} (${quantity} sản phẩm)`;
      locDanhMucSelect.appendChild(option);
    });

    locDanhMucSelect.addEventListener("change", TK_locTheoDanhMuc);
  }

  // Tìm kiếm theo mã khi nhấn Enter
  const timInput = document.querySelector(".TK_boLoc input[type='text']");
  if (timInput) {
    timInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        TK_timTheoMa();
        this.value = ""; // reset sau khi tìm
      }
    });
  }

  // Tab trạng thái
  const statusButtons = document.querySelectorAll(".TK_tab-status button");
  if (statusButtons.length > 0) {
    statusButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        statusButtons.forEach((b) => b.classList.remove("TK_active"));
        this.classList.add("TK_active");
        TK_locTheoTrangThai(this.getAttribute("data-type"));
      });
    });
  }
}

// --- Lọc theo danh mục ---
function TK_locTheoDanhMuc() {
  const selected = document.getElementById("TK_locDanhMuc").value;
  if (selected === "all" || selected === "Danh mục") {
    TK_mangDaLoc = TK_productsLocal;
  } else {
    TK_mangDaLoc = TK_productsLocal.filter(
      (sp) => sp.catalog.toUpperCase() === selected.toUpperCase()
    );
  }
  TK_currentPage = 1;
  TK_veBangTonKho(TK_mangDaLoc);
}

// --- Lọc theo trạng thái ---
function TK_locTheoTrangThai(type) {
  switch (type) {
    case "sapHetHang":
      TK_mangDaLoc = TK_productsLocal.filter(
        (sp) => sp.quantity > 0 && sp.quantity < nguongSapHet
      );
      break;
    case "hetHang":
      TK_mangDaLoc = TK_productsLocal.filter((sp) => sp.quantity === 0);
      break;
    case "binhThuong":
      TK_mangDaLoc = TK_productsLocal.filter((sp) => sp.quantity >= nguongSapHet);
      break;
    default:
      TK_mangDaLoc = TK_productsLocal;
  }
  TK_currentPage = 1;
  TK_veBangTonKho(TK_mangDaLoc);
}

// === TÌM KIẾM + GỢI Ý TRONG TỒN KHO ===
function TK_timTheoMa() {
  const input = document.getElementById("TK_timId");
  const searchValue = input.value.trim().toLowerCase();
  const selectedCatalog = document.getElementById("TK_locDanhMuc").value;
  const goiYBox = document.getElementById("TK_goiY");
  // Nếu rỗng → ẩn
  if (!searchValue) {
    goiYBox.style.display = "none";
    return;
  }
  // Tìm theo mã hoặc tên + lọc danh mục
  const goiY = TK_productsLocal.filter((sp) => {
    const matchId = sp.id.toLowerCase().includes(searchValue);
    const matchName = sp.name.toLowerCase().includes(searchValue);
    const matchCatalog =
      selectedCatalog === "all" ||
      sp.catalog.toUpperCase() === selectedCatalog.toUpperCase();
    return (matchId || matchName) && matchCatalog;
  });
  // Hiển thị gợi ý
  if (goiY.length > 0) {
    goiYBox.innerHTML = goiY
      .slice(0, 10)
      .map(
        (sp) =>
          `<div data-id="${sp.id}">
             <strong>${sp.id}</strong> - ${sp.name}
           </div>`
      )
      .join("");
    goiYBox.style.display = "block";
  } else {
    goiYBox.innerHTML = `<div class="TK_goiY-empty">Không tìm thấy sản phẩm</div>`;
    goiYBox.style.display = "block";
  }
  // Click vào gợi ý → tìm chính xác
  goiYBox.querySelectorAll("div[data-id]").forEach((item) => {
    item.onclick = function () {
      const id = this.getAttribute("data-id");
      input.value = id;
      goiYBox.style.display = "none";
      TK_thucHienTimKiem(id);
    };
  });
}
// === TÌM CHÍNH XÁC THEO ID ===
function TK_thucHienTimKiem(id) {
  TK_mangDaLoc = TK_productsLocal.filter(
    (sp) => sp.id.toLowerCase() === id.toLowerCase()
  );
  TK_currentPage = 1;
  TK_veBangTonKho(TK_mangDaLoc);
}
// === GỌI KHI GÕ ===
document.getElementById("TK_timId")?.addEventListener("input", TK_timTheoMa);
// === NHẤN ENTER → RESET BẢNG ===
document.getElementById("TK_timId")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    document.getElementById("TK_goiY").style.display = "none";
    document.getElementById("TK_timId").value = "";
    TK_mangDaLoc = TK_productsLocal;
    TK_currentPage = 1;
    TK_veBangTonKho(TK_mangDaLoc);
  }
});
// === CLICK NGOÀI → ẨN GỢI Ý ===
document.addEventListener("click", (e) => {
  const input = document.getElementById("TK_timId");
  const goiY = document.getElementById("TK_goiY");
  if (input && goiY && !input.contains(e.target) && !goiY.contains(e.target)) {
    goiY.style.display = "none";
  }
});
// Nghe thay đổi localStorage từ tab khác
window.addEventListener("storage", (event) => {
  if (e.key === "nguongSapHet") {
    nguongSapHet = layNguong();
    const input = document.getElementById("nguong-input");
    if (input) input.value = nguongSapHet;
    capNhatBang();
  }
  if (event.key === "productsLocal") {
    window.dispatchEvent(new Event("productsUpdated"));
  }
});

function toDateOnly(d) {
  const date = new Date(d);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function TK_locTheoNgay_DanhMuc_TuKhoa() {
  const from = document.getElementById("TK_filterDateFrom").value;
  const to = document.getElementById("TK_filterDateTo").value;
  if (from == null && to == null) return;
  const keyword = document
    .getElementById("TK_timId")
    .value.trim()
    .toLowerCase();
  const catalog = document.getElementById("TK_locDanhMuc").value;

  const fromDate = from ? toDateOnly(new Date(from)) : null;
  const toDate = to ? toDateOnly(new Date(to)) : null;

  const phieuNhapLocal =
    JSON.parse(localStorage.getItem("phieuNhapLocal")) || [];
  const donHangLocal =
    JSON.parse(localStorage.getItem("DanhSachDatHang")) || [];
  const productsLocal = TK_getLocalProducts();

  const importMap = {};
  phieuNhapLocal.forEach((phieu) => {
    const ngay = toDateOnly(new Date(phieu.ngayNhap));
    if (
      (!fromDate || ngay >= fromDate) &&
      (!toDate || ngay <= toDate) &&
      phieu.trangThai === "hoanThanh"
    ) {
      phieu.chiTiet.forEach((ct) => {
        importMap[ct.maSanPham] =
          (importMap[ct.maSanPham] || 0) + ct.soLuongNhap;
      });
    }
  });

  const saleMap = {};
  donHangLocal.forEach((don) => {
    const ngay = toDateOnly(don.orderDate);
    if (
      (!fromDate || ngay >= fromDate) &&
      (!toDate || ngay <= toDate) &&
      don.trangthai !== "huy"
    ) {
      don.product.forEach((sp) => {
        saleMap[sp.id] = (saleMap[sp.id] || 0) + sp.quantity;
      });
    }
  });

  // Map sản phẩm + lọc chỉ lấy sản phẩm có nhập hoặc bán
  const danhSach = productsLocal
    .map((sp) => {
      const imported = importMap[sp.id] || 0;
      const sold = saleMap[sp.id] || 0;
      return { ...sp, importQuantity: imported, soldQuantity: sold };
    })
    .filter((sp) => sp.importQuantity > 0 || sp.soldQuantity > 0) // chỉ lấy sản phẩm có dữ liệu
    .filter((sp) => {
      const matchID = !keyword || sp.id.toLowerCase().includes(keyword);
      const matchCatalog =
        catalog === "all" || sp.catalog.toUpperCase() === catalog.toUpperCase();
      return matchID && matchCatalog;
    });

  TK_mangDaLoc = danhSach;
  TK_currentPage = 1;
  TK_veBangTonKho(TK_mangDaLoc);

  // Reset filter (nếu muốn)
  document.getElementById("TK_filterDateFrom").value = "";
  document.getElementById("TK_filterDateTo").value = "";
  document.getElementById("TK_timId").value = "";
  document.getElementById("TK_locDanhMuc").value = "all";
}

document
  .getElementById("TK_btnFilter")
  .addEventListener("click", TK_locTheoNgay_DanhMuc_TuKhoa);
