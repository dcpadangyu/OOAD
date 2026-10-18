// ==================== CẤU HÌNH BAN ĐẦU ====================
const QLSP_itemsPerPage = 10;
let QLSP_currentPage = 1;
let QLSP_productsLocal = [];
let QLSP_mangDaLoc = [];
let QLSP_maDangTim = ""; // mã sản phẩm đang được lọc chính xác (chọn từ gợi ý tìm kiếm)
let QLSP_daKhoiTao = false;

const QLSP_esc = (value) => ShopCore.esc(value);

function QLSP_totalSizeStock(stock) {
  return stock ? Object.values(stock).reduce((total, quantity) => total + (Number(quantity) || 0), 0) : null;
}

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
    QLSP_ganSuKien();

    // Cập nhật bộ lọc danh mục (gọi 1 lần ở đây)
    loadCategoriesIntoDropdowns();
    QLSP_daKhoiTao = true;
    QLSP_veLai();
    console.log("Khởi tạo trang thành công");
  } catch (error) {
    console.error("Lỗi khi khởi tạo trang:", error);
  }
});

// tự reload lại dữ liệu khi nghe thấy thay đổi (giữ nguyên bộ lọc hiện tại)
window.addEventListener("productsUpdated", () => {
  QLSP_productsLocal = getLocalProducts();
  if (QLSP_daKhoiTao) QLSP_veLai();
  else QLSP_mangDaLoc = QLSP_productsLocal;
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
  } catch (error) {
    console.error("Error initializing product management:", error);
  }
});

// ======== HÀM XỬ LÍ SỰ KIỆN (mỗi listener chỉ đăng ký 1 lần) =========
function QLSP_ganSuKien() {
  document
    .getElementById("QLSP_locDanhMuc")
    .addEventListener("change", QLSP_locTheoDanhMuc);

  const input = document.getElementById("QLSP_timId");
  const goiYBox = document.getElementById("QLSP_goiY");
  input.addEventListener("input", QLSP_timTheoMa);

  // Enter trong ô tìm kiếm: chỉ ẩn gợi ý (không xóa ô, không chặn Enter ở nơi khác)
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && goiYBox) goiYBox.style.display = "none";
  });

  if (goiYBox) {
    // Chọn 1 sản phẩm từ gợi ý (delegation: gợi ý được vẽ lại mỗi lần gõ)
    goiYBox.addEventListener("click", (e) => {
      const item = e.target.closest("div[data-id]");
      if (!item) return;
      const id = item.getAttribute("data-id");
      input.value = id;
      goiYBox.style.display = "none";
      QLSP_thucHienTimKiem(id);
    });
  }

  // Click ra ngoài ô tìm kiếm / hộp gợi ý => ẩn gợi ý
  document.addEventListener("click", (e) => {
    if (goiYBox && !input.contains(e.target) && !goiYBox.contains(e.target)) {
      goiYBox.style.display = "none";
    }
  });

  // ================== XỬ LÝ CLICK ẨN / HIỆN ==================
  document.addEventListener("click", function (e) {
    const tick = e.target.closest && e.target.closest(".QLSP_tick-visible, .QLSP_tick-hidden");
    if (!tick) return;
    const productId = tick.getAttribute("data-id");
    const products = getLocalProducts();

    const index = products.findIndex((p) => p.maSanPham === productId);
    if (index === -1) return;
    // Quy tắc giống cửa hàng: khác "hidden" = đang hiển thị
    products[index].trangThaiHienThi =
      products[index].trangThaiHienThi !== "hidden" ? "hidden" : "visible";
    if (!saveLocalProducts(products)) {
      QLSP_veLai(); // dữ liệu không đổi -> vẽ lại theo dữ liệu thật
      return;
    }
    QLSP_productsLocal = getLocalProducts();
    QLSP_veLai();
  });

  // ================== SỬA & XÓA (nút trong bảng) ==================
  document.addEventListener("click", function (e) {
    const nutSua = e.target.closest && e.target.closest(".QLSP_btn-sua");
    if (nutSua) {
      const id = nutSua.getAttribute("data-id");
      const product = QLSP_productsLocal.find((p) => p.maSanPham === id);
      if (product) QLSP_openEditModal(product);
      return;
    }

    const nutXoa = e.target.closest && e.target.closest(".QLSP_btn-xoa");
    if (nutXoa) QLSP_xoaSanPham(nutXoa.getAttribute("data-id"));
  });

  // Đồng bộ khi dữ liệu loại sản phẩm đổi (cùng tab hoặc tab khác)
  window.addEventListener("categoriesUpdated", QLSP_khiLoaiThayDoi);
  window.addEventListener("storage", (event) => {
    if (!event || !event.key) return;
    if (event.key === "productsLocal") {
      QLSP_productsLocal = getLocalProducts();
      QLSP_veLai();
    }
    if (event.key === "categories") QLSP_khiLoaiThayDoi();
  });
}

