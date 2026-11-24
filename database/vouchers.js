// =========================================================
// KHO VOUCHER CHO TRANG QUẢN TRỊ — UC61 (Quản lý voucher), UC62 (Phát và thu hồi voucher)
// Tên thuộc tính theo bảng VOUCHER / VOUCHERKHACHHANG (database/SQL_WSBG.sql) và class Voucher (ClassDiagram).
//   localStorage "shopVouchers"     : danh sách voucher (dùng chung với assets/js/user/payment/voucher.js)
//   localStorage "voucherKhachHang" : các lần phát voucher riêng cho khách
// Trang thanh toán của khách (voucher.js) đọc các trường cũ (title, loaiGiamGia, donHangToiThieu, thoiGianKetThuc,
// trangThai "active", soLuongToiDa, danhSachTaiKhoanApDung, voucherWallet) nên khi lưu, kho ghi kèm các trường đó.
// =========================================================
(function () {
  "use strict";

  const KEY_VOUCHER = "shopVouchers";
  const KEY_PHAT = "voucherKhachHang";
  const KEY_VI = "voucherWallet";

  // Voucher mặc định của cửa hàng (giống dữ liệu khởi tạo trong voucher.js) — dùng cho "Khôi phục voucher mặc định".
  function macDinh() {
    const het = new Date(Date.now() + 30 * 86400000).toISOString();
    const chung = { thoiGianBatDau: null, thoiGianKetThuc: het, trangThai: "active", soLuongToiDa: null, soLuongMoiTaiKhoan: 1, giamToiDa: null };
    return [
      { maVoucher: "GIAYMOI10", title: "Giảm 10%", description: "Tối đa 150.000đ, đơn từ 500.000đ", loaiGiamGia: "percent", giaTriGiam: 10, giamToiDa: 150000, donHangToiThieu: 500000 },
      { maVoucher: "GIAY200K", title: "Giảm 200.000đ", description: "Đơn từ 1.500.000đ", loaiGiamGia: "fixed", giaTriGiam: 200000, donHangToiThieu: 1500000 },
      { maVoucher: "KHACHMOI", title: "Ưu đãi khách mới", description: "Giảm 50.000đ, đơn từ 300.000đ", loaiGiamGia: "fixed", giaTriGiam: 50000, donHangToiThieu: 300000 },
      { maVoucher: "FREESHIP", title: "Miễn phí vận chuyển", description: "Giảm toàn bộ phí vận chuyển", loaiGiamGia: "shipping", giaTriGiam: 0, donHangToiThieu: 0 }
    ].map((v) => Object.assign({}, chung, v));
  }

  const maChuan = (code) => String(code || "").trim().toUpperCase();
  const p2 = (n) => String(n).padStart(2, "0");
  const ngay = (x) => {
    if (!x) return "";
    const s = String(x);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    return isNaN(d.getTime()) ? "" : `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  };
  const homNay = () => ngay(new Date());
  const soHoacNull = (x) => (x === null || x === undefined || x === "" || !Number.isFinite(Number(x)) ? null : Number(x));

  function docMang(key) {
    try { const v = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function ghi(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    try { window.dispatchEvent(new CustomEvent("vouchersUpdated")); } catch (e) { /* bỏ qua */ }
  }
  function docVoucherGoc() {
    if (localStorage.getItem(KEY_VOUCHER) === null) ghi(KEY_VOUCHER, macDinh());
    return docMang(KEY_VOUCHER).filter((v) => v && v.maVoucher);
  }

  // Bản xem theo tên thuộc tính của bảng VOUCHER (đọc được cả dữ liệu cũ).
  function xem(g) {
    const loaiCu = g.loaiGiam || g.loaiGiamGia;
    const rieng = g.doiTuongSuDung === "RIENG_KHACH" || (!g.doiTuongSuDung && Array.isArray(g.danhSachTaiKhoanApDung));
    return {
      maVoucher: maChuan(g.maVoucher),
      tenVoucher: String(g.tenVoucher ?? g.title ?? g.maVoucher),
      moTa: String(g.moTa ?? g.description ?? ""),
      loaiGiam: loaiCu === "PHAN_TRAM" || loaiCu === "percent" ? "PHAN_TRAM" : loaiCu === "shipping" ? "MIEN_PHI_VAN_CHUYEN" : "SO_TIEN",
      giaTriGiam: Number(g.giaTriGiam) || 0,
      giamToiDa: soHoacNull(g.giamToiDa),
      donToiThieu: Number(g.donToiThieu ?? g.donHangToiThieu ?? 0) || 0,
      ngayBatDau: ngay(g.ngayBatDau || g.thoiGianBatDau),
      ngayKetThuc: ngay(g.ngayKetThuc || g.thoiGianKetThuc),
      ngayPhatHanh: ngay(g.ngayPhatHanh),
      doiTuongSuDung: rieng ? "RIENG_KHACH" : "TAT_CA",
      soLuongPhatHanh: soHoacNull(g.soLuongPhatHanh ?? g.soLuongToiDa),
      soLuongMoiTaiKhoan: Number(g.soLuongMoiTaiKhoan) || 1,
      mucCanhBaoSoLuong: Number(g.mucCanhBaoSoLuong) || 0,
      trangThai: g.trangThai === "active" || g.trangThai === "HOAT_DONG" ? "HOAT_DONG" : "TAM_DUNG",
      chiKhachMoi: g.chiKhachMoi === true,
      choPhepCSKHPhat: rieng && g.choPhepCSKHPhat === true,
      maNhanVien: String(g.maNhanVien || "")
    };
  }

  function xemDanhSachVoucher() { return docVoucherGoc().map(xem); }
  function tim(ma) { const m = maChuan(ma); return xemDanhSachVoucher().find((v) => v.maVoucher === m) || null; }

  // ---------- Đơn hàng (đơn khách + đơn quản trị, gộp theo mã đơn) ----------
  function donHang() {
    const map = new Map();
    docMang("DanhSachDatHang").forEach((o) => { if (o && o.maDonHang) map.set(o.maDonHang, Object.assign({}, o)); });
    docMang("ordersLocal").forEach((o) => {
      if (!o || !o.maDonHang) return;
      const cu = map.get(o.maDonHang) || {};
      map.set(o.maDonHang, Object.assign({}, o, cu, { trangThaiQuanTri: o.trangThaiQuanTri || cu.trangThaiQuanTri }));
    });
    return Array.from(map.values());
  }
  const daHuy = (o) => o.trangThaiQuanTri === "huy" || o.trangThai === "da-huy";
  const khachCuaDon = (o) => String(o.maKhachHang || (o.khachHang && o.khachHang.maKhachHang) || o.voucherTaiKhoan || "");
  // Lượt dùng = đơn còn hiệu lực có mã voucher (đơn đã hủy được trả lượt cho khách).
  function donDungVoucher(ma, maKhachHang) {
    const m = maChuan(ma);
    return donHang().filter((o) => !daHuy(o) && maChuan(o.maVoucher) === m &&
      (maKhachHang === undefined || khachCuaDon(o) === String(maKhachHang)));
  }
  const demSoVoucherDaDung = (ma) => donDungVoucher(ma).length;
  const coDonSuDung = (ma) => donHang().some((o) => maChuan(o.maVoucher) === maChuan(ma));

  // ---------- Lần phát (VOUCHERKHACHHANG) ----------
  const lanPhat = () => docMang(KEY_PHAT);
  // Đã thu hồi: lưu sẵn. Còn lại suy từ đơn hàng: khách đã dùng k lần thì k lần phát sớm nhất là "Đã dùng".
  function trangThaiLanPhat(lp, tatCa) {
    if (lp.daThuHoi) return "DA_THU_HOI";
    const cung = (tatCa || lanPhat())
      .filter((x) => !x.daThuHoi && x.maVoucher === lp.maVoucher && String(x.maKhachHang) === String(lp.maKhachHang))
      .sort((a, b) => String(a.ngayNhap).localeCompare(String(b.ngayNhap)) || String(a.maLanPhat).localeCompare(String(b.maLanPhat)));
    const daDung = donDungVoucher(lp.maVoucher, lp.maKhachHang).length;
    return cung.findIndex((x) => x.maLanPhat === lp.maLanPhat) < daDung ? "DA_DUNG" : "CHUA_DUNG";
  }
  const soLanDaPhat = (ma) => lanPhat().filter((x) => x.maVoucher === maChuan(ma)).length;
  const soLanPhatConHieuLuc = (ma) => lanPhat().filter((x) => x.maVoucher === maChuan(ma) && !x.daThuHoi).length;
  function lichSuPhat() {
    const tatCa = lanPhat();
    return tatCa.map((x) => Object.assign({}, x, { trangThai: trangThaiLanPhat(x, tatCa) }))
      .sort((a, b) => String(b.ngayNhap).localeCompare(String(a.ngayNhap)));
  }

  // Đồng bộ voucher riêng sang các trường trang thanh toán đọc: danhSachTaiKhoanApDung + voucherWallet.soLuongDuocCap.
  function dongBoRieng(ma, goc) {
    const m = maChuan(ma);
    const conHieuLuc = lanPhat().filter((x) => x.maVoucher === m && !x.daThuHoi);
    const dem = {};
    conHieuLuc.forEach((x) => { dem[x.maKhachHang] = (dem[x.maKhachHang] || 0) + 1; });
    const ds = goc || docVoucherGoc();
    const v = ds.find((x) => maChuan(x.maVoucher) === m);
    if (v) {
      if (xem(v).doiTuongSuDung === "RIENG_KHACH") v.danhSachTaiKhoanApDung = Object.keys(dem);
      else delete v.danhSachTaiKhoanApDung;
      if (!goc) ghi(KEY_VOUCHER, ds);
    }
    // Voucher công khai: không đụng tới ví voucher.
    if (!v || xem(v).doiTuongSuDung !== "RIENG_KHACH") return;
    const vi = docMang(KEY_VI).filter((w) => maChuan(w.maVoucher) !== m);
    Object.keys(dem).forEach((kh) => vi.push({ maKhachHang: kh, maVoucher: m, soLuongDuocCap: dem[kh] }));
    ghi(KEY_VI, vi);
  }

  // ---------- Tình trạng ----------
  const TEN_TINH_TRANG = { DANG_CHAY: "Đang chạy", TAM_DUNG: "Tạm dừng", CHUA_TOI_NGAY: "Chưa tới ngày", HET_HAN: "Hết hạn", HET_LUOT: "Hết lượt" };
  function tinhTrang(v) {
    if (v.trangThai === "TAM_DUNG") return "TAM_DUNG";
    const hn = homNay();
    if (v.ngayBatDau && hn < v.ngayBatDau) return "CHUA_TOI_NGAY";
    if (v.ngayKetThuc && hn > v.ngayKetThuc) return "HET_HAN";
    if (v.soLuongPhatHanh !== null) {
      const daSuDung = v.doiTuongSuDung === "RIENG_KHACH" ? soLanPhatConHieuLuc(v.maVoucher) : demSoVoucherDaDung(v.maVoucher);
      if (daSuDung >= v.soLuongPhatHanh) return "HET_LUOT";
    }
    return "DANG_CHAY";
  }

  // ---------- UC61: thêm / sửa / tạm dừng / xóa ----------
  function kiemTra(v, maCu) {
    if (!v.maVoucher) return "Vui lòng nhập mã voucher.";
    if (!/^[A-Z0-9_-]{3,30}$/.test(v.maVoucher)) return "Mã voucher gồm 3–30 ký tự chữ, số, gạch ngang hoặc gạch dưới, không dấu, không khoảng trắng.";
    if (xemDanhSachVoucher().some((x) => x.maVoucher === v.maVoucher && x.maVoucher !== maCu)) return "Mã voucher đã tồn tại.";
    if (!v.tenVoucher) return "Vui lòng nhập tên chương trình.";
    if (v.tenVoucher.length > 150) return "Tên chương trình tối đa 150 ký tự.";
    if (v.loaiGiam !== "MIEN_PHI_VAN_CHUYEN") {
      if (!(v.giaTriGiam > 0)) return "Giá trị giảm phải lớn hơn 0.";
      if (v.loaiGiam === "PHAN_TRAM" && v.giaTriGiam > 100) return "Giảm theo phần trăm không được vượt 100%.";
      if (v.loaiGiam === "SO_TIEN" && v.giaTriGiam > v.donToiThieu) return "Số tiền giảm không được lớn hơn đơn tối thiểu.";
    }
    if (v.giamToiDa !== null && !(v.giamToiDa > 0)) return "Giảm tối đa phải lớn hơn 0 (hoặc để trống).";
    if (!(v.donToiThieu >= 0)) return "Đơn tối thiểu không hợp lệ.";
    if (!v.ngayBatDau || !v.ngayKetThuc) return "Vui lòng chọn ngày bắt đầu và hạn dùng.";
    if (v.ngayKetThuc < v.ngayBatDau) return "Hạn dùng phải từ ngày bắt đầu trở đi.";
    if (!Number.isInteger(v.soLuongMoiTaiKhoan) || v.soLuongMoiTaiKhoan < 1) return "Số lượt mỗi tài khoản phải là số nguyên từ 1 trở lên.";
    if (!Number.isInteger(v.soLuongPhatHanh) || v.soLuongPhatHanh < 1) return "Tổng lượt phát hành phải là số nguyên từ 1 trở lên.";
    if (maCu) {
      const cu = tim(maCu);
      if (cu && cu.doiTuongSuDung !== v.doiTuongSuDung && (coDonSuDung(maCu) || soLanDaPhat(maCu) > 0)) {
        return "Voucher đã có đơn sử dụng hoặc đã được phát nên không đổi được phạm vi.";
      }
    }
    return "";
  }

  // duLieu: các trường theo bảng VOUCHER; maCu: mã voucher đang sửa (rỗng = thêm mới);
  // nguoiThucHien: { ma, ten, chucVu, laAdmin, laCSKH }
  function ghiVoucher(duLieu, maCu, nguoiThucHien) {
    const ds = docVoucherGoc();
    const iCu = maCu ? ds.findIndex((x) => maChuan(x.maVoucher) === maChuan(maCu)) : -1;
    if (maCu && iCu < 0) return { ok: false, message: "Voucher không còn tồn tại." };
    const goc = iCu >= 0 ? ds[iCu] : {};
    const cu = iCu >= 0 ? xem(goc) : null;
    const laAdmin = !!(nguoiThucHien && nguoiThucHien.laAdmin);
    const v = {
      maVoucher: cu ? cu.maVoucher : maChuan(duLieu.maVoucher),
      tenVoucher: String(duLieu.tenVoucher || "").trim(),
      moTa: String(duLieu.moTa || "").trim(),
      loaiGiam: cu && cu.loaiGiam === "MIEN_PHI_VAN_CHUYEN" ? "MIEN_PHI_VAN_CHUYEN" : (duLieu.loaiGiam === "PHAN_TRAM" ? "PHAN_TRAM" : "SO_TIEN"),
      giaTriGiam: Number(duLieu.giaTriGiam),
      giamToiDa: duLieu.loaiGiam === "PHAN_TRAM" ? soHoacNull(duLieu.giamToiDa) : null,
      donToiThieu: duLieu.donToiThieu === "" || duLieu.donToiThieu === undefined ? 0 : Number(duLieu.donToiThieu),
      ngayBatDau: ngay(duLieu.ngayBatDau),
      ngayKetThuc: ngay(duLieu.ngayKetThuc),
      ngayPhatHanh: cu && cu.ngayPhatHanh ? cu.ngayPhatHanh : homNay(),
      doiTuongSuDung: duLieu.doiTuongSuDung === "RIENG_KHACH" ? "RIENG_KHACH" : "TAT_CA",
      soLuongPhatHanh: Number(duLieu.soLuongPhatHanh),
      soLuongMoiTaiKhoan: Number(duLieu.soLuongMoiTaiKhoan),
      mucCanhBaoSoLuong: cu ? cu.mucCanhBaoSoLuong : 0,
      trangThai: duLieu.trangThai === "TAM_DUNG" ? "TAM_DUNG" : "HOAT_DONG",
      chiKhachMoi: duLieu.chiKhachMoi === true,
      choPhepCSKHPhat: false,
      maNhanVien: cu && cu.maNhanVien ? cu.maNhanVien : (nguoiThucHien && nguoiThucHien.ma) || ""
    };
    if (v.loaiGiam === "MIEN_PHI_VAN_CHUYEN") { v.giaTriGiam = 0; v.giamToiDa = null; }
    // Chỉ Admin được bật "Cho phép nhân viên CSKH phát"; nhân viên bán hàng sửa thì giữ nguyên giá trị cũ.
    if (v.doiTuongSuDung === "RIENG_KHACH") v.choPhepCSKHPhat = laAdmin ? duLieu.choPhepCSKHPhat === true : !!(cu && cu.choPhepCSKHPhat);
    const loi = kiemTra(v, cu ? cu.maVoucher : "");
    if (loi) return { ok: false, message: loi };

    const moi = Object.assign({}, goc, v, {
      // Các trường trang thanh toán của khách đang đọc
      title: v.tenVoucher,
      description: v.moTa,
      loaiGiamGia: v.loaiGiam === "PHAN_TRAM" ? "percent" : v.loaiGiam === "MIEN_PHI_VAN_CHUYEN" ? "shipping" : "fixed",
      donHangToiThieu: v.donToiThieu,
      thoiGianBatDau: v.ngayBatDau,
      thoiGianKetThuc: v.ngayKetThuc,
      soLuongToiDa: v.soLuongPhatHanh,
      trangThai: v.trangThai === "HOAT_DONG" ? "active" : "inactive"
    });
    if (iCu >= 0) ds[iCu] = moi; else ds.unshift(moi);
    dongBoRieng(v.maVoucher, ds);
    ghi(KEY_VOUCHER, ds);
    return { ok: true, voucher: xem(moi) };
  }

  // Class Voucher: themVoucher(thongTinVoucher), suaVoucher(thongTinMoi)
  function themVoucher(thongTinVoucher, nguoiThucHien) { return ghiVoucher(thongTinVoucher, "", nguoiThucHien); }
  function suaVoucher(maVoucher, thongTinMoi, nguoiThucHien) { return ghiVoucher(thongTinMoi, maVoucher, nguoiThucHien); }

  function datTrangThai(ma, trangThai) {
    const ds = docVoucherGoc();
    const g = ds.find((x) => maChuan(x.maVoucher) === maChuan(ma));
    if (!g) return { ok: false, message: "Voucher không còn tồn tại." };
    g.trangThai = trangThai === "TAM_DUNG" ? "inactive" : "active";
    ghi(KEY_VOUCHER, ds);
    return { ok: true };
  }

  // Class Voucher: voHieuHoaVoucher() — tạm dừng; kichHoatVoucher — bật lại (UC61 cần, class chưa có)
  function voHieuHoaVoucher(maVoucher) { return datTrangThai(maVoucher, "TAM_DUNG"); }
  function kichHoatVoucher(maVoucher) { return datTrangThai(maVoucher, "HOAT_DONG"); }

  // Chỉ xóa voucher chưa có đơn nào sử dụng; xóa luôn các lần đã phát của voucher đó.
  function xoaVoucher(ma) {
    const m = maChuan(ma);
    if (!tim(m)) return { ok: false, message: "Voucher không còn tồn tại." };
    if (coDonSuDung(m)) return { ok: false, message: "Mã đã có đơn sử dụng nên không xóa được, chỉ có thể tạm dừng." };
    ghi(KEY_VOUCHER, docVoucherGoc().filter((x) => maChuan(x.maVoucher) !== m));
    ghi(KEY_PHAT, lanPhat().filter((x) => x.maVoucher !== m));
    ghi(KEY_VI, docMang(KEY_VI).filter((w) => maChuan(w.maVoucher) !== m));
    return { ok: true };
  }

  // Chỉ Admin: đưa các voucher mặc định về cấu hình ban đầu (thêm lại nếu đã bị xóa), không đụng voucher khác.
  function khoiPhucMacDinh() {
    const ds = docVoucherGoc();
    macDinh().forEach((mac) => {
      const i = ds.findIndex((x) => maChuan(x.maVoucher) === mac.maVoucher);
      if (i >= 0) ds[i] = mac; else ds.push(mac);
    });
    ghi(KEY_VOUCHER, ds);
    return { ok: true, soLuong: macDinh().length };
  }

  // ---------- UC62: phát / thu hồi ----------
  function duocPhat(v, nguoiThucHien) {
    if (!v || v.doiTuongSuDung !== "RIENG_KHACH") return false;
    if (nguoiThucHien && nguoiThucHien.laCSKH && !v.choPhepCSKHPhat) return false;
    return true;
  }

  function phatVoucher(maVoucher, dsMaKhachHang, lyDo, nguoiThucHien) {
    const v = maVoucher ? tim(maVoucher) : null;
    if (!v) return { ok: false, message: "Vui lòng chọn voucher cần phát." };
    const khach = Array.from(new Set((dsMaKhachHang || []).map(String).filter(Boolean)));
    if (!khach.length) return { ok: false, message: "Vui lòng chọn ít nhất một khách hàng." };
    if (v.doiTuongSuDung !== "RIENG_KHACH") return { ok: false, message: "Voucher phạm vi Công khai không phát được vì ai cũng dùng được bằng mã." };
    if (!duocPhat(v, nguoiThucHien)) return { ok: false, message: "Bạn không có quyền phát voucher này." };
    const tt = tinhTrang(v);
    if (tt !== "DANG_CHAY") return { ok: false, message: `Voucher đang ở trạng thái "${TEN_TINH_TRANG[tt]}" nên không phát được.` };
    const tatCa = lanPhat();
    const nhan = [];
    let boQua = 0;
    // Khách đang có voucher này chưa dùng thì bỏ qua, không phát trùng.
    khach.forEach((ma) => {
      const dangCo = tatCa.some((x) => x.maVoucher === v.maVoucher && String(x.maKhachHang) === ma && trangThaiLanPhat(x, tatCa) === "CHUA_DUNG");
      if (dangCo) boQua++; else nhan.push(ma);
    });
    if (v.soLuongPhatHanh !== null) {
      const conLai = v.soLuongPhatHanh - soLanPhatConHieuLuc(v.maVoucher);
      if (nhan.length > conLai) return { ok: false, message: `Voucher chỉ còn ${Math.max(0, conLai)} lượt phát hành, không đủ cho ${nhan.length} khách.` };
    }
    const bayGio = new Date().toISOString();
    const moi = nhan.map((ma, i) => ({
      maLanPhat: "LP" + Date.now() + "_" + i,
      maVoucher: v.maVoucher,
      maKhachHang: ma,
      ngayNhap: bayGio,
      maNguoiPhat: (nguoiThucHien && nguoiThucHien.ma) || "",
      tenNguoiPhat: (nguoiThucHien && nguoiThucHien.ten) || "",
      chucVuNguoiPhat: (nguoiThucHien && nguoiThucHien.chucVu) || "",
      lyDo: String(lyDo || "").trim(),
      daThuHoi: false, maNguoiThuHoi: "", tenNguoiThuHoi: "", ngayThuHoi: ""
    }));
    if (moi.length) {
      ghi(KEY_PHAT, tatCa.concat(moi));
      dongBoRieng(v.maVoucher);
    }
    return { ok: true, daNhan: moi.length, boQua };
  }

  function thuHoiVoucher(maLanPhat, nguoiThucHien) {
    if (nguoiThucHien && nguoiThucHien.laCSKH) return { ok: false, message: "Nhân viên CSKH không có quyền thu hồi voucher." };
    const tatCa = lanPhat();
    const lp = tatCa.find((x) => x.maLanPhat === maLanPhat);
    if (!lp) return { ok: false, message: "Lần phát không còn tồn tại." };
    const tt = trangThaiLanPhat(lp, tatCa);
    if (tt === "DA_DUNG") return { ok: false, message: "Khách đã dùng voucher này nên không thu hồi được." };
    if (tt === "DA_THU_HOI") return { ok: false, message: "Lần phát này đã được thu hồi." };
    Object.assign(lp, {
      daThuHoi: true,
      maNguoiThuHoi: (nguoiThucHien && nguoiThucHien.ma) || "",
      tenNguoiThuHoi: (nguoiThucHien && nguoiThucHien.ten) || "",
      ngayThuHoi: new Date().toISOString()
    });
    ghi(KEY_PHAT, tatCa);
    dongBoRieng(lp.maVoucher);
    return { ok: true };
  }

  window.VoucherStore = {
    KEY_VOUCHER, KEY_PHAT, TEN_TINH_TRANG, maChuan, homNay,
    xemDanhSachVoucher, tim, tinhTrang,
    demSoVoucherDaDung, coDonSuDung, soLanDaPhat, soLanPhatConHieuLuc, lichSuPhat,
    themVoucher, suaVoucher, voHieuHoaVoucher, kichHoatVoucher, xoaVoucher, khoiPhucMacDinh,
    duocPhat, phatVoucher, thuHoiVoucher
  };
})();
