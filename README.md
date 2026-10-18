# DoAnOOAD — Hệ Thống Bán Giày Online (Shoe Store)

Hệ thống quản lý bán giày trực tuyến xây dựng hoàn toàn bằng **HTML / CSS / JavaScript thuần** (không framework, không backend bắt buộc). Dữ liệu lưu trên **localStorage** (sản phẩm, đơn hàng, tài khoản...) và **IndexedDB** (đánh giá kèm ảnh/video) của trình duyệt. Hai ứng dụng **User** và **Admin** dùng chung một nguồn dữ liệu và chung một bộ quy tắc xử lý tồn kho / đơn hàng (`ShopCore`) nên dữ liệu luôn khớp nhau.

> **Lưu ý khi chạy:** User và Admin chia sẻ dữ liệu qua cùng một *origin* trình duyệt. Hãy mở cả hai bằng **cùng một địa chỉ và cổng** (ví dụ `http://localhost:5500/`), thư mục gốc phục vụ là thư mục chứa `index.html`.

---

## Mục Lục

1. [Cấu Trúc Dự Án](#1-cấu-trúc-dự-án)
2. [Công Nghệ & Thư Viện](#2-công-nghệ--thư-viện)
3. [Cơ Sở Dữ Liệu](#3-cơ-sở-dữ-liệu)
4. [Cơ Chế Đồng Bộ (Events)](#4-cơ-chế-đồng-bộ-events)
5. [Quy Trình Dòng Dữ Liệu](#5-quy-trình-dòng-dữ-liệu)
6. [Phía Người Dùng (User)](#6-phía-người-dùng-user)
7. [Phía Quản Trị (Admin)](#7-phía-quản-trị-admin)
8. [Hệ Thống Session & Xác Thực](#8-hệ-thống-session--xác-thực)
9. [Tài Khoản Demo](#9-tài-khoản-demo)
10. [Hướng Dẫn Sử Dụng](#10-hướng-dẫn-sử-dụng)
11. [Use Case Diagram](#11-use-case-diagram)
12. [Chạy Ứng Dụng](#12-chạy-ứng-dụng)
    - [12.1 Chạy giao diện User (static server)](#121-chạy-giao-diện-user-static-server)
    - [12.2 Chạy backend OTP (Node.js)](#122-chạy-backend-otp-nodejs)
    - [12.3 Chức năng OTP](#123-chức-năng-otp)
    - [12.4 Tái tạo shell User](#124-tái-tạo-shell-user)

---

## 1. Cấu Trúc Dự Án

```
OOAD/
├── index.html                          # Entry → redirect về pages/home.html
├── pages/                              # 16 trang user (home, cart, checkout, payment-*, order-history, profile...)
├── components/                         # header.html + footer.html (nguồn của shared shell)
├── assets/
│   ├── css/user/                       # CSS đang dùng của user (variables, base, common, redesign, feedback.css...)
│   ├── js/user/
│   │   ├── core/                       # site-shell.js (sinh tự động), site-header.js, account-session.js, storage.js, otp-api.js
│   │   ├── product/                    # products.js (giao diện cửa hàng), reviews.js (đánh giá trên trang chủ)
│   │   ├── cart/                       # cart.js, cart-page.js
│   │   ├── payment/                    # payment.js, checkout.js, payment-bank.js, payment-result.js, payment-success.js
│   │   └── account/                    # login, register, profile, address, order-history.js, feedback.js (form đánh giá)...
│   ├── images/
│   │   ├── brands/                     # Logo 5 thương hiệu
│   │   └── products/{Adidas,Converse,Mlb,Nike,Vans}/   # Ảnh giày (101 mẫu đang dùng)
│   ├── img/                            # Avatar, icon thanh toán, QR, background đăng nhập, no-image.png
│   └── filemp4/banner.mp4              # Video banner trang chủ
├── Admin/
│   ├── DangNhap_Admin.html             # Đăng nhập admin
│   ├── DangNhap_NhanVien.html          # Đăng nhập nhân viên
│   ├── TrangChu_Admin.html             # SPA admin (tất cả chức năng trong 1 trang)
│   └── assets/
│       ├── css/                        # QuanLySanPham.css, TonKho.css, QuanLyDanhGia.css, admin-luxury-theme.css...
│       └── js/                         # admin.js, QuanLySanPham.js, size-editor.js, QuanLyNhapHang.js, TonKho.js,
│                                       # QuanLyGiaBan.js, quanlydonhang.js, quanlydanhgia.js, doanhthu.js, ...
├── database/
│   ├── products-shoes.js               # DÙNG CHUNG: seed 101 sản phẩm, getLocalProducts()/saveLocalProducts(), ShopCore (tồn kho + đơn hàng)
│   ├── feedback-store.js               # DÙNG CHUNG: kho đánh giá IndexedDB + hàm thống kê
│   ├── migrate-schema.js               # Tự chuyển dữ liệu cũ (tên tiếng Anh) sang tên thuộc tính tiếng Việt (chạy 1 lần, nạp đầu tiên)
│   ├── CuaHangGiay.sql                 # Script SQL Server: bảng, ràng buộc, dữ liệu mẫu (tên thuộc tính tiếng Việt)
│   ├── phieuNhapHang.js                # Seed 10 phiếu nhập hàng mẫu
│   ├── employees.js                    # Seed nhân viên + chức vụ
│   └── CSDL.md                         # Tài liệu thiết kế CSDL
├── server/                             # Backend OTP Node.js (không bắt buộc)
│   ├── server.js                       # Server gửi + xác thực OTP qua Resend
│   ├── .env.example                    # Mẫu cấu hình (PORT, RESEND_API_KEY, EMAIL_FROM...)
│   └── package.json                    # npm start
├── docs/                               # Báo cáo thiết kế / kiểm thử; DOI_TEN_THUOC_TINH.md = bảng đối chiếu tên thuộc tính
└── tools/
    └── build-user-shell.js             # Node script sinh site-shell.js từ components/
```

> Các file JS/CSS phẳng cũ trong `assets/js/*.js`, `assets/css/*.css` và `assets/js/user/core/display.js|router.js`, `product/detail.js` **không còn được trang nào nạp** (di sản của bản cũ). Chỉ chỉnh sửa các file nằm trong `user/`, `Admin/` và `database/`.

---

## 2. Công Nghệ & Thư Viện

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | HTML5, CSS3, JavaScript (ES6+) |
| Framework | Không — vanilla JS thuần |
| Backend | Node.js 18+ (chỉ phục vụ gửi + xác thực OTP qua email) |
| Gửi email OTP | Resend API |
| Lưu dữ liệu | localStorage / sessionStorage / **IndexedDB** (đánh giá + ảnh/video) |
| Biểu đồ | Tự dựng bằng HTML/CSS (không dùng thư viện biểu đồ) |
| Thông báo | SweetAlert2 (CDN) — dialog xác nhận |
| QR thanh toán | SVG ngân hàng MBBank inline |
| Responsive | Media queries, flexbox, grid |

---

## 3. Cơ Sở Dữ Liệu

### 3.1 Bảng các key (localStorage)

| Key | Loại | Mô tả |
|---|---|---|
| `productsLocal` | `Array<Product>` | Toàn bộ sản phẩm (101 mẫu seed + sản phẩm admin tạo) |
| `productsSeedVersion` | `string` | Phiên bản dữ liệu mẫu đã nạp; khi tăng, các mẫu mới được bổ sung **một lần** (không "hồi sinh" mẫu đã xóa) |
| `cart` | `Array<CartItem>` | Giỏ hàng (chỉ lưu `maSanPham`, tên, ảnh, giá, `kichCoDaChon`, `soLuong` — luôn được đối chiếu lại với `productsLocal`) |
| `selectedCartItems` | `Array<string>` | Các dòng giỏ được tick để thanh toán (`"<id>::<size>"`) |
| `DanhSachDatHang` | `Array<Order>` | Đơn hàng khách đã đặt (nguồn dữ liệu chính của đơn) |
| `CurrDanhSachDatHang` | `Array<Order>` | Đơn **chuyển khoản đang chờ thanh toán** (chưa vào danh sách chính, chưa trừ kho; gắn với người đặt, có `hetHanLuc` = hết hạn sau 30 phút) |
| `ordersLocal` | `Array<AdminOrder>` | Bản đơn hàng cho Admin (đồng bộ từ `DanhSachDatHang`) |
| `phieuNhapLocal` | `Array<Receipt>` | Phiếu nhập hàng |
| `categories` | `Array<Category>` | Danh mục sản phẩm (`tenLoai`, `trangThai: active/hidden`) — User đọc key này để dựng menu/footer/dải thương hiệu |
| `currentUser` | `Object` | User đang đăng nhập |
| `userList` | `Array<User>` | User đã đăng ký (`maKH` dạng `KH001`...) |
| `selectedAddress` | `Object` | Địa chỉ giao hàng đang chọn |
| `shoeSearchHistory` | `Array<string>` | Lịch sử tìm kiếm (tối đa 6) |
| `nguongSapHet` | `number` | Ngưỡng sắp hết hàng (mặc định 10) |
| `employeeList` | `Array<Employee>` | Danh sách nhân viên |
| `feedbackVersion` | `string` | Dấu thời gian báo cho các tab biết đánh giá vừa thay đổi |
| `rememberedUsername` / `rememberLogin` | `string` / `boolean` | Ghi nhớ đăng nhập admin |

**IndexedDB `ooad_feedback`** (object store `feedback`, khóa `id`): toàn bộ đánh giá của khách, gồm ảnh/video dạng `Blob`.

### 3.2 Schema các model

> Mọi thuộc tính dùng **tên tiếng Việt, đồng bộ với `database/CuaHangGiay.sql`** (bảng đối chiếu tên cũ → mới: [`docs/DOI_TEN_THUOC_TINH.md`](docs/DOI_TEN_THUOC_TINH.md)). Dữ liệu cũ trong trình duyệt được tự chuyển sang tên mới một lần bởi `database/migrate-schema.js` (cờ `schemaVersion = "vi-1"`). Giá trị (`"visible"`, `"hidden"`, `"COD"`, `"cho-xac-nhan"`, `"moiDat"`...) không đổi.

#### Product — `productsLocal` (bảng SAN_PHAM)
```js
{
  maSanPham: "SH-001",                   // Mã SP, duy nhất (SH-001…SH-101 là mẫu có sẵn)
  maLoai: "Nike",                        // Loại/hãng: Nike | Adidas | Converse | MLB | Vans (hoặc loại admin tạo)
  tenSanPham: "Adidas Samba Og Black White",
  gioiTinh: "Nam" | "Nữ" | "Unisex",
  moTaNgan: "...",                       // Mô tả ngắn
  mauSac: "Đen",
  chatLieu: "Da",
  phongCach: "Thể thao" | "Casual" | "Thời trang",
  kichCo: "36 - 50",                     // Chuỗi mô tả; tự tính từ các size đã nhập
  tonKhoTheoSize: { "36": 2, "37": 2, ... },  // TỒN KHO THEO TỪNG SIZE (nguồn sự thật của tồn kho)
  soLuongTon: 20,                        // = tổng tonKhoTheoSize (luôn được tính lại)
  giaBan: 1290000,                       // Giá bán (number)
  giaHienThi: "1.290.000₫",              // Giá hiển thị
  hinhAnh: "assets/images/products/..." | "data:image/...",
  giaNhap: 903000,                       // Giá vốn
  tongDaNhap: 20,                        // Tổng đã nhập
  tongDaBan: 0,                          // Tổng đã bán (tăng khi đơn "Đã giao")
  trangThaiHienThi: "visible" | "hidden",
  moTa: "...",
  xuatXu: "Việt Nam"
}
```

#### Category — `categories` (bảng LOAI_SAN_PHAM)
```js
{ maLoai: "Nike", tenLoai: "Nike", moTa: "...", soSanPham: 20, trangThai: "active" | "hidden", ngayTao: "2024-01-15" }
// maLoai = tên loại (khóa tự nhiên) và trùng với maLoai của sản phẩm thuộc loại đó
```

#### Cart Item — `cart` (bảng GIO_HANG)
```js
{ maSanPham, tenSanPham, maLoai, hinhAnh, giaHienThi, giaBan, kichCoDaChon, soLuong }
```
Giá/tên/ảnh được lấy lại từ `productsLocal` mỗi lần đọc giỏ; sản phẩm bị ẩn hoặc đã xóa tự bị loại khỏi giỏ.

#### Customer — `userList` / `currentUser` (bảng KHACH_HANG + DIA_CHI_PHU)
```js
{
  maKhachHang: "user_...", tenDangNhap: "nguyenan", hoTen: "Nguyễn An",
  thuDienTu: "a@x.vn", matKhau: "...", soDienThoai: "0901234567", diaChi: "...",
  anhDaiDien: "assets/img/Avatar/avtuser.jpg",
  diaChiPhu: [ { maDiaChi, tenNguoiNhan, soDienThoai, thuDienTu, diaChi, macDinh } ],
  ngayTao: "2026-01-01", trangThai: "active" | "blocked", biKhoa: false, ngayKhoa: "...",
  maKH: "KH001",                         // Mã hiển thị do Admin gán
  daDatLaiMatKhau: false, ngayDatLaiMatKhau: "ISO"   // Admin reset mật khẩu
}
```
`selectedAddress` có cùng dạng với một phần tử của `diaChiPhu`.

#### Order (User) — `DanhSachDatHang` (bảng DON_HANG + CHI_TIET_DON_HANG)
```js
{
  maDonHang: "DH1726500000000",
  maKhachHang: "...",
  tenNguoiNhan, soDienThoaiNhan, thuDienTuNguoiNhan, diaChiGiaoHang,   // địa chỉ giao hàng (làm phẳng)
  khachHang: { maKhachHang, hoTen, thuDienTu, soDienThoai },           // Không lưu mật khẩu
  chiTiet: [ { maSanPham, tenSanPham, maLoai, hinhAnh, giaHienThi, donGia, kichCoDaChon, soLuong } ],
  phuongThucThanhToan: "COD" | "PayBank" | "Shop",
  trangThaiThanhToan: "unpaid" | "paid" | "refund", // PayBank xác nhận = "paid"; giao thành công = "paid"; hủy đơn đã trả tiền = "refund"
  tamTinh: 1290000, tienVanChuyen: 30000,
  giaHienThi: "1.320.000đ", tongTien: 1320000, phiVanChuyen: "30.000đ",
  ngayDat: "2026-09-15T...",
  trangThai: "cho-xac-nhan" | "dang-giao" | "thanh-cong" | "da-huy",
  trangThaiQuanTri: "moiDat" | "daXuLy" | "daGiao" | "huy",   // Luôn khớp với trangThai
  daTruKho: true                                    // Đã trừ kho chưa (tránh trừ/hoàn kho hai lần)
}
```

#### AdminOrder — `ordersLocal`
```js
{
  maDonHang, ngayDat, tenNguoiNhan, soDienThoaiNhan, diaChiGiaoHang, thuDienTuNguoiNhan,
  chiTiet: [ { maSanPham, tenSanPham, kichCoDaChon, soLuong, donGia, daTra } ],
  tongTien, trangThaiQuanTri, phuongThucThanhToan, trangThaiThanhToan, daTruKho,
  tienVanChuyen, maKhachHang, hoTen, ghiChu
}
```

#### Feedback — IndexedDB `ooad_feedback` (store `feedback`, khóa `maDanhGia`)
```js
{
  maDanhGia: "fb_<maDonHang>_<maSanPham>_<size>",   // Mỗi sản phẩm trong một đơn chỉ đánh giá một lần
  maDonHang, maSanPham, tenSanPham, maLoai, kichCoDaChon,
  maKhachHang, hoTen,
  hinhAnh,                                           // ảnh sản phẩm lúc đánh giá (dự phòng khi sản phẩm bị xóa/đổi)
  soSao: 1..5, binhLuan: "...",
  tepDinhKem: [ { loai: "image" | "video", ten, tep: Blob } ],
  ngayTao: "ISO",
  trangThai: "moi" | "dangXuLy" | "daXuLy",
  nguoiXuLy: { tenDangNhap, hoTen } | null, ngayTiepNhan: "ISO" | null,
  phanHoi: { noiDung, nguoiGui, tenDangNhap, thoiGian, capNhatLuc } | null,   // thoiGian = lần trả lời đầu
  daAn: false                                       // true = ẩn khỏi trang sản phẩm
}
```

#### Import Receipt (Phiếu nhập hàng)
```js
{
  maPhieuNhap: "PN1726500000000",
  ngayNhap: "2026-09-15",
  chiTiet: [
    { maSanPham: "SH-001", tenSanPham: "...", soLuongNhap: 10, giaNhap: 903000, thanhTien: 9030000 }
  ],
  tongTien: 45150000,
  trangThai: "hoanThanh" | "chuaHoanThanh"
}
```

#### Employee (Nhân viên)
```js
{
  maNhanVien: "NV001",                // Mã NV, tự động "NV" + 3 số
  tenNhanVien: "Nguyễn Văn An",
  gioiTinh: "Nam" | "Nữ",
  soDienThoai: "0901234567",
  diaChi: "...",
  chucVu: "Nhân viên bán hàng" | "Nhân viên kho" | "Nhân viên CSKH" | "Nhân viên kiểm kho",
  tenDangNhap: "nhanvien01",
  matKhau: "123456",
  ngayTao: "2026-09-18",
  trangThai: "hoatdong" | "khoa"
}
```

### 3.3 `ShopCore` — quy tắc tồn kho & đơn hàng dùng chung

Định nghĩa trong `database/products-shoes.js`, được nạp cả ở User (giỏ, thanh toán, lịch sử đơn) và Admin.

| Hàm | Vai trò |
|---|---|
| `adjustStock(sanPham, size, delta)` | Cộng/trừ tồn kho. Có `size` → đổi `tonKhoTheoSize[size]`; không có → chia đều (cộng) / lấy từ size nhiều nhất (trừ). Luôn đặt lại `soLuongTon = Σ tonKhoTheoSize` |
| `checkStock(lines)` | Kiểm tra đủ hàng; **gộp các dòng cùng sản phẩm/size** trước khi so sánh |
| `deductOrderStock(order)` | Kiểm tra đủ hàng rồi trừ kho; gắn `order.daTruKho = true`; trả lỗi nếu không lưu được (bộ nhớ đầy) |
| `shippingFee(tamTinh, phuongThuc)` | Phí ship: COD/chuyển khoản 30.000đ, **miễn phí từ 10.000.000đ**; nhận tại cửa hàng 0đ |
| `nextStatuses(trangThai)` | Các trạng thái đơn được phép chuyển tiếp (`moiDat → daXuLy/huy`, `daXuLy → daGiao/huy`, `daGiao`/`huy` là cuối) |
| `setOrderStatus(orderId, adminStatus, {force})` | **Chỉ cho chuyển trạng thái hợp lệ** (`force` chỉ dùng khi đồng bộ đơn cũ); Đổi trạng thái đơn ở **cả** `DanhSachDatHang` và `ordersLocal`; tự trừ/hoàn kho theo cờ `daTruKho`; cộng/trừ `tongDaBan` khi vào/ra "Đã giao"; phát `orderStatusChanged`. Dùng cho cả Admin đổi trạng thái lẫn khách hủy đơn |
| `esc(value)` | Escape HTML khi chèn dữ liệu vào `innerHTML` |

---

## 4. Cơ Chế Đồng Bộ (Events)

### 4.1 Sự kiện trong cùng tab

| Event | Khi nào | Ai lắng nghe |
|---|---|---|
| `productsUpdated` | Thêm/sửa/xóa SP, nhập hàng, đặt hàng, đổi trạng thái/hủy đơn | Trang chủ user, bảng sản phẩm, phiếu nhập, tồn kho admin |
| `categoriesUpdated` | Thêm/sửa/xóa/toggle danh mục | Quản lý sản phẩm, dropdown danh mục |
| `orderStatusChanged` | Admin đổi trạng thái hoặc khách hủy đơn | Lịch sử mua hàng user, danh sách đơn admin |
| `userOrdersUpdated` | User đặt hàng thành công | Đồng bộ đơn sang admin |
| `feedbackUpdated` | Có đánh giá mới / nhân viên xử lý phản hồi | Lịch sử đơn, thẻ & popup sản phẩm, trang Phản hồi đánh giá |
| `user-shell-ready` | Header/footer render xong | Cập nhật UI tài khoản |

### 4.2 Đồng bộ giữa các tab (sự kiện `storage`)

| Key thay đổi | Hệ quả |
|---|---|
| `productsLocal` | Trang chủ user, bảng sản phẩm, phiếu nhập, tồn kho admin tự refresh (giữ nguyên bộ lọc đang chọn) |
| `categories` | Dropdown danh mục admin refresh |
| `nguongSapHet` | Tồn kho cập nhật ngưỡng |
| `DanhSachDatHang` | Danh sách đơn admin và lịch sử đơn của khách refresh |
| `ordersLocal` | Danh sách đơn admin refresh |
| `feedbackVersion` | Mọi trang đang mở nạp lại đánh giá |
| `currentUser` | Header user cập nhật UI |

---

## 5. Quy Trình Dòng Dữ Liệu

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. ADMIN THÊM / SỬA SẢN PHẨM                                        │
│    Form nhập size bằng trình chọn size (size-editor.js):            │
│    tonKhoTheoSize = { "38": 5, ... }, soLuongTon = tổng             │
└────────────────────────────┬────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. ADMIN TẠO PHIẾU NHẬP HÀNG (gõ mã SP, nhập số lượng, hoàn thành) │
│    Khi phiếu chuyển sang "Hoàn thành" (chỉ lần đầu):                │
│       ShopCore.adjustStock(sp, "", +SL) → chia đều vào các size     │
│       tongDaNhap += SL                                          │
└────────────────────────────┬────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. ADMIN ĐẶT GIÁ BÁN  (QuanLyGiaBan.js)                              │
│    giaBan = giaNhap × (1 + %LN);  giaHienThi = định dạng tiền       │
└────────────────────────────┬────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. USER XEM SẢN PHẨM TRÊN TRANG CHỦ                                 │
│    Hiển thị khi: chưa ẩn && giaBan > 0 && soLuongTon > 0         │
│    Size hết hàng bị khóa trong popup; không chọn được để mua         │
└────────────────────────────┬────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. USER MUA HÀNG                                                    │
│    Giỏ luôn đối chiếu lại giá/ẩn/xóa với productsLocal              │
│    COD / Shop : kiểm tra kho → ShopCore.deductOrderStock → lưu đơn  │
│                 → xóa sản phẩm đã đặt khỏi giỏ                      │
│    PayBank    : lưu tạm CurrDanhSachDatHang → QR → bấm "Đã chuyển   │
│                 khoản" mới trừ kho + tạo đơn (trangThaiThanhToan "paid")│
└────────────────────────────┬────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. ADMIN QUẢN LÝ ĐƠN HÀNG                                           │
│    syncUserOrders(): DanhSachDatHang → ordersLocal (giữ size, trạng │
│    thái). Đổi trạng thái / hủy đều qua ShopCore.setOrderStatus →    │
│    hoàn kho đúng size, cập nhật tongDaBan, báo User realtime.       │
│    Khách hủy đơn ("Chờ xác nhận") cũng đi qua cùng hàm này.         │
└────────────────────────────┬────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 7. FEEDBACK                                                         │
│    Đơn "Đã giao" → khách đánh giá (sao + chữ + ảnh/video) →          │
│    CSKH tiếp nhận → phản hồi → khách xem phản hồi; thống kê.        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Phía Người Dùng (User)

### 6.1 Trang Chủ & Danh Sách Sản Phẩm

**Trang:** `pages/home.html` · **File JS:** `database/products-shoes.js` (dữ liệu), `assets/js/user/product/products.js` (giao diện), `reviews.js` (đánh giá)

#### Chức năng chính
- **Banner video** tự động phát (autoplay, loop).
- **Thanh thương hiệu**, **menu** và **footer** lấy từ danh mục Admin (`categories`): ẩn/thêm danh mục ở Admin thì User thấy ngay sau khi tải lại; nếu chưa có `categories` thì dùng 5 hãng mặc định.
- **Grid sản phẩm** 15 sản phẩm/trang (hiện có **101 mẫu**), mỗi thẻ hiện ảnh, tên, giá và **điểm đánh giá trung bình** (nếu có).
- **Popup chi tiết:** ảnh lớn, màu, chất liệu, phong cách, giới tính, **chọn size** (size hết hàng bị khóa), nút **Thêm vào giỏ hàng** / **Mua ngay**, kèm **danh sách đánh giá của khách** (xem 6.8).
- **Tự cập nhật:** khi Admin đổi giá/tồn kho/ẩn sản phẩm, trang chủ cập nhật ngay (cả khi mở ở tab khác), giữ nguyên bộ lọc đang chọn.

#### Phân trang
Thanh phân trang chỉ hiện **4 số trang mỗi nhóm**:

```
Nhóm 1–4:      1 2 3 4  >  Trang cuối
Nhóm 5 trở đi: Trang đầu  <  5 6 7  >  Trang cuối
```
- `>` / `<` chuyển từng trang; "Trang đầu" / "Trang cuối" nhảy thẳng tới trang đầu / cuối.
- Ở nhóm trang 1–4 không hiện "Trang đầu" và `<`; ở trang cuối, `>` và "Trang cuối" bị khóa.
- Chuyển trang thì tự cuộn về đầu danh sách; chỉ có 1 trang thì ẩn thanh phân trang.

#### Bộ lọc (sidebar)
| Bộ lọc | Loại | Chi tiết |
|---|---|---|
| Giá | Select | Dưới 1tr, 1-2tr, 2-3tr, 3-4tr, Trên 4tr |
| Màu sắc | Select | Đen, Trắng, Vàng, Bạc, Hồng, Xanh lá, Xanh dương, Đỏ, Xám, Be |
| Chất liệu | Select | Da, Da tổng hợp, Vải |
| Phong cách | Select | Thể thao, Casual, Thời trang |
| Giới tính | Select | Nam, Nữ, Unisex |
| Size giày | Select | Danh sách size lấy động từ dữ liệu |

#### Tìm kiếm
- Nhập tên hoặc brand vào ô tìm kiếm; **gợi ý realtime** (tối đa 6) và **lịch sử tìm kiếm** (6 gần nhất, có thể xóa).
- Hỗ trợ URL param `?search=...` và `?category=...`.

#### Điều kiện hiển thị sản phẩm
Sản phẩm hiện trên trang chủ khi:
1. `trangThaiHienThi !== "hidden"` — đang hiển thị.
2. `giaBan > 0` — đã được đặt giá bán ở Admin.
3. `soLuongTon > 0` — còn hàng. **Hết sạch số lượng (mọi size = 0) thì sản phẩm tự biến mất khỏi trang chủ**, có hàng lại (nhập kho, hủy đơn) thì tự hiện lại. Sản phẩm còn ít nhất một size thì vẫn hiện, các size hết hàng bị khóa trong popup.

---

### 6.2 Giỏ Hàng

**Trang:** `pages/cart.html` · **File JS:** `assets/js/user/cart/cart.js`, `cart-page.js`

- Hiển thị sản phẩm trong giỏ (ảnh, tên + size, giá, số lượng); **tick chọn** các dòng cần thanh toán.
- **Tăng/giảm số lượng** (không vượt tồn kho của size; giảm dưới 1 thì xóa dòng đó).
- **Nút "x"** chỉ xóa đúng dòng (đúng size), không xóa các size khác của cùng sản phẩm.
- **Tổng tiền** tính realtime từ các dòng được chọn.
- `getcart()` mỗi lần đọc đều **đối chiếu với `productsLocal`**: cập nhật giá/tên/ảnh mới nhất, loại sản phẩm bị ẩn hoặc đã xóa. Sản phẩm Admin tạo (ảnh `data:image`) mua được bình thường.
- Dữ liệu giỏ lưu ở `localStorage['cart']`.

---

### 6.3 Thanh Toán (Checkout)

**Trang:** `pages/checkout.html` · **File JS:** `assets/js/user/payment/payment.js`, `checkout.js`, `payment-bank.js`

- Hiển thị **địa chỉ giao hàng** (`selectedAddress`; chưa có → bắt chọn địa chỉ).
- **Kiểm tra tồn kho** từng size bằng `ktsoluong()` trước khi đặt.
- Người dùng bị Admin khóa không đặt hàng được (phiên bị đăng xuất khi kiểm tra lại).

#### Phương thức thanh toán
| Phương thức | Mã | Phí ship | Luồng xử lý |
|---|---|---|---|
| Chuyển khoản ngân hàng | `PayBank` | 30.000đ (miễn phí từ 10.000.000đ) | Lưu tạm (hết hạn sau 30 phút, gắn với người đặt) → QR → xác nhận mới tạo đơn |
| Thanh toán khi nhận hàng | `COD` | 30.000đ (miễn phí từ 10.000.000đ) | Trừ kho → tạo đơn → trang thành công |
| Nhận tại cửa hàng | `Shop` | 0đ | Trừ kho → tạo đơn → trang thành công (trang `payment-store.html` hiện đang được vô hiệu hóa — đã comment — nên chưa có nút này trên giao diện) |

**Flow COD / Shop:** `ktsoluong()` → `thanhtoan("COD")` (trừ kho bằng `ShopCore.deductOrderStock`, lưu `DanhSachDatHang`, xóa sản phẩm đã đặt khỏi giỏ) → `payment-cash.html` / `payment-store.html`.

**Flow PayBank:**
1. `thanhtoan("PayBank")` chỉ lưu đơn **tạm** vào `CurrDanhSachDatHang` (chưa trừ kho, chưa hiện bên Admin).
2. Hiển thị QR MBBank.
3. Bấm **"Đã hoàn tất chuyển khoản"** → `confirmBankOrder()` kiểm tra lại tồn kho, trừ kho, thêm đơn (`trangThaiThanhToan: "paid"`) vào `DanhSachDatHang` **mà không ghi đè các đơn khác**, xóa giỏ → `payment-success.html`. Nếu hết hàng giữa chừng → trang thất bại.
4. Bấm thất bại / hủy: xóa đơn tạm → `payment-failed.html`.

Trang thành công / hóa đơn luôn hiển thị **đơn mới nhất của chính người dùng đang đăng nhập**.

---

### 6.4 Quản Lý Tài Khoản

#### Đăng ký — `pages/register.html` (`register.js`)
- Username: chỉ chữ, tối thiểu 3 ký tự, không trùng. Email đúng định dạng, không trùng. SĐT `0xxxxxxxxx`, không trùng.
- Mật khẩu ≥ 8 ký tự (hiển thị rule realtime), xác nhận phải khớp; địa chỉ ≥ 10 ký tự.
- Lưu `ngayTao` để Admin thấy đúng ngày tạo tài khoản. Đăng ký/quên mật khẩu dùng OTP qua email (xem 12.2).

#### Đăng nhập — `pages/login.html` (`login.js`)
- Bằng **email hoặc username** + mật khẩu; chặn tài khoản bị khóa (`biKhoa === true` hoặc `trangThai === "blocked"`).

#### Hồ sơ — `profile.html`, `personal-info.html`, `change-password.html`
- Xem/sửa thông tin, đổi mật khẩu (MK cũ → MK mới ≥ 8 → đăng nhập lại).
- **Lưu hồ sơ không ghi đè trạng thái do Admin quản lý** (`trangThai`, `biKhoa`, `maKH`, `ngayTao`...).
- Quên mật khẩu: tài khoản bị khóa không dùng được; đổi mật khẩu xong **không tự đăng nhập**.

---

### 6.5 Quản Lý Địa Chỉ

**Trang:** `pages/address.html` · **File JS:** `address.js`

- Danh sách địa chỉ dạng card; **thêm / sửa / xóa**; **đặt mặc định** (tự gán vào `selectedAddress`).
- Khi thanh toán: render địa chỉ đã chọn; chưa chọn → chuyển tới trang địa chỉ.

---

### 6.6 Lịch Sử Mua Hàng

**Trang:** `pages/order-history.html` · **File JS:** `assets/js/user/account/order-history.js`

- Hiển thị đơn của user đang đăng nhập (khớp theo `maKhachHang`), 3 đơn/trang, mở rộng xem chi tiết (sản phẩm, địa chỉ, phương thức thanh toán).
- **Order tracker** theo trạng thái; **tự cập nhật** khi Admin đổi trạng thái (cùng tab hoặc tab khác).
- **Đơn chuyển khoản chưa xác nhận:** hiện khung nhắc "Tiếp tục thanh toán" (đơn chưa được ghi nhận cho tới khi bấm "Đã hoàn tất chuyển khoản").
- **Khớp đơn với khách:** theo `maKhachHang` (hoặc email đã lưu cùng đơn nếu mã khách cũ khác).
- **Hủy đơn** — chỉ khi `cho-xac-nhan`. Hủy đi qua `ShopCore.setOrderStatus(id, "huy")` nên **hoàn kho đúng size** và **Admin thấy ngay đơn bị hủy**.
- **Đánh giá sản phẩm:** đơn `thanh-cong` có nút đánh giá dưới từng sản phẩm; đơn đang chờ/đang giao hiện lời nhắc "đánh giá sau khi nhận hàng" (xem 6.8).

#### Ánh xạ trạng thái
| Trạng thái User | Trạng thái Admin |
|---|---|
| `cho-xac-nhan` | `moiDat` |
| `dang-giao` | `daXuLy` |
| `thanh-cong` | `daGiao` |
| `da-huy` | `huy` |

---

### 6.7 Header & Session UI

**File JS:** `site-header.js`, `site-shell.js` (sinh từ `components/`) · **Nguồn:** `components/header.html`, `footer.html`

- Header dùng chung (inject bởi `site-shell.js`); menu hãng và footer đồng bộ theo `categories`.
- Chưa đăng nhập: link "Đăng nhập"; đã đăng nhập: avatar + dropdown (Hồ sơ, Đơn hàng, Đăng xuất).
- Tìm kiếm trong header → `pages/home.html?search=...#sanpham`; đăng xuất có xác nhận.
- Tự cập nhật khi `currentUser` thay đổi ở tab khác.

---

### 6.8 Đánh Giá Sản Phẩm (Feedback)

**File JS:** `assets/js/user/account/feedback.js` (form + lịch sử), `assets/js/user/product/reviews.js` (trang chủ) · **Dữ liệu:** `database/feedback-store.js` · **CSS:** `assets/css/user/feedback.css`

**Cách khách đánh giá:**
1. Đặt hàng → Admin chuyển đơn sang **Đã giao**.
2. Khách vào **Đơn hàng** (`order-history.html`) → dưới từng sản phẩm của đơn "Thành công" bấm **☆ Đánh giá sản phẩm này**.
3. Chấm **1–5 sao** (bắt buộc, có nhãn Rất tệ → Tuyệt vời), viết **nhận xét** (tối đa 1000 ký tự, không bắt buộc), đính kèm **ảnh/video** (tối đa 6 tệp, video ≤ 25MB, ảnh tự nén) → **Gửi đánh giá**.

**Sau khi gửi:**
- Mỗi sản phẩm trong một đơn chỉ đánh giá một lần; đánh giá hiện ngay dưới sản phẩm kèm trạng thái *Mới / Đang xử lý / Đã phản hồi*.
- Khi nhân viên CSKH phản hồi, nội dung phản hồi hiện ngay dưới đánh giá.
- Trang chủ: thẻ sản phẩm có điểm trung bình; popup chi tiết có điểm trung bình, phân bố sao, bộ lọc (tất cả / có ảnh-video / theo sao), danh sách đánh giá (tên khách che một phần, ảnh phóng to, video phát được, phản hồi của cửa hàng). Đánh giá bị Admin/CSKH **ẩn** thì không hiện công khai.

---

## 7. Phía Quản Trị (Admin)

### 7.1 Đăng Nhập Admin

**Trang:** `Admin/DangNhap_Admin.html` · **File JS:** `DangNhap_Admin.js`, `admin-session.js`

- Username ≥ 3, password ≥ 6; loading giả lập 1.5s; **ghi nhớ đăng nhập**; **session timeout 24h**; nút demo (chỉ trên localhost).

### 7.2 Bảng Điều Khiển (Dashboard)

**Section:** `page-dashboard` · **File JS:** `admin.js`

- **Stat cards:** số khách hàng, số sản phẩm, số đơn hàng, tổng doanh thu. **Số đơn** = đơn chưa bị hủy; **doanh thu** = chỉ đơn **đã giao** (`daGiao`), cộng `donGia × soLuong` các dòng, **không tính phí ship** (cùng quy tắc với báo cáo doanh thu). Thẻ doanh thu và số khách chỉ hiện với Admin, nhân viên không thấy.
- **Quick action cards** tới các chức năng; mobile có sidebar toggle.

### 7.3 Quản Lý Sản Phẩm

**Section:** `page-products` · **File JS:** `QuanLySanPham.js`, `size-editor.js`

- Bảng 10 sản phẩm/trang: ảnh, mã, tên, danh mục, mô tả, hiển thị; lọc theo danh mục (động từ `categories`); tìm theo mã/tên (gợi ý).

| Thao tác | Chi tiết |
|---|---|
| **Thêm mới** | Modal: ảnh (nén ≤ 400px, lưu base64), mã SP (check trùng), tên, danh mục, giới tính, màu, chất liệu, phong cách, giá nhập, mô tả và **Size & tồn kho theo size**. Sản phẩm mới có `priceValue: 0` nên chưa hiện ở User cho tới khi đặt giá |
| **Chỉnh sửa** | Modal sửa thông tin + ảnh; mở ra hiển thị đúng các size đang có; nếu giá trị có trong dữ liệu mà chưa có trong ô chọn (màu Đỏ/Xám/Be, "Thời trang", "Unisex"...) vẫn được giữ, không bị lưu thành rỗng |
| **Xóa** | Confirm → xóa khỏi danh sách |
| **Ẩn/Hiện** | Click ô ✔/trống để đổi `trangThaiHienThi` |

#### Trình nhập Size & tồn kho (`size-editor.js`)
- **Tạo nhanh:** nút *Nữ 35–40*, *Nam 38–44*, *Phổ thông 36–44*, *Rộng 35–45*.
- **Khoảng size:** nhập *Từ size / Đến size / SL mỗi size* rồi bấm **Tạo size** (SL mỗi size là số lượng ban đầu cho các size mới tạo; size đã có giữ nguyên số lượng).
- **Từng size:** ô số lượng có nút **−/+**, nhập trực tiếp, nút **×** xóa size; Enter nhảy sang size kế tiếp; size 0 đôi tô đỏ nhạt.
- **Đặt tất cả = N → Áp dụng:** gán cùng một số lượng cho mọi size; **Xóa hết size**.
- Dòng tổng kết: *Tổng N đôi · M size*. `kichCo` (vd "38 - 44") và `soLuongTon` được tự tính.
- Xóa hết size của sản phẩm đang có size sẽ hỏi xác nhận rồi đưa tồn kho về 0.

**Đồng bộ:** nghe `productsUpdated`, `categoriesUpdated` và `storage` để tự reload bảng.

### 7.4 Quản Lý Phiếu Nhập Hàng

**Section:** `page-import` · **File JS:** `QuanLyNhapHang.js` · **Seed:** `database/phieuNhapHang.js` (10 mẫu PN001–PN010)

- Bảng phiếu 10/trang (phiếu "chưa hoàn thành" lên trên); lọc theo trạng thái, mã phiếu, khoảng ngày; xem chi tiết.

**Tạo phiếu:** chọn ngày → nhập mã SP (autocomplete theo mã/tên) → nhập số lượng → thành tiền tự tính → "+ Thêm dòng" → chọn trạng thái → Lưu.

**Khi phiếu chuyển sang "Hoàn thành" (chỉ tính lần đầu, lưu lại nhiều lần không cộng trùng):**
- Số lượng nhập được **chia đều vào các size đang có hàng** của sản phẩm (nếu chưa size nào có hàng thì chia đều mọi size; `ShopCore.adjustStock`), nên khách thật sự thấy thêm hàng; `soLuongTon` luôn bằng tổng `tonKhoTheoSize`.
- `tongDaNhap += soLuongNhap`; nếu sản phẩm chưa có giá bán thì tự đặt giá theo % lợi nhuận mặc định.

**Sửa phiếu:** chỉ sửa được phiếu "Chưa hoàn thành"; giữ giá nhập lịch sử. **Xóa phiếu:** có confirm.

### 7.5 Quản Lý Tồn Kho

**Section:** `page-inventory` · **File JS:** `TonKho.js`

- **Ngưỡng sắp hết hàng** (1–1000, mặc định 10) lưu ở `nguongSapHet`.
- **Bảng tồn kho** 10/trang: Mã SP + trạng thái, ảnh, tên, **Tồn kho**, **Tồn theo size**, Nhập, Đã bán, Giá bán, Giá trị tồn (**theo giá nhập**: `giaNhap × soLuongTon`).
- **Cột "Tồn theo size":** mỗi size là một ô nhỏ *size + số đôi*: xanh = bình thường, vàng = còn ≤ 2 đôi, đỏ (gạch size) = hết; dòng tóm tắt "N size · còn hàng X/N".
- **Bộ lọc kết hợp được với nhau:** danh mục, trạng thái (Bình thường / Sắp hết / Hết hàng), **"Còn hàng size …"**, tìm theo mã/tên (lọc ngay khi gõ), lọc theo ngày nhập/bán; khi dữ liệu thay đổi, bộ lọc đang chọn được giữ nguyên.
- Cập nhật realtime khi có thay đổi (đặt hàng, nhập hàng, hủy đơn, tab khác).

### 7.6 Quản Lý Giá Bán

**Section:** `page-prices` · **File JS:** `QuanLyGiaBan.js`

- Bảng sản phẩm có giá nhập > 0 (10/trang); mỗi dòng có ô **% lợi nhuận** và **giá bán**.
- `giaBan = round(giaNhap × (1 + %LN))`; cập nhật đồng loạt hoặc từng sản phẩm; `giaHienThi` và `giaBan` luôn ghi cùng nhau.
- Sản phẩm có `giaBan > 0` sẽ hiện trên trang User.

### 7.7 Quản Lý Đơn Hàng

**Section:** `page-orders` · **File JS:** `quanlydonhang.js`

- **Đồng bộ từ User:** `syncUserOrders()` thêm đơn mới và cập nhật trạng thái đơn đã có (kể cả đơn khách tự hủy).
- Bảng đơn: mã đơn, ngày, khách, tổng tiền, trạng thái; lọc theo khoảng ngày (giờ địa phương), trạng thái, mã đơn; xem chi tiết (sản phẩm **kèm size**, đơn giá, địa chỉ, phương thức thanh toán, phí ship, email).
- **Đổi trạng thái** chỉ theo chiều hợp lệ: `moiDat` → `daXuLy` | `huy`, `daXuLy` → `daGiao` | `huy`; `daGiao` và `huy` là trạng thái cuối (hộp chọn chỉ hiện các bước tiếp theo hợp lệ, nút cập nhật khóa với đơn đã xong). Thực hiện qua `ShopCore.setOrderStatus`:
  - `daGiao`: cộng `tongDaBan`; rời `daGiao` thì trừ lại.
  - `huy`: **hoàn kho đúng size** (chỉ một lần nhờ cờ `daTruKho`); khôi phục đơn đã hủy sẽ kiểm tra còn đủ hàng rồi trừ kho lại.
  - Cập nhật cả `trangThaiQuanTri` lẫn `trangThai` của User và phát `orderStatusChanged`.
- Admin không còn tự động xóa đơn khi mở trang.

### 7.8 Quản Lý Khách Hàng

**Section:** `page-customers` · **File JS:** `quanlynguoidung.js`

- Bảng: **Mã khách hàng (KH...)**, họ tên, email, SĐT, trạng thái, ngày tạo; tìm kiếm; **khóa / mở khóa**; reset mật khẩu; xóa.
- Tài khoản bị khóa không đăng nhập được; nếu đang đăng nhập thì bị đăng xuất ở lần kiểm tra phiên kế tiếp (tải trang, mở giỏ, thanh toán).

### 7.9 Quản Lý Loại Sản Phẩm

**Section:** `page-categories` · **File JS:** `quanlyloaisanpham.js`

- Bảng danh mục: tên, mô tả, **số sản phẩm** (tổng sản phẩm thuộc loại, kể cả đang ẩn/hết hàng/chưa có giá) và **đang bán** (số sản phẩm thật sự hiện trên trang chủ: chưa ẩn, có giá, còn hàng, loại đang hiện); **thêm / sửa / ẩn-hiện**. Ẩn/hiện chỉ đổi `trangThai` của loại; trang chủ User ẩn mọi sản phẩm thuộc loại đang ẩn (trạng thái ẩn/hiện riêng của từng sản phẩm giữ nguyên).
- **Không thể xóa** danh mục còn sản phẩm (hãy chuyển/xóa sản phẩm hoặc dùng *Ẩn*).
- Danh mục thay đổi sẽ cập nhật menu, footer, dải thương hiệu ở User và dropdown trong Admin (`categoriesUpdated`).

### 7.10 Báo Cáo Doanh Thu

**Section:** `page-reports` · **File JS:** `doanhthu.js`

- **Thẻ thống kê:** tổng doanh thu, số đơn, giá trị TB/đơn, số lượng bán.
- **Biểu đồ cột** doanh thu theo ngày/tuần/tháng/năm; **Top sản phẩm bán chạy**; **chi tiết doanh thu từng sản phẩm** (chỉ tính sản phẩm thuộc danh mục hiện tại).
- Lọc theo khoảng thời gian; loại trừ đơn `huy`/`da-huy`; hỗ trợ cả `items` và `product`; tự refresh khi có đơn mới.

### 7.11 Quản Lý Nhân Viên

**Section:** `page-employees` · **File JS:** `QuanLyNhanVien.js` · **CSS:** `QuanLyNhanVien.css`

- Bảng nhân viên: mã NV, họ tên, giới tính, SĐT, địa chỉ, chức vụ, username, trạng thái.
- **Thêm** (mã NV tự động `NV001`…; SĐT 10 số bắt đầu `0`; username ≥ 3 ký tự, không trùng; mật khẩu ≥ 6), **sửa** (bỏ trống mật khẩu = giữ cũ), **khóa/mở khóa**, **xóa**; tìm kiếm; phân trang 10/trang. Lưu `employeeList`, phát `employeesUpdated`.
- Nhân viên đăng nhập ở `Admin/DangNhap_NhanVien.html`, vào chung `TrangChu_Admin.html` với menu/route lọc theo quyền. Có nút **"Thông tin"** xem hồ sơ cá nhân (`nhanvien-info.js`) và hồ sơ admin (`admin-info.js`); nút **Đăng xuất** (`adminSession.handleLogout()`) quay về đúng trang đăng nhập.

**Phân quyền nhân viên (theo chức vụ):**

| Chức vụ | Trang sau khi login | Các module được phép |
|---|---|---|
| Nhân viên bán hàng | Dashboard | Dashboard, Sản phẩm, Đơn hàng |
| Nhân viên kho | Dashboard | Dashboard, Sản phẩm, Phiếu nhập, Tồn kho |
| Nhân viên CSKH | Dashboard | Dashboard, Đơn hàng, **Phản hồi đánh giá** |
| Nhân viên kiểm kho | Dashboard | Dashboard, Sản phẩm, Tồn kho |

Menu/route được lọc theo `ROLE_ROUTES` / `ROLE_HOME` trong `admin-spa-nav.js`; truy cập thẳng route không có quyền sẽ tự về trang chính. Các mục **chỉ admin**: Quản lý khách hàng, loại sản phẩm, giá bán, báo cáo doanh thu, nhân viên.

### 7.12 Phản Hồi & Đánh Giá Khách Hàng (CSKH)

**Section:** `page-reviews` (menu **Phản hồi đánh giá**, route `/reviews`) · **File JS:** `quanlydanhgia.js` · **CSS:** `QuanLyDanhGia.css` · **Dữ liệu:** `database/feedback-store.js`

Dành cho **nhân viên CSKH** (và Admin). Menu có huy hiệu đỏ báo số đánh giá mới chưa ai nhận.

**Tab "Xử lý phản hồi"**
- Thẻ trạng thái *Tất cả / Mới / Đang xử lý / Đã phản hồi* kèm số lượng; bộ lọc: tìm kiếm (sản phẩm, khách, mã đơn, nội dung), số sao (kể cả "chưa hài lòng 1-2 sao"), có ảnh/video, người xử lý (*Của tôi / Chưa ai nhận*), sắp xếp; phân trang 8 phản hồi/trang.
- **Tiếp nhận** → người nhận trở thành người xử lý, trạng thái *Mới → Đang xử lý*.
- Ảnh sản phẩm trong danh sách và cửa sổ chi tiết lấy theo thứ tự: ảnh sản phẩm hiện tại → ảnh lưu kèm đánh giá → ảnh trong đơn hàng đã mua → ảnh mặc định (nên sản phẩm đã xóa vẫn có ảnh).
- Cửa sổ chi tiết: thông tin sản phẩm/khách/đơn, nhận xét đầy đủ, **ảnh phóng to** và **video phát trực tiếp**, **4 mẫu trả lời nhanh**, ô soạn phản hồi.
- **Gửi phản hồi & hoàn tất** → *Đã phản hồi* (khách thấy ngay ở lịch sử đơn và trên trang sản phẩm); **Mở lại** để xử lý tiếp; **Ẩn / Hiện** đánh giá trên trang sản phẩm công khai.
- Nhân viên khác đang xử lý thì bạn chỉ xem được, kể cả nút ẩn/hiện (Admin luôn xử lý được). Thời gian phản hồi lần đầu (`phanHoi.thoiGian`) được giữ nguyên khi cập nhật phản hồi (thời điểm sửa lưu ở `capNhatLuc`).

**Tab "Thống kê feedback"** (lọc theo khoảng ngày — 7 ngày / 30 ngày / tất cả — và theo hãng)
- 6 thẻ số liệu: tổng feedback, điểm trung bình, tỷ lệ hài lòng (4-5★), chưa hài lòng (1-2★), chờ xử lý, thời gian phản hồi trung bình.
- Biểu đồ: **phân bố số sao**; **trạng thái xử lý** (thanh xếp chồng + chú thích); **hình thức đánh giá** (chữ / ảnh / video); **số feedback theo ngày hoặc tháng** (màu cột theo điểm trung bình: xanh ≥ 4, vàng ≥ 3, đỏ < 3).
- Bảng: sản phẩm **được đánh giá cao nhất**, **cần cải thiện**, **được đánh giá nhiều nhất**; điểm theo **hãng**; **hiệu suất từng nhân viên CSKH** (đã nhận, hoàn tất, thời gian phản hồi TB).

---

## 8. Hệ Thống Session & Xác Thực

### User (`assets/js/user/core/account-session.js`)
- `UserSession.setCurrentUser(user)` — đăng nhập; `getCurrentUser()` — đọc user hiện tại; `saveUser(user, previousIdentity, { silent })` — lưu hồ sơ; `clearSession()` — đăng xuất.
- `getCurrentUser()` **đối chiếu lại với `userList`**: tài khoản bị khóa bị xóa phiên ngay; bản ghi trong `userList` luôn thắng bản sao phiên (nên mật khẩu/thông tin Admin vừa sửa không bị ghi đè lại). `saveUser` giữ `matKhau` đã lưu trừ khi gọi với `{ passwordChange: true }`.
- `saveUser()` **giữ nguyên các trường do Admin quản lý** (`trangThai`, `biKhoa`, `ngayKhoa`, `maKH`, `daDatLaiMatKhau`, `ngayTao`); `silent: true` chỉ cập nhật `userList`, không tạo phiên đăng nhập (dùng cho quên mật khẩu).
- Tab khác đăng nhập/đăng xuất → header tab hiện tại tự cập nhật qua `storage`.

### Admin (`Admin/assets/js/admin-session.js`)
- `isLoggedIn()` đúng khi có admin **hoặc** nhân viên đăng nhập; `getCurrentAdmin()` trả `{ username, fullName, role, isNhanVien, loginTime }`; `getCurrentRole()`, `isAdmin()`, `isNhanVien()`; `logout()` xóa cả 2 loại session; `redirectToLogin()` / `handleLogout()` đưa về đúng trang đăng nhập theo vai trò.
- Tự động đăng xuất sau 24h; mọi module kiểm tra đăng nhập trước khi render.

### Nhân viên (`Admin/assets/js/nhanvien-session.js`)
- `EmployeeSession.login/isLoggedIn/getCurrentEmployee/logout` (lưu `nvLoggedIn`, `nvUsername`, `nvFullName`, `nvChucVu`, `nvLoginTime` trong sessionStorage; hết hạn 24h).
- Phân quyền menu/route do `admin-spa-nav.js` xử lý (`getStaffRoutes()`, `getStaffHome()`).

---

## 9. Tài Khoản Demo

| Loại | Username | Mật khẩu |
|---|---|---|
| **Admin** | `admin01` | `admin123` |
| **Nhân viên bán hàng** | `nhanvien01` | `123456` |
| **Nhân viên kho** | `nhanvien02` | `123456` |
| **Nhân viên CSKH** | `nhanvien03` | `123456` |

- Admin đăng nhập bằng `admin01` / `admin123` (validate bằng `AdminSession.isValidAuthUser`) rồi giữ trong `sessionStorage`.
- Nhân viên mặc định được seed từ `database/employees.js` vào `employeeList`; Admin có thể thêm/sửa/khóa trong **Quản lý nhân viên**.
- Khách tự đăng ký ở trang Đăng ký (lưu vào `userList`).

---

## 10. Hướng Dẫn Sử Dụng

1. **Mở hệ thống:** phục vụ thư mục gốc bằng Live Server hoặc `py -m http.server 5500`, mở `index.html` → tự chuyển về trang chủ user.
2. **Lần đầu chạy:** các module tự seed dữ liệu (`productsLocal` 101 sản phẩm, `phieuNhapLocal` 10 phiếu, `employeeList`...) nếu chưa có.
3. **Dùng thử phía user:** duyệt/lọc/tìm → chọn size → thêm vào giỏ → đăng ký/đăng nhập → thanh toán (COD, chuyển khoản hoặc nhận tại cửa hàng) → theo dõi đơn.
4. **Dùng thử phía admin:** `Admin/DangNhap_Admin.html` → `admin01/admin123` → quản lý sản phẩm (nhập size bằng trình chọn size) → tạo phiếu nhập → đặt giá → theo dõi tồn kho theo size, đơn hàng, khách hàng, danh mục, doanh thu.
5. **Luồng thêm sản phẩm mới hoàn chỉnh:**
   - Admin thêm sản phẩm kèm các size → chưa hiện ở user vì chưa có giá.
   - Admin tạo phiếu nhập **Hoàn thành** → tồn kho theo size tăng.
   - Admin đặt giá ở **Quản lý giá bán** → sản phẩm hiện ở trang chủ và mua được.
6. **Luồng đánh giá:** khách đặt hàng → Admin đổi đơn sang **Đã giao** → khách bấm **Đánh giá sản phẩm này** ở Lịch sử đơn → nhân viên CSKH (`nhanvien03/123456`) vào **Phản hồi đánh giá** → Tiếp nhận → Gửi phản hồi → xem tab **Thống kê feedback**.

### Lưu ý
- Dữ liệu nằm ở **trình duyệt của từng máy** (localStorage + IndexedDB). Xóa dữ liệu trình duyệt sẽ đưa hệ thống về dữ liệu mẫu ban đầu và **mất toàn bộ đánh giá**.
- Muốn dọn dữ liệu cũ: DevTools (F12) → Application → xóa các key `productsLocal`, `productsSeedVersion`, `ordersLocal`, `DanhSachDatHang`, `phieuNhapLocal`, `cart` (và IndexedDB `ooad_feedback` nếu muốn xóa đánh giá).
- User và Admin phải cùng origin (cùng địa chỉ + cổng) mới thấy chung dữ liệu; hai cửa sổ mở cùng lúc tự đồng bộ qua `storage`.
- Không phải hệ thống multi-user thật vì không có server dữ liệu — phù hợp đồ án / demo.

---

## 11. Use Case Diagram

Dùng để vẽ **Use Case Diagram** đầy đủ cho 2 hệ thống con: **User** và **Admin**.

### 11.1 Tác nhân (Actors)

| Tác nhân | Mô tả |
|---|---|
| Khách (Guest) | Chưa đăng nhập — xem/lọc/tìm sản phẩm, xem đánh giá, đăng ký, đăng nhập |
| Khách hàng (User) | Đã đăng nhập — kế thừa quyền của Khách + mua hàng, đánh giá, quản lý tài khoản |
| Quản trị viên (Admin) | Đăng nhập `DangNhap_Admin.html` — toàn quyền back-office |
| Nhân viên (Employee) | Đăng nhập `DangNhap_NhanVien.html` — chỉ dùng module được phân quyền theo chức vụ; **nhân viên CSKH** xử lý phản hồi đánh giá |

### 11.2 Use case hệ thống con **User**

#### Dành cho **Khách (Guest)**

| Mã | Use case | Mô tả |
|---|---|---|
| UC-01 | Xem danh sách sản phẩm | Grid 15 SP/trang, phân trang theo nhóm 4 trang |
| UC-02 | Lọc sản phẩm | Theo giá, màu, chất liệu, phong cách, giới tính, size, thương hiệu |
| UC-03 | Tìm kiếm sản phẩm | Theo tên/brand, gợi ý realtime, lịch sử tìm kiếm |
| UC-04 | Xem chi tiết sản phẩm | Popup: ảnh, màu, size, chất liệu, giá |
| UC-05 | Đăng ký tài khoản | Check trùng username/email/SĐT, OTP email |
| UC-06 | Đăng nhập | Email/username + mật khẩu; chặn tài khoản bị khóa |
| UC-31 | Xem đánh giá sản phẩm | Điểm trung bình, phân bố sao, đánh giá kèm ảnh/video và phản hồi cửa hàng |

#### Dành cho **Khách hàng (User)** (kế thừa UC-01 → UC-06, UC-31)

| Mã | Use case | Mô tả |
|---|---|---|
| UC-07 | Thêm sản phẩm vào giỏ hàng | Chọn size từ popup hoặc Mua ngay |
| UC-08 | Quản lý giỏ hàng | Sửa số lượng, xóa dòng, tick chọn, xem tổng tiền |
| UC-09 | Đặt hàng | Checkout: chọn địa chỉ + phương thức thanh toán |
| UC-10 | Thanh toán COD | Thanh toán khi nhận hàng (ship 30.000đ, miễn phí từ 10.000.000đ) |
| UC-11 | Thanh toán chuyển khoản | QR MBBank → xác nhận mới tạo đơn |
| UC-12 | Nhận tại cửa hàng | Ship 0đ |
| UC-13 | Xem lịch sử đơn hàng | Danh sách đơn + tracker trạng thái |
| UC-14 | Hủy đơn hàng | Chỉ khi `cho-xac-nhan`; hoàn kho, Admin thấy ngay |
| UC-15 | Quản lý thông tin cá nhân | Xem/sửa hồ sơ, đổi mật khẩu |
| UC-16 | Quản lý địa chỉ giao hàng | Thêm/sửa/xóa, đặt mặc định |
| UC-17 | Đăng xuất | Xóa session |
| UC-32 | Đánh giá sản phẩm | Chấm 1-5 sao + nhận xét + ảnh/video cho sản phẩm trong đơn đã giao; xem phản hồi của cửa hàng |

### 11.3 Use case hệ thống con **Admin**

| Mã | Use case | Mô tả |
|---|---|---|
| UC-18 | Đăng nhập Admin | Ghi nhớ đăng nhập, timeout 24h |
| UC-19 | Xem Dashboard | Khách, sản phẩm, đơn hàng, doanh thu |
| UC-20 | Quản lý sản phẩm | Thêm/sửa/xóa/Ẩn-Hiện; nhập size & tồn kho theo size |
| UC-21 | Quản lý phiếu nhập hàng | Tạo/sửa/xóa/xem; autocomplete chọn SP |
| UC-22 | Hoàn thành phiếu nhập | Cộng tồn kho vào các size + `tongDaNhap` |
| UC-23 | Quản lý tồn kho | Tồn theo size, ngưỡng sắp hết, lọc theo size/ngày |
| UC-24 | Quản lý giá bán | % lợi nhuận, cập nhật đồng loạt |
| UC-25 | Quản lý đơn hàng | Xem/lọc, đổi trạng thái, hủy đơn (hoàn kho theo size) |
| UC-26 | Quản lý khách hàng | Tìm kiếm, khóa/mở khóa, xóa |
| UC-27 | Quản lý loại sản phẩm | Thêm/sửa/Ẩn-Hiện (không xóa khi còn sản phẩm) |
| UC-28 | Xem báo cáo doanh thu | Biểu đồ, lọc theo thời gian |
| UC-29 | Đăng nhập nhân viên | Trang riêng, chặn tài khoản khóa |
| UC-30 | Quản lý nhân viên | Chỉ admin |
| UC-33 | Xử lý phản hồi đánh giá | Tiếp nhận, soạn & gửi phản hồi, mở lại, ẩn/hiện đánh giá (CSKH / Admin) |
| UC-34 | Thống kê feedback | Điểm TB, phân bố sao, xu hướng, sản phẩm tốt/cần cải thiện, hãng, hiệu suất nhân viên |

> **Nhân viên** tái sử dụng UC-19, UC-20, UC-21, UC-23, UC-25 trong phạm vi chức vụ; **nhân viên CSKH** còn dùng UC-33, UC-34. Các use case UC-22, UC-24, UC-26, UC-27, UC-28, UC-30 chỉ dành cho Admin.

### 11.4 Mối quan hệ giữa các use case

**Kế thừa:** `Khách hàng` là một loại `Khách` → UC-07…UC-17, UC-32 kế thừa UC-01…UC-06, UC-31.

**`≪include≫`:**
- UC-09 Đặt hàng `≪include≫` UC-06 Đăng nhập, Kiểm tra tồn kho, Trừ tồn kho.
- UC-32 Đánh giá sản phẩm `≪include≫` UC-06 Đăng nhập và UC-13 Xem lịch sử đơn hàng (chỉ đơn đã giao).
- UC-20…UC-28, UC-33, UC-34 (Admin) `≪include≫` UC-18 Đăng nhập Admin.
- UC-19, UC-20, UC-21, UC-23, UC-25, UC-33, UC-34 (Nhân viên) `≪include≫` UC-29 Đăng nhập nhân viên + kiểm tra phân quyền.
- UC-30 `≪include≫` UC-18.

**`≪extend≫`:**
- UC-11 Thanh toán chuyển khoản `≪extend≫` UC-09 (thêm QR + chờ xác nhận).
- UC-14 Hủy đơn `≪extend≫` UC-13 (khi `cho-xac-nhan`).
- UC-22 Hoàn thành phiếu nhập `≪extend≫` UC-21.
- UC-32 Đánh giá sản phẩm `≪extend≫` UC-13 (khi đơn `thanh-cong`).
- UC-33 Xử lý phản hồi `≪extend≫` UC-34 Thống kê (từ tab thống kê quay lại xử lý).

### 11.5 Danh sách use case tổng hợp

```
[Khách]          UC-01, UC-02, UC-03, UC-04, UC-05, UC-06, UC-31
[Khách hàng]     UC-07 … UC-17, UC-32 (kế thừa UC-01…UC-06, UC-31)
[Admin]          UC-18 … UC-30, UC-33, UC-34
[Nhân viên]      UC-29 + UC-19, UC-20, UC-21, UC-23, UC-25 (theo chức vụ); CSKH: + UC-33, UC-34
[Hệ thống]       1 biên User (UC-01…UC-17, UC-31, UC-32) + 1 biên Admin (UC-18…UC-30, UC-33, UC-34)
```

---

## 12. Chạy Ứng Dụng

### 12.1 Chạy giao diện User (static server)

Có thể mở trực tiếp `index.html`; trang sẽ chuyển tới `pages/home.html`.

Để tránh giới hạn khi trình duyệt tải module hoặc tài nguyên cục bộ, nên chạy một static server tại thư mục gốc:

```powershell
cd <thư-mục-dự-án>
py -m http.server 5500
```

Sau đó mở <http://localhost:5500/>.

### 12.2 Chạy backend OTP (Node.js)

Backend OTP là một server Node.js nhỏ dùng để gửi mã xác thực qua Resend. Cần chạy backend riêng khi sử dụng đăng ký, quên mật khẩu hoặc đổi mật khẩu bằng OTP.

#### Bước 1: Cài Node.js

1. Truy cập <https://nodejs.org/>.
2. Tải bản **LTS** cho Windows.
3. Chạy bộ cài với các tùy chọn mặc định. Node.js sẽ cài cả `npm`.
4. Đóng và mở lại PowerShell sau khi cài.
5. Kiểm tra cài đặt:

```powershell
node --version
npm --version
```

Node.js cần từ phiên bản 18 trở lên. Nếu PowerShell báo không nhận diện được lệnh `node`, hãy mở terminal mới hoặc cài lại Node.js với tùy chọn thêm vào `PATH`.

#### Bước 2: Chuẩn bị tài khoản gửi email

Backend sử dụng [Resend](https://resend.com/) để gửi OTP. Cần:

1. Tạo tài khoản Resend và đăng nhập.
2. Tạo một API key trong mục **API Keys**.
3. Chuẩn bị địa chỉ gửi trong mục **Domains** hoặc dùng địa chỉ thử nghiệm Resend nếu tài khoản cho phép.
4. Ghi lại API key. Đây là thông tin bí mật và chỉ được đặt trong file `.env` của backend.

#### Bước 3: Tạo file cấu hình backend

Mở PowerShell và chuyển tới thư mục backend:

```powershell
cd <thư-mục-dự-án>\server
```

Tạo file cấu hình thật từ file mẫu:

```powershell
Copy-Item .env.example .env
notepad .env
```

Điền các giá trị tương ứng:

```env
PORT=3000
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=Shoe Store <onboarding@resend.dev>
OTP_TTL_SECONDS=300
OTP_MAX_ATTEMPTS=5
```

Ý nghĩa các biến:

- `PORT`: cổng backend, mặc định là `3000`.
- `RESEND_API_KEY`: API key lấy từ Resend.
- `EMAIL_FROM`: địa chỉ và tên người gửi; phải là địa chỉ/domain được Resend chấp nhận.
- `OTP_TTL_SECONDS`: thời gian OTP còn hiệu lực, mặc định 300 giây.
- `OTP_MAX_ATTEMPTS`: số lần nhập OTP sai tối đa, mặc định 5 lần.

Không commit `server/.env`, không gửi API key lên GitHub và không đưa API key vào JavaScript frontend. File `server/.gitignore` đã được cấu hình để bỏ qua `.env`.

#### Bước 4: Cài đặt và khởi động backend

Trong thư mục `server`, cài các package:

```powershell
npm install
```

Khởi động server:

```powershell
npm start
```

Nếu thành công, terminal sẽ hiển thị:

```text
User OTP server listening on http://localhost:3000
```

Giữ terminal này mở trong suốt thời gian sử dụng chức năng OTP. Dừng server bằng `Ctrl+C`.

#### Bước 5: Chạy frontend ở terminal khác

Mở **một cửa sổ PowerShell mới**, giữ backend đang chạy ở cửa sổ trước, rồi chạy static server từ thư mục gốc:

```powershell
cd <thư-mục-dự-án>
py -m http.server 5500
```

Mở <http://localhost:5500/> trên trình duyệt. Frontend sẽ gọi backend tại `http://localhost:3000/api`.

Nếu máy không có lệnh `py`, có thể dùng một static server khác hoặc mở trực tiếp `index.html`; tuy nhiên chạy static server được khuyến nghị để tránh giới hạn trình duyệt khi tải tài nguyên cục bộ.

#### Bước 6: Kiểm tra backend

Có thể kiểm tra server đã khởi động bằng cách gửi request OTP trong PowerShell. Thay email bằng email thật có thể nhận thư:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/otp/request `
  -ContentType "application/json" `
  -Body '{"email":"your-email@gmail.com","purpose":"register"}'
```

Nếu cấu hình đúng, Resend sẽ gửi email OTP và terminal trả về kết quả thành công. Nếu có lỗi, kiểm tra lại `RESEND_API_KEY`, `EMAIL_FROM`, kết nối mạng và trạng thái xác minh email/domain trên Resend.

### 12.3 Chức năng OTP

OTP được sử dụng cho:

1. Đăng ký tài khoản.
2. Quên mật khẩu.
3. Đổi mật khẩu bằng email.

OTP có 6 chữ số, mặc định hết hạn sau 5 phút và tối đa 5 lần nhập sai. Backend chỉ lưu hash OTP trong bộ nhớ; khởi động lại server sẽ xóa các OTP đang chờ. Backend hiện chưa có database hoặc rate limit theo IP/email.

### 12.4 Tái tạo shell User

`components/header.html` và `components/footer.html` là nguồn dùng chung. Sau khi chỉnh sửa hai file này, chạy từ thư mục gốc:

```powershell
node tools/build-user-shell.js
```

Lệnh trên cập nhật `assets/js/user/core/site-shell.js` (header, footer và đoạn mã đồng bộ menu/footer/dải thương hiệu theo danh mục Admin). Không sửa tay file sinh ra này.
