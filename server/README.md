# User OTP backend

Backend này chỉ phục vụ các chức năng OTP của User và không liên quan đến thư mục `Admin/`.

## Yêu cầu

- Node.js 18 trở lên.
- Tài khoản Resend.
- Resend API key.
- Email hoặc domain gửi đã được Resend xác minh/cho phép.

## Cài đặt và cấu hình

Tại thư mục project:

```powershell
cd C:\Users\Admin\Downloads\WEB_OODA\OODA\server
Copy-Item .env.example .env
notepad .env
```

Ví dụ `server/.env`:

```env
PORT=3000
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=Shoe Store <onboarding@resend.dev>
OTP_TTL_SECONDS=300
OTP_MAX_ATTEMPTS=5
```

Giải thích:

- `PORT`: port backend, mặc định `3000`.
- `RESEND_API_KEY`: API key bí mật của Resend.
- `EMAIL_FROM`: người gửi email, phải được Resend chấp nhận.
- `OTP_TTL_SECONDS`: thời gian sống OTP, mặc định 300 giây.
- `OTP_MAX_ATTEMPTS`: số lần nhập sai tối đa, mặc định 5.

Không commit `.env`, không đưa API key vào `assets/js/user/`.

## Khởi động

```powershell
cd C:\Users\Admin\Downloads\WEB_OODA\OODA\server
npm start
```

Kết quả mong đợi:

```text
User OTP server listening on http://localhost:3000
```

Giữ terminal chạy backend mở khi thao tác đăng ký, quên mật khẩu hoặc đổi mật khẩu. Frontend gọi mặc định:

```text
http://localhost:3000/api
```

## Cách thao tác trên User

### Đăng ký

1. Mở `pages/register.html`.
2. Điền đủ thông tin và Gmail.
3. Bấm **GỬI MÃ OTP**.
4. Nhập mã 6 chữ số trong Gmail.
5. Bấm **ĐĂNG KÝ**.

### Quên mật khẩu

1. Mở `pages/login.html`.
2. Bấm **Quên mật khẩu?**.
3. Nhập Gmail đã đăng ký và bấm **GỬI MÃ OTP**.
4. Nhập OTP, mật khẩu mới và xác nhận.
5. Bấm **ĐỔI MẬT KHẨU**.

### Đổi mật khẩu

1. Đăng nhập và mở **Tài khoản → Đổi mật khẩu**.
2. Nhập mật khẩu cũ, hoặc bấm **GỬI OTP QUA GMAIL**.
3. Nhập mật khẩu mới và xác nhận.
4. Bấm **Đổi mật khẩu**.

## API

### Gửi OTP

```http
POST http://localhost:3000/api/otp/request
Content-Type: application/json

{
  "email": "user@gmail.com",
  "purpose": "register"
}
```

`purpose` hợp lệ:

- `register`
- `forgot-password`
- `change-password`

### Xác thực OTP

```http
POST http://localhost:3000/api/otp/verify
Content-Type: application/json

{
  "email": "user@gmail.com",
  "purpose": "register",
  "code": "123456"
}
```

## Bảo mật và giới hạn hiện tại

- OTP không lưu plaintext; backend chỉ lưu hash trong bộ nhớ.
- OTP hết hạn và bị giới hạn số lần thử.
- Restart backend sẽ xóa các OTP đang chờ.
- Backend hiện chưa có database và rate limit theo IP/email.
- User data hiện vẫn được lưu ở `localStorage` do kiến trúc hiện tại.

## Lỗi thường gặp

- `Email service is not configured`: chưa tạo hoặc chưa điền `server/.env`.
- Không nhận email: kiểm tra Resend API key, `EMAIL_FROM`, spam folder và domain verification.
- `Mã OTP đã hết hạn`: gửi lại OTP và dùng mã mới nhất.
- Frontend không kết nối được: kiểm tra backend có đang chạy đúng port `3000`.
