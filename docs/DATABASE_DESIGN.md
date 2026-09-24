# Đặc tả dữ liệu và ràng buộc cơ sở dữ liệu

Tài liệu này mô tả mô hình dữ liệu đề xuất cho Shoe Store khi chuyển từ `localStorage` sang cơ sở dữ liệu quan hệ như MySQL hoặc PostgreSQL.

## 1. Hiện trạng dữ liệu

Phiên bản hiện tại đang lưu dữ liệu ở trình duyệt:

| Key hiện tại | Nội dung | Bảng đề xuất |
|---|---|---|
| `userList` | Danh sách tài khoản User | `users` |
| `currentUser` | Phiên đăng nhập hiện tại | `user_sessions` hoặc JWT/session server |
| `productsLocal` | Sản phẩm và tồn kho | `products`, `inventory_transactions` |
| `employeeList` | Nhân viên Admin | `employees` |
| `DanhSachDatHang` | Đơn hàng phía User | `orders`, `order_items`, `addresses` |
| `ordersLocal` | Bản sao đơn hàng phía Admin | Không cần bảng riêng; dùng `orders` |
| `cart` | Giỏ hàng hiện tại | `carts`, `cart_items` |
| `categories` | Danh mục sản phẩm | `categories` |

`localStorage` phù hợp cho bản demo nhưng không bảo đảm đồng bộ, phân quyền, toàn vẹn dữ liệu hoặc giao dịch khi có nhiều người dùng. Khi triển khai thật, thông tin mật khẩu, đơn hàng và tồn kho phải được lưu và kiểm tra ở backend.

## 2. Quy ước chung

- Khóa chính dùng `BIGINT` tự tăng hoặc `UUID`; tài liệu dùng `BIGINT` để dễ triển khai với MySQL.
- Thời gian lưu bằng `TIMESTAMP`/`DATETIME`, thống nhất UTC ở backend.
- Tiền lưu bằng `DECIMAL(15,2)`, không lưu chuỗi đã định dạng như `1.290.000₫`.
- Số lượng dùng số nguyên không âm.
- Mã nghiệp vụ như `SH-001`, `DH...`, `NV001` có thể dùng làm mã hiển thị nhưng không thay thế khóa chính.
- Mật khẩu phải lưu bằng hash mạnh như Argon2id hoặc bcrypt, tuyệt đối không lưu plaintext.
- Bản ghi quan trọng nên dùng `deleted_at` hoặc trạng thái thay vì xóa cứng.

## 3. Mô hình quan hệ

```text
users 1 ─── N user_addresses
users 1 ─── N orders
users 1 ─── 1 carts
users 1 ─── N user_sessions

categories 1 ─── N products
brands 1 ─── N products
products 1 ─── N product_variants
products 1 ─── N inventory_transactions

carts 1 ─── N cart_items
product_variants 1 ─── N cart_items

orders 1 ─── N order_items
product_variants 1 ─── N order_items
orders 1 ─── N payments
orders N ─── 1 user_addresses (snapshot địa chỉ giao hàng)

employees N ─── 1 roles
```

## 4. Các bảng và thuộc tính

### 4.1. `users` — tài khoản khách hàng

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT | Mã nội bộ |
| `customer_code` | VARCHAR(20) | UNIQUE, NOT NULL | Mã khách hàng, ví dụ `KH001` |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Tên đăng nhập |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email đã chuẩn hóa chữ thường |
| `password_hash` | VARCHAR(255) | NOT NULL | Hash mật khẩu |
| `full_name` | VARCHAR(120) | NOT NULL | Họ tên |
| `phone` | VARCHAR(20) | NOT NULL | Số điện thoại |
| `avatar_url` | VARCHAR(500) | NULL | Đường dẫn ảnh đại diện |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `active` | `active`, `blocked`, `pending` |
| `created_at` | TIMESTAMP | NOT NULL | Ngày tạo |
| `updated_at` | TIMESTAMP | NOT NULL | Lần cập nhật cuối |
| `deleted_at` | TIMESTAMP | NULL | Xóa mềm |

Ràng buộc:

- `email` không phân biệt hoa thường; nên dùng collation phù hợp hoặc index trên giá trị đã lower-case.
- `username` dài 3–50 ký tự, không chứa khoảng trắng đầu/cuối.
- `phone` chỉ chứa chữ số và có thể bắt đầu bằng `+84`.
- `status = blocked` không cho đăng nhập hoặc đặt hàng.
- Không lưu cột `isLoggedIn`; trạng thái đăng nhập thuộc session.

