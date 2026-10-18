document.addEventListener("DOMContentLoaded", () => {
  const currentUser = window.UserSession?.getCurrentUser?.() || null;
  if (!currentUser) {
    window.location.href = "pages/login.html";
    return;
  }
  const order = typeof window.getLatestUserOrder === "function" ? window.getLatestUserOrder() : null;
  if (!order) {
    const container = document.getElementById("ThanhToan_TienMat") ? "ThanhToan_TienMat" : "ThanhToan_CuaHang";
    window.renderNoOrder?.(container);
    return;
  }

  if (typeof window.renderallcart === "function") {
    window.renderallcart(Array.isArray(order.chiTiet) ? order.chiTiet : [], { readOnly: true });
  }
  if (typeof window.SumCartEnd === "function") window.SumCartEnd(0);
  // Dia chi nguoi nhan lay tu chinh don hang.
  if (typeof window.renderOrderAddress === "function") window.renderOrderAddress(order);
  document.querySelectorAll(".chuyenqua_giaodich_thanhcong").forEach(btn => btn.addEventListener("click", () => {
    window.location.href = "pages/payment-success.html";
  }));
});
