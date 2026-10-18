// ==================== QUẢN LÝ GIÁ BÁN ====================
(function () {
  const SECTION_ID = "page-prices";
  const esc = (value) => ShopCore.esc(value);

  function currency(v) {
    return (Number(v) || 0).toLocaleString("vi-VN") + "₫";
  }

  // Đọc/ghi dùng hàm dùng chung của database/products-shoes.js (saveLocalProducts trả về true/false)
  function readProducts() {
    try {
      return getLocalProducts() || [];
    } catch (error) {
      console.error("Không đọc được sản phẩm:", error);
      return [];
    }
  }

  function writeProducts(data) {
    return saveLocalProducts(data) === true;
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

  // Bộ lọc danh mục: lấy từ key "categories" + các maLoai đang có trên sản phẩm (không cố định theo hãng)
  function buildCategoryOptions() {
    const select = document.getElementById("QLGB_locDanhMuc");
    if (!select) return;
    const current = select.value || "all";
    const names = [];
    const add = (name) => {
      const text = String(name === undefined || name === null ? "" : name).trim();
      if (text && !names.some((x) => x.toLowerCase() === text.toLowerCase())) names.push(text);
    };
    ShopCore.readList("categories").forEach((cat) => cat && add(cat.tenLoai || cat.maLoai));
    readProducts().forEach((p) => add(p.maLoai));
    select.innerHTML =
      `<option value="all">Tất cả</option>` +
      names.map((name) => `<option value="${esc(name)}">${esc(name)}</option>`).join("");
    select.value = names.indexOf(current) !== -1 ? current : "all";
  }

  function calcPercent(p) {
    const cost = Number(p.giaNhap || 0);
    const sell = Number(p.giaBan || 0);
    if (!cost) return 0;
    return Math.round(((sell - cost) / cost) * 100);
  }

  function formatPriceValue(v) {
    const num = Number(v) || 0;
    return num.toLocaleString("vi-VN") + "₫";
  }

  function updatePriceFromPercent(p, percent) {
    const cost = Number(p.giaNhap || 0);
    const sell = Math.max(0, Math.round(cost * (1 + (Number(percent) || 0) / 100)));
    p.giaBan = sell;
    p.giaHienThi = formatPriceValue(sell);
  }

  // Pagination variables
  let currentPage = 1;
  const itemsPerPage = 10;

  function renderTable(list) {
    const wrap = document.querySelector(`#${SECTION_ID} .QLGB_table-content`);
    if (!wrap) return;
    wrap.innerHTML = "";
    const table = document.createElement("table");
    table.className = "QLGB_admin-table";
    const tbody = document.createElement("tbody");

    // Calculate pagination (kẹp trang hiện tại sau khi lọc/xóa)
    const totalPages = Math.max(1, Math.ceil(list.length / itemsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
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
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

    pageItems.forEach((p, i) => {
      const tr = document.createElement("tr");
      tr.dataset.id = p.maSanPham;
      const percent = calcPercent(p);
      const hinhAnh = String(p.hinhAnh || "");
      const imgSrc = hinhAnh.startsWith("data:") || hinhAnh.startsWith("http") ? hinhAnh : "../" + hinhAnh;
      const ma = esc(p.maSanPham);
      tr.innerHTML = `
        <td>${startIndex + i + 1}</td>
        <td>${ma}</td>
        <td>${hinhAnh ? `<img src="${esc(imgSrc)}" alt="${esc(p.tenSanPham)}" class="QLGB_img" />` : ""}</td>
        <td>${esc(p.tenSanPham)}</td>
        <td>${currency(p.giaNhap)}</td>
        <td>${percent}%</td>
        <td>${currency(p.giaBan)}</td>
        <td>
          <button class="QLGB_btn-edit-percent" data-id="${ma}">Sửa %LN</button>
          <button class="QLGB_btn-edit-price" data-id="${ma}">Sửa giá</button>
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
    const products = readProducts();
    const catEl = document.getElementById("QLGB_locDanhMuc");
    const qEl = document.getElementById("QLGB_timId");
    const cat = catEl ? catEl.value.toLowerCase() : "all";
    const q = qEl ? qEl.value.trim().toLowerCase() : "";
    return products.filter((p) => {
      const okCat = cat === "all" || String(p.maLoai || "").toLowerCase() === cat;
      const text = `${p.maSanPham} ${p.tenSanPham}`.toLowerCase();
      const okQ = !q || text.includes(q);
      return okCat && okQ;
    });
  }

  function findRowById(id) {
    return Array.from(document.querySelectorAll(`#${SECTION_ID} tr[data-id]`)).find((tr) => tr.dataset.id === id);
  }

  function showInlineEditor(id, mode) {
    // remove existing inline editor
    document
      .querySelectorAll(".QLGB_inlineEditor")
      .forEach((row) => row.remove());

    const p = readProducts().find((x) => x.maSanPham === id);
    if (!p) return;

    const hostRow = findRowById(id);
    if (!hostRow) return;

    const editorRow = document.createElement("tr");
    editorRow.className = "QLGB_inlineEditor";
    const colSpan = hostRow.children.length; // span entire row
    const currentPercent = calcPercent(p);
    const currentPrice = Number(p.giaBan) || 0;

    const label = mode === "percent" ? "% lợi nhuận" : "Giá bán (VNĐ)";
    const value = mode === "percent" ? currentPercent : currentPrice;

    editorRow.innerHTML = `
      <td colspan="${colSpan}">
        <div class="QLGB_editorWrap">
          <span class="QLGB_editorLabel">${label}:</span>
          <input type="number" class="QLGB_editorInput" id="QLGB_editorInput" value="${esc(value)}" min="0" />
          <button class="QLGB_editorSave" id="QLGB_editorSave">Lưu</button>
          <button class="QLGB_editorCancel" id="QLGB_editorCancel">Hủy</button>
        </div>
      </td>`;

    hostRow.insertAdjacentElement("afterend", editorRow);

    editorRow.querySelector("#QLGB_editorSave").addEventListener("click", () => {
      const raw = editorRow.querySelector("#QLGB_editorInput").value;
      const num = Number(raw);
      if (raw === "" || isNaN(num)) return alert("Giá trị không hợp lệ!");

      // Đọc lại dữ liệu mới nhất rồi mới sửa
      const list = readProducts();
      const sp = list.find((x) => x.maSanPham === id);
      if (!sp) return alert("Không tìm thấy sản phẩm!");
      const cost = Number(sp.giaNhap) || 0;

      if (mode === "percent") {
        if (num < 0) return alert("% lợi nhuận phải lớn hơn hoặc bằng 0!");
        if (cost <= 0) return alert("Sản phẩm chưa có giá nhập (giá vốn) nên không thể tính giá bán theo % lợi nhuận!");
        updatePriceFromPercent(sp, Math.round(num));
      } else {
        const gia = Math.round(num);
        if (gia <= 0) return alert("Giá bán phải lớn hơn 0!");
        if (gia < cost) {
          return alert(`Giá bán (${formatPriceValue(gia)}) không được thấp hơn giá nhập (${formatPriceValue(cost)})!`);
        }
        sp.giaBan = gia;
        sp.giaHienThi = formatPriceValue(gia);
      }
      if (!writeProducts(list)) return; // saveLocalProducts đã báo lỗi
      // saveLocalProducts đã phát "productsUpdated" để các trang khác đồng bộ
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
      const val = Number(document.getElementById("QLGB_percentDefault").value);
      if (isNaN(val) || val < 0) return alert("% lợi nhuận không hợp lệ");
      const all = readProducts();
      const filtered = currentFiltered().map((p) => p.maSanPham);
      let daApDung = 0;
      let boQua = 0;
      all.forEach((p) => {
        if (!filtered.includes(p.maSanPham)) return;
        if (!(Number(p.giaNhap) > 0)) {
          boQua++; // không có giá nhập thì không thể tính giá bán theo % lợi nhuận
          return;
        }
        updatePriceFromPercent(p, val);
        daApDung++;
      });
      if (daApDung === 0) {
        return alert(
          boQua > 0
            ? `Không áp dụng được: ${boQua} sản phẩm trong danh sách chưa có giá nhập (giá vốn).`
            : "Danh sách hiện tại không có sản phẩm nào!"
        );
      }
      if (!writeProducts(all)) return;
      renderTable(currentFiltered());
      alert(
        `Đã áp dụng % lợi nhuận cho ${daApDung} sản phẩm.` +
          (boQua > 0 ? ` Đã bỏ qua ${boQua} sản phẩm chưa có giá nhập (giá vốn).` : "")
      );
    });
    document.getElementById("QLGB_btnLookup").addEventListener("click", () => {
      const id = document.getElementById("QLGB_lookupId").value.trim();
      const list = readProducts();
      const p = list.find((x) => x.maSanPham === id);
      const box = document.getElementById("QLGB_lookupResult");
      if (!p) {
        box.innerHTML = `<div class="QLGB_notfound">Không tìm thấy sản phẩm!</div>`;
        return;
      }
      const percent = calcPercent(p);
      box.innerHTML = `
        <div class="QLGB_card">
          <div><strong>${esc(p.maSanPham)}</strong> - ${esc(p.tenSanPham)}</div>
          <div>Giá vốn: <strong>${currency(p.giaNhap)}</strong></div>
          <div>% lợi nhuận: <strong>${percent}%</strong></div>
          <div>Giá bán: <strong>${currency(p.giaBan)}</strong></div>
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
    buildCategoryOptions();
    renderTable(currentFiltered());
  }

  // Đồng bộ khi sản phẩm/loại thay đổi (giữ nguyên bộ lọc và trang hiện tại)
  function refreshIfMounted() {
    const sec = document.getElementById(SECTION_ID);
    if (!sec || !sec.dataset.bound) return;
    buildCategoryOptions();
    renderTable(currentFiltered());
  }

  window.addEventListener("hashchange", ensureMounted);
  window.addEventListener("productsUpdated", refreshIfMounted);
  window.addEventListener("categoriesUpdated", refreshIfMounted);
  window.addEventListener("storage", (event) => {
    if (event && (event.key === "productsLocal" || event.key === "categories")) refreshIfMounted();
  });
  document.addEventListener("DOMContentLoaded", ensureMounted);
})();
