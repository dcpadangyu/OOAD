document.addEventListener("DOMContentLoaded", () => {
  const currentUser = window.UserSession?.getCurrentUser?.() || null;
  if (!currentUser) {
    window.location.href = "pages/login.html";
    return;
  }
  const order = typeof window.getLatestUserOrder === "function" ? window.getLatestUserOrder() : null;
  if (!order) {
    window.renderNoOrder?.("ThanhToan_ThanhCong");
    return;
  }

  const esc = window.ShopCore?.esc || ((value) => String(value ?? ""));
  if (typeof window.SumCartEnd === "function") window.SumCartEnd(0);
  // Hoa don chi doc (khong co o chon / x / + / -).
  if (typeof window.renderInvoiceOrder === "function") {
    window.renderInvoiceOrder(order);
  }
  const address = document.querySelector("#ThanhToan_ThanhCong .diachi");
  if (address) {
    address.innerHTML = `<div class="address_all">
      <div class="nguoi_nhan"><div>Tên người nhận:</div><div>${esc(order.tenNguoiNhan)}</div></div>
      <div class="sdt_nhan"><div>Số điện thoại:</div><div>${esc(order.soDienThoaiNhan)}</div></div>
      <div class="gmail_nhan"><div>Email:</div><div>${esc(order.thuDienTuNguoiNhan)}</div></div>
      <div class="diachi_nhan"><div>Địa chỉ:</div><div>${esc(order.diaChiGiaoHang)}</div></div>
    </div>`;
  }
});
