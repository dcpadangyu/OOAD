document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.SumCartEnd === "function") window.SumCartEnd(0);
  if (typeof window.renderaddres === "function") window.renderaddres();
  if (typeof window.renderallcart === "function") window.renderallcart();
  document.querySelectorAll(".list_danhsach").forEach(el => {});
  localStorage.removeItem("cart");
});
