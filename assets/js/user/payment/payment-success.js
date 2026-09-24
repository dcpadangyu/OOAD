document.addEventListener("DOMContentLoaded", () => {
  const orders = typeof window.getDanhSachDatHang === "function"
    ? window.getDanhSachDatHang()
    : JSON.parse(localStorage.getItem("DanhSachDatHang") || "[]");
  const order = Array.isArray(orders) && orders.length
    ? orders[orders.length - 1]
    : null;

  if (typeof window.SumCartEnd === "function") window.SumCartEnd(0);
  if (order && typeof window.renderInvoiceOrder === "function") {
    window.renderInvoiceOrder(order);
  }
  const address = document.querySelector("#ThanhToan_ThanhCong .diachi");
  if (address && order?.info) {
    address.innerHTML = `<div class="address_all">
      <div class="nguoi_nhan"><div>Tên người nhận:</div><div>${order.info.name || ""}</div></div>
      <div class="sdt_nhan"><div>Số điện thoại:</div><div>${order.info.phone || ""}</div></div>
      <div class="gmail_nhan"><div>Email:</div><div>${order.info.email || ""}</div></div>
      <div class="diachi_nhan"><div>Địa chỉ:</div><div>${order.info.address || ""}</div></div>
    </div>`;
  }
  window.removeCheckoutCart?.();
});
