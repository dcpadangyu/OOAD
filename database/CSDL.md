# Thiết Kế Các Bảng Dữ Liệu (Database Design)

> Hệ thống dùng **localStorage**, không có DB thật. Các bảng dưới đây là mô hình hóa từ các entity có trong code (key + thuộc tính + ràng buộc) để phục vụ thiết kế CSDL cho đồ án. Key khóa chính (PK) trong code là chuỗi giả ID (`SH-...`, `NV...`, `PN...`).

## 1. Bảng `SAN_PHAM` — key `productsLocal` (seed: `database/products-shoes.js`)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| `id` | STRING | **PK** (ví dụ `SH-001`) |
| `catalog` | STRING | **FK → LOAI_SAN_PHAM.maLoai** |
| `name` | STRING | NOT NULL |
| `gender` | STRING | CHECK (Nam / Nữ) |
| `desc` | STRING | NULL |
| `color` | STRING | NOT NULL |
| `material` | STRING | NOT NULL |
| `style` | STRING | NOT NULL |
| `size` | STRING | NOT NULL |
| `priceValue` | NUMBER | > 0 (giá bán) |
| `price` | STRING | NOT NULL (giá hiển thị đã format `₫`) |
| `image` | STRING | NOT NULL |
| `importPrice` | NUMBER | > 0 (giá nhập) |
| `quantity` | NUMBER | ≥ 0 (tồn kho) |
| `importQuantity` | NUMBER | ≥ 0 (tổng đã nhập) |
| `soldQuantity` | NUMBER | ≥ 0 (tổng đã bán) |
| `visibility` | STRING | CHECK (visible / hidden) |
| `description` | STRING | NULL |
| `origin` | STRING | NULL |

## 2. Bảng `LOAI_SAN_PHAM` — key `categories` / `loaiLocal`

| Thuộc tính | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| `maLoai` | STRING | **PK** |
| `tenLoai` | STRING | NOT NULL, UNIQUE |
| `hinhAnh` | STRING | NULL |

## 3. Bảng `NHAN_VIEN` — key `employeeList` (seed: `database/employees.js`)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| `maNhanVien` | STRING | **PK** (tự sinh `NV` + 3 số) |
| `tenNhanVien` | STRING | NOT NULL |
| `gioiTinh` | STRING | CHECK (Nam / Nữ) |
| `sdt` | STRING | **UNIQUE**, dạng `0xxxxxxxxx` |
| `diaChi` | STRING | NULL |
| `chucVu` | STRING | CHECK (Nhân viên bán hàng / Nhân viên kho / Nhân viên CSKH / Nhân viên kiểm kho) |
| `username` | STRING | **UNIQUE** |
| `password` | STRING | NOT NULL |
| `ngayTao` | STRING | NOT NULL (ISO) |
| `trangThai` | STRING | CHECK (hoatdong / khoa) |

## 4. Bảng `KHACH_HANG` — key `userList` / `DanhSachNguoiDung`

| Thuộc tính | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| `id` / `customerCode` | STRING | **PK** (tự sinh `KH001`, `KH002`...) |
| `userName` | STRING | **UNIQUE** |
| `email` | STRING | **UNIQUE** |
| `password` | STRING | NOT NULL |
| `name` | STRING | NOT NULL |
| `sdt` | STRING | **UNIQUE**, dạng `0xxxxxxxxx` |
| `diaChi` | STRING | NULL |
| `ngayTao` | STRING | NOT NULL (ISO) |
| `trangThai` | STRING | CHECK (hoatdong / khoa) |
| `addresses[]` | ARRAY | Danh sách địa chỉ phụ: `{ name, phone, email, address }` |

