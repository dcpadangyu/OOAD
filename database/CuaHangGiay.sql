CREATE DATABASE CuaHangGiay;
GO
USE CuaHangGiay;
GO

-- Tên cột = tên thuộc tính trong code (xem docs/DOI_TEN_THUOC_TINH.md, database/CSDL.md).
-- Giá trị trạng thái giữ nguyên như code (active/blocked, cho-xac-nhan, moiDat, hoanThanh...).

-- 1. LOAI_SAN_PHAM (mã loại = tên hãng, ví dụ Nike; key `categories`)
CREATE TABLE LOAI_SAN_PHAM (
  maLoai    VARCHAR(30)   PRIMARY KEY,
  tenLoai   NVARCHAR(100)  NOT NULL UNIQUE,
  moTa      NVARCHAR(255)  NULL,
  hinhAnh   VARCHAR(255)  NULL,
  trangThai VARCHAR(10)   NOT NULL DEFAULT 'active',
  ngayTao   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT rb_loai_trangThai CHECK (trangThai IN ('active','hidden'))
);

-- 2. SAN_PHAM (key `productsLocal`)
CREATE TABLE SAN_PHAM (
  maSanPham        VARCHAR(20)   PRIMARY KEY,
  maLoai           VARCHAR(30)   NOT NULL,
  tenSanPham       NVARCHAR(255)  NOT NULL,
  gioiTinh         NVARCHAR(10)   NOT NULL,
  moTaNgan         NVARCHAR(255)  NULL,                   -- mô tả ngắn
  mauSac           NVARCHAR(50)   NOT NULL,
  chatLieu         NVARCHAR(100)  NOT NULL,
  phongCach        NVARCHAR(100)  NOT NULL,
  kichCo           NVARCHAR(50)   NOT NULL,               -- chuỗi mô tả các size, ví dụ '40-44' hoặc '36, 37, 38.5'
  giaBan           DECIMAL(15,0) NOT NULL,               -- giá bán (số)
  giaHienThi       VARCHAR(30)   NOT NULL,               -- giá hiển thị (đã định dạng ₫)
  hinhAnh          VARCHAR(255)  NOT NULL,
  giaNhap          DECIMAL(15,0) NOT NULL,
  soLuongTon       INT           NOT NULL DEFAULT 0,     -- = tổng SAN_PHAM_SIZE.soLuongTon
  tongDaNhap       INT           NOT NULL DEFAULT 0,     -- tổng số lượng đã nhập (phiếu hoàn thành)
  tongDaBan        INT           NOT NULL DEFAULT 0,     -- tổng số lượng đã bán
  trangThaiHienThi NVARCHAR(10)   NOT NULL DEFAULT 'visible',
  moTa             TEXT          NULL,                   -- mô tả chi tiết
  xuatXu           NVARCHAR(100)  NULL,                   -- xuất xứ
  CONSTRAINT kn_sp_loai FOREIGN KEY (maLoai) REFERENCES LOAI_SAN_PHAM(maLoai),
  CONSTRAINT rb_sp_gioiTinh   CHECK (gioiTinh IN (N'Nam',N'Nữ')),
  CONSTRAINT rb_sp_giaBan     CHECK (giaBan > 0),
  CONSTRAINT rb_sp_giaNhap    CHECK (giaNhap > 0),
  CONSTRAINT rb_sp_soLuongTon CHECK (soLuongTon >= 0),
  CONSTRAINT rb_sp_tongDaNhap CHECK (tongDaNhap >= 0),
  CONSTRAINT rb_sp_tongDaBan  CHECK (tongDaBan >= 0),
  CONSTRAINT rb_sp_hienThi    CHECK (trangThaiHienThi IN ('visible','hidden'))
);

-- 2b. SAN_PHAM_SIZE (tồn kho theo size = `tonKhoTheoSize` trong code; sản phẩm không chia size không có dòng nào)
CREATE TABLE SAN_PHAM_SIZE (
  maSanPham  VARCHAR(20) NOT NULL,
  kichCo     VARCHAR(10) NOT NULL,                           -- ví dụ '40', '38.5'
  soLuongTon INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (maSanPham, kichCo),
  CONSTRAINT kn_sps_sp FOREIGN KEY (maSanPham) REFERENCES SAN_PHAM(maSanPham)
    ON DELETE CASCADE,
  CONSTRAINT rb_sps_soLuongTon CHECK (soLuongTon >= 0)
);

-- 3. NHAN_VIEN (key `employeeList`; Admin đăng nhập riêng, không nằm trong bảng này)
CREATE TABLE NHAN_VIEN (
  maNhanVien   VARCHAR(10)  PRIMARY KEY,
  tenNhanVien  NVARCHAR(100) NOT NULL,
  gioiTinh     NVARCHAR(10)  NOT NULL,
  soDienThoai  VARCHAR(10)  NOT NULL UNIQUE,
  diaChi       NVARCHAR(255) NULL,
  chucVu       NVARCHAR(50)  NOT NULL,
  tenDangNhap  NVARCHAR(50)  NOT NULL UNIQUE,
  matKhau      VARCHAR(255) NOT NULL,                       -- sha256$<muối>$<băm> (PasswordUtil)
  ngayTao      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  trangThai    NVARCHAR(10)  NOT NULL DEFAULT 'hoatdong',
  CONSTRAINT rb_nv_gioiTinh CHECK (gioiTinh IN (N'Nam',N'Nữ')),
  CONSTRAINT rb_nv_sdt      CHECK (soDienThoai LIKE '0_________'),
  CONSTRAINT rb_nv_chucVu   CHECK (chucVu IN
    (N'Nhân viên bán hàng',N'Nhân viên kho',N'Nhân viên CSKH',N'Nhân viên kiểm kho')),
  CONSTRAINT rb_nv_trangThai CHECK (trangThai IN ('hoatdong','khoa'))
);

