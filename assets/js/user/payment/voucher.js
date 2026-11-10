(function () {
  const STORAGE_KEY = "appliedVoucher";

  // Dự phòng khi trang chưa nạp database/vouchers.js (trang cũ / file lỗi).
  const FALLBACK_VOUCHERS = [
    { code: "GIAYMOI10", title: "Giảm 10%", description: "Giảm 10% tối đa 150.000đ cho đơn từ 500.000đ", type: "percent", value: 10, maxDiscount: 150000, minOrder: 500000, trangThai: "active", hanDung: null, gioiHanMoiKhach: 1 },
    { code: "GIAY200K", title: "Giảm 200.000đ", description: "Giảm 200.000đ cho đơn từ 1.500.000đ", type: "fixed", value: 200000, maxDiscount: null, minOrder: 1500000, trangThai: "active", hanDung: null, gioiHanMoiKhach: 1 },
    { code: "KHACHMOI", title: "Ưu đãi khách mới", description: "Giảm 50.000đ cho đơn từ 300.000đ", type: "fixed", value: 50000, maxDiscount: null, minOrder: 300000, trangThai: "active", hanDung: null, chiKhachMoi: true, gioiHanMoiKhach: 1 },
    { code: "SALE2026", title: "Ưu đãi cuối năm 2026", description: "Giảm 100.000đ cho đơn từ 1.000.000đ, dùng đến 31/12/2026", type: "fixed", value: 100000, maxDiscount: null, minOrder: 1000000, trangThai: "active", hanDung: "2026-12-31T23:59:59", gioiHanMoiKhach: 1 },
    { code: "SALE2025", title: "Ưu đãi SALE cuối năm 2025 (đã kết thúc)", description: "Giảm 100.000đ cho đơn từ 1.000.000đ — mã này đã hết hạn", type: "fixed", value: 100000, maxDiscount: null, minOrder: 1000000, trangThai: "active", hanDung: "2025-12-31T23:59:59", gioiHanMoiKhach: 1 },
  ];

  // Đọc kho voucher dùng chung; Admin sửa kho thì khách thấy ngay, không cần tải lại trang.
  function allVouchers() {
    if (window.VoucherStore && typeof window.VoucherStore.all === "function") {
      try {
        const list = window.VoucherStore.all();
        if (Array.isArray(list)) return list;
      } catch (_) { /* rơi xuống dự phòng */ }
    }
    return FALLBACK_VOUCHERS.map((voucher) => Object.assign({}, voucher));
  }

  function normalizeCode(code) {
    return String(code || "").trim().toUpperCase();
  }

  function getVoucher(code) {
    const normalized = normalizeCode(code);
    return allVouchers().find((voucher) => voucher.code === normalized) || null;
  }

  // Voucher còn hiệu lực: trạng thái active và chưa quá hạn (hanDung null = không hết hạn).
  function isUsable(voucher) {
    if (!voucher) return false;
    if (window.VoucherStore && typeof window.VoucherStore.statusOf === "function") {
      return window.VoucherStore.statusOf(voucher) === "active";
    }
    if (voucher.trangThai !== "active") return false;
    if (voucher.ngayBatDau && Date.now() < Date.parse(voucher.ngayBatDau)) return false;
    if (voucher.hanDung && Date.now() > Date.parse(voucher.hanDung)) return false;
    return true;
  }

  const fmtMoney = (value) => (Number(value) || 0).toLocaleString("vi-VN") + "đ";
  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  function getDiscount(voucher, subtotal) {
    if (!voucher || Number(subtotal) < voucher.minOrder) return 0;
    const raw = voucher.type === "percent"
      ? Number(subtotal) * voucher.value / 100
      : voucher.value;
    // Giảm giá không vượt tổng tiền hàng, kết quả luôn là số đồng nguyên (làm tròn gần nhất).
    return Math.max(0, Math.min(Number(subtotal), Math.round(voucher.maxDiscount ? Math.min(raw, voucher.maxDiscount) : raw)));
  }

  function laDonHuy(order) {
    return !!order && (order.trangThai === "da-huy" || order.trangThaiQuanTri === "huy");
  }

  // Các đơn đã chốt của đúng tài khoản (đơn chuyển khoản đang chờ nằm ở key khác nên không tính).
  function donCuaKhach(user) {
    if (!user) return [];
    let list = [];
    try { list = JSON.parse(localStorage.getItem("DanhSachDatHang") || "[]"); } catch (_) { list = []; }
    return (Array.isArray(list) ? list : []).filter((order) => {
      if (!order) return false;
      if (user.maKhachHang && order.maKhachHang === user.maKhachHang) return true;
      if (order.khachHang && user.maKhachHang && order.khachHang.maKhachHang === user.maKhachHang) return true;
      return !!(user.thuDienTu && order.khachHang && order.khachHang.thuDienTu === user.thuDienTu);
    });
  }

  // Khách mới = chưa từng có đơn hàng nào (không tính đơn đã hủy).
  function laKhachMoi(user) {
    if (!user) return false;
    // Đơn đã hủy (kể cả đơn cũ chỉ có trạng thái quản trị "huy") không tính là đã mua.
    return donCuaKhach(user).filter((order) => !laDonHuy(order)).length === 0;
  }

  // Số lần tài khoản đã dùng mã (chỉ tính đơn đã chốt, không tính đơn đã hủy).
  function usedCount(code, user) {
    const normalized = normalizeCode(code);
    if (!normalized || !user) return 0;
    return donCuaKhach(user).filter((order) => !laDonHuy(order) && normalizeCode(order.maVoucher) === normalized).length;
  }

  function conLuotDung(voucher, user) {
    const limit = Number(voucher && voucher.gioiHanMoiKhach) || 0;
    if (limit <= 0) return true; // 0 = không giới hạn
    return usedCount(voucher.code, user) < limit;
  }

  // Kiểm tra toàn bộ điều kiện nghiệp vụ của 1 voucher cho 1 khách + giá trị đơn.
  // Trả về { ok, reason, message, shortBy }. reason: not-found | inactive | upcoming | expired |
  // exhausted | new-only | user-limit | min-order.  subtotal = null -> bỏ qua kiểm tra đơn tối thiểu.
  function evaluate(voucher, subtotal, user) {
    if (!voucher) return { ok: false, reason: "not-found", message: "Mã voucher không tồn tại." };
    if (voucher.trangThai !== "active") return { ok: false, reason: "inactive", message: "Mã voucher đã ngừng áp dụng." };
    if (voucher.ngayBatDau && Date.now() < Date.parse(voucher.ngayBatDau)) {
      return { ok: false, reason: "upcoming", message: `Mã voucher chưa đến thời gian áp dụng (từ ${fmtDate(voucher.ngayBatDau)}).` };
    }
    if (voucher.hanDung && Date.now() > Date.parse(voucher.hanDung)) {
      return { ok: false, reason: "expired", message: "Mã voucher đã hết hạn." };
    }
    const quota = Number(voucher.tongLuotDung) || 0;
    if (quota > 0 && window.VoucherStore?.totalUsed && window.VoucherStore.totalUsed(voucher.code) >= quota) {
      return { ok: false, reason: "exhausted", message: "Mã voucher đã hết lượt sử dụng." };
    }
    if (voucher.chiKhachMoi && !laKhachMoi(user)) {
      return { ok: false, reason: "new-only", message: "Mã này chỉ dành cho khách hàng mới (chưa từng đặt hàng)." };
    }
    if (!conLuotDung(voucher, user)) {
      return { ok: false, reason: "user-limit", message: `Bạn đã dùng hết lượt của mã này (tối đa ${voucher.gioiHanMoiKhach} lần/tài khoản).` };
    }
    if (subtotal !== null && subtotal !== undefined) {
      const total = Number(subtotal) || 0;
      if (total < (Number(voucher.minOrder) || 0)) {
        const shortBy = voucher.minOrder - total;
        return { ok: false, reason: "min-order", shortBy, message: `Đơn hàng chưa đạt tối thiểu ${fmtMoney(voucher.minOrder)} (cần mua thêm ${fmtMoney(shortBy)}).` };
      }
      if (getDiscount(voucher, total) <= 0) {
        return { ok: false, reason: "min-order", shortBy: 0, message: "Voucher không áp dụng được cho đơn hàng này." };
      }
    }
    return { ok: true, reason: "ok", message: "" };
  }

  // Danh sách hiển thị ở checkout: mã dùng được + mã chỉ thiếu đơn tối thiểu (hiện mờ kèm lý do).
  // Mã đã hết hạn / hết lượt / không đúng đối tượng thì ẩn hẳn. Mã giảm nhiều nhất xếp trước.
  function listForCheckout(user, subtotal) {
    return allVouchers()
      .map((voucher) => ({ voucher, check: evaluate(voucher, subtotal, user) }))
      .filter((entry) => entry.check.ok || entry.check.reason === "min-order")
      .map((entry) => Object.assign(entry, { discount: entry.check.ok ? getDiscount(entry.voucher, subtotal) : 0 }))
      .sort((a, b) => (b.check.ok - a.check.ok) || (b.discount - a.discount) || a.voucher.code.localeCompare(b.voucher.code));
  }

  // Đọc mã đã áp dụng. Phải kiểm tra lại mọi điều kiện theo tài khoản đang đăng nhập
  // vì localStorage dùng chung cho mọi tài khoản trong cùng trình duyệt.
  function readApplied(user) {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      const voucher = saved ? getVoucher(saved.code) : null;
      if (!voucher) return null;
      if (!evaluate(voucher, null, user).ok) {
        saveApplied(null);
        return null;
      }
      return voucher;
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
    // Chỉ liệt kê mã khách đang đăng nhập dùng được (ẩn mã khách mới / mã đã hết lượt).
    list: (user) => allVouchers().filter((voucher) =>
      isUsable(voucher) &&
      (!voucher.chiKhachMoi || laKhachMoi(user)) &&
      conLuotDung(voucher, user)
    ).slice(),
    find: getVoucher,
    evaluate,
    listForCheckout,
    // Kiểm tra lại voucher của 1 đơn ngay trước khi chốt (đơn chuyển khoản chờ có thể đã quá hạn/hết lượt).
    revalidateOrder(order, user) {
      const code = normalizeCode(order && order.maVoucher);
      if (!code) return { ok: true };
      return evaluate(getVoucher(code), Number(order.tamTinh) || 0, user);
    },
    discount: getDiscount,
    getApplied: readApplied,
    usedCount,
    remainingUses(voucher, user) {
      const limit = Number(voucher && voucher.gioiHanMoiKhach) || 0;
      if (limit <= 0) return Infinity;
      return Math.max(0, limit - usedCount(voucher.code, user));
    },
    apply(code, subtotal, user) {
      const voucher = getVoucher(code);
      const check = evaluate(voucher, Number(subtotal) || 0, user);
      if (!check.ok) return { ok: false, reason: check.reason, message: check.message };
      saveApplied(voucher);
      return { ok: true, voucher, discount: getDiscount(voucher, subtotal) };
    },
    clear() {
      saveApplied(null);
    }
  };
})();
