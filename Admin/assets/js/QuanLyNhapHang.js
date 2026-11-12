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
    const daHuy = phieu.trangThai === "daHuy";
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
        ${daHuy ? '<span class="QLNH_tag-huy" title="Phiếu đã hủy, tồn kho đã được trừ lại">Đã hủy</span>' : `<input type="checkbox" class="QLNH_chkHoanThanh" data-ma="${ma}" ${hoanThanhAttr} />`}
      </td>
      <td>${daHuy ? "" : daHoanThanh ? `<button class="QLNH_btn-huy-phieu" data-ma="${ma}" title="Trừ lại tồn kho đã nhập">Hủy phiếu</button>` : `
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

    const nutHuyPhieu = e.target.closest(".QLNH_btn-huy-phieu");
    if (nutHuyPhieu) return QLNH_huyPhieuNhap(nutHuyPhieu.dataset.ma);

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
      <td>${QLNH_esc(sp ? sp.tenSanPham : ct.tenSanPham || "Không tìm thấy")}${ct.kichCo ? " (size " + QLNH_esc(ct.kichCo) + ")" : ""}</td>
      <td>${QLNH_esc(ct.soLuongNhap)}</td>
      <td>${QLNH_so(ct.giaNhap).toLocaleString("vi-VN")} ₫</td>
      <td>${QLNH_so(ct.thanhTien).toLocaleString("vi-VN")} ₫</td>`;
    tbody.appendChild(tr);
  });

  const nhan = { hoanThanh: "Đã hoàn thành", chuaHoanThanh: "Chưa hoàn thành", daHuy: "Đã hủy" };
  const info = document.getElementById("QLNH_chiTietThongTin");
  if (info) {
    info.innerHTML =
      `Nhà cung cấp: <b>${QLNH_esc(phieu.nhaCungCap || "—")}</b> · Người lập: <b>${QLNH_esc(phieu.nguoiLap || "—")}</b>` +
      (phieu.nguoiDuyet ? ` · Người duyệt: <b>${QLNH_esc(phieu.nguoiDuyet)}</b>` : "") +
      ` · Trạng thái: <b>${QLNH_esc(nhan[phieu.trangThai] || phieu.trangThai)}</b>` +
      (phieu.ngayHuy ? ` (hủy lúc ${QLNH_esc(new Date(phieu.ngayHuy).toLocaleString("vi-VN"))}${phieu.nguoiHuy ? " bởi " + QLNH_esc(phieu.nguoiHuy) : ""})` : "");
  }
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
  document.getElementById("QLNH_ngayNhapMoi").max = QLNH_homNayISO();
  const nccEl = document.getElementById("QLNH_nhaCungCap");
  if (nccEl) nccEl.value = "";
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
    QLNH_datGia(row, QLNH_so(product.giaNhap));
    QLNH_capNhatOSize(row, product, "");
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
      QLNH_datGia(row, 0);
      QLNH_capNhatOSize(row, null, "");
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
  const gia = Number(opts && opts.gia) || 0;
  const soLuong = (opts && opts.soLuong) || 1;
  const thanhTien = (opts && opts.thanhTien) || "";
  const size = (opts && opts.size) || "";

  row.innerHTML = `
    <td style="position: relative; overflow: visible;">
      <input type="text" class="QLNH_selectSP-input" placeholder="Nhập mã sản phẩm..." autocomplete="off" value="${QLNH_esc(selectedId)}" />
      <div class="QLNH_suggest"></div>
    </td>
    <td class="QLNH_tenSP">${QLNH_esc(ten)}</td>
    <td><select class="QLNH_size" disabled><option value="">--</option></select></td>
    <td><input type="number" class="QLNH_giaNhap" min="1" step="1000" placeholder="Giá nhập" value="${gia > 0 ? QLNH_esc(Math.round(gia)) : ""}" /></td>
    <td><input type="number" class="QLNH_soLuong" min="1" step="1" value="${QLNH_esc(soLuong)}" /></td>
    <td class="QLNH_thanhTien">${QLNH_esc(thanhTien)}</td>
    <td><button class="QLNH_btn-xoa-sp">Xóa</button></td>
  `;

  const inputEl = row.querySelector(".QLNH_selectSP-input");
  if (inputEl) QLNH_ganAutocompleteSanPham(inputEl, row);

  row.querySelector(".QLNH_soLuong").addEventListener("input", () => QLNH_capNhatThanhTien(row));
  row.querySelector(".QLNH_giaNhap").addEventListener("input", () => QLNH_capNhatThanhTien(row));
  row.querySelector(".QLNH_btn-xoa-sp").addEventListener("click", () => {
    row.remove();
    QLNH_capNhatTongTien();
  });

  // Có sẵn mã (sửa phiếu): điền tên, giá và danh sách size
  if (selectedId) {
    const product = QLNH_productsLocal.find((p) => p.maSanPham === selectedId);
    if (product) {
      row.querySelector(".QLNH_tenSP").textContent = ten || product.tenSanPham;
      if (!gia) QLNH_datGia(row, QLNH_so(product.giaNhap));
    }
    QLNH_capNhatOSize(row, product || null, size);
  }

  return row;
}

