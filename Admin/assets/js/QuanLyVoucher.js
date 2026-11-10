// ==================== QUẢN LÝ VOUCHER ====================
// Dữ liệu dùng chung với trang khách qua database/vouchers.js (localStorage "shopVouchers").
(function () {
  const SECTION_ID = "page-vouchers";

  const esc = (value) => String(value === undefined || value === null ? "" : value)
    .replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

  const money = (value) => (Number(value) || 0).toLocaleString("vi-VN") + "₫";
  const pad = (num) => String(num).padStart(2, "0");

  let searchText = "";
  let statusFilter = "all";
  let editingCode = null; // null = thêm mới

  function store() {
    return window.VoucherStore || null;
  }

  function allVouchers() {
    const s = store();
    return s ? s.all() : [];
  }

  function orders() {
    try {
      return JSON.parse(localStorage.getItem("DanhSachDatHang") || "[]") || [];
    } catch (_) {
      return [];
    }
  }

  function isCancelled(order) {
    return !!order && (order.trangThai === "da-huy" || order.trangThaiQuanTri === "huy");
  }

  function usageCount(code) {
    const s = store();
    if (s && s.totalUsed) return s.totalUsed(code);
    const normalized = String(code || "").toUpperCase();
    return orders().filter((order) =>
      order && !isCancelled(order) && String(order.maVoucher || "").toUpperCase() === normalized
    ).length;
  }

  // Tổng tiền khách đã được giảm nhờ voucher (đơn đã chốt, không tính đơn hủy).
  function totalDiscountGiven() {
    return orders().reduce((sum, order) =>
      order && !isCancelled(order) && order.maVoucher ? sum + (Number(order.giamGia) || 0) : sum, 0);
  }

  const STATUS_LABELS = {
    active: "Đang chạy",
    upcoming: "Sắp diễn ra",
    inactive: "Tạm dừng",
    expired: "Hết hạn",
    exhausted: "Hết lượt"
  };

  function statusOf(voucher) {
    const s = store();
    const key = s && s.statusOf ? s.statusOf(voucher, usageCount(voucher && voucher.code)) : "inactive";
    return { key, label: STATUS_LABELS[key] || key };
  }

  function formatDate(iso) {
    if (!iso) return "Không giới hạn";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "—";
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  }

  function valueText(voucher) {
    if (!voucher) return "—";
    if (voucher.type === "percent") {
      return `${voucher.value}%` + (voucher.maxDiscount ? ` (tối đa ${money(voucher.maxDiscount)})` : "");
    }
    return money(voucher.value);
  }

  function filteredList() {
    const keyword = searchText.trim().toLowerCase();
    return allVouchers()
      .filter((voucher) => {
        if (keyword) {
          const haystack = `${voucher.code} ${voucher.title} ${voucher.description}`.toLowerCase();
          if (!haystack.includes(keyword)) return false;
        }
        if (statusFilter !== "all" && statusOf(voucher).key !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const rank = { active: 0, upcoming: 1, inactive: 2, exhausted: 3, expired: 4 };
        const rankOf = (voucher) => {
          const value = rank[statusOf(voucher).key];
          return value === undefined ? 9 : value;
        };
        const diff = rankOf(a) - rankOf(b);
        return diff !== 0 ? diff : a.code.localeCompare(b.code);
      });
  }

  function buildLayout(root) {
    root.innerHTML = `
      <div class="QLV_page-header">
        <h3>Quản lý voucher</h3>
        <p>Thêm, sửa, bật/tắt mã giảm giá. Thay đổi áp dụng ngay trên trang thanh toán của khách.</p>
      </div>

      <div class="QLV_stats" id="QLV_stats"></div>

      <div class="QLV_toolbar">
        <input type="text" id="QLV_search" placeholder="Tìm mã / tên / mô tả...">
        <select id="QLV_filter">
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang chạy</option>
          <option value="upcoming">Sắp diễn ra</option>
          <option value="inactive">Tạm dừng</option>
          <option value="exhausted">Hết lượt</option>
          <option value="expired">Đã hết hạn</option>
        </select>
        <span class="QLV_spacer"></span>
        <button type="button" class="btn btn-outline" id="QLV_btnReset">Khôi phục mặc định</button>
        <button type="button" class="btn btn-primary" id="QLV_btnThem">+ Thêm voucher</button>
      </div>

      <div class="QLV_table-wrap">
        <table class="QLV_table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Chương trình</th>
              <th>Giảm giá</th>
              <th>Đơn tối thiểu</th>
              <th>Thời gian áp dụng</th>
              <th>Lượt / khách</th>
              <th>Đã dùng / Tổng lượt</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody id="QLV_tbody"></tbody>
        </table>
        <div id="QLV_empty" class="QLV_empty" hidden>Không có voucher phù hợp.</div>
      </div>

      <div class="modal QLV_modal" id="QLV_modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 id="QLV_modalTitle">Thêm voucher</h2>
            <button type="button" class="modal-close" data-qlv-action="close">&times;</button>
          </div>
          <div class="modal-body">
            <form id="QLV_form" autocomplete="off">
              <div class="QLV_form-grid">
                <div class="form-group">
                  <label for="QLV_code">Mã voucher *</label>
                  <input type="text" id="QLV_code" maxlength="30" placeholder="VD: GIAY200K">
                  <small class="QLV_hint">Tự viết hoa, không dấu, không khoảng trắng.</small>
                </div>
                <div class="form-group">
                  <label for="QLV_title">Tên chương trình *</label>
                  <input type="text" id="QLV_title" maxlength="80" placeholder="VD: Giảm 200.000đ">
                </div>
                <div class="form-group QLV_full">
                  <label for="QLV_description">Mô tả hiển thị cho khách</label>
                  <textarea id="QLV_description" rows="2" maxlength="200" placeholder="VD: Giảm 200.000đ cho đơn từ 1.500.000đ"></textarea>
                </div>
                <div class="form-group">
                  <label for="QLV_type">Loại giảm</label>
                  <select id="QLV_type">
                    <option value="fixed">Số tiền cố định</option>
                    <option value="percent">Phần trăm</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="QLV_value">Giá trị giảm *</label>
                  <input type="number" id="QLV_value" min="1" step="1000" placeholder="VD: 200000">
                  <small class="QLV_hint" id="QLV_valueHint">Số tiền giảm (đồng).</small>
                </div>
                <div class="form-group" id="QLV_maxDiscountGroup">
                  <label for="QLV_maxDiscount">Giảm tối đa</label>
                  <input type="number" id="QLV_maxDiscount" min="0" step="1000" placeholder="VD: 150000">
                  <small class="QLV_hint">Chỉ dùng cho voucher phần trăm. Để trống = không chặn.</small>
                </div>
                <div class="form-group">
                  <label for="QLV_minOrder">Đơn tối thiểu</label>
                  <input type="number" id="QLV_minOrder" min="0" step="1000" placeholder="VD: 1500000">
                </div>
                <div class="form-group">
                  <label for="QLV_ngayBatDau">Ngày bắt đầu</label>
                  <input type="date" id="QLV_ngayBatDau">
                  <small class="QLV_hint">Để trống = áp dụng ngay.</small>
                </div>
                <div class="form-group">
                  <label for="QLV_hanDung">Ngày kết thúc</label>
                  <input type="date" id="QLV_hanDung">
                  <small class="QLV_hint">Dùng được đến hết ngày này. Để trống = không hết hạn.</small>
                </div>
                <div class="form-group">
                  <label for="QLV_limit">Lượt dùng / tài khoản</label>
                  <input type="number" id="QLV_limit" min="0" step="1" placeholder="0">
                  <small class="QLV_hint">0 = không giới hạn.</small>
                </div>
                <div class="form-group">
                  <label for="QLV_tongLuot">Tổng lượt phát hành</label>
                  <input type="number" id="QLV_tongLuot" min="0" step="1" placeholder="0">
                  <small class="QLV_hint">Tổng số lần mã được dùng cho mọi khách. 0 = không giới hạn.</small>
                </div>
                <div class="form-group">
                  <label>Điều kiện</label>
                  <label class="QLV_checkbox">
                    <input type="checkbox" id="QLV_chiKhachMoi">
                    Chỉ khách hàng mới
                  </label>
                </div>
                <div class="form-group">
                  <label for="QLV_status">Trạng thái</label>
                  <select id="QLV_status">
                    <option value="active">Đang chạy</option>
                    <option value="inactive">Tạm dừng</option>
                  </select>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-qlv-action="close">Hủy</button>
            <button type="button" class="btn btn-primary" id="QLV_btnSave">Lưu voucher</button>
          </div>
        </div>
      </div>

      <div class="QLV_toast" id="QLV_toast"></div>
    `;
  }

  function renderStats() {
    const box = document.getElementById("QLV_stats");
    if (!box) return;
    const list = allVouchers();
    const count = (key) => list.filter((voucher) => statusOf(voucher).key === key).length;
    const used = list.reduce((sum, voucher) => sum + usageCount(voucher.code), 0);
    const waiting = count("upcoming") + count("inactive");
    const ended = count("expired") + count("exhausted");
    box.innerHTML = `
      <div class="QLV_stat"><strong>${list.length}</strong><span>Tổng voucher</span></div>
      <div class="QLV_stat"><strong>${count("active")}</strong><span>Đang chạy</span></div>
      <div class="QLV_stat" title="${count("upcoming")} sắp diễn ra, ${count("inactive")} tạm dừng"><strong>${waiting}</strong><span>Sắp diễn ra / tạm dừng</span></div>
      <div class="QLV_stat" title="${count("expired")} hết hạn, ${count("exhausted")} hết lượt"><strong>${ended}</strong><span>Đã kết thúc</span></div>
      <div class="QLV_stat"><strong>${used}</strong><span>Lượt đã dùng (đơn đã chốt)</span></div>
      <div class="QLV_stat"><strong>${money(totalDiscountGiven())}</strong><span>Tổng tiền đã giảm cho khách</span></div>
    `;
  }

  function renderTable() {
    const tbody = document.getElementById("QLV_tbody");
    const empty = document.getElementById("QLV_empty");
    if (!tbody) return;
    const list = filteredList();
    if (!list.length) {
      tbody.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    tbody.innerHTML = list.map((voucher) => {
      const status = statusOf(voucher);
      const limit = Number(voucher.gioiHanMoiKhach) || 0;
      const limitText = limit > 0 ? `${limit} lần` : "Không giới hạn";
      const used = usageCount(voucher.code);
      const quota = Number(voucher.tongLuotDung) || 0;
      const percentUsed = quota > 0 ? Math.min(100, Math.round(used * 100 / quota)) : 0;
      const usageCell = quota > 0
        ? `<div class="QLV_usage"><span>${used} / ${quota}</span><div class="QLV_bar"><i style="width:${percentUsed}%"></i></div></div>`
        : `${used} / ∞`;
      const period = voucher.ngayBatDau || voucher.hanDung
        ? `${voucher.ngayBatDau ? formatDate(voucher.ngayBatDau) : "Ngay"} → ${voucher.hanDung ? formatDate(voucher.hanDung) : "Không giới hạn"}`
        : "Không giới hạn";
      return `
        <tr>
          <td class="QLV_code">${esc(voucher.code)}</td>
          <td>
            <strong>${esc(voucher.title)}</strong>
            ${voucher.description ? `<span class="QLV_sub">${esc(voucher.description)}</span>` : ""}
            ${voucher.chiKhachMoi ? '<span class="QLV_badge QLV_badge-new">Khách mới</span>' : ""}
          </td>
          <td class="QLV_nowrap">${esc(valueText(voucher))}</td>
          <td class="QLV_nowrap">${money(voucher.minOrder)}</td>
          <td class="QLV_nowrap">${esc(period)}</td>
          <td class="QLV_nowrap">${esc(limitText)}</td>
          <td class="QLV_nowrap">${usageCell}</td>
          <td><span class="QLV_badge QLV_badge-${status.key}">${status.label}</span></td>
          <td>
            <div class="QLV_actions">
              <button type="button" data-qlv-action="edit" data-code="${esc(voucher.code)}">Sửa</button>
              <button type="button" data-qlv-action="toggle" data-code="${esc(voucher.code)}">${voucher.trangThai === "active" ? "Tạm dừng" : "Bật"}</button>
              <button type="button" class="QLV_danger" data-qlv-action="delete" data-code="${esc(voucher.code)}" ${used > 0 ? 'disabled title="Mã đã có đơn sử dụng — chỉ có thể tạm dừng, không xóa để giữ lịch sử đơn hàng"' : ""}>Xóa</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  function render() {
    renderStats();
    renderTable();
  }

  let toastTimer = null;
  function toast(message, isError) {
    const box = document.getElementById("QLV_toast");
    if (!box) {
      if (isError) alert(message);
      return;
    }
    box.textContent = message;
    box.classList.toggle("error", !!isError);
    box.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.remove("show"), 2600);
  }

  function syncTypeHint() {
    const type = document.getElementById("QLV_type")?.value;
    const hint = document.getElementById("QLV_valueHint");
    if (hint) hint.textContent = type === "percent" ? "Phần trăm giảm (1–100)." : "Số tiền giảm (đồng).";
  }

  function openModal(code) {
    editingCode = code || null;
    const voucher = editingCode ? allVouchers().find((item) => item.code === editingCode) : null;
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.value = value; };
    const title = document.getElementById("QLV_modalTitle");
    if (title) title.textContent = voucher ? `Sửa voucher ${voucher.code}` : "Thêm voucher";

    set("QLV_code", voucher ? voucher.code : "");
    set("QLV_title", voucher ? voucher.title : "");
    set("QLV_description", voucher ? voucher.description : "");
    set("QLV_type", voucher ? voucher.type : "fixed");
    set("QLV_value", voucher ? voucher.value : "");
    set("QLV_maxDiscount", voucher && voucher.maxDiscount ? voucher.maxDiscount : "");
    set("QLV_minOrder", voucher ? voucher.minOrder : 0);
    set("QLV_ngayBatDau", voucher && voucher.ngayBatDau ? String(voucher.ngayBatDau).slice(0, 10) : "");
    set("QLV_hanDung", voucher && voucher.hanDung ? String(voucher.hanDung).slice(0, 10) : "");
    set("QLV_tongLuot", voucher ? voucher.tongLuotDung || 0 : 0);
    set("QLV_limit", voucher ? voucher.gioiHanMoiKhach : 1);
    set("QLV_status", voucher ? voucher.trangThai : "active");
    const chiKhachMoi = document.getElementById("QLV_chiKhachMoi");
    if (chiKhachMoi) chiKhachMoi.checked = !!(voucher && voucher.chiKhachMoi);
    const codeInput = document.getElementById("QLV_code");
    if (codeInput) codeInput.disabled = !!voucher;

    syncTypeHint();
    const modal = document.getElementById("QLV_modal");
    if (modal) modal.style.display = "flex";
  }

  function closeModal() {
    const modal = document.getElementById("QLV_modal");
    if (modal) modal.style.display = "none";
    editingCode = null;
  }

  function save() {
    const s = store();
    if (!s) {
      toast("Chưa nạp database/vouchers.js — không lưu được.", true);
      return;
    }
    const code = s.normalizeCode(document.getElementById("QLV_code")?.value);
    const title = (document.getElementById("QLV_title")?.value || "").trim();
    const type = document.getElementById("QLV_type")?.value === "percent" ? "percent" : "fixed";
    const value = Number(document.getElementById("QLV_value")?.value);
    const maxDiscount = Number(document.getElementById("QLV_maxDiscount")?.value) || 0;
    const minOrder = Number(document.getElementById("QLV_minOrder")?.value) || 0;
    const hanDungDate = document.getElementById("QLV_hanDung")?.value || "";
    const batDauDate = document.getElementById("QLV_ngayBatDau")?.value || "";
    const tongLuot = Math.max(0, Math.floor(Number(document.getElementById("QLV_tongLuot")?.value) || 0));
    const limit = Number(document.getElementById("QLV_limit")?.value) || 0;
    const status = document.getElementById("QLV_status")?.value === "inactive" ? "inactive" : "active";
    const chiKhachMoi = !!document.getElementById("QLV_chiKhachMoi")?.checked;

    if (!code) { toast("Nhập mã voucher.", true); return; }
    if (!/^[A-Z0-9_-]{2,30}$/.test(code)) { toast("Mã chỉ gồm chữ, số, gạch ngang/gạch dưới (2–30 ký tự).", true); return; }
    if (!title) { toast("Nhập tên chương trình.", true); return; }
    if (!(value > 0)) { toast("Giá trị giảm phải lớn hơn 0.", true); return; }
    if (type === "percent" && value > 100) { toast("Voucher phần trăm không được vượt 100%.", true); return; }
    if (minOrder < 0) { toast("Đơn tối thiểu không hợp lệ.", true); return; }
    if (type === "fixed" && minOrder > 0 && value > minOrder) { toast("Số tiền giảm không được lớn hơn đơn tối thiểu.", true); return; }
    if (batDauDate && hanDungDate && batDauDate > hanDungDate) { toast("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.", true); return; }
    if (hanDungDate && !editingCode && hanDungDate < new Date().toISOString().slice(0, 10)) { toast("Ngày kết thúc không được ở quá khứ.", true); return; }
    if (editingCode && tongLuot > 0 && tongLuot < usageCount(code)) { toast(`Tổng lượt không được nhỏ hơn số lượt đã dùng (${usageCount(code)}).`, true); return; }
    // Thêm mới mà mã đã tồn tại: chặn để không âm thầm ghi đè voucher đang chạy.
    if (!editingCode && s.find(code)) {
      toast(`Mã ${code} đã tồn tại. Bấm "Sửa" ở dòng đó nếu muốn cập nhật.`, true);
      return;
    }

    const result = s.upsert({
      code,
      title,
      description: (document.getElementById("QLV_description")?.value || "").trim(),
      type,
      value,
      maxDiscount: type === "percent" ? maxDiscount : 0,
      minOrder,
      ngayBatDau: batDauDate ? `${batDauDate}T00:00:00` : null,
      hanDung: hanDungDate ? `${hanDungDate}T23:59:59` : null,
      tongLuotDung: tongLuot,
      gioiHanMoiKhach: Math.max(0, Math.floor(limit)),
      chiKhachMoi,
      trangThai: status,
    });

    if (!result.ok) { toast(result.message || "Không lưu được voucher.", true); return; }
    toast(editingCode ? "Đã cập nhật voucher." : "Đã thêm voucher.");
    closeModal();
    render();
  }

  function bindEvents(root) {
    root.addEventListener("click", (event) => {
      const actionEl = event.target.closest("[data-qlv-action]");
      if (!actionEl) return;
      const action = actionEl.getAttribute("data-qlv-action");
      const code = actionEl.getAttribute("data-code");
      if (action === "close") { closeModal(); return; }
      if (action === "edit") { openModal(code); return; }
      if (action === "toggle") {
        const s = store();
        const voucher = s ? s.find(code) : null;
        if (!voucher) return;
        voucher.trangThai = voucher.trangThai === "active" ? "inactive" : "active";
        const result = s.upsert(voucher);
        toast(result.ok ? (voucher.trangThai === "active" ? "Đã bật voucher." : "Đã tạm dừng voucher.") : result.message, !result.ok);
        render();
        return;
      }
      if (action === "delete") {
        if (usageCount(code) > 0) { toast("Mã đã có đơn sử dụng nên không thể xóa. Hãy chọn \"Tạm dừng\".", true); return; }
        if (!window.confirm(`Xóa voucher ${code}? Khách sẽ không dùng được mã này nữa.`)) return;
        const s = store();
        const ok = s ? s.remove(code) : false;
        toast(ok ? "Đã xóa voucher." : "Không xóa được voucher.", !ok);
        render();
      }
    });

    document.getElementById("QLV_btnThem")?.addEventListener("click", () => openModal(null));
    document.getElementById("QLV_btnSave")?.addEventListener("click", save);
    document.getElementById("QLV_btnReset")?.addEventListener("click", () => {
      const s = store();
      if (!s) return;
      if (!window.confirm("Khôi phục toàn bộ voucher về danh sách mặc định? Các mã tự thêm sẽ bị mất.")) return;
      const ok = s.reset();
      toast(ok ? "Đã khôi phục voucher mặc định." : "Không khôi phục được.", !ok);
      render();
    });

    document.getElementById("QLV_search")?.addEventListener("input", (event) => {
      searchText = event.target.value || "";
      renderTable();
    });
    document.getElementById("QLV_filter")?.addEventListener("change", (event) => {
      statusFilter = event.target.value || "all";
      renderTable();
    });
    document.getElementById("QLV_type")?.addEventListener("change", syncTypeHint);

    document.getElementById("QLV_modal")?.addEventListener("click", (event) => {
      if (event.target.id === "QLV_modal") closeModal();
    });
  }

  function ensureMounted() {
    const section = document.getElementById(SECTION_ID);
    if (!section) return;
    if (!section.dataset.bound) {
      buildLayout(section);
      bindEvents(section);
      section.dataset.bound = "1";
    }
    render();
  }

  window.addEventListener("hashchange", ensureMounted);
  window.addEventListener("storage", (event) => {
    if (event && (event.key === "shopVouchers" || event.key === "DanhSachDatHang")) ensureMounted();
  });
  document.addEventListener("DOMContentLoaded", ensureMounted);
})();