-- 4. KHACH_HANG (key `userList`)
CREATE TABLE KHACH_HANG (
  maKhachHang  VARCHAR(40)  PRIMARY KEY,                    -- KH001 hoặc user_<thời gian>_<ngẫu nhiên> (đăng ký trên web)
  tenDangNhap  NVARCHAR(50)  NOT NULL UNIQUE,
  thuDienTu    NVARCHAR(100) NOT NULL UNIQUE,
  matKhau      NVARCHAR(255) NOT NULL,                       -- sha256$<muối>$<băm> (PasswordUtil)
  hoTen        NVARCHAR(100) NOT NULL,
  soDienThoai  VARCHAR(10)  NOT NULL UNIQUE,
  diaChi       NVARCHAR(255) NULL,
  ngayTao      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  trangThai    NVARCHAR(10)  NOT NULL DEFAULT 'active',
  CONSTRAINT rb_kh_sdt       CHECK (soDienThoai LIKE '0_________'),
  CONSTRAINT rb_kh_trangThai CHECK (trangThai IN ('active','blocked'))
);

-- 4b. DIA_CHI_PHU (danh sách địa chỉ phụ của khách hàng = diaChiPhu)
CREATE TABLE DIA_CHI_PHU (
  maDiaChi     INT IDENTITY(1,1) PRIMARY KEY,
  maKhachHang  VARCHAR(40)  NOT NULL,
  tenNguoiNhan NVARCHAR(100) NOT NULL,
  soDienThoai  VARCHAR(10)  NOT NULL,
  thuDienTu    NVARCHAR(100) NULL,
  diaChi       NVARCHAR(255) NOT NULL,
  CONSTRAINT kn_dcp_kh FOREIGN KEY (maKhachHang) REFERENCES KHACH_HANG(maKhachHang)
    ON DELETE CASCADE
);

-- 5. VOUCHER (key `shopVouchers`; số lượt đã dùng KHÔNG lưu cột, tính từ DON_HANG chưa hủy)
CREATE TABLE VOUCHER (
  maVoucher        VARCHAR(30) PRIMARY KEY,
  tenVoucher       NVARCHAR(120) NOT NULL,
  moTa             NVARCHAR(500) NULL,
  loaiGiam         VARCHAR(10) NOT NULL,
  giaTriGiam       DECIMAL(15,2) NOT NULL,
  giamToiDa        DECIMAL(15,2) NULL,                      -- chỉ dùng cho loại percent
  donToiThieu      DECIMAL(15,2) NOT NULL DEFAULT 0,
  ngayBatDau       DATETIME NULL,                            -- NULL = hiệu lực ngay
  hanDung          DATETIME NULL,                            -- NULL = không hết hạn
  tongLuotDung     INT NOT NULL DEFAULT 0,                   -- tổng lượt toàn hệ thống, 0 = không giới hạn
  gioiHanMoiKhach  INT NOT NULL DEFAULT 0,                   -- lượt tối đa mỗi tài khoản, 0 = không giới hạn
  chiKhachMoi      BIT NOT NULL DEFAULT 0,                   -- chỉ khách chưa từng đặt hàng (không tính đơn đã hủy)
  trangThai        VARCHAR(10) NOT NULL DEFAULT 'active',    -- sắp diễn ra / hết hạn / hết lượt là trạng thái tính ra
  CONSTRAINT rb_voucher_loai CHECK (loaiGiam IN ('fixed','percent')),
  CONSTRAINT rb_voucher_gia CHECK (giaTriGiam > 0 AND (loaiGiam = 'fixed' OR giaTriGiam <= 100)),
  CONSTRAINT rb_voucher_don CHECK (donToiThieu >= 0),
  CONSTRAINT rb_voucher_luot CHECK (tongLuotDung >= 0 AND gioiHanMoiKhach >= 0),
  CONSTRAINT rb_voucher_han CHECK (hanDung IS NULL OR ngayBatDau IS NULL OR hanDung > ngayBatDau),
  CONSTRAINT rb_voucher_trangThai CHECK (trangThai IN ('active','inactive'))
);

-- 6. DON_HANG (key `DanhSachDatHang` phía khách, `ordersLocal` phía Admin)
CREATE TABLE DON_HANG (
  maDonHang            VARCHAR(30)   PRIMARY KEY,
  maKhachHang          VARCHAR(40)   NOT NULL,
  tenNguoiNhan         NVARCHAR(100)  NOT NULL,           -- tên người nhận
  soDienThoaiNhan      VARCHAR(10)   NOT NULL,           -- số điện thoại người nhận
  thuDienTuNguoiNhan   NVARCHAR(100)  NULL,               -- thư điện tử người nhận
  diaChiGiaoHang       NVARCHAR(255)  NOT NULL,           -- địa chỉ giao hàng (sao chép lúc đặt)
  phuongThucThanhToan  NVARCHAR(10)   NOT NULL,
  giaHienThi           VARCHAR(30)   NULL,               -- tổng tiền đã định dạng ₫ (code lưu kèm để hiển thị)
  tamTinh              DECIMAL(15,0) NOT NULL DEFAULT 0,
  maVoucher            VARCHAR(30)   NULL,
  giamGia              DECIMAL(15,0) NOT NULL DEFAULT 0,
  tongTien             DECIMAL(15,0) NOT NULL DEFAULT 0, -- = tamTinh - giamGia + phí vận chuyển
  phiVanChuyen         VARCHAR(30)   NULL,               -- code lưu chuỗi hiển thị, ví dụ '30.000₫' (DB thật nên là DECIMAL)
  ngayDat              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  trangThai            NVARCHAR(15)   NOT NULL DEFAULT 'cho-xac-nhan',   -- trạng thái khách nhìn thấy
  trangThaiQuanTri     VARCHAR(10)   NOT NULL DEFAULT 'moiDat',          -- trạng thái xử lý phía Admin
  trangThaiThanhToan   VARCHAR(10)   NOT NULL DEFAULT 'unpaid',
  ngayGiao             DATETIME      NULL,               -- Admin ghi khi chuyển sang đã giao (doanh thu tính từ ngày này)
  ngayHuy              DATETIME      NULL,
  ngayHoanTien         DATETIME      NULL,               -- Admin xác nhận đã hoàn tiền
  CONSTRAINT kn_dh_kh FOREIGN KEY (maKhachHang) REFERENCES KHACH_HANG(maKhachHang),
  CONSTRAINT kn_dh_voucher FOREIGN KEY (maVoucher) REFERENCES VOUCHER(maVoucher),
  CONSTRAINT rb_dh_thanhToan CHECK (phuongThucThanhToan IN ('COD','PayBank','PayStore')),
  CONSTRAINT rb_dh_tamTinh CHECK (tamTinh >= 0),
  CONSTRAINT rb_dh_giamGia CHECK (giamGia >= 0 AND giamGia <= tamTinh),
  CONSTRAINT rb_dh_tongTien  CHECK (tongTien >= 0),
  CONSTRAINT rb_dh_trangThai CHECK (trangThai IN
    ('cho-xac-nhan','dang-giao','thanh-cong','da-huy')),
  CONSTRAINT rb_dh_quanTri CHECK (trangThaiQuanTri IN ('moiDat','daXuLy','daGiao','huy')),
  CONSTRAINT rb_dh_tt CHECK (trangThaiThanhToan IN ('unpaid','pending','paid','refund','refunded'))
);

