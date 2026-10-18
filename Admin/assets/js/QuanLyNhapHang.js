// ==================== CẤU HÌNH BAN ĐẦU ====================
const QLNH_itemsPerPage = 10;
let QLNH_currentPage = 1;
let QLNH_phieuNhapLocal = [];
let QLNH_productsLocal = [];
let QLNH_mangDaLocPhieu = [];
let QLNH_mangDaLocSanPham = [];
let QLNH_timKiemTimer = null;

const QLNH_esc = (value) => ShopCore.esc(value);
const QLNH_so = (value) => Number(value) || 0;

// ==================== KHI LOAD TRANG ====================
document.addEventListener("DOMContentLoaded", function () {
  QLNH_productsLocal = getLocalProducts();
  QLNH_phieuNhapLocal = getLocalPhieuNhap();
  QLNH_mangDaLocPhieu = QLNH_phieuNhapLocal;
  QLNH_mangDaLocSanPham = QLNH_productsLocal;
  QLNH_khoiTaoTrang();
  QLNH_veBangPhieuNhap(QLNH_mangDaLocPhieu);
  QLNH_ganSuKien();
  QLNH_chongAutofill();
});

// Tránh trình duyệt tự điền username (vd: admin01) vào ô tìm kiếm làm lọc mất dữ liệu
function QLNH_chongAutofill() {
  const inp = document.getElementById("QLNH_timKiemPhieu");
  if (!inp) return;
  const suspects = [];
  try {
    if (typeof adminSession !== "undefined") {
      const info = adminSession.getCurrentAdmin();
      if (info && info.username) suspects.push(String(info.username).toLowerCase());
    }
    const remembered = localStorage.getItem("rememberedUsername");
    if (remembered) suspects.push(String(remembered).toLowerCase());
    if (inp.value && suspects.indexOf(inp.value.trim().toLowerCase()) !== -1) {
      inp.value = "";
      QLNH_locTongHop();
    }
  } catch (e) {
    /* noop */
  }
}
window.addEventListener("hashchange", QLNH_chongAutofill);

// tự reaload lại dữ liệu khi nghe thấy thay đổi
window.addEventListener("productsUpdated", () => {
  QLNH_productsLocal = getLocalProducts();
  QLNH_mangDaLocSanPham = QLNH_productsLocal;
});
// ======== HÀM KHỞI TẠO =========
function QLNH_khoiTaoTrang() {
  if (typeof adminSession !== "undefined" && adminSession.isLoggedIn()) {
    const adminInfo = adminSession.getCurrentAdmin();
    if (adminInfo && adminInfo.username) {
      const adminNameElement = document.getElementById("adminName");
      if (adminNameElement) adminNameElement.textContent = adminInfo.username;
    }
  }
}
document.addEventListener("DOMContentLoaded", function () {
  const modalThem = document.getElementById("QLNH_modalChiTietPhieuNhap");
  if (modalThem && modalThem.parentElement !== document.body) {
    document.body.appendChild(modalThem);
  }
  const modalSua = document.getElementById("QLNH_modalThemPhieuNhap");
  if (modalSua && modalSua.parentElement !== document.body) {
    document.body.appendChild(modalSua);
  }
});

// ======== HÀM LOCAL STORAGE =========
function getLocalPhieuNhap() {
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem("phieuNhapLocal") || "null");
  } catch (e) {
    console.error("Không đọc được phieuNhapLocal, nạp lại dữ liệu mẫu:", e);
    stored = null;
  }
  // Chỉ nạp lại dữ liệu mẫu khi key thiếu/rỗng hoặc dữ liệu hỏng (không phải mảng).
  if (Array.isArray(stored)) return stored;
  const mau = typeof dsPhieuNhapHang !== "undefined" && Array.isArray(dsPhieuNhapHang) ? dsPhieuNhapHang : [];
  const banSao = JSON.parse(JSON.stringify(mau));
  saveLocalPhieuNhap(banSao);
  return banSao;
}
function saveLocalPhieuNhap(data) {
  try {
    localStorage.setItem("phieuNhapLocal", JSON.stringify(data));
    return true;
  } catch (e) {
    console.error("Không thể lưu phieuNhapLocal:", e);
    return false;
  }
}
function removeLocalPhieuNhap() {
  localStorage.removeItem("phieuNhapLocal");
}

