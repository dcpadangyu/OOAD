# Thiết Kế Các Bảng Dữ Liệu (Database Design)

> Hệ thống dùng **localStorage** (và IndexedDB cho đánh giá), không có DB thật. Các bảng dưới đây mô hình hóa các entity trong code. **Tên thuộc tính trong code trùng với tên cột trong `database/CuaHangGiay.sql`** (toàn bộ tiếng Việt). Bảng đối chiếu tên cũ → mới: `docs/DOI_TEN_THUOC_TINH.md`. Khóa chính (PK) trong code là chuỗi giả ID (`SH-...`, `NV...`, `PN...`, `DH...`).

## 1. Bảng `SAN_PHAM` — key `productsLocal` (seed: `database/products-shoes.js`)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| `maSanPham` | STRING | **PK** (ví dụ `SH-001`) |
| `maLoai` | STRING | **FK → LOAI_SAN_PHAM.maLoai** (giá trị là tên loại/hãng, vd `Nike`) |
| `tenSanPham` | STRING | NOT NULL |
| `gioiTinh` | STRING | CHECK (Nam / Nữ / Unisex) |
| `moTaNgan` | STRING | NULL |
| `mauSac` | STRING | NOT NULL |
| `chatLieu` | STRING | NOT NULL |
| `phongCach` | STRING | NOT NULL |
| `kichCo` | STRING | NOT NULL (chuỗi mô tả, vd `36 - 44`) |
| `tonKhoTheoSize` | JSON | `{ "36": 2, "37": 5, ... }` — tồn kho từng size (không có trong SQL) |
| `giaBan` | NUMBER | > 0 (giá bán) |
| `giaHienThi` | STRING | NOT NULL (giá hiển thị đã format `₫`) |
| `hinhAnh` | STRING | NOT NULL |
| `giaNhap` | NUMBER | > 0 (giá nhập) |
| `soLuongTon` | NUMBER | ≥ 0 (= tổng `tonKhoTheoSize`) |
| `tongDaNhap` | NUMBER | ≥ 0 (tổng đã nhập) |
| `tongDaBan` | NUMBER | ≥ 0 (tổng đã bán) |
| `trangThaiHienThi` | STRING | CHECK (visible / hidden) |
| `moTa` | STRING | NULL |
| `xuatXu` | STRING | NULL |

## 2. Bảng `LOAI_SAN_PHAM` — key `categories`

| Thuộc tính | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| `maLoai` | STRING | **PK** (= tên loại, khóa tự nhiên) |
| `tenLoai` | STRING | NOT NULL, UNIQUE |
| `moTa` | STRING | NULL |
| `soSanPham` | NUMBER | Số lượng thuộc loại (hiển thị) |
| `trangThai` | STRING | CHECK (active / hidden) |
| `ngayTao` | STRING | NOT NULL |
| `hinhAnh` | STRING | NULL |

## 3. Bảng `NHAN_VIEN` — key `employeeList` (seed: `database/employees.js`)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| `maNhanVien` | STRING | **PK** (tự sinh `NV` + 3 số) |
| `tenNhanVien` | STRING | NOT NULL |
| `gioiTinh` | STRING | CHECK (Nam / Nữ) |
| `soDienThoai` | STRING | **UNIQUE**, dạng `0xxxxxxxxx` |
| `diaChi` | STRING | NULL |
| `chucVu` | STRING | CHECK (Nhân viên bán hàng / Nhân viên kho / Nhân viên CSKH / Nhân viên kiểm kho) |
| `tenDangNhap` | STRING | **UNIQUE** |
| `matKhau` | STRING | NOT NULL |
| `ngayTao` | STRING | NOT NULL (ISO) |
| `trangThai` | STRING | CHECK (hoatdong / khoa) |

