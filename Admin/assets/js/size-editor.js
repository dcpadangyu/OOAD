// ==================== TRÌNH NHẬP SIZE & TỒN KHO (ADMIN) ====================
// Thay cho ô nhập chuỗi "36:2, 37:0". Chọn khoảng size, chỉnh số lượng từng size bằng nút +/-,
// đặt nhanh cùng một số lượng cho mọi size. Dữ liệu trả về: { "36": 2, "37": 0, ... }
(function () {
  "use strict";

  const MIN_SIZE = 20;
  const MAX_SIZE = 60;
  const MAX_RANGE = 30;
  const MAX_QTY = 9999;
  const PRESETS = [
    { label: "Nữ 35 – 40", from: 35, to: 40 },
    { label: "Nam 38 – 44", from: 38, to: 44 },
    { label: "Phổ thông 36 – 44", from: 36, to: 44 },
    { label: "Rộng 35 – 45", from: 35, to: 45 },
  ];

  function clampQty(value) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(n, MAX_QTY);
  }

  function validSize(text) {
    const value = String(text).trim().replace(",", ".");
    if (!/^\d{2}(?:\.5)?$/.test(value)) return null;
    const n = Number(value);
    if (n < MIN_SIZE || n > MAX_SIZE) return null;
    return String(n);
  }

  function create(container, options) {
    const opts = options || {};
    let stock = {};

    container.classList.add("SZ-box");
    container.innerHTML = `
      <div class="SZ-presets">
        <span class="SZ-hint">Tạo nhanh:</span>
        ${PRESETS.map((p) => `<button type="button" class="SZ-chip" data-from="${p.from}" data-to="${p.to}">${p.label}</button>`).join("")}
      </div>
      <div class="SZ-tools">
        <label>Từ size <input type="number" class="SZ-from" min="${MIN_SIZE}" max="${MAX_SIZE}" value="36"></label>
        <label>Đến size <input type="number" class="SZ-to" min="${MIN_SIZE}" max="${MAX_SIZE}" value="44"></label>
        <label>SL mỗi size <input type="number" class="SZ-qty" min="0" max="${MAX_QTY}" value="0"></label>
        <button type="button" class="SZ-btn SZ-gen">Tạo size</button>
      </div>
      <div class="SZ-grid" aria-live="polite"></div>
      <div class="SZ-add">
        <label class="SZ-fill-label">Đặt tất cả =
          <input type="number" class="SZ-fillqty" min="0" max="${MAX_QTY}" value="0">
        </label>
        <button type="button" class="SZ-btn SZ-btn-light SZ-fill">Áp dụng</button>
      </div>
      <div class="SZ-footer">
        <span class="SZ-total"></span>
        <button type="button" class="SZ-link SZ-clear">Xóa hết size</button>
      </div>
      <div class="SZ-error" role="alert" hidden></div>`;

    const $ = (selector) => container.querySelector(selector);
    const grid = $(".SZ-grid");
    const totalEl = $(".SZ-total");
    const errorEl = $(".SZ-error");

    function sortedSizes() {
      return Object.keys(stock).sort((a, b) => Number(a) - Number(b));
    }

    function showError(message) {
      errorEl.textContent = message || "";
      errorEl.hidden = !message;
    }

    function updateTotal() {
      const sizes = sortedSizes();
      const total = sizes.reduce((sum, size) => sum + (Number(stock[size]) || 0), 0);
      totalEl.innerHTML = sizes.length
        ? `Tổng: <strong>${total}</strong> đôi · <strong>${sizes.length}</strong> size`
        : "Chưa có size nào";
      if (typeof opts.onChange === "function") opts.onChange(api);
    }

    function render() {
      const sizes = sortedSizes();
      if (!sizes.length) {
        grid.innerHTML = '<div class="SZ-empty">Chưa có size. Chọn "Tạo nhanh" hoặc nhập khoảng size rồi bấm <b>Tạo size</b>.</div>';
        updateTotal();
        return;
      }
      grid.innerHTML = sizes.map((size) => `
        <div class="SZ-cell${Number(stock[size]) === 0 ? " SZ-zero" : ""}" data-size="${size}">
          <button type="button" class="SZ-remove" title="Xóa size ${size}" aria-label="Xóa size ${size}">&times;</button>
          <div class="SZ-size">Size ${size}</div>
          <div class="SZ-stepper">
            <button type="button" class="SZ-step" data-delta="-1" aria-label="Giảm">&minus;</button>
            <input type="number" class="SZ-cellqty" min="0" max="${MAX_QTY}" value="${Number(stock[size]) || 0}" aria-label="Số lượng size ${size}">
            <button type="button" class="SZ-step" data-delta="1" aria-label="Tăng">+</button>
          </div>
        </div>`).join("");
      updateTotal();
    }

    function setQty(size, qty, cell) {
      stock[size] = clampQty(qty);
      if (cell) {
        cell.classList.toggle("SZ-zero", stock[size] === 0);
        const input = cell.querySelector(".SZ-cellqty");
        if (input && Number(input.value) !== stock[size]) input.value = stock[size];
      }
      updateTotal();
    }

    function generate(from, to, qty) {
      showError("");
      const a = Math.floor(Number(from));
      const b = Math.floor(Number(to));
      if (!Number.isFinite(a) || !Number.isFinite(b) || a < MIN_SIZE || b > MAX_SIZE) {
        return showError(`Size phải nằm trong khoảng ${MIN_SIZE} – ${MAX_SIZE}.`);
      }
      if (a > b) return showError("Size bắt đầu phải nhỏ hơn hoặc bằng size kết thúc.");
      if (b - a > MAX_RANGE) return showError(`Chỉ tạo tối đa ${MAX_RANGE + 1} size một lần.`);
      const amount = clampQty(qty);
      for (let size = a; size <= b; size += 1) {
        const key = String(size);
        if (!(key in stock)) stock[key] = amount;
      }
      render();
    }

    // ---- sự kiện ----
    container.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const chip = target.closest(".SZ-chip");
      if (chip) {
        $(".SZ-from").value = chip.dataset.from;
        $(".SZ-to").value = chip.dataset.to;
        generate(chip.dataset.from, chip.dataset.to, $(".SZ-qty").value);
        return;
      }
      if (target.closest(".SZ-gen")) return generate($(".SZ-from").value, $(".SZ-to").value, $(".SZ-qty").value);
      if (target.closest(".SZ-fill")) {
        const qty = clampQty($(".SZ-fillqty").value);
        sortedSizes().forEach((size) => { stock[size] = qty; });
        showError("");
        return render();
      }
      if (target.closest(".SZ-clear")) {
        if (sortedSizes().length && !window.confirm("Xóa toàn bộ size đang nhập?")) return;
        stock = {};
        showError("");
        return render();
      }
      const cell = target.closest(".SZ-cell");
      if (!cell) return;
      const size = cell.dataset.size;
      if (target.closest(".SZ-remove")) {
        delete stock[size];
        return render();
      }
      const step = target.closest(".SZ-step");
      if (step) setQty(size, (Number(stock[size]) || 0) + Number(step.dataset.delta), cell);
    });

    container.addEventListener("input", (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || !input.classList.contains("SZ-cellqty")) return;
      const cell = input.closest(".SZ-cell");
      if (!cell) return;
      stock[cell.dataset.size] = clampQty(input.value);
      cell.classList.toggle("SZ-zero", stock[cell.dataset.size] === 0);
      updateTotal();
    });

    // Enter không được gửi form; ở ô số lượng thì nhảy sang size kế tiếp.
    container.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || !(event.target instanceof HTMLInputElement)) return;
      event.preventDefault();
      const input = event.target;
      if (input.classList.contains("SZ-cellqty")) {
        const inputs = Array.from(container.querySelectorAll(".SZ-cellqty"));
        const next = inputs[inputs.indexOf(input) + 1];
        if (next) { next.focus(); next.select(); }
      } else if (input.classList.contains("SZ-from") || input.classList.contains("SZ-to") || input.classList.contains("SZ-qty")) {
        generate($(".SZ-from").value, $(".SZ-to").value, $(".SZ-qty").value);
      } else if (input.classList.contains("SZ-fillqty")) {
        $(".SZ-fill").click();
      }
    });

    container.addEventListener("focusin", (event) => {
      if (event.target instanceof HTMLInputElement && event.target.type === "number") event.target.select();
    });

    // ---- API ----
    const api = {
      getStock() {
        const sizes = sortedSizes();
        if (!sizes.length) return null;
        const result = {};
        sizes.forEach((size) => { result[size] = clampQty(stock[size]); });
        return result;
      },
      setStock(value) {
        stock = {};
        if (value && typeof value === "object" && !Array.isArray(value)) {
          Object.keys(value).forEach((size) => {
            const key = validSize(size) || (/^\d+(?:\.\d+)?$/.test(size) ? String(Number(size)) : null);
            if (key) stock[key] = clampQty(value[size]);
          });
        }
        showError("");
        render();
      },
      getTotal() {
        return sortedSizes().reduce((sum, size) => sum + (Number(stock[size]) || 0), 0);
      },
      // "36 - 44" nếu liên tục, ngược lại "36, 38, 40"
      getSizeText() {
        const sizes = sortedSizes();
        if (!sizes.length) return "";
        const numbers = sizes.map(Number);
        const contiguous = numbers.every((n, i) => Number.isInteger(n) && (i === 0 || n === numbers[i - 1] + 1));
        if (contiguous && sizes.length > 1) return `${sizes[0]} - ${sizes[sizes.length - 1]}`;
        return sizes.join(", ");
      },
      reset() {
        stock = {};
        $(".SZ-from").value = 36;
        $(".SZ-to").value = 44;
        $(".SZ-qty").value = 0;
        $(".SZ-fillqty").value = 0;
        showError("");
        render();
      },
    };

    render();
    return api;
  }

  window.SizeEditor = { create };
})();