// ======== HÀM XỬ LÍ SỰ KIỆN =========
function QLNH_ganSuKien() {
  document
    .getElementById("QLNH_locTrangThai")
    ?.addEventListener("change", QLNH_locTongHop);
  document
    .getElementById("QLNH_timKiemPhieu")
    ?.addEventListener("input", () => {
      clearTimeout(QLNH_timKiemTimer);
      QLNH_timKiemTimer = setTimeout(QLNH_locTongHop, 300);
    });
  document
    .getElementById("QLNH_LocTuNgay")
    ?.addEventListener("change", QLNH_locTongHop);
  document
    .getElementById("QLNH_LocDenNgay")
    ?.addEventListener("change", QLNH_locTongHop);
  document
    .getElementById("QLNH_btnXoaLocNgay")
    ?.addEventListener("click", () => {
      document.getElementById("QLNH_LocTuNgay").value = "";
      document.getElementById("QLNH_LocDenNgay").value = "";
      QLNH_locTongHop();
    });
  QLNH_ganSuKienNutHanhDong();
}

// ==================== BẢNG ====================
function QLNH_veBangPhieuNhap(ds) {
  const tableContent = document.querySelector(".QLNH_table-content");
  tableContent.innerHTML = "";
  const table = document.createElement("table");
  table.classList.add("QLNH_admin-table");
  const tbody = document.createElement("tbody");

  // Kẹp trang hiện tại vào khoảng hợp lệ (sau khi xóa/lọc)
  const tongTrang = Math.max(1, Math.ceil(ds.length / QLNH_itemsPerPage));
  if (QLNH_currentPage > tongTrang) QLNH_currentPage = tongTrang;
  if (QLNH_currentPage < 1) QLNH_currentPage = 1;

  const dsSapXep = ds.slice().sort((a, b) => {
    if (a.trangThai === "chuaHoanThanh" && b.trangThai === "hoanThanh")
      return -1;
    if (a.trangThai === "hoanThanh" && b.trangThai === "chuaHoanThanh")
      return 1;
    return 0;
  });

  const start = (QLNH_currentPage - 1) * QLNH_itemsPerPage;
  const end = start + QLNH_itemsPerPage;
  const dataShow = dsSapXep.slice(start, end);

  dataShow.forEach((phieu, index) => {
    const daHoanThanh = phieu.trangThai === "hoanThanh";
    const ma = QLNH_esc(phieu.maPhieuNhap);
    const hoanThanhAttr = daHoanThanh
      ? 'checked disabled title="Phiếu đã hoàn thành"'
      : 'title="Đánh dấu hoàn thành (cộng tồn kho)"';

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${start + index + 1}</td>
      <td>${ma}</td>
      <td>${QLNH_esc(new Date(phieu.ngayNhap).toLocaleString("vi-VN"))}</td>
      <td>${QLNH_so(phieu.tongTien).toLocaleString("vi-VN")}₫</td>
      <td><button class="QLNH_btn-xem" data-ma="${ma}">Xem</button></td>
      <td style="text-align:center;">
        <input type="checkbox" class="QLNH_chkHoanThanh" data-ma="${ma}" ${hoanThanhAttr} />
      </td>
      <td>${
        daHoanThanh
          ? ""
          : `
        <button class="QLNH_btn-sua" data-ma="${ma}">Sửa</button>
        <button class="QLNH_btn-xoa" data-ma="${ma}">Xóa</button>
    `
      }</td>`;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableContent.appendChild(table);
  QLNH_capNhatPhanTrang(ds);
}

// Vẽ lại bảng theo bộ lọc hiện tại, giữ nguyên trang (đã kẹp trong QLNH_veBangPhieuNhap)
function QLNH_veLai() {
  QLNH_mangDaLocPhieu = QLNH_layDanhSachDaLoc();
  QLNH_veBangPhieuNhap(QLNH_mangDaLocPhieu);
}

// ==================== PHÂN TRANG ====================
function QLNH_capNhatPhanTrang(ds) {
  const totalPages = Math.max(1, Math.ceil(ds.length / QLNH_itemsPerPage));
  document.getElementById("QLNH_pageInfo").textContent = `Trang ${QLNH_currentPage} / ${totalPages}`;
  document.getElementById("QLNH_prevPage").disabled = QLNH_currentPage <= 1;
  document.getElementById("QLNH_nextPage").disabled = QLNH_currentPage >= totalPages;
  document.getElementById("QLNH_prevPage").onclick = () => QLNH_prevPage(ds);
  document.getElementById("QLNH_nextPage").onclick = () => QLNH_nextPage(ds);
}

function QLNH_nextPage(ds) {
  const totalPages = Math.max(1, Math.ceil(ds.length / QLNH_itemsPerPage));
  if (QLNH_currentPage < totalPages) {
    QLNH_currentPage++;
    QLNH_veBangPhieuNhap(ds);
  }
}
function QLNH_prevPage(ds) {
  if (QLNH_currentPage > 1) {
    QLNH_currentPage--;
    QLNH_veBangPhieuNhap(ds);
  }
}

// ==================== NÚT HÀNH ĐỘNG (event delegation, đăng ký 1 lần) ====================
function QLNH_ganSuKienNutHanhDong() {
  const vung = document.querySelector(".QLNH_table-content");
  if (!vung || vung.dataset.daGanSuKien === "1") return;
  vung.dataset.daGanSuKien = "1";

  vung.addEventListener("click", (e) => {
    const nutXem = e.target.closest(".QLNH_btn-xem");
    if (nutXem) return QLNH_xemChiTietPhieuNhap(nutXem.dataset.ma);

    const nutSua = e.target.closest(".QLNH_btn-sua");
    if (nutSua) return QLNH_suaPhieuNhap(nutSua.dataset.ma);

    const nutXoa = e.target.closest(".QLNH_btn-xoa");
    if (nutXoa) return QLNH_xoaPhieuNhap(nutXoa.dataset.ma);

    const chk = e.target.closest(".QLNH_chkHoanThanh");
    if (chk) {
      // Phiếu đã hoàn thành: checkbox bị disabled nên không tới đây.
      e.preventDefault();
      if (chk.disabled) return;
      const ma = chk.dataset.ma;
      if (confirm(`Đánh dấu phiếu ${ma} là hoàn thành? Tồn kho sẽ được cộng và không thể sửa/xóa phiếu sau đó.`)) {
        QLNH_hoanThanhPhieuNhap(ma);
      }
    }
  });
}

// ==================== XEM CHI TIẾT ====================
function QLNH_xemChiTietPhieuNhap(maPhieu) {
  const modal = document.getElementById("QLNH_modalChiTietPhieuNhap");
  const tbody = document.getElementById("QLNH_chiTietPhieuBody");
  const ngayNhapEl = document.getElementById("QLNH_chiTietNgayNhap");
  const tongTienEl = document.getElementById("QLNH_chiTietTongTien");

  const phieu = QLNH_phieuNhapLocal.find((p) => p.maPhieuNhap === maPhieu);
  if (!phieu) return;
  ngayNhapEl.textContent = new Date(phieu.ngayNhap).toLocaleString("vi-VN");
  tbody.innerHTML = "";

  (phieu.chiTiet || []).forEach((ct, i) => {
    const sp = QLNH_productsLocal.find((p) => p.maSanPham === ct.maSanPham);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${QLNH_esc(ct.maSanPham)}</td>
      <td>${QLNH_esc(sp ? sp.tenSanPham : ct.tenSanPham || "Không tìm thấy")}</td>
      <td>${QLNH_esc(ct.soLuongNhap)}</td>
      <td>${QLNH_so(ct.giaNhap).toLocaleString("vi-VN")} ₫</td>
      <td>${QLNH_so(ct.thanhTien).toLocaleString("vi-VN")} ₫</td>`;
    tbody.appendChild(tr);
  });

  tongTienEl.textContent = `${QLNH_so(phieu.tongTien).toLocaleString("vi-VN")} ₫`;
  modal.style.display = "flex";
}