## 4. Bảng `KHACH_HANG` — key `userList` (người đang đăng nhập: `currentUser`)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| `maKhachHang` | STRING | **PK** (sinh khi đăng ký, dạng `user_...`) |
| `maKH` | STRING | Mã hiển thị do Admin gán (`KH001`, `KH002`...) |
| `tenDangNhap` | STRING | **UNIQUE** (không đổi) |
| `hoTen` | STRING | NOT NULL (tên hiển thị, sửa được) |
| `thuDienTu` | STRING | **UNIQUE** |
| `matKhau` | STRING | NOT NULL |
| `soDienThoai` | STRING | **UNIQUE**, dạng `0xxxxxxxxx` |
| `diaChi` | STRING | NULL |
| `anhDaiDien` | STRING | NULL |
| `ngayTao` | STRING | NOT NULL (ISO) |
| `trangThai` | STRING | `active` / `blocked`... |
| `biKhoa`, `ngayKhoa` | BOOLEAN / STRING | Do Admin quản lý |
| `daDatLaiMatKhau` | BOOLEAN | Admin đã reset mật khẩu |
| `diaChiPhu[]` | ARRAY | Bảng `DIA_CHI_PHU`: `{ maDiaChi, tenNguoiNhan, soDienThoai, thuDienTu, diaChi, macDinh }` |

## 5. Bảng `DON_HANG` — key `DanhSachDatHang` (user) + `ordersLocal` (admin)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| `maDonHang` | STRING | **PK** (ví dụ `DH1726500000000`) |
| `maKhachHang` | STRING | **FK → KHACH_HANG.maKhachHang** |
| `tenNguoiNhan` | STRING | NOT NULL |
| `soDienThoaiNhan` | STRING | NOT NULL |
| `thuDienTuNguoiNhan` | STRING | NULL |
| `diaChiGiaoHang` | STRING | NOT NULL |
| `khachHang` | JSON | Snapshot `{ maKhachHang, hoTen, thuDienTu, soDienThoai }` lúc đặt (đơn User) |
| `chiTiet[]` | ARRAY | **FK → CHI_TIET_DON_HANG** |
| `phuongThucThanhToan` | STRING | CHECK (COD / PayBank / Shop) |
| `trangThaiThanhToan` | STRING | `unpaid` / `paid` |
| `tamTinh` | NUMBER | Tổng tiền hàng |
| `tienVanChuyen` | NUMBER | Phí ship (số) |
| `giaHienThi` | STRING | Tổng tiền hiển thị có đơn vị |
| `tongTien` | NUMBER | ≥ 0 |
| `phiVanChuyen` | STRING | Phí ship hiển thị |
| `ngayDat` | STRING | NOT NULL (ISO) |
| `trangThai` | STRING | CHECK (cho-xac-nhan / dang-giao / thanh-cong / da-huy) |
| `trangThaiQuanTri` | STRING | CHECK (moiDat / daXuLy / daGiao / huy) — luôn khớp `trangThai` |
| `daTruKho` | BOOLEAN | Đã trừ kho (tránh trừ/hoàn hai lần) |

**Ánh xạ trạng thái:** `cho-xac-nhan` ↔ `moiDat` · `dang-giao` ↔ `daXuLy` · `thanh-cong` ↔ `daGiao` · `da-huy` ↔ `huy`

Đơn phía Admin (`ordersLocal`) chỉ lưu `trangThaiQuanTri` (không có `trangThai`), `hoTen` thay cho `khachHang`, thêm `ghiChu`.

## 6. Bảng `CHI_TIET_DON_HANG` (lồng trong `order.chiTiet`)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| `maSanPham` | STRING | **FK → SAN_PHAM.maSanPham** |
| `tenSanPham` | STRING | NOT NULL |
| `maLoai`, `hinhAnh`, `giaHienThi` | STRING | Snapshot (đơn User) |
| `kichCoDaChon` | STRING | Size khách chọn |
| `soLuong` | NUMBER | > 0 |
| `donGia` | NUMBER | > 0 |
| `daTra` | NUMBER | Số lượng đã trả (đơn Admin) |

## 7. Bảng `GIO_HANG` — key `cart`

| Thuộc tính | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| `maSanPham` | STRING | **FK → SAN_PHAM.maSanPham** |
| `kichCoDaChon` | STRING | Size đã chọn (cùng sản phẩm khác size là dòng khác nhau) |
| `soLuong` | NUMBER | > 0 |
| `tenSanPham`, `maLoai`, `hinhAnh`, `giaHienThi`, `giaBan` | — | Snapshot, luôn được đối chiếu lại với `productsLocal` khi đọc giỏ |

## 8. Bảng `PHIEU_NHAP_HANG` — key `phieuNhapLocal`

