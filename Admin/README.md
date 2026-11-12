# Hệ thống Admin - Website Bán Hàng

## Tổng quan
Hệ thống quản trị admin được thiết kế để quản lý toàn bộ website bán hàng với các chức năng đầy đủ và giao diện thân thiện.

## Tính năng chính

### 🔐 Hệ thống đăng nhập
- **Đăng nhập bảo mật**: Yêu cầu đăng nhập để truy cập các chức năng quản trị
- **Session management**: Tự động kiểm tra và quản lý phiên đăng nhập
- **Thông báo yêu cầu đăng nhập**: Hiển thị thông báo khi chưa đăng nhập

### 📊 Dashboard
- **Trang chủ admin**: Tổng quan về hệ thống với các thống kê chính
- **Thao tác nhanh**: Truy cập nhanh các chức năng quan trọng
- **Thống kê real-time**: Hiển thị số liệu khách hàng, sản phẩm, đơn hàng, doanh thu

### 👥 Quản lý khách hàng
- **Danh sách khách hàng**: Xem, tìm kiếm, lọc khách hàng
- **Reset mật khẩu**: Tạo mật khẩu mới cho khách hàng
- **Khóa/Mở khóa tài khoản**: Quản lý trạng thái tài khoản khách hàng
- **Xuất Excel**: Xuất danh sách khách hàng ra file Excel
- **Lưu trữ dữ liệu**: Sử dụng localStorage để lưu trữ thông tin

### 🛍️ Quản lý sản phẩm
- **Quản lý loại sản phẩm**: Thêm/sửa/xóa/ẩn loại sản phẩm
- **Quản lý sản phẩm**: Thêm/sửa/xóa sản phẩm với upload hình ảnh
- **Quản lý nhập hàng**: Theo dõi và quản lý việc nhập hàng
- **Quản lý tồn kho**: Kiểm soát số lượng tồn kho
- **Quản lý giá bán**: Điều chỉnh giá bán sản phẩm

### 📦 Quản lý đơn hàng
- **Danh sách đơn hàng**: Xem và quản lý tất cả đơn hàng
- **Chi tiết đơn hàng**: Xem thông tin chi tiết từng đơn hàng
- **Trạng thái đơn hàng**: Cập nhật trạng thái xử lý đơn hàng

### 📈 Báo cáo doanh thu
- **Báo cáo tổng quan**: Thống kê doanh thu theo thời gian
- **Biểu đồ trực quan**: Hiển thị dữ liệu dưới dạng biểu đồ
- **Xuất báo cáo**: Tải báo cáo dưới định dạng PDF/Excel

## Cấu trúc thư mục

```
Admin/
├── assets/
│   ├── css/
│   │   ├── admin.css          # CSS chính cho admin
│   │   └── DangNhap_Admin.css # CSS cho trang đăng nhập
│   └── js/
│       ├── admin-session.js   # Quản lý session
│       ├── admin.js          # JavaScript chính
│       ├── DangNhap_Admin.js # JavaScript đăng nhập
│       ├── quanlynguoidung.js # Quản lý khách hàng
│       └── quanlyloaisanpham.js # Quản lý loại sản phẩm
├── includes/                 # Các file include
├── TrangChu_Admin.html       # Trang chủ admin
├── DangNhap_Admin.html       # Trang đăng nhập
├── QuanLyKhachHang.html      # Quản lý khách hàng
├── QuanLyLoaiSanPham.html    # Quản lý loại sản phẩm
├── QuanLySanPham.html        # Quản lý sản phẩm
└── README.md                 # File hướng dẫn này
```

## Hướng dẫn sử dụng

### 1. Truy cập hệ thống
1. Mở file `DangNhap_Admin.html` trong trình duyệt
2. Nhập thông tin đăng nhập:
   - **Tên đăng nhập**: `admin01`, `admin02`, hoặc `admin03`
   - **Mật khẩu**: `admin123`, `admin456`, hoặc `admin789`
3. Nhấn "Đăng nhập"

### 2. Điều hướng
- **Trang chủ**: `TrangChu_Admin.html` - Dashboard tổng quan
- **Quản lý khách hàng**: `QuanLyKhachHang.html`
- **Quản lý loại sản phẩm**: `QuanLyLoaiSanPham.html`
- **Quản lý sản phẩm**: `QuanLySanPham.html`
- **Các trang khác**: Truy cập qua sidebar menu