document.getElementById("QLNH_closeModalChiTiet").onclick = () =>
  (document.getElementById("QLNH_modalChiTietPhieuNhap").style.display = "none");

window.onclick = function (e) {
  const modal = document.getElementById("QLNH_modalChiTietPhieuNhap");
  if (e.target === modal) modal.style.display = "none";
};

// ==================== LỌC TỔNG HỢP ====================
function QLNH_layDanhSachDaLoc() {
  const tuNgay = document.getElementById("QLNH_LocTuNgay").value;
  const denNgay = document.getElementById("QLNH_LocDenNgay").value;
  const timKiem = document.getElementById("QLNH_timKiemPhieu").value.trim().toLowerCase();
  const trangThai = document.getElementById("QLNH_locTrangThai").value;

  let mangLoc = QLNH_phieuNhapLocal;
  if (trangThai !== "all") mangLoc = mangLoc.filter((p) => p.trangThai === trangThai);
  if (timKiem) mangLoc = mangLoc.filter((p) => String(p.maPhieuNhap || "").toLowerCase().includes(timKiem));
  if (tuNgay || denNgay) {
    mangLoc = mangLoc.filter((p) => {
      const ngayNhap = new Date(p.ngayNhap);
      const tu = tuNgay ? new Date(tuNgay) : null;
      const den = denNgay ? new Date(denNgay) : null;
      if (tu && den) {
        const start = new Date(tu.getFullYear(), tu.getMonth(), tu.getDate());
        const end = new Date(den.getFullYear(), den.getMonth(), den.getDate());
        const current = new Date(ngayNhap.getFullYear(), ngayNhap.getMonth(), ngayNhap.getDate());
        return current >= start && current <= end;
      } else if (tu) {
        const start = new Date(tu.getFullYear(), tu.getMonth(), tu.getDate());
        const current = new Date(ngayNhap.getFullYear(), ngayNhap.getMonth(), ngayNhap.getDate());
        return current >= start;
      } else if (den) {
        const end = new Date(den.getFullYear(), den.getMonth(), den.getDate());
        const current = new Date(ngayNhap.getFullYear(), ngayNhap.getMonth(), ngayNhap.getDate());
        return current <= end;
      }
      return true;
    });
  }
  return mangLoc;
}

