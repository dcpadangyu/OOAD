# User BUG REPORT

## BUG-001 — Header/Footer bị copy giữa nhiều page
- **Mức độ:** Cao
- **File:** `pages/*.html`
- **Chức năng:** Layout dùng chung
- **Cách tái hiện:** Mở nhiều User page và kiểm tra source HTML.
- **Nguyên nhân:** Mỗi page nhúng trực tiếp nguyên khối `<header>` và `<footer>` dù đã có `components/header.html` và `components/footer.html`.
- **Cách sửa:** Thay toàn bộ markup lặp bằng placeholder `data-user-component="header/footer"`; `site-shell.js` mount component dùng nguồn `components/*.html`. Có thêm `tools/build-user-shell.js` để tái tạo runtime artifact.
- **Trạng thái:** Đã sửa.

## BUG-002 — Profile có thể dùng dữ liệu User không ổn định sau khi cập nhật email
- **Mức độ:** Cao
- **File:** `assets/js/user/account/personal-info.js`, `profile.js`
- **Chức năng:** Tài khoản / Profile
- **Cách tái hiện:** User A đăng nhập → đổi email → lưu → mở lại profile.
- **Nguyên nhân:** Code cũ cập nhật email trước rồi tìm bản ghi `userList` bằng email mới, nên có thể không tìm thấy bản ghi cũ.
- **Cách sửa:** Thêm `account-session.js` với identity ổn định `id`; `saveUser(updated, previousIdentity)` tìm bản ghi theo identity cũ trước khi ghi dữ liệu mới.
- **Trạng thái:** Đã sửa.

## BUG-003 — Lịch sử đơn hàng lọc theo username là không đủ chắc chắn
- **Mức độ:** Cao
- **File:** `assets/js/user/account/order-history.js`, `assets/js/user/payment/payment.js`
- **Chức năng:** Lịch sử mua hàng
- **Cách tái hiện:** Có nhiều User hoặc thay đổi thông tin định danh; kiểm tra lịch sử.
- **Nguyên nhân:** Order mới chưa có khóa User ổn định và history ưu tiên username.
- **Cách sửa:** Order lưu `userId`; history ưu tiên `userId`, sau đó tương thích dữ liệu cũ bằng email/username.
- **Trạng thái:** Đã sửa.

## BUG-004 — `CurrDanhSachDatHang` lưu toàn bộ danh sách thay vì đơn hiện tại
- **Mức độ:** Cao
- **File:** `assets/js/user/payment/payment.js`
- **Chức năng:** Thanh toán chuyển khoản
- **Cách tái hiện:** Có nhiều đơn trước đó → tạo đơn PayBank → kiểm tra `CurrDanhSachDatHang`.
- **Nguyên nhân:** Code cũ ghi toàn bộ `danhsach` vào key tạm.
- **Cách sửa:** Chỉ lưu `[neworder]` cho giao dịch hiện tại.
- **Trạng thái:** Đã sửa.

## BUG-005 — Component được dùng sai thời điểm làm page JS không thấy Header/Footer
- **Mức độ:** Cao
- **File:** `site-shell.js`, các `pages/*.html`
- **Chức năng:** Navigation, cart, search, category
- **Cách tái hiện:** Component mount sau khi `DOMContentLoaded` khiến các handler page chạy trước lúc Header tồn tại.
- **Nguyên nhân:** Loader cũ chờ `DOMContentLoaded` trong khi page scripts cũng đăng ký `DOMContentLoaded`.
- **Cách sửa:** Loader được gọi ngay cuối body, mount synchronously; các infrastructure script được đưa lên đầu block script cuối body.
- **Trạng thái:** Đã sửa.

## BUG-006 — Logout / Back-Forward có thể giữ UI tài khoản cũ
- **Mức độ:** Trung bình
- **File:** `site-header.js`, `profile.js`
- **Chức năng:** Login/Logout/Back-Forward
- **Nguyên nhân:** UI không chủ động refresh khi browser khôi phục trang từ bfcache hoặc storage thay đổi.
- **Cách sửa:** Thêm listener `pageshow` và `storage`.
- **Trạng thái:** Đã sửa.

## BUG-007 — CSS Header/Footer có nhiều lớp trùng và `!important` ép layout
- **Mức độ:** Trung bình
- **File:** `assets/css/user/common.css`, `header.css`, `footer.css`, `fix.css`
- **Nguyên nhân:** `common.css` chứa bản sao từ `header.css`, `footer.css`, `fix.css`.
- **Cách sửa:** Bỏ phần legacy header/footer/fix ở đầu `common.css`; tạo design tokens + base/theme; loại `fix.css` khỏi các page.
- **Trạng thái:** Đã sửa.