// ====== Giá nhập / size của một dòng ======
function QLNH_docGia(row) {
  const el = row.querySelector(".QLNH_giaNhap");
  return el ? Math.max(0, parseFloat(el.value) || 0) : 0;
}
function QLNH_datGia(row, value) {
  const el = row.querySelector(".QLNH_giaNhap");
  if (el) el.value = value > 0 ? Math.round(value) : "";
}
function QLNH_cacSize(sp) {
  return sp && sp.tonKhoTheoSize && typeof sp.tonKhoTheoSize === "object"
    ? Object.keys(sp.tonKhoTheoSize).sort((a, b) => Number(a) - Number(b))
    : [];
}
// Dựng ô chọn size theo các size của sản phẩm (sản phẩm không chia size thì khóa ô này)
function QLNH_capNhatOSize(row, sp, chon) {
  const sel = row.querySelector(".QLNH_size");
  if (!sel) return;
  if (!sp) {
    sel.innerHTML = '<option value="">--</option>';
    sel.disabled = true;
    return;
  }
  const sizes = QLNH_cacSize(sp);
  if (!sizes.length) {
    sel.innerHTML = '<option value="">Không chia size</option>';
    sel.disabled = true;
    return;
  }
  if (chon && !sizes.includes(String(chon))) sizes.push(String(chon)); // giữ size cũ của phiếu dù sản phẩm đã đổi
  sel.disabled = false;
  sel.innerHTML =
    '<option value="">-- Chọn size --</option>' +
    sizes.map((s) => `<option value="${QLNH_esc(s)}">${QLNH_esc(s)}</option>`).join("");
  sel.value = chon ? String(chon) : "";
}

// ====== Thêm dòng sản phẩm ======
QLNH_btnThemDongSP.addEventListener("click", QLNH_themDongSanPham);

function QLNH_themDongSanPham() {
  const tbody = document.getElementById("QLNH_tableBodyNhap");
  tbody.appendChild(QLNH_taoDongSanPham());
}

function QLNH_layMaDong(row) {
  const maEl =
    row.querySelector(".QLNH_selectSP-input") ||
    row.querySelector(".QLNH_selectSP") ||
    row.querySelector(".QLNH_maSP");
  return maEl ? maEl.value.trim() : "";
}

// Giá nhập của dòng: giá đang nhập trên dòng; để trống thì lấy giá hiện tại của sản phẩm.
function QLNH_layGiaDong(row) {
  const gia = QLNH_docGia(row);
  if (gia > 0) return gia;
  const product = QLNH_productsLocal.find((p) => p.maSanPham === QLNH_layMaDong(row));
  return product ? QLNH_so(product.giaNhap) : 0;
}

