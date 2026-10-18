// ==================== FEEDBACK STORE (dùng chung User + Admin) ====================
// Lưu đánh giá của khách (1-5 sao, bình luận, ảnh, video) trong IndexedDB để chứa được ảnh/video lớn.
// Bản ghi (tên thuộc tính tiếng Việt, xem docs/DOI_TEN_THUOC_TINH.md):
//   { maDanhGia, maDonHang, maSanPham, tenSanPham, maLoai, kichCoDaChon, maKhachHang, hoTen,
//     soSao(1-5), binhLuan, tepDinhKem:[{loai:"image"|"video", ten, tep:Blob}],
//     ngayTao, trangThai:"moi"|"dangXuLy"|"daXuLy", nguoiXuLy:{tenDangNhap,hoTen}|null,
//     ngayTiepNhan, phanHoi:{noiDung,nguoiGui,tenDangNhap,thoiGian}|null, daAn:boolean }
// Mọi thay đổi gọi notify() => sự kiện "feedbackUpdated" (cùng tab) + khoá localStorage "feedbackVersion" (khác tab).
const FeedbackStore = (function () {
  "use strict";

  const DB_NAME = "ooad_feedback";
  const STORE = "feedback";
  const VERSION_KEY = "feedbackVersion";

  const STATUS_LABEL = { moi: "Mới", dangXuLy: "Đang xử lý", daXuLy: "Đã phản hồi" };
  const LIMITS = { maxFiles: 6, maxImageMB: 8, maxVideoMB: 25, maxComment: 1000, imageEdge: 1280 };

  let dbPromise = null;

  // Đổi bản ghi đánh giá cũ (tên tiếng Anh) sang tên tiếng Việt.
  function chuyenBanGhiCu(r) {
    if (!r || r.maDanhGia !== undefined) return r;
    const nguoi = r.assignedTo;
    const phan = r.reply;
    const moi = {
      maDanhGia: r.id, maDonHang: r.orderId, maSanPham: r.productId, tenSanPham: r.productName, maLoai: r.catalog,
      kichCoDaChon: r.size, maKhachHang: r.userId, hoTen: r.userName, soSao: r.rating, binhLuan: r.comment,
      tepDinhKem: (r.media || []).map((m) => ({ loai: m.type, ten: m.name, tep: m.blob })),
      ngayTao: r.createdAt, trangThai: r.status,
      nguoiXuLy: nguoi ? { tenDangNhap: nguoi.username, hoTen: nguoi.name } : null,
      ngayTiepNhan: r.receivedAt,
      phanHoi: phan ? { noiDung: phan.text, nguoiGui: phan.by, tenDangNhap: phan.username, thoiGian: phan.at } : null,
      daAn: !!r.hidden,
    };
    Object.keys(moi).forEach((k) => { if (moi[k] === undefined) delete moi[k]; });
    return moi;
  }

  function open() {
    if (!window.indexedDB) return Promise.reject(new Error("Trình duyệt không hỗ trợ lưu đánh giá (IndexedDB)."));
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 2);
        request.onupgradeneeded = (event) => {
          const db = request.result;
          if (event.oldVersion < 1) {
            const store = db.createObjectStore(STORE, { keyPath: "maDanhGia" });
            store.createIndex("maSanPham", "maSanPham");
            store.createIndex("maKhachHang", "maKhachHang");
            store.createIndex("ngayTao", "ngayTao");
            return;
          }
          // Nâng từ phiên bản 1 (tên thuộc tính tiếng Anh): tạo lại store với khóa "maDanhGia" và đổi tên từng bản ghi.
          const cu = request.transaction.objectStore(STORE);
          const getAllRequest = cu.getAll();
          getAllRequest.onsuccess = () => {
            const banGhiCu = getAllRequest.result || [];
            db.deleteObjectStore(STORE);
            const store = db.createObjectStore(STORE, { keyPath: "maDanhGia" });
            store.createIndex("maSanPham", "maSanPham");
            store.createIndex("maKhachHang", "maKhachHang");
            store.createIndex("ngayTao", "ngayTao");
            banGhiCu.forEach((r) => store.put(chuyenBanGhiCu(r)));
          };
        };
        request.onsuccess = () => {
          const db = request.result;
          // Tab khac nang cap phien ban: dong ket noi cu de khong chan, lan sau mo lai.
          db.onversionchange = () => { db.close(); dbPromise = null; };
          resolve(db);
        };
        request.onblocked = () => console.warn("Kho đánh giá đang bị chặn bởi một tab cũ. Hãy đóng các tab cũ của trang này.");
        request.onerror = () => { dbPromise = null; reject(request.error); };
      });
    }
    return dbPromise;
  }

  function run(mode, action) {
    return open().then((db) => new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const store = transaction.objectStore(STORE);
      let result;
      let loi = null;
      const request = action(store);
      if (request) {
        request.onsuccess = () => { result = request.result; };
        // Giu lai loi cua request (vd ConstraintError) vi transaction.error co the chua co khi onerror chay.
        request.onerror = () => { loi = request.error; };
      }
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(loi || transaction.error);
      transaction.onabort = () => reject(loi || transaction.error);
    }));
  }

  function notify() {
    try { localStorage.setItem(VERSION_KEY, String(Date.now())); } catch (_) { /* bỏ qua */ }
    window.dispatchEvent(new Event("feedbackUpdated"));
  }

  function onChange(callback) {
    window.addEventListener("feedbackUpdated", callback);
    window.addEventListener("storage", (event) => { if (event.key === VERSION_KEY) callback(); });
  }

  function getAll() {
    return run("readonly", (store) => store.getAll()).then((list) => (list || []).sort((a, b) => String(b.ngayTao).localeCompare(String(a.ngayTao))));
  }
  function get(id) { return run("readonly", (store) => store.get(id)); }

  // Thêm mới (lỗi nếu đã tồn tại id) — dùng cho khách gửi đánh giá.
  function add(record) {
    return run("readwrite", (store) => store.add(record)).then(() => { notify(); return record; });
  }

  // Cập nhật một phần bản ghi.
  function update(id, patch) {
    return get(id).then((current) => {
      if (!current) throw new Error("Không tìm thấy phản hồi.");
      const next = { ...current, ...(typeof patch === "function" ? patch(current) : patch) };
      return run("readwrite", (store) => store.put(next)).then(() => { notify(); return next; });
    });
  }

  function remove(id) { return run("readwrite", (store) => store.delete(id)).then(notify); }

  // ---------- Tiện ích ----------
  function recordId(orderId, productId, size) {
    return ["fb", orderId, productId, size || "x"].join("_");
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[ch]);
  }

  function stars(rating, outOf) {
    const total = outOf || 5;
    const value = Math.max(0, Math.min(total, Math.round(Number(rating) || 0)));
    return "★".repeat(value) + "☆".repeat(total - value);
  }

  function maskName(name) {
    const text = String(name || "").trim();
    if (!text) return "Khách hàng";
    if (text.length <= 2) return text.charAt(0) + "***";
    return text.slice(0, 2) + "***" + text.slice(-1);
  }

  function formatDateTime(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  // Nén ảnh về cạnh dài tối đa LIMITS.imageEdge, trả về Blob JPEG.
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, LIMITS.imageEdge / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Không xử lý được ảnh."))), "image/jpeg", 0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Tệp ảnh không hợp lệ: " + file.name)); };
      img.src = url;
    });
  }

  // ---------- Thống kê ----------
  function dayKey(iso) {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function summarize(list) {
    const total = list.length;
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const byStatus = { moi: 0, dangXuLy: 0, daXuLy: 0 };
    const byDay = {};
    const byProduct = {};
    const byCatalog = {};
    const byStaff = {};
    let sum = 0, withImage = 0, withVideo = 0, withComment = 0, responseMs = 0, responded = 0;

    list.forEach((item) => {
      const soSao = Math.max(1, Math.min(5, Number(item.soSao) || 0));
      dist[soSao] += 1;
      sum += soSao;
      byStatus[item.trangThai] = (byStatus[item.trangThai] || 0) + 1;
      const media = item.tepDinhKem || [];
      if (media.some((m) => m.loai === "image")) withImage += 1;
      if (media.some((m) => m.loai === "video")) withVideo += 1;
      if (item.binhLuan && String(item.binhLuan).trim()) withComment += 1;
      const key = dayKey(item.ngayTao);
      byDay[key] = (byDay[key] || 0) + 1;

      const p = byProduct[item.maSanPham] || (byProduct[item.maSanPham] = { id: item.maSanPham, name: item.tenSanPham || item.maSanPham, catalog: item.maLoai || "", count: 0, sum: 0, low: 0 });
      p.count += 1; p.sum += soSao; if (soSao <= 2) p.low += 1;
      const c = byCatalog[item.maLoai || "Khác"] || (byCatalog[item.maLoai || "Khác"] = { name: item.maLoai || "Khác", count: 0, sum: 0 });
      c.count += 1; c.sum += soSao;

      if (item.nguoiXuLy && item.nguoiXuLy.tenDangNhap) {
        const s = byStaff[item.nguoiXuLy.tenDangNhap] || (byStaff[item.nguoiXuLy.tenDangNhap] = { username: item.nguoiXuLy.tenDangNhap, name: item.nguoiXuLy.hoTen || item.nguoiXuLy.tenDangNhap, received: 0, done: 0, ms: 0, doneWithTime: 0 });
        s.received += 1;
        if (item.trangThai === "daXuLy") {
          s.done += 1;
          if (item.phanHoi && item.phanHoi.thoiGian) { s.ms += new Date(item.phanHoi.thoiGian) - new Date(item.ngayTao); s.doneWithTime += 1; }
        }
      }
      if (item.phanHoi && item.phanHoi.thoiGian) { responseMs += new Date(item.phanHoi.thoiGian) - new Date(item.ngayTao); responded += 1; }
    });

    const products = Object.values(byProduct).map((p) => ({ ...p, avg: p.sum / p.count }));
    return {
      total,
      avg: total ? sum / total : 0,
      dist,
      positive: dist[4] + dist[5],
      neutral: dist[3],
      negative: dist[1] + dist[2],
      withImage, withVideo, withComment,
      withMedia: list.filter((i) => (i.tepDinhKem || []).length).length,
      byStatus,
      byDay,
      products,
      catalogs: Object.values(byCatalog).map((c) => ({ ...c, avg: c.sum / c.count })).sort((a, b) => b.avg - a.avg),
      staff: Object.values(byStaff).map((s) => ({ ...s, avgHours: s.doneWithTime ? s.ms / s.doneWithTime / 3600000 : null })).sort((a, b) => b.done - a.done),
      avgResponseHours: responded ? responseMs / responded / 3600000 : null,
    };
  }

  return { STATUS_LABEL, LIMITS, getAll, get, add, update, remove, onChange, notify, recordId, escapeHtml, stars, maskName, formatDateTime, compressImage, summarize };
})();
window.FeedbackStore = FeedbackStore;
