// ========== QUẢN LÝ TỒN KHO ==========

const TK_esc = (value) => ShopCore.esc(value);

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
    // Dùng bản đã chuẩn hóa (có sizeStock) nếu module dữ liệu dùng chung đã nạp.
    if (typeof getLocalProducts === "function") return getLocalProducts();
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
let TK_mangDaLoc = []; // Mảng sau khi áp dụng TẤT CẢ bộ lọc

// Trạng thái bộ lọc duy nhất: mọi điều khiển (danh mục, size, tab trạng thái, tìm kiếm) đều ghi vào đây
const TK_boLoc = { danhMuc: "all", size: "", trangThai: "all", tuKhoa: "" };
// Chế độ lọc theo khoảng ngày (nhập/bán trong kỳ): null = tắt, hoặc { tu, den } (chuỗi yyyy-mm-dd)
let TK_locNgay = null;

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
    TK_capNhatLocDanhMuc();
    TK_capNhatLocSize();
    TK_ganSuKien();
    TK_apDungBoLoc(true);
  } catch (error) {
    console.error("Error initializing inventory management:", error);
    TK_productsLocal = [];
    TK_mangDaLoc = [];
    TK_veBangTonKho([]);
  }
});
function capNhatBang() {
  TK_apDungBoLoc(false);
}
// tự reload lại dữ liệu khi nghe thấy thay đổi: áp dụng lại bộ lọc HIỆN TẠI (không reset về tất cả)
window.addEventListener("productsUpdated", () => {
  TK_productsLocal = TK_getLocalProducts();
  TK_capNhatLocDanhMuc();
  TK_capNhatLocSize();
  TK_apDungBoLoc(false);
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

  // Giá trị tồn kho = giá nhập x số lượng tồn (tồn kho tính theo giá vốn)
  const thGiaTri = document.querySelector(".TK_admin-table thead th:last-child");
  if (thGiaTri) thGiaTri.title = "Giá nhập × số lượng tồn (tồn kho tính theo giá vốn)";
}
// --- Tồn kho theo size (chip: size + số lượng) ---
const TK_SIZE_LOW = 2; // size còn <= 2 đôi thì cảnh báo sắp hết
function TK_sizeCells(sp) {
  const stock = sp.tonKhoTheoSize && typeof sp.tonKhoTheoSize === "object" ? sp.tonKhoTheoSize : null;
  const sizes = stock ? Object.keys(stock).sort((a, b) => Number(a) - Number(b)) : [];
  if (!sizes.length) return `<span class="TK_size-none">Chưa chia theo size</span>`;
  const inStock = sizes.filter((size) => (Number(stock[size]) || 0) > 0).length;
  const chips = sizes
    .map((size) => {
      const qty = Number(stock[size]) || 0;
      const cls = qty === 0 ? "TK_size-out" : qty <= TK_SIZE_LOW ? "TK_size-low" : "TK_size-ok";
      const sizeEsc = TK_esc(size);
      return `<span class="TK_size-chip ${cls}" title="Size ${sizeEsc}: ${qty} đôi"><b>${sizeEsc}</b><i>${qty}</i></span>`;
    })
    .join("");
  return `<div class="TK_size-list">${chips}</div><div class="TK_size-meta">${sizes.length} size · còn hàng ${inStock}/${sizes.length}</div>`;
}

// Giá trị tồn kho theo giá vốn
function TK_giaTriTon(sp) {
  return (Number(sp.giaNhap) || 0) * (Number(sp.soLuongTon) || 0);
}

// --- Hàm render bảng ---
function TK_veBangTonKho(data) {
  const tbody = document.getElementById("TK_table-content");
  if (!tbody) {
    console.error("Table body element not found");
    return;
  }
  tbody.innerHTML = "";

  // Kẹp trang hiện tại vào khoảng hợp lệ
  const totalPages = Math.ceil(data.length / TK_itemsPerPage) || 1;
  if (TK_currentPage > totalPages) TK_currentPage = totalPages;
  if (TK_currentPage < 1) TK_currentPage = 1;

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
      tongSoLuong += Number(sp.soLuongTon) || 0;
      tongSoLuongNhap += Number(sp.tongDaNhap) || 0;
      tongDaBan += Number(sp.tongDaBan) || 0;
      tongGiaTri += TK_giaTriTon(sp);
    });
    const trTong = document.createElement("tr");
    trTong.classList.add("row-total");
    trTong.innerHTML = `
      <td><strong>Tổng</strong></td>
      <td colspan="3"></td>
      <td><strong>${tongSoLuong}</strong></td>
      <td></td>
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
    const soLuongTon = Number(sp.soLuongTon) || 0;
    const giaTriTon = TK_giaTriTon(sp);
    const hinhAnh = String(sp.hinhAnh || "");
    const imgSrc = hinhAnh.startsWith("http") || hinhAnh.startsWith("data:") ? hinhAnh : "../" + hinhAnh;

    // Trạng thái
    let statusClass = "TK_status-normal";
    let statusText = "Bình thường";
    if (soLuongTon === 0) {
      statusClass = "TK_status-out";
      statusText = "Hết hàng";
    } else if (soLuongTon < nguongSapHet) {
      statusClass = "TK_status-low";
      statusText = "Sắp hết hàng";
    } else {
      statusClass = "TK_status-normal";
      statusText = "Bình thường";
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${stt}</td>
      <td>${TK_esc(sp.maSanPham)}<br><span class="TK_status-tag ${statusClass}">${statusText}</span></td>
      <td><img src="${TK_esc(imgSrc)}" 
               onerror="this.onerror=null; this.src='../assets/img/no-image.png';" 
               alt="${TK_esc(sp.tenSanPham)}" style="width:50px;height:50px;border-radius:6px;object-fit:cover;"></td>
      <td>${TK_esc(sp.tenSanPham)}</td>
      <td><strong>${soLuongTon}</strong></td>
      <td class="TK_size-cell">${TK_sizeCells(sp)}</td>
      <td><strong>${Number(sp.tongDaNhap) || 0}</strong></td>
      <td><strong>${Number(sp.tongDaBan) || 0}</strong></td>
      <td>${(Number(sp.giaBan) || 0).toLocaleString()}₫</td>
      <td title="Giá nhập × tồn kho">${giaTriTon.toLocaleString()}₫</td>
    `;
    tbody.appendChild(tr);
  });

  // Cập nhật phân trang
  const pageInfo = document.getElementById("TK_pageInfo");
  const prevBtn = document.getElementById("TK_prevPage");
  const nextBtn = document.getElementById("TK_nextPage");

  if (pageInfo)
    pageInfo.textContent = `Trang ${TK_currentPage} / ${totalPages}`;
  if (prevBtn) prevBtn.disabled = TK_currentPage <= 1;
  if (nextBtn) nextBtn.disabled = TK_currentPage >= totalPages;
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