function QLNH_capNhatThanhTien(row) {
  const ma = QLNH_layMaDong(row);
  const sl = parseInt(row.querySelector(".QLNH_soLuong").value) || 0;
  const product = QLNH_productsLocal.find((p) => p.maSanPham === ma);
  const thanhTienCell = row.querySelector(".QLNH_thanhTien");
  thanhTienCell.textContent = product ? (QLNH_layGiaDong(row) * sl).toLocaleString("vi-VN") + "₫" : "";
  QLNH_capNhatTongTien();
}

function QLNH_capNhatTongTien() {
  let tong = 0;
  document.querySelectorAll("#QLNH_tableBodyNhap tr").forEach((r) => {
    const ma = QLNH_layMaDong(r);
    const sl = parseInt(r.querySelector(".QLNH_soLuong").value) || 0;
    if (QLNH_productsLocal.find((p) => p.maSanPham === ma)) tong += QLNH_layGiaDong(r) * sl;
  });
  QLNH_tongTienNhap.textContent = tong.toLocaleString("vi-VN") + "₫";
}

// ====== Lưu phiếu nhập: MỘT handler duy nhất, rẽ nhánh theo QLNH_dangSuaPhieu ======
QLNH_btnLuuPhieuMoi.onclick = () => {
  if (QLNH_dangSuaPhieu) QLNH_luuPhieuSua(QLNH_dangSuaPhieu);
  else QLNH_luuPhieuMoi();
};

function QLNH_homNayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function QLNH_nguoiDangNhap() {
  try {
    const a = typeof adminSession !== "undefined" ? adminSession.getCurrentAdmin() : null;
    return (a && (a.fullName || a.username)) || "admin";
  } catch (e) {
    return "admin";
  }
}

// Thông tin chung của phiếu (ngày, nhà cung cấp, trạng thái) + kiểm tra hợp lệ
function QLNH_docThongTinPhieu() {
  const ngayNhap = document.getElementById("QLNH_ngayNhapMoi").value;
  const trangThai = document.getElementById("QLNH_trangThaiPhieu").value;
  const ncc = document.getElementById("QLNH_nhaCungCap");
  const nhaCungCap = ncc ? ncc.value.trim() : "";
  if (!ngayNhap) return { loi: "Vui lòng chọn ngày nhập!" };
  if (ngayNhap > QLNH_homNayISO()) return { loi: "Ngày nhập không được ở tương lai!" };
  if (!nhaCungCap) return { loi: "Vui lòng nhập nhà cung cấp!" };
  if (nhaCungCap.length > 150) return { loi: "Tên nhà cung cấp tối đa 150 ký tự!" };
  return { ngayNhap, trangThai, nhaCungCap };
}

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
    QLNH_capNhatOSize(row, product, "");
    if (QLNH_docGia(row) <= 0) QLNH_datGia(row, QLNH_so(product.giaNhap)); // chỉ gợi ý giá khi vừa chọn sản phẩm
  }
}

// Đọc các dòng trong modal -> { chiTiet, tong } hoặc { loi }
function QLNH_docChiTietTuModal() {
  const chiTiet = [];
  let tong = 0;
  let loi = "";
  document.querySelectorAll("#QLNH_tableBodyNhap tr").forEach((r, i) => {
    if (loi) return;
    QLNH_xuLyDongTruocKhiLuu(r);
    const ma = QLNH_layMaDong(r);
    if (!ma) return; // dòng trống: bỏ qua
    const sp = QLNH_productsLocal.find((p) => p.maSanPham === ma);
    if (!sp) {
      loi = `Dòng ${i + 1}: không tìm thấy sản phẩm "${ma}".`;
      return;
    }
    const slText = r.querySelector(".QLNH_soLuong").value;
    const sl = Number(slText);
    if (!Number.isInteger(sl) || sl <= 0) {
      loi = `Dòng ${i + 1} (${ma}): số lượng phải là số nguyên lớn hơn 0.`;
      return;
    }
    const gia = QLNH_docGia(r);
    if (gia <= 0) {
      loi = `Dòng ${i + 1} (${ma}): giá nhập phải lớn hơn 0.`;
      return;
    }
    const sizeEl = r.querySelector(".QLNH_size");
    const size = sizeEl && !sizeEl.disabled ? sizeEl.value : "";
    if (QLNH_cacSize(sp).length && !size) {
      loi = `Dòng ${i + 1} (${ma}): hãy chọn size nhập.`;
      return;
    }
    const thanhTien = sl * gia;
    tong += thanhTien;
    chiTiet.push({ maSanPham: ma, tenSanPham: sp.tenSanPham, kichCo: size, soLuongNhap: sl, giaNhap: gia, thanhTien });
  });
  if (!loi && chiTiet.length === 0) loi = "Chưa có sản phẩm hợp lệ!";
  return { chiTiet, tong, loi };
}

