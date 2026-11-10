// =========================================================
// KHO VOUCHER DÙNG CHUNG (trang khách + trang quản trị)
// Dữ liệu lưu ở localStorage "shopVouchers"; lần đầu sẽ seed từ DEFAULT_VOUCHERS.
// Trang Admin sửa kho này, trang thanh toán của khách đọc lại ngay.
// =========================================================
(function () {
  const STORAGE_KEY = "shopVouchers";

  // gioiHanMoiKhach: số lần tối đa 1 tài khoản được dùng mã (0 = không giới hạn).
  // tongLuotDung: tổng số lượt toàn hệ thống (ngân sách khuyến mãi, 0 = không giới hạn).
  // ngayBatDau / hanDung: thời gian hiệu lực (null = không giới hạn).
  const DEFAULT_VOUCHERS = [
    {
      code: "GIAYMOI10",
      title: "Giảm 10%",
      description: "Giảm 10% tối đa 150.000đ cho đơn từ 500.000đ",
      type: "percent",
      value: 10,
      maxDiscount: 150000,
      minOrder: 500000,
      trangThai: "active",
      hanDung: null,
      gioiHanMoiKhach: 1,
    },
    {
      code: "GIAY200K",
      title: "Giảm 200.000đ",
      description: "Giảm 200.000đ cho đơn từ 1.500.000đ",
      type: "fixed",
      value: 200000,
      maxDiscount: null,
      minOrder: 1500000,
      trangThai: "active",
      hanDung: null,
      gioiHanMoiKhach: 1,
    },
    {
      code: "KHACHMOI",
      title: "Ưu đãi khách mới",
      description: "Giảm 50.000đ cho đơn từ 300.000đ",
      type: "fixed",
      value: 50000,
      maxDiscount: null,
      minOrder: 300000,
      trangThai: "active",
      hanDung: null,
      chiKhachMoi: true, // chỉ dành cho khách chưa từng đặt hàng (không tính đơn đã hủy)
      gioiHanMoiKhach: 1,
    },
    {
      code: "SALE2026",
      title: "Ưu đãi cuối năm 2026",
      description: "Giảm 100.000đ cho đơn từ 1.000.000đ, dùng đến 31/12/2026",
      type: "fixed",
      value: 100000,
      maxDiscount: null,
      minOrder: 1000000,
      trangThai: "active",
      hanDung: "2026-12-31T23:59:59",
      gioiHanMoiKhach: 1,
    },
    {
      code: "SALE2025",
      title: "Ưu đãi SALE cuối năm 2025 (đã kết thúc)",
      description: "Giảm 100.000đ cho đơn từ 1.000.000đ — mã này đã hết hạn",
      type: "fixed",
      value: 100000,
      maxDiscount: null,
      minOrder: 1000000,
      trangThai: "active",
      hanDung: "2025-12-31T23:59:59",
      gioiHanMoiKhach: 1,
    },
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeCode(code) {
    return String(code || "").trim().toUpperCase();
  }

  function toInt(value, fallback) {
    const num = Number(value);
    return Number.isFinite(num) ? Math.round(num) : fallback;
  }

  // Chuẩn hóa 1 voucher: bỏ field lạ, ép kiểu, chặn giá trị âm/không hợp lệ.
  function sanitize(raw) {
    if (!raw || typeof raw !== "object") return null;
    const code = normalizeCode(raw.code);
    if (!code) return null;
    const type = raw.type === "percent" ? "percent" : "fixed";
    const maxDiscount = toInt(raw.maxDiscount, 0);
    const hanDung = raw.hanDung && !isNaN(Date.parse(raw.hanDung)) ? String(raw.hanDung) : null;
    const ngayBatDau = raw.ngayBatDau && !isNaN(Date.parse(raw.ngayBatDau)) ? String(raw.ngayBatDau) : null;
    return {
      code,
      title: String(raw.title || code).trim(),
      description: String(raw.description || "").trim(),
      type,
      value: Math.max(0, toInt(raw.value, 0)),
      maxDiscount: maxDiscount > 0 ? maxDiscount : null,
      minOrder: Math.max(0, toInt(raw.minOrder, 0)),
      trangThai: raw.trangThai === "inactive" ? "inactive" : "active",
      ngayBatDau,
      hanDung,
      chiKhachMoi: raw.chiKhachMoi === true,
      gioiHanMoiKhach: Math.max(0, toInt(raw.gioiHanMoiKhach, 0)),
      tongLuotDung: Math.max(0, toInt(raw.tongLuotDung, 0)),
    };
  }

  // ---- Thống kê lượt dùng: chỉ tính đơn đã chốt (DanhSachDatHang), không tính đơn đã hủy ----
  function isCancelledOrder(order) {
    return !!order && (order.trangThai === "da-huy" || order.trangThaiQuanTri === "huy");
  }

  function readOrders() {
    try {
      const list = JSON.parse(localStorage.getItem("DanhSachDatHang") || "[]");
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }

  // Tổng lượt đã dùng của 1 mã trên toàn hệ thống.
  function totalUsed(code) {
    const normalized = normalizeCode(code);
    if (!normalized) return 0;
    return readOrders().filter((order) => order && !isCancelledOrder(order) && normalizeCode(order.maVoucher) === normalized).length;
  }

  // Trạng thái nghiệp vụ của voucher (dùng chung Admin + khách):
  // inactive (tạm dừng) > upcoming (chưa tới ngày) > expired (hết hạn) > exhausted (hết lượt) > active.
  function statusOf(voucher, used) {
    if (!voucher || voucher.trangThai !== "active") return "inactive";
    const now = Date.now();
    if (voucher.ngayBatDau && now < Date.parse(voucher.ngayBatDau)) return "upcoming";
    if (voucher.hanDung && now > Date.parse(voucher.hanDung)) return "expired";
    const quota = Number(voucher.tongLuotDung) || 0;
    const count = used === undefined ? totalUsed(voucher.code) : used;
    if (quota > 0 && count >= quota) return "exhausted";
    return "active";
  }

  function readRaw() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function save(list) {
    const clean = (Array.isArray(list) ? list : []).map(sanitize).filter(Boolean);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
      return true;
    } catch (error) {
      console.error("Không lưu được voucher:", error);
      return false;
    }
  }

  // Danh sách voucher hiện hành. Chưa có key (lần đầu) hoặc JSON hỏng -> seed mặc định.
  function all() {
    const raw = readRaw();
    if (raw === null) {
      const seeded = clone(DEFAULT_VOUCHERS).map(sanitize).filter(Boolean);
      save(seeded);
      return seeded;
    }
    return raw.map(sanitize).filter(Boolean);
  }

  function find(code) {
    const normalized = normalizeCode(code);
    return all().find((voucher) => voucher.code === normalized) || null;
  }

  function upsert(voucher) {
    const clean = sanitize(voucher);
    if (!clean) return { ok: false, message: "Mã voucher không hợp lệ." };
    if (!clean.value || clean.value <= 0) return { ok: false, message: "Giá trị giảm phải lớn hơn 0." };
    if (clean.type === "percent" && clean.value > 100) return { ok: false, message: "Voucher phần trăm không được vượt 100%." };
    if (clean.type === "fixed" && clean.minOrder > 0 && clean.value > clean.minOrder) return { ok: false, message: "Số tiền giảm không được lớn hơn đơn tối thiểu." };
    if (clean.ngayBatDau && clean.hanDung && Date.parse(clean.ngayBatDau) > Date.parse(clean.hanDung)) return { ok: false, message: "Ngày bắt đầu phải trước hạn dùng." };
    const list = all();
    const index = list.findIndex((item) => item.code === clean.code);
    if (index === -1) list.push(clean);
    else list[index] = clean;
    if (!save(list)) return { ok: false, message: "Không lưu được voucher (bộ nhớ trình duyệt đã đầy)." };
    return { ok: true, voucher: clean };
  }

  function remove(code) {
    const normalized = normalizeCode(code);
    const list = all().filter((item) => item.code !== normalized);
    return save(list);
  }

  function reset() {
    return save(clone(DEFAULT_VOUCHERS));
  }

  window.VoucherStore = {
    STORAGE_KEY,
    DEFAULT_VOUCHERS,
    normalizeCode,
    sanitize,
    totalUsed,
    statusOf,
    all,
    find,
    save,
    upsert,
    remove,
    reset,
  };
})();