| Thuộc tính | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| `maPhieuNhap` | STRING | **PK** (tự sinh `PN...`) |
| `ngayNhap` | STRING | NOT NULL (ISO) |
| `tongTien` | NUMBER | ≥ 0 |
| `nhaCungCap` | STRING | Nhà cung cấp (bắt buộc khi lập/sửa phiếu) |
| `nguoiLap`, `nguoiDuyet` | STRING | Người lập phiếu / người hoàn thành phiếu |
| `ngayHoanThanh`, `ngayHuy`, `nguoiHuy` | STRING | Mốc hoàn thành / hủy phiếu |
| `trangThai` | STRING | CHECK (hoanThanh / chuaHoanThanh / daHuy) |
| `chiTiet[]` | ARRAY | **FK → CHI_TIET_PHIEU_NHAP** |

## 9. Bảng `CHI_TIET_PHIEU_NHAP` (lồng trong `phieu.chiTiet`)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| `maSanPham` | STRING | **FK → SAN_PHAM.maSanPham** |
| `kichCo` | STRING | Size nhập ('' nếu sản phẩm không chia size); khóa chính gồm maSanPham + kichCo |
| `tenSanPham` | STRING | NOT NULL |
| `soLuongNhap` | NUMBER | > 0 |
| `giaNhap` | NUMBER | > 0 |
| `thanhTien` | NUMBER | = số lượng × đơn giá |

## 10. Bảng `DANH_GIA` — IndexedDB `ooad_feedback` (store `feedback`)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| `maDanhGia` | STRING | **PK** (`fb_<maDonHang>_<maSanPham>_<size>`) |
| `maDonHang` | STRING | **FK → DON_HANG.maDonHang** |
| `maSanPham` | STRING | **FK → SAN_PHAM.maSanPham** |
| `tenSanPham`, `maLoai`, `kichCoDaChon` | STRING | Snapshot |
| `maKhachHang` | STRING | **FK → KHACH_HANG.maKhachHang** |
| `hoTen` | STRING | Tên khách lúc đánh giá |
| `soSao` | NUMBER | CHECK (1..5) |
| `binhLuan` | STRING | NULL |
| `tepDinhKem[]` | ARRAY | `{ loai: image/video, ten, tep: Blob }` |
| `ngayTao` | STRING | NOT NULL (ISO) |
| `trangThai` | STRING | CHECK (moi / dangXuLy / daXuLy) |
| `nguoiXuLy` | JSON | `{ tenDangNhap, hoTen }` hoặc null (nhân viên CSKH đang xử lý) |
| `ngayTiepNhan` | STRING | NULL |
| `phanHoi` | JSON | `{ noiDung, nguoiGui, tenDangNhap, thoiGian }` hoặc null |
| `daAn` | BOOLEAN | Ẩn khỏi trang sản phẩm |

## 11. Sơ đồ quan hệ (ER)

```
SAN_PHAM (1) ──── (N) CHI_TIET_DON_HANG (N) ──── (1) DON_HANG (N) ──── (1) KHACH_HANG
     │                                                     
     ├── (N) LOAI_SAN_PHAM (1)  ── SAN_PHAM.maLoai
     │
     ├── (1) CHI_TIET_PHIEU_NHAP (N) ──── (1) PHIEU_NHAP_HANG
     │
     └── (1) DANH_GIA (N) ──── (1) KHACH_HANG
```

## 12. Ghi chú thiết kế

- **Không dùng khóa tự tăng thật** — chỉ fake ID dạng chuỗi (`SH`, `NV`, `KH`, `PN`, `DH`) do giới hạn localStorage.
- **`chiTiet` bị lồng trong mảng** đơn hàng / phiếu nhập. Nếu muốn chuẩn 3NF nên tách thành bảng con `CHI_TIET_DON_HANG`, `CHI_TIET_PHIEU_NHAP` (đã có trong `CuaHangGiay.sql`).
- **Tồn kho theo size** (`tonKhoTheoSize`) là mở rộng so với bảng SQL: khi chuyển sang CSDL thật nên tách thành bảng `TON_KHO_SIZE(maSanPham, kichCo, soLuong)`.
- **Trạng thái phiếu nhập** mặc định nên để `chuaHoanThanh`; khi chuyển sang `hoanThanh` mới cộng tồn kho.
- Mỗi entity tương ứng với **một localStorage key** (riêng đánh giá nằm trong IndexedDB). Dữ liệu cũ tên tiếng Anh được `database/migrate-schema.js` tự chuyển sang tên mới.