function QLNH_baoCanhBao(canhBao) {
  return canhBao && canhBao.length ? "\n\nLưu ý:\n- " + canhBao.join("\n- ") : "";
}

function QLNH_luuPhieuMoi() {
  const tt = QLNH_docThongTinPhieu();
  if (tt.loi) return alert(tt.loi);

  QLNH_productsLocal = getLocalProducts();
  const dong = QLNH_docChiTietTuModal();
  if (dong.loi) return alert(dong.loi);

  const nguoi = QLNH_nguoiDangNhap();
  const phieuMoi = {
    maPhieuNhap: "PN" + Date.now(),
    ngayNhap: tt.ngayNhap,
    nhaCungCap: tt.nhaCungCap,
    nguoiLap: nguoi,
    chiTiet: dong.chiTiet,
    tongTien: dong.tong,
    trangThai: tt.trangThai,
  };
  if (tt.trangThai === "hoanThanh") {
    phieuMoi.nguoiDuyet = nguoi;
    phieuMoi.ngayHoanThanh = new Date().toISOString();
  }
  const danhSachCu = QLNH_phieuNhapLocal;
  const danhSachMoi = danhSachCu.concat([phieuMoi]);

  if (!saveLocalPhieuNhap(danhSachMoi)) {
    return alert("Không thể lưu phiếu nhập (bộ nhớ trình duyệt đã đầy).");
  }
  let canhBao = [];
  if (tt.trangThai === "hoanThanh") {
    const kq = QLNH_capNhatTonKhoKhiHoanThanh(dong.chiTiet);
    if (!kq.ok) {
      saveLocalPhieuNhap(danhSachCu); // hoàn tác phiếu vì không cập nhật được tồn kho
      return alert(kq.message || "Không thể cập nhật tồn kho nên phiếu nhập chưa được lưu.");
    }
    canhBao = kq.canhBao;
  }
  QLNH_phieuNhapLocal = danhSachMoi;
  alert("Đã lưu phiếu nhập!" + QLNH_baoCanhBao(canhBao));
  QLNH_dongModalPhieu();
  QLNH_veLai();
}

/* ======= SỬA PHIẾU NHẬP ======= */
function QLNH_suaPhieuNhap(maPhieu) {
  const phieu = QLNH_phieuNhapLocal.find((p) => p.maPhieuNhap === maPhieu);
  if (!phieu) return alert("Không tìm thấy phiếu nhập!");
  if (phieu.trangThai !== "chuaHoanThanh") return alert("Chỉ sửa được phiếu chưa hoàn thành!");

  QLNH_productsLocal = getLocalProducts();
  QLNH_dangSuaPhieu = maPhieu;
  const modal = document.getElementById("QLNH_modalThemPhieuNhap");
  modal.style.display = "flex";
  QLNH_datTieuDeModal("SỬA PHIẾU NHẬP");

  const ngayEl = document.getElementById("QLNH_ngayNhapMoi");
  ngayEl.max = QLNH_homNayISO();
  ngayEl.value = String(phieu.ngayNhap || "").split("T")[0];
  document.getElementById("QLNH_trangThaiPhieu").value = phieu.trangThai;
  const ncc = document.getElementById("QLNH_nhaCungCap");
  if (ncc) ncc.value = phieu.nhaCungCap || "";

  const tbody = document.getElementById("QLNH_tableBodyNhap");
  tbody.innerHTML = "";
  (phieu.chiTiet || []).forEach((ct) => {
    tbody.appendChild(
      QLNH_taoDongSanPham({
        id: ct.maSanPham,
        ten: ct.tenSanPham || "",
        gia: ct.giaNhap,
        size: ct.kichCo || "",
        soLuong: ct.soLuongNhap,
        thanhTien: QLNH_so(ct.thanhTien).toLocaleString("vi-VN") + "₫",
      })
    );
  });
  QLNH_capNhatTongTien();
}

