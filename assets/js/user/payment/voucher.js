(function () {
  const STORAGE_KEY = "appliedVoucher";

  const vouchers = [
    {
      code: "GIAYMOI10",
      title: "Giảm 10%",
      description: "Giảm 10% tối đa 150.000đ cho đơn từ 500.000đ",
      type: "percent",
      value: 10,
      maxDiscount: 150000,
      minOrder: 500000
    },
    {
      code: "GIAY200K",
      title: "Giảm 200.000đ",
      description: "Giảm 200.000đ cho đơn từ 1.500.000đ",
      type: "fixed",
      value: 200000,
      minOrder: 1500000
    },
    {
      code: "KHACHMOI",
      title: "Ưu đãi khách mới",
      description: "Giảm 50.000đ cho đơn từ 300.000đ",
      type: "fixed",
      value: 50000,
      minOrder: 300000
    }
  ];

  function normalizeCode(code) {
    return String(code || "").trim().toUpperCase();
  }

  function getVoucher(code) {
    const normalized = normalizeCode(code);
    return vouchers.find((voucher) => voucher.code === normalized) || null;
  }

  function getDiscount(voucher, subtotal) {
    if (!voucher || Number(subtotal) < voucher.minOrder) return 0;
    const raw = voucher.type === "percent"
      ? Number(subtotal) * voucher.value / 100
      : voucher.value;
    return Math.max(0, Math.min(Number(subtotal), voucher.maxDiscount ? Math.min(raw, voucher.maxDiscount) : raw));
  }

  function readApplied() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return saved && getVoucher(saved.code) ? getVoucher(saved.code) : null;
    } catch (_) {
      return null;
    }
  }

  function saveApplied(voucher) {
    if (voucher) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: voucher.code }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  window.ShopVoucher = {
    list: () => vouchers.slice(),
    find: getVoucher,
    discount: getDiscount,
    getApplied: readApplied,
    apply(code, subtotal) {
      const voucher = getVoucher(code);
      if (!voucher) return { ok: false, message: "Mã voucher không tồn tại." };
      if (getDiscount(voucher, Number(subtotal) || 0) <= 0) {
        return { ok: false, message: `Đơn hàng chưa đạt tối thiểu ${voucher.minOrder.toLocaleString("vi-VN")}đ để dùng mã này.` };
      }
      saveApplied(voucher);
      return { ok: true, voucher, discount: getDiscount(voucher, subtotal) };
    },
    clear() {
      saveApplied(null);
    }
  };
})();