-- 7. CHI_TIET_DON_HANG (một dòng cho mỗi sản phẩm + size)
CREATE TABLE CHI_TIET_DON_HANG (
  maDonHang     VARCHAR(30)   NOT NULL,
  maSanPham     VARCHAR(20)   NOT NULL,
  kichCoDaChon  VARCHAR(10)   NOT NULL DEFAULT '',   -- '' = sản phẩm không chia size
  tenSanPham    NVARCHAR(255)  NOT NULL,
  soLuong       INT           NOT NULL,
  donGia        DECIMAL(15,0) NOT NULL,
  giaVon        DECIMAL(15,0) NULL,                    -- giá vốn 1 đôi chốt lúc giao (tính lợi nhuận)
  thanhTien      AS (soLuong * donGia),
  PRIMARY KEY (maDonHang, maSanPham, kichCoDaChon),
  CONSTRAINT kn_ctdh_dh FOREIGN KEY (maDonHang) REFERENCES DON_HANG(maDonHang)
    ON DELETE CASCADE,
  CONSTRAINT kn_ctdh_sp FOREIGN KEY (maSanPham) REFERENCES SAN_PHAM(maSanPham),
  CONSTRAINT rb_ctdh_soLuong CHECK (soLuong > 0),
  CONSTRAINT rb_ctdh_donGia  CHECK (donGia > 0)
);

-- 8. GIO_HANG (một dòng cho mỗi khách + sản phẩm + size; key `cart`)
CREATE TABLE GIO_HANG (
  maKhachHang  VARCHAR(40) NOT NULL,
  maSanPham    VARCHAR(20) NOT NULL,
  kichCoDaChon VARCHAR(10) NOT NULL DEFAULT '',
  soLuong      INT         NOT NULL,
  PRIMARY KEY (maKhachHang, maSanPham, kichCoDaChon),
  CONSTRAINT kn_gh_kh FOREIGN KEY (maKhachHang) REFERENCES KHACH_HANG(maKhachHang)
    ON DELETE CASCADE,
  CONSTRAINT kn_gh_sp FOREIGN KEY (maSanPham) REFERENCES SAN_PHAM(maSanPham),
  CONSTRAINT rb_gh_soLuong CHECK (soLuong > 0)
);

-- 9. PHIEU_NHAP_HANG (key `phieuNhapLocal`; nhà cung cấp là chuỗi, không có bảng riêng)
CREATE TABLE PHIEU_NHAP_HANG (
  maPhieuNhap VARCHAR(20)   PRIMARY KEY,                 -- PN...
  ngayNhap    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  nhaCungCap  NVARCHAR(150)  NOT NULL,                   -- nhà cung cấp (bắt buộc khi lập phiếu)
  nguoiLap    NVARCHAR(100)  NOT NULL,                   -- người lập phiếu
  nguoiDuyet  NVARCHAR(100)  NULL,                       -- người hoàn thành (duyệt) phiếu
  ngayHoanThanh DATETIME     NULL,
  ngayHuy     DATETIME       NULL,
  nguoiHuy    NVARCHAR(100)  NULL,
  tongTien    DECIMAL(17,0) NOT NULL DEFAULT 0,
  trangThai   NVARCHAR(15)   NOT NULL DEFAULT 'chuaHoanThanh',
  CONSTRAINT rb_pn_tongTien  CHECK (tongTien >= 0),
  CONSTRAINT rb_pn_trangThai CHECK (trangThai IN ('hoanThanh','chuaHoanThanh','daHuy'))
);

-- 10. CHI_TIET_PHIEU_NHAP
CREATE TABLE CHI_TIET_PHIEU_NHAP (
  maPhieuNhap  VARCHAR(20)   NOT NULL,
  maSanPham    VARCHAR(20)   NOT NULL,
  kichCo       VARCHAR(10)   NOT NULL DEFAULT '',        -- size nhập ('' = sản phẩm không chia size)
  tenSanPham   NVARCHAR(255)  NOT NULL,
  soLuongNhap  INT           NOT NULL,
  giaNhap      DECIMAL(15,0) NOT NULL,
  thanhTien     AS (soLuongNhap * giaNhap),
  PRIMARY KEY (maPhieuNhap, maSanPham, kichCo),
  CONSTRAINT kn_ctpn_pn FOREIGN KEY (maPhieuNhap) REFERENCES PHIEU_NHAP_HANG(maPhieuNhap)
    ON DELETE CASCADE,
  CONSTRAINT kn_ctpn_sp FOREIGN KEY (maSanPham) REFERENCES SAN_PHAM(maSanPham),
  CONSTRAINT rb_ctpn_soLuong CHECK (soLuongNhap > 0),
  CONSTRAINT rb_ctpn_giaNhap CHECK (giaNhap > 0)
);

