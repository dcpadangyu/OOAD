document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.renderallcart === "function") window.renderallcart();
  if (typeof window.SumCartEnd === "function") window.SumCartEnd(0);
  if (typeof window.renderaddres === "function") window.renderaddres();
  document.querySelectorAll(".chuyenqua_giaodich_thanhcong").forEach(btn => btn.addEventListener("click", () => {
    localStorage.removeItem("cart");
    window.location.href = "pages/payment-success.html";
  }));
});