## 5. Bảng `DON_HANG` — key `DanhSachDatHang` (user) + `ordersLocal` (admin)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| `id` / `maDonHang` | STRING | **PK** (ví dụ `DH1726500000000`) |
| `userId` / `maKhachHang` | STRING | **FK → KHACH_HANG.id** |
| `info` | JSON | `{ name, phone, email, address }` — địa chỉ giao hàng |
| `user` | JSON | Snapshot thông tin user lúc đặt |
| `product[]` | ARRAY | **FK → CHI_TIET_DON_HANG** |
| `payment` | STRING | CHECK (COD / PayBank / PayStore) |
| `price` | STRING | Giá hiển thị có đơn vị |
| `totalPrice` | NUMBER | ≥ 0 |
| `priceShip` | STRING | Phí ship hiển thị |
| `orderDate` | STRING | NOT NULL (ISO) |
| `trangthai` | STRING | CHECK (cho-xac-nhan / dang-giao / thanh-cong / da-huy) |

**Ánh xạ trạng thái:** `cho-xac-nhan` ↔ `moiDat` · `dang-giao` ↔ `daXuLy` · `thanh-cong` ↔ `daGiao` · `da-huy` ↔ `huy`

## 6. Bảng `CHI_TIET_DON_HANG` (lồng trong `order.product` / `order.items`)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| `id` / `maSanPham` | STRING | **FK → SAN_PHAM.id** |
| `tenSanPham` | STRING | NOT NULL |
| `soLuong` | NUMBER | > 0 |
| `donGia` | NUMBER | > 0 |
| `thanhTien` | NUMBER | = số lượng × đơn giá |

## 7. Bảng `GIO_HANG` — key `cart`

| Thuộc tính | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| `idSanPham` | STRING | **FK → SAN_PHAM.id** |
| `quantity` | NUMBER | > 0 |
| *(khác)* | — | Copy toàn bộ thuộc tính sản phẩm (snapshot) |

## 8. Bảng `PHIEU_NHAP_HANG` — key `phieuNhapLocal` / `phieuNhapHangLocal`

| Thuộc tính | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| `maPhieuNhap` | STRING | **PK** (tự sinh `PN...`) |
| `ngayNhap` | STRING | NOT NULL (ISO) |
| `tongTien` | NUMBER | ≥ 0 |
| `trangThai` | STRING | CHECK (hoanThanh / chuaHoanThanh) |
| `chiTiet[]` | ARRAY | **FK → CHI_TIET_PHIEU_NHAP** |

## 9. Bảng `CHI_TIET_PHIEU_NHAP` (lồng trong `phieu.chiTiet`)

| Thuộc tính | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| `maSanPham` | STRING | **FK → SAN_PHAM.id** |
| `tenSanPham` | STRING | NOT NULL |
| `soLuongNhap` | NUMBER | > 0 |
| `giaNhap` | NUMBER | > 0 |
| `thanhTien` | NUMBER | = số lượng × đơn giá |

## 10. Sơ đồ quan hệ (ER)

```
SAN_PHAM (1) ──── (N) CHI_TIET_DON_HANG (N) ──── (1) DON_HANG (N) ──── (1) KHACH_HANG
     │                                                     
     ├── (N) LOAI_SAN_PHAM (1)  ── SAN_PHAM.catalog
     │
     └── (1) CHI_TIET_PHIEU_NHAP (N) ──── (1) PHIEU_NHAP_HANG
```

## 11. Ghi chú thiết kế

- **Không dùng khóa tự tăng thật** — chỉ fake ID dạng chuỗi (`SH`, `NV`, `KH`, `PN`, `DH`) do giới hạn localStorage.
- **`chiTiet` / `product` bị lồng trong mảng** đơn hàng / phiếu nhập. Nếu muốn chuẩn 3NF nên tách thành bảng con `CHI_TIET_DON_HANG`, `CHI_TIET_PHIEU_NHAP` khi chuyển sang CSDL thật.
- **Trạng thái phiếu nhập** mặc định nên để `chuaHoanThanh` (chưa hoàn thành); khi chuyển sang `hoanThanh` mới cộng tồn kho.
- Mỗi entity tương ứng với **một localStorage key** — bảng trên là bản ánh xạ để chuyển sang SQL/NoSQL sau này mà không đổi cấu trúc logic.