// ==================== CẤU HÌNH BAN ĐẦU ====================
const QLNH_itemsPerPage = 10;
let QLNH_currentPage = 1;
let QLNH_phieuNhapLocal = [];
let QLNH_productsLocal = [];
let QLNH_mangDaLocPhieu = [];
let QLNH_mangDaLocSanPham = [];

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
  const data = localStorage.getItem("phieuNhapLocal");
  if (data) {
    const stored = JSON.parse(data);
    const containsLegacyWatch = stored.some((receipt) =>
      (receipt.chiTiet || []).some((item) => !String(item.maSanPham || "").startsWith("SH-"))
    );
    if (!containsLegacyWatch) return stored;
  }
  localStorage.setItem("phieuNhapLocal", JSON.stringify(dsPhieuNhapHang));
  return dsPhieuNhapHang;
}
function saveLocalPhieuNhap(data) {
  localStorage.setItem("phieuNhapLocal", JSON.stringify(data));
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
      setTimeout(QLNH_locTongHop, 300);
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
}

// ==================== BẢNG ====================
function QLNH_veBangPhieuNhap(ds) {
  const tableContent = document.querySelector(".QLNH_table-content");
  tableContent.innerHTML = "";
  const table = document.createElement("table");
  table.classList.add("QLNH_admin-table");
  const tbody = document.createElement("tbody");

  ds.sort((a, b) => {
    if (a.trangThai === "chuaHoanThanh" && b.trangThai === "hoanThanh")
      return -1;
    if (a.trangThai === "hoanThanh" && b.trangThai === "chuaHoanThanh")
      return 1;
    return 0;
  });

  const start = (QLNH_currentPage - 1) * QLNH_itemsPerPage;
  const end = start + QLNH_itemsPerPage;
  const dataShow = ds.slice(start, end);

  dataShow.forEach((phieu, index) => {
    const hoanThanhChecked =
      phieu.trangThai === "hoanThanh" ? "checked disabled" : "disabled";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${start + index + 1}</td>
      <td>${phieu.maPhieuNhap}</td>
      <td>${new Date(phieu.ngayNhap).toLocaleString("vi-VN")}</td>
      <td>${phieu.tongTien.toLocaleString("vi-VN")}₫</td>
      <td><button class="QLNH_btn-xem" data-ma="${phieu.maPhieuNhap}">Xem</button></td>
      <td style="text-align:center;">
        <input type="checkbox" class="QLNH_chkHoanThanh" data-ma="${phieu.maPhieuNhap}" ${hoanThanhChecked} />
      </td>
      <td>${
        phieu.trangThai === "hoanThanh"
          ? ""
          : `
        <button class="QLNH_btn-sua" data-ma="${phieu.maPhieuNhap}">Sửa</button>
        <button class="QLNH_btn-xoa" data-ma="${phieu.maPhieuNhap}">Xóa</button>
    `
      }</td>`;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableContent.appendChild(table);
  QLNH_ganSuKienNutHanhDong();
  QLNH_capNhatPhanTrang(ds);
}

// ==================== PHÂN TRANG ====================
function QLNH_capNhatPhanTrang(ds) {
  const totalPages = Math.ceil(ds.length / QLNH_itemsPerPage);
  document.getElementById("QLNH_pageInfo").textContent = `Trang ${QLNH_currentPage} / ${totalPages}`;
  document.getElementById("QLNH_prevPage").disabled = QLNH_currentPage === 1;
  document.getElementById("QLNH_nextPage").disabled = QLNH_currentPage === totalPages;
  document.getElementById("QLNH_prevPage").onclick = () => QLNH_prevPage(ds);
  document.getElementById("QLNH_nextPage").onclick = () => QLNH_nextPage(ds);
}

function QLNH_nextPage(ds) {
  const totalPages = Math.ceil(ds.length / QLNH_itemsPerPage);
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

// ==================== NÚT HÀNH ĐỘNG ====================
function QLNH_ganSuKienNutHanhDong() {
  document.querySelectorAll(".QLNH_btn-xem").forEach((btn) =>
    btn.addEventListener("click", () => QLNH_xemChiTietPhieuNhap(btn.dataset.ma))
  );
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("QLNH_btn-sua"))
      QLNH_suaPhieuNhap(e.target.dataset.ma);
  });
  document.querySelectorAll(".QLNH_btn-xoa").forEach((btn) =>
    btn.addEventListener("click", () => { QLNH_xoaPhieuNhap(btn.dataset.ma); })
  );
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

  phieu.chiTiet.forEach((ct, i) => {
    const sp = QLNH_productsLocal.find((p) => p.id === ct.maSanPham);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${ct.maSanPham}</td>
      <td>${sp ? sp.name : "Không tìm thấy"}</td>
      <td>${ct.soLuongNhap}</td>
      <td>${ct.giaNhap.toLocaleString("vi-VN")} ₫</td>
      <td>${ct.thanhTien.toLocaleString("vi-VN")} ₫</td>`;
    tbody.appendChild(tr);
  });

  tongTienEl.textContent = `${phieu.tongTien.toLocaleString("vi-VN")} ₫`;
  modal.style.display = "flex";
}

