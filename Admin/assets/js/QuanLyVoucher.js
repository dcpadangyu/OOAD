// =========================================================
// QUẢN LÝ VOUCHER — UC61 (Quản lý voucher) và UC62 (Phát và thu hồi voucher cho khách hàng)
// Quyền: Admin và Nhân viên bán hàng dùng cả 2 tab; Nhân viên CSKH chỉ có tab Phân phát voucher
// (chỉ voucher Admin cho phép, không thu hồi, chỉ xem lịch sử do mình phát).
// =========================================================
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const S = () => window.VoucherStore;
  const esc = (v) => String(v === undefined || v === null ? "" : v)
    .replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";
  const fmtNgay = (s) => (s ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? s + "T00:00:00" : s).toLocaleDateString("vi-VN") : "—");
  const fmtGio = (s) => (s ? new Date(s).toLocaleString("vi-VN") : "");
  const TEN_TT_PHAT = { CHUA_DUNG: "Chưa dùng", DA_DUNG: "Đã dùng", DA_THU_HOI: "Đã thu hồi" };

  function thongBao(msg, type) {
    if (window.AdminDashboard && typeof AdminDashboard.showNotification === "function") AdminDashboard.showNotification(msg, type || "success");
    else alert(msg);
  }

  // ---------- Người đang đăng nhập ----------
  function nguoiDung() {
    const a = typeof adminSession !== "undefined" ? adminSession.getCurrentAdmin() : null;
    if (!a) return null;
    const laNV = a.isNhanVien === true;
    let ma = a.username;
    if (laNV && typeof findNhanVienByUsername === "function") {
      const nv = findNhanVienByUsername(a.username);
      if (nv && nv.maNhanVien) ma = nv.maNhanVien;
    }
    return {
      ma, ten: a.fullName || a.username,
      chucVu: laNV ? a.role : "Admin",
      laAdmin: !laNV,
      laBanHang: laNV && a.role === "Nhân viên bán hàng",
      laCSKH: laNV && a.role === "Nhân viên CSKH"
    };
  }
  const quanLyDuoc = (u) => !!u && (u.laAdmin || u.laBanHang); // UC61
  const phatDuoc = (u) => !!u && (u.laAdmin || u.laBanHang || u.laCSKH); // UC62

  // ---------- Khách hàng ----------
  function maKhach(u) {
    if (u.maKhachHang) return String(u.maKhachHang);
    const ten = String(u.tenDangNhap || u.hoTen || "").trim();
    const id = (String(u.thuDienTu || "").trim() || ten || "user").toLowerCase();
    return `user_${id.replace(/[^a-z0-9]+/g, "_")}`;
  }
  function dsKhach() {
    let list = [];
    try { list = JSON.parse(localStorage.getItem("userList") || "[]"); } catch (e) { list = []; }
    return (Array.isArray(list) ? list : []).filter(Boolean).map((u) => ({
      ma: maKhach(u), maHienThi: u.maKH || maKhach(u), hoTen: u.hoTen || u.tenDangNhap || "",
      email: u.thuDienTu || "", sdt: u.soDienThoai || "",
      biKhoa: u.biKhoa === true || u.trangThai === "blocked"
    }));
  }
  const tenKhach = (ma) => { const k = dsKhach().find((x) => x.ma === String(ma)); return k ? `${k.hoTen} (${k.maHienThi})` : ma; };

  // ---------- Tab ----------
  let tab = "list";
  function chonTab(t) {
    const u = nguoiDung();
    if (!quanLyDuoc(u)) t = "phat";
    tab = t;
    document.querySelectorAll("#QLV_tabs .QLV_tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    $("QLV_panelList").hidden = tab !== "list";
    $("QLV_panelPhat").hidden = tab !== "phat";
    if (tab === "list") veDanhSach(); else vePhat();
  }

  // ---------- UC61: danh sách ----------
  function moTaGiam(v) {
    if (v.loaiGiam === "PHAN_TRAM") return `${v.giaTriGiam}%` + (v.giamToiDa ? `<span class="QLV_sub">Tối đa ${money(v.giamToiDa)}</span>` : "");
    if (v.loaiGiam === "MIEN_PHI_VAN_CHUYEN") return "Miễn phí vận chuyển";
    return money(v.giaTriGiam);
  }

  function veDanhSach() {
    const store = S();
    const u = nguoiDung();
    const ds = store.xemDanhSachVoucher();
    const tt = ds.map((v) => store.tinhTrang(v));
    const luotDung = ds.reduce((s, v) => s + store.demSoVoucherDaDung(v.maVoucher), 0);
    const lanPhat = ds.reduce((s, v) => s + store.soLanDaPhat(v.maVoucher), 0);
    const the = (ten, so) => `<div class="QLV_card"><span>${ten}</span><strong>${so}</strong></div>`;
    $("QLV_cards").innerHTML = [
      the("Tổng voucher", ds.length),
      the("Đang chạy", tt.filter((x) => x === "DANG_CHAY").length),
      the("Tạm dừng", tt.filter((x) => x === "TAM_DUNG").length),
      the("Hết hạn / hết lượt", tt.filter((x) => x === "HET_HAN" || x === "HET_LUOT").length),
      the("Lượt đã dùng", luotDung),
      the("Lần đã phát", lanPhat)
    ].join("");

    $("QLV_tbody").innerHTML = ds.length ? ds.map((v, i) => {
      const t = tt[i];
      const rieng = v.doiTuongSuDung === "RIENG_KHACH";
      const tags = [v.chiKhachMoi ? '<span class="QLV_tag blue">Khách mới</span>' : "", rieng && v.choPhepCSKHPhat ? '<span class="QLV_tag pink">CSKH được phát</span>' : ""].join("");
      const tong = v.soLuongPhatHanh === null ? "Không giới hạn" : v.soLuongPhatHanh;
      return `<tr data-ma="${esc(v.maVoucher)}">
        <td><span class="QLV_code">${esc(v.maVoucher)}</span></td>
        <td>${esc(v.tenVoucher)}${v.moTa ? `<span class="QLV_sub">${esc(v.moTa)}</span>` : ""}${tags ? `<div>${tags}</div>` : ""}</td>
        <td>${moTaGiam(v)}</td>
        <td>${money(v.donToiThieu)}</td>
        <td>${fmtNgay(v.ngayBatDau)}<span class="QLV_sub">đến ${fmtNgay(v.ngayKetThuc)}</span></td>
        <td>${rieng ? "Riêng khách" : "Công khai"}</td>
        <td>${store.demSoVoucherDaDung(v.maVoucher)}<span class="QLV_sub">/ ${esc(tong)}${rieng ? " lượt phát" : " lượt"}</span><span class="QLV_sub">Mỗi tài khoản ${v.soLuongMoiTaiKhoan}</span></td>
        <td>${rieng ? store.soLanDaPhat(v.maVoucher) : "—"}</td>
        <td><span class="QLV_badge ${t}">${store.TEN_TINH_TRANG[t]}</span></td>
        <td><div class="QLV_actions">
          <button type="button" class="QLV_icon" data-act="sua" title="Sửa"><i class="fa-solid fa-pen"></i></button>
          <button type="button" class="QLV_icon" data-act="trangThai" title="${v.trangThai === "TAM_DUNG" ? "Kích hoạt" : "Tạm dừng"}"><i class="fa-solid ${v.trangThai === "TAM_DUNG" ? "fa-play" : "fa-pause"}"></i></button>
          <button type="button" class="QLV_icon danger" data-act="xoa" title="Xóa"><i class="fa-solid fa-trash"></i></button>
        </div></td>
      </tr>`;
    }).join("") : '<tr><td colspan="10" class="QLV_empty">Chưa có voucher nào.</td></tr>';
    $("QLV_btnKhoiPhuc").hidden = !(u && u.laAdmin);
  }

  // ---------- UC61: thêm / sửa ----------
  let dangSua = "";
  function moForm(ma) {
    const u = nguoiDung();
    if (!quanLyDuoc(u)) return;
    const v = ma ? S().tim(ma) : null;
    if (ma && !v) { thongBao("Voucher không còn tồn tại.", "error"); veDanhSach(); return; }
    dangSua = v ? v.maVoucher : "";
    $("QLV_modalTitle").textContent = v ? `Sửa voucher ${v.maVoucher}` : "Thêm voucher";
    const hn = S().homNay();
    $("QLV_ma").value = v ? v.maVoucher : "";
    $("QLV_ma").readOnly = !!v;
    $("QLV_ten").value = v ? v.tenVoucher : "";
    $("QLV_moTa").value = v ? v.moTa : "";
    const loai = $("QLV_loai");
    loai.querySelectorAll("option[value='MIEN_PHI_VAN_CHUYEN']").forEach((o) => o.remove());
    if (v && v.loaiGiam === "MIEN_PHI_VAN_CHUYEN") loai.insertAdjacentHTML("beforeend", '<option value="MIEN_PHI_VAN_CHUYEN">Miễn phí vận chuyển (dữ liệu cũ)</option>');
    loai.value = v ? v.loaiGiam : "SO_TIEN";
    loai.disabled = !!(v && v.loaiGiam === "MIEN_PHI_VAN_CHUYEN");
    $("QLV_giaTri").value = v ? v.giaTriGiam : "";
    $("QLV_giamToiDa").value = v && v.giamToiDa !== null ? v.giamToiDa : "";
    $("QLV_donToiThieu").value = v ? v.donToiThieu : 0;
    $("QLV_batDau").value = v && v.ngayBatDau ? v.ngayBatDau : hn;
    $("QLV_ketThuc").value = v && v.ngayKetThuc ? v.ngayKetThuc : "";
    $("QLV_moiTaiKhoan").value = v ? v.soLuongMoiTaiKhoan : 1;
    $("QLV_tongLuot").value = v && v.soLuongPhatHanh !== null ? v.soLuongPhatHanh : "";
    $("QLV_phamVi").value = v ? v.doiTuongSuDung : "TAT_CA";
    const khoaPhamVi = !!v && (S().coDonSuDung(v.maVoucher) || S().soLanDaPhat(v.maVoucher) > 0);
    $("QLV_phamVi").disabled = khoaPhamVi;
    $("QLV_phamViHint").hidden = !khoaPhamVi;
    $("QLV_trangThai").value = v ? v.trangThai : "HOAT_DONG";
    $("QLV_khachMoi").checked = !!(v && v.chiKhachMoi);
    $("QLV_choCSKH").checked = !!(v && v.choPhepCSKHPhat);
    $("QLV_loi").hidden = true;
    capNhatHanDung();
    capNhatForm();
    $("QLV_modal").hidden = false;
    (v ? $("QLV_ten") : $("QLV_ma")).focus();
  }
  // Hạn dùng chỉ được chọn từ ngày bắt đầu trở đi (các ngày trước bị khóa trong lịch).
  function capNhatHanDung() {
    const batDau = $("QLV_batDau").value;
    const ketThuc = $("QLV_ketThuc");
    ketThuc.min = batDau || "";
    if (batDau && ketThuc.value && ketThuc.value < batDau) ketThuc.value = "";
  }
  function dongForm() { $("QLV_modal").hidden = true; dangSua = ""; }
  // Ẩn/hiện các ô theo loại giảm và phạm vi.
  function capNhatForm() {
    const u = nguoiDung();
    const loai = $("QLV_loai").value;
    $("QLV_giamToiDaWrap").hidden = loai !== "PHAN_TRAM";
    $("QLV_giaTriLabel").textContent = loai === "PHAN_TRAM" ? "Giá trị giảm (%) *" : "Giá trị giảm (đ) *";
    $("QLV_giaTri").disabled = loai === "MIEN_PHI_VAN_CHUYEN";
    // Chỉ Admin bật được "Cho phép nhân viên CSKH phát", và chỉ với voucher Riêng khách.
    $("QLV_cskhWrap").hidden = !(u && u.laAdmin && $("QLV_phamVi").value === "RIENG_KHACH");
  }
  function luuForm(e) {
    e.preventDefault();
    const u = nguoiDung();
    if (!quanLyDuoc(u)) return;
    const thongTin = {
      maVoucher: $("QLV_ma").value,
      tenVoucher: $("QLV_ten").value,
      moTa: $("QLV_moTa").value,
      loaiGiam: $("QLV_loai").value,
      giaTriGiam: $("QLV_giaTri").value === "" ? NaN : $("QLV_giaTri").value,
      giamToiDa: $("QLV_giamToiDa").value,
      donToiThieu: $("QLV_donToiThieu").value,
      ngayBatDau: $("QLV_batDau").value,
      ngayKetThuc: $("QLV_ketThuc").value,
      soLuongMoiTaiKhoan: $("QLV_moiTaiKhoan").value === "" ? NaN : $("QLV_moiTaiKhoan").value,
      soLuongPhatHanh: $("QLV_tongLuot").value === "" ? NaN : $("QLV_tongLuot").value,
      doiTuongSuDung: $("QLV_phamVi").value,
      trangThai: $("QLV_trangThai").value,
      chiKhachMoi: $("QLV_khachMoi").checked,
      choPhepCSKHPhat: $("QLV_choCSKH").checked
    };
    const kq = dangSua ? S().suaVoucher(dangSua, thongTin, u) : S().themVoucher(thongTin, u);
    if (!kq.ok) { $("QLV_loi").textContent = kq.message; $("QLV_loi").hidden = false; return; }
    const moi = !dangSua;
    dongForm();
    thongBao(moi ? `Đã thêm voucher ${kq.voucher.maVoucher}.` : `Đã cập nhật voucher ${kq.voucher.maVoucher}.`);
    veDanhSach();
  }

  // ---------- UC61: tạm dừng / kích hoạt, xóa, khôi phục ----------
  function xuLyBang(e) {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const ma = btn.closest("tr").dataset.ma;
    const act = btn.dataset.act;
    if (act === "sua") return moForm(ma);
    const v = S().tim(ma);
    if (!v) { thongBao("Voucher không còn tồn tại.", "error"); return veDanhSach(); }
    if (act === "trangThai") {
      const moi = v.trangThai === "TAM_DUNG" ? "HOAT_DONG" : "TAM_DUNG";
      if (moi === "TAM_DUNG") S().voHieuHoaVoucher(ma); else S().kichHoatVoucher(ma);
      thongBao(moi === "TAM_DUNG" ? `Đã tạm dừng voucher ${ma}.` : `Đã kích hoạt lại voucher ${ma}.`);
      return veDanhSach();
    }
    if (act === "xoa") {
      if (S().coDonSuDung(ma)) { thongBao("Mã đã có đơn sử dụng nên không xóa được, chỉ có thể tạm dừng.", "error"); return; }
      const soLan = S().soLanDaPhat(ma);
      if (!confirm(`Xóa voucher ${ma}?` + (soLan ? `\nCác lần đã phát (${soLan}) của voucher này cũng bị xóa.` : ""))) return;
      const kq = S().xoaVoucher(ma);
      thongBao(kq.ok ? `Đã xóa voucher ${ma}.` : kq.message, kq.ok ? "success" : "error");
      veDanhSach();
    }
  }
  function khoiPhuc() {
    const u = nguoiDung();
    if (!(u && u.laAdmin)) return;
    if (!confirm("Khôi phục các voucher mặc định của cửa hàng về cấu hình ban đầu?\nCác voucher khác giữ nguyên.")) return;
    const kq = S().khoiPhucMacDinh();
    thongBao(`Đã khôi phục ${kq.soLuong} voucher mặc định.`);
    veDanhSach();
  }

  // ---------- UC62: phân phát ----------
  const daChon = new Set();
  function voucherDuocPhat(u) {
    return S().xemDanhSachVoucher().filter((v) => S().duocPhat(v, u) && S().tinhTrang(v) === "DANG_CHAY");
  }
  function veKhach() {
    const tu = $("QLV_timKhach").value.trim().toLowerCase();
    const ds = dsKhach().filter((k) => !k.biKhoa) // Khách bị khóa không xuất hiện trong danh sách chọn
      .filter((k) => !tu || [k.hoTen, k.maHienThi, k.ma, k.email, k.sdt].some((x) => String(x).toLowerCase().includes(tu)));
    const tatCa = $("QLV_phatTatCa").checked;
    $("QLV_khachList").innerHTML = ds.length ? ds.map((k) => `<label class="QLV_khachItem">
        <input type="checkbox" value="${esc(k.ma)}" ${tatCa || daChon.has(k.ma) ? "checked" : ""} ${tatCa ? "disabled" : ""}>
        <span><b>${esc(k.hoTen)}</b> · ${esc(k.maHienThi)}<span class="QLV_sub">${esc(k.email)}${k.sdt ? " · " + esc(k.sdt) : ""}</span></span>
      </label>`).join("") : '<div class="QLV_khachItem">Không có khách hàng phù hợp.</div>';
    const soKhach = tatCa ? dsKhach().filter((k) => !k.biKhoa).length : daChon.size;
    $("QLV_daChon").textContent = `Đã chọn ${soKhach} khách hàng`;
  }
  function vePhat() {
    const u = nguoiDung();
    const sel = $("QLV_phatVoucher");
    const cu = sel.value;
    const ds = voucherDuocPhat(u);
    sel.innerHTML = '<option value="">-- Chọn voucher --</option>' + ds.map((v) =>
      `<option value="${esc(v.maVoucher)}">${esc(v.maVoucher)} — ${esc(v.tenVoucher)}</option>`).join("");
    if (ds.some((v) => v.maVoucher === cu)) sel.value = cu;
    // Admin và Nhân viên bán hàng có thể chọn "Phát cho tất cả khách hàng".
    $("QLV_tatCaWrap").hidden = !(u && (u.laAdmin || u.laBanHang));
    if ($("QLV_tatCaWrap").hidden) $("QLV_phatTatCa").checked = false;
    veKhach();
    veLichSu();
  }
  function veLichSu() {
    const u = nguoiDung();
    const coThuHoi = !!u && (u.laAdmin || u.laBanHang);
    // Nhân viên CSKH chỉ xem lịch sử do mình phát.
    const ds = S().lichSuPhat().filter((x) => !(u && u.laCSKH) || String(x.maNguoiPhat) === String(u.ma));
    document.querySelectorAll("#page-vouchers .QLV_colThuHoi").forEach((th) => { th.hidden = !coThuHoi; });
    $("QLV_lichSu").innerHTML = ds.length ? ds.map((x) => `<tr data-lp="${esc(x.maLanPhat)}">
        <td>${esc(fmtGio(x.ngayNhap))}</td>
        <td><span class="QLV_code">${esc(x.maVoucher)}</span></td>
        <td>${esc(tenKhach(x.maKhachHang))}</td>
        <td>${esc(x.tenNguoiPhat)}<span class="QLV_sub">${esc(x.chucVuNguoiPhat)}</span></td>
        <td>${esc(x.lyDo) || "—"}</td>
        <td><span class="QLV_badge ${x.trangThai}">${TEN_TT_PHAT[x.trangThai]}</span>${x.trangThai === "DA_THU_HOI"
          ? `<span class="QLV_sub">${esc(x.tenNguoiThuHoi)} · ${esc(fmtGio(x.ngayThuHoi))}</span>` : ""}</td>
        ${coThuHoi ? `<td>${x.trangThai === "CHUA_DUNG" ? '<button type="button" class="QLV_linkBtn" data-act="thuHoi">Thu hồi</button>' : ""}</td>` : ""}
      </tr>`).join("") : `<tr><td colspan="${coThuHoi ? 7 : 6}" class="QLV_empty">Chưa có lần phát nào.</td></tr>`;
  }
  function ketQua(msg, ok) {
    const el = $("QLV_ketQua");
    el.textContent = msg;
    el.className = "QLV_ketQua " + (ok ? "ok" : "err");
    el.hidden = false;
  }
  function phatVoucher() {
    const u = nguoiDung();
    if (!phatDuoc(u)) return;
    const ma = $("QLV_phatVoucher").value;
    const tatCa = $("QLV_phatTatCa").checked && (u.laAdmin || u.laBanHang);
    const khach = tatCa ? dsKhach().filter((k) => !k.biKhoa).map((k) => k.ma) : Array.from(daChon);
    if (!ma) return ketQua("Vui lòng chọn voucher cần phát.", false);
    if (!khach.length) return ketQua("Vui lòng chọn ít nhất một khách hàng.", false);
    if (tatCa && !confirm(`Phát voucher ${ma} cho tất cả ${khach.length} khách hàng đang hoạt động?`)) return;
    const kq = S().phatVoucher(ma, khach, $("QLV_lyDo").value, u);
    if (!kq.ok) return ketQua(kq.message, false);
    ketQua(`Đã phát voucher ${ma} cho ${kq.daNhan} khách hàng.` + (kq.boQua ? ` Bỏ qua ${kq.boQua} khách đang có voucher này chưa dùng.` : ""), true);
    daChon.clear();
    $("QLV_phatTatCa").checked = false;
    $("QLV_lyDo").value = "";
    vePhat();
  }
  function xuLyLichSu(e) {
    const btn = e.target.closest("button[data-act='thuHoi']");
    if (!btn) return;
    const u = nguoiDung();
    if (!(u && (u.laAdmin || u.laBanHang))) return;
    const lp = btn.closest("tr").dataset.lp;
    if (!confirm("Thu hồi voucher đã phát cho khách hàng này?")) return;
    const kq = S().thuHoiVoucher(lp, u);
    thongBao(kq.ok ? "Đã thu hồi voucher." : kq.message, kq.ok ? "success" : "error");
    veLichSu();
  }

  // ---------- Khởi tạo ----------
  function apDungQuyen() {
    const u = nguoiDung();
    const ql = quanLyDuoc(u);
    $("QLV_btnThem").hidden = !ql;
    $("QLV_btnKhoiPhuc").hidden = !(u && u.laAdmin);
    const tabList = document.querySelector('#QLV_tabs [data-tab="list"]');
    if (tabList) tabList.hidden = !ql;
  }
  function lamMoi() {
    if (!document.getElementById("page-vouchers") || !S()) return;
    apDungQuyen();
    chonTab(tab);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!$("page-vouchers") || !S()) return;
    $("QLV_tabs").addEventListener("click", (e) => { const b = e.target.closest(".QLV_tab"); if (b) chonTab(b.dataset.tab); });
    $("QLV_btnThem").addEventListener("click", () => moForm(""));
    $("QLV_btnKhoiPhuc").addEventListener("click", khoiPhuc);
    $("QLV_tbody").addEventListener("click", xuLyBang);
    $("QLV_form").addEventListener("submit", luuForm);
    $("QLV_btnHuy").addEventListener("click", dongForm);
    $("QLV_btnDong").addEventListener("click", dongForm);
    $("QLV_modal").addEventListener("click", (e) => { if (e.target === $("QLV_modal")) dongForm(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("QLV_modal").hidden) dongForm(); });
    $("QLV_loai").addEventListener("change", capNhatForm);
    $("QLV_batDau").addEventListener("change", capNhatHanDung);
    $("QLV_batDau").addEventListener("input", capNhatHanDung);
    $("QLV_phamVi").addEventListener("change", capNhatForm);
    $("QLV_timKhach").addEventListener("input", veKhach);
    $("QLV_phatTatCa").addEventListener("change", veKhach);
    $("QLV_khachList").addEventListener("change", (e) => {
      if (e.target.type !== "checkbox") return;
      if (e.target.checked) daChon.add(e.target.value); else daChon.delete(e.target.value);
      veKhach();
    });
    $("QLV_btnPhat").addEventListener("click", phatVoucher);
    $("QLV_lichSu").addEventListener("click", xuLyLichSu);
    window.addEventListener("hashchange", () => { if (location.hash === "#/vouchers") lamMoi(); });
    window.addEventListener("storage", (e) => {
      if (!e.key || ["shopVouchers", "voucherKhachHang", "userList", "DanhSachDatHang", "ordersLocal"].includes(e.key)) lamMoi();
    });
    lamMoi();
  });

  window.QuanLyVoucher = { lamMoi };
})();