function QLSP_khiLoaiThayDoi() {
  try {
    loadCategoriesIntoDropdowns();
    QLSP_productsLocal = getLocalProducts();
    QLSP_veLai();
  } catch (error) {
    console.error("Error handling categories change:", error);
  }
}

// ======== LỌC / VẼ LẠI THEO TRẠNG THÁI HIỆN TẠI =========
function QLSP_layDanhSachDaLoc() {
  const select = document.getElementById("QLSP_locDanhMuc");
  const danhMuc = select ? select.value : "all";
  let ds = QLSP_productsLocal;
  if (danhMuc !== "all") {
    ds = ds.filter((sp) => String(sp.maLoai || "").toUpperCase() === danhMuc.toUpperCase());
  }
  if (QLSP_maDangTim) {
    const ma = QLSP_maDangTim.toLowerCase();
    ds = ds.filter((sp) => sp.maSanPham.toLowerCase() === ma);
  }
  return ds;
}

// Vẽ lại bảng theo bộ lọc hiện tại; giữ trang (được kẹp lại trong QLSP_veBangSanPham)
function QLSP_veLai() {
  QLSP_mangDaLoc = QLSP_layDanhSachDaLoc();
  QLSP_veBangSanPham(QLSP_mangDaLoc);
}

// Lý do một sản phẩm đang "hiển thị" nhưng vẫn không xuất hiện trên cửa hàng
function QLSP_lyDoChuaLenCuaHang(sp, tapLoaiAn) {
  if (sp.trangThaiHienThi === "hidden") return [];
  const lyDo = [];
  if (!(Number(sp.giaBan) > 0)) lyDo.push("chưa có giá bán");
  if (!(Number(sp.soLuongTon) > 0)) lyDo.push("hết hàng (tồn kho 0)");
  if (tapLoaiAn.has(String(sp.maLoai || "").toLowerCase())) lyDo.push("loại sản phẩm đang bị ẩn");
  return lyDo;
}

function QLSP_layTapLoaiAn() {
  const tap = new Set();
  ShopCore.readList("categories").forEach((cat) => {
    if (cat && cat.trangThai === "hidden") {
      if (cat.maLoai) tap.add(String(cat.maLoai).toLowerCase());
      if (cat.tenLoai) tap.add(String(cat.tenLoai).toLowerCase());
    }
  });
  return tap;
}