// Người dùng đổi bộ lọc => về trang 1
function QLNH_locTongHop() {
  QLNH_currentPage = 1;
  QLNH_veLai();
}

/* ======================================== */
/* =========== MODAL THÊM PHIẾU NHẬP =========== */
const QLNH_modalThem = document.getElementById("QLNH_modalThemPhieuNhap");
const QLNH_btnMoThem = document.getElementById("QLNH_btnThemMoiPhieuNhap");
const QLNH_btnDongThem = document.getElementById("QLNH_closeModalThemPhieu");
const QLNH_btnHuyThem = document.getElementById("QLNH_btnHuyPhieuMoi");
const QLNH_btnLuuPhieuMoi = document.getElementById("QLNH_btnLuuPhieuMoi");
const QLNH_btnThemDongSP = document.getElementById("QLNH_btnThemDong");
const QLNH_tongTienNhap = document.getElementById("QLNH_tongTien");
var QLNH_dangSuaPhieu = null;

function QLNH_datTieuDeModal(text) {
  const h2 = document.querySelector(".QLNH_modal-themphieu .QLNH_modal-header h2");
  if (h2) h2.textContent = text;
}

// Đóng modal thêm/sửa: luôn trả về chế độ "thêm mới"
function QLNH_dongModalPhieu() {
  QLNH_dangSuaPhieu = null;
  QLNH_modalThem.style.display = "none";
  QLNH_datTieuDeModal("THÊM PHIẾU NHẬP MỚI");
  document.getElementById("QLNH_tableBodyNhap").innerHTML = "";
  QLNH_tongTienNhap.textContent = "0₫";
}

// ====== Mở modal ======
QLNH_btnMoThem.onclick = () => {
  QLNH_dangSuaPhieu = null;
  QLNH_datTieuDeModal("THÊM PHIẾU NHẬP MỚI");
  QLNH_modalThem.style.display = "flex";
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  document.getElementById("QLNH_ngayNhapMoi").value = `${yyyy}-${mm}-${dd}`;
  document.getElementById("QLNH_trangThaiPhieu").value = "hoanThanh";
  document.getElementById("QLNH_tableBodyNhap").innerHTML = "";
  QLNH_tongTienNhap.textContent = "0₫";
  QLNH_themDongSanPham();
};

// ====== Đóng modal ======
QLNH_btnDongThem.onclick = QLNH_btnHuyThem.onclick = QLNH_dongModalPhieu;

// *** FIX MỚI: autocomplete — NHẬP mã sản phẩm và chọn từ gợi ý ***
function QLNH_ganAutocompleteSanPham(inputEl, row) {
  const optionBox = row.querySelector(".QLNH_suggest");
  if (!optionBox) return;
  let sanPhamDangChon = null;

  function dongGoiY() {
    optionBox.style.display = "none";
    optionBox.innerHTML = "";
  }

  function chonSanPham(product) {
    sanPhamDangChon = product;
    inputEl.value = product.maSanPham;
    row.querySelector(".QLNH_tenSP").textContent = product.tenSanPham;
    row.querySelector(".QLNH_giaNhap").textContent =
      QLNH_so(product.giaNhap).toLocaleString("vi-VN") + "₫";
    dongGoiY();
    QLNH_capNhatThanhTien(row);
  }

  function hienGoiY() {
    const kw = inputEl.value.trim().toLowerCase();
    optionBox.innerHTML = "";

    // Nếu người dùng sửa mã khác sau khi đã chọn 1 sản phẩm → xóa tên/giá cũ
    if (sanPhamDangChon && inputEl.value.trim() !== sanPhamDangChon.maSanPham) {
      sanPhamDangChon = null;
      row.querySelector(".QLNH_tenSP").textContent = "";
      row.querySelector(".QLNH_giaNhap").textContent = "";
      QLNH_capNhatThanhTien(row);
    }

    // Luôn đọc danh sách mới nhất từ localStorage để có sản phẩm vừa thêm
    const source = getLocalProducts() || QLNH_productsLocal;
    if (source !== QLNH_productsLocal) QLNH_productsLocal = source;

    // Luôn show danh sách option (kể cả khi chưa gõ), sắp theo mã từ thấp đến cao
    function soMa(a, b) {
      const numA = (a.maSanPham.match(/\d+/) || [0])[0];
      const numB = (b.maSanPham.match(/\d+/) || [0])[0];
      return numA - numB || a.maSanPham.localeCompare(b.maSanPham);
    }
    const matches = kw
      ? source.filter((p) => p.maSanPham.toLowerCase().includes(kw) || p.tenSanPham.toLowerCase().includes(kw)).slice(0, 20)
      : source.slice().sort(soMa);
    if (!matches.length) {
      const empty = document.createElement("div");
      empty.className = "QLNH_suggest-empty";
      empty.textContent = kw ? "Không tìm thấy sản phẩm" : "Chưa có sản phẩm";
      optionBox.appendChild(empty);
      optionBox.style.display = "block";
      return;
    }
    matches.forEach((p) => {
      const item = document.createElement("div");
      item.className = "QLNH_suggest-item";
      item.textContent = `${p.maSanPham} || ${p.tenSanPham}`;
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        chonSanPham(p);
      });
      optionBox.appendChild(item);
    });
    optionBox.style.display = "block";
  }

  function tuDongChon() {
    const kw = inputEl.value.trim();
    if (!kw) return;
    const fresh = getLocalProducts();
    if (fresh !== QLNH_productsLocal) QLNH_productsLocal = fresh;
    const exact = QLNH_productsLocal.find((p) => p.maSanPham === kw);
    const match = exact || QLNH_productsLocal.find(
      (p) => p.maSanPham.toLowerCase() === kw.toLowerCase() || p.tenSanPham.toLowerCase() === kw.toLowerCase()
    );
    if (match) chonSanPham(match);
  }

  inputEl.addEventListener("focus", hienGoiY);
  inputEl.addEventListener("input", hienGoiY);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); tuDongChon(); dongGoiY(); }
    if (e.key === "Escape") dongGoiY();
    if (e.key === "Tab") { setTimeout(() => { tuDongChon(); dongGoiY(); }, 0); }
  });
  inputEl.addEventListener("blur", () => {
    setTimeout(() => { tuDongChon(); dongGoiY(); }, 150);
  });
}