### 3. Tính năng bảo mật
- **Kiểm tra session**: Tự động kiểm tra đăng nhập khi truy cập các trang admin
- **Thông báo yêu cầu đăng nhập**: Hiển thị khi chưa đăng nhập
- **Tự động đăng xuất**: Session hết hạn sau 24 giờ

## Công nghệ sử dụng

- **HTML5**: Cấu trúc trang web
- **CSS3**: Styling và responsive design
- **JavaScript ES6**: Logic và tương tác
- **Session Storage**: Quản lý phiên đăng nhập
- **SVG Icons**: Biểu tượng vector

## Tính năng responsive

- **Mobile-first**: Thiết kế ưu tiên mobile
- **Sidebar collapse**: Sidebar tự động thu gọn trên mobile
- **Grid responsive**: Layout tự động điều chỉnh theo kích thước màn hình
- **Touch-friendly**: Tối ưu cho thiết bị cảm ứng

## Phát triển thêm

### Thêm trang admin mới
1. Tạo file HTML mới trong thư mục `Admin/`
2. Include các file CSS và JS cần thiết:
   ```html
   <link rel="stylesheet" href="assets/css/admin.css">
   <script src="assets/js/admin-session.js"></script>
   <script src="assets/js/admin.js"></script>
   ```
3. Sử dụng cấu trúc sidebar và header có sẵn

### Thêm chức năng JavaScript
1. Tạo file JS mới trong `assets/js/`
2. Sử dụng các utility functions có sẵn:
   ```javascript
   AdminDashboard.showNotification('Thông báo', 'success');
   AdminDashboard.showLoading('#element');
   AdminDashboard.hideLoading('#element');
   ```

## Lưu ý quan trọng

- **Session timeout**: Phiên đăng nhập tự động hết hạn sau 24 giờ
- **Browser compatibility**: Hỗ trợ các trình duyệt hiện đại
- **Security**: Chỉ là demo, cần implement backend thực tế cho production
- **Data persistence**: Dữ liệu hiện tại chỉ lưu trong session storage


## Cấu trúc file giao diện trang quản trị

`TrangChu_Admin.html` chỉ là khung ngắn (head, các thẻ script và 4 chỗ giữ chỗ `<div data-admin-component="...">`). Giao diện thật nằm trong các file HTML riêng, do `assets/js/admin-shell.js` (file **sinh ra**) dựng vào trang trước khi các script khác chạy:

```
Admin/
├── TrangChu_Admin.html            # khung ngắn (~75 dòng)
├── components/                    # các khối khung
│   ├── header.html                # thanh trên cùng
│   ├── sidebar.html               # menu bên trái
│   └── modals.html                # hộp thoại hồ sơ Admin / nhân viên
├── sections/                      # mỗi mục một file (thẻ <section id="page-...">)
│   ├── dashboard.html             # Tổng quan
│   ├── customers.html             # Quản lý khách hàng
│   ├── categories.html            # Loại sản phẩm
│   ├── products.html              # Sản phẩm
│   ├── import.html                # Nhập hàng
│   ├── inventory.html             # Tồn kho
│   ├── prices.html                # Giá bán
│   ├── orders.html                # Đơn hàng
│   ├── reviews.html               # Đánh giá
│   ├── support.html               # Hỗ trợ khách hàng
│   ├── reports.html               # Báo cáo
│   ├── employees.html             # Nhân viên
│   └── order-detail.html, orders-list.html, customers-list.html   # trang mẫu
└── assets/js/admin-shell.js       # FILE SINH RA từ components + sections
```

Sau khi sửa bất kỳ file nào trong `components/` hoặc `sections/`, chạy ở thư mục gốc dự án:

```
node tools/build-admin.js
```

Thêm mục mới: tạo `sections/<tên>.html` (thẻ `<section id="page-<tên>" class="spa-page">`), thêm `<tên>` vào mảng `SECTIONS` trong `tools/build-admin.js`, rồi chạy lại lệnh build. Không sửa tay `assets/js/admin-shell.js`.

Lưu ý: vì giao diện được dựng bằng JavaScript nên `TrangChu_Admin.html` không hiển thị gì nếu tắt JavaScript (các trang quản trị vốn đã cần JavaScript để chạy).
