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
  let appliedVoucher = window.ShopVoucher?.getApplied?.() || null;

  function showVoucherMessage(message, isError) {
    if (!voucherMessage) return;
    voucherMessage.textContent = message || "";
    voucherMessage.classList.toggle("is-error", !!isError);
  }

  function renderVouchers() {
    const list = document.getElementById("VoucherList");
    if (!list || !window.ShopVoucher) return;
    list.innerHTML = window.ShopVoucher.list().map((voucher) => `
      <label class="voucher-card ${appliedVoucher?.code === voucher.code ? "is-selected" : ""}">
        <input type="radio" name="shop-voucher" value="${voucher.code}" ${appliedVoucher?.code === voucher.code ? "checked" : ""}>
        <span><strong>${voucher.title}</strong><small>${voucher.description}</small><b>${voucher.code}</b></span>
      </label>
    `).join("");
    list.querySelectorAll("input").forEach((input) => input.addEventListener("change", () => {
      applyVoucher(input.value);
    }));
  }

  function applyVoucher(code) {
    if (!window.ShopVoucher) return;
    const result = window.ShopVoucher.apply(code, subtotal);
    if (!result.ok) {
      appliedVoucher = null;
      window.ShopVoucher.clear();
      showVoucherMessage(result.message, true);
    } else {
      appliedVoucher = result.voucher;
      showVoucherMessage(`Đã áp dụng ${result.voucher.code}. Bạn được giảm ${money(result.discount)}.`, false);
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