// ====== Tạo 1 dòng sản phẩm trong bảng nhập ======
function QLNH_taoDongSanPham(opts) {
  const row = document.createElement("tr");
  const selectedId = (opts && opts.id) || "";
  const ten = (opts && opts.ten) || "";
  const gia = (opts && opts.gia) || "";
  const soLuong = (opts && opts.soLuong) || 1;
  const thanhTien = (opts && opts.thanhTien) || "";

  row.innerHTML = `
    <td style="position: relative; overflow: visible;">
      <input type="text" class="QLNH_selectSP-input" placeholder="Nhập mã sản phẩm..." autocomplete="off" value="${QLNH_esc(selectedId)}" />
      <div class="QLNH_suggest"></div>
    </td>
    <td class="QLNH_tenSP">${QLNH_esc(ten)}</td>
    <td class="QLNH_giaNhap">${QLNH_esc(gia)}</td>
    <td><input type="number" class="QLNH_soLuong" min="1" value="${QLNH_esc(soLuong)}" /></td>
    <td class="QLNH_thanhTien">${QLNH_esc(thanhTien)}</td>
    <td><button class="QLNH_btn-xoa-sp">Xóa</button></td>
  `;

  const inputEl = row.querySelector(".QLNH_selectSP-input");
  if (inputEl) QLNH_ganAutocompleteSanPham(inputEl, row);

  row.querySelector(".QLNH_soLuong").addEventListener("input", () => QLNH_capNhatThanhTien(row));
  row.querySelector(".QLNH_btn-xoa-sp").addEventListener("click", () => {
    row.remove();
    QLNH_capNhatTongTien();
  });

  // Nếu có selectedId → tự điền tên + giá
  if (selectedId) {
    const product = QLNH_productsLocal.find((p) => p.maSanPham === selectedId);
    if (product) {
      row.querySelector(".QLNH_tenSP").textContent = ten || product.tenSanPham;
      if (!gia) {
        row.querySelector(".QLNH_giaNhap").textContent =
          QLNH_so(product.giaNhap).toLocaleString("vi-VN") + "₫";
      }
    }
  }

  return row;
}

// ====== Thêm dòng sản phẩm ======
QLNH_btnThemDongSP.addEventListener("click", QLNH_themDongSanPham);

function QLNH_themDongSanPham() {
  const tbody = document.getElementById("QLNH_tableBodyNhap");
  tbody.appendChild(QLNH_taoDongSanPham());
}

// ====== Cập nhật thành tiền 1 dòng ======
function QLNH_layMaDong(row) {
  const maEl =
    row.querySelector(".QLNH_selectSP-input") ||
    row.querySelector(".QLNH_selectSP") ||
    row.querySelector(".QLNH_maSP");
  return maEl ? maEl.value.trim() : "";
}