document.getElementById("QLNH_closeModalChiTiet").onclick = () =>
  (document.getElementById("QLNH_modalChiTietPhieuNhap").style.display = "none");

window.onclick = function (e) {
  const modal = document.getElementById("QLNH_modalChiTietPhieuNhap");
  if (e.target === modal) modal.style.display = "none";
};

// ==================== LỌC TỔNG HỢP ====================
function QLNH_locTongHop() {
  const tuNgay = document.getElementById("QLNH_LocTuNgay").value;
  const denNgay = document.getElementById("QLNH_LocDenNgay").value;
  const timKiem = document.getElementById("QLNH_timKiemPhieu").value.trim().toLowerCase();
  const trangThai = document.getElementById("QLNH_locTrangThai").value;

  let mangLoc = QLNH_phieuNhapLocal;
  if (trangThai !== "all") mangLoc = mangLoc.filter((p) => p.trangThai === trangThai);
  if (timKiem) mangLoc = mangLoc.filter((p) => p.maPhieuNhap.toLowerCase().includes(timKiem));
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

  QLNH_mangDaLocPhieu = mangLoc;
  QLNH_currentPage = 1;
  QLNH_veBangPhieuNhap(QLNH_mangDaLocPhieu);
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

// ====== Mở modal ======
QLNH_btnMoThem.onclick = () => {
  QLNH_dangSuaPhieu = null;
  QLNH_modalThem.style.display = "flex";
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  document.getElementById("QLNH_ngayNhapMoi").value = `${yyyy}-${mm}-${dd}`;
  document.getElementById("QLNH_tableBodyNhap").innerHTML = "";
  QLNH_themDongSanPham();
};

// ====== Đóng modal ======
QLNH_btnDongThem.onclick = QLNH_btnHuyThem.onclick = () => {
  QLNH_modalThem.style.display = "none";
  document.querySelector(".QLNH_modal-themphieu .QLNH_modal-header h2").textContent = "THÊM PHIẾU NHẬP MỚI";
};

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
    inputEl.value = product.id;
    row.querySelector(".QLNH_tenSP").textContent = product.name;
    row.querySelector(".QLNH_giaNhap").textContent =
      product.importPrice.toLocaleString("vi-VN") + "₫";
    dongGoiY();
    QLNH_capNhatThanhTien(row);
  }

