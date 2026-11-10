function QLNV_onReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

let QLNV_danhSach = [];
let QLNV_trangHienTai = 1;
let QLNV_soDongMoiTrang = 10;
let QLNV_dangSuaMa = null;

// Tên đăng nhập dành riêng cho quản trị viên (xem adminCredentials trong DangNhap_Admin.js) -> không cho nhân viên dùng
const QLNV_TEN_ADMIN = ["admin", "admin01", "admin02", "admin03"];

function QLNV_esc(value) {
  if (window.ShopCore && typeof window.ShopCore.esc === "function") return window.ShopCore.esc(value);
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

QLNV_onReady(function() {
  QLNV_danhSach = getLocalEmployees() || [];
  QLNV_doDanhSachChucVu();
  QLNV_ganSuKien();
  QLNV_veBang();
});

function QLNV_doDanhSachChucVu() {
  const select = document.getElementById("QLNV_chucVu");
  if (!select) return;
  select.innerHTML = "";
  (CHUC_VU_NHAN_VIEN || []).forEach((cv) => {
    const opt = document.createElement("option");
    opt.value = cv;
    opt.textContent = cv;
    select.appendChild(opt);
  });
}

function QLNV_notify(message, type) {
  if (window.AdminDashboard && typeof AdminDashboard.showNotification === "function") {
    AdminDashboard.showNotification(message, type);
  } else {
    alert(message);
  }
}

function QLNV_layDanhSachLoc() {
  const key = (document.getElementById("QLNV_search")?.value || "").trim().toLowerCase();
  let list = QLNV_danhSach.slice();
  if (key) {
    list = list.filter((nv) => {
      return (
        String(nv.maNhanVien || "").toLowerCase().includes(key) ||
        String(nv.tenNhanVien || "").toLowerCase().includes(key) ||
        String(nv.soDienThoai || "").toLowerCase().includes(key) ||
        String(nv.chucVu || "").toLowerCase().includes(key)
      );
    });
  }
  return list;
}

function QLNV_veBang() {
  const tbody = document.getElementById("QLNV_tableBody");
  if (!tbody) return;
  const list = QLNV_layDanhSachLoc();
  const totalPages = Math.max(1, Math.ceil(list.length / QLNV_soDongMoiTrang));
  QLNV_trangHienTai = Math.min(Math.max(QLNV_trangHienTai, 1), totalPages);
  const start = (QLNV_trangHienTai - 1) * QLNV_soDongMoiTrang;
  const pageItems = list.slice(start, start + QLNV_soDongMoiTrang);

  tbody.innerHTML = "";
  pageItems.forEach((nv) => {
    const row = document.createElement("tr");
    const trangThai = nv.trangThai === "hoatdong";
    row.innerHTML = `
      <td>${QLNV_esc(nv.maNhanVien)}</td>
      <td>${QLNV_esc(nv.tenNhanVien)}</td>
      <td>${QLNV_esc(nv.gioiTinh)}</td>
      <td>${QLNV_esc(nv.soDienThoai)}</td>
      <td>${QLNV_esc(nv.diaChi)}</td>
      <td>${QLNV_esc(nv.chucVu)}</td>
      <td>${QLNV_esc(nv.tenDangNhap)}</td>
      <td><span class="QLNV_badge ${trangThai ? "QLNV_badge-active" : "QLNV_badge-khoa"}">${trangThai ? "Hoạt động" : "Đã khóa"}</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon btn-edit" data-ma="${QLNV_esc(nv.maNhanVien)}" title="Sửa">
            <i class="fa-solid fa-pen" aria-hidden="true"></i>
          </button>
          <button class="btn-icon btn-toggle" data-ma="${QLNV_esc(nv.maNhanVien)}" title="${trangThai ? "Khóa tài khoản" : "Mở khóa tài khoản"}">
            ${trangThai ? '<i class="fa-solid fa-lock" aria-hidden="true"></i>' : '<i class="fa-solid fa-lock-open" aria-hidden="true"></i>'}
          </button>
          <button class="btn-icon btn-delete" data-ma="${QLNV_esc(nv.maNhanVien)}" title="Xóa">
            <i class="fa-solid fa-trash" aria-hidden="true"></i>
          </button>
        </div>
      </td>
    `;
    // Gắn sự kiện bằng addEventListener (không nội suy dữ liệu vào thuộc tính onclick)
    const maNv = nv.maNhanVien;
    row.querySelector(".btn-edit").addEventListener("click", function() { QLNV_moModalSua(maNv); });
    row.querySelector(".btn-toggle").addEventListener("click", function() { QLNV_khoaMoKhoa(maNv); });
    row.querySelector(".btn-delete").addEventListener("click", function() { QLNV_xoa(maNv); });
    tbody.appendChild(row);
  });

if (pageItems.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="9" style="text-align:center;color:#7c7264;padding:24px;">Không có nhân viên nào</td>`;
      tbody.appendChild(row);
    }
    QLNV_vePhanTrang(totalPages);
}

function QLNV_vePhanTrang(totalPages) {
  const info = document.getElementById("QLNV_pageInfo");
  if (info) {
    const list = QLNV_layDanhSachLoc();
    info.textContent = `Trang ${QLNV_trangHienTai} / ${totalPages} — Tổng ${list.length} nhân viên`;
  }
  const prev = document.getElementById("QLNV_btnPrev");
  const next = document.getElementById("QLNV_btnNext");
  if (prev) prev.disabled = QLNV_trangHienTai <= 1;
  if (next) next.disabled = QLNV_trangHienTai >= totalPages;
}

function QLNV_ganSuKien() {
  const search = document.getElementById("QLNV_search");
  if (search) {
    search.addEventListener("input", function() {
      QLNV_trangHienTai = 1;
      QLNV_veBang();
    });
  }

  const btnAdd = document.getElementById("QLNV_btnThemMoi");
  if (btnAdd) {
    btnAdd.addEventListener("click", function() {
      QLNV_moModalThem();
    });
  }

  const btnClose = document.getElementById("QLNV_closeModal");
  if (btnClose) {
    btnClose.addEventListener("click", QLNV_dongModal);
  }

  const btnCancel = document.getElementById("QLNV_cancelBtn");
  if (btnCancel) {
    btnCancel.addEventListener("click", QLNV_dongModal);
  }

  const btnSave = document.getElementById("QLNV_saveBtn");
  if (btnSave) {
    btnSave.addEventListener("click", QLNV_luuNhanVien);
  }

  const btnPrev = document.getElementById("QLNV_btnPrev");
  if (btnPrev) {
    btnPrev.addEventListener("click", function() {
      if (QLNV_trangHienTai > 1) {
        QLNV_trangHienTai--;
        QLNV_veBang();
      }
    });
  }

  const btnNext = document.getElementById("QLNV_btnNext");
  if (btnNext) {
    btnNext.addEventListener("click", function() {
      QLNV_trangHienTai++;
      QLNV_veBang();
    });
  }

  document.addEventListener("employeesUpdated", function() {
    QLNV_danhSach = getLocalEmployees() || [];
    QLNV_veBang();
  });
}

function QLNV_moModalThem() {
  QLNV_dangSuaMa = null;
  document.getElementById("QLNV_modalTitle").textContent = "Thêm nhân viên mới";
  document.getElementById("QLNV_maNhanVien").value = generateMaNhanVien(QLNV_danhSach);
  document.getElementById("QLNV_tenNhanVien").value = "";
  document.getElementById("QLNV_gioiTinh").value = "Nam";
  document.getElementById("QLNV_sdt").value = "";
  document.getElementById("QLNV_diaChi").value = "";
  document.getElementById("QLNV_chucVu").value = CHUC_VU_NHAN_VIEN[0];
  const userNew = document.getElementById("QLNV_username");
  userNew.value = "";
  userNew.readOnly = false;
  userNew.title = "";
  document.getElementById("QLNV_password").value = "";
  document.getElementById("QLNV_passwordRow").style.display = "";
  const modal = document.getElementById("QLNV_modal");
  if (modal) modal.style.display = "flex";
}

function QLNV_moModalSua(ma) {
  const nv = QLNV_danhSach.find((e) => e.maNhanVien === ma);
  if (!nv) return;
  QLNV_dangSuaMa = ma;
  document.getElementById("QLNV_modalTitle").textContent = "Sửa nhân viên";
  document.getElementById("QLNV_maNhanVien").value = nv.maNhanVien;
  document.getElementById("QLNV_tenNhanVien").value = nv.tenNhanVien || "";
  document.getElementById("QLNV_gioiTinh").value = nv.gioiTinh || "Nam";
  document.getElementById("QLNV_sdt").value = nv.soDienThoai || "";
  document.getElementById("QLNV_diaChi").value = nv.diaChi || "";
  document.getElementById("QLNV_chucVu").value = CHUC_VU_NHAN_VIEN.includes(nv.chucVu) ? nv.chucVu : CHUC_VU_NHAN_VIEN[0];
  const userEl = document.getElementById("QLNV_username");
  userEl.value = nv.tenDangNhap || "";
  userEl.readOnly = true; // tên đăng nhập là định danh cố định: đổi sẽ làm mất liên kết với phiếu nhập, hội thoại...
  userEl.title = "Tên đăng nhập không thể thay đổi";
  document.getElementById("QLNV_password").value = "";
  document.getElementById("QLNV_password").placeholder = "Để trống nếu giữ mật khẩu cũ";
  document.getElementById("QLNV_passwordRow").style.display = "";
  const modal = document.getElementById("QLNV_modal");
  if (modal) modal.style.display = "flex";
}

function QLNV_dongModal() {
  const modal = document.getElementById("QLNV_modal");
  if (modal) modal.style.display = "none";
}

// Đọc lại danh sách mới nhất trước khi sửa: bản lưu trong bộ nhớ có thể đã cũ
// (vd. nhân viên vừa đăng nhập ở tab khác và mật khẩu được nâng cấp sang dạng băm).
function QLNV_napLai() {
  QLNV_danhSach = getLocalEmployees() || [];
}

// Trả hội thoại đang do nhân viên này phụ trách về hàng đợi chung, để khách không bị bỏ rơi.
function QLNV_traLaiHoiThoai(nv, lyDo) {
  try {
    const threads = JSON.parse(localStorage.getItem("supportThreads") || "[]");
    if (!Array.isArray(threads)) return 0;
    let dem = 0;
    threads.forEach((t) => {
      if (!t || t.trangThai === "closed" || !t.nhanVienXuLy) return;
      const cua = (t.maNhanVienXuLy && t.maNhanVienXuLy === nv.tenDangNhap) || t.nhanVienXuLy === nv.tenNhanVien;
      if (!cua) return;
      t.nhanVienXuLy = null;
      t.maNhanVienXuLy = null;
      t.tinNhan = Array.isArray(t.tinNhan) ? t.tinNhan : [];
      t.tinNhan.push({ maTinNhan: "MSG_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8), thoiGianGui: new Date().toISOString(), loaiNguoiGui: "system", maNguoiGui: "shop", tenNguoiGui: "OOAD Shop", loaiTinNhan: "text", noiDung: "Nhân viên " + nv.tenNhanVien + " " + lyDo + ". Hội thoại đã quay lại hàng đợi để nhân viên khác tiếp nhận." });
      t.ngayCapNhat = new Date().toISOString();
      dem += 1;
    });
    if (dem) localStorage.setItem("supportThreads", JSON.stringify(threads));
    return dem;
  } catch (e) {
    return 0;
  }
}

// Nhân viên đã có dữ liệu nghiệp vụ gắn với mình (phiếu nhập, hội thoại) thì không xóa được, chỉ khóa.
function QLNV_dauVet(nv) {
  const out = [];
  try {
    const phieu = JSON.parse(localStorage.getItem("phieuNhapLocal") || "[]") || [];
    const soPhieu = phieu.filter((p) => p && [nv.tenNhanVien, nv.tenDangNhap].indexOf(p.nguoiLap) !== -1 || p && [nv.tenNhanVien, nv.tenDangNhap].indexOf(p.nguoiDuyet) !== -1).length;
    if (soPhieu) out.push(soPhieu + " phiếu nhập hàng");
    const threads = JSON.parse(localStorage.getItem("supportThreads") || "[]") || [];
    const soChat = threads.filter((t) => t && ((t.maNhanVienXuLy && t.maNhanVienXuLy === nv.tenDangNhap) || t.nhanVienXuLy === nv.tenNhanVien)).length;
    if (soChat) out.push(soChat + " hội thoại hỗ trợ");
  } catch (e) { /* bỏ qua */ }
  return out;
}

function QLNV_matKhauHopLe(pw) {
  if (pw.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự!";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Mật khẩu phải gồm cả chữ và số!";
  return "";
}

function QLNV_bamMatKhau(plain) {
  return window.PasswordUtil ? window.PasswordUtil.hash(plain) : plain;
}

function QLNV_luuNhanVien() {
  QLNV_napLai();
  const ma = document.getElementById("QLNV_maNhanVien").value.trim();
  const ten = document.getElementById("QLNV_tenNhanVien").value.trim();
  const gioiTinh = document.getElementById("QLNV_gioiTinh").value;
  const sdt = document.getElementById("QLNV_sdt").value.trim();
  const diaChi = document.getElementById("QLNV_diaChi").value.trim();
  const chucVu = document.getElementById("QLNV_chucVu").value;
  const username = document.getElementById("QLNV_username").value.trim();
  const password = document.getElementById("QLNV_password").value;

  if (!ten) return QLNV_notify("Vui lòng nhập tên nhân viên!", "error");
  if (!/^0\d{9}$/.test(sdt)) return QLNV_notify("Số điện thoại phải gồm 10 số và bắt đầu bằng 0!", "error");
  if (!diaChi) return QLNV_notify("Vui lòng nhập địa chỉ!", "error");
  if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) return QLNV_notify("Tên đăng nhập ít nhất 3 ký tự, không dấu, không khoảng trắng!", "error");

  const isEdit = !!QLNV_dangSuaMa;
  const trungUsername = QLNV_danhSach.some(
    (e) => e.maNhanVien !== ma && String(e.tenDangNhap).toLowerCase() === String(username).toLowerCase()
  );
  if (trungUsername) return QLNV_notify("Tên đăng nhập đã tồn tại!", "error");
  if (QLNV_TEN_ADMIN.indexOf(username.toLowerCase()) !== -1) {
    return QLNV_notify("Tên đăng nhập này dành cho quản trị viên, vui lòng chọn tên khác!", "error");
  }
  const trungSdt = QLNV_danhSach.some(
    (e) => e.maNhanVien !== ma && String(e.soDienThoai || "").trim() === sdt
  );
  if (trungSdt) return QLNV_notify("Số điện thoại đã được dùng cho nhân viên khác!", "error");

  if (!isEdit || password) {
    const loiMk = QLNV_matKhauHopLe(password);
    if (loiMk) return QLNV_notify(loiMk, "error");
  }

  if (isEdit) {
    const index = QLNV_danhSach.findIndex((e) => e.maNhanVien === QLNV_dangSuaMa);
    if (index === -1) return;
    const truoc = Object.assign({}, QLNV_danhSach[index]);
    QLNV_danhSach[index].tenNhanVien = ten;
    QLNV_danhSach[index].gioiTinh = gioiTinh;
    QLNV_danhSach[index].soDienThoai = sdt;
    QLNV_danhSach[index].diaChi = diaChi;
    QLNV_danhSach[index].chucVu = chucVu;
    // tenDangNhap giữ nguyên (không đổi khi sửa)
    if (password) QLNV_danhSach[index].matKhau = QLNV_bamMatKhau(password);
    saveLocalEmployees(QLNV_danhSach);
    // Đổi khỏi chức vụ CSKH hoặc đổi tên: hội thoại đang phụ trách quay lại hàng đợi (tránh gán nhầm người)
    let thongBao = "Đã cập nhật nhân viên!";
    if (truoc.chucVu !== chucVu || truoc.tenNhanVien !== ten) {
      const n = QLNV_traLaiHoiThoai(truoc, truoc.chucVu !== chucVu ? "đã chuyển sang chức vụ khác" : "đã được đổi thông tin");
      if (n) thongBao += " " + n + " hội thoại hỗ trợ đã được trả về hàng đợi.";
    }
    QLNV_notify(thongBao, "success");
  } else {
    QLNV_danhSach.push({
      maNhanVien: ma,
      tenNhanVien: ten,
      gioiTinh: gioiTinh,
      soDienThoai: sdt,
      diaChi: diaChi,
      chucVu: chucVu,
      tenDangNhap: username,
      matKhau: QLNV_bamMatKhau(password),
      ngayTao: new Date().toISOString().split("T")[0],
      trangThai: "hoatdong"
    });
    saveLocalEmployees(QLNV_danhSach);
    QLNV_notify("Đã thêm nhân viên mới!", "success");
  }

  QLNV_danhSach = getLocalEmployees() || [];
  QLNV_dongModal();
  QLNV_veBang();
}

function QLNV_khoaMoKhoa(ma) {
  QLNV_napLai();
  const index = QLNV_danhSach.findIndex((e) => e.maNhanVien === ma);
  if (index === -1) return;
  const dangKhoa = QLNV_danhSach[index].trangThai === "khoa";
  const nv = QLNV_danhSach[index];
  if (!dangKhoa && !confirm("Khóa tài khoản " + nv.tenNhanVien + "? Nhân viên sẽ bị đăng xuất ngay và các hội thoại đang phụ trách được trả về hàng đợi.")) return;
  QLNV_danhSach[index].trangThai = dangKhoa ? "hoatdong" : "khoa";
  saveLocalEmployees(QLNV_danhSach);
  let thongBao = dangKhoa ? "Đã mở khóa tài khoản nhân viên!" : "Đã khóa tài khoản nhân viên!";
  if (!dangKhoa) {
    const n = QLNV_traLaiHoiThoai(nv, "đã bị khóa tài khoản");
    if (n) thongBao += " " + n + " hội thoại hỗ trợ đã được trả về hàng đợi.";
  }
  QLNV_notify(thongBao, "success");
  QLNV_danhSach = getLocalEmployees() || [];
  QLNV_veBang();
}

function QLNV_xoa(ma) {
  QLNV_napLai();
  const nv = QLNV_danhSach.find((e) => e.maNhanVien === ma);
  if (!nv) return;
  const dauVet = QLNV_dauVet(nv);
  if (dauVet.length) {
    QLNV_notify("Không thể xóa " + nv.tenNhanVien + " vì đã có dữ liệu gắn với nhân viên này (" + dauVet.join(", ") + "). Hãy khóa tài khoản để giữ lịch sử.", "error");
    return;
  }
  if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên ${ma}?`)) return;
  QLNV_danhSach = QLNV_danhSach.filter((e) => e.maNhanVien !== ma);
  saveLocalEmployees(QLNV_danhSach);
  QLNV_notify("Đã xóa nhân viên!", "success");
  QLNV_danhSach = getLocalEmployees() || [];
  QLNV_veBang();
}