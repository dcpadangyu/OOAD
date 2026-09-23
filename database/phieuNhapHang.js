// Du lieu mau phieu nhap giay dung chung cho khu vuc admin.
const dsPhieuNhapHang = Array.from({ length: 10 }, (_, receiptIndex) => {
  const start = receiptIndex * 5;
  const chiTiet = products.slice(start, start + 5).map((product, itemIndex) => {
    const soLuongNhap = 10 + ((receiptIndex + itemIndex) % 4) * 5;
    const giaNhap = product.importPrice || Math.round(product.priceValue * 0.7);
    return {
      maSanPham: product.id,
      tenSanPham: product.name,
      soLuongNhap,
      giaNhap,
      thanhTien: soLuongNhap * giaNhap,
    };
  });

  return {
    maPhieuNhap: `PN${String(receiptIndex + 1).padStart(3, "0")}`,
    ngayNhap: new Date(2026, 0, 5 + receiptIndex * 3, 9, 30).toISOString(),
    chiTiet,
    tongTien: chiTiet.reduce((total, item) => total + item.thanhTien, 0),
    trangThai: receiptIndex < 7 ? "hoanThanh" : "chuaHoanThanh",
  };
});
