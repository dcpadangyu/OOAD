document.addEventListener("DOMContentLoaded", () => {
  // Kiem tra dang nhap TRUOC khi ve dia chi / gio hang.
  const currentUser = window.UserSession?.getCurrentUser?.() || null;
  if (!currentUser) { window.location.href = "pages/login.html"; return; }
  const cart = window.getCheckoutCart ? window.getCheckoutCart() : [];
  if (!cart.length) { alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán."); window.location.href = "pages/cart.html"; return; }
  if (typeof window.renderaddres === "function") window.renderaddres();
  // Danh sach thanh toan chi doc: chi hien cac san pham da chon.
  if (typeof window.renderallcart === "function") window.renderallcart(cart, { readOnly: true });

  const money = (value) => Number(value || 0).toLocaleString("vi-VN") + "đ";
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.giaBan) || 0) * (Number(item.soLuong) || 0), 0);
  const freeFrom = window.ShopCore?.FREE_SHIP_FROM || 10000000;
  const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  const voucherMessage = document.getElementById("VoucherMessage");
  const discountRow = document.getElementById("CheckoutDiscountRow");
  let appliedVoucher = window.ShopVoucher?.getApplied?.(currentUser) || null;

  function showVoucherMessage(message, isError) {
    if (!voucherMessage) return;
    voucherMessage.textContent = message || "";
    voucherMessage.classList.toggle("is-error", !!isError);
  }

  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function fmtExpiry(voucher) {
    if (!voucher.hanDung) return "Không thời hạn";
    const d = new Date(voucher.hanDung);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
    const label = `HSD: ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    return days <= 3 ? `${label} · sắp hết hạn` : label;
  }
  function valueBadge(voucher) {
    if (voucher.type === "percent") return `-${voucher.value}%`;
    const v = Number(voucher.value) || 0;
    return v >= 1000 ? `-${Math.round(v / 1000)}K` : `-${v}đ`;
  }

  function renderVouchers() {
    const list = document.getElementById("VoucherList");
    if (!list || !window.ShopVoucher) return;
    const entries = window.ShopVoucher.listForCheckout(currentUser, subtotal);
    if (!entries.length) {
      list.innerHTML = '<div class="voucher-empty">Hiện chưa có mã giảm giá nào phù hợp với tài khoản của bạn.</div>';
      updateClearButton();
      return;
    }
    list.innerHTML = entries.map(({ voucher, check, discount }) => {
      const selected = appliedVoucher?.code === voucher.code;
      const disabled = !check.ok;
      const cond = voucher.minOrder > 0 ? `Đơn tối thiểu ${money(voucher.minOrder)}` : "Không yêu cầu đơn tối thiểu";
      const tags = [
        voucher.chiKhachMoi ? '<em class="voucher-tag">Khách mới</em>' : "",
        voucher.type === "percent" && voucher.maxDiscount ? `<em class="voucher-tag">Tối đa ${money(voucher.maxDiscount)}</em>` : ""
      ].join("");
      const note = disabled
        ? `<div class="voucher-note is-warn">${esc(check.reason === "min-order" ? `Mua thêm ${money(check.shortBy)} để dùng mã này` : check.message)}</div>`
        : `<div class="voucher-note">Tiết kiệm ${money(discount)} cho đơn này</div>`;
      return `
      <label class="voucher-card ${selected ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}">
        <div class="voucher-stub"><strong>${esc(valueBadge(voucher))}</strong><small>${voucher.type === "percent" ? "Giảm giá" : "Giảm tiền"}</small></div>
        <div class="voucher-main">
          <div class="voucher-title">${esc(voucher.title)} ${tags}</div>
          <div class="voucher-cond">${esc(cond)}</div>
          <div class="voucher-exp">${esc(fmtExpiry(voucher))} · Mã <b>${esc(voucher.code)}</b></div>
          ${note}
        </div>
        <input type="radio" name="shop-voucher" value="${esc(voucher.code)}" ${selected ? "checked" : ""} ${disabled ? "disabled" : ""}>
      </label>`;
    }).join("");
    list.querySelectorAll("input").forEach((input) => input.addEventListener("change", () => {
      applyVoucher(input.value);
    }));
    updateClearButton();
  }

  function updateClearButton() {
    const button = document.getElementById("ClearVoucher");
    if (button) button.hidden = !appliedVoucher;
  }

  function applyVoucher(code) {
    if (!window.ShopVoucher) return;
    if (!String(code || "").trim()) { showVoucherMessage("Vui lòng nhập mã voucher.", true); return; }
    const result = window.ShopVoucher.apply(code, subtotal, currentUser);
    if (!result.ok) {
      appliedVoucher = null;
      window.ShopVoucher.clear();
      showVoucherMessage(result.message, true);
    } else {
      appliedVoucher = result.voucher;
      showVoucherMessage(`Đã áp dụng ${result.voucher.code}. Bạn được giảm ${money(result.discount)}.`, false);
      const codeInput = document.getElementById("VoucherCode");
      if (codeInput) codeInput.value = "";
    }
    renderVouchers();
    renderSummary();
  }

  // Hai nut dat hang hien co (COD va chuyen khoan) cung phi van chuyen; nhan tai cua hang (Shop) mien phi nhung chua co nut.
  function renderSummary() {
    const discount = window.ShopVoucher?.discount?.(appliedVoucher, subtotal) || 0;
    const fee = window.ShopCore?.shippingFee ? window.ShopCore.shippingFee(subtotal, "COD") : 0;
    setText("CheckoutSubtotal", money(subtotal));
    if (discountRow) discountRow.hidden = discount <= 0;
    setText("CheckoutDiscount", discount ? `-${money(discount)}` : "");
    setText("CheckoutShipFee", fee ? money(fee) : `Miễn phí (đơn từ ${money(freeFrom)})`);
    setText("CheckoutTotal", money(subtotal - discount + fee));
  }
  if (appliedVoucher && !(window.ShopVoucher?.discount?.(appliedVoucher, subtotal) > 0)) {
    appliedVoucher = null;
    window.ShopVoucher?.clear?.();
  }
  renderVouchers();
  if (appliedVoucher) showVoucherMessage(`Đã áp dụng ${appliedVoucher.code}.`, false);
  document.getElementById("ApplyVoucher")?.addEventListener("click", () => {
    applyVoucher(document.getElementById("VoucherCode")?.value);
  });
  document.getElementById("ClearVoucher")?.addEventListener("click", () => {
    appliedVoucher = null;
    window.ShopVoucher?.clear?.();
    showVoucherMessage("Đã bỏ mã giảm giá.", false);
    renderVouchers();
    renderSummary();
  });
  renderSummary();

  document.querySelectorAll(".more_address").forEach(b => b.addEventListener("click", () => window.location.href = "pages/address.html"));
  document.querySelectorAll(".CK_BTN").forEach(b => b.addEventListener("click", () => {
    if (!window.ktsoluong || !window.ktsoluong()) return;
    if (window.thanhtoan("PayBank")) window.location.href = "pages/payment-bank.html";
  }));
  document.querySelectorAll(".TM_BTN").forEach(b => b.addEventListener("click", () => {
    if (!window.ktsoluong || !window.ktsoluong()) return;
    if (window.thanhtoan("COD")) window.location.href = "pages/payment-cash.html";
  }));
  document.querySelectorAll(".CH_BTN").forEach(b => b.addEventListener("click", () => {
    if (!window.ktsoluong || !window.ktsoluong()) return;
    if (window.thanhtoan("Shop")) window.location.href = "pages/payment-store.html";
  }));
});
