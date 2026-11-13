(function () {
  "use strict";
  const CATALOG_KEY = "shopVouchers";
  const WALLET_KEY = "voucherWallet";
  const currentUser = () => window.UserSession?.getCurrentUser?.() || null;
  const normalizeCode = (code) => String(code || "").trim().toUpperCase();
  const userId = (user) => String(user?.maKhachHang || user?.tenDangNhap || "");
  const appliedKey = () => `appliedVoucher:${userId(currentUser())}`;
  const readArray = (key) => {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(value)) throw new Error(`Dữ liệu ${key} không hợp lệ.`);
    return value;
  };
  // Dữ liệu mẫu được khởi tạo một lần. Admin có thể quản lý cùng hai khóa này.
  function danhSachVoucher() {
    if (localStorage.getItem(CATALOG_KEY) === null) {
      const end = new Date(Date.now() + 30 * 86400000).toISOString();
      const common = { thoiGianBatDau: null, thoiGianKetThuc: end, trangThai: "active", soLuongToiDa: null, soLuongMoiTaiKhoan: 1, giamToiDa: null };
      const seeds = [
        { maVoucher: "GIAYMOI10", title: "Giảm 10%", description: "Tối đa 150.000đ, đơn từ 500.000đ", loaiGiamGia: "percent", giaTriGiam: 10, giamToiDa: 150000, donHangToiThieu: 500000 },
        { maVoucher: "GIAY200K", title: "Giảm 200.000đ", description: "Đơn từ 1.500.000đ", loaiGiamGia: "fixed", giaTriGiam: 200000, donHangToiThieu: 1500000 },
        { maVoucher: "KHACHMOI", title: "Ưu đãi khách mới", description: "Giảm 50.000đ, đơn từ 300.000đ", loaiGiamGia: "fixed", giaTriGiam: 50000, donHangToiThieu: 300000 },
        { maVoucher: "FREESHIP", title: "Miễn phí vận chuyển", description: "Giảm toàn bộ phí vận chuyển", loaiGiamGia: "shipping", giaTriGiam: 0, donHangToiThieu: 0 }
      ].map((v) => ({ ...common, ...v }));
      localStorage.setItem(CATALOG_KEY, JSON.stringify(seeds));
    }
    return readArray(CATALOG_KEY);
  }
  function timVoucher(code) {
    return danhSachVoucher().find((v) => normalizeCode(v.maVoucher) === normalizeCode(code)) || null;
  }
  // Mỗi đơn chính thức là một lượt dùng. Không trừ khi chỉ nhập mã hoặc chờ chuyển khoản.
  // Không tự hoàn lượt khi hủy đơn; chính sách cấp lại thuộc quản trị voucher.
  function soLuongConLai(voucher, user = currentUser()) {
    if (!voucher || !userId(user)) return 0;
    if (Array.isArray(voucher.danhSachTaiKhoanApDung) && !voucher.danhSachTaiKhoanApDung.some((account) =>
      String(typeof account === "object" && account !== null ? account.maKhachHang : account) === userId(user))) return 0;
    const wallet = readArray(WALLET_KEY).find((w) => String(w.maKhachHang) === userId(user) && normalizeCode(w.maVoucher) === normalizeCode(voucher.maVoucher));
    const granted = Number(wallet?.soLuongDuocCap ?? voucher.soLuongMoiTaiKhoan ?? 0);
    const used = readArray("DanhSachDatHang").filter((o) =>
      String(o.maKhachHang || o.khachHang?.maKhachHang || o.voucherTaiKhoan || "") === userId(user) &&
      normalizeCode(o.maVoucher) === normalizeCode(voucher.maVoucher)).length;
    return Math.max(0, (Number.isInteger(granted) ? granted : 0) - used);
  }
  function lyDoKhongKhaDung(voucher, user = currentUser()) {
    const v = voucher && timVoucher(voucher.maVoucher);
    if (!v) return "Mã voucher không tồn tại.";
    if (!userId(user)) return "Vui lòng đăng nhập để sử dụng voucher.";
    if (v.trangThai !== "active") return "Voucher đã bị vô hiệu hóa.";
    const now = Date.now();
    const start = v.thoiGianBatDau ? Date.parse(v.thoiGianBatDau) : -Infinity;
    const endValue = /^\d{4}-\d{2}-\d{2}$/.test(v.thoiGianKetThuc || "") ? `${v.thoiGianKetThuc}T23:59:59.999` : v.thoiGianKetThuc;
    const end = endValue ? Date.parse(endValue) : Infinity;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end) return "Thời hạn voucher không hợp lệ.";
    if (now > end) return "Voucher đã hết hạn.";
    if (soLuongConLai(v, user) <= 0) return "Tài khoản đã hết lượt sử dụng voucher này.";
    const used = readArray("DanhSachDatHang").filter((o) => normalizeCode(o.maVoucher) === normalizeCode(v.maVoucher)).length;
    if (v.soLuongToiDa != null && used >= Number(v.soLuongToiDa)) return "Voucher đã hết số lượt phát hành.";
    return "";
  }
  function lyDoKhongHopLe(voucher, donHang, user = currentUser()) {
    const unavailable = lyDoKhongKhaDung(voucher, user);
    if (unavailable) return unavailable;
    const v = timVoucher(voucher.maVoucher);
    if (v.thoiGianBatDau && Date.now() < Date.parse(v.thoiGianBatDau)) return "Voucher chưa đến thời gian sử dụng.";
    const subtotal = Number(donHang?.tamTinh ?? donHang);
    if (!Number.isFinite(subtotal) || subtotal < 0) return "Giá trị đơn hàng không hợp lệ.";
    if (subtotal < Number(v.donHangToiThieu || 0)) return `Đơn hàng cần từ ${Number(v.donHangToiThieu).toLocaleString("vi-VN")}đ.`;
    if (!["percent", "fixed", "shipping"].includes(v.loaiGiamGia) || !Number.isFinite(Number(v.giaTriGiam)) || Number(v.giaTriGiam) < 0) return "Giá trị voucher không hợp lệ.";
    if (v.giamToiDa != null && (!Number.isFinite(Number(v.giamToiDa)) || Number(v.giamToiDa) < 0)) return "Giới hạn giảm không hợp lệ.";
    if (v.giamToiDa === 0 || (v.loaiGiamGia !== "shipping" && (Number(v.giaTriGiam) === 0 || subtotal === 0))) return "Voucher không tạo ra khoản giảm cho đơn hàng này.";
    if (v.loaiGiamGia === "shipping" && Number(donHang?.tienVanChuyen ?? 0) <= 0) return "Đơn hàng này đã được miễn phí vận chuyển.";
    return "";
  }
  function kiemTraHopLe(voucher, donHang) { return !lyDoKhongHopLe(voucher, donHang); }
  function tinhSoTienGiam(voucher, tamTinh, tienVanChuyen = 0, user = currentUser()) {
    if (lyDoKhongHopLe(voucher, { tamTinh, tienVanChuyen }, user)) return 0;
    const v = timVoucher(voucher.maVoucher);
    return tinhMucGiam(v, tamTinh, tienVanChuyen);
  }
  // Chỉ tính giá trị để so sánh; không thay thế kiểm tra điều kiện khi áp dụng.
  function tinhMucGiam(v, tamTinh, tienVanChuyen) {
    const base = v.loaiGiamGia === "shipping" ? Number(tienVanChuyen) : Number(tamTinh);
    const raw = v.loaiGiamGia === "percent" ? base * Number(v.giaTriGiam) / 100 : v.loaiGiamGia === "shipping" ? base : Number(v.giaTriGiam);
    return Math.max(0, Math.min(base, v.giamToiDa == null ? raw : Math.min(raw, Number(v.giamToiDa))));
  }
  function goiYVoucher(tamTinh, tienVanChuyen = 0) {
    return danhSachVoucher().filter((v) => !lyDoKhongKhaDung(v)).map((voucher) => {
      // Ẩn mã cấu hình sai thay vì gợi ý một mức giảm không thể sử dụng.
      if (!["percent", "fixed", "shipping"].includes(voucher.loaiGiamGia) ||
          !Number.isFinite(Number(voucher.giaTriGiam)) || Number(voucher.giaTriGiam) < 0 ||
          !Number.isFinite(Number(voucher.donHangToiThieu || 0)) || Number(voucher.donHangToiThieu || 0) < 0 ||
          (voucher.giamToiDa != null && (!Number.isFinite(Number(voucher.giamToiDa)) || Number(voucher.giamToiDa) <= 0)) ||
          (voucher.loaiGiamGia !== "shipping" && Number(voucher.giaTriGiam) === 0)) return null;
      const reason = lyDoKhongHopLe(voucher, { tamTinh, tienVanChuyen });
      const comparisonSubtotal = reason ? Math.max(Number(tamTinh), Number(voucher.donHangToiThieu || 0)) : Number(tamTinh);
      return { voucher, reason, soLuong: soLuongConLai(voucher),
        soTienGiam: tinhMucGiam(voucher, comparisonSubtotal, tienVanChuyen),
        canMuaThem: Math.max(0, Number(voucher.donHangToiThieu || 0) - Number(tamTinh)) };
    }).filter(Boolean).sort((a, b) => Number(!!a.reason) - Number(!!b.reason) ||
      b.soTienGiam - a.soTienGiam || a.canMuaThem - b.canMuaThem ||
      String(a.voucher.maVoucher).localeCompare(String(b.voucher.maVoucher)));
  }
  window.ShopVoucher = {
    goiYVoucher,
    list: danhSachVoucher, find: timVoucher, soLuongConLai, lyDoKhongHopLe,
    kiemTraHopLe, tinhSoTienGiam, discount: tinhSoTienGiam,
    getApplied() {
      try { const saved = JSON.parse(localStorage.getItem(appliedKey()) || "null"); return saved ? timVoucher(saved.maVoucher) : null; }
      catch (_) { return null; }
    },
    apply(code, tamTinh, tienVanChuyen = 0) {
      try {
        const voucher = timVoucher(code);
        const message = lyDoKhongHopLe(voucher, { tamTinh, tienVanChuyen });
        if (message) return { ok: false, message };
        const discount = tinhSoTienGiam(voucher, tamTinh, tienVanChuyen);
        if (discount <= 0) return { ok: false, message: "Voucher không tạo ra khoản giảm cho đơn hàng này." };
        localStorage.setItem(appliedKey(), JSON.stringify({ maVoucher: voucher.maVoucher }));
        return { ok: true, voucher, discount };
      } catch (_) { return { ok: false, message: "Không thể đọc hoặc lưu voucher. Vui lòng thử lại." }; }
    },
    clear() { localStorage.removeItem(appliedKey()); },
    // Kiểm tra lại đơn chờ chuyển khoản, tránh dùng voucher hết hạn/hết lượt hoặc giá đã đổi.
    kiemTraVoucherDonHang(order) {
      if (!order.maVoucher) return { ok: true };
      try {
        const user = currentUser();
        if (String(order.maKhachHang || order.voucherTaiKhoan || "") !== userId(user)) return { ok: false, message: "Voucher không thuộc tài khoản đang đăng nhập." };
        const voucher = timVoucher(order.maVoucher);
        const message = lyDoKhongHopLe(voucher, order, user);
        if (message) return { ok: false, message };
        if (tinhSoTienGiam(voucher, order.tamTinh, order.tienVanChuyen, user) !== Number(order.giamGia)) return { ok: false, message: "Voucher đã thay đổi. Vui lòng quay lại thanh toán để áp dụng lại." };
        return { ok: true };
      } catch (_) { return { ok: false, message: "Không thể kiểm tra số lượng voucher. Vui lòng thử lại." }; }
    }
  };
})();