// Giá nhập của dòng: ưu tiên giá đang hiển thị trên dòng (giá lúc lập phiếu), nếu trống thì lấy giá hiện tại của sản phẩm.
function QLNH_layGiaDong(row) {
  const giaCell = row.querySelector(".QLNH_giaNhap");
  const giaText = giaCell ? giaCell.textContent.replace(/[^\d]/g, "") : "";
  if (giaText) return parseFloat(giaText) || 0;
  const product = QLNH_productsLocal.find((p) => p.maSanPham === QLNH_layMaDong(row));
  return product ? QLNH_so(product.giaNhap) : 0;
}

function QLNH_capNhatThanhTien(row) {
  const ma = QLNH_layMaDong(row);
  const sl = parseInt(row.querySelector(".QLNH_soLuong").value) || 0;
  const product = QLNH_productsLocal.find((p) => p.maSanPham === ma);
  const thanhTienCell = row.querySelector(".QLNH_thanhTien");

  if (product) {
    const thanhTien = QLNH_layGiaDong(row) * sl;
    thanhTienCell.textContent = thanhTien.toLocaleString("vi-VN") + "₫";
  } else {
    thanhTienCell.textContent = "";
  }
  QLNH_capNhatTongTien();
}

// ====== Tổng tiền ======
function QLNH_capNhatTongTien() {
  const rows = document.querySelectorAll("#QLNH_tableBodyNhap tr");
  let tong = 0;
  rows.forEach((r) => {
    const ma = QLNH_layMaDong(r);
    const sl = parseInt(r.querySelector(".QLNH_soLuong").value) || 0;
    const product = QLNH_productsLocal.find((p) => p.maSanPham === ma);
    if (product) tong += QLNH_layGiaDong(r) * sl;
  });
  QLNH_tongTienNhap.textContent = tong.toLocaleString("vi-VN") + "₫";
}

// ====== Lưu phiếu nhập: MỘT handler duy nhất, rẽ nhánh theo QLNH_dangSuaPhieu ======
QLNH_btnLuuPhieuMoi.onclick = () => {
  if (QLNH_dangSuaPhieu) {
    QLNH_luuPhieuSua(QLNH_dangSuaPhieu);
  } else {
    QLNH_luuPhieuMoi();
  }
};

// Tự điền tên & giá nếu người dùng chỉ gõ mã rồi lưu
function QLNH_xuLyDongTruocKhiLuu(row) {
  const ma = QLNH_layMaDong(row);
  if (!ma) return;
  const product =
    QLNH_productsLocal.find((p) => p.maSanPham === ma) ||
    QLNH_productsLocal.find((p) => p.maSanPham.toLowerCase() === ma.toLowerCase());
  if (!product) return;
  if (!row.querySelector(".QLNH_tenSP").textContent.trim()) {
    row.querySelector(".QLNH_tenSP").textContent = product.tenSanPham;
  }
  if (!row.querySelector(".QLNH_giaNhap").textContent.trim()) {
    row.querySelector(".QLNH_giaNhap").textContent =
      QLNH_so(product.giaNhap).toLocaleString("vi-VN") + "₫";
  }
}

// Đọc các dòng trong modal -> { chiTiet, tong }
function QLNH_docChiTietTuModal() {
  const chiTiet = [];
  let tong = 0;
  document.querySelectorAll("#QLNH_tableBodyNhap tr").forEach((r) => {
    QLNH_xuLyDongTruocKhiLuu(r);
    const ma = QLNH_layMaDong(r);
    const ten = r.querySelector(".QLNH_tenSP").textContent.trim();
    const sl = parseInt(r.querySelector(".QLNH_soLuong").value) || 0;
    const giaText = r.querySelector(".QLNH_giaNhap").textContent.replace(/[^\d]/g, "");
    const gia = parseFloat(giaText) || 0;
    if (!ma || !ten || sl <= 0 || gia <= 0) return;
    const thanhTien = sl * gia;
    tong += thanhTien;
    chiTiet.push({ maSanPham: ma, tenSanPham: ten, soLuongNhap: sl, giaNhap: gia, thanhTien });
  });
  return { chiTiet, tong };
}