-- 11. DANH_GIA (đánh giá sản phẩm; code lưu ở IndexedDB `ooad_feedback`, phản hồi của nhân viên gộp vào cùng dòng)
CREATE TABLE DANH_GIA (
  maDanhGia            VARCHAR(80)   PRIMARY KEY,           -- fb_<maDonHang>_<maSanPham>_<size>
  maDonHang            VARCHAR(30)   NOT NULL,
  maSanPham            VARCHAR(20)   NOT NULL,
  kichCoDaChon         VARCHAR(10)   NOT NULL DEFAULT '',
  maKhachHang          VARCHAR(40)   NULL,
  hoTen                NVARCHAR(100)  NOT NULL,
  soSao                TINYINT       NOT NULL,
  binhLuan             NVARCHAR(1000) NULL,
  ngayTao              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  trangThai            VARCHAR(10)   NOT NULL DEFAULT 'moi',   -- moi / dangXuLy / daXuLy
  nguoiXuLyTenDangNhap NVARCHAR(50)   NULL,
  nguoiXuLyHoTen       NVARCHAR(100)  NULL,
  ngayTiepNhan         DATETIME      NULL,
  phanHoiNoiDung       NVARCHAR(1000) NULL,
  phanHoiNguoiGui      NVARCHAR(100)  NULL,
  phanHoiTenDangNhap   NVARCHAR(50)   NULL,
  phanHoiThoiGian      DATETIME      NULL,                    -- lần trả lời đầu
  phanHoiCapNhatLuc    DATETIME      NULL,                    -- lần sửa gần nhất
  daAn                 BIT           NOT NULL DEFAULT 0,      -- ẩn khỏi trang sản phẩm
  CONSTRAINT kn_dg_dh FOREIGN KEY (maDonHang) REFERENCES DON_HANG(maDonHang),
  CONSTRAINT kn_dg_sp FOREIGN KEY (maSanPham) REFERENCES SAN_PHAM(maSanPham),
  CONSTRAINT kn_dg_kh FOREIGN KEY (maKhachHang) REFERENCES KHACH_HANG(maKhachHang),
  CONSTRAINT uq_dg_dong UNIQUE (maDonHang, maSanPham, kichCoDaChon),   -- mỗi dòng đơn chỉ đánh giá một lần
  CONSTRAINT rb_dg_soSao CHECK (soSao BETWEEN 1 AND 5),
  CONSTRAINT rb_dg_trangThai CHECK (trangThai IN ('moi','dangXuLy','daXuLy'))
);

-- 11b. DANH_GIA_TEP (ảnh/video đính kèm; nội dung tệp nằm ở IndexedDB, bản thật nên lưu object storage)
CREATE TABLE DANH_GIA_TEP (
  maDanhGia  VARCHAR(80)   NOT NULL,
  stt        INT           NOT NULL,
  loai       VARCHAR(10)   NOT NULL,                          -- image / video
  ten        NVARCHAR(255)  NOT NULL,
  duongDan   NVARCHAR(500)  NULL,
  PRIMARY KEY (maDanhGia, stt),
  CONSTRAINT kn_dgt_dg FOREIGN KEY (maDanhGia) REFERENCES DANH_GIA(maDanhGia)
    ON DELETE CASCADE,
  CONSTRAINT rb_dgt_loai CHECK (loai IN ('image','video'))
);

-- 12a. HO_TRO_CHAT (phiên chat hỗ trợ — key supportThreads)
CREATE TABLE HO_TRO_CHAT (
  maPhienChat            VARCHAR(40)   PRIMARY KEY,               -- CHAT_...
  maKhachHang            VARCHAR(40)   NOT NULL,
  tenKhachHang           NVARCHAR(100)  NOT NULL,                  -- snapshot tên khách
  nhanVienXuLy           NVARCHAR(100)  NULL,                      -- tên nhân viên đang phụ trách (NULL = chờ tiếp nhận)
  maNhanVienXuLy         VARCHAR(50)   NULL,                      -- tên đăng nhập nhân viên đang phụ trách
  ngayTiepNhan           DATETIME      NULL,
  trangThai              VARCHAR(10)   NOT NULL DEFAULT 'open',
  maTinNhanKhachDaDoc    VARCHAR(40)   NULL,                      -- tin khách đã đọc cuối cùng (chấm đỏ trên nút Hỗ trợ)
  maTinNhanNhanVienDaDoc VARCHAR(40)   NULL,                      -- tin nhân viên đã đọc cuối cùng
  ngayTao                DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ngayCapNhat            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ngayDong               DATETIME      NULL,
  nguoiDong              NVARCHAR(100)  NULL,
  CONSTRAINT kn_htc_kh FOREIGN KEY (maKhachHang) REFERENCES KHACH_HANG(maKhachHang),
  CONSTRAINT rb_htc_trangThai CHECK (trangThai IN ('open','closed'))
);

-- 12a2. TIN_NHAN (tin nhắn trong phiên chat — mảng tinNhan lồng trong HO_TRO_CHAT)
CREATE TABLE TIN_NHAN (
  maTinNhan    VARCHAR(40)    PRIMARY KEY,                       -- MSG_...
  maPhienChat  VARCHAR(40)    NOT NULL,
  loaiNguoiGui VARCHAR(10)    NOT NULL,                          -- customer / staff / system
  maNguoiGui   VARCHAR(50)    NULL,
  tenNguoiGui  NVARCHAR(100)   NULL,
  loaiTinNhan  VARCHAR(10)    NOT NULL DEFAULT 'text',           -- text / image / product / rating
  noiDung      NVARCHAR(1000)  NULL,                              -- nội dung chữ hoặc tên file ảnh
  duLieuAnh    NVARCHAR(MAX)  NULL,                              -- Data URL ảnh (demo, tối đa 2MB)
  maSanPham    VARCHAR(20)    NULL,                              -- tin loại product
  tenSanPham   NVARCHAR(255)   NULL,
  duongDan     NVARCHAR(500)   NULL,
  soSao        TINYINT        NULL,                              -- tin loại rating; chi tiết từng sản phẩm nằm trong mảng chiTiet
  thoiGianGui  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT kn_tn_phien FOREIGN KEY (maPhienChat) REFERENCES HO_TRO_CHAT(maPhienChat)
    ON DELETE CASCADE,
  CONSTRAINT kn_tn_sp FOREIGN KEY (maSanPham) REFERENCES SAN_PHAM(maSanPham),
  CONSTRAINT rb_tn_loaiNguoiGui CHECK (loaiNguoiGui IN ('customer','staff','system')),
  CONSTRAINT rb_tn_loaiTinNhan  CHECK (loaiTinNhan IN ('text','image','product','rating')),
  CONSTRAINT rb_tn_soSao        CHECK (soSao IS NULL OR soSao BETWEEN 1 AND 5)
);

