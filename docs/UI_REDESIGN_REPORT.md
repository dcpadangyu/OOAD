# UI Redesign Report — User

## Mục tiêu
Nâng cấp giao diện User theo hướng modern e-commerce / premium minimal, tách biệt rõ với giao diện Web 1 cũ nhưng giữ nguyên cấu trúc chức năng và business logic hiện tại.

## Các thay đổi

### Design system
- Đổi palette sang nền sáng trung tính + xanh cobalt làm màu hành động chính.
- Chuẩn hóa radius, shadow, border, spacing và typography bằng CSS variables.
- Giảm gradient, viền dày và hiệu ứng scale cũ.

### Header
- Giữ component `components/header.html`.
- Làm Header sáng, gọn, có blur/shadow nhẹ.
- Search box, menu, category và account dropdown được làm đồng nhất.
- Không để page CSS điều khiển layout Header.

### Footer
- Giữ component `components/footer.html`.
- Chuyển sang grid 4 cột trên desktop, 2 cột tablet, 1 cột mobile.
- Dùng `body` flex-column + `footer { margin-top:auto; }` để Footer không bị dạt lên/xuống khi nội dung ngắn.
- Không dùng hard-coded height hoặc position absolute để ép Footer.

### Home
- Brand strip thành các card nhẹ.
- Banner giảm chiều cao, overlay tối tối giản và căn trái nội dung.
- Khu vực sản phẩm chuyển sang layout sidebar + grid.
- Product card đồng đều, ảnh dùng aspect-ratio và object-fit contain.

### Product
- Card, pagination và popup được bo góc, giảm shadow và thống nhất hierarchy.
- Grid responsive: 3 cột desktop, 2 cột tablet/mobile lớn, 1 cột màn hình rất nhỏ.

### Cart
- Chuyển sang bố cục 2 cột: danh sách sản phẩm + summary.
- Summary sticky trên desktop.
- Button checkout dùng màu primary thống nhất.

### Checkout / Payment
- Giữ nguyên ID/class và radio/input đang được JavaScript sử dụng.
- Redesign thành các card payment option.
- Không thay đổi business logic.

### Account
- Sidebar + content card hiện đại hơn.
- Form input rộng và thống nhất.
- Address card và action button được chuẩn hóa.

### Authentication
- Login/Register thành card centered, nền trung tính, input/button đồng nhất với design system.

### Order history
- Card đơn hàng, trạng thái, nút xem thêm và pagination được đồng bộ visual.

## Phạm vi file thay đổi
- `assets/css/user/variables.css`
- `assets/css/user/modern.css` (mới)
- 15 file `pages/*.html` để nạp `modern.css`
- `docs/UI_REDESIGN_REPORT.md`

Không thay đổi JavaScript nghiệp vụ.

## Kiểm tra
- 15/15 User pages có link `modern.css`.
- Kiểm tra cân bằng `{}` cho CSS User.
- Kiểm tra syntax JavaScript User không phát hiện lỗi mới từ thay đổi giao diện.
- `Admin/` được giữ nguyên và đối chiếu checksum với ZIP đầu vào.

## Giới hạn môi trường
Chromium headless trong môi trường hiện tại bị policy chặn/timing out, vì vậy screenshot browser tự động không hoàn tất. Việc kiểm tra visual được thực hiện bằng static CSS/HTML review và kiểm tra cấu trúc; cần mở project thực tế bằng VS Code Live Server hoặc trình duyệt desktop để nghiệm thu pixel-level.