function QLNH_luuPhieuSua(maPhieu) {
  const tt = QLNH_docThongTinPhieu();
  if (tt.loi) return alert(tt.loi);

  const index = QLNH_phieuNhapLocal.findIndex((p) => p.maPhieuNhap === maPhieu);
  if (index === -1) {
    alert("Phiếu nhập đang sửa không còn tồn tại (có thể đã bị xóa).");
    QLNH_dongModalPhieu();
    QLNH_veLai();
    return;
  }
  const phieuCu = QLNH_phieuNhapLocal[index];
  if (phieuCu.trangThai !== "chuaHoanThanh") {
    alert("Phiếu đã hoàn thành hoặc đã hủy, không thể sửa!");
    QLNH_dongModalPhieu();
    QLNH_veLai();
    return;
  }

  QLNH_productsLocal = getLocalProducts();
  const dong = QLNH_docChiTietTuModal();
  if (dong.loi) return alert(dong.loi);

  const nguoi = QLNH_nguoiDangNhap();
  const phieuMoi = {
    maPhieuNhap: maPhieu,
    ngayNhap: tt.ngayNhap,
    nhaCungCap: tt.nhaCungCap,
    nguoiLap: phieuCu.nguoiLap || nguoi,
    chiTiet: dong.chiTiet,
    tongTien: dong.tong,
    trangThai: tt.trangThai,
  };
  if (tt.trangThai === "hoanThanh") {
    phieuMoi.nguoiDuyet = nguoi;
    phieuMoi.ngayHoanThanh = new Date().toISOString();
  }
  const danhSachCu = QLNH_phieuNhapLocal;
  const danhSachMoi = danhSachCu.slice();
  danhSachMoi[index] = phieuMoi;

  if (!saveLocalPhieuNhap(danhSachMoi)) {
    return alert("Không thể lưu phiếu nhập (bộ nhớ trình duyệt đã đầy).");
  }
  // Chỉ cộng tồn kho khi phiếu chuyển sang "hoàn thành" lần đầu (tránh cộng trùng).
  let canhBao = [];
  if (tt.trangThai === "hoanThanh") {
    const kq = QLNH_capNhatTonKhoKhiHoanThanh(dong.chiTiet);
    if (!kq.ok) {
      saveLocalPhieuNhap(danhSachCu);
      return alert(kq.message || "Không thể cập nhật tồn kho nên phiếu nhập chưa được lưu.");
    }
    canhBao = kq.canhBao;
  }
  QLNH_phieuNhapLocal = danhSachMoi;
  alert("Đã cập nhật phiếu nhập!" + QLNH_baoCanhBao(canhBao));
  QLNH_dongModalPhieu();
  QLNH_veLai();
}

