// ==================== BÁO CÁO DOANH THU ====================
(function () {
  const SECTION_ID = "page-reports";

  function currency(v) {
    return (v || 0).toLocaleString("vi-VN") + "₫";
  }

  function compactMoney(v) {
    const n = v || 0;
    if (n >= 1000000000) return (n / 1000000000).toLocaleString("vi-VN", { maximumFractionDigits: 2 }) + " tỷ";
    if (n >= 1000000) return (n / 1000000).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + "tr";
    if (n >= 1000) return (n / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + "k";
    return String(n);
  }

  function getOrders() {
    try {
      const adminOrders = JSON.parse(localStorage.getItem("ordersLocal") || "[]");
      const userOrders = JSON.parse(localStorage.getItem("DanhSachDatHang") || "[]");

      // Chuyển đổi đơn user sang cấu trúc admin để merge (đảm bảo luôn có đơn mới nhất dù chưa sync)
      const converted = (userOrders || [])
        .filter((o) => o && o.maDonHang && Array.isArray(o.chiTiet) && o.chiTiet.length)
        .map((o) => {
          const userObj = o.khachHang || {};
          const extractedUserName = userObj.hoTen || "";
          return {
            maDonHang: o.maDonHang,
            ngayDat: o.ngayDat || new Date().toISOString(),
            tenNguoiNhan: o.tenNguoiNhan ? o.tenNguoiNhan : (extractedUserName || "Khách vãng lai"),
            chiTiet: (o.chiTiet || []).map((p) => ({
              maSanPham: p.maSanPham,
              tenSanPham: p.tenSanPham,
              soLuong: p.soLuong,
              donGia: p.donGia,
            })),
            tongTien: o.tongTien || 0,
            trangThaiQuanTri: o.trangThaiQuanTri || (window.ShopCore && window.ShopCore.USER_TO_ADMIN ? window.ShopCore.USER_TO_ADMIN[o.trangThai] : "") || (o.trangThai === "da-huy" ? "huy" : "moiDat"),
          };
        });

      // Merge: đơn admin (đã cập nhật trạng thái) ở trước, đơn user chỉ thêm nếu chưa có id
      const byId = new Map();
      adminOrders.forEach((o) => o && o.maDonHang && byId.set(o.maDonHang, o));
      converted.forEach((o) => { if (!byId.has(o.maDonHang)) byId.set(o.maDonHang, o); });
      return Array.from(byId.values());
    } catch (e) {
      return [];
    }
  }

  function getItems(o) {
    if (Array.isArray(o.chiTiet) && o.chiTiet.length) return o.chiTiet;
    return [];
  }

  function esc(v) {
    if (window.ShopCore && typeof window.ShopCore.esc === "function") return window.ShopCore.esc(v);
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Dùng chính các dòng của đơn (tenSanPham/maSanPham trên dòng), KHÔNG lọc theo productsLocal
  // để sản phẩm đã bị xóa vẫn được tính -> bảng theo sản phẩm khớp tổng doanh thu.
  function getSaleItems(o) {
    return getItems(o).filter((it) => it && typeof it === "object");
  }

  // Doanh thu của 1 đơn = tổng donGia * soLuong của chiTiet (không tính phí vận chuyển)
  function orderRevenue(o) {
    return getSaleItems(o).reduce((s, it) => s + (Number(it.donGia) || 0) * (Number(it.soLuong) || 0), 0);
  }

  // Báo cáo chỉ tính đơn đã giao
  function isDelivered(o) {
    return !!o && o.trangThaiQuanTri === "daGiao";
  }

  function buildLayout(root) {
    root.innerHTML = `
      <div class="BCDT_header">
        <h3>Báo cáo doanh thu</h3>
        <p>Tổng quan doanh thu, biểu đồ cột và chi tiết doanh thu từng sản phẩm</p>
      </div>
      <div class="BCDT_filters">
        <div class="BCDT_time-filter">
          <label>Xem theo:</label>
          <select id="BCDT_viewType">
            <option value="day">Ngày</option>
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
            <option value="year">Năm</option>
          </select>
        </div>
        <div class="BCDT_date-range">
          <label>Từ ngày <input type="date" id="BCDT_from" /></label>
          <label>Đến ngày <input type="date" id="BCDT_to" /></label>
          <button id="BCDT_apply">Áp dụng</button>
        </div>
      </div>
      <div class="BCDT_cards">
        <div class="BCDT_card"><div class="title">Tổng doanh thu</div><div id="BCDT_total" class="value">0₫</div></div>
        <div class="BCDT_card"><div class="title">Số đơn</div><div id="BCDT_orders" class="value">0</div></div>
        <div class="BCDT_card"><div class="title">Giá trị TB/đơn</div><div id="BCDT_avg" class="value">0₫</div></div>
        <div class="BCDT_card"><div class="title">SL sản phẩm đã bán</div><div id="BCDT_qty" class="value">0</div></div>
      </div>
      <div class="BCDT_twoCols">
        <div class="BCDT_panel">
          <h4 id="BCDT_chartTitle">Doanh thu theo ngày</h4>
          <div id="BCDT_chart" class="BCDT_chartCols"></div>
        </div>
        <div class="BCDT_panel">
          <h4>Top sản phẩm bán chạy nhất</h4>
          <table class="BCDT_table"><thead><tr><th>#</th><th>Tên</th><th>SL</th><th>Doanh thu</th></tr></thead><tbody id="BCDT_top"></tbody></table>
        </div>
      </div>
      <div class="BCDT_panel BCDT_panel-full">
        <h4>Chi tiết doanh thu theo sản phẩm</h4>
        <div class="BCDT_tableWrap">
          <table class="BCDT_table BCDT_table-products">
            <thead><tr><th>STT</th><th>Mã SP</th><th>Tên sản phẩm</th><th>SL bán</th><th>Giá bán</th><th>Doanh thu</th><th>% doanh thu</th></tr></thead>
            <tbody id="BCDT_productDetail"></tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Parse "YYYY-MM-DD" (giá trị input type=date) theo giờ ĐỊA PHƯƠNG
  function parseLocalDate(str) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str || ""));
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return new Date(str);
  }

  function within(dateISO, fromISO, toISO) {
    const d = new Date(dateISO).getTime();
    if (!Number.isFinite(d)) return false;
    if (fromISO) {
      const f = parseLocalDate(fromISO).setHours(0, 0, 0, 0);
      if (d < f) return false;
    }
    if (toISO) {
      const t = parseLocalDate(toISO).setHours(23, 59, 59, 999);
      if (d > t) return false;
    }
    return true;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  // Tuần ISO-8601 theo giờ địa phương, khóa có đệm 0 (vd "2026-W07") để sắp xếp đúng thời gian
  function isoWeekParts(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayNum = (d.getDay() + 6) % 7; // Thứ Hai = 0
    d.setDate(d.getDate() - dayNum + 3); // Thứ Năm của tuần này
    const weekYear = d.getFullYear();
    const firstThursday = new Date(weekYear, 0, 4);
    const firstDayNum = (firstThursday.getDay() + 6) % 7;
    firstThursday.setDate(firstThursday.getDate() - firstDayNum + 3);
    const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86400000));
    return { year: weekYear, week: week };
  }

  function periodKey(date, viewType) {
    switch (viewType) {
      case "week": {
        const w = isoWeekParts(date);
        return `${w.year}-W${pad2(w.week)}`;
      }
      case "month":
        return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
      case "year":
        return String(date.getFullYear());
      default:
        return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
    }
  }

  function periodLabel(key, viewType) {
    switch (viewType) {
      case "week": {
        const parts = key.split("-W");
        return `Tuần ${parts[1]}/${parts[0]}`;
      }
      case "month": {
        const parts = key.split("-");
        return `${parts[1]}/${parts[0]}`;
      }
      case "year":
        return key;
      default: {
        const parts = key.split("-");
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
  }

  function compute(orders, from, to) {
    // Chỉ tính đơn ĐÃ GIAO có ngày đặt hợp lệ; bỏ qua đơn có ngày lỗi
    const filtered = orders.filter((o) => isDelivered(o) && within(o.ngayDat, from, to));
    const total = filtered.reduce((s, o) => s + orderRevenue(o), 0);
    const count = filtered.length;
    const avg = count ? Math.round(total / count) : 0;

    const viewType = document.getElementById("BCDT_viewType").value;
    const timeData = {};
    const prod = {};
    let totalQty = 0;

    filtered.forEach((o) => {
      const key = periodKey(new Date(o.ngayDat), viewType);
      timeData[key] = (timeData[key] || 0) + orderRevenue(o);

      getSaleItems(o).forEach((it) => {
        const qty = it.soLuong || 0;
        const price = it.donGia || 0;
        const idKey = it.maSanPham || it.tenSanPham || "?";
        if (!prod[idKey]) prod[idKey] = { id: idKey, name: it.tenSanPham || "Sản phẩm", qty: 0, rev: 0, price: price };
        prod[idKey].qty += qty;
        prod[idKey].rev += qty * price;
        prod[idKey].price = price || prod[idKey].price;
        totalQty += qty;
      });
    });

    const productDetail = Object.values(prod)
      .map((p) => ({ ...p, share: total ? Math.round((p.rev / total) * 100 * 10) / 10 : 0 }))
      .sort((a, b) => b.rev - a.rev);

    const top = [...productDetail].sort((a, b) => b.qty - a.qty).slice(0, 8);

    return { total, count, avg, totalQty, timeData, productDetail, top };
  }

  function renderChart(data) {
    const chart = document.getElementById("BCDT_chart");
    chart.innerHTML = "";
    const viewType = document.getElementById("BCDT_viewType").value;
    document.getElementById("BCDT_chartTitle").textContent =
      "Doanh thu theo " +
      (viewType === "day" ? "ngày" : viewType === "week" ? "tuần" : viewType === "month" ? "tháng" : "năm");

    const entries = Object.entries(data.timeData).sort((a, b) => a[0].localeCompare(b[0]));
    const max = entries.reduce((m, [, v]) => Math.max(m, v), 0) || 1;

    if (!entries.length) {
      chart.innerHTML = '<div class="BCDT_empty">Không có dữ liệu trong khoảng thời gian đã chọn</div>';
      return;
    }

    entries.forEach(([d, v]) => {
      const col = document.createElement("div");
      col.className = "BCDT_colItem";
      col.title = periodLabel(d, viewType) + ": " + currency(v);

      const val = document.createElement("div");
      val.className = "BCDT_colValue";
      val.textContent = compactMoney(v);

      const barBox = document.createElement("div");
      barBox.className = "BCDT_colBarBox";

      const bar = document.createElement("div");
      bar.className = "BCDT_colBar";
      bar.style.height = Math.max(3, Math.round((v / max) * 100)) + "%";

      barBox.appendChild(bar);

      const label = document.createElement("div");
      label.className = "BCDT_colLabel";
      label.textContent = periodLabel(d, viewType);

      col.appendChild(val);
      col.appendChild(barBox);
      col.appendChild(label);
      chart.appendChild(col);
    });
  }

  function renderTop(data) {
    const tb = document.getElementById("BCDT_top");
    tb.innerHTML = "";
    if (!data.top.length) {
      tb.innerHTML = '<tr><td colspan="4" class="BCDT_empty">Chưa có dữ liệu bán hàng</td></tr>';
      return;
    }
    data.top.forEach((t, i) => {
      const isBest = i === 0;
      const tr = document.createElement("tr");
      tr.innerHTML =
        '<td>' +
        (isBest
          ? '<span class="BCDT_rank best">' + (i + 1) + ' <i class="fa-solid fa-crown" aria-hidden="true"></i></span>'
          : '<span class="BCDT_rank">' + (i + 1) + "</span>") +
        "</td>" +
        "<td>" + esc(t.name) + "</td>" +
        "<td>" + t.qty + (isBest ? ' <small class="BCDT_bestTag">Bán chạy nhất</small>' : "") + "</td>" +
        "<td>" + currency(t.rev) + "</td>";
      tb.appendChild(tr);
    });
  }

  function renderProducts(data) {
    const tb = document.getElementById("BCDT_productDetail");
    tb.innerHTML = "";
    if (!data.productDetail.length) {
      tb.innerHTML = '<tr><td colspan="7" class="BCDT_empty">Chưa có dữ liệu bán hàng</td></tr>';
      return;
    }
    data.productDetail.forEach((p, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + (i + 1) + "</td>" +
        "<td>" + esc(p.id) + "</td>" +
        "<td>" + esc(p.name) + "</td>" +
        "<td>" + p.qty + "</td>" +
        "<td>" + currency(p.price) + "</td>" +
        "<td>" + currency(p.rev) + "</td>" +
        "<td>" + p.share + "%</td>";
      tb.appendChild(tr);
    });
  }

  function render(data) {
    document.getElementById("BCDT_total").textContent = currency(data.total);
    document.getElementById("BCDT_orders").textContent = String(data.count);
    document.getElementById("BCDT_avg").textContent = currency(data.avg);
    document.getElementById("BCDT_qty").textContent = String(data.totalQty);
    renderChart(data);
    renderTop(data);
    renderProducts(data);
  }

  function attach() {
    document.getElementById("BCDT_apply").addEventListener("click", () => {
      const from = document.getElementById("BCDT_from").value;
      const to = document.getElementById("BCDT_to").value;
      render(compute(getOrders(), from, to));
    });

    document.getElementById("BCDT_viewType").addEventListener("change", () => {
      const from = document.getElementById("BCDT_from").value;
      const to = document.getElementById("BCDT_to").value;
      render(compute(getOrders(), from, to));
    });
  }

  function ensureMounted() {
    const sec = document.getElementById(SECTION_ID);
    if (!sec) return;
    if (!sec.dataset.bound) {
      buildLayout(sec);
      attach();
      sec.dataset.bound = "1";
    }
    const from = document.getElementById("BCDT_from").value;
    const to = document.getElementById("BCDT_to").value;
    render(compute(getOrders(), from, to));
  }

  window.addEventListener("hashchange", ensureMounted);
  document.addEventListener("DOMContentLoaded", ensureMounted);
  window.addEventListener("storage", (e) => {
    if (e.key === "ordersLocal" || e.key === "DanhSachDatHang") ensureMounted();
  });
  window.addEventListener("userOrdersUpdated", ensureMounted);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) ensureMounted();
  });
})();