function QLNH_luuPhieuMoi() {
  const ngayNhap = document.getElementById("QLNH_ngayNhapMoi").value;
  const trangThai = document.getElementById("QLNH_trangThaiPhieu").value;
  if (!ngayNhap) return alert("Vui lòng chọn ngày nhập!");

  QLNH_productsLocal = getLocalProducts();
  const { chiTiet, tong } = QLNH_docChiTietTuModal();
  if (chiTiet.length === 0) return alert("Chưa có sản phẩm hợp lệ!");

  const maPhieu = "PN" + Date.now();
  const phieuMoi = { maPhieuNhap: maPhieu, ngayNhap, chiTiet, tongTien: tong, trangThai };
  const danhSachCu = QLNH_phieuNhapLocal;
  const danhSachMoi = danhSachCu.concat([phieuMoi]);

  if (!saveLocalPhieuNhap(danhSachMoi)) {
    return alert("Không thể lưu phiếu nhập (bộ nhớ trình duyệt đã đầy).");
  }
  if (trangThai === "hoanThanh" && !QLNH_capNhatTonKhoKhiHoanThanh(chiTiet)) {
    saveLocalPhieuNhap(danhSachCu); // hoàn tác phiếu vì không cập nhật được tồn kho
    return alert("Không thể cập nhật tồn kho nên phiếu nhập chưa được lưu.");
  }
  QLNH_phieuNhapLocal = danhSachMoi;
  alert("Đã lưu phiếu nhập!");
  QLNH_dongModalPhieu();
  QLNH_veLai();
}

/* ======= SỬA PHIẾU NHẬP ======= */
function QLNH_suaPhieuNhap(maPhieu) {
  const phieu = QLNH_phieuNhapLocal.find((p) => p.maPhieuNhap === maPhieu);
  if (!phieu) return alert("Không tìm thấy phiếu nhập!");
  if (phieu.trangThai === "hoanThanh") return alert("Phiếu đã hoàn thành!");

  QLNH_productsLocal = getLocalProducts();
  QLNH_dangSuaPhieu = maPhieu;
  const modal = document.getElementById("QLNH_modalThemPhieuNhap");
  modal.style.display = "flex";
  QLNH_datTieuDeModal("SỬA PHIẾU NHẬP");

  document.getElementById("QLNH_ngayNhapMoi").value = String(phieu.ngayNhap || "").split("T")[0];
  document.getElementById("QLNH_trangThaiPhieu").value = phieu.trangThai;

  const tbody = document.getElementById("QLNH_tableBodyNhap");
  tbody.innerHTML = "";

  (phieu.chiTiet || []).forEach((ct) => {
    const gia = QLNH_so(ct.giaNhap).toLocaleString("vi-VN") + "₫";
    const thanhTien = QLNH_so(ct.thanhTien).toLocaleString("vi-VN") + "₫";
    const row = QLNH_taoDongSanPham({
      id: ct.maSanPham,
      ten: ct.tenSanPham || "",
      gia: gia,
      soLuong: ct.soLuongNhap,
      thanhTien: thanhTien,
    });
    tbody.appendChild(row);
  });

  QLNH_capNhatTongTien();
}

function QLNH_luuPhieuSua(maPhieu) {
  const ngayNhap = document.getElementById("QLNH_ngayNhapMoi").value;
  const trangThai = document.getElementById("QLNH_trangThaiPhieu").value;
  if (!ngayNhap) return alert("Vui lòng chọn ngày nhập!");

  const index = QLNH_phieuNhapLocal.findIndex((p) => p.maPhieuNhap === maPhieu);
  if (index === -1) {
    alert("Phiếu nhập đang sửa không còn tồn tại (có thể đã bị xóa).");
    QLNH_dongModalPhieu();
    QLNH_veLai();
    return;
  }
  const phieuCu = QLNH_phieuNhapLocal[index];
  if (phieuCu.trangThai === "hoanThanh") {
    alert("Phiếu đã hoàn thành, không thể sửa!");
    QLNH_dongModalPhieu();
    QLNH_veLai();
    return;
  }

  QLNH_productsLocal = getLocalProducts();
  const { chiTiet, tong } = QLNH_docChiTietTuModal();
  if (chiTiet.length === 0) return alert("Chưa có sản phẩm hợp lệ!");

  const phieuMoi = { maPhieuNhap: maPhieu, ngayNhap, chiTiet, tongTien: tong, trangThai };
  const danhSachCu = QLNH_phieuNhapLocal;
  const danhSachMoi = danhSachCu.slice();
  danhSachMoi[index] = phieuMoi;

  if (!saveLocalPhieuNhap(danhSachMoi)) {
    return alert("Không thể lưu phiếu nhập (bộ nhớ trình duyệt đã đầy).");
  }
  // Chỉ cộng tồn kho khi phiếu chuyển sang "hoàn thành" lần đầu (tránh cộng trùng).
  if (trangThai === "hoanThanh" && !QLNH_capNhatTonKhoKhiHoanThanh(chiTiet)) {
    saveLocalPhieuNhap(danhSachCu);
    return alert("Không thể cập nhật tồn kho nên phiếu nhập chưa được lưu.");
  }
  QLNH_phieuNhapLocal = danhSachMoi;
  alert("Đã cập nhật phiếu nhập!");
  QLNH_dongModalPhieu();
  QLNH_veLai();
}