/* ====== CẬP NHẬT TỒN KHO KHI HOÀN THÀNH ====== */
// Trả về { ok, message, canhBao[] }.
//  - Cộng đúng size của dòng (dòng cũ không có size: chia đều như trước).
//  - Giá vốn của sản phẩm = bình quân gia quyền (tồn cũ × giá vốn cũ + SL nhập × giá nhập) / (tồn cũ + SL nhập).
function QLNH_capNhatTonKhoKhiHoanThanh(chiTiet) {
  // % lợi nhuận mặc định (đồng bộ với Quản lý giá bán, mặc định 20%)
  let percent = 20;
  const percentEl = document.getElementById("QLGB_percentDefault");
  if (percentEl) {
    const v = Number(percentEl.value);
    if (!isNaN(v) && v >= 0) percent = v;
  }

  const danhSach = getLocalProducts();
  const canhBao = [];
  // Không bỏ qua im lặng: mọi dòng phải còn sản phẩm
  for (const ct of chiTiet) {
    if (!danhSach.some((p) => p.maSanPham === ct.maSanPham)) {
      return { ok: false, message: `Sản phẩm "${ct.maSanPham}" không còn tồn tại nên không thể hoàn thành phiếu. Hãy xóa dòng này khỏi phiếu.`, canhBao };
    }
  }

  chiTiet.forEach((ct) => {
    const sp = danhSach.find((p) => p.maSanPham === ct.maSanPham);
    const soLuong = Number(ct.soLuongNhap) || 0;
    const giaLo = Number(ct.giaNhap) || 0;
    const tonTruoc = Number(sp.soLuongTon) || 0;

    ShopCore.adjustStock(sp, ct.kichCo || "", soLuong);
    sp.tongDaNhap = (Number(sp.tongDaNhap) || 0) + soLuong;

    if (giaLo > 0) {
      const giaCu = Number(sp.giaNhap) || 0;
      sp.giaNhap = tonTruoc > 0 && giaCu > 0
        ? Math.round((tonTruoc * giaCu + soLuong * giaLo) / (tonTruoc + soLuong))
        : giaLo;
    }

    // Chưa có giá bán -> tự đặt theo % lợi nhuận mặc định trên giá vốn mới
    if (Number(sp.giaBan) <= 0) {
      const sell = Math.max(0, Math.round((Number(sp.giaNhap) || giaLo) * (1 + percent / 100)));
      sp.giaBan = sell;
      sp.giaHienThi = sell.toLocaleString("vi-VN") + "₫";
    } else if (Number(sp.giaBan) < Number(sp.giaNhap)) {
      const msg = `"${sp.tenSanPham}": giá bán (${Number(sp.giaBan).toLocaleString("vi-VN")}₫) thấp hơn giá vốn mới (${Number(sp.giaNhap).toLocaleString("vi-VN")}₫), hãy cập nhật ở Quản lý giá bán.`;
      if (!canhBao.includes(msg)) canhBao.push(msg);
    }
  });
  const ok = saveLocalProducts(danhSach);
  QLNH_productsLocal = getLocalProducts();
  QLNH_mangDaLocSanPham = QLNH_productsLocal;
  return { ok, message: ok ? "" : "Không thể lưu tồn kho (bộ nhớ trình duyệt đã đầy).", canhBao };
}

/* ====== HOÀN THÀNH, HỦY & XÓA ====== */
function QLNH_hoanThanhPhieuNhap(maPhieu) {
  const phieuIndex = QLNH_phieuNhapLocal.findIndex((p) => p.maPhieuNhap === maPhieu);
  if (phieuIndex === -1) return alert("Không tìm thấy phiếu!");
  const phieu = QLNH_phieuNhapLocal[phieuIndex];
  if (phieu.trangThai !== "chuaHoanThanh") return alert("Chỉ hoàn thành được phiếu đang chờ!");

  const danhSachCu = QLNH_phieuNhapLocal;
  const danhSachMoi = danhSachCu.slice();
  danhSachMoi[phieuIndex] = Object.assign({}, phieu, {
    trangThai: "hoanThanh",
    nguoiDuyet: QLNH_nguoiDangNhap(),
    ngayHoanThanh: new Date().toISOString(),
  });

  if (!saveLocalPhieuNhap(danhSachMoi)) {
    alert("Không thể lưu phiếu nhập (bộ nhớ trình duyệt đã đầy).");
    return QLNH_veLai();
  }
  const kq = QLNH_capNhatTonKhoKhiHoanThanh(phieu.chiTiet || []);
  if (!kq.ok) {
    saveLocalPhieuNhap(danhSachCu);
    alert(kq.message || "Không thể cập nhật tồn kho nên phiếu chưa được hoàn thành.");
    return QLNH_veLai();
  }
  QLNH_phieuNhapLocal = danhSachMoi;
  QLNH_veLai();
  alert(`Phiếu ${maPhieu} đã hoàn thành!` + QLNH_baoCanhBao(kq.canhBao));
}

