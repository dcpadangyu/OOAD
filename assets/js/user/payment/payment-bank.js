document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.SumCartEnd === "function") window.SumCartEnd(1);
  if (typeof window.renderaddres === "function") window.renderaddres();
  document.querySelectorAll(".chuyenqua_giaodich_thanhcong").forEach(btn => btn.addEventListener("click", () => {
    window.trusoluong && window.trusoluong();
    localStorage.setItem("DanhSachDatHang", localStorage.getItem("CurrDanhSachDatHang") || localStorage.getItem("DanhSachDatHang") || "[]");
    localStorage.removeItem("CurrDanhSachDatHang");
    localStorage.removeItem("cart");
    window.location.href = "pages/payment-success.html";
  }));
  document.querySelectorAll(".chuyenqua_giaodich_thatbai").forEach(btn => btn.addEventListener("click", () => {
    localStorage.removeItem("CurrDanhSachDatHang");
    window.location.href = "pages/payment-failed.html";
  }));
});