-- 12b. CAU_HINH (thiết lập chung của cửa hàng)
CREATE TABLE CAU_HINH (
  khoa    VARCHAR(50)   PRIMARY KEY,
  giaTri  NVARCHAR(255)  NOT NULL,
  moTa    NVARCHAR(255)  NULL
);
GO

-- 1. LOAI_SAN_PHAM (mã loại = tên hãng, giống `categories` trong code; Puma thêm cho sản phẩm mẫu SH-004)
INSERT INTO LOAI_SAN_PHAM (maLoai, tenLoai, moTa, trangThai, ngayTao) VALUES
('Nike', N'Nike', N'Các sản phẩm giày Nike chính hãng', 'active', '2024-01-15'),
('Adidas', N'Adidas', N'Các sản phẩm giày Adidas chính hãng', 'active', '2024-01-20'),
('Converse', N'Converse', N'Các sản phẩm giày Converse chính hãng', 'active', '2024-01-25'),
('MLB', N'MLB', N'Các sản phẩm giày MLB chính hãng', 'active', '2024-01-30'),
('Vans', N'Vans', N'Các sản phẩm giày Vans chính hãng', 'active', '2024-02-01'),
('Puma', N'Puma', N'Các sản phẩm giày Puma chính hãng', 'active', '2024-02-10');

-- 2. SAN_PHAM (soLuongTon = tổng SAN_PHAM_SIZE = tongDaNhap - tongDaBan)
INSERT INTO SAN_PHAM (maSanPham, maLoai, tenSanPham, gioiTinh, moTaNgan, mauSac, chatLieu, phongCach, kichCo, giaBan, giaHienThi, hinhAnh, giaNhap, soLuongTon, tongDaNhap, tongDaBan, trangThaiHienThi, moTa, xuatXu) VALUES
('SH-001', 'Nike', N'Nike Air Force 1', N'Nam', N'Giày sneaker Nike phong cách trẻ trung', N'Trắng', N'Da tổng hợp', N'Thể thao', '40-44', 1500000, N'1.500.000₫', 'nike-air-force-1.jpg', 1000000, 35, 50, 15, 'visible', N'Giày Nike Air Force 1 phù hợp đi học, đi chơi và sử dụng hằng ngày.', N'Việt Nam'),
('SH-002', 'Adidas', N'Adidas Superstar', N'Nam', N'Giày Adidas Superstar cổ điển', N'Trắng/Đen', N'Da tổng hợp', N'Casual', '39-43', 1400000, N'1.400.000₫', 'adidas-superstar.jpg', 900000, 28, 40, 12, 'visible', N'Adidas Superstar với thiết kế đơn giản, phù hợp nhiều phong cách.', N'Việt Nam'),
('SH-003', 'Nike', N'Nike Revolution 7', N'Nữ', N'Giày chạy bộ Nike nhẹ và thoải mái', N'Hồng', N'Vải dệt', N'Chạy bộ', '36-40', 1200000, N'1.200.000₫', 'nike-revolution-7.jpg', 750000, 25, 35, 10, 'visible', N'Giày chạy bộ có trọng lượng nhẹ, phù hợp luyện tập và chạy bộ hằng ngày.', N'Việt Nam'),
('SH-004', 'Puma', N'Puma Smash v2', N'Nam', N'Giày Puma phong cách thể thao', N'Đen', N'Da tổng hợp', N'Thể thao', '39-43', 1100000, N'1.100.000₫', 'puma-smash-v2.jpg', 700000, 20, 30, 10, 'visible', N'Puma Smash v2 có thiết kế đơn giản và dễ phối đồ.', N'Việt Nam'),
('SH-005', 'Adidas', N'Adidas Duramo SL', N'Nữ', N'Giày chạy bộ Adidas', N'Xanh', N'Vải dệt', N'Chạy bộ', '36-40', 1300000, N'1.300.000₫', 'adidas-duramo-sl.jpg', 800000, 18, 25, 7, 'visible', N'Giày Adidas Duramo SL phù hợp cho việc tập luyện và chạy bộ.', N'Việt Nam'),
('SH-006', 'Converse', N'Converse Chuck Taylor', N'Nữ', N'Giày Converse phong cách thời trang', N'Đen', N'Canvas', N'Casual', '36-40', 1000000, N'1.000.000₫', 'converse-chuck-taylor.jpg', 650000, 22, 30, 8, 'visible', N'Converse Chuck Taylor phù hợp đi học và đi chơi.', N'Việt Nam');

