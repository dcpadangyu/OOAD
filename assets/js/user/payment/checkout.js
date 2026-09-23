document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.renderaddres === "function") window.renderaddres();
  if (typeof window.renderallcart === "function") window.renderallcart();
  const currentUser = window.UserSession?.getCurrentUser?.() || null;
  if (!currentUser) { window.location.href = "pages/login.html"; return; }
  const cart = window.getcart ? window.getcart() : [];
  if (!cart.length) { alert("Giỏ hàng đang trống."); window.location.href = "pages/cart.html"; return; }

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
