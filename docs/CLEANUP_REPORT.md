# User Cleanup Report

## Đã hoàn tất

- Header/Footer không còn copy trong `pages/`.
- `components/header.html` và `components/footer.html` là nguồn markup duy nhất.
- Runtime component mount được sinh từ component source qua `tools/build-user-shell.js`.
- Shared User session nằm ở `assets/js/user/core/account-session.js`.
- CSS được bổ sung design tokens/base/final theme; legacy prefix trong `common.css` được dọn.
- Không xóa asset/page chỉ dựa trên tên; các file có thể liên quan được giữ lại nếu chưa chứng minh chắc chắn không dùng.

## Không thay đổi

`Admin/` được đối chiếu byte-for-byte với bản trong ZIP đầu vào và không có khác biệt.

## User cleanup audit — 2026-09-23

### Đã xóa

- `assets/js/user/core/display.js`: module legacy không được nạp bởi bất kỳ User page nào; phần lớn nội dung là code đã comment-out.
- `assets/js/user/core/router.js`: router hash cho kiến trúc page cũ, không có User page hoặc component nào nạp/gọi.
- `assets/js/user/product/detail.js`: module chi tiết sản phẩm cũ, không được nạp; hàm hiển thị chi tiết cũng không có implementation thực tế.
- `assets/css/user/fix.css`: stylesheet không còn được tham chiếu bởi User page nào.

### Đã đơn giản hóa

- `assets/js/user/product/products.js`: xóa `saveLocalProducts` và `formatProductPrice` vì không có consumer trong phạm vi User. Luồng hiển thị, lọc, tìm kiếm, popup và giỏ hàng không thay đổi.

### Đã giữ lại sau khi xác minh

- `database/products-shoes.js` và `database/phieuNhapHang.js`: không thuộc phạm vi User cleanup; các file này vẫn được khu vực Admin sử dụng.
- Các CSS legacy còn được nạp bởi page thanh toán/giỏ hàng: vẫn có reference trực tiếp và có thể chứa style cần cho layout hiện tại.
- Các asset hình ảnh/video chưa xóa chỉ dựa trên tên file; cần browser/runtime coverage hoặc xác minh riêng để kết luận an toàn.

### Phạm vi và kiểm tra

- Chỉ thay đổi file User và tài liệu cleanup; không đọc/sửa/xóa file dưới `Admin/`.
- Không có `package.json`, lockfile, environment config hoặc dependency manifest trong project; không có dependency nào được thay thế.
