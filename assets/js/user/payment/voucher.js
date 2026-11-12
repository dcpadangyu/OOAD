(function () {
  const STORAGE_KEY = "appliedVoucher";

  const vouchers = [
    {
      maVoucher: "GIAYMOI10",
      title: "Giảm 10%",
      description: "Giảm 10% tối đa 150.000đ cho đơn từ 500.000đ",
      loaiGiamGia: "percent",
      giaTriGiam: 10,
      giamToiDa: 150000,
      donHangToiThieu: 500000,
      thoiGianBatDau: null,
      thoiGianKetThuc: null,
      trangThai: "active",
      soLuongToiDa: null
    },
    {
      maVoucher: "GIAY200K",
      title: "Giảm 200.000đ",
      description: "Giảm 200.000đ cho đơn từ 1.500.000đ",
      loaiGiamGia: "fixed",
      giaTriGiam: 200000,
      donHangToiThieu: 1500000,
      giamToiDa: null, thoiGianBatDau: null, thoiGianKetThuc: null,
      trangThai: "active", soLuongToiDa: null
    },
    {
      maVoucher: "KHACHMOI",
      title: "Ưu đãi khách mới",
      description: "Giảm 50.000đ cho đơn từ 300.000đ",
      loaiGiamGia: "fixed",
      giaTriGiam: 50000,
      donHangToiThieu: 300000,
      giamToiDa: null, thoiGianBatDau: null, thoiGianKetThuc: null,
      trangThai: "active", soLuongToiDa: null
    }
  ];

  function normalizeCode(maVoucher) {
    return String(maVoucher || "").trim().toUpperCase();
  }

  function timVoucher(maVoucher) {
    const normalized = normalizeCode(maVoucher);
    return vouchers.find((voucher) => voucher.maVoucher === normalized) || null;
  }

  function kiemTraHopLe(voucher, donHang) {
    if (!voucher || voucher.trangThai === "inactive") return false;
    const now = Date.now();
    if (voucher.thoiGianBatDau && now < new Date(voucher.thoiGianBatDau).getTime()) return false;
    if (voucher.thoiGianKetThuc && now > new Date(voucher.thoiGianKetThuc).getTime()) return false;
    return Number(donHang?.tamTinh ?? donHang ?? 0) >= Number(voucher.donHangToiThieu || 0);
  }

  function tinhSoTienGiam(voucher, tamTinh) {
    if (!kiemTraHopLe(voucher, tamTinh)) return 0;
    const raw = voucher.loaiGiamGia === "percent"
      ? Number(tamTinh) * voucher.giaTriGiam / 100
      : voucher.giaTriGiam;
    return Math.max(0, Math.min(Number(tamTinh), voucher.giamToiDa ? Math.min(raw, voucher.giamToiDa) : raw));
  }

  function readApplied() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return saved && timVoucher(saved.maVoucher || saved.code) ? timVoucher(saved.maVoucher || saved.code) : null;
    } catch (_) {
      return null;
    }
  }

  function saveApplied(voucher) {
    if (voucher) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ maVoucher: voucher.maVoucher }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  window.ShopVoucher = {
    list: () => vouchers.slice(),
    find: timVoucher,
    discount: tinhSoTienGiam,
    kiemTraHopLe,
    tinhSoTienGiam,
    themVoucher(voucher) {
      if (!voucher?.maVoucher) return "";
      const normalized = { ...voucher, maVoucher: normalizeCode(voucher.maVoucher), trangThai: voucher.trangThai || "active" };
      const index = vouchers.findIndex((item) => item.maVoucher === normalized.maVoucher);
      if (index >= 0) return normalized.maVoucher;
      vouchers.push(normalized); return normalized.maVoucher;
    },
    capNhatVoucher(voucher) {
      const code = normalizeCode(voucher?.maVoucher);
      const index = vouchers.findIndex((item) => item.maVoucher === code);
      if (index < 0) return;
      vouchers[index] = { ...vouchers[index], ...voucher, maVoucher: code };
    },
    getApplied: readApplied,
    apply(maVoucher, tamTinh) {
      const voucher = timVoucher(maVoucher);
      if (!voucher) return { ok: false, message: "Mã voucher không tồn tại." };
      if (tinhSoTienGiam(voucher, Number(tamTinh) || 0) <= 0) {
        return { ok: false, message: `Đơn hàng chưa đạt tối thiểu ${voucher.donHangToiThieu.toLocaleString("vi-VN")}đ để dùng mã này.` };
      }
      saveApplied(voucher);
      return { ok: true, voucher, discount: tinhSoTienGiam(voucher, tamTinh) };
    },
    clear() {
      saveApplied(null);
    }
  };
})();