// ======== HÀM TẠO BẢNG SẢN PHẨM =========
function QLSP_veBangSanPham(dsSP) {
  const tableContent = document.querySelector(".QLSP_table-content");
  if (!tableContent) {
    console.error("Không tìm thấy phần tử .QLSP_table-content");
    return;
  }

  tableContent.innerHTML = "";

  // Kẹp trang hiện tại vào khoảng hợp lệ (sau khi xóa/lọc)
  const totalPages = Math.max(1, Math.ceil(dsSP.length / QLSP_itemsPerPage));
  if (QLSP_currentPage > totalPages) QLSP_currentPage = totalPages;
  if (QLSP_currentPage < 1) QLSP_currentPage = 1;

  let table = document.createElement("table");
  table.classList.add("QLSP_admin-table");

  let tbody = document.createElement("tbody");

  const start = (QLSP_currentPage - 1) * QLSP_itemsPerPage;
  const end = start + QLSP_itemsPerPage;
  const productsToShow = dsSP.slice(start, end);
  const tapLoaiAn = QLSP_layTapLoaiAn();

  productsToShow.forEach((sp, index) => {
    const stt = start + index + 1;
    const hinhAnh = String(sp.hinhAnh || "");
    const isBase64 = hinhAnh.startsWith("data:");
    const imgSrc = (hinhAnh.startsWith("http") || isBase64) ? hinhAnh : `../${hinhAnh}`;
    const dangHienThi = sp.trangThaiHienThi !== "hidden";
    const tickClass = dangHienThi ? "QLSP_tick-visible" : "QLSP_tick-hidden";
    const tickSymbol = dangHienThi ? "✔" : "";
    const lyDo = QLSP_lyDoChuaLenCuaHang(sp, tapLoaiAn);
    const tickTitle = !dangHienThi
      ? "Đang ẩn khỏi cửa hàng (bấm để hiển thị)"
      : lyDo.length
        ? `Đang bật hiển thị nhưng CHƯA lên cửa hàng: ${lyDo.join(", ")}`
        : "Đang hiển thị trên cửa hàng (bấm để ẩn)";
    const tagCanhBao = lyDo.length
      ? `<small class="QLSP_tag-chua-len-shop" style="display:block;color:#b45309;font-size:12px;" title="${QLSP_esc(tickTitle)}">Chưa lên cửa hàng: ${QLSP_esc(lyDo.join(", "))}</small>`
      : "";
    const ma = QLSP_esc(sp.maSanPham);

    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${stt}</td>
      <td>${ma}</td>
      <td>${QLSP_esc(sp.tenSanPham)}${tagCanhBao}</td>
      <td>${QLSP_esc(sp.maLoai)}</td>
      <td>${QLSP_esc(sp.moTaNgan)}</td>
      <td><img src="${QLSP_esc(imgSrc)}" alt="${QLSP_esc(sp.tenSanPham)}" class="QLSP_img"></td>
      <td><div class="${tickClass}" data-id="${ma}" title="${QLSP_esc(tickTitle)}">${tickSymbol}</div></td>
      <td>
        <button class="QLSP_btn-sua" data-id="${ma}">Sửa</button>
        <button class="QLSP_btn-xoa" data-id="${ma}">Xóa</button>
      </td>`;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableContent.appendChild(table);

  // ======== CẬP NHẬT PHÂN TRANG =========
  document.getElementById(
    "QLSP_pageInfo"
  ).textContent = `Trang ${QLSP_currentPage} / ${totalPages}`;
  document.getElementById("QLSP_prevPage").disabled = QLSP_currentPage <= 1;
  document.getElementById("QLSP_nextPage").disabled =
    QLSP_currentPage >= totalPages;

  document.getElementById("QLSP_prevPage").onclick = () => QLSP_prevPage();
  document.getElementById("QLSP_nextPage").onclick = () => QLSP_nextPage();
}

function QLSP_nextPage() {
  const totalPages = Math.max(1, Math.ceil(QLSP_mangDaLoc.length / QLSP_itemsPerPage));
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

// Trình nhập size + tồn kho (thêm / sửa sản phẩm)
const QLSP_addSizeEditor = SizeEditor.create(document.getElementById("QLSP_spSizeEditor"));
const QLSP_editSizeEditor = SizeEditor.create(document.getElementById("QLSP_editSizeEditor"));

function QLSP_closeModal() {
  QLSP_modal.style.display = "none";
  QLSP_form.reset();
  QLSP_addSizeEditor.reset();
  QLSP_preview.innerHTML = "";
  delete QLSP_inputImage.dataset.imageData; // không để ảnh của lần trước dính sang lần thêm sau
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
  delete QLSP_inputImage.dataset.imageData; // chọn lại file => bỏ ảnh cũ
  if (file) {
    QLSP_compressImage(file, function(data) {
      // Bỏ qua nếu modal đã đóng/reset hoặc đã chọn file khác trong lúc nén ảnh
      if (QLSP_inputImage.files[0] !== file) return;
      QLSP_preview.innerHTML = `<img src="${QLSP_esc(data)}" alt="Ảnh sản phẩm" style="max-width:100%; max-height:200px;">`;
      // Lưu base64 vào biến tạm (dùng khi lưu sản phẩm)
      QLSP_inputImage.dataset.imageData = data;
    });
  }
});

// ================== THÊM SẢN PHẨM ==================
QLSP_form.addEventListener("submit", function (e) {
  e.preventDefault();
  let dsSanPham = getLocalProducts();
  const idInput = document.getElementById("QLSP_spId");
  const idValue = idInput.value.trim();

  if (dsSanPham.some((sp) => sp.maSanPham.toLowerCase() === idValue.toLowerCase())) {
    idInput.focus();
    alert("Mã sản phẩm đã tồn tại!");
    return;
  }

  let ktrGiaNhap = document.getElementById("QLSP_spImportPrice");
  let giaNhapValue = parseFloat(ktrGiaNhap.value);
  if (isNaN(giaNhapValue) || giaNhapValue <= 0) {
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

  const newSizeStock = QLSP_addSizeEditor.getStock();
  const tonBanDau = newSizeStock ? QLSP_totalSizeStock(newSizeStock) : 0;
  const spMoi = {
    maSanPham: idValue,
    maLoai: document.getElementById("QLSP_spCatalog").value,
    tenSanPham: document.getElementById("QLSP_spName").value.trim(),
    gioiTinh: document.getElementById("QLSP_spGender").value,
    moTaNgan: document.getElementById("QLSP_spDesc").value.trim(),
    mauSac: document.getElementById("QLSP_spColor").value,
    giaNhap: giaNhapValue,
    giaBan: 0,
    soLuongTon: 0,
    hinhAnh: imageData,
    giaHienThi: "0₫",
    trangThaiHienThi: "visible",
    kichCo: QLSP_addSizeEditor.getSizeText(),
    ...(newSizeStock ? { tonKhoTheoSize: newSizeStock, soLuongTon: tonBanDau } : {}),
    chatLieu: document.getElementById("QLSP_spMaterial").value.trim(),
    phongCach: document.getElementById("QLSP_spStyle").value.trim(),
    tongDaNhap: tonBanDau,
    tongDaBan: 0,
    moTa: document.getElementById("QLSP_spDescription").value.trim(),
    xuatXu: "Việt Nam",
  };

  dsSanPham.push(spMoi);
  if (!saveLocalProducts(dsSanPham)) return; // đã báo lỗi trong saveLocalProducts; giữ nguyên form
  QLSP_productsLocal = getLocalProducts();
  QLSP_closeModal();
  QLSP_veLai();
  alert("Thêm sản phẩm thành công!");
});

// ================== XÓA SẢN PHẨM ==================
// Gom các nơi đang dùng sản phẩm: đơn hàng (đang xử lý / đã xong) và phiếu nhập (chưa / đã hoàn thành)
function QLSP_kiemTraSuDungSanPham(maSanPham) {
  const dungMa = (ds) => Array.isArray(ds) && ds.some((ct) => ct && ct.maSanPham === maSanPham);
  const donHang = new Map();
  [ShopCore.readList("DanhSachDatHang"), ShopCore.readList("ordersLocal")].forEach((danhSach) => {
    danhSach.forEach((don) => {
      if (!don || !dungMa(don.chiTiet)) return;
      const khoa = don.maDonHang || "?";
      if (donHang.has(khoa)) return; // ưu tiên bản ghi đầu tiên (DanhSachDatHang)
      const trangThai = don.trangThaiQuanTri || ShopCore.USER_TO_ADMIN[don.trangThai] || "moiDat";
      donHang.set(khoa, trangThai);
    });
  });
  const donDangXuLy = [];
  const donDaXong = [];
  donHang.forEach((trangThai, ma) => {
    if (trangThai === "moiDat" || trangThai === "daXuLy") donDangXuLy.push(ma);
    else donDaXong.push(ma);
  });

  const phieuChua = [];
  const phieuXong = [];
  ShopCore.readList("phieuNhapLocal").forEach((phieu) => {
    if (!phieu || !dungMa(phieu.chiTiet)) return;
    if (phieu.trangThai === "chuaHoanThanh") phieuChua.push(phieu.maPhieuNhap);
    else phieuXong.push(phieu.maPhieuNhap);
  });
  return { donDangXuLy, donDaXong, phieuChua, phieuXong };
}

function QLSP_xoaSanPham(id) {
  const sp = QLSP_productsLocal.find((p) => p.maSanPham === id);
  if (!sp) return;
  const dung = QLSP_kiemTraSuDungSanPham(id);

  if (dung.donDangXuLy.length || dung.phieuChua.length) {
    const lyDo = [];
    if (dung.donDangXuLy.length) lyDo.push(`- Đang có trong đơn hàng chưa hoàn tất (mới đặt/đã xử lý): ${dung.donDangXuLy.join(", ")}`);
    if (dung.phieuChua.length) lyDo.push(`- Đang có trong phiếu nhập chưa hoàn thành: ${dung.phieuChua.join(", ")}`);
    alert(`Không thể xóa sản phẩm "${sp.tenSanPham}" (${id}) vì:\n${lyDo.join("\n")}\nHãy hoàn tất/hủy các đơn và phiếu này trước.`);
    return;
  }

  let thongBao = "Bạn có chắc muốn xóa sản phẩm này không?";
  if (dung.donDaXong.length || dung.phieuXong.length) {
    const lichSu = [];
    if (dung.donDaXong.length) lichSu.push(`${dung.donDaXong.length} đơn hàng đã xử lý xong`);
    if (dung.phieuXong.length) lichSu.push(`${dung.phieuXong.length} phiếu nhập đã hoàn thành`);
    thongBao = `Sản phẩm "${sp.tenSanPham}" (${id}) xuất hiện trong lịch sử: ${lichSu.join(", ")}.\nLịch sử vẫn giữ nguyên các dòng này. Bạn có chắc muốn xóa sản phẩm?`;
  }
  if (!confirm(thongBao)) return;

  const danhSachMoi = getLocalProducts().filter((p) => p.maSanPham !== id);
  if (!saveLocalProducts(danhSachMoi)) return;
  QLSP_productsLocal = getLocalProducts();
  QLSP_veLai();
  alert("Xóa sản phẩm thành công!");
}

// ================== BỔ SUNG LỰA CHỌN CHO FORM ==================
// Thêm các giá trị có trong dữ liệu sản phẩm (seed) nhưng chưa có trong ô chọn, tránh bị lưu thành rỗng khi sửa.
function QLSP_ensureOption(select, value) {
  if (!select || value === undefined || value === null || value === "") return;
  const exists = Array.from(select.options).some((option) => option.value === value);
  if (!exists) select.appendChild(new Option(value, value));
}
function QLSP_setSelectValue(id, value) {
  const select = document.getElementById(id);
  if (!select) return;
  QLSP_ensureOption(select, value);
  if (value !== undefined && value !== null && value !== "") select.value = value;
}
document.addEventListener("DOMContentLoaded", () => {
  const extras = {
    Color: ["Đỏ", "Be", "Xám"],
    Gender: ["Unisex"],
    Style: ["Thời trang"],
  };
  ["sp", "edit"].forEach((prefix) => {
    Object.entries(extras).forEach(([field, values]) => {
      const select = document.getElementById(`QLSP_${prefix}${field}`);
      values.forEach((value) => QLSP_ensureOption(select, value));
    });
  });
});

// ================== MODAL SỬA ==================
function QLSP_openEditModal(product) {
  const modal = document.getElementById("QLSP_modalSuaSP");
  modal.style.display = "flex";

  document.getElementById("QLSP_editId").value = product.maSanPham;
  QLSP_setSelectValue("QLSP_editCatalog", product.maLoai);
  document.getElementById("QLSP_editName").value = product.tenSanPham;
  QLSP_setSelectValue("QLSP_editGender", product.gioiTinh);
  document.getElementById("QLSP_editDesc").value = product.moTaNgan;
  QLSP_setSelectValue("QLSP_editColor", product.mauSac);
  document.getElementById("QLSP_editImportPrice").value = product.giaNhap;
  document.getElementById("QLSP_editVisibility").value = product.trangThaiHienThi === "hidden" ? "hidden" : "visible";
  document.getElementById("QLSP_editSize").value = product.kichCo || "";
  QLSP_editSizeEditor.setStock(product.tonKhoTheoSize);
  QLSP_setSelectValue("QLSP_editMaterial", product.chatLieu || "");
  QLSP_setSelectValue("QLSP_editStyle", product.phongCach || "");
  document.getElementById("QLSP_editDescription").value =
    product.moTa || "";

  // Hiển thị ảnh cũ
  const hinhAnh = String(product.hinhAnh || "");
  const previewSrc = /^(data:|https?:)/i.test(hinhAnh) ? hinhAnh : `../${hinhAnh}`;
  document.getElementById("QLSP_previewEditImg").src = previewSrc;
  
  // Lưu dữ liệu ảnh cũ vào file input
  const editImageInput = document.getElementById("QLSP_editImage");
  editImageInput.dataset.currentImage = product.hinhAnh;
  delete editImageInput.dataset.imageData; // không dùng lại ảnh mới của sản phẩm khác
  editImageInput.value = ""; // Reset input file
}

// ========== XỬ LÝ UPLOAD ẢNH (SỬA) ==========
document
  .getElementById("QLSP_editImage")
  .addEventListener("change", function() {
    const file = this.files[0];
    delete this.dataset.imageData;
    if (file) {
      const input = this;
      QLSP_compressImage(file, function(data) {
        if (input.files[0] !== file) return; // đã đóng modal / chọn file khác
        document.getElementById("QLSP_previewEditImg").src = data;
        // Lưu base64 vào data attribute
        input.dataset.imageData = data;
      });
    }
  });

document
  .getElementById("QLSP_btnUpdateSP")
  .addEventListener("click", function () {
    const id = document.getElementById("QLSP_editId").value.trim();
    let dsSanPham = getLocalProducts();
    const index = dsSanPham.findIndex((sp) => sp.maSanPham === id);
    if (index === -1) {
      alert("Không tìm thấy sản phẩm cần sửa!");
      return;
    }
    let ktrGiaSua = document.getElementById("QLSP_editImportPrice");
    let giaSuaValue = parseFloat(ktrGiaSua.value);
    if (isNaN(giaSuaValue) || giaSuaValue <= 0) {
      alert("Giá nhập phải lớn hơn 0!");
      ktrGiaSua.focus();
      return;
    }

    // Lấy ảnh mới (nếu user chọn file) hoặc ảnh cũ (nếu user không chọn file)
    const editImageInput = document.getElementById("QLSP_editImage");
    let imageData = editImageInput.dataset.imageData || dsSanPham[index].hinhAnh;

    const editedSizeStock = QLSP_editSizeEditor.getStock();
    const hadSizes = !!(dsSanPham[index].tonKhoTheoSize && Object.keys(dsSanPham[index].tonKhoTheoSize).length);
    if (!editedSizeStock && hadSizes && !confirm("Sản phẩm sẽ không còn size nào và tồn kho về 0. Tiếp tục?")) {
      return;
    }
    dsSanPham[index] = {
      ...dsSanPham[index],
      maLoai: document.getElementById("QLSP_editCatalog").value,
      tenSanPham: document.getElementById("QLSP_editName").value.trim(),
      gioiTinh: document.getElementById("QLSP_editGender").value,
      moTaNgan: document.getElementById("QLSP_editDesc").value.trim(),
      mauSac: document.getElementById("QLSP_editColor").value,
      giaNhap: giaSuaValue,
      trangThaiHienThi: document.getElementById("QLSP_editVisibility").value,
      kichCo: QLSP_editSizeEditor.getSizeText(),
      ...(editedSizeStock ? { tonKhoTheoSize: editedSizeStock, soLuongTon: QLSP_totalSizeStock(editedSizeStock) } : {}),
      chatLieu: document.getElementById("QLSP_editMaterial").value.trim(),
      phongCach: document.getElementById("QLSP_editStyle").value.trim(),
      moTa: document.getElementById("QLSP_editDescription").value.trim(),
      hinhAnh: imageData,
    };

    if (!editedSizeStock && hadSizes) {
      delete dsSanPham[index].tonKhoTheoSize;
      dsSanPham[index].soLuongTon = 0;
    }

    if (!saveLocalProducts(dsSanPham)) return; // giữ modal để người dùng xử lý
    QLSP_productsLocal = getLocalProducts();
    QLSP_closeEditModal();
    QLSP_veLai();
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
  const editImageInput = document.getElementById("QLSP_editImage");
  if (editImageInput) {
    delete editImageInput.dataset.imageData;
    editImageInput.value = "";
  }
}

// ==================== LỌC & TÌM KIẾM ====================
function QLSP_locTheoDanhMuc() {
  // Đổi danh mục => bỏ lọc theo 1 mã cụ thể
  QLSP_maDangTim = "";
  const inputTim = document.getElementById("QLSP_timId");
  if (inputTim) inputTim.value = "";
  QLSP_currentPage = 1;
  QLSP_veLai();
}

// Gợi ý khi gõ (listener được đăng ký 1 lần trong QLSP_ganSuKien)
function QLSP_timTheoMa() {
  const input = document.getElementById("QLSP_timId");
  const searchValue = input.value.trim().toLowerCase();
  const selectedCatalog = document.getElementById("QLSP_locDanhMuc").value;
  const goiYBox = document.getElementById("QLSP_goiY");

  // Nếu người dùng xóa hết -> ẩn gợi ý, bỏ lọc theo mã
  if (!searchValue) {
    goiYBox.style.display = "none";
    if (QLSP_maDangTim) {
      QLSP_maDangTim = "";
      QLSP_currentPage = 1;
      QLSP_veLai();
    }
    return;
  }
  // Tìm theo id hoặc tên
  const goiY = QLSP_productsLocal.filter((sp) => {
    const matchId = sp.maSanPham.toLowerCase().includes(searchValue);
    const matchName = sp.tenSanPham.toLowerCase().includes(searchValue);
    const matchCatalog =
      selectedCatalog === "all" ||
      String(sp.maLoai || "").toUpperCase() === selectedCatalog.toUpperCase();
    return (matchId || matchName) && matchCatalog;
  });

  // Render danh sách gợi ý
  if (goiY.length > 0) {
    goiYBox.innerHTML = goiY
      .slice(0, 10) // giới hạn 10 kết quả
      .map(
        (sp) =>
          `<div data-id="${QLSP_esc(sp.maSanPham)}">
             <strong>${QLSP_esc(sp.maSanPham)}</strong> - ${QLSP_esc(sp.tenSanPham)}
           </div>`
      )
      .join("");
    goiYBox.style.display = "block";
  } else {
    goiYBox.innerHTML = `<div>Không tìm thấy sản phẩm</div>`;
    goiYBox.style.display = "block";
  }
}

// Hàm thực hiện tìm kiếm thật sự và vẽ bảng
function QLSP_thucHienTimKiem(id) {
  QLSP_maDangTim = id;
  QLSP_currentPage = 1;
  QLSP_veLai();
}

// Load categories vào dropdown chọn danh mục (xây lại option tại chỗ để giữ nguyên listener)
function loadCategoriesIntoDropdowns() {
  try {
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

    const validCats = categories.filter((cat) => cat && cat.tenLoai);
    const activeCategories = validCats.filter((cat) => cat.trangThai === "active");
    const dropdowns = ["QLSP_locDanhMuc", "QLSP_spCatalog", "QLSP_editCatalog"];

    dropdowns.forEach((id) => {
      const select = document.getElementById(id);
      if (!select) return;

      // Lưu giá trị đang chọn
      const currentValue = select.value;
      select.innerHTML = "";

      // Chỉ ô lọc mới có "Tất cả"; form thêm/sửa bắt buộc chọn một danh mục thật.
      const isFilter = id === "QLSP_locDanhMuc";
      if (isFilter) {
        const allOption = document.createElement("option");
        allOption.value = "all";
        allOption.textContent = "Tất cả";
        select.appendChild(allOption);
      }

      // Ô lọc liệt kê cả loại đang ẩn (sản phẩm của loại ẩn vẫn cần quản lý); form chỉ cho chọn loại đang hoạt động.
      const nguon = isFilter ? validCats : activeCategories;
      nguon.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat.tenLoai;
        option.textContent = isFilter && cat.trangThai !== "active" ? `${cat.tenLoai} (đang ẩn)` : cat.tenLoai;
        select.appendChild(option);
      });

      // Khôi phục giá trị đang chọn nếu vẫn còn trong danh sách
      const stillExists = nguon.some((cat) => cat.tenLoai === currentValue);
      if (stillExists) select.value = currentValue;
      else if (isFilter) select.value = "all";
      else if (id === "QLSP_editCatalog" && currentValue) {
        // Đang sửa sản phẩm thuộc loại đã ẩn: giữ lại giá trị hiện tại
        select.appendChild(new Option(currentValue, currentValue));
        select.value = currentValue;
      } else if (select.options.length) select.selectedIndex = 0;
    });
  } catch (error) {
    console.error("Error loading categories into dropdowns:", error);
  }
}
