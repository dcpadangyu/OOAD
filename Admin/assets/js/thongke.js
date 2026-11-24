// ==================== BÁO CÁO THỐNG KÊ: tab Doanh thu / Đơn hàng (UC53) / Tồn kho (UC54) ====================
// Tab "Doanh thu & bán chạy" giữ nguyên doanhthu.js (vẽ vào #BCDT_root). File này thêm 2 tab còn lại.
(function () {
  const STATUS = [
    { key: "moiDat", label: "Chờ xác nhận", color: "#f59e0b" },
    { key: "daXuLy", label: "Đang giao", color: "#3b82f6" },
    { key: "daGiao", label: "Thành công", color: "#16a34a" },
    { key: "huy", label: "Đã hủy", color: "#dc2626" },
  ];

  const esc = (v) => String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const money = (v) => (Number(v) || 0).toLocaleString("vi-VN") + "₫";
  const pad2 = (n) => String(n).padStart(2, "0");

  // ---------- dữ liệu ----------
  function readList(key) {
    try {
      const v = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }

  // Gộp đơn ở kho quản trị và kho của khách, bỏ trùng theo mã đơn
  function getOrders() {
    const map = {};
    ["DanhSachDatHang", "ordersLocal"].forEach((k) => readList(k).forEach((o) => {
      if (o && o.maDonHang) map[o.maDonHang] = Object.assign({}, map[o.maDonHang] || {}, o);
    }));
    return Object.values(map);
  }

  function getProducts() {
    try {
      if (typeof getLocalProducts === "function") return getLocalProducts() || [];
    } catch (e) { /* bỏ qua */ }
    return readList("productsLocal");
  }

  function nguongSapHet() {
    const n = parseInt(localStorage.getItem("nguongSapHet"), 10);
    return Number.isFinite(n) && n > 0 ? n : 10;
  }

  // ---------- mốc thời gian ----------
  function localDate(str) {
    if (!str) return null;
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function isoWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return { year: d.getUTCFullYear(), week: Math.ceil(((d - yearStart) / 86400000 + 1) / 7) };
  }

  function periodKey(date, type) {
    if (type === "year") return String(date.getFullYear());
    if (type === "month") return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
    if (type === "week") { const w = isoWeek(date); return `${w.year}-W${pad2(w.week)}`; }
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  function periodLabel(key, type) {
    if (type === "year") return key;
    if (type === "month") { const [y, m] = key.split("-"); return `${m}/${y}`; }
    if (type === "week") { const [y, w] = key.split("-W"); return `Tuần ${Number(w)}/${y}`; }
    const [y, m, d] = key.split("-"); return `${d}/${m}/${y}`;
  }

  // ================= UC53: Thống kê đơn hàng =================
  function thongKeDonHang(root) {
    root.innerHTML = `
      <div class="BCDT_filters TKE_filters">
        <div class="BCDT_time-filter">
          <label>Xem theo:</label>
          <select id="TKDH_viewType">
            <option value="day">Ngày</option><option value="week">Tuần</option>
            <option value="month" selected>Tháng</option><option value="year">Năm</option>
          </select>
        </div>
        <div class="BCDT_date-range">
          <label>Từ ngày <input type="date" id="TKDH_from" /></label>
          <label>Đến ngày <input type="date" id="TKDH_to" /></label>
          <button id="TKDH_apply" class="btn-primary">Áp dụng</button>
        </div>
      </div>
      <div id="TKDH_msg" class="TKE_msg" hidden></div>
      <div class="BCDT_cards" id="TKDH_cards"></div>
      <div class="BCDT_panel BCDT_panel-full">
        <h4>Số đơn theo mốc thời gian</h4>
        <div class="TKE_legend">${STATUS.map((s) => `<span><i style="background:${s.color}"></i>${s.label}</span>`).join("")}</div>
        <div id="TKDH_chart" class="TKE_stackChart"></div>
      </div>
      <div class="BCDT_panel BCDT_panel-full">
        <h4>Bảng số đơn theo trạng thái</h4>
        <div class="BCDT_tableWrap"><table class="BCDT_table" id="TKDH_table"></table></div>
      </div>`;
    root.querySelector("#TKDH_apply").addEventListener("click", renderOrders);
  }

  function renderOrders() {
    const type = document.getElementById("TKDH_viewType").value;
    const fromStr = document.getElementById("TKDH_from").value;
    const toStr = document.getElementById("TKDH_to").value;
    const msg = document.getElementById("TKDH_msg");
    const from = localDate(fromStr);
    const to = localDate(toStr);
    if (from && to && from > to) {
      msg.textContent = "Từ ngày không được lớn hơn đến ngày. Vui lòng chọn lại khoảng thời gian.";
      msg.hidden = false;
      document.getElementById("TKDH_cards").innerHTML = "";
      document.getElementById("TKDH_chart").innerHTML = "";
      document.getElementById("TKDH_table").innerHTML = "";
      return;
    }
    const orders = getOrders().filter((o) => {
      const d = new Date(o.ngayDat);
      if (isNaN(d.getTime())) return false;
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return (!from || day >= from) && (!to || day <= to);
    });
    if (!orders.length) {
      msg.textContent = "Không có đơn hàng trong khoảng thời gian đã chọn.";
      msg.hidden = false;
    } else {
      msg.hidden = true;
    }

    const total = { all: orders.length };
    STATUS.forEach((s) => { total[s.key] = 0; });
    const buckets = {};
    orders.forEach((o) => {
      const st = STATUS.some((s) => s.key === o.trangThaiQuanTri) ? o.trangThaiQuanTri : "moiDat";
      total[st] += 1;
      const key = periodKey(new Date(o.ngayDat), type);
      buckets[key] = buckets[key] || { all: 0 };
      buckets[key][st] = (buckets[key][st] || 0) + 1;
      buckets[key].all += 1;
    });
    const cancelRate = total.all ? Math.round((total.huy / total.all) * 1000) / 10 : 0;

    document.getElementById("TKDH_cards").innerHTML = `
      <div class="BCDT_card"><div class="title">Tổng số đơn</div><div class="value">${total.all}</div></div>
      ${STATUS.map((s) => `<div class="BCDT_card"><div class="title">${s.label}</div><div class="value" style="color:${s.color}">${total[s.key]}</div></div>`).join("")}
      <div class="BCDT_card"><div class="title">Tỷ lệ hủy</div><div class="value">${cancelRate}%</div></div>`;

    const keys = Object.keys(buckets).sort();
    const max = Math.max(1, ...keys.map((k) => buckets[k].all));
    document.getElementById("TKDH_chart").innerHTML = keys.length
      ? keys.map((k) => {
        const b = buckets[k];
        const segs = STATUS.filter((s) => b[s.key])
          .map((s) => `<i title="${s.label}: ${b[s.key]}" style="height:${(b[s.key] / max) * 100}%;background:${s.color}"></i>`).join("");
        return `<div class="TKE_col"><span class="TKE_colVal">${b.all}</span><div class="TKE_colBar">${segs}</div><span class="TKE_colLbl">${esc(periodLabel(k, type))}</span></div>`;
      }).join("")
      : '<p class="TKE_empty">Không có dữ liệu.</p>';

    document.getElementById("TKDH_table").innerHTML = `
      <thead><tr><th>Mốc thời gian</th>${STATUS.map((s) => `<th>${s.label}</th>`).join("")}<th>Tổng</th><th>Tỷ lệ hủy</th></tr></thead>
      <tbody>${keys.map((k) => {
        const b = buckets[k];
        const rate = b.all ? Math.round(((b.huy || 0) / b.all) * 1000) / 10 : 0;
        return `<tr><td>${esc(periodLabel(k, type))}</td>${STATUS.map((s) => `<td>${b[s.key] || 0}</td>`).join("")}<td><b>${b.all}</b></td><td>${rate}%</td></tr>`;
      }).join("") || `<tr><td colspan="${STATUS.length + 3}" style="text-align:center">Không có dữ liệu</td></tr>`}</tbody>
      ${keys.length ? `<tfoot><tr><td><b>Tổng</b></td>${STATUS.map((s) => `<td><b>${total[s.key]}</b></td>`).join("")}<td><b>${total.all}</b></td><td><b>${cancelRate}%</b></td></tr></tfoot>` : ""}`;
  }

  // ================= UC54: Thống kê tồn kho =================
  function tinhTrang(sp, nguong) {
    const ton = Number(sp.soLuongTon) || 0;
    if (ton === 0) return "hetHang";
    if (ton < nguong) return "sapHet";
    return "binhThuong";
  }
  const TINH_TRANG = { binhThuong: "Bình thường", sapHet: "Sắp hết hàng", hetHang: "Hết hàng" };

  function thongKeTonKho(root) {
    root.innerHTML = `
      <div class="BCDT_filters TKE_filters">
        <label>Danh mục <select id="TKTK_danhMuc"><option value="all">Tất cả</option></select></label>
        <label>Size <select id="TKTK_size"><option value="">Tất cả size</option></select></label>
        <label>Tình trạng <select id="TKTK_tinhTrang">
          <option value="all">Tất cả</option><option value="binhThuong">Bình thường</option>
          <option value="sapHet">Sắp hết hàng</option><option value="hetHang">Hết hàng</option></select></label>
        <label>Xem bảng theo <select id="TKTK_nhom"><option value="danhMuc">Danh mục</option><option value="size">Size</option></select></label>
      </div>
      <div id="TKTK_msg" class="TKE_msg" hidden></div>
      <div class="BCDT_cards" id="TKTK_cards"></div>
      <div class="BCDT_panel BCDT_panel-full">
        <h4 id="TKTK_title">Tồn kho theo danh mục</h4>
        <div class="BCDT_tableWrap"><table class="BCDT_table" id="TKTK_table"></table></div>
      </div>`;
    ["TKTK_danhMuc", "TKTK_size", "TKTK_tinhTrang", "TKTK_nhom"].forEach((id) =>
      root.querySelector("#" + id).addEventListener("change", renderStock));
  }

  function fillStockFilters(products) {
    const dmSel = document.getElementById("TKTK_danhMuc");
    const sizeSel = document.getElementById("TKTK_size");
    const dmCur = dmSel.value;
    const sizeCur = sizeSel.value;
    const dms = [...new Set(products.map((p) => p.maLoai).filter(Boolean))].sort();
    dmSel.innerHTML = '<option value="all">Tất cả</option>' + dms.map((d) => `<option value="${esc(d)}">${esc(d)}</option>`).join("");
    if (dms.includes(dmCur)) dmSel.value = dmCur;
    const sizes = [...new Set(products.flatMap((p) => Object.keys(p.tonKhoTheoSize || {})))].sort((a, b) => Number(a) - Number(b));
    sizeSel.innerHTML = '<option value="">Tất cả size</option>' + sizes.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join("");
    if (sizes.includes(sizeCur)) sizeSel.value = sizeCur;
  }

  function renderStock() {
    const all = getProducts();
    const msg = document.getElementById("TKTK_msg");
    if (!all.length) {
      msg.textContent = "Chưa có dữ liệu tồn kho.";
      msg.hidden = false;
      document.getElementById("TKTK_cards").innerHTML = "";
      document.getElementById("TKTK_table").innerHTML = "";
      return;
    }
    msg.hidden = true;
    fillStockFilters(all);
    const nguong = nguongSapHet();
    const dm = document.getElementById("TKTK_danhMuc").value;
    const size = document.getElementById("TKTK_size").value;
    const tt = document.getElementById("TKTK_tinhTrang").value;
    const nhom = document.getElementById("TKTK_nhom").value;

    let list = all;
    if (dm !== "all") list = list.filter((p) => p.maLoai === dm);
    if (size) list = list.filter((p) => (p.tonKhoTheoSize || {})[size] !== undefined);
    if (tt !== "all") list = list.filter((p) => tinhTrang(p, nguong) === tt);

    // số đôi / giá trị: khi chọn 1 size thì chỉ tính size đó
    const soDoi = (p) => (size ? Number((p.tonKhoTheoSize || {})[size]) || 0 : Number(p.soLuongTon) || 0);
    const tongDoi = list.reduce((s, p) => s + soDoi(p), 0);
    const giaTri = list.reduce((s, p) => s + soDoi(p) * (Number(p.giaNhap) || 0), 0);
    const sapHet = list.filter((p) => tinhTrang(p, nguong) === "sapHet").length;
    const hetHang = list.filter((p) => tinhTrang(p, nguong) === "hetHang").length;
    document.getElementById("TKTK_cards").innerHTML = `
      <div class="BCDT_card"><div class="title">Số sản phẩm</div><div class="value">${list.length}</div></div>
      <div class="BCDT_card"><div class="title">Tổng số đôi</div><div class="value">${tongDoi.toLocaleString("vi-VN")}</div></div>
      <div class="BCDT_card"><div class="title">Giá trị tồn (theo giá nhập)</div><div class="value">${money(giaTri)}</div></div>
      <div class="BCDT_card"><div class="title">Sắp hết (dưới ${nguong} đôi)</div><div class="value" style="color:#d97706">${sapHet}</div></div>
      <div class="BCDT_card"><div class="title">Hết hàng</div><div class="value" style="color:#dc2626">${hetHang}</div></div>`;

    const table = document.getElementById("TKTK_table");
    if (nhom === "size") {
      document.getElementById("TKTK_title").textContent = "Tồn kho theo size";
      const map = {};
      list.forEach((p) => Object.entries(p.tonKhoTheoSize || {}).forEach(([sz, q]) => {
        if (size && sz !== size) return;
        const m = (map[sz] = map[sz] || { soSP: 0, soDoi: 0, giaTri: 0, het: 0 });
        m.soSP += 1;
        m.soDoi += Number(q) || 0;
        m.giaTri += (Number(q) || 0) * (Number(p.giaNhap) || 0);
        if (!(Number(q) > 0)) m.het += 1;
      }));
      const keys = Object.keys(map).sort((a, b) => Number(a) - Number(b));
      table.innerHTML = `<thead><tr><th>Size</th><th>Số sản phẩm có size</th><th>Tổng số đôi</th><th>Giá trị tồn</th><th>Sản phẩm hết size này</th></tr></thead>
        <tbody>${keys.map((k) => `<tr><td><b>${esc(k)}</b></td><td>${map[k].soSP}</td><td>${map[k].soDoi}</td><td>${money(map[k].giaTri)}</td><td>${map[k].het}</td></tr>`).join("") || '<tr><td colspan="5" style="text-align:center">Không có dữ liệu</td></tr>'}</tbody>`;
    } else {
      document.getElementById("TKTK_title").textContent = "Tồn kho theo danh mục";
      const map = {};
      list.forEach((p) => {
        const k = p.maLoai || "Khác";
        const m = (map[k] = map[k] || { soSP: 0, soDoi: 0, giaTri: 0, sapHet: 0, het: 0 });
        m.soSP += 1;
        m.soDoi += soDoi(p);
        m.giaTri += soDoi(p) * (Number(p.giaNhap) || 0);
        const t = tinhTrang(p, nguong);
        if (t === "sapHet") m.sapHet += 1;
        if (t === "hetHang") m.het += 1;
      });
      const keys = Object.keys(map).sort();
      table.innerHTML = `<thead><tr><th>Danh mục</th><th>Số sản phẩm</th><th>Tổng số đôi</th><th>Giá trị tồn</th><th>Sắp hết</th><th>Hết hàng</th></tr></thead>
        <tbody>${keys.map((k) => `<tr><td><b>${esc(k)}</b></td><td>${map[k].soSP}</td><td>${map[k].soDoi}</td><td>${money(map[k].giaTri)}</td><td>${map[k].sapHet}</td><td>${map[k].het}</td></tr>`).join("") || '<tr><td colspan="6" style="text-align:center">Không có dữ liệu</td></tr>'}</tbody>`;
    }
  }

  // ================= tab =================
  let tab = "revenue";
  function showTab(next) {
    tab = next;
    document.querySelectorAll("#TKE_tabs [data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    const panes = { revenue: "BCDT_root", orders: "TKDH_root", stock: "TKTK_root" };
    Object.entries(panes).forEach(([k, id]) => { const el = document.getElementById(id); if (el) el.hidden = k !== tab; });
    if (tab === "orders") renderOrders();
    if (tab === "stock") renderStock();
  }

  function mount() {
    const tabs = document.getElementById("TKE_tabs");
    if (!tabs || tabs.dataset.bound) return;
    tabs.dataset.bound = "1";
    thongKeDonHang(document.getElementById("TKDH_root"));
    thongKeTonKho(document.getElementById("TKTK_root"));
    tabs.addEventListener("click", (e) => {
      const b = e.target.closest("[data-tab]");
      if (b) showTab(b.dataset.tab);
    });
  }

  function refresh() {
    mount();
    if (location.hash !== "#/reports") return;
    if (tab === "orders") renderOrders();
    if (tab === "stock") renderStock();
  }

  document.addEventListener("DOMContentLoaded", refresh);
  window.addEventListener("hashchange", refresh);
  window.addEventListener("storage", (e) => {
    if (["ordersLocal", "DanhSachDatHang", "productsLocal", "nguongSapHet"].includes(e.key)) refresh();
  });
  window.ThongKe = { showTab, renderOrders, renderStock };
})();
