// ==================== CHUYỂN DỮ LIỆU CŨ SANG TÊN THUỘC TÍNH TIẾNG VIỆT ====================
// Bảng đối chiếu tên cũ -> mới: docs/DOI_TEN_THUOC_TINH.md (đồng bộ với database/CuaHangGiay.sql).
// Chạy một lần khi trang đầu tiên được mở (cờ localStorage "schemaVersion" = "vi-1").
// Hàm idempotent: bản ghi đã có tên mới thì giữ nguyên. Phải được nạp TRƯỚC mọi script đọc dữ liệu.
(function () {
  "use strict";

  const VERSION = "vi-1";
  try {
    if (localStorage.getItem("schemaVersion") === VERSION) return;
  } catch (_) {
    return;
  }

  function doc(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value === null ? null : value;
    } catch (_) {
      return null;
    }
  }
  function ghi(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (error) { console.error("Không thể ghi " + key, error); return false; }
  }
  // Bỏ các thuộc tính undefined để JSON gọn.
  function gon(obj) {
    Object.keys(obj).forEach((k) => { if (obj[k] === undefined) delete obj[k]; });
    return obj;
  }
  const laDoiTuong = (v) => v && typeof v === "object" && !Array.isArray(v);

  // ---- Sản phẩm ----
  function sanPham(p) {
    if (!laDoiTuong(p) || p.maSanPham !== undefined) return p;
    return gon({
      maSanPham: p.id, maLoai: p.catalog, tenSanPham: p.name, gioiTinh: p.gender, moTaNgan: p.desc,
      mauSac: p.color, chatLieu: p.material, phongCach: p.style, kichCo: p.size, tonKhoTheoSize: p.sizeStock,
      giaBan: p.priceValue, giaHienThi: p.price, hinhAnh: p.image, giaNhap: p.importPrice,
      soLuongTon: p.quantity, tongDaNhap: p.importQuantity, tongDaBan: p.soldQuantity,
      trangThaiHienThi: p.visibility, moTa: p.description, xuatXu: p.origin,
    });
  }

  // ---- Giỏ hàng ----
  function dongGio(i) {
    if (!laDoiTuong(i) || i.maSanPham !== undefined) return i;
    return gon({
      maSanPham: i.id, tenSanPham: i.name, maLoai: i.catalog, hinhAnh: i.image, giaHienThi: i.price,
      giaBan: i.priceValue, kichCoDaChon: i.selectedSize || i.size || undefined, soLuong: i.quantity,
    });
  }

  // ---- Dòng chi tiết đơn (đơn User: product[], đơn Admin: items[]) ----
  function dongDon(l) {
    if (!laDoiTuong(l) || l.maSanPham !== undefined) return l;
    const giaTuChuoi = typeof l.price === "string" ? Number(l.price.replace(/[^\d]/g, "")) || undefined : undefined;
    return gon({
      maSanPham: l.id !== undefined ? l.id : l.productId,
      tenSanPham: l.name, maLoai: l.catalog, hinhAnh: l.image, giaHienThi: l.price,
      donGia: l.priceValue !== undefined ? l.priceValue : (typeof l.price === "number" ? l.price : giaTuChuoi),
      kichCoDaChon: l.selectedSize || l.size || undefined,
      soLuong: l.quantity !== undefined ? l.quantity : l.qty,
      daTra: l.returned,
    });
  }
  function giaChuoiCuaDong(l, moi) {
    // Đơn User: price là chuỗi hiển thị; đơn Admin: price là số (đã chuyển vào donGia).
    if (typeof l.price === "string" && moi.giaHienThi === undefined) moi.giaHienThi = l.price;
    return moi;
  }
  function dongDonCuoi(l) {
    if (!laDoiTuong(l) || l.maSanPham !== undefined) return l;
    const moi = dongDon(l);
    if (typeof l.price === "number") delete moi.giaHienThi;
    return giaChuoiCuaDong(l, moi);
  }

  function khachHangNhung(u) {
    if (!laDoiTuong(u)) return u;
    if (u.maKhachHang !== undefined) return u;
    return gon({ maKhachHang: u.id, hoTen: u.displayName || u.userName || u.name || u.username, thuDienTu: u.email, soDienThoai: u.phone });
  }

  // ---- Đơn hàng phía User ----
  function donUser(o) {
    if (!laDoiTuong(o) || o.maDonHang !== undefined) return o;
    const info = laDoiTuong(o.info) ? o.info : {};
    return gon({
      maDonHang: o.id, maKhachHang: o.userId,
      tenNguoiNhan: info.name, soDienThoaiNhan: info.phone, thuDienTuNguoiNhan: info.email, diaChiGiaoHang: info.address,
      khachHang: khachHangNhung(o.user),
      chiTiet: (o.product || []).map(dongDonCuoi),
      phuongThucThanhToan: o.payment, trangThaiThanhToan: o.paymentStatus,
      tamTinh: o.subtotal, tienVanChuyen: o.shippingFee,
      giaHienThi: o.price, tongTien: o.totalPrice, phiVanChuyen: o.priceShip,
      ngayDat: o.orderDate, trangThai: o.trangthai, trangThaiQuanTri: o.status, daTruKho: o.stockDeducted,
    });
  }

  // ---- Đơn hàng phía Admin ----
  function donAdmin(o) {
    if (!laDoiTuong(o) || o.maDonHang !== undefined) return o;
    const diaChi = o.address;
    const chuoiDiaChi = laDoiTuong(diaChi)
      ? [diaChi.street, diaChi.ward, diaChi.district, diaChi.city].filter(Boolean).join(", ")
      : (diaChi || "");
    return gon({
      maDonHang: o.id, ngayDat: o.date, tenNguoiNhan: o.customerName, soDienThoaiNhan: o.phone,
      diaChiGiaoHang: chuoiDiaChi, thuDienTuNguoiNhan: laDoiTuong(diaChi) ? diaChi.email : undefined,
      chiTiet: (o.items || []).map(dongDonCuoi),
      tongTien: o.total, trangThaiQuanTri: o.status, phuongThucThanhToan: o.paymentMethod,
      trangThaiThanhToan: o.paymentStatus, daTruKho: o.stockDeducted, tienVanChuyen: o.shippingFee,
      maKhachHang: o.userId, hoTen: o.userName, ghiChu: o.note,
    });
  }

  // ---- Địa chỉ ----
  function diaChi(a) {
    if (!laDoiTuong(a) || a.tenNguoiNhan !== undefined || a.diaChi !== undefined) return a;
    return gon({ maDiaChi: a.id, tenNguoiNhan: a.name, soDienThoai: a.phone, thuDienTu: a.email, diaChi: a.address, macDinh: a.default });
  }

  // ---- Khách hàng ----
  function khachHang(u) {
    if (!laDoiTuong(u) || u.maKhachHang !== undefined) return u;
    const hoTen = u.displayName || u.userName || u.name || u.username || u.loginUsername;
    return gon({
      maKhachHang: u.id, tenDangNhap: u.username || u.loginUsername || u.userName || u.name, hoTen,
      thuDienTu: u.email, matKhau: u.password, soDienThoai: u.phone, diaChi: u.address, anhDaiDien: u.avatar,
      diaChiPhu: Array.isArray(u.addresses) ? u.addresses.map(diaChi) : undefined,
      ngayTao: u.createdAt || u.registeredAt, trangThai: u.status, biKhoa: u.locked, ngayKhoa: u.lockDate,
      maKH: u.customerCode, daDatLaiMatKhau: u.passwordReset, ngayDatLaiMatKhau: u.resetDate,
    });
  }

  // ---- Nhân viên ----
  function nhanVien(n) {
    if (!laDoiTuong(n) || n.tenDangNhap !== undefined) return n;
    const moi = { ...n, soDienThoai: n.sdt, tenDangNhap: n.username, matKhau: n.password };
    delete moi.sdt; delete moi.username; delete moi.password;
    return gon(moi);
  }

  // ---- Loại sản phẩm ----
  function loaiSanPham(c) {
    if (!laDoiTuong(c) || c.tenLoai !== undefined) return c;
    return gon({
      maLoai: c.name, tenLoai: c.name, moTa: c.description, soSanPham: c.productCount,
      trangThai: c.status, ngayTao: c.createdAt, hinhAnh: c.image,
    });
  }

  let coLoi = false;
  function chuyenDanhSach(key, fn) {
    const list = doc(key);
    if (!Array.isArray(list)) return;
    if (!ghi(key, list.map(fn))) coLoi = true;
  }
  function chuyenDoiTuong(key, fn) {
    const obj = doc(key);
    if (!laDoiTuong(obj)) return;
    if (!ghi(key, fn(obj))) coLoi = true;
  }

  try { chuyenDanhSach("productsLocal", sanPham); } catch (e) { console.error(e); }
  try { chuyenDanhSach("cart", dongGio); } catch (e) { console.error(e); }
  try { chuyenDanhSach("DanhSachDatHang", donUser); } catch (e) { console.error(e); }
  try { chuyenDanhSach("CurrDanhSachDatHang", donUser); } catch (e) { console.error(e); }
  try { chuyenDanhSach("ordersLocal", donAdmin); } catch (e) { console.error(e); }
  try { chuyenDanhSach("userList", khachHang); } catch (e) { console.error(e); }
  try { chuyenDoiTuong("currentUser", khachHang); } catch (e) { console.error(e); }
  try { chuyenDoiTuong("selectedAddress", diaChi); } catch (e) { console.error(e); }
  try { chuyenDanhSach("employeeList", nhanVien); } catch (e) { console.error(e); }
  try { chuyenDanhSach("categories", loaiSanPham); } catch (e) { console.error(e); }

  // Chỉ đánh dấu đã chuyển khi mọi khóa đều thành công (nếu lỗi/đầy bộ nhớ thì lần mở trang sau thử lại).
  if (!coLoi) { try { localStorage.setItem("schemaVersion", VERSION); } catch (_) { /* bỏ qua */ } }
})();