-- 3. SAN_PHAM_SIZE (tồn kho theo size, = tonKhoTheoSize trong code)
INSERT INTO SAN_PHAM_SIZE (maSanPham, kichCo, soLuongTon) VALUES
('SH-001', '40', 7),
('SH-001', '41', 7),
('SH-001', '42', 7),
('SH-001', '43', 7),
('SH-001', '44', 7),
('SH-002', '39', 6),
('SH-002', '40', 6),
('SH-002', '41', 6),
('SH-002', '42', 5),
('SH-002', '43', 5),
('SH-003', '36', 5),
('SH-003', '37', 5),
('SH-003', '38', 5),
('SH-003', '39', 5),
('SH-003', '40', 5),
('SH-004', '39', 4),
('SH-004', '40', 4),
('SH-004', '41', 4),
('SH-004', '42', 4),
('SH-004', '43', 4),
('SH-005', '36', 4),
('SH-005', '37', 4),
('SH-005', '38', 4),
('SH-005', '39', 3),
('SH-005', '40', 3),
('SH-006', '36', 5),
('SH-006', '37', 5),
('SH-006', '38', 4),
('SH-006', '39', 4),
('SH-006', '40', 4);

-- 4. NHAN_VIEN (mật khẩu mẫu đều là 123456, lưu dạng băm sha256 như hệ thống)
INSERT INTO NHAN_VIEN (maNhanVien, tenNhanVien, gioiTinh, soDienThoai, diaChi, chucVu, tenDangNhap, matKhau, trangThai) VALUES
('NV001', N'Nguyễn Văn An', N'Nam', '0901234567', N'Quận 8, TP.HCM', N'Nhân viên bán hàng', 'nguyenvanan', 'sha256$3612191f3f382f1a$282d4f38a30ae821b4ad9a197e7e90e19dc350ed7a5f822b00f68e90157cbe24', 'hoatdong'),
('NV002', N'Trần Thị Bình', N'Nữ', '0912345678', N'Quận 5, TP.HCM', N'Nhân viên kho', 'tranthibinh', 'sha256$3612191f3f382f1a$282d4f38a30ae821b4ad9a197e7e90e19dc350ed7a5f822b00f68e90157cbe24', 'hoatdong'),
('NV003', N'Lê Minh Anh', N'Nữ', '0923456789', N'Quận 10, TP.HCM', N'Nhân viên CSKH', 'leminhanh', 'sha256$3612191f3f382f1a$282d4f38a30ae821b4ad9a197e7e90e19dc350ed7a5f822b00f68e90157cbe24', 'hoatdong'),
('NV004', N'Phạm Quốc Huy', N'Nam', '0934567890', N'Quận 7, TP.HCM', N'Nhân viên kiểm kho', 'phamquochuy', 'sha256$3612191f3f382f1a$282d4f38a30ae821b4ad9a197e7e90e19dc350ed7a5f822b00f68e90157cbe24', 'khoa');

-- 5. KHACH_HANG (mật khẩu mẫu 123456, dạng băm)
INSERT INTO KHACH_HANG (maKhachHang, tenDangNhap, thuDienTu, matKhau, hoTen, soDienThoai, diaChi, trangThai) VALUES
('KH001', 'nguyenthia', 'nguyenthia@gmail.com', 'sha256$3612191f3f382f1a$282d4f38a30ae821b4ad9a197e7e90e19dc350ed7a5f822b00f68e90157cbe24', N'Nguyễn Thị An', '0941234567', N'Quận 8, TP.HCM', 'active'),
('KH002', 'tranminh', 'tranminh@gmail.com', 'sha256$3612191f3f382f1a$282d4f38a30ae821b4ad9a197e7e90e19dc350ed7a5f822b00f68e90157cbe24', N'Trần Minh', '0952345678', N'Quận 5, TP.HCM', 'active'),
('KH003', 'lethuy', 'lethuy@gmail.com', 'sha256$3612191f3f382f1a$282d4f38a30ae821b4ad9a197e7e90e19dc350ed7a5f822b00f68e90157cbe24', N'Lê Thùy', '0963456789', N'Quận 7, TP.HCM', 'active'),
('KH004', 'phamhoang', 'phamhoang@gmail.com', 'sha256$3612191f3f382f1a$282d4f38a30ae821b4ad9a197e7e90e19dc350ed7a5f822b00f68e90157cbe24', N'Phạm Hoàng', '0974567890', N'Bình Thạnh, TP.HCM', 'active'),
('KH005', 'doanmai', 'doanmai@gmail.com', 'sha256$3612191f3f382f1a$282d4f38a30ae821b4ad9a197e7e90e19dc350ed7a5f822b00f68e90157cbe24', N'Đoàn Mai', '0985678901', N'Thủ Đức, TP.HCM', 'blocked');

-- 6. DIA_CHI_PHU
INSERT INTO DIA_CHI_PHU (maKhachHang, tenNguoiNhan, soDienThoai, thuDienTu, diaChi) VALUES
('KH001', N'Nguyễn Thị An', '0941234567', 'nguyenthia@gmail.com', N'123 Đường Dương Bá Trạc, Quận 8, TP.HCM'),
('KH001', N'Nguyễn Thị An', '0941234567', 'nguyenthia@gmail.com', N'45 Nguyễn Trãi, Quận 5, TP.HCM'),
('KH002', N'Trần Minh', '0952345678', 'tranminh@gmail.com', N'78 Nguyễn Văn Cừ, Quận 5, TP.HCM'),
('KH003', N'Lê Thùy', '0963456789', 'lethuy@gmail.com', N'100 Nguyễn Hữu Thọ, Quận 7, TP.HCM'),
('KH004', N'Phạm Hoàng', '0974567890', 'phamhoang@gmail.com', N'25 Điện Biên Phủ, Bình Thạnh, TP.HCM');

-- 7. VOUCHER (giống DEFAULT_VOUCHERS trong database/vouchers.js; tongLuotDung/gioiHanMoiKhach = 0 là không giới hạn)
INSERT INTO VOUCHER (maVoucher, tenVoucher, moTa, loaiGiam, giaTriGiam, giamToiDa, donToiThieu, ngayBatDau, hanDung, tongLuotDung, gioiHanMoiKhach, chiKhachMoi, trangThai) VALUES
('GIAYMOI10', N'Giảm 10%', N'Giảm 10% tối đa 150.000đ cho đơn từ 500.000đ', 'percent', 10, 150000, 500000, NULL, NULL, 0, 1, 0, 'active'),
('GIAY200K', N'Giảm 200.000đ', N'Giảm 200.000đ cho đơn từ 1.500.000đ', 'fixed', 200000, NULL, 1500000, NULL, NULL, 0, 1, 0, 'active'),
('KHACHMOI', N'Ưu đãi khách mới', N'Giảm 50.000đ cho đơn từ 300.000đ (chỉ khách chưa từng đặt hàng)', 'fixed', 50000, NULL, 300000, NULL, NULL, 0, 1, 1, 'active'),
('SALE2026', N'Ưu đãi cuối năm 2026', N'Giảm 100.000đ cho đơn từ 1.000.000đ, dùng đến 31/12/2026', 'fixed', 100000, NULL, 1000000, NULL, '2026-12-31 23:59:59', 0, 1, 0, 'active'),
('SALE2025', N'Ưu đãi SALE cuối năm 2025 (đã kết thúc)', N'Giảm 100.000đ cho đơn từ 1.000.000đ — mã này đã hết hạn', 'fixed', 100000, NULL, 1000000, NULL, '2025-12-31 23:59:59', 0, 1, 0, 'active');

-- 8. DON_HANG (tongTien = tamTinh - giamGia + phí vận chuyển)
INSERT INTO DON_HANG (maDonHang, maKhachHang, tenNguoiNhan, soDienThoaiNhan, thuDienTuNguoiNhan, diaChiGiaoHang, phuongThucThanhToan, giaHienThi, tamTinh, maVoucher, giamGia, tongTien, phiVanChuyen, ngayDat, trangThai, trangThaiQuanTri, trangThaiThanhToan, ngayGiao, ngayHuy) VALUES
('DH001', 'KH001', N'Nguyễn Thị An', '0941234567', 'nguyenthia@gmail.com', N'123 Đường Dương Bá Trạc, Quận 8, TP.HCM', 'COD', N'3.030.000₫', 3000000, NULL, 0, 3030000, N'30.000₫', '2026-11-01 09:00', 'cho-xac-nhan', 'moiDat', 'unpaid', NULL, NULL),
('DH002', 'KH002', N'Trần Minh', '0952345678', 'tranminh@gmail.com', N'78 Nguyễn Văn Cừ, Quận 5, TP.HCM', 'PayBank', N'1.430.000₫', 1400000, NULL, 0, 1430000, N'30.000₫', '2026-11-02 10:30', 'dang-giao', 'daXuLy', 'paid', NULL, NULL),
('DH003', 'KH003', N'Lê Thùy', '0963456789', 'lethuy@gmail.com', N'100 Nguyễn Hữu Thọ, Quận 7, TP.HCM', 'COD', N'2.280.000₫', 2400000, 'GIAYMOI10', 150000, 2280000, N'30.000₫', '2026-10-15 09:00', 'thanh-cong', 'daGiao', 'paid', '2026-10-20 10:00', NULL),
('DH004', 'KH004', N'Phạm Hoàng', '0974567890', 'phamhoang@gmail.com', N'25 Điện Biên Phủ, Bình Thạnh, TP.HCM', 'PayStore', N'1.100.000₫', 1100000, NULL, 0, 1100000, N'0₫', '2026-10-25 14:00', 'da-huy', 'huy', 'unpaid', NULL, '2026-10-26 08:00');

-- 9. CHI_TIET_DON_HANG (giaVon chốt lúc giao thành công)
INSERT INTO CHI_TIET_DON_HANG (maDonHang, maSanPham, kichCoDaChon, tenSanPham, soLuong, donGia, giaVon) VALUES
('DH001', 'SH-001', '42', N'Nike Air Force 1', 2, 1500000, NULL),
('DH002', 'SH-002', '41', N'Adidas Superstar', 1, 1400000, NULL),
('DH003', 'SH-003', '38', N'Nike Revolution 7', 2, 1200000, 750000),
('DH004', 'SH-004', '41', N'Puma Smash v2', 1, 1100000, NULL);

-- 10. GIO_HANG
INSERT INTO GIO_HANG (maKhachHang, maSanPham, kichCoDaChon, soLuong) VALUES
('KH001', 'SH-003', '37', 1),
('KH001', 'SH-006', '38', 2),
('KH002', 'SH-001', '41', 1),
('KH003', 'SH-005', '38', 1),
('KH004', 'SH-004', '40', 2);

-- 11. PHIEU_NHAP_HANG (tongTien = tổng soLuongNhap × giaNhap của chi tiết)
INSERT INTO PHIEU_NHAP_HANG (maPhieuNhap, ngayNhap, nhaCungCap, nguoiLap, nguoiDuyet, ngayHoanThanh, tongTien, trangThai) VALUES
('PN001', '2026-09-01', N'Công ty Giày Việt', N'tranthibinh', N'admin', '2026-09-01 15:00', 125500000, 'hoanThanh'),
('PN002', '2026-09-10', N'Công ty Giày Việt', N'tranthibinh', N'admin', '2026-09-10 16:00', 47250000, 'hoanThanh'),
('PN003', '2026-11-05', N'Công ty Giày Việt', N'tranthibinh', NULL, NULL, 25750000, 'chuaHoanThanh');

-- 12. CHI_TIET_PHIEU_NHAP (mỗi size một dòng)
INSERT INTO CHI_TIET_PHIEU_NHAP (maPhieuNhap, maSanPham, kichCo, tenSanPham, soLuongNhap, giaNhap) VALUES
('PN001', 'SH-001', '40', N'Nike Air Force 1', 10, 1000000),
('PN001', 'SH-001', '41', N'Nike Air Force 1', 10, 1000000),
('PN001', 'SH-001', '42', N'Nike Air Force 1', 10, 1000000),
('PN001', 'SH-001', '43', N'Nike Air Force 1', 10, 1000000),
('PN001', 'SH-001', '44', N'Nike Air Force 1', 10, 1000000),
('PN001', 'SH-002', '39', N'Adidas Superstar', 8, 900000),
('PN001', 'SH-002', '40', N'Adidas Superstar', 8, 900000),
('PN001', 'SH-002', '41', N'Adidas Superstar', 8, 900000),
('PN001', 'SH-002', '42', N'Adidas Superstar', 8, 900000),
('PN001', 'SH-002', '43', N'Adidas Superstar', 8, 900000),
('PN001', 'SH-005', '36', N'Adidas Duramo SL', 5, 800000),
('PN001', 'SH-005', '37', N'Adidas Duramo SL', 5, 800000),
('PN001', 'SH-005', '38', N'Adidas Duramo SL', 5, 800000),
('PN001', 'SH-005', '39', N'Adidas Duramo SL', 5, 800000),
('PN001', 'SH-005', '40', N'Adidas Duramo SL', 5, 800000),
('PN001', 'SH-006', '36', N'Converse Chuck Taylor', 6, 650000),
('PN001', 'SH-006', '37', N'Converse Chuck Taylor', 6, 650000),
('PN001', 'SH-006', '38', N'Converse Chuck Taylor', 6, 650000),
('PN001', 'SH-006', '39', N'Converse Chuck Taylor', 6, 650000),
('PN001', 'SH-006', '40', N'Converse Chuck Taylor', 6, 650000),
('PN002', 'SH-003', '36', N'Nike Revolution 7', 7, 750000),
('PN002', 'SH-003', '37', N'Nike Revolution 7', 7, 750000),
('PN002', 'SH-003', '38', N'Nike Revolution 7', 7, 750000),
('PN002', 'SH-003', '39', N'Nike Revolution 7', 7, 750000),
('PN002', 'SH-003', '40', N'Nike Revolution 7', 7, 750000),
('PN002', 'SH-004', '39', N'Puma Smash v2', 6, 700000),
('PN002', 'SH-004', '40', N'Puma Smash v2', 6, 700000),
('PN002', 'SH-004', '41', N'Puma Smash v2', 6, 700000),
('PN002', 'SH-004', '42', N'Puma Smash v2', 6, 700000),
('PN002', 'SH-004', '43', N'Puma Smash v2', 6, 700000),
('PN003', 'SH-005', '36', N'Adidas Duramo SL', 4, 800000),
('PN003', 'SH-005', '37', N'Adidas Duramo SL', 4, 800000),
('PN003', 'SH-005', '38', N'Adidas Duramo SL', 4, 800000),
('PN003', 'SH-005', '39', N'Adidas Duramo SL', 4, 800000),
('PN003', 'SH-005', '40', N'Adidas Duramo SL', 4, 800000),
('PN003', 'SH-006', '36', N'Converse Chuck Taylor', 3, 650000),
('PN003', 'SH-006', '37', N'Converse Chuck Taylor', 3, 650000),
('PN003', 'SH-006', '38', N'Converse Chuck Taylor', 3, 650000),
('PN003', 'SH-006', '39', N'Converse Chuck Taylor', 3, 650000),
('PN003', 'SH-006', '40', N'Converse Chuck Taylor', 3, 650000);

-- 13. DANH_GIA (đơn DH003 đã giao thành công)
INSERT INTO DANH_GIA (maDanhGia, maDonHang, maSanPham, kichCoDaChon, maKhachHang, hoTen, soSao, binhLuan, ngayTao, trangThai, nguoiXuLyTenDangNhap, nguoiXuLyHoTen, ngayTiepNhan, phanHoiNoiDung, phanHoiNguoiGui, phanHoiTenDangNhap, phanHoiThoiGian, daAn) VALUES
('fb_DH003_SH-003_38', 'DH003', 'SH-003', '38', 'KH003', N'Lê Thùy', 5, N'Giày nhẹ, đi êm, giao hàng nhanh.', '2026-10-22 08:00', 'daXuLy', 'leminhanh', N'Lê Minh Anh', '2026-10-22 09:00', N'Cảm ơn bạn đã tin tưởng OOAD Shop!', N'Lê Minh Anh', 'leminhanh', '2026-10-22 09:05', 0);

-- 14. HO_TRO_CHAT + TIN_NHAN (một phiên đã kết thúc)
INSERT INTO HO_TRO_CHAT (maPhienChat, maKhachHang, tenKhachHang, nhanVienXuLy, maNhanVienXuLy, ngayTiepNhan, trangThai, maTinNhanKhachDaDoc, maTinNhanNhanVienDaDoc, ngayTao, ngayCapNhat, ngayDong, nguoiDong) VALUES
('CHAT_demo1', 'KH001', N'Nguyễn Thị An', N'Lê Minh Anh', 'leminhanh', '2026-11-03 09:01', 'closed', 'MSG_demo3', 'MSG_demo3', '2026-11-03 09:00', '2026-11-03 09:10', '2026-11-03 09:10', N'Lê Minh Anh');

INSERT INTO TIN_NHAN (maTinNhan, maPhienChat, loaiNguoiGui, maNguoiGui, tenNguoiGui, loaiTinNhan, noiDung, thoiGianGui) VALUES
('MSG_demo1', 'CHAT_demo1', 'customer', 'KH001', N'Nguyễn Thị An', 'text', N'Đơn DH001 của mình khi nào giao ạ?', '2026-11-03 09:00'),
('MSG_demo2', 'CHAT_demo1', 'staff', 'leminhanh', N'Lê Minh Anh', 'text', N'Shop đã ghi nhận, đơn sẽ được xác nhận trong hôm nay ạ.', '2026-11-03 09:05'),
('MSG_demo3', 'CHAT_demo1', 'system', 'shop', N'OOAD Shop', 'text', N'Lê Minh Anh đã kết thúc hội thoại. Cảm ơn bạn đã liên hệ OOAD Shop!', '2026-11-03 09:10');

-- 15. CAU_HINH
INSERT INTO CAU_HINH (khoa, giaTri, moTa) VALUES
('nguongSapHet', '10', N'Sản phẩm có tồn kho dưới ngưỡng này được cảnh báo sắp hết (localStorage: nguongSapHet)');
