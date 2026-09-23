// ==================== QUẢN LÝ GIÁ BÁN ====================
(function () {
  const SECTION_ID = "page-prices";

  function currency(v) {
    return (v || 0).toLocaleString("vi-VN") + "₫";
  }

  function getLocalProducts() {
    const data = localStorage.getItem("productsLocal");
    if (data) return JSON.parse(data);
    if (typeof products !== "undefined") {
      localStorage.setItem("productsLocal", JSON.stringify(products));
      return products;
    }
    return [];
  }

  function saveLocalProducts(data) {
    localStorage.setItem("productsLocal", JSON.stringify(data));
  }

  function buildLayout(root) {
    root.innerHTML = `
      <div class="QLGB_page-header">
        <h3>Quản lý giá bán</h3>
        <p>Hiển thị/nhập % lợi nhuận và tra cứu giá vốn, %LN, giá bán</p>
      </div>

      <div class="QLGB_lookup">
        <h4>Tra cứu nhanh</h4>
        <div class="QLGB_lookup_row">
          <input type="text" id="QLGB_lookupId" placeholder="Nhập mã sản phẩm..." />
          <button id="QLGB_btnLookup">Tra cứu</button>
        </div>
        <div id="QLGB_lookupResult" class="QLGB_lookup_result"></div>
      </div>

      <div class="QLGB_filters">
        <select id="QLGB_locDanhMuc">
          <option value="all">Tất cả</option>
          <option value="Nike">Nike</option>
          <option value="Adidas">Adidas</option>
          <option value="Converse">Converse</option>
          <option value="MLB">MLB</option>
          <option value="Vans">Vans</option>
        </select>
        <input type="text" id="QLGB_timId" placeholder="Tìm theo mã/tên..." />
        <div class="QLGB_inline">
          <label>% Lợi nhuận mặc định</label>
          <input type="number" id="QLGB_percentDefault" value="20" min="0" max="300" />
          <button id="QLGB_btnApDung">Áp dụng cho danh sách</button>
        </div>
      </div>

      <div class="QLGB_table-header">
        <table class="QLGB_admin-table">
          <thead>
            <tr>
              <th style="width:6%">STT</th>
              <th style="width:12%">Mã</th>
              <th style="width:10%">Ảnh</th>
              <th style="width:22%">Tên sản phẩm</th>
              <th style="width:12%">Giá vốn</th>
              <th style="width:10%">% LN</th>
              <th style="width:12%">Giá bán</th>
              <th style="width:13%">Tác vụ</th>
            </tr>
          </thead>
        </table>
      </div>
      <div class="QLGB_table-content"></div>
      <div class="QLGB_pagination">
        <button id="QLGB_prevPage">Trang trước</button>
        <span id="QLGB_pageInfo"></span>
        <button id="QLGB_nextPage">Trang sau</button>
      </div>
    `;
  }

  function calcPercent(p) {
    const cost = Number(p.importPrice || 0);
    const sell = Number(p.priceValue || 0);
    if (!cost) return 0;
    return Math.round(((sell - cost) / cost) * 100);
  }

  function formatPriceValue(v) {
    const num = Number(v) || 0;
    return num.toLocaleString("vi-VN") + "₫";
  }

  function updatePriceFromPercent(p, percent) {
    const cost = Number(p.importPrice || 0);
    const sell = Math.max(0, Math.round(cost * (1 + (Number(percent) || 0) / 100)));
    p.priceValue = sell;
    p.price = formatPriceValue(sell);
  }

  // Pagination variables
  let currentPage = 1;
  const itemsPerPage = 10;

  function renderTable(list) {
    const wrap = document.querySelector(`#${SECTION_ID} .QLGB_table-content`);
    wrap.innerHTML = "";
    const table = document.createElement("table");
    table.className = "QLGB_admin-table";
    const tbody = document.createElement("tbody");

    // Calculate pagination
    const totalPages = Math.ceil(list.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, list.length);
    const pageItems = list.slice(startIndex, endIndex);

    // Update pagination controls
    const pageInfo = document.getElementById('QLGB_pageInfo');
    if (pageInfo) {
      pageInfo.textContent = `Trang ${currentPage}/${totalPages}`;
    }
    
    const prevBtn = document.getElementById('QLGB_prevPage');
    const nextBtn = document.getElementById('QLGB_nextPage');
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;

    pageItems.forEach((p, i) => {
      const tr = document.createElement("tr");
      tr.dataset.id = p.id;
      const percent = calcPercent(p);
      tr.innerHTML = `
        <td>${startIndex + i + 1}</td>
        <td>${p.id}</td>
        <td>${p.image ? `<img src="${p.image.startsWith('data:') || p.image.startsWith('http') ? p.image : '../' + p.image}" alt="${p.name}" class="QLGB_img" />` : ""}</td>
        <td>${p.name}</td>
        <td>${currency(p.importPrice)}</td>
        <td>${percent}%</td>
        <td>${currency(p.priceValue)}</td>
        <td>
          <button class="QLGB_btn-edit-percent" data-id="${p.id}">Sửa %LN</button>
          <button class="QLGB_btn-edit-price" data-id="${p.id}">Sửa giá</button>
        </td>`;
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);

    wrap.querySelectorAll(".QLGB_btn-edit-percent").forEach((b) =>
      b.addEventListener("click", () => showInlineEditor(b.dataset.id, "percent"))
    );
    wrap.querySelectorAll(".QLGB_btn-edit-price").forEach((b) =>
      b.addEventListener("click", () => showInlineEditor(b.dataset.id, "price"))
    );
  }

  function currentFiltered() {
    const products = getLocalProducts();
    const cat = document.getElementById("QLGB_locDanhMuc").value;
    const q = document.getElementById("QLGB_timId").value.trim().toLowerCase();
    return products.filter((p) => {
      const okCat = cat === "all" || p.catalog === cat;
      const text = `${p.id} ${p.name}`.toLowerCase();
      const okQ = !q || text.includes(q);
      return okCat && okQ;
    });
  }

  function showInlineEditor(id, mode) {
    // remove existing inline editor
    document
      .querySelectorAll(".QLGB_inlineEditor")
      .forEach((row) => row.remove());

    const list = getLocalProducts();
    const p = list.find((x) => x.id === id);
    if (!p) return;

    const hostRow = document.querySelector(`tr[data-id="${id}"]`);
    if (!hostRow) return;

    const editorRow = document.createElement("tr");
    editorRow.className = "QLGB_inlineEditor";
    const colSpan = hostRow.children.length; // span entire row
    const currentPercent = calcPercent(p);
    const currentPrice = p.priceValue || 0;

    const label = mode === "percent" ? "% lợi nhuận" : "Giá bán (VNĐ)";
    const value = mode === "percent" ? currentPercent : currentPrice;

    editorRow.innerHTML = `
      <td colspan="${colSpan}">
        <div class="QLGB_editorWrap">
          <span class="QLGB_editorLabel">${label}:</span>
          <input type="number" class="QLGB_editorInput" id="QLGB_editorInput" value="${value}" min="0" />
          <button class="QLGB_editorSave" id="QLGB_editorSave">Lưu</button>
          <button class="QLGB_editorCancel" id="QLGB_editorCancel">Hủy</button>
        </div>
      </td>`;

    hostRow.insertAdjacentElement("afterend", editorRow);

    editorRow.querySelector("#QLGB_editorSave").addEventListener("click", () => {
      const raw = editorRow.querySelector("#QLGB_editorInput").value;
      const num = Math.max(0, Math.round(Number(raw) || 0));
      if (mode === "percent") {
        updatePriceFromPercent(p, num);
      } else {
        p.priceValue = num;
        p.price = formatPriceValue(num);
      }
      saveLocalProducts(list);
      // thông báo toàn cục để các trang khác đồng bộ ngay
      window.dispatchEvent(new CustomEvent("productsUpdated"));
      renderTable(currentFiltered());
    });

    editorRow.querySelector("#QLGB_editorCancel").addEventListener("click", () => {
      editorRow.remove();
    });
  }

  function bindEvents() {
    document.getElementById("QLGB_locDanhMuc").addEventListener("change", () => {
      currentPage = 1; // Reset to first page when filter changes
      renderTable(currentFiltered());
    });
    document.getElementById("QLGB_timId").addEventListener("input", () => {
      currentPage = 1; // Reset to first page when search changes
      renderTable(currentFiltered());
    });
    
    // Pagination event handlers
    document.getElementById("QLGB_prevPage").addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable(currentFiltered());
      }
    });
    
    document.getElementById("QLGB_nextPage").addEventListener("click", () => {
      const list = currentFiltered();
      const totalPages = Math.ceil(list.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderTable(list);
      }
    });

    document.getElementById("QLGB_btnApDung").addEventListener("click", () => {
      const val = Number(document.getElementById("QLGB_percentDefault").value || 0);
      if (isNaN(val) || val < 0) return alert("% lợi nhuận không hợp lệ");
      const all = getLocalProducts();
      const filtered = currentFiltered().map((p) => p.id);
      all.forEach((p) => {
        if (filtered.includes(p.id)) updatePriceFromPercent(p, val);
      });
      saveLocalProducts(all);
      window.dispatchEvent(new CustomEvent("productsUpdated"));
      renderTable(currentFiltered());
      alert("Đã áp dụng % lợi nhuận cho danh sách hiện tại!");
    });
    document.getElementById("QLGB_btnLookup").addEventListener("click", () => {
      const id = document.getElementById("QLGB_lookupId").value.trim();
      const list = getLocalProducts();
      const p = list.find((x) => x.id === id);
      const box = document.getElementById("QLGB_lookupResult");
      if (!p) {
        box.innerHTML = `<div class="QLGB_notfound">Không tìm thấy sản phẩm!</div>`;
        return;
      }
      const percent = calcPercent(p);
      box.innerHTML = `
        <div class="QLGB_card">
          <div><strong>${p.id}</strong> - ${p.name}</div>
          <div>Giá vốn: <strong>${currency(p.importPrice)}</strong></div>
          <div>% lợi nhuận: <strong>${percent}%</strong></div>
          <div>Giá bán: <strong>${currency(p.priceValue)}</strong></div>
        </div>`;
    });
  }

  function ensureMounted() {
    const sec = document.getElementById(SECTION_ID);
    if (!sec) return;
    if (!sec.dataset.bound) {
      buildLayout(sec);
      bindEvents();
      sec.dataset.bound = "1";
    }
    renderTable(currentFiltered());
  }

  window.addEventListener("hashchange", ensureMounted);
  document.addEventListener("DOMContentLoaded", ensureMounted);
})();


