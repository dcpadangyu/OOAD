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
  const shippingFee = window.ShopCore?.shippingFee?.(subtotal, "COD") ?? 30000;
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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
    try {
    const suggestions = window.ShopVoucher.goiYVoucher(subtotal, shippingFee);
    const bestAvailable = suggestions.find((item) => !item.reason && item.soTienGiam > 0);
    const bestConditional = suggestions.find((item) => item.reason && item.soTienGiam > 0);
    list.innerHTML = suggestions.map((item) => {
      const { voucher, reason, soLuong: quantity, soTienGiam, canMuaThem } = item;
      const suggestion = item === bestAvailable ? "Giảm nhiều nhất cho đơn này" : item === bestConditional ? "Gợi ý khi đủ điều kiện" : "";
      const savings = reason ? `Khi đủ điều kiện: giảm ${money(soTienGiam)}` : `Giảm ${money(soTienGiam)} cho đơn này`;
      const expiry = voucher.thoiGianKetThuc ? new Date(voucher.thoiGianKetThuc).toLocaleString("vi-VN") : "Không giới hạn";
      return `
      <label class="voucher-card ${reason ? "is-disabled" : ""} ${appliedVoucher?.maVoucher === voucher.maVoucher ? "is-selected" : ""}">
        <input type="radio" name="shop-voucher" value="${esc(voucher.maVoucher)}" ${reason ? "disabled" : ""} ${appliedVoucher?.maVoucher === voucher.maVoucher ? "checked" : ""}>
        <span>${suggestion ? `<em class="voucher-suggestion">${esc(suggestion)}</em>` : ""}<strong>${esc(voucher.title)}</strong><small>${esc(voucher.description)}</small><b>${esc(voucher.maVoucher)} · Còn ${quantity} voucher</b><small>${esc(savings)}</small><small>Hết hạn: ${esc(expiry)}</small>${reason ? `<small>${esc(reason)}${canMuaThem > 0 ? ` Mua thêm ${money(canMuaThem)} để đủ mức tối thiểu.` : ""}</small>` : ""}</span>
      </label>
    `; }).join("") || "<p>Bạn chưa có voucher.</p>";
    } catch (_) { list.textContent = "Không thể tải danh sách voucher. Vui lòng thử lại."; }
    // Chỉ hiển thị trọn 3 thẻ; các thẻ sau xem bằng cách cuộn.
    const cards = Array.from(list.querySelectorAll(".voucher-card"));
    list.style.maxHeight = cards.length > 3 ? `${cards.slice(0, 3).reduce((sum, card) => sum + card.getBoundingClientRect().height, 0) + 16}px` : "";
    list.querySelectorAll("input").forEach((input) => input.addEventListener("change", () => {
      applyVoucher(input.value);
    }));
  }

  function applyVoucher(code) {
    if (!window.ShopVoucher) return;
    const result = window.ShopVoucher.apply(code, subtotal, shippingFee);
    if (!result.ok) {
      appliedVoucher = null;
      window.ShopVoucher.clear();
      showVoucherMessage(result.message, true);
    } else {
      appliedVoucher = result.voucher;
      showVoucherMessage(`Đã áp dụng ${result.voucher.maVoucher}. Bạn được giảm ${money(result.discount)}.`, false);
    }
    renderVouchers();
    renderSummary();
  }

  // Hai nut dat hang hien co (COD va chuyen khoan) cung phi van chuyen; nhan tai cua hang (Shop) mien phi nhung chua co nut.
  function renderSummary() {
    const discount = window.ShopVoucher?.discount?.(appliedVoucher, subtotal, shippingFee) || 0;
    const fee = window.ShopCore?.shippingFee ? window.ShopCore.shippingFee(subtotal, "COD") : 0;
    setText("CheckoutSubtotal", money(subtotal));
    if (discountRow) discountRow.hidden = discount <= 0;
    setText("CheckoutDiscount", discount ? `-${money(discount)}` : "");
    setText("CheckoutShipFee", fee ? money(fee) : `Miễn phí (đơn từ ${money(freeFrom)})`);
    setText("CheckoutTotal", money(subtotal - discount + fee));
  }
  if (appliedVoucher && !(window.ShopVoucher?.discount?.(appliedVoucher, subtotal, shippingFee) > 0)) {
    appliedVoucher = null;
    window.ShopVoucher?.clear?.();
  }
  renderVouchers();
  if (appliedVoucher) showVoucherMessage(`Đã áp dụng ${appliedVoucher.maVoucher}.`, false);
  document.getElementById("ApplyVoucher")?.addEventListener("click", () => {
    applyVoucher(document.getElementById("VoucherCode")?.value);
  });
  renderSummary();

  function refreshVouchers() {
    appliedVoucher = window.ShopVoucher?.getApplied?.() || null;
    try {
      const reason = appliedVoucher && window.ShopVoucher.lyDoKhongHopLe(appliedVoucher, { tamTinh: subtotal, tienVanChuyen: shippingFee });
      if (reason) { window.ShopVoucher.clear(); appliedVoucher = null; showVoucherMessage(reason, true); }
      renderVouchers(); renderSummary();
    } catch (_) { showVoucherMessage("Không thể cập nhật voucher. Vui lòng tải lại trang.", true); }
  }
  window.addEventListener("storage", refreshVouchers);
  window.addEventListener("focus", refreshVouchers);
  window.addEventListener("resize", renderVouchers);
  // Cập nhật khi voucher hết hạn ngay trong lúc đang mở checkout.
  const voucherTimer = window.setInterval(refreshVouchers, 30000);
  window.addEventListener("pagehide", () => window.clearInterval(voucherTimer), { once: true });

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