/* ====== CẬP NHẬT TỒN KHO ====== */
// Trả về true nếu lưu sản phẩm thành công.
function QLNH_capNhatTonKhoKhiHoanThanh(chiTiet) {
  // % lợi nhuận mặc định (đồng bộ với Quản lý giá bán, mặc định 20%)
  let percent = 20;
  const percentEl = document.getElementById("QLGB_percentDefault");
  if (percentEl) {
    const v = Number(percentEl.value);
    if (!isNaN(v) && v >= 0) percent = v;
  }

  // Làm việc trên bản mới nhất từ localStorage
  const danhSach = getLocalProducts();
  chiTiet.forEach((ct) => {
    const sp = danhSach.find((p) => p.maSanPham === ct.maSanPham);
    if (!sp) return;
    const soLuong = Number(ct.soLuongNhap) || 0;

    // Tăng tồn kho
    // Ghi vào tonKhoTheoSize (chia đều các size) để người dùng thật sự thấy hàng mới nhập.
    ShopCore.adjustStock(sp, "", soLuong);
    sp.tongDaNhap = (Number(sp.tongDaNhap) || 0) + soLuong;

    // Nếu sản phẩm chưa có giá bán → tự cấu hình lợi nhuận mặc định
    if (Number(sp.giaBan) <= 0) {
      const cost = Number(sp.giaNhap) || Number(ct.giaNhap) || 0;
      const sell = Math.max(0, Math.round(cost * (1 + percent / 100)));
      sp.giaBan = sell;
      sp.giaHienThi = sell.toLocaleString("vi-VN") + "₫";
    }
  });
  const ok = saveLocalProducts(danhSach);
  QLNH_productsLocal = getLocalProducts();
  QLNH_mangDaLocSanPham = QLNH_productsLocal;
  return ok;
}

/* ====== HOÀN THÀNH & XÓA ====== */
function QLNH_hoanThanhPhieuNhap(maPhieu) {
  const phieuIndex = QLNH_phieuNhapLocal.findIndex((p) => p.maPhieuNhap === maPhieu);
  if (phieuIndex === -1) return alert("Không tìm thấy phiếu!");
  const phieu = QLNH_phieuNhapLocal[phieuIndex];
  if (phieu.trangThai === "hoanThanh") return alert("Đã hoàn thành!");

  const danhSachCu = QLNH_phieuNhapLocal;
  const danhSachMoi = danhSachCu.slice();
  danhSachMoi[phieuIndex] = Object.assign({}, phieu, { trangThai: "hoanThanh" });

  if (!saveLocalPhieuNhap(danhSachMoi)) {
    alert("Không thể lưu phiếu nhập (bộ nhớ trình duyệt đã đầy).");
    return QLNH_veLai();
  }
  if (!QLNH_capNhatTonKhoKhiHoanThanh(phieu.chiTiet || [])) {
    saveLocalPhieuNhap(danhSachCu);
    alert("Không thể cập nhật tồn kho nên phiếu chưa được hoàn thành.");
    return QLNH_veLai();
  }
  QLNH_phieuNhapLocal = danhSachMoi;
  QLNH_veLai();
  alert(`Phiếu ${maPhieu} đã hoàn thành!`);
}

function QLNH_xoaPhieuNhap(maPhieu) {
  const index = QLNH_phieuNhapLocal.findIndex((p) => p.maPhieuNhap === maPhieu);
  if (index === -1) return alert("Không tìm thấy phiếu!");
  const phieu = QLNH_phieuNhapLocal[index];
  const xacNhan = confirm(
    phieu.trangThai === "hoanThanh"
      ? `Phiếu ${maPhieu} đã hoàn thành! Bạn có chắc muốn xóa không?`
      : `Bạn có chắc muốn xóa phiếu ${maPhieu}?`
  );
  if (!xacNhan) return;
  const danhSachMoi = QLNH_phieuNhapLocal.filter((_, i) => i !== index);
  if (!saveLocalPhieuNhap(danhSachMoi)) {
    return alert("Không thể lưu thay đổi (bộ nhớ trình duyệt có vấn đề).");
  }
  QLNH_phieuNhapLocal = danhSachMoi;
  // Nếu đang sửa đúng phiếu vừa xóa thì đóng modal
  if (QLNH_dangSuaPhieu === maPhieu) QLNH_dongModalPhieu();
  QLNH_veLai();
  alert("Đã xóa phiếu nhập!");
}

// Nghe thay đổi localStorage từ tab khác
window.addEventListener("storage", (event) => {
  if (event.key === "productsLocal") {
    window.dispatchEvent(new Event("productsUpdated"));
  }
  if (event.key === "phieuNhapLocal") {
    QLNH_phieuNhapLocal = getLocalPhieuNhap();
    QLNH_veLai();
  }
});
