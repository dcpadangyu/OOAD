// ==================== QUẢN LÝ ĐƠN HÀNG (ADMIN) ====================
// Lưu ý: Toàn bộ dữ liệu chạy trên localStorage ở key: ordersLocal

(function () {
  const SECTION_ID = "page-orders";

  const ORDER_STATUS = {
    moiDat: "Mới đặt",
    daXuLy: "Đã xử lý",
    daGiao: "Đã giao",
    huy: "Hủy",
  };

  const PAYMENT_STATUS = {
    paid: "Đã thanh toán",
    unpaid: "Chưa thanh toán",
    refund: "Cần hoàn tiền",
  };

  function esc(v) {
    if (window.ShopCore && typeof window.ShopCore.esc === "function") return window.ShopCore.esc(v);
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function currency(v) {
    return (v || 0).toLocaleString("vi-VN") + "₫";
  }

  function getLocalOrders() {
    const key = "ordersLocal";
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const orders = JSON.parse(raw);
        if (!Array.isArray(orders)) return [];
        // Filter out any sample orders by checking if they have corresponding user orders
        const userOrders = JSON.parse(localStorage.getItem('DanhSachDatHang') || '[]');
        const realOrders = orders.filter(order => order && userOrders.some(uo => uo.maDonHang === order.maDonHang));
        return realOrders;
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  function saveLocalOrders(list) {
    localStorage.setItem("ordersLocal", JSON.stringify(list));
  }

  const itemsPerPage = 10;
  let currentPage = 1;

  function buildLayout(container) {
    container.innerHTML = `
      <div class="QLDH_page-header">
        <h3>Quản lý đơn hàng</h3>
        <p>Tra cứu theo ngày & trạng thái, xem chi tiết & cập nhật trạng thái</p>
      </div>

      <div class="QLDH_filters">
        <label>Từ ngày: <input type="date" id="QLDH_filterDateFrom" /></label>
        <label>Đến ngày: <input type="date" id="QLDH_filterDateTo" /></label>
        <select id="QLDH_filterStatus">
          <option value="all">Tất cả trạng thái</option>
          <option value="moiDat">Mới đặt</option>
          <option value="daXuLy">Đã xử lý</option>
          <option value="daGiao">Đã giao</option>
          <option value="huy">Hủy</option>
        </select>
        <input type="text" id="QLDH_searchId" placeholder="Tìm theo mã đơn..." />
        <button id="QLDH_btnSearch">Tìm</button>
      </div>

      <div class="QLDH_table-header">
        <table class="QLDH_admin-table">
          <thead>
            <tr>
              <th style="width:6%">STT</th>
              <th style="width:15%">Mã đơn</th>
              <th style="width:18%">Ngày</th>
              <th style="width:18%">Khách</th>
              <th style="width:15%">Tổng tiền</th>
              <th style="width:15%">Trạng thái</th>
              <th style="width:13%">Chi tiết</th>
            </tr>
          </thead>
        </table>
      </div>
      <div class="QLDH_table-content"></div>
      <div class="QLDH_pagination">
        <button id="QLDH_prevPage">Trang trước</button>
        <span id="QLDH_pageInfo"></span>
        <button id="QLDH_nextPage">Trang sau</button>
      </div>

      <div id="QLDH_modal" class="QLDH_modal" style="display:none">
        <div class="QLDH_modal-content">
          <div class="QLDH_modal-header">
            <h3>Chi tiết đơn hàng</h3>
            <span id="QLDH_closeModal" class="QLDH_close">&times;</span>
          </div>
          <div class="QLDH_modal-body">
            <div class="QLDH_md_info">
              <div class="QLDH_md_col">
                <p><strong>Mã đơn:</strong> <span id="QLDH_md_id"></span></p>
                <p><strong>Ngày đặt:</strong> <span id="QLDH_md_date"></span></p>
                <p><strong>Khách hàng:</strong> <span id="QLDH_md_customer"></span></p>
                <p><strong>Tài khoản:</strong> <span id="QLDH_md_username"></span></p>
                <p><strong>Số điện thoại:</strong> <span id="QLDH_md_phone"></span></p>
                <p><strong>Thanh toán:</strong> <span id="QLDH_md_payment"></span></p>
              </div>
              <div class="QLDH_md_col">
                <p><strong>Địa chỉ giao hàng:</strong></p>
                <p id="QLDH_md_address" class="QLDH_md_address"></p>
                <p><strong>Ghi chú:</strong></p>
                <p id="QLDH_md_note" class="QLDH_md_note"></p>
              </div>
            </div>
            <table class="QLDH_md_table">
              <thead>
                <tr>
                  <th>STT</th><th>Mã SP</th><th>Tên</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th>
                </tr>
              </thead>
              <tbody id="QLDH_md_tbody"></tbody>
            </table>
            <div class="QLDH_md_total">Tổng tiền: <span id="QLDH_md_total"></span></div>
            
            <!-- Phần cập nhật trạng thái -->
            <div class="QLDH_md_status-update">
              <label for="QLDH_md_statusSelect"><strong>🔄 Cập nhật trạng thái:</strong></label>
              <select id="QLDH_md_statusSelect">
                <option value="moiDat">Mới đặt</option>
                <option value="daXuLy">Đã xử lý</option>
                <option value="daGiao">Đã giao</option>
                <option value="huy">Hủy</option>
              </select>
              <button id="QLDH_md_btnUpdate" class="QLDH_md_btnUpdate">Cập nhật</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderPagination(list) {
    const totalPages = Math.max(1, Math.ceil(list.length / itemsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;
    
    // Update pagination controls
    const pageInfo = document.getElementById('QLDH_pageInfo');
    if (pageInfo) {
      pageInfo.textContent = `Trang ${currentPage}/${totalPages}`;
    }
    
    const prevBtn = document.getElementById('QLDH_prevPage');
    const nextBtn = document.getElementById('QLDH_nextPage');
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
  }

  function renderTable(list) {
    const wrap = document.querySelector(`#${SECTION_ID} .QLDH_table-content`);
    if (!wrap) return;
    wrap.innerHTML = "";
    const table = document.createElement("table");
    table.className = "QLDH_admin-table";
    const tbody = document.createElement("tbody");

    // Giới hạn trang hiện tại TRƯỚC khi cắt danh sách
    const totalPages = Math.max(1, Math.ceil(list.length / itemsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageItems = list.slice(startIndex, startIndex + itemsPerPage);

    pageItems.forEach((o, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${startIndex + idx + 1}</td>
        <td>${esc(o.maDonHang)}</td>
        <td>${esc(new Date(o.ngayDat).toLocaleString("vi-VN"))}</td>
        <td>${esc(o.tenNguoiNhan || "--")}</td>
        <td>${esc(currency(o.tongTien))}</td>
        <td>${esc(ORDER_STATUS[o.trangThaiQuanTri] || o.trangThaiQuanTri)}</td>
        <td><button class="QLDH_btn-detail" data-id="${esc(o.maDonHang)}">Xem</button></td>`;
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);

    renderPagination(list);

    // bind actions
    wrap.querySelectorAll(".QLDH_btn-detail").forEach((b) =>
      b.addEventListener("click", () => openDetail(b.dataset.id))
    );
  }

  function filterOrders(list) {
    const dateFrom = document.getElementById("QLDH_filterDateFrom").value;
    const dateTo = document.getElementById("QLDH_filterDateTo").value;
    const stVal = document.getElementById("QLDH_filterStatus").value;
    const idText = document.getElementById("QLDH_searchId").value.trim().toLowerCase();

    const filtered = list.filter((o) => {
      // Lọc theo khoảng ngày
      let okDate = true;
      if (dateFrom || dateTo) {
        const d = new Date(o.ngayDat);
        const orderDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (dateFrom && dateTo) {
          okDate = orderDate >= dateFrom && orderDate <= dateTo;
        } else if (dateFrom) {
          okDate = orderDate >= dateFrom;
        } else if (dateTo) {
          okDate = orderDate <= dateTo;
        }
      }
      const okStatus = stVal === "all" || o.trangThaiQuanTri === stVal;
      const okId = !idText || (o.maDonHang || "").toLowerCase().includes(idText);
      return okDate && okStatus && okId;
    });

    // Mới nhất lên đầu (theo ngayDat giảm dần; ngày không hợp lệ xuống cuối)
    const ts = (o) => {
      const t = new Date(o.ngayDat).getTime();
      return Number.isFinite(t) ? t : -Infinity;
    };
    return filtered
      .map((o, i) => ({ o, i }))
      .sort((a, b) => {
        const ta = ts(a.o);
        const tb = ts(b.o);
        if (ta === tb) return a.i - b.i;
        return tb > ta ? 1 : -1;
      })
      .map((x) => x.o);
  }

  function openDetail(id) {
    const orders = getLocalOrders();
    const o = orders.find((x) => x.maDonHang === id);
    if (!o) return;

    // Cập nhật thông tin cơ bản
    document.getElementById("QLDH_md_id").textContent = o.maDonHang;
    document.getElementById("QLDH_md_date").textContent = new Date(o.ngayDat).toLocaleString("vi-VN");
    document.getElementById("QLDH_md_customer").textContent = o.tenNguoiNhan || "--";
    document.getElementById("QLDH_md_username").textContent = o.hoTen || "--";
    document.getElementById("QLDH_md_phone").textContent = o.soDienThoaiNhan || "--";

    // Cập nhật địa chỉ và ghi chú
    const addressEl = document.getElementById("QLDH_md_address");
    addressEl.textContent = o.diaChiGiaoHang || "--";
    const payLabel = { COD: "Thanh toán khi nhận hàng", PayBank: "Chuyển khoản ngân hàng", Shop: "Nhận tại cửa hàng" }[o.phuongThucThanhToan] || o.phuongThucThanhToan || "--";
    const payStatusLabel = PAYMENT_STATUS[o.trangThaiThanhToan] || "";
    document.getElementById("QLDH_md_payment").textContent = payLabel + (payStatusLabel ? ` (${payStatusLabel})` : "");
    const noteParts = [o.ghiChu, `Phí vận chuyển: ${currency(o.tienVanChuyen)}`, o.thuDienTuNguoiNhan ? `Email: ${o.thuDienTuNguoiNhan}` : ""].filter(Boolean);
    // textContent: tự động an toàn trước XSS (không cần esc, tránh escape 2 lần)
    document.getElementById("QLDH_md_note").textContent = noteParts.join(" | ");

    // Cập nhật bảng sản phẩm
    const tbody = document.getElementById("QLDH_md_tbody");
    tbody.innerHTML = "";
    (o.chiTiet || []).forEach((it, i) => {
      const tr = document.createElement("tr");
      const returned = it.daTra || 0;
      const remaining = Math.max(0, (it.soLuong || 0) - returned);
      const tt = remaining * (it.donGia || 0);
      tr.innerHTML = `<td>${i + 1}</td><td>${esc(it.maSanPham)}</td><td>${esc(it.tenSanPham || "")}${it.kichCoDaChon ? " (size " + esc(it.kichCoDaChon) + ")" : ""}</td><td>${esc(it.soLuong)} <small>(còn: ${remaining})</small></td><td>${esc(currency(it.donGia))}</td><td>${esc(currency(tt))}</td>`;
      tbody.appendChild(tr);
    });

    document.getElementById("QLDH_md_total").textContent = currency(o.tongTien);
    
    // Cập nhật dropdown trạng thái và lưu ID đơn hàng
    // Chỉ cho chọn trạng thái hiện tại + các trạng thái kế tiếp hợp lệ
    const statusSelect = document.getElementById("QLDH_md_statusSelect");
    const current = o.trangThaiQuanTri || "moiDat";
    const next = window.ShopCore && typeof window.ShopCore.nextStatuses === "function"
      ? window.ShopCore.nextStatuses(current)
      : [];
    const allowed = [current, ...next.filter((s) => s !== current)];
    statusSelect.innerHTML = allowed
      .map((s) => `<option value="${esc(s)}">${esc(ORDER_STATUS[s] || s)}</option>`)
      .join("");
    statusSelect.value = current;
    statusSelect.dataset.orderId = id;
    const isFinal = next.length === 0;
    statusSelect.disabled = isFinal;
    document.getElementById("QLDH_md_btnUpdate").disabled = isFinal;
    
    document.getElementById("QLDH_modal").style.display = "flex";
  }

  function updateStatus(id, newStatus) {
    // ShopCore cập nhật cả 2 kho (ordersLocal + DanhSachDatHang), hoàn/trừ tồn kho và số lượng đã bán.
    const result = window.ShopCore
      ? window.ShopCore.setOrderStatus(id, newStatus)
      : { ok: false, message: "Thiếu module ShopCore (database/products-shoes.js)." };
    if (!result.ok) {
      alert(result.message || "Không thể cập nhật trạng thái đơn hàng.");
      return false;
    }
    renderTable(filterOrders(getLocalOrders()));
    return true;
  }

  function attachEvents() {
    // Pagination event handlers
    document.getElementById("QLDH_prevPage").addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable(filterOrders(getLocalOrders()));
      }
    });
    
    document.getElementById("QLDH_nextPage").addEventListener("click", () => {
      const list = filterOrders(getLocalOrders());
      const totalPages = Math.ceil(list.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderTable(list);
      }
    });

    document.getElementById("QLDH_btnSearch").addEventListener("click", () => {
      currentPage = 1;
      const list = filterOrders(getLocalOrders());
      renderTable(list);
    });
    document.getElementById("QLDH_filterDateFrom").addEventListener("change", () => {
      currentPage = 1;
      renderTable(filterOrders(getLocalOrders()));
    });
    document.getElementById("QLDH_filterDateTo").addEventListener("change", () => {
      currentPage = 1;
      renderTable(filterOrders(getLocalOrders()));
    });
    document.getElementById("QLDH_filterStatus").addEventListener("change", () => {
      currentPage = 1;
      renderTable(filterOrders(getLocalOrders()));
    });
    document.getElementById("QLDH_closeModal").addEventListener("click", () => {
      document.getElementById("QLDH_modal").style.display = "none";
    });
    
    // Event listener cho button cập nhật trạng thái trong modal
    document.getElementById("QLDH_md_btnUpdate").addEventListener("click", () => {
      const statusSelect = document.getElementById("QLDH_md_statusSelect");
      const orderId = statusSelect.dataset.orderId;
      const newStatus = statusSelect.value;
      if (orderId && updateStatus(orderId, newStatus)) {
        document.getElementById("QLDH_modal").style.display = "none";
      }
    });
    
    window.addEventListener("click", (e) => {
      const modal = document.getElementById("QLDH_modal");
      if (e.target === modal) modal.style.display = "none";
    });
  }

  function ensureMounted() {
    const sec = document.getElementById(SECTION_ID);
    if (!sec) return;
    // Build once
    if (!sec.dataset.bound) {
      buildLayout(sec);
      attachEvents();
      sec.dataset.bound = "1";
    }
    renderTable(filterOrders(getLocalOrders()));
  }

  // Chuyển đơn User -> định dạng Admin
  function toAdminOrder(o) {
    const userObj = o.khachHang || {};
    const extractedUserName = userObj.hoTen || "";
    const shippingFee = Number.isFinite(Number(o.tienVanChuyen)) ? Number(o.tienVanChuyen) : (o.phiVanChuyen === "30.000đ" ? 30000 : 0);
    return {
      maDonHang: o.maDonHang,
      ngayDat: o.ngayDat || new Date().toISOString(),
      tenNguoiNhan: o.tenNguoiNhan ? o.tenNguoiNhan : (extractedUserName || "Khách vãng lai"),
      soDienThoaiNhan: o.soDienThoaiNhan ? o.soDienThoaiNhan : "",
      diaChiGiaoHang: o.diaChiGiaoHang ? o.diaChiGiaoHang : "",
      thuDienTuNguoiNhan: o.thuDienTuNguoiNhan ? o.thuDienTuNguoiNhan : "",
      chiTiet: (o.chiTiet || []).map(p => ({
        maSanPham: p.maSanPham,
        tenSanPham: p.tenSanPham,
        kichCoDaChon: p.kichCoDaChon || "",
        soLuong: p.soLuong,
        donGia: p.donGia,
        daTra: 0
      })),
      tongTien: o.tongTien,
      trangThaiQuanTri: o.trangThaiQuanTri || (window.ShopCore ? window.ShopCore.USER_TO_ADMIN[o.trangThai] : "") || "moiDat",
      phuongThucThanhToan: o.phuongThucThanhToan,
      trangThaiThanhToan: o.trangThaiThanhToan || "",
      daTruKho: o.daTruKho,
      ...(o.ghiChu ? { ghiChu: o.ghiChu } : {}),
      tienVanChuyen: shippingFee,
      maKhachHang: o.maKhachHang || userObj.maKhachHang || null,
      hoTen: extractedUserName
    };
  }

  // Sync with user orders: thêm đơn mới và cập nhật trạng thái đơn đã có
  function syncUserOrders() {
    const userOrders = JSON.parse(localStorage.getItem('DanhSachDatHang') || '[]');
    const adminOrders = getLocalOrders();

    // Lấy tất cả đơn hàng từ user-side (bao gồm cả đơn không đăng nhập)
    const validUserOrders = userOrders.filter(order => order && order.maDonHang && order.chiTiet && order.chiTiet.length);

    const newOrders = validUserOrders.filter(uo => !adminOrders.some(ao => ao.maDonHang === uo.maDonHang));
    if (newOrders.length) {
      saveLocalOrders([...adminOrders, ...newOrders.map(toAdminOrder)]);
    }

    // Đơn User đã hủy nhưng bản Admin chưa biết (đơn cũ) -> đồng bộ hủy + hoàn kho.
    validUserOrders.forEach(uo => {
      if (uo.trangThai === 'da-huy' && uo.trangThaiQuanTri !== 'huy' && window.ShopCore) {
        window.ShopCore.setOrderStatus(uo.maDonHang, 'huy', { force: true });
      }
    });

    renderTable(filterOrders(getLocalOrders()));
  }

  // Listen for changes in user orders
  window.addEventListener('storage', (e) => {
    if (e.key === 'DanhSachDatHang') {
      syncUserOrders();
    } else if (e.key === 'ordersLocal') {
      renderTable(filterOrders(getLocalOrders()));
    }
  });

  // Also listen to a custom event fired from the user checkout flow (same-tab)
  window.addEventListener('userOrdersUpdated', () => {
    syncUserOrders();
  });
  // re-render when route changes
  window.addEventListener("hashchange", ensureMounted);
  document.addEventListener("DOMContentLoaded", () => {
    ensureMounted();
    syncUserOrders(); // Initial sync
  });
}
)();