// ================== BỘ LỌC KẾT HỢP ==================
function toDateOnly(d) {
  const date = new Date(d);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Chế độ lọc theo ngày: số nhập/bán TRONG KỲ thay cho số tổng, chỉ giữ sản phẩm có phát sinh.
function TK_danhSachTheoKhoangNgay(tu, den) {
  const fromDate = tu ? toDateOnly(tu) : null;
  const toDate = den ? toDateOnly(den) : null;

  const phieuNhapLocal = ShopCore.readList("phieuNhapLocal");
  const donHangLocal = ShopCore.readList("DanhSachDatHang");

  const importMap = {};
  phieuNhapLocal.forEach((phieu) => {
    if (!phieu || phieu.trangThai !== "hoanThanh") return;
    const ngay = toDateOnly(phieu.ngayNhap);
    if ((!fromDate || ngay >= fromDate) && (!toDate || ngay <= toDate)) {
      (phieu.chiTiet || []).forEach((ct) => {
        importMap[ct.maSanPham] = (importMap[ct.maSanPham] || 0) + (Number(ct.soLuongNhap) || 0);
      });
    }
  });

  const saleMap = {};
  donHangLocal.forEach((don) => {
    if (!don) return;
    const ngay = toDateOnly(don.ngayDat);
    if (
      (!fromDate || ngay >= fromDate) &&
      (!toDate || ngay <= toDate) &&
      don.trangThai !== "da-huy" &&
      don.trangThaiQuanTri !== "huy"
    ) {
      (don.chiTiet || []).forEach((sp) => {
        saleMap[sp.maSanPham] = (saleMap[sp.maSanPham] || 0) + (Number(sp.soLuong) || 0);
      });
    }
  });

  return TK_productsLocal
    .map((sp) => ({ ...sp, tongDaNhap: importMap[sp.maSanPham] || 0, tongDaBan: saleMap[sp.maSanPham] || 0 }))
    .filter((sp) => sp.tongDaNhap > 0 || sp.tongDaBan > 0);
}

// Áp dụng TẤT CẢ bộ lọc trong TK_boLoc (+ chế độ ngày nếu đang bật) lên danh sách sản phẩm
function TK_layDanhSachDaLoc() {
  let ds = TK_locNgay ? TK_danhSachTheoKhoangNgay(TK_locNgay.tu, TK_locNgay.den) : TK_productsLocal;

  if (TK_boLoc.danhMuc !== "all") {
    const dm = TK_boLoc.danhMuc.toUpperCase();
    ds = ds.filter((sp) => String(sp.maLoai || "").toUpperCase() === dm);
  }
  if (TK_boLoc.size) {
    ds = ds.filter((sp) => (Number((sp.tonKhoTheoSize || {})[TK_boLoc.size]) || 0) > 0);
  }
  switch (TK_boLoc.trangThai) {
    case "sapHetHang":
      ds = ds.filter((sp) => (Number(sp.soLuongTon) || 0) > 0 && (Number(sp.soLuongTon) || 0) < nguongSapHet);
      break;
    case "hetHang":
      ds = ds.filter((sp) => (Number(sp.soLuongTon) || 0) === 0);
      break;
    case "binhThuong":
      ds = ds.filter((sp) => (Number(sp.soLuongTon) || 0) >= nguongSapHet);
      break;
    default:
      break;
  }
  if (TK_boLoc.tuKhoa) {
    const kw = TK_boLoc.tuKhoa;
    ds = ds.filter(
      (sp) =>
        String(sp.maSanPham || "").toLowerCase().includes(kw) ||
        String(sp.tenSanPham || "").toLowerCase().includes(kw)
    );
  }
  return ds;
}

function TK_apDungBoLoc(veTrang1) {
  if (veTrang1) TK_currentPage = 1;
  TK_mangDaLoc = TK_layDanhSachDaLoc();
  TK_veBangTonKho(TK_mangDaLoc);
}

// --- Các hàm lọc: chỉ cập nhật trạng thái rồi áp dụng lại toàn bộ ---
function TK_locTheoDanhMuc() {
  const selected = document.getElementById("TK_locDanhMuc").value;
  TK_boLoc.danhMuc = selected === "Danh mục" || !selected ? "all" : selected;
  TK_apDungBoLoc(true);
}

function TK_locTheoSize() {
  const select = document.getElementById("TK_locSize");
  TK_boLoc.size = select ? select.value : "";
  TK_apDungBoLoc(true);
}

function TK_locTheoTrangThai(type) {
  TK_boLoc.trangThai = type || "all";
  TK_apDungBoLoc(true);
}

function TK_locTheoTuKhoa(value) {
  TK_boLoc.tuKhoa = String(value || "").trim().toLowerCase();
  TK_apDungBoLoc(true);
}

// --- Dropdown danh mục: hiển thị SỐ SẢN PHẨM, dựng lại mỗi khi sản phẩm đổi ---
function TK_capNhatLocDanhMuc() {
  const select = document.getElementById("TK_locDanhMuc");
  if (!select) return;

  const demTheoLoai = new Map();
  TK_productsLocal.forEach((product) => {
    const catalog = product.maLoai;
    demTheoLoai.set(catalog, (demTheoLoai.get(catalog) || 0) + 1);
  });

  select.innerHTML = '<option value="all">Tất cả sản phẩm</option>';
  demTheoLoai.forEach((soSanPham, catalog) => {
    const option = document.createElement("option");
    option.value = catalog;
    option.textContent = `${catalog} (${soSanPham} sản phẩm)`;
    select.appendChild(option);
  });

  if (TK_boLoc.danhMuc !== "all" && demTheoLoai.has(TK_boLoc.danhMuc)) {
    select.value = TK_boLoc.danhMuc;
  } else {
    // Loại không còn sản phẩm nào => bỏ lọc loại này
    select.value = "all";
    TK_boLoc.danhMuc = "all";
  }
}

// --- Lọc theo size: chỉ hiện sản phẩm còn hàng ở size được chọn ---
function TK_capNhatLocSize() {
  const category = document.getElementById("TK_locDanhMuc");
  if (!category) return;
  let select = document.getElementById("TK_locSize");
  if (!select) {
    select = document.createElement("select");
    select.id = "TK_locSize";
    select.title = "Lọc sản phẩm còn hàng theo size";
    category.insertAdjacentElement("afterend", select);
    select.addEventListener("change", TK_locTheoSize);
  }
  const sizes = new Set();
  TK_productsLocal.forEach((sp) => Object.keys(sp.tonKhoTheoSize || {}).forEach((size) => sizes.add(size)));
  const sorted = Array.from(sizes).sort((a, b) => Number(a) - Number(b));
  select.innerHTML =
    `<option value="">Tất cả size</option>` +
    sorted.map((size) => `<option value="${TK_esc(size)}">Còn hàng size ${TK_esc(size)}</option>`).join("");
  select.value = sorted.includes(TK_boLoc.size) ? TK_boLoc.size : "";
  TK_boLoc.size = select.value;
}

// === TÌM KIẾM + GỢI Ý TRONG TỒN KHO ===
function TK_timTheoMa() {
  const input = document.getElementById("TK_timId");
  const searchValue = input.value.trim().toLowerCase();
  const goiYBox = document.getElementById("TK_goiY");

  // Ô tìm kiếm là một phần của bộ lọc kết hợp
  TK_locTheoTuKhoa(searchValue);

  // Nếu rỗng → ẩn gợi ý
  if (!searchValue) {
    goiYBox.style.display = "none";
    return;
  }
  // Tìm theo mã hoặc tên + lọc danh mục
  const selectedCatalog = TK_boLoc.danhMuc;
  const goiY = TK_productsLocal.filter((sp) => {
    const matchId = String(sp.maSanPham || "").toLowerCase().includes(searchValue);
    const matchName = String(sp.tenSanPham || "").toLowerCase().includes(searchValue);
    const matchCatalog =
      selectedCatalog === "all" ||
      String(sp.maLoai || "").toUpperCase() === selectedCatalog.toUpperCase();
    return (matchId || matchName) && matchCatalog;
  });
  // Hiển thị gợi ý
  if (goiY.length > 0) {
    goiYBox.innerHTML = goiY
      .slice(0, 10)
      .map(
        (sp) =>
          `<div data-id="${TK_esc(sp.maSanPham)}">
             <strong>${TK_esc(sp.maSanPham)}</strong> - ${TK_esc(sp.tenSanPham)}
           </div>`
      )
      .join("");
    goiYBox.style.display = "block";
  } else {
    goiYBox.innerHTML = `<div class="TK_goiY-empty">Không tìm thấy sản phẩm</div>`;
    goiYBox.style.display = "block";
  }
}
// === CHỌN GỢI Ý → lọc theo mã đó ===
function TK_thucHienTimKiem(id) {
  const input = document.getElementById("TK_timId");
  if (input) input.value = id;
  TK_locTheoTuKhoa(id);
}

// === LỌC THEO KHOẢNG NGÀY (chế độ riêng, KHÔNG xóa các bộ lọc khác) ===
function TK_locTheoNgay_DanhMuc_TuKhoa() {
  const from = document.getElementById("TK_filterDateFrom").value;
  const to = document.getElementById("TK_filterDateTo").value;
  TK_locNgay = from || to ? { tu: from, den: to } : null;
  TK_apDungBoLoc(true);
}

// --- Gán sự kiện (mỗi listener chỉ đăng ký 1 lần) ---
function TK_ganSuKien() {
  const prevBtn = document.getElementById("TK_prevPage");
  if (prevBtn) prevBtn.addEventListener("click", TK_prevPage);

  const nextBtn = document.getElementById("TK_nextPage");
  if (nextBtn) nextBtn.addEventListener("click", TK_nextPage);

  // Lọc danh mục
  const locDanhMucSelect = document.getElementById("TK_locDanhMuc");
  if (locDanhMucSelect) locDanhMucSelect.addEventListener("change", TK_locTheoDanhMuc);

  // Tìm kiếm (mã hoặc tên) - gõ tới đâu lọc tới đó, kết hợp với các bộ lọc khác
  const timInput = document.getElementById("TK_timId");
  const goiYBox = document.getElementById("TK_goiY");
  if (timInput) {
    timInput.addEventListener("input", TK_timTheoMa);
    // Enter: chỉ ẩn gợi ý, giữ nguyên nội dung tìm kiếm
    timInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (goiYBox) goiYBox.style.display = "none";
      }
    });
  }
  if (goiYBox) {
    goiYBox.addEventListener("click", (e) => {
      const item = e.target.closest("div[data-id]");
      if (!item) return;
      goiYBox.style.display = "none";
      TK_thucHienTimKiem(item.getAttribute("data-id"));
    });
  }
  // Click ngoài → ẩn gợi ý
  document.addEventListener("click", (e) => {
    if (timInput && goiYBox && !timInput.contains(e.target) && !goiYBox.contains(e.target)) {
      goiYBox.style.display = "none";
    }
  });

  // Tab trạng thái
  const statusButtons = document.querySelectorAll(".TK_tab-status button");
  statusButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      statusButtons.forEach((b) => b.classList.remove("TK_active"));
      this.classList.add("TK_active");
      TK_locTheoTrangThai(this.getAttribute("data-type"));
    });
  });

  // Nút lọc theo ngày
  const btnFilter = document.getElementById("TK_btnFilter");
  if (btnFilter) btnFilter.addEventListener("click", TK_locTheoNgay_DanhMuc_TuKhoa);
}

// Nghe thay đổi localStorage từ tab khác
window.addEventListener("storage", (event) => {
  if (event.key === "nguongSapHet") {
    nguongSapHet = layNguong();
    const input = document.getElementById("nguong-input");
    if (input) input.value = nguongSapHet;
    capNhatBang();
  }
  if (event.key === "productsLocal") {
    window.dispatchEvent(new Event("productsUpdated"));
  }
});
