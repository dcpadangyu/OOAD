document.addEventListener("DOMContentLoaded", () => {
  const currentUser = window.UserSession?.getCurrentUser?.() || null;
  if (!currentUser) {
    window.cancelBankOrder?.();
    alert("Vui lòng đăng nhập để thanh toán.");
    window.location.href = "pages/login.html";
    return;
  }
  // Chi nhan don chuyen khoan cua dung nguoi dang dang nhap va con han (don khac/het han bi xoa).
  const checked = typeof window.getPendingBankOrder === "function"
    ? window.getPendingBankOrder()
    : { order: null, message: "Không tìm thấy đơn hàng đang chờ thanh toán." };
  const pending = checked.order;
  if (!pending) {
    alert(checked.message || "Không tìm thấy đơn hàng đang chờ thanh toán.");
    window.location.href = "pages/cart.html";
    return;
  }
  if (typeof window.renderallcart === "function") window.renderallcart(Array.isArray(pending.chiTiet) ? pending.chiTiet : [], { readOnly: true });
  // So tien can chuyen = tong don (da gom phi van chuyen).
  document.querySelectorAll(".SumCart").forEach((el) => { el.textContent = pending.giaHienThi || ""; });
  if (typeof window.SumCartEnd === "function") window.SumCartEnd(1);
  if (typeof window.renderOrderAddress === "function") window.renderOrderAddress(pending);
  document.querySelectorAll(".chuyenqua_giaodich_thanhcong").forEach(btn => btn.addEventListener("click", () => {
    const result = window.confirmBankOrder ? window.confirmBankOrder() : { ok: false, message: "Không thể xác nhận đơn hàng." };
    if (!result.ok) {
      alert(result.message || "Không thể xác nhận đơn hàng.");
      window.cancelBankOrder?.();
      window.location.href = "pages/payment-failed.html";
      return;
    }
    window.location.href = "pages/payment-success.html";
  }));
  document.querySelectorAll(".chuyenqua_giaodich_thatbai").forEach(btn => btn.addEventListener("click", () => {
    window.cancelBankOrder?.();
    window.location.href = "pages/payment-failed.html";
  }));
});
