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
