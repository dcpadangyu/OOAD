document.addEventListener("DOMContentLoaded", () => {
  const cart = window.getCheckoutCart ? window.getCheckoutCart() : [];
  if (typeof window.renderaddres === "function") window.renderaddres();
  if (typeof window.renderallcart === "function") window.renderallcart(cart);
  const currentUser = window.UserSession?.getCurrentUser?.() || null;
  if (!currentUser) { window.location.href = "pages/login.html"; return; }
  if (!cart.length) { alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán."); window.location.href = "pages/cart.html"; return; }

  document.querySelectorAll(".more_address").forEach(b => b.addEventListener("click", () => window.location.href = "pages/address.html"));
  document.querySelectorAll(".CK_BTN").forEach(b => b.addEventListener("click", () => {
    if (!window.ktsoluong || !window.ktsoluong()) return;
    window.thanhtoan("PayBank");
    window.location.href = "pages/payment-bank.html";
  }));
  document.querySelectorAll(".TM_BTN").forEach(b => b.addEventListener("click", () => {
    if (!window.ktsoluong || !window.ktsoluong()) return;
    window.trusoluong();
    window.thanhtoan("COD");
    window.location.href = "pages/payment-cash.html";
  }));
  document.querySelectorAll(".CH_BTN").forEach(b => b.addEventListener("click", () => {
    if (!window.ktsoluong || !window.ktsoluong()) return;
    window.trusoluong();
    window.thanhtoan("Shop");
    window.location.href = "pages/payment-store.html";
  }));
});