// Hủy phiếu đã hoàn thành: trừ lại đúng số lượng đã nhập (chỉ khi kho còn đủ, tức hàng chưa bán/xuất).
// Giá vốn không được tính lại (giữ nguyên giá vốn hiện tại).
function QLNH_huyPhieuNhap(maPhieu) {
  const index = QLNH_phieuNhapLocal.findIndex((p) => p.maPhieuNhap === maPhieu);
  if (index === -1) return alert("Không tìm thấy phiếu!");
  const phieu = QLNH_phieuNhapLocal[index];
  if (phieu.trangThai !== "hoanThanh") return alert("Chỉ hủy được phiếu đã hoàn thành!");

  const danhSach = getLocalProducts();
  // Gộp theo sản phẩm + size để kiểm tra đủ hàng
  const can = new Map();
  (phieu.chiTiet || []).forEach((ct) => {
    const key = ct.maSanPham + "::" + (ct.kichCo || "");
    const cu = can.get(key) || { ma: ct.maSanPham, size: ct.kichCo || "", sl: 0 };
    cu.sl += Number(ct.soLuongNhap) || 0;
    can.set(key, cu);
  });
  for (const c of can.values()) {
    const sp = danhSach.find((p) => p.maSanPham === c.ma);
    if (!sp) continue; // sản phẩm đã xóa: không còn gì để trừ
    const con = ShopCore.availableStock(sp, c.size);
    if (con < c.sl) {
      return alert(`Không thể hủy phiếu ${maPhieu}: "${sp.tenSanPham}"${c.size ? " (size " + c.size + ")" : ""} chỉ còn ${con} đôi trong kho nhưng phiếu đã nhập ${c.sl} đôi (hàng đã bán hoặc đã xuất).`);
    }
  }
  if (!confirm(`Hủy phiếu ${maPhieu}? Tồn kho sẽ bị trừ lại đúng số lượng đã nhập. Thao tác này không hoàn tác được.`)) return;

  const dsSanPhamCu = getLocalProducts();
  can.forEach((c) => {
    const sp = danhSach.find((p) => p.maSanPham === c.ma);
    if (!sp) return;
    ShopCore.adjustStock(sp, c.size, -c.sl);
    sp.tongDaNhap = Math.max(0, (Number(sp.tongDaNhap) || 0) - c.sl);
  });
  if (!saveLocalProducts(danhSach)) return alert("Không thể lưu tồn kho (bộ nhớ trình duyệt đã đầy).");

  const danhSachCu = QLNH_phieuNhapLocal;
  const danhSachMoi = danhSachCu.slice();
  danhSachMoi[index] = Object.assign({}, phieu, { trangThai: "daHuy", ngayHuy: new Date().toISOString(), nguoiHuy: QLNH_nguoiDangNhap() });
  if (!saveLocalPhieuNhap(danhSachMoi)) {
    saveLocalProducts(dsSanPhamCu); // hoàn tác tồn kho
    return alert("Không thể lưu phiếu nhập (bộ nhớ trình duyệt đã đầy). Tồn kho đã được hoàn lại.");
  }
  QLNH_phieuNhapLocal = danhSachMoi;
  QLNH_productsLocal = getLocalProducts();
  QLNH_veLai();
  alert(`Đã hủy phiếu ${maPhieu} và trừ lại tồn kho.`);
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
