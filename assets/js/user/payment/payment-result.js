document.addEventListener("DOMContentLoaded", () => {
  const orders = typeof window.getDanhSachDatHang === "function"
    ? window.getDanhSachDatHang()
    : JSON.parse(localStorage.getItem("DanhSachDatHang") || "[]");
  const order = Array.isArray(orders) && orders.length
    ? orders[orders.length - 1]
    : null;

  if (typeof window.renderallcart === "function") {
    window.renderallcart(Array.isArray(order?.product) ? order.product : []);
  }
  if (typeof window.SumCartEnd === "function") window.SumCartEnd(0);
  if (typeof window.renderaddres === "function") window.renderaddres();
  document.querySelectorAll(".chuyenqua_giaodich_thanhcong").forEach(btn => btn.addEventListener("click", () => {
    window.removeCheckoutCart?.();
    window.location.href = "pages/payment-success.html";
  }));
});
