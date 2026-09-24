# Shoe Store

Website bán giày và phụ kiện với hai khu vực:

- **User**: xem sản phẩm, tìm kiếm, giỏ hàng, thanh toán, quản lý tài khoản và lịch sử mua hàng.
- **Admin**: dashboard và các màn hình quản lý khách hàng, sản phẩm, đơn hàng, nhập hàng, tồn kho, giá bán và doanh thu.

Ứng dụng User là frontend HTML/CSS/JavaScript thuần. Backend Node.js đi kèm chỉ phục vụ việc gửi và xác thực OTP qua email; dữ liệu tài khoản, giỏ hàng và đơn hàng của bản demo hiện được lưu ở `localStorage`.

## Công nghệ

- HTML5, CSS3 và JavaScript ES6
- Node.js 18+ cho OTP backend
- Resend API để gửi email OTP
- `localStorage`/`sessionStorage` cho dữ liệu và phiên ở phía trình duyệt

## Cấu trúc dự án

```text
.
├── index.html                 # Entry point của khu vực User
├── pages/                     # Các trang User
├── components/                # Header/Footer nguồn
├── assets/
│   ├── css/user/              # Stylesheet User
│   ├── js/user/               # Logic User theo module
│   ├── images/                # Hình ảnh sản phẩm và thương hiệu
│   └── filemp4/               # Video banner
├── database/                  # Dữ liệu sản phẩm mẫu
├── Admin/                     # Giao diện quản trị
├── server/                    # Backend OTP
├── tools/                     # Script build component dùng chung
└── docs/                      # Tài liệu kỹ thuật và báo cáo
```

## Chạy giao diện User

Có thể mở trực tiếp `index.html`; trang sẽ chuyển tới `pages/home.html`.

Để tránh giới hạn khi trình duyệt tải module hoặc tài nguyên cục bộ, nên chạy một static server tại thư mục gốc:

```powershell
cd C:\Users\Admin\Downloads\WEB_OODA\OOAD
py -m http.server 5500
```

Sau đó mở <http://localhost:5500/>.

## Chạy backend OTP

Backend OTP là một server Node.js nhỏ dùng để gửi mã xác thực qua Resend. Cần chạy backend riêng khi sử dụng đăng ký, quên mật khẩu hoặc đổi mật khẩu bằng OTP.

### Bước 1: Cài Node.js

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

### Bước 2: Chuẩn bị tài khoản gửi email

Backend sử dụng [Resend](https://resend.com/) để gửi OTP. Cần:

1. Tạo tài khoản Resend và đăng nhập.
2. Tạo một API key trong mục **API Keys**.
3. Chuẩn bị địa chỉ gửi trong mục **Domains** hoặc dùng địa chỉ thử nghiệm Resend nếu tài khoản cho phép.
4. Ghi lại API key. Đây là thông tin bí mật và chỉ được đặt trong file `.env` của backend.

### Bước 3: Tạo file cấu hình backend

Mở PowerShell và chuyển tới thư mục backend:

```powershell
cd C:\Users\Admin\Downloads\WEB_OODA\OOAD\server
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

### Bước 4: Cài đặt và khởi động backend

Trong thư mục `server`, cài các package (dự án hiện không có dependency bên ngoài nhưng có thể chạy lệnh này an toàn):

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

### Bước 5: Chạy frontend ở terminal khác

Mở **một cửa sổ PowerShell mới**, giữ backend đang chạy ở cửa sổ trước, rồi chạy static server từ thư mục gốc:

```powershell
cd C:\Users\Admin\Downloads\WEB_OODA\OOAD
py -m http.server 5500
```

Mở <http://localhost:5500/> trên trình duyệt. Frontend sẽ gọi backend tại `http://localhost:3000/api`.

Nếu máy không có lệnh `py`, có thể dùng một static server khác hoặc mở trực tiếp `index.html`; tuy nhiên chạy static server được khuyến nghị để tránh giới hạn trình duyệt khi tải tài nguyên cục bộ.

### Bước 6: Kiểm tra backend

Có thể kiểm tra server đã khởi động bằng cách gửi request OTP trong PowerShell. Thay email bằng email thật có thể nhận thư:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/otp/request `
  -ContentType "application/json" `
  -Body '{"email":"your-email@gmail.com","purpose":"register"}'
```

Nếu cấu hình đúng, Resend sẽ gửi email OTP và terminal trả về kết quả thành công. Nếu có lỗi, kiểm tra lại `RESEND_API_KEY`, `EMAIL_FROM`, kết nối mạng và trạng thái xác minh email/domain trên Resend.

## Chức năng OTP

OTP được sử dụng cho:

1. Đăng ký tài khoản.
2. Quên mật khẩu.
3. Đổi mật khẩu bằng email.

OTP có 6 chữ số, mặc định hết hạn sau 5 phút và tối đa 5 lần nhập sai. Backend chỉ lưu hash OTP trong bộ nhớ; khởi động lại server sẽ xóa các OTP đang chờ. Backend hiện chưa có database hoặc rate limit theo IP/email.

## Truy cập khu vực Admin

Mở `Admin/DangNhap_Admin.html` để vào màn hình đăng nhập quản trị. Sau khi đăng nhập, các chức năng được điều hướng từ `Admin/TrangChu_Admin.html`.

Khu vực Admin là frontend demo, sử dụng dữ liệu lưu trong trình duyệt và không thay thế cho hệ thống phân quyền backend khi triển khai production.

## Tạo lại shell User

`components/header.html` và `components/footer.html` là nguồn dùng chung. Sau khi chỉnh sửa hai file này, chạy từ thư mục gốc:

```powershell
node tools/build-user-shell.js
```

Lệnh trên cập nhật phần shell được dùng bởi các trang User.

## Xử lý lỗi thường gặp

| Hiện tượng | Cách kiểm tra |
|---|---|
| Không mở được giao diện | Chạy static server và mở đúng URL `localhost:5500` |
| Frontend không gọi được OTP | Kiểm tra backend đang chạy ở port `3000` |
| Không gửi được email | Kiểm tra `RESEND_API_KEY`, `EMAIL_FROM` và cấu hình Resend |
| OTP hết hạn hoặc sai | Gửi lại mã mới và chỉ sử dụng mã gần nhất |
| Báo thiếu cấu hình email | Tạo `server/.env` từ `.env.example` và điền đủ biến |

## Tài liệu liên quan

- [`server/README.md`](server/README.md): cấu hình và API OTP.
- [`docs/STRUCTURE.md`](docs/STRUCTURE.md): cấu trúc chi tiết khu vực User.
- [`docs/BUG_REPORT.md`](docs/BUG_REPORT.md): các lỗi đã ghi nhận và xử lý.
- [`docs/CLEANUP_REPORT.md`](docs/CLEANUP_REPORT.md): báo cáo cleanup mã nguồn.
- [`Admin/README.md`](Admin/README.md): tổng quan khu vực Admin.
