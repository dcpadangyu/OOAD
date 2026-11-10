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
      donHangToiThieu: 500000
    },
    {
      maVoucher: "GIAY200K",
      title: "Giảm 200.000đ",
      description: "Giảm 200.000đ cho đơn từ 1.500.000đ",
      loaiGiamGia: "fixed",
      giaTriGiam: 200000,
      donHangToiThieu: 1500000
    },
    {
      maVoucher: "KHACHMOI",
      title: "Ưu đãi khách mới",
      description: "Giảm 50.000đ cho đơn từ 300.000đ",
      loaiGiamGia: "fixed",
      giaTriGiam: 50000,
      donHangToiThieu: 300000
    }
  ];

  function normalizeCode(maVoucher) {
    return String(maVoucher || "").trim().toUpperCase();
  }

  function getVoucher(maVoucher) {
    const normalized = normalizeCode(maVoucher);
    return vouchers.find((voucher) => voucher.maVoucher === normalized) || null;
  }

  function getDiscount(voucher, tamTinh) {
    if (!voucher || Number(tamTinh) < voucher.donHangToiThieu) return 0;
    const raw = voucher.loaiGiamGia === "percent"
      ? Number(tamTinh) * voucher.giaTriGiam / 100
      : voucher.giaTriGiam;
    return Math.max(0, Math.min(Number(tamTinh), voucher.giamToiDa ? Math.min(raw, voucher.giamToiDa) : raw));
  }

  function readApplied() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return saved && getVoucher(saved.maVoucher || saved.code) ? getVoucher(saved.maVoucher || saved.code) : null;
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
    find: getVoucher,
    discount: getDiscount,
    getApplied: readApplied,
    apply(maVoucher, tamTinh) {
      const voucher = getVoucher(maVoucher);
      if (!voucher) return { ok: false, message: "Mã voucher không tồn tại." };
      if (getDiscount(voucher, Number(tamTinh) || 0) <= 0) {
        return { ok: false, message: `Đơn hàng chưa đạt tối thiểu ${voucher.donHangToiThieu.toLocaleString("vi-VN")}đ để dùng mã này.` };
      }
      saveApplied(voucher);
      return { ok: true, voucher, discount: getDiscount(voucher, tamTinh) };
    },
    clear() {
      saveApplied(null);
    }
  };
})();