### 4.2. `user_addresses` — sổ địa chỉ

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã địa chỉ |
| `user_id` | BIGINT | FK `users.id`, NOT NULL | Chủ địa chỉ |
| `recipient_name` | VARCHAR(120) | NOT NULL | Người nhận |
| `recipient_phone` | VARCHAR(20) | NOT NULL | Số điện thoại nhận |
| `recipient_email` | VARCHAR(255) | NULL | Email nhận |
| `address_line` | VARCHAR(255) | NOT NULL | Địa chỉ chi tiết |
| `ward` | VARCHAR(100) | NULL | Phường/xã |
| `district` | VARCHAR(100) | NULL | Quận/huyện |
| `province` | VARCHAR(100) | NOT NULL | Tỉnh/thành |
| `is_default` | BOOLEAN | NOT NULL, DEFAULT FALSE | Địa chỉ mặc định |
| `created_at` | TIMESTAMP | NOT NULL | Ngày tạo |
| `updated_at` | TIMESTAMP | NOT NULL | Lần cập nhật cuối |

Ràng buộc:

- Mỗi User có tối đa một địa chỉ mặc định.
- Không được xóa địa chỉ đang được dùng làm địa chỉ mặc định nếu chưa chọn địa chỉ khác.
- Khi tạo đơn, phải sao chép thông tin địa chỉ vào `orders` hoặc `order_addresses` để lịch sử không thay đổi khi User sửa địa chỉ.

### 4.3. `categories` và `brands`

`categories`:

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | BIGINT | PK |
| `code` | VARCHAR(30) | UNIQUE, NOT NULL |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `active` |
| `created_at` | TIMESTAMP | NOT NULL |

`brands`:

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | BIGINT | PK |
| `code` | VARCHAR(30) | UNIQUE, NOT NULL |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL |
| `logo_url` | VARCHAR(500) | NULL |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `active` |

Không nên lưu tên thương hiệu lặp lại trực tiếp trong mỗi sản phẩm. Sản phẩm phải tham chiếu `brand_id` và `category_id`.

### 4.4. `products` — thông tin sản phẩm

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK | Mã nội bộ |
| `product_code` | VARCHAR(30) | UNIQUE, NOT NULL | Ví dụ `SH-001` |
| `brand_id` | BIGINT | FK, NOT NULL | Thương hiệu |
| `category_id` | BIGINT | FK, NOT NULL | Danh mục |
| `name` | VARCHAR(200) | NOT NULL | Tên sản phẩm |
| `description` | TEXT | NULL | Mô tả |
| `gender` | VARCHAR(20) | NOT NULL | `Nam`, `Nữ`, `Unisex` |
| `material` | VARCHAR(100) | NULL | Chất liệu |
| `style` | VARCHAR(50) | NULL | Phong cách |
| `origin` | VARCHAR(100) | NULL | Xuất xứ |
| `visibility` | VARCHAR(20) | NOT NULL, DEFAULT `visible` | `visible`, `hidden` |
| `created_at` | TIMESTAMP | NOT NULL |
| `updated_at` | TIMESTAMP | NOT NULL |

### 4.5. `product_variants` — biến thể size/màu

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK |
| `product_id` | BIGINT | FK `products.id`, NOT NULL |
| `sku` | VARCHAR(50) | UNIQUE, NOT NULL |
| `size` | VARCHAR(20) | NOT NULL | Ví dụ `36`, `37`, `38` |
| `color` | VARCHAR(50) | NOT NULL |
| `image_url` | VARCHAR(500) | NULL |
| `import_price` | DECIMAL(15,2) | NOT NULL |
| `selling_price` | DECIMAL(15,2) | NOT NULL |
| `quantity` | INT | NOT NULL, DEFAULT 0 |
| `sold_quantity` | INT | NOT NULL, DEFAULT 0 |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `active` |

Ràng buộc:

- `UNIQUE(product_id, size, color)`.
- `import_price >= 0`, `selling_price >= 0`, `quantity >= 0`, `sold_quantity >= 0`.
- Không dùng chuỗi `size = "36 - 44"` trong CSDL; mỗi size là một biến thể riêng.
- Khi đặt hàng phải khóa tồn kho trong transaction để tránh bán vượt số lượng.

### 4.6. `carts` và `cart_items`

`carts` gồm `id` PK, `user_id` FK UNIQUE, `status` (`active`, `converted`, `abandoned`), `created_at`, `updated_at`.

`cart_items` gồm:

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | BIGINT | PK |
| `cart_id` | BIGINT | FK, NOT NULL |
| `variant_id` | BIGINT | FK, NOT NULL |
| `quantity` | INT | NOT NULL |

- `UNIQUE(cart_id, variant_id)`.
- `quantity >= 1`.
- Giá trong giỏ chỉ để hiển thị; giá chính thức phải lấy lại từ sản phẩm khi tạo đơn.

### 4.7. `orders` — đơn hàng

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGINT | PK |
| `order_code` | VARCHAR(30) | UNIQUE, NOT NULL | Ví dụ `DH...` |
| `user_id` | BIGINT | FK, NOT NULL |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT `cho-xac-nhan` | Trạng thái xử lý |
| `payment_method` | VARCHAR(20) | NOT NULL | `COD`, `PayBank`, `Shop` |
| `payment_status` | VARCHAR(20) | NOT NULL, DEFAULT `pending` | `pending`, `paid`, `failed`, `refunded` |
| `subtotal` | DECIMAL(15,2) | NOT NULL |
| `shipping_fee` | DECIMAL(15,2) | NOT NULL, DEFAULT 0 |
| `total_price` | DECIMAL(15,2) | NOT NULL |
| `recipient_name` | VARCHAR(120) | NOT NULL |
| `recipient_phone` | VARCHAR(20) | NOT NULL |
| `recipient_email` | VARCHAR(255) | NULL |
| `shipping_address` | TEXT | NOT NULL |
| `note` | VARCHAR(500) | NULL |
| `order_date` | TIMESTAMP | NOT NULL |
| `confirmed_at` | TIMESTAMP | NULL |
| `delivered_at` | TIMESTAMP | NULL |
| `cancelled_at` | TIMESTAMP | NULL |

Trạng thái hợp lệ: `cho-xac-nhan` → `da-xu-ly` → `dang-giao` → `da-giao`; có thể chuyển sang `da-huy` theo quy tắc nghiệp vụ. Không cho chuyển ngược đơn đã giao sang đơn mới.

Ràng buộc:

- `subtotal = SUM(order_items.quantity * order_items.unit_price)`.
- `total_price = subtotal + shipping_fee - discount_amount` nếu có khuyến mãi.
- Không cho tạo đơn không có sản phẩm.
- Đơn đã `da-giao` không được xóa cứng.

### 4.8. `order_items` — chi tiết đơn hàng

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | BIGINT | PK |
| `order_id` | BIGINT | FK, NOT NULL |
| `variant_id` | BIGINT | FK, NOT NULL |
| `product_name` | VARCHAR(200) | NOT NULL | Snapshot tại thời điểm mua |
| `sku` | VARCHAR(50) | NOT NULL | Snapshot |
| `size` | VARCHAR(20) | NOT NULL | Snapshot |
| `color` | VARCHAR(50) | NOT NULL | Snapshot |
| `unit_price` | DECIMAL(15,2) | NOT NULL |
| `quantity` | INT | NOT NULL |
| `line_total` | DECIMAL(15,2) | NOT NULL |

- `quantity >= 1`, `unit_price >= 0`, `line_total >= 0`.
- Lưu snapshot tên/giá/size/màu để lịch sử không đổi khi sản phẩm được cập nhật.
- `UNIQUE(order_id, variant_id)` nếu không cho phép cùng một biến thể xuất hiện hai dòng.

### 4.9. `payments` — thanh toán

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | BIGINT | PK |
| `order_id` | BIGINT | FK, NOT NULL |
| `method` | VARCHAR(20) | NOT NULL |
| `amount` | DECIMAL(15,2) | NOT NULL |
| `transaction_code` | VARCHAR(100) | UNIQUE, NULL |
| `status` | VARCHAR(20) | NOT NULL |
| `paid_at` | TIMESTAMP | NULL |
| `created_at` | TIMESTAMP | NOT NULL |

Một đơn có thể có nhiều lần thử thanh toán, nhưng chỉ tối đa một giao dịch thành công. Không đánh dấu `paid` chỉ dựa vào dữ liệu từ trình duyệt; phải xác nhận từ backend/cổng thanh toán.

### 4.10. `employees` và `roles`

`employees` gồm `id` PK, `employee_code` UNIQUE (`NV001`), `full_name`, `gender`, `phone`, `address`, `role_id` FK, `username` UNIQUE, `password_hash`, `status`, `created_at`, `updated_at`.

`roles` gồm `id` PK, `code` UNIQUE, `name` UNIQUE. Các chức vụ hiện có: nhân viên bán hàng, nhân viên kho, nhân viên CSKH và nhân viên kiểm kho.

- Username nhân viên là duy nhất.
- Nhân viên bị khóa không được đăng nhập.
- Phân quyền phải kiểm tra ở backend, không chỉ ẩn menu bằng JavaScript.

### 4.11. `inventory_transactions` — lịch sử kho

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | BIGINT | PK |
| `variant_id` | BIGINT | FK, NOT NULL |
| `type` | VARCHAR(20) | NOT NULL | `import`, `sale`, `return`, `adjustment` |
| `quantity_change` | INT | NOT NULL, khác 0 |
| `reference_type` | VARCHAR(30) | NULL | `order`, `receipt`, `manual` |
| `reference_id` | BIGINT | NULL |
| `created_by` | BIGINT | FK `employees.id`, NULL |
| `note` | VARCHAR(500) | NULL |
| `created_at` | TIMESTAMP | NOT NULL |

Mọi thay đổi tồn kho phải có bản ghi lịch sử. Khi bán hàng, trừ tồn kho và tạo `order_items` trong cùng một transaction.

## 5. Ràng buộc nghiệp vụ quan trọng

1. Email, username, mã sản phẩm, SKU, mã đơn và mã nhân viên không được trùng.
2. Không cho giá, phí vận chuyển, số lượng hoặc tổng tiền âm.
3. Không cho đặt số lượng lớn hơn tồn kho tại thời điểm xác nhận đơn.
4. Không cho User bị khóa tạo đơn hoặc đổi mật khẩu.
5. Không xóa sản phẩm đã xuất hiện trong đơn; chuyển sang `hidden` hoặc `inactive`.
6. Không sửa giá trong các dòng đơn cũ khi giá sản phẩm thay đổi.
7. Tạo đơn, trừ tồn và ghi lịch sử kho phải chạy trong một transaction.
8. API phải kiểm tra dữ liệu ở backend; validation HTML/JavaScript chỉ là lớp hỗ trợ.
9. API đăng ký phải hash mật khẩu và xác nhận OTP trước khi tạo User.
10. API quản trị phải kiểm tra role cho từng thao tác thêm, sửa, xóa và cập nhật trạng thái.

## 6. Chỉ mục đề xuất

- `users(email)`, `users(username)`, `users(status)`.
- `products(product_code)`, `products(brand_id, category_id, visibility)`.
- `product_variants(sku)`, `product_variants(product_id, size, color)`.
- `orders(order_code)`, `orders(user_id, order_date)`, `orders(status, order_date)`.
- `order_items(order_id)`.
- `inventory_transactions(variant_id, created_at)`.

## 7. Luồng tạo đơn chuẩn

1. Backend xác thực User và địa chỉ giao hàng.
2. Đọc giỏ hàng từ server, không tin giá/số lượng do frontend gửi.
3. Khóa các `product_variants` cần mua bằng `SELECT ... FOR UPDATE`.
4. Kiểm tra từng tồn kho.
5. Tính lại subtotal, phí vận chuyển và tổng tiền.
6. Tạo `orders` và `order_items` với snapshot sản phẩm.
7. Trừ tồn kho và ghi `inventory_transactions`.
8. Tạo bản ghi `payments` ở trạng thái phù hợp.
9. Commit transaction; nếu lỗi thì rollback toàn bộ.

## 8. Gợi ý DDL tối thiểu

Ví dụ dưới đây chỉ minh họa các ràng buộc cốt lõi; cần điều chỉnh cú pháp theo hệ quản trị CSDL sử dụng:

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  customer_code VARCHAR(20) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_code VARCHAR(30) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'cho-xac-nhan',
  payment_method VARCHAR(20) NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(15,2) NOT NULL CHECK (subtotal >= 0),
  shipping_fee DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  total_price DECIMAL(15,2) NOT NULL CHECK (total_price >= 0),
  order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 9. Kế hoạch chuyển đổi

1. Chốt danh mục và biến thể sản phẩm, tách size/màu khỏi chuỗi `size`.
2. Tạo bảng User và hash lại toàn bộ mật khẩu demo.
3. Nhập `productsLocal` vào `products` và `product_variants`.
4. Gộp `DanhSachDatHang` và `ordersLocal` thành một nguồn `orders`.
5. Chuyển các địa chỉ trong `info` thành `user_addresses` và snapshot giao hàng.
6. Thay các thao tác `localStorage` bằng API backend.
7. Thêm transaction cho đặt hàng và cập nhật kho.
8. Chỉ giữ `localStorage` cho token/session ngắn hạn hoặc cache giao diện, không dùng làm nguồn dữ liệu chính.