function hienGoiY() {
    const kw = inputEl.value.trim().toLowerCase();
    optionBox.innerHTML = "";

    // Nếu người dùng sửa mã khác sau khi đã chọn 1 sản phẩm → xóa tên/giá cũ
    if (sanPhamDangChon && inputEl.value.trim() !== sanPhamDangChon.id) {
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
      const numA = (a.id.match(/\d+/) || [0])[0];
      const numB = (b.id.match(/\d+/) || [0])[0];
      return numA - numB || a.id.localeCompare(b.id);
    }
    const matches = kw
      ? source.filter((p) => p.id.toLowerCase().includes(kw) || p.name.toLowerCase().includes(kw)).slice(0, 20)
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
      item.textContent = `${p.id} || ${p.name}`;
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
    const exact = QLNH_productsLocal.find((p) => p.id === kw);
    const match = exact || QLNH_productsLocal.find(
      (p) => p.id.toLowerCase() === kw.toLowerCase() || p.name.toLowerCase() === kw.toLowerCase()
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
      <input type="text" class="QLNH_selectSP-input" placeholder="Nhập mã sản phẩm..." autocomplete="off" value="${selectedId}" />
      <div class="QLNH_suggest"></div>
    </td>
    <td class="QLNH_tenSP">${ten}</td>
    <td class="QLNH_giaNhap">${gia}</td>
    <td><input type="number" class="QLNH_soLuong" min="1" value="${soLuong}" /></td>
    <td class="QLNH_thanhTien">${thanhTien}</td>
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
    const product = QLNH_productsLocal.find((p) => p.id === selectedId);
    if (product) {
      row.querySelector(".QLNH_tenSP").textContent = ten || product.name;
      if (!gia) {
        row.querySelector(".QLNH_giaNhap").textContent =
          product.importPrice.toLocaleString("vi-VN") + "₫";
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

function QLNH_capNhatThanhTien(row) {
  const ma = QLNH_layMaDong(row);
  const sl = parseInt(row.querySelector(".QLNH_soLuong").value) || 0;
  const product = QLNH_productsLocal.find((p) => p.id === ma);
  const thanhTienCell = row.querySelector(".QLNH_thanhTien");

  if (product) {
    const thanhTien = product.importPrice * sl;
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
    const product = QLNH_productsLocal.find((p) => p.id === ma);
    if (product) tong += product.importPrice * sl;
  });
  QLNH_tongTienNhap.textContent = tong.toLocaleString("vi-VN") + "₫";
}

// ====== Lưu phiếu nhập ======
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
    QLNH_productsLocal.find((p) => p.id === ma) ||
    QLNH_productsLocal.find((p) => p.id.toLowerCase() === ma.toLowerCase());
  if (!product) return;
  if (!row.querySelector(".QLNH_tenSP").textContent.trim()) {
    row.querySelector(".QLNH_tenSP").textContent = product.name;
  }
  if (!row.querySelector(".QLNH_giaNhap").textContent.trim()) {
    row.querySelector(".QLNH_giaNhap").textContent =
      product.importPrice.toLocaleString("vi-VN") + "₫";
  }
}

function QLNH_luuPhieuMoi() {
  const ngayNhap = document.getElementById("QLNH_ngayNhapMoi").value;
  const trangThai = document.getElementById("QLNH_trangThaiPhieu").value;
  if (!ngayNhap) return alert("Vui lòng chọn ngày nhập!");

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

  if (chiTiet.length === 0) return alert("Chưa có sản phẩm hợp lệ!");
  if (trangThai === "hoanThanh") QLNH_capNhatTonKhoKhiHoanThanh(chiTiet);

  const maPhieu = "PN" + Date.now();
  const phieuMoi = { maPhieuNhap: maPhieu, ngayNhap, chiTiet, tongTien: tong, trangThai };
  QLNH_phieuNhapLocal.push(phieuMoi);
  saveLocalPhieuNhap(QLNH_phieuNhapLocal);
  saveLocalProducts(QLNH_productsLocal);
  QLNH_mangDaLocPhieu = QLNH_phieuNhapLocal;
  alert("Đã lưu phiếu nhập!");
  QLNH_modalThem.style.display = "none";
  document.getElementById("QLNH_tableBodyNhap").innerHTML = "";
  QLNH_tongTienNhap.textContent = "0₫";
  QLNH_veBangPhieuNhap(QLNH_phieuNhapLocal);
}

/* ======= SỬA PHIẾU NHẬP ======= */
function QLNH_suaPhieuNhap(maPhieu) {
  QLNH_dangSuaPhieu = maPhieu;
  const phieu = QLNH_phieuNhapLocal.find((p) => p.maPhieuNhap === maPhieu);
  if (!phieu) return alert("Không tìm thấy phiếu nhập!");
  if (phieu.trangThai === "hoanThanh") return alert("Phiếu đã hoàn thành!");

  const modal = document.getElementById("QLNH_modalThemPhieuNhap");
  modal.style.display = "flex";
  document.querySelector(".QLNH_modal-themphieu .QLNH_modal-header h2").textContent = "SỬA PHIẾU NHẬP";

  document.getElementById("QLNH_ngayNhapMoi").value = phieu.ngayNhap.split("T")[0];
  document.getElementById("QLNH_trangThaiPhieu").value = phieu.trangThai;

  const tbody = document.getElementById("QLNH_tableBodyNhap");
  tbody.innerHTML = "";

  phieu.chiTiet.forEach((ct) => {
    const gia = ct.giaNhap.toLocaleString("vi-VN") + "₫";
    const thanhTien = ct.thanhTien.toLocaleString("vi-VN") + "₫";
    const row = QLNH_taoDongSanPham({
      id: ct.maSanPham,
      ten: "",
      gia: gia,
      soLuong: ct.soLuongNhap,
      thanhTien: thanhTien,
    });
    tbody.appendChild(row);
  });

  QLNH_capNhatTongTien();
  document.getElementById("QLNH_btnLuuPhieuMoi").onclick = function () {
    QLNH_luuPhieuSua(phieu.maPhieuNhap);
  };
}

function QLNH_luuPhieuSua(maPhieu) {
  const ngayNhap = document.getElementById("QLNH_ngayNhapMoi").value;
  const trangThai = document.getElementById("QLNH_trangThaiPhieu").value;
  if (!ngayNhap) return alert("Vui lòng chọn ngày nhập!");

  const chiTiet = [];
  let tong = 0;
  document.querySelectorAll("#QLNH_tableBodyNhap tr").forEach((r) => {
    QLNH_xuLyDongTruocKhiLuu(r);
    const ma = QLNH_layMaDong(r);
    const ten = r.querySelector(".QLNH_tenSP").textContent.trim();
    const sl = parseInt(r.querySelector(".QLNH_soLuong").value) || 0;
    const giaText = r.querySelector(".QLNH_giaNhap").textContent.replace(/[^\d]/g, "");
    const gia = parseFloat(giaText) || 0;
    if (!ma || sl <= 0 || gia <= 0) return;
    const thanhTien = sl * gia;
    tong += thanhTien;
    chiTiet.push({ maSanPham: ma, tenSanPham: ten, soLuongNhap: sl, giaNhap: gia, thanhTien });
  });

  if (chiTiet.length === 0) return alert("Chưa có sản phẩm hợp lệ!");
  if (trangThai === "hoanThanh") QLNH_capNhatTonKhoKhiHoanThanh(chiTiet);

  const index = QLNH_phieuNhapLocal.findIndex((p) => p.maPhieuNhap === maPhieu);
  if (index === -1) return;
  QLNH_phieuNhapLocal[index] = { maPhieuNhap: maPhieu, ngayNhap, chiTiet, tongTien: tong, trangThai };
  saveLocalPhieuNhap(QLNH_phieuNhapLocal);
  QLNH_veBangPhieuNhap(QLNH_phieuNhapLocal);
  alert("Đã cập nhật phiếu nhập!");
  QLNH_modalThem.style.display = "none";
}

/* ====== CẬP NHẬT TỒN KHO ====== */
function QLNH_capNhatTonKhoKhiHoanThanh(chiTiet) {
  // % lợi nhuận mặc định (đồng bộ với Quản lý giá bán, mặc định 20%)
  let percent = 20;
  const percentEl = document.getElementById("QLGB_percentDefault");
  if (percentEl) {
    const v = Number(percentEl.value);
    if (!isNaN(v) && v >= 0) percent = v;
  }

  chiTiet.forEach((ct) => {
    const sp = QLNH_productsLocal.find((p) => p.id === ct.maSanPham);
    if (!sp) return;
    const soLuong = Number(ct.soLuongNhap) || 0;

    // Tăng tồn kho
    sp.quantity = (Number(sp.quantity) || 0) + soLuong;
    sp.importQuantity = (Number(sp.importQuantity) || 0) + soLuong;

    // Nếu sản phẩm chưa có giá bán → tự cấu hình lợi nhuận mặc định
    if (Number(sp.priceValue) <= 0) {
      const cost = Number(sp.importPrice) || Number(ct.giaNhap) || 0;
      const sell = Math.max(0, Math.round(cost * (1 + percent / 100)));
      sp.priceValue = sell;
      sp.price = sell.toLocaleString("vi-VN") + "₫";
    }
  });
  saveLocalProducts(QLNH_productsLocal);
}

/* ====== HOÀN THÀNH & XÓA ====== */
function QLNH_hoanThanhPhieuNhap(maPhieu) {
  const phieuIndex = QLNH_phieuNhapLocal.findIndex((p) => p.maPhieuNhap === maPhieu);
  if (phieuIndex === -1) return alert("Không tìm thấy phiếu!");
  const phieu = QLNH_phieuNhapLocal[phieuIndex];
  if (phieu.trangThai === "hoanThanh") return alert("Đã hoàn thành!");
  QLNH_capNhatTonKhoKhiHoanThanh(phieu.chiTiet);
  phieu.trangThai = "hoanThanh";
  saveLocalPhieuNhap(QLNH_phieuNhapLocal);
  QLNH_veBangPhieuNhap(QLNH_phieuNhapLocal);
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
  QLNH_phieuNhapLocal.splice(index, 1);
  saveLocalPhieuNhap(QLNH_phieuNhapLocal);
  QLNH_veBangPhieuNhap(QLNH_phieuNhapLocal);
  alert("Đã xóa phiếu nhập!");
}

// Nghe thay đổi localStorage từ tab khác
window.addEventListener("storage", (event) => {
  if (event.key === "productsLocal") {
    window.dispatchEvent(new Event("productsUpdated"));
  }
});