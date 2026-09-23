# DoAnWeb1 — Hệ Thống Bán Giày Online (Shoe Store)

Hệ thống quản lý bán giày trực tuyến xây dựng hoàn toàn bằng **HTML / CSS / JavaScript thuần** (không framework, không backend). Toàn bộ dữ liệu được lưu trữ trên **localStorage** của trình duyệt. Hai ứng dụng **User** và **Admin** dùng chung một nguồn dữ liệu qua các localStorage key giống nhau nên dữ liệu luôn được đồng bộ.

---

## Mục Lục

1. [Cấu Trúc Dự Án](#1-cấu-trúc-dự-án)
2. [Công Nghệ & Thư Viện](#2-công-nghệ--thư-viện)
3. [Cơ Sở Dữ Liệu (localStorage)](#3-cơ-sở-dữ-liệu-localstorage)
4. [Cơ Chế Đồng Bộ (Events)](#4-cơ-chế-đồng-bộ-events)
5. [Quy Trình Dòng Dữ Liệu Sản Phẩm](#5-quy-trình-dòng-dữ-liệu-sản-phẩm)
6. [Phía Người Dùng (User)](#6-phía-người-dùng-user)
7. [Phía Quản Trị (Admin)](#7-phía-quản-trị-admin)
8. [Hệ Thống Session & Xác Thực](#8-hệ-thống-session--xác-thực)
9. [Tài Khoản Demo](#9-tài-khoản-demo)
10. [Hướng Dẫn Sử Dụng](#10-hướng-dẫn-sử-dụng)
11. [Use Case Diagram](#11-use-case-diagram)
12. [BFD — Biểu Đồ Dòng Chảy Nghiệp Vụ](#12-bfd--biểu-đồ-dòng-chảy-nghiệp-vụ)

---

## 1. Cấu Trúc Dự Án

```
DoAnOOADHK1/
├── index.html                          # Entry → redirect về pages/home.html
├── pages/                              # 15 trang user (home, cart, checkout, payment, profile...)
├── components/                         # header.html + footer.html (nguồn của shared shell)
├── assets/
│   ├── css/
│   │   ├── user/                       # CSS tokens, base, theme cho user
│   │   └── *.css                       # CSS dùng chung
│   ├── js/
│   │   ├── user/
│   │   │   ├── core/                   # site-shell.js, site-header.js, account-session.js, storage.js
│   │   │   ├── product/                # products.js (dữ liệu + hiển thị), detail.js
│   │   │   ├── cart/                   # cart.js, cart-page.js
│   │   │   ├── payment/                # payment.js, checkout.js, payment-bank.js, payment-result.js, payment-success/failed.js
│   │   │   └── account/                # login.js, register.js, profile.js, address.js, order-history.js...
│   │   ├── images/, img/, filemp4/     # Ảnh sản phẩm, avatar, video banner
│   └── img/                            # Avatar, banner
├── Admin/
│   ├── DangNhap_Admin.html             # Trang đăng nhập admin
│   ├── TrangChu_Admin.html             # SPA admin (tất cả chức năng trong 1 trang)
│   └── assets/
│       ├── css/                        # QuanLyNhapHang.css, admin-luxury-theme.css...
│       └── js/                         # admin.js, QuanLySanPham.js, QuanLyNhapHang.js, TonKho.js, QuanLyGiaBan.js...
├── database/
│   ├── products-shoes.js               # Seed 50 sản phẩm + getLocalProducts()/saveLocalProducts()
│   └── phieuNhapHang.js                # Seed 10 phiếu nhập hàng mẫu
└── tools/
    └── build-user-shell.js             # Node script sinh site-shell.js từ components/
```

---

## 2. Công Nghệ & Thư Viện

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | HTML5, CSS3, JavaScript (ES6+) |
| Framework | Không — vanilla JS thuần |
| Backend | Không có — 100% client-side |
| Database | localStorage / sessionStorage |
| Biểu đồ | Chart.js (CDN) — báo cáo doanh thu |
| Thông báo | SweetAlert2 (CDN) — dialog xác nhận |
| QR thanh toán | SVG ngân hàng MBBank inline |
| Responsive | Media queries, flexbox, grid |

---

## 3. Cơ Sở Dữ Liệu (localStorage)

### 3.1 Bảng các key

| Key | Loại | Mô tả |
|---|---|---|
| `productsLocal` | `Array<Product>` | Toàn bộ sản phẩm (50 seed + sản phẩm admin tạo) |
| `cart` | `Array<CartItem>` | Giỏ hàng của user |
| `DanhSachDatHang` | `Array<Order>` | Đơn hàng user đã đặt |
| `CurrDanhSachDatHang` | `Array<Order>` | Đơn tạm cho flow chuyển khoản ngân hàng |
| `phieuNhapLocal` | `Array<Receipt>` | Phiếu nhập hàng |
| `ordersLocal` | `Array<AdminOrder>` | Đơn hàng bản admin (đồng bộ từ `DanhSachDatHang`) |
| `categories` | `Array<Category>` | Danh mục sản phẩm |
| `currentUser` | `Object` | User đang đăng nhập |
| `userList` | `Array<User>` | Danh sách user đã đăng ký, mỗi user có `customerCode` dạng `KH001`, `KH002`... |
| `selectedAddress` | `Object` | Địa chỉ giao hàng đang chọn |
| `shoeSearchHistory` | `Array<string>` | Lịch sử tìm kiếm (tối đa 6) |
| `nguongSapHet` | `number` | Ngưỡng sắp hết hàng (mặc định 10) |
| `dataVersion` | `"v2"` | Version dữ liệu account |
| `rememberedUsername` | `string` | Username admin được ghi nhớ |
| `rememberLogin` | `boolean` | Admin có ghi nhớ đăng nhập hay không |
| `employeeList` | `Array<Employee>` | Danh sách nhân viên cửa hàng |

### 3.2 Schema các model

#### Product
```js
{
  id: "SH-001",                          // Mã SP, duy nhất
  catalog: "Nike",                       // Nike | Adidas | Converse | MLB | Vans
  name: "Nike Air Force 1 Black",
  gender: "Nam" | "Nữ",
  desc: "...",                           // Mô tả ngắn
  color: "Đen",
  material: "Da",
  style: "Thể thao",
  size: "36 - 44",
  priceValue: 1290000,                   // Giá bán (number)
  price: "1.290.000₫",                   // Giá hiển thị
  image: "assets/images/products/..." | "data:image/...",  // Ảnh (đường dẫn hoặc base64)
  importPrice: 903000,                   // Giá vốn (number)
  quantity: 20,                          // Tồn kho thực tế
  importQuantity: 20,                    // Tổng đã nhập
  soldQuantity: 0,                       // Tổng đã bán
  visibility: "visible" | "hidden",
  description: "...",
  origin: "Việt Nam"
}
```

#### Cart Item
```js
{ ...product, quantity: 1 }              // Copy toàn bộ product + thêm số lượng
```

#### Order (User)
```js
{
  id: "DH1726500000000",
  userId: "...",
  info: { name, phone, email, address }, // Địa chỉ giao hàng
  user: { ...currentUser },
  product: [ { ...cartItem }, ... ],
  payment: "COD" | "PayBank" | "PayStore",
  price: "1.290.000đ",
  totalPrice: 1290000,
  priceShip: "30.000đ",
  orderDate: "2026-09-15T...",
  trangthai: "cho-xac-nhan" | "dang-giao" | "thanh-cong" | "da-huy"
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
  sdt: "0901234567",
  diaChi: "...",
  chucVu: "Nhân viên bán hàng" | "Nhân viên kho" | "Nhân viên CSKH" | "Nhân viên kiểm kho",
  username: "nhanvien01",
  password: "123456",
  ngayTao: "2026-09-18",
  trangThai: "hoatdong" | "khoa"
}
```

---

## 4. Cơ Chế Đồng Bộ (Events)

### 4.1 Sự kiện trong cùng tab

| Event | Khi nào | Ai lắng nghe |
|---|---|---|
| `productsUpdated` | Thêm/sửa/xóa SP, nhập hàng, đặt hàng, đổi trạng thái đơn | Trang chủ user, bảng sản phẩm admin, phiếu nhập, tồn kho |
| `categoriesUpdated` | Thêm/sửa/xóa/toggle danh mục | Quản lý sản phẩm, dropdown danh mục |
| `orderStatusChanged` | Admin đổi trạng thái đơn hàng | Lịch sử mua hàng user (màu tracker) |
| `userOrdersUpdated` | User đặt hàng thành công | Đồng bộ đơn hàng admin |
| `user-shell-ready` | Header/footer render xong | Cập nhật UI tài khoản |

### 4.2 Đồng bộ giữa các tab (sự kiện `storage`)

Mỗi module lắng nghe `window.addEventListener("storage", ...)` cho key mình quan tâm:

| Key thay đổi | Hệ quả |
|---|---|
| `productsLocal` | Bảng sản phẩm, phiếu nhập, tồn kho admin tự refresh |
| `categories` | Dropdown danh mục + bảng sản phẩm refresh |
| `nguongSapHet` | Tồn kho cập nhật ngưỡng |
| `DanhSachDatHang` | Danh sách đơn hàng admin refresh |
| `ordersLocal` | Báo cáo doanh thu refresh |
| `currentUser` | Header user cập nhật UI |

---

## 5. Quy Trình Dòng Dữ Liệu Sản Phẩm

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. ADMIN THÊM SẢN PHẨM MỚI                                         │
│    QuanLySanPham.js → saveLocalProducts() → productsLocal + event  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. ADMIN TẠO PHIẾU NHẬP HÀNG (gõ mã SP, nhập số lượng, hoàn thành)│
│    QuanLyNhapHang.js → autocomplete chọn SP → chiTiet phiếu nhập   │
│    Khi trạng thái "hoàn thành":                                     │
│       product.quantity += soLuongNhap                              │
│       product.importQuantity += soLuongNhap                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. ADMIN ĐẶT GIÁ BÁN                                                │
│    QuanLyGiaBan.js → priceValue = importPrice × (1 + %LN)          │
│                      → price = format(priceValue)                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. USER XEM SẢN PHẨM TRÊN TRANG CHỦ                                │
│    products.js → getLocalProducts() → renderProducts()              │
│    Chỉ hiện sản phẩm thoả:                                          │
│        visibility !== "hidden"                                      │
│        && priceValue > 0   (đã đặt giá)                            │
│        && quantity > 0     (đã nhập hàng)                           │
│    → Sản phẩm mới chỉ hiện khi ĐÃ NHẬP HÀNG + ĐÃ ĐẶT GIÁ           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. USER MUA HÀNG                                                    │
│    Thêm vào giỏ → Checkout → ktsoluong() kiểm tra tồn kho           │
│    → trusoluong() trừ số lượng → Tạo đơn DanhSachDatHang            │
│    → dispatch userOrdersUpdated                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. ADMIN QUẢN LÝ ĐƠN HÀNG                                           │
│    syncUserOrders() → DanhSachDatHang → ordersLocal                 │
│    Đổi trạng thái → cập nhật soldQuantity, trả tồn kho nếu hủy      │
│    → dispatch orderStatusChanged → user thấy cập nhật realtime      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Phía Người Dùng (User)

### 6.1 Trang Chủ & Danh Sách Sản Phẩm

**Trang:** `pages/home.html` · **File JS:** `assets/js/user/product/products.js`

#### Chức năng chính
- **Banner video** tự động phát (autoplay, loop).
- **Thanh thương hiệu** (Nike, Adidas, Converse, MLB, Vans) — click để lọc theo brand.
- **Grid sản phẩm** hiển thị 15 sản phẩm/trang kèm phân trang.
- **Popup chi tiết** khi click sản phẩm: ảnh lớn, màu, chất liệu, phong cách, giới tính, size, nút **"Thêm vào giỏ hàng"** và **"Mua ngay"**.

#### Bộ lọc (sidebar)
| Bộ lọc | Loại | Chi tiết |
|---|---|---|
| Giá | Select | Dưới 1tr, 1-2tr, 2-3tr, 3-4tr, Trên 4tr |
| Màu sắc | Select | Đen, Trắng, Đỏ, Xanh dương, Xanh lá, Hồng, Be, Xám |
| Chất liệu | Select | Da, Da tổng hợp, Vải |
| Phong cách | Select | Thời trang, Thể thao, Casual |
| Giới tính | Select | Nam, Nữ |

#### Tìm kiếm
- Nhập tên hoặc brand vào ô tìm kiếm.
- **Gợi ý realtime** khi gõ (tối đa 6 kết quả).
- **Lịch sử tìm kiếm** (lưu 6 gần nhất, có thể xóa).
- Hỗ trợ URL param `?search=...` và `?category=...`.

#### Điều kiện hiển thị sản phẩm
Sản phẩm chỉ hiện khi thoả **3 điều kiện** (`sanPhamBanDuoc`):
1. `visibility !== "hidden"` — đang hiển thị.
2. `priceValue > 0` — đã được đặt giá bán ở admin.
3. `quantity > 0` — đã được nhập hàng ở admin.

---

### 6.2 Giỏ Hàng

**Trang:** `pages/cart.html` · **File JS:** `assets/js/user/cart/cart.js`, `cart-page.js`

- Hiển thị danh sách sản phẩm trong giỏ (ảnh, tên, giá, số lượng).
- **Tăng/giảm số lượng** bằng nút + / - (tối thiểu 1; xuống dưới 1 thì tự xóa).
- **Xóa sản phẩm** khỏi giỏ.
- **Tổng tiền** tính realtime bằng `priceValue × quantity`.
- **Nút thanh toán**: kiểm tra đăng nhập → chuyển tới trang checkout.
- `getcart()` tự lọc bỏ item không hợp lệ (thiếu `id`, `name`, `image` hoặc `priceValue ≤ 0`).
- Dữ liệu giỏ lưu vào `localStorage['cart']`.

---

### 6.3 Thanh Toán (Checkout)

**Trang:** `pages/checkout.html` · **File JS:** `assets/js/user/payment/payment.js`, `checkout.js`

- Hiển thị **địa chỉ giao hàng** (lấy từ `selectedAddress`; chưa có → bắt chọn địa chỉ trước).
- **Kiểm tra tồn kho** bằng `ktsoluong()` — mỗi SP phải đủ số lượng mới thanh toán được.
- Hiển thị **tóm tắt đơn hàng** (danh sách sản phẩm, subtotal, phí ship, tổng tiền).

#### Phương thức thanh toán
| Phương thức | Mã | Phí ship | Luồng xử lý |
|---|---|---|---|
| Chuyển khoản ngân hàng | `PayBank` | 30.000đ | Lưu tạm `CurrDanhSachDatHang` → trang QR code → success/failure |
| Thanh toán khi nhận hàng (COD) | `COD` | 30.000đ | Trừ tồn kho → tạo đơn hàng → trang thành công |
| Thanh toán tại cửa hàng | `PayStore` | 0đ | Trừ tồn kho → tạo đơn hàng → trang thành công |

**Flow COD / PayStore:**
1. `ktsoluong()` kiểm tra tồn kho.
2. `trusoluong()` trừ số lượng sản phẩm.
3. `thanhtoan("COD")` tạo đơn hàng → lưu `DanhSachDatHang`.
4. Chuyển tới `payment-success.html`.

**Flow PayBank:**
1. `ktsoluong()` kiểm tra tồn kho.
2. `thanhtoan("PayBank")` tạo đơn hàng → lưu tạm `CurrDanhSachDatHang`.
3. Hiển thị QR code ngân hàng MBBank.
4. Thành công: `trusoluong()` → ghi nhận đơn → xóa giỏ hàng.
5. Thất bại: xóa `CurrDanhSachDatHang` → `payment-failed.html`.

---

### 6.4 Quản Lý Tài Khoản

#### Đăng ký — `pages/register.html` (`assets/js/user/account/register.js`)
- Username: chỉ chữ, tối thiểu 3 ký tự, không trùng.
- Email: đúng định dạng regex, không trùng.
- Số điện thoại: dạng `0xxxxxxxxx` (10 số, bắt đầu bằng 0), không trùng.
- Mật khẩu: tối thiểu 8 ký tự, hiển thị rule realtime.
- Xác nhận mật khẩu phải khớp.
- Địa chỉ: tối thiểu 10 ký tự.

#### Đăng nhập — `pages/login.html` (`assets/js/user/account/login.js`)
- Đăng nhập bằng **email hoặc username** + mật khẩu.
- Kiểm tra tài khoản không bị khóa (`locked !== true && status !== 'blocked'`).
- Lưu session bằng `UserSession.setCurrentUser()`.

#### Hồ sơ — `pages/profile.html`, `personal-info.html`, `change-password.html`
- **Xem hồ sơ:** avatar, tên, email, SĐT, địa chỉ.
- **Sửa thông tin:** toggle readOnly → edit → lưu qua `UserSession.saveUser()`.
- **Đổi mật khẩu:** nhập MK cũ → MK mới (≥ 8) → xác nhận → lưu → đăng nhập lại.

---

### 6.5 Quản Lý Địa Chỉ

**Trang:** `pages/address.html` · **File JS:** `assets/js/user/account/address.js`

- Hiển thị danh sách địa chỉ dạng card.
- **Thêm mới** địa chỉ (modal form có validation: tên, SĐT, địa chỉ chi tiết).
- **Chỉnh sửa** địa chỉ.
- **Xóa** địa chỉ.
- **Đặt làm mặc định** — địa chỉ mặc định tự gán vào `selectedAddress`.
- Khi thanh toán: render địa chỉ đã chọn; chưa chọn → redirect tới trang địa chỉ.

---

### 6.6 Lịch Sử Mua Hàng

**Trang:** `pages/order-history.html` · **File JS:** `assets/js/user/account/order-history.js`

- Hiển thị đơn hàng của user đang đăng nhập (filter theo `userId` hoặc email/username).
- **Phân trang:** 3 đơn/trang.
- **Mở rộng chi tiết** đơn: danh sách sản phẩm, địa chỉ, phương thức thanh toán.
- **Order tracker** với màu sắc: Đã hủy → đỏ; Thành công → xanh lá; Đang giao → xám; Đang xử lý → mặc định.
- **Hủy đơn** — chỉ khi trạng thái `cho-xac-nhan`.
- **Đồng bộ trạng thái từ admin:** khi admin đổi trạng thái, sự kiện `orderStatusChanged` cập nhật realtime lên tracker của user.

#### Ánh xạ trạng thái
| Trạng thái User | Trạng thái Admin |
|---|---|
| `cho-xac-nhan` | `moiDat` |
| `dang-giao` | `daXuLy` |
| `thanh-cong` | `daGiao` |
| `da-huy` | `huy` |

---

### 6.7 Header & Session UI

**File JS:** `assets/js/user/core/site-header.js`, `site-shell.js` · **Nguồn:** `components/header.html`, `footer.html`

- Header dùng chung cho mọi trang user (inject bởi `site-shell.js`).
- **Chưa đăng nhập:** hiển thị link "Đăng nhập".
- **Đã đăng nhập:** hiển thị avatar + tên → dropdown (Hồ sơ, Đơn hàng, Đăng xuất).
- **Tìm kiếm** trong header → redirect `pages/home.html?search=...#sanpham`.
- **Đăng xuất:** SweetAlert xác nhận → `UserSession.clearSession()` → về `index.html`.
- Tự cập nhật khi `currentUser` thay đổi ở tab khác.

---

## 7. Phía Quản Trị (Admin)

### 7.1 Đăng Nhập Admin

**Trang:** `Admin/DangNhap_Admin.html` · **File JS:** `Admin/assets/js/DangNhap_Admin.js`, `admin-session.js`

- Form đăng nhập username + password (username ≥ 3, password ≥ 6).
- **Loading state** giả lập 1.5s.
- **Ghi nhớ đăng nhập** → lưu `rememberedUsername` / `rememberLogin`.
- **Session timeout** 24h → tự đăng xuất + redirect về trang đăng nhập.
- **Nút demo** hiển thị thông tin tài khoản demo (chỉ chạy trên localhost).

### 7.2 Bảng Điều Khiển (Dashboard)

**Section:** `page-dashboard` trong `TrangChu_Admin.html` · **File JS:** `Admin/assets/js/admin.js`

- **Stat cards:** Số khách hàng, Số sản phẩm, Số đơn hàng, Tổng doanh thu.
- **Quick action cards:** liên kết nhanh tới các chức năng quản lý.
- **Mobile:** sidebar toggle hamburger.

### 7.3 Quản Lý Sản Phẩm

**Section:** `page-products` · **File JS:** `Admin/assets/js/QuanLySanPham.js`

- Bảng sản phẩm 10/trang: ảnh, mã, tên, danh mục, mô tả.
- **Bộ lọc dropdown** danh mục (động từ `categories`, chỉ hiện danh mục đang active).
- **Tìm kiếm** theo mã hoặc tên (autocomplete gợi ý tối đa 10 kết quả).

| Thao tác | Chi tiết |
|---|---|
| **Thêm mới** | Modal form: upload ảnh (FileReader → base64), mã SP (check trùng), tên, danh mục, giới tính, màu, chất liệu, phong cách, size, giá nhập ≥ 0, mô tả. Sản phẩm mới có `priceValue: 0`, `quantity: 0`, `visibility: "visible"` |
| **Chỉnh sửa** | Modal sửa thông tin + ảnh. Giữ ảnh cũ nếu không chọn file mới |
| **Xóa** | Confirm dialog → lọc bỏ → lưu lại |
| **Ẩn/Hiện** | Click ô ✔/trống để toggle `visibility` |

**Đồng bộ:** nghe sự kiện `productsUpdated`, `categoriesUpdated` và sự kiện `storage` từ tab khác để tự reload bảng.

### 7.4 Quản Lý Phiếu Nhập Hàng

**Section:** `page-import` · **File JS:** `Admin/assets/js/QuanLyNhapHang.js` · **Seed:** `database/phieuNhapHang.js` (10 mẫu PN001–PN010)

- Bảng phiếu nhập 10/trang, sắp xếp phiếu "chưa hoàn thành" lên trên.
- **Bộ lọc:** trạng thái, mã phiếu, khoảng ngày.
- **Xem chi tiết** modal: danh sách sản phẩm đã nhập, đơn giá, thành tiền.

**Tạo phiếu mới:**
1. Click "Thêm mới phiếu nhập".
2. Chọn ngày nhập.
3. **Nhập mã sản phẩm** — ô nhập kèm autocomplete:
   - Gõ mã hoặc tên SP → dropdown gợi ý (tối đa 20 kết quả).
   - Nhấn Enter/Tab → tự chọn SP khớp nhất.
   - Blur → tự ghi nhận SP đã chọn.
   - Chọn xong → tự hiển thị tên + giá nhập.
4. Nhập số lượng.
5. Thành tiền tự tính (= giá nhập × số lượng).
6. Nhấn "+ Thêm dòng" để nhập thêm sản phẩm khác.
7. Chọn trạng thái: "Chưa hoàn thành" / "Hoàn thành".
8. Lưu phiếu.

**Khi phiếu ở trạng thái "Hoàn thành":**
- `product.quantity += soLuongNhap`.
- `product.importQuantity += soLuongNhap`.
- Tồn kho tăng → sản phẩm hiển thị trên trang user.

**Sửa phiếu:** chỉ sửa được phiếu "Chưa hoàn thành"; giữ nguyên giá nhập lịch sử (không bị đè bởi giá hiện tại của sản phẩm).

**Xóa phiếu:** có confirm dialog; phiếu đã hoàn thành cũng xóa được.

### 7.5 Quản Lý Tồn Kho

**Section:** `page-inventory` · **File JS:** `Admin/assets/js/TonKho.js`

- **Ngưỡng sắp hết hàng** (1–1000, mặc định 10) — chỉnh realtime, lưu vào `nguongSapHet`.
- **Bảng tồn kho** 10/trang gồm các cột: Mã SP, Tên, Danh mục, Tồn kho, Nhập, Bán, Giá trị tồn, Trạng thái.
- **Trạng thái tự tính:** `Sắp hết` khi `quantity <= nguongSapHet`, `Nhập thêm` khi `quantity <= 5` (và chưa hết), `Còn hàng` còn lại.
- **Lọc theo ngày** nhập/bán.
- Số liệu phản ánh ngay từ `productsLocal`; cập nhật realtime khi có thay đổi ở tab khác.

### 7.6 Quản Lý Giá Bán

**Section:** `page-pricing` · **File JS:** `Admin/assets/js/QuanLyGiaBan.js`

- Bảng các sản phẩm có giá nhập > 0, 10/trang.
- Mỗi dòng có ô nhập **% lợi nhuận** và **giá bán**.
- Tính toán: `priceValue = round(importPrice × (1 + lợi nhuận%))`.
- **Cập nhật đồng loạt** theo % hoặc theo từng sản phẩm.
- Sau khi lưu, sản phẩm có `priceValue > 0` sẽ hiện trên trang user.

### 7.7 Quản Lý Đơn Hàng

**Section:** `page-orders` · **File JS:** `Admin/assets/js/quanlydonhang.js`

- **Đồng bộ từ user:** `syncUserOrders()` kéo dữ liệu từ `DanhSachDatHang` sang `ordersLocal`.
- Bảng đơn hàng với thông tin: mã đơn, khách hàng, tổng tiền, phương thức thanh toán, ngày đặt, trạng thái.
- **Bộ lọc + tìm kiếm** theo mã đơn / tên khách / trạng thái.
- **Xem chi tiết** đơn: danh sách sản phẩm, địa chỉ giao, phí ship.
- **Đổi trạng thái:** `moiDat` → `daXuLy` → `daGiao` (hoặc `huy`).
  - Khi giao `/xử lý thành công` → cập nhật `soldQuantity` của sản phẩm.
  - Khi `huy` → trả lại số lượng vào tồn kho.
- Hủy đơn **từ phía admin** luôn ghi nhận lý do hủy.
- Dispatch sự kiện `orderStatusChanged` để user thấy cập nhật realtime.

### 7.8 Quản Lý Khách Hàng

**Section:** `page-customers` · **File JS:** `Admin/assets/js/quanlynguoidung.js`

- Bảng khách hàng: **Mã khách hàng (KH...)**, họ tên, email, SĐT, trạng thái, ngày tạo; tìm kiếm, khóa/mở khóa, reset mật khẩu.
- **Tìm kiếm** theo tên / email / SĐT.
- **Khóa / mở khóa** tài khoản (tài khoản bị khóa không đăng nhập được ở user).
- **Xóa** khách hàng (có confirm dialog).

### 7.9 Quản Lý Loại Sản Phẩm

**Section:** `page-categories` · **File JS:** `Admin/assets/js/quanlyloaisanpham.js`

- Bảng danh mục: tên, mô tả, số sản phẩm thuộc danh mục.
- **Thêm / sửa / xóa** danh mục.
- **Ẩn/Hiện** (active) — danh mục ẩn không xuất hiện trong dropdown lọc sản phẩm.
- Dispatch `categoriesUpdated` để các module khác cập nhật theo.

### 7.10 Báo Cáo Doanh Thu

**Section:** `page-reports` · **File JS:** `Admin/assets/js/doanhthu.js`

- **3 thẻ thống kê:** tổng doanh thu, số đơn, giá trị TB/đơn, SL sản phẩm đã bán.
- **Biểu đồ cột dọc** doanh thu theo ngày/tuần/tháng/năm (xoay ngang chủ đề brass).
- **Top sản phẩm bán chạy nhất** theo số lượng (rank #1 được đánh dấu 👑 bán chạy nhất).
- **Chi tiết doanh thu từng sản phẩm:** bảng đầy đủ mã SP, tên, SL bán, giá bán, doanh thu, % doanh thu. Chỉ tính các sản phẩm thuộc danh mục giày hiện tại (`productsLocal`) — các item legacy ngoài cửa hàng (vd: đồng hồ) bị loại khỏi báo cáo.
- Lọc theo khoảng thời gian + chọn chu kỳ (ngày/tuần/tháng/năm); loại trừ đơn `huy`/`da-huy`.
- Dữ liệu từ `ordersLocal` (hỗ trợ cả `items` hoặc `product`); tự refresh khi có đơn mới (sự kiện `storage`).

### 7.11 Quản Lý Nhân Viên

**Section:** `page-employees` · **File JS:** `Admin/assets/js/QuanLyNhanVien.js` · **File CSS:** `Admin/assets/css/QuanLyNhanVien.css`

- Bảng nhân viên: mã NV, họ tên, giới tính, SĐT, địa chỉ, chức vụ, username, trạng thái.
- **Thêm nhân viên:** mã NV tự động (`NV001`, `NV002`...); nhập họ tên, giới tính, SĐT (10 số bắt đầu `0`), địa chỉ, chức vụ, username (3+ ký tự, không dấu, không trùng), mật khẩu (6+ ký tự).
- **Sửa nhân viên:** cập nhật thông tin; bỏ trống mật khẩu = giữ mật khẩu cũ.
- **Khóa/Mở khóa** tài khoản — tài khoản bị khóa không đăng nhập được.
- **Xóa nhân viên** (có confirm dialog).
- **Tìm kiếm** theo mã NV / tên / SĐT / chức vụ; phân trang 10 nhân viên/trang.
- Lưu vào `employeeList`, dispatch `employeesUpdated`.
- **Tài khoản nhân viên:** admin tạo tài khoản, nhân viên đăng nhập ở trang riêng `Admin/DangNhap_NhanVien.html` (validate theo `employeeList`), sau đó vào **chung dashboard** `TrangChu_Admin.html` với menu + route bị ẩn/chặn theo quyền.
- **Nhân viên xem thông tin cá nhân:** nút "Thông tin" trên header (chỉ hiện với nhân viên, file `Admin/assets/js/nhanvien-info.js`) — hiện modal mã NV, họ tên, giới tính, SĐT, địa chỉ, chức vụ, username, trạng thái, phân quyền.
- **Admin xem profile & quyền kiểm soát:** nút "Thông tin" trên header (chỉ hiện với admin, file `Admin/assets/js/admin-info.js`) — modal vai trò Quản trị viên, họ tên, username, thời gian đăng nhập, badge "Toàn bộ hệ thống" và danh sách 9 phân hệ admin kiểm soát (sản phẩm, phiếu nhập, tồn kho, đơn hàng, khách hàng, loại sản phẩm, giá bán, báo cáo doanh thu, nhân viên).
- **Logout đúng trang:** nút "Đăng xuất" dùng `adminSession.handleLogout()` — admin quay về `DangNhap_Admin.html`, nhân viên quay về `DangNhap_NhanVien.html`.

**Phân quyền nhân viên (theo chức vụ):**

| Chức vụ | Trang sau khi login | Các module được phép |
|---|---|---|
| Nhân viên bán hàng | Dashboard | Dashboard, Sản phẩm, Đơn hàng |
| Nhân viên kho | Dashboard | Dashboard, Sản phẩm, Phiếu nhập, Tồn kho |
| Nhân viên CSKH | Dashboard | Dashboard, Đơn hàng |
| Nhân viên kiểm kho | Dashboard | Dashboard, Sản phẩm, Tồn kho |

- Ruột menu + route được lọc thủ công theo chức vụ trong `Admin/assets/js/admin-spa-nav.js` (map `ROLE_ROUTES`/`ROLE_HOME`): link/action-card của module không thuộc quyền bị ẩn, truy cập thẳng route bị chặn → tự về trang chính của chức vụ.
- Các mục **chỉ admin**: Quản lý khách hàng, Quản lý loại sản phẩm, Quản lý giá bán, Báo cáo doanh thu, Quản lý nhân viên.

---

## 8. Hệ Thống Session & Xác Thực

### User (`assets/js/user/core/account-session.js`)
- `UserSession.setCurrentUser(user)` — đăng nhập.
- `UserSession.getCurrentUser()` — đọc user hiện tại.
- `UserSession.saveUser(updatedUser)` — lưu thay đổi hồ sơ.
- `UserSession.clearSession()` — đăng xuất.
- `user-shell-ready` event → cập nhật giao diện header sau khi shell render xong.
- User đăng nhập ở tab khác → header tab hiện tại tự cập nhật qua sự kiện `storage`.

### Admin (`Admin/assets/js/admin-session.js`)
- `AdminSession.login()`, `AdminSession.logout()`, `AdminSession.isAuthenticated()`.
- `AdminSession.isValidAuthUser(username, password)` — validate tài khoản admin.
- Tự động logout sau 24h.
- **Bảo vệ route:** mọi module admin kiểm tra đăng nhập trước khi render; chưa đăng nhập → redirect `DangNhap_Admin.html`.
- **Phiên hợp nhất (admin + nhân viên):** `isLoggedIn()` đúng khi có admin HOẶC nhân viên đăng nhập; `getCurrentAdmin()` trả `{ username, fullName, role, isNhanVien, loginTime }`; `getCurrentRole()` cho biết role hiện tại; `isAdmin()`/`isNhanVien()` phân biệt loại tài khoản; `logout()` xóa cả 2 loại session; `redirectToLogin()` tự chọn trang login theo role; `handleLogout()` logout rồi quay về đúng trang đăng nhập.

### Nhân viên (`Admin/assets/js/nhanvien-session.js`)
- `EmployeeSession.login(employee)` — đăng nhập, lưu `nvLoggedIn`, `nvUsername`, `nvFullName`, `nvChucVu`, `nvLoginTime` (sessionStorage).
- `EmployeeSession.isLoggedIn()` — kiểm tra phiên + hết hạn sau 24h.
- `EmployeeSession.getCurrentEmployee()` — trả thông tin nhân viên hiện tại.
- `EmployeeSession.logout()` — xóa phiên nhân viên.
- Phân quyền menu/route do `Admin/assets/js/admin-spa-nav.js` xử lý: ẩn mục `data-role="admin"` và module không thuộc quyền của chức vụ, chặn route ngoài danh sách `getStaffRoutes()`, mỗi chức vụ có trang đích riêng sau login (`getStaffHome()`).

---

## 9. Tài Khoản Demo

| Loại | Username | Mật khẩu |
|---|---|---|
| **Admin** | `admin01` | `admin123` |
| **Nhân viên bán hàng** | `nhanvien01` | `123456` |
| **Nhân viên kho** | `nhanvien02` | `123456` |
| **Nhân viên CSKH** | `nhanvien03` | `123456` |

- Không có tài khoản admin mặc định trong localStorage → admin đăng nhập qua username `admin01`/`admin123` (validate bằng `AdminSession.isValidAuthUser`) rồi tự ghi nhớ trong `sessionStorage`.
- Nhân viên mặc định được seed từ `database/employees.js` vào `employeeList` (3 tài khoản `nhanvien01`/`02`/`03`, mật khẩu `123456`); admin có thể thêm/sửa/khóa tài khoản trong **Quản lý nhân viên**.
- User tự đăng ký tại trang Đăng ký (lưu vào `userList`).

---

## 10. Hướng Dẫn Sử Dụng

1. **Mở hệ thống:** chạy `index.html` (qua Live Server cho trải nghiệm tốt nhất) → tự redirect về trang chủ user.
2. **Lần đầu chạy:** các module tự seed dữ liệu khởi tạo (`productsLocal` 50 sản phẩm, `phieuNhapLocal` 10 phiếu, `categories`, `DanhSachDatHang` mẫu...) nếu chưa từng tồn tại.
3. **Dùng thử phía user:** duyệt/lọc/tìm sản phẩm → thêm vào giỏ → đăng ký/đăng nhập → thanh toán (COD, chuyển khoản hoặc tại cửa hàng) → theo dõi đơn hàng.
4. **Dùng thử phía admin:** vào `Admin/DangNhap_Admin.html`, đăng nhập `admin01/admin123` → quản lý sản phẩm → tạo phiếu nhập (autocomplete mã SP) → đặt giá bán → theo dõi tồn kho, đơn hàng, khách hàng, danh mục và doanh thu.
5. **Luồng thêm sản phẩm mới hoàn chỉnh:**
   - Admin thêm sản phẩm (chưa có giá, chưa có tồn kho) → chưa hiện ở user.
   - Admin tạo phiếu nhập và để trạng thái **Hoàn thành** → tồn kho tăng.
   - Admin đặt giá bán ở **Quản lý giá bán**.
   - Khi đủ `priceValue > 0` và `quantity > 0` → sản phẩm tự xuất hiện trên trang user và bán được.

### Lưu ý
- Dữ liệu nằm hoàn toàn ở **localStorage của từng trình duyệt** — xóa dữ liệu trình duyệt sẽ reset hệ thống về seed ban đầu.
- Hai cửa sổ user/admin mở cùng lúc sẽ tự đồng bộ qua sự kiện `storage` (không cần refresh).
- Không vận hành được như một hệ thống multi-user thật vì không có server — phù hợp mục đích đồ án / demo.

---

## 11. Use Case Diagram

Dùng để vẽ **Use Case Diagram** đầy đủ cho 2 hệ thống con: **User** và **Admin**.

### 11.1 Tác nhân (Actors)

| Tác nhân | Mô tả |
|---|---|
| Khách (Guest) | Chưa đăng nhập — chỉ xem/lọc/tìm sản phẩm, đăng ký, đăng nhập |
| Khách hàng (User) | Đã đăng nhập — kế thừa toàn bộ quyền của Khách + mua hàng, quản lý tài khoản |
| Quản trị viên (Admin) | Đăng nhập `DangNhap_Admin.html` — toàn quyền quản trị (sản phẩm, tồn kho, đơn hàng, khách hàng, nhân viên, báo cáo) |
| Nhân viên (Employee) | Đăng nhập `DangNhap_NhanVien.html` — vào chung dashboard, chỉ truy cập module được phân quyền (sản phẩm, phiếu nhập, tồn kho, đơn hàng) |
| Quản trị viên (Admin) | Quản lý toàn bộ back-office (sản phẩm, nhập hàng, tồn kho, giá, đơn hàng, khách hàng, danh mục, doanh thu) |

### 11.2 Use case hệ thống con **User**

#### Dành cho **Khách (Guest)**

| Mã | Use case | Mô tả |
|---|---|---|
| UC-01 | Xem danh sách sản phẩm | Grid 15 SP/trang kèm phân trang |
| UC-02 | Lọc sản phẩm | Theo giá, màu, chất liệu, phong cách, giới tính, thương hiệu |
| UC-03 | Tìm kiếm sản phẩm | Theo tên/brand, gợi ý realtime, lưu lịch sử tìm kiếm |
| UC-04 | Xem chi tiết sản phẩm | Popup: ảnh, màu, size, chất liệu, phong cách, giá |
| UC-05 | Đăng ký tài khoản | Tạo tài khoản; check trùng username/email/SĐT |
| UC-06 | Đăng nhập | Bằng email hoặc username + mật khẩu; chặn tài khoản bị khóa |

#### Dành cho **Khách hàng (User)** (kế thừa UC-01 → UC-06)

| Mã | Use case | Mô tả |
|---|---|---|
| UC-07 | Thêm sản phẩm vào giỏ hàng | Từ popup chi tiết hoặc nút Mua ngay |
| UC-08 | Quản lý giỏ hàng | Sửa số lượng, xóa SP, xem tổng tiền |
| UC-09 | Đặt hàng | Checkout: chọn địa chỉ + phương thức thanh toán |
| UC-10 | Thanh toán COD | Thanh toán khi nhận hàng (ship 30.000đ) |
| UC-11 | Thanh toán chuyển khoản | Hiển thị QR MBBank → xác nhận thành công/thất bại |
| UC-12 | Thanh toán tại cửa hàng | Nhận tại cửa hàng (ship 0đ) |
| UC-13 | Xem lịch sử đơn hàng | Danh sách đơn + tracker trạng thái |
| UC-14 | Hủy đơn hàng | Chỉ khi đơn ở trạng thái `cho-xac-nhan` |
| UC-15 | Quản lý thông tin cá nhân | Xem/sửa hồ sơ, đổi mật khẩu |
| UC-16 | Quản lý địa chỉ giao hàng | Thêm/sửa/xóa, đặt địa chỉ mặc định |
| UC-17 | Đăng xuất | Xóa session hiện tại |

### 11.3 Use case hệ thống con **Admin**

| Mã | Use case | Mô tả |
|---|---|---|
| UC-18 | Đăng nhập Admin | Username + password, ghi nhớ đăng nhập, timeout 24h |
| UC-19 | Xem Dashboard | Thống kê khách hàng, sản phẩm, đơn hàng, doanh thu |
| UC-20 | Quản lý sản phẩm | Thêm/sửa/xóa/Ẩn-Hiện; upload ảnh base64 |
| UC-21 | Quản lý phiếu nhập hàng | Tạo/sửa/xóa/Xem chi tiết; autocomplete chọn SP |
| UC-22 | Hoàn thành phiếu nhập | Cộng `quantity` + `importQuantity` vào sản phẩm |
| UC-23 | Quản lý tồn kho | Theo dõi tồn, đặt ngưỡng sắp hết, lọc theo ngày |
| UC-24 | Quản lý giá bán | Đặt % lợi nhuận, cập nhật giá đồng loạt |
| UC-25 | Quản lý đơn hàng | Xem/lọc đơn, đổi trạng thái, hủy đơn kèm lý do |
| UC-26 | Quản lý khách hàng | Tìm kiếm, khóa/mở khóa, xóa tài khoản |
| UC-27 | Quản lý loại sản phẩm | Thêm/sửa/xóa/Ẩn-Hiện danh mục |
| UC-28 | Xem báo cáo doanh thu | Biểu đồ Chart.js, lọc theo thời gian/loại sản phẩm |
| UC-29 | Đăng nhập nhân viên | Trang riêng `DangNhap_NhanVien.html`, validate theo `employeeList`, chặn tài khoản bị khóa |
| UC-30 | Quản lý nhân viên | Chỉ admin: thêm/sửa/khóa-mở khóa/xóa nhân viên, tìm kiếm, phân trang |

> **Nhân viên** không có use case riêng — tái sử dụng UC-19 (Dashboard), UC-20 (Sản phẩm), UC-21 (Phiếu nhập), UC-23 (Tồn kho), UC-25 (Đơn hàng) trong phạm vi phân quyền; các use case còn lại (UC-22, UC-24, UC-26, UC-27, UC-28, UC-30) chỉ dành cho Admin.

### 11.4 Mối quan hệ giữa các use case

**Kế thừa (generalization):**
- `Khách hàng` là một loại `Khách` → UC-07…UC-17 kế thừa toàn bộ UC-01…UC-06.

**`≪include≫` (bắt buộc):**
- UC-09 Đặt hàng `≪include≫` UC-06 Đăng nhập (chưa đăng nhập thì bắt đăng nhập trước).
- UC-09 Đặt hàng `≪include≫` Kiểm tra tồn kho.
- UC-09 Đặt hàng `≪include≫` Trừ tồn kho (sau khi đặt thành công).
- UC-20…UC-28 (Admin) `≪include≫` UC-18 Đăng nhập Admin (bảo vệ route).
- UC-19, UC-20, UC-21, UC-23, UC-25 (khi do Nhân viên thực hiện) `≪include≫` UC-29 Đăng nhập nhân viên + kiểm tra phân quyền (menu/route bị ẩn/chặn theo chức vụ).
- UC-30 Quản lý nhân viên `≪include≫` UC-18 Đăng nhập Admin (chỉ admin).

**`≪extend≫` (tùy chọn, điều kiện):**
- UC-11 Thanh toán chuyển khoản `≪extend≫` UC-09 Đặt hàng (thêm bước hiển thị QR + chờ xác nhận chuyển khoản).
- UC-14 Hủy đơn hàng `≪extend≫` UC-13 Xem lịch sử đơn hàng (chỉ khi đơn ở trạng thái `cho-xac-nhan`).
- UC-22 Hoàn thành phiếu nhập `≪extend≫` UC-21 Quản lý phiếu nhập (khi chọn trạng thái "Hoàn thành").

### 11.5 Danh sách use case tổng hợp (để vẽ sơ đồ)

```
[Khách]          UC-01, UC-02, UC-03, UC-04, UC-05, UC-06
[Khách hàng]     UC-07, UC-08, UC-09, UC-10, UC-11, UC-12, UC-13, UC-14, UC-15, UC-16, UC-17
                 (kế thừa: +UC-01 … UC-06 của Khách)
[Admin]          UC-18, UC-19, UC-20, UC-21, UC-22, UC-23, UC-24, UC-25, UC-26, UC-27, UC-28, UC-29, UC-30
[Nhân viên]      UC-29 (đăng nhập nhân viên) + UC-19, UC-20, UC-21, UC-23, UC-25 (theo phân quyền; menu/route bị chặn ngoài danh sách)
[Hệ thống]       1 biên User (UC-01…UC-17) + 1 biên Admin (UC-18…UC-30)
```

---

## 12. BFD — Biểu Đồ Dòng Chảy Nghiệp Vụ

Mỗi BFD mô tả luồng xử lý nghiệp vụ từ khi **bắt đầu → xử lý → rẽ nhánh quyết định → kết thúc** để vẽ **Business Flow Diagram / Activity Diagram**.

### BFD-01: Luồng bán hàng end-to-end (cốt lõi)

```
BẮT ĐẦU
  ↓
Admin thêm sản phẩm mới (Quản lý sản phẩm)
  ↓
Admin tạo phiếu nhập hàng (chọn SP, số lượng, giá nhập)
  ↓
[Phiếu "Hoàn thành"?]
    ├─ Không → lưu phiếu trạng thái "Chưa hoàn thành" (chưa nhập kho)
    │
    └─ Có → Cộng tồn kho: quantity += slNhap, importQuantity += slNhap
  ↓
Admin đặt giá bán (Quản lý giá bán → priceValue > 0)
  ↓
Sản phẩm thoả (visible, priceValue>0, quantity>0) → hiển thị trên trang chủ User
  ↓
User xem sản phẩm → thêm vào giỏ hàng → bấm thanh toán
  ↓
[Đã đăng nhập?]
    ├─ Không → yêu cầu đăng nhập → quay lại bước thanh toán
    │
    └─ Có → chọn địa chỉ + phương thức thanh toán
  ↓
[Kiểm tra tồn kho (ktsoluong)]
    ├─ Không đủ → báo lỗi, không cho đặt
    │
    └─ Đủ → [Phương thức?]
                  ├─ COD / PayStore → trừ tồn kho → tạo đơn hàng → trang thành công
                  │
                  └─ PayBank → tạo đơn tạm → hiển thị QR →
                        [Người mua chuyển khoản + xác nhận?]
                            ├─ Có → trừ tồn kho → ghi nhận đơn → xóa giỏ
                            └─ Không → xóa đơn tạm → trang thất bại
  ↓
Đồng bộ đơn sang Admin (ordersLocal)
  ↓
Admin xử lý đơn → đổi trạng thái (moiDat → daXuLy → daGiao)
  ↓
[Hủy đơn?]
    ├─ Có → nhập lý do → trả lại tồn kho → báo User
    │
    └─ Không → cập nhật soldQuantity → User nhận hàng
KẾT THÚC
```

### BFD-02: Luồng quản lý sản phẩm (Admin)

```
BẮT ĐẦU → Admin chọn "Quản lý sản phẩm"
  → [Thao tác?]
      ├─ Thêm: upload ảnh → nhập mã/tên/danh mục/giá nhập...
      │        → [Mã sản phẩm đã trùng?]
      │            ├─ Có → báo lỗi, yêu cầu nhập lại
      │            └─ Không → lưu sản phẩm mới (priceValue=0, quantity=0)
      ├─ Sửa: chọn SP → thay đổi thông tin → lưu
      ├─ Xóa: [Xác nhận?] Có → xóa SP khỏi danh sách
      └─ Ẩn/Hiện: toggle visibility
  → Dispatch productsUpdated → cập nhật bảng/báo lỗi
KẾT THÚC
```

### BFD-03: Luồng quản lý phiếu nhập hàng (Admin)

```
BẮT ĐẦU → Admin chọn "Quản lý phiếu nhập"
  → [Thao tác?]
      ├─ Tạo mới: chọn ngày nhập → gõ mã SP (autocomplete chọn) → nhập số lượng
      │         → tính thành tiền → [thêm dòng sản phẩm khác?] Có → lặp chọn SP
      │         → chọn trạng thái "Chưa hoàn thành" / "Hoàn thành" → lưu phiếu
      │         → [Trạng thái Hoàn thành?] Có → cộng tồn kho sản phẩm
      ├─ Sửa: chỉ phiếu "Chưa hoàn thành" → chỉnh sửa → lưu (giữ giá nhập gốc)
      └─ Xóa: [Xác nhận?] Có → xóa phiếu
  → Dispatch productsUpdated + phieuNhapLocal
KẾT THÚC
```

### BFD-04: Luồng đặt hàng & thanh toán (User)

```
BẮT ĐẦU → User chọn sản phẩm → kiểm tra giỏ hàng
  → Bấm "Thanh toán"
  → [Đã đăng nhập?]
      ├─ Không → redirect trang đăng nhập → đăng nhập → quay lại
      └─ Có → chọn địa chỉ giao hàng
  → Kiểm tra tồn kho → [Đủ?]
      ├─ Không → hiển thị lỗi, dừng
      └─ Có → chọn phương thức thanh toán
          ├─ COD → chốt đơn → trang thành công
          ├─ PayStore → chốt đơn → trang thành công
          └─ PayBank → hiển thị QR → [Xác nhận?]
              ├─ Thành công → trừ tồn kho → lưu đơn → trang thành công
              └─ Thất bại → xóa đơn tạm → trang thất bại
KẾT THÚC
```

### BFD-05: Luồng xử lý đơn hàng (Admin)

```
BẮT ĐẦU → Admin chọn "Quản lý đơn hàng"
  → Đồng bộ đơn từ User (DanhSachDatHang → ordersLocal)
  → Lọc / tìm đơn → xem chi tiết
  → [Thao tác?]
      ├─ Đổi trạng thái: moiDat → daXuLy → daGiao
      │     → cập nhật soldQuantity của sản phẩm
      └─ Hủy đơn: nhập lý do → trả lại tồn kho → đánh dấu "Đã hủy"
  → Dispatch orderStatusChanged → User thấy cập nhật trạng thái realtime
KẾT THÚC
```

### BFD-06: Luồng quản lý khách hàng (Admin)

```
BẮT ĐẦU → Admin chọn "Quản lý khách hàng"
  → Tìm kiếm khách hàng theo mã KH / tên / email / SĐT
  → [Thao tác?]
      ├─ Khóa/Mở khóa: đổi trạng thái trong userList → User không đăng nhập được
      └─ Xóa: [Xác nhận?] Có → xóa khách hàng
  → Cập nhật bảng khách hàng
KẾT THÚC
```