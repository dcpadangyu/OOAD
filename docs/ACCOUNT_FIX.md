# Account Fix

## Mô hình dữ liệu sau khi sửa

`currentUser` là session User hiện tại. `userList` là danh sách tài khoản. `account-session.js` là lớp truy cập/chỉnh sửa dùng chung.

Các thuộc tính định danh quan trọng:

- `id`: khóa ổn định của User.
- `userName`, `email`, `phone`, `address`: dữ liệu hiển thị/cập nhật.
- `avatar`, `addresses`: dữ liệu phụ trợ.

## Luồng Login

`account-data.js` seed dữ liệu demo → `login.js` xác thực → `UserSession.setCurrentUser()` → `currentUser` được lưu → Header đọc `currentUser` → redirect `index.html` → `pages/home.html`.

## Luồng cập nhật Profile

`currentUser` trước khi sửa được giữ làm `previousIdentity` → tạo object cập nhật → `UserSession.saveUser(updated, previousIdentity)` → cập nhật đúng record cũ theo `id` → ghi lại `currentUser`.

Điều này tránh lỗi mất record khi User đổi email hoặc username.

## Logout

Xóa `currentUser` và `selectedAddress`; không xóa `userList`.

## Back/Forward

Header và Profile có `pageshow`; Header có thêm `storage` để đồng bộ UI khi session thay đổi giữa các tab.

## Đổi mật khẩu

Mật khẩu mới được ghi vào đúng account theo identity ổn định; sau đó session hiện tại được xóa và yêu cầu đăng nhập lại.
