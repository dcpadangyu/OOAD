CREATE DATABASE CuaHangGiay;
GO
USE CuaHangGiay;
GO

-- 1. LOAI_SAN_PHAM
CREATE TABLE LOAI_SAN_PHAM (
  maLoai   VARCHAR(20)  PRIMARY KEY,
  tenLoai  NVARCHAR(100) NOT NULL UNIQUE,
  hinhAnh  VARCHAR(255) NULL
);

-- 2. SAN_PHAM
CREATE TABLE SAN_PHAM (
  maSanPham        VARCHAR(20)   PRIMARY KEY,
  maLoai           VARCHAR(20)   NOT NULL,
  tenSanPham       NVARCHAR(255)  NOT NULL,
  gioiTinh         NVARCHAR(10)   NOT NULL,
  moTaNgan         NVARCHAR(255)  NULL,                   -- mô tả ngắn
  mauSac           NVARCHAR(50)   NOT NULL,
  chatLieu         NVARCHAR(100)  NOT NULL,
  phongCach        NVARCHAR(100)  NOT NULL,
  kichCo           NVARCHAR(50)   NOT NULL,
  giaBan           DECIMAL(15,0) NOT NULL,               -- giá bán (số)
  giaHienThi       VARCHAR(30)   NOT NULL,               -- giá hiển thị (đã định dạng ₫)
  hinhAnh          VARCHAR(255)  NOT NULL,
  giaNhap          DECIMAL(15,0) NOT NULL,
  soLuongTon       INT           NOT NULL DEFAULT 0,     -- số lượng tồn
  tongDaNhap       INT           NOT NULL DEFAULT 0,     -- tổng số lượng đã nhập
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

-- 3. NHAN_VIEN
CREATE TABLE NHAN_VIEN (
  maNhanVien   VARCHAR(10)  PRIMARY KEY,
  tenNhanVien  NVARCHAR(100) NOT NULL,
  gioiTinh     NVARCHAR(10)  NOT NULL,
  soDienThoai  VARCHAR(10)  NOT NULL UNIQUE,
  diaChi       NVARCHAR(255) NULL,
  chucVu       NVARCHAR(50)  NOT NULL,
  tenDangNhap  NVARCHAR(50)  NOT NULL UNIQUE,
  matKhau      VARCHAR(255) NOT NULL,
  ngayTao      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  trangThai    NVARCHAR(10)  NOT NULL DEFAULT 'hoatdong',
  CONSTRAINT rb_nv_gioiTinh CHECK (gioiTinh IN (N'Nam',N'Nữ')),
  CONSTRAINT rb_nv_sdt      CHECK (soDienThoai LIKE '0_________'),
  CONSTRAINT rb_nv_chucVu   CHECK (chucVu IN
    (N'Nhân viên bán hàng',N'Nhân viên kho',N'Nhân viên CSKH',N'Nhân viên kiểm kho')),
  CONSTRAINT rb_nv_trangThai CHECK (trangThai IN ('hoatdong','khoa'))
);

-- 4. KHACH_HANG
CREATE TABLE KHACH_HANG (
  maKhachHang  VARCHAR(10)  PRIMARY KEY,
  tenDangNhap  NVARCHAR(50)  NOT NULL UNIQUE,
  thuDienTu    NVARCHAR(100) NOT NULL UNIQUE,
  matKhau      NVARCHAR(255) NOT NULL,
  hoTen        NVARCHAR(100) NOT NULL,
  soDienThoai  VARCHAR(10)  NOT NULL UNIQUE,
  diaChi       NVARCHAR(255) NULL,
  ngayTao      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  trangThai    NVARCHAR(10)  NOT NULL DEFAULT 'hoatdong',
  CONSTRAINT rb_kh_sdt       CHECK (soDienThoai LIKE '0_________'),
  CONSTRAINT rb_kh_trangThai CHECK (trangThai IN ('hoatdong','khoa'))
);

-- 4b. DIA_CHI_PHU (danh sách địa chỉ phụ của khách hàng)
CREATE TABLE DIA_CHI_PHU (
  maDiaChi     INT IDENTITY(1,1) PRIMARY KEY,
  maKhachHang  VARCHAR(10)  NOT NULL,
  tenNguoiNhan NVARCHAR(100) NOT NULL,
  soDienThoai  VARCHAR(10)  NOT NULL,
  thuDienTu    NVARCHAR(100) NULL,
  diaChi       NVARCHAR(255) NOT NULL,
  CONSTRAINT kn_dcp_kh FOREIGN KEY (maKhachHang) REFERENCES KHACH_HANG(maKhachHang)
    ON DELETE CASCADE
);

-- 5. DON_HANG
CREATE TABLE DON_HANG (
  maDonHang            VARCHAR(30)   PRIMARY KEY,
  maKhachHang          VARCHAR(10)   NOT NULL,
  tenNguoiNhan         NVARCHAR(100)  NOT NULL,           -- tên người nhận
  soDienThoaiNhan      VARCHAR(10)   NOT NULL,           -- số điện thoại người nhận
  thuDienTuNguoiNhan   NVARCHAR(100)  NULL,               -- thư điện tử người nhận
  diaChiGiaoHang       NVARCHAR(255)  NOT NULL,           -- địa chỉ giao hàng
  phuongThucThanhToan  NVARCHAR(10)   NOT NULL,
  giaHienThi           VARCHAR(30)   NULL,
  tongTien             DECIMAL(15,0) NOT NULL DEFAULT 0,
  phiVanChuyen         VARCHAR(30)   NULL,
  ngayDat              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  trangThai            NVARCHAR(15)   NOT NULL DEFAULT 'cho-xac-nhan',
  CONSTRAINT kn_dh_kh FOREIGN KEY (maKhachHang) REFERENCES KHACH_HANG(maKhachHang),
  CONSTRAINT rb_dh_thanhToan CHECK (phuongThucThanhToan IN ('COD','PayBank','PayStore')),
  CONSTRAINT rb_dh_tongTien  CHECK (tongTien >= 0),
  CONSTRAINT rb_dh_trangThai CHECK (trangThai IN
    ('cho-xac-nhan','dang-giao','thanh-cong','da-huy'))
);

-- 6. CHI_TIET_DON_HANG
CREATE TABLE CHI_TIET_DON_HANG (
  maDonHang   VARCHAR(30)   NOT NULL,
  maSanPham   VARCHAR(20)   NOT NULL,
  tenSanPham  NVARCHAR(255)  NOT NULL,
  soLuong     INT           NOT NULL,
  donGia      DECIMAL(15,0) NOT NULL,
  thanhTien    AS (soLuong * donGia),
  PRIMARY KEY (maDonHang, maSanPham),
  CONSTRAINT kn_ctdh_dh FOREIGN KEY (maDonHang) REFERENCES DON_HANG(maDonHang)
    ON DELETE CASCADE,
  CONSTRAINT kn_ctdh_sp FOREIGN KEY (maSanPham) REFERENCES SAN_PHAM(maSanPham),
  CONSTRAINT rb_ctdh_soLuong CHECK (soLuong > 0),
  CONSTRAINT rb_ctdh_donGia  CHECK (donGia > 0)
);

-- 7. GIO_HANG
CREATE TABLE GIO_HANG (
  maKhachHang VARCHAR(10) NOT NULL,
  maSanPham   VARCHAR(20) NOT NULL,
  soLuong     INT         NOT NULL,
  PRIMARY KEY (maKhachHang, maSanPham),
  CONSTRAINT kn_gh_kh FOREIGN KEY (maKhachHang) REFERENCES KHACH_HANG(maKhachHang)
    ON DELETE CASCADE,
  CONSTRAINT kn_gh_sp FOREIGN KEY (maSanPham) REFERENCES SAN_PHAM(maSanPham),
  CONSTRAINT rb_gh_soLuong CHECK (soLuong > 0)
);

-- 8. PHIEU_NHAP_HANG
CREATE TABLE PHIEU_NHAP_HANG (
  maPhieuNhap VARCHAR(20)   PRIMARY KEY,                 -- PN...
  ngayNhap    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tongTien    DECIMAL(17,0) NOT NULL DEFAULT 0,
  trangThai   NVARCHAR(15)   NOT NULL DEFAULT 'chuaHoanThanh',
  CONSTRAINT rb_pn_tongTien  CHECK (tongTien >= 0),
  CONSTRAINT rb_pn_trangThai CHECK (trangThai IN ('hoanThanh','chuaHoanThanh'))
);

-- 9. CHI_TIET_PHIEU_NHAP
CREATE TABLE CHI_TIET_PHIEU_NHAP (
  maPhieuNhap  VARCHAR(20)   NOT NULL,
  maSanPham    VARCHAR(20)   NOT NULL,
  tenSanPham   NVARCHAR(255)  NOT NULL,
  soLuongNhap  INT           NOT NULL,
  giaNhap      DECIMAL(15,0) NOT NULL,
  thanhTien     AS (soLuongNhap * giaNhap),
  PRIMARY KEY (maPhieuNhap, maSanPham),
  CONSTRAINT kn_ctpn_pn FOREIGN KEY (maPhieuNhap) REFERENCES PHIEU_NHAP_HANG(maPhieuNhap)
    ON DELETE CASCADE,
  CONSTRAINT kn_ctpn_sp FOREIGN KEY (maSanPham) REFERENCES SAN_PHAM(maSanPham),
  CONSTRAINT rb_ctpn_soLuong CHECK (soLuongNhap > 0),
  CONSTRAINT rb_ctpn_giaNhap CHECK (giaNhap > 0)
);
GO

-- 1. LOAI_SAN_PHAM
INSERT INTO LOAI_SAN_PHAM (maLoai, tenLoai, hinhAnh) VALUES
('L01', N'Giày thể thao', 'giay-the-thao.jpg'),
('L02', N'Giày Sneaker', 'giay-sneaker.jpg'),
('L03', N'Giày chạy bộ', 'giay-chay-bo.jpg'),
('L04', N'Giày thời trang', 'giay-thoi-trang.jpg');

-- 2. SAN_PHAM
INSERT INTO SAN_PHAM (maSanPham, maLoai, tenSanPham, gioiTinh, moTaNgan, mauSac, chatLieu, phongCach, kichCo, giaBan, giaHienThi, hinhAnh, giaNhap, soLuongTon, tongDaNhap, tongDaBan, trangThaiHienThi, moTa, xuatXu) VALUES
('SH-001', 'L02', N'Nike Air Force 1', N'Nam', N'Giày sneaker Nike phong cách trẻ trung', N'Trắng', N'Da tổng hợp', N'Thể thao', '40-44', 1500000, N'1.500.000₫', 'nike-air-force-1.jpg', 1000000, 35, 50, 15, 'visible', N'Giày Nike Air Force 1 phù hợp đi học, đi chơi và sử dụng hằng ngày.', N'Việt Nam'),
('SH-002', 'L02', N'Adidas Superstar', N'Nam', N'Giày Adidas Superstar cổ điển', N'Trắng/Đen', N'Da tổng hợp', N'Casual', '39-43', 1400000, N'1.400.000₫', 'adidas-superstar.jpg', 900000, 28, 40, 12, 'visible', N'Adidas Superstar với thiết kế đơn giản, phù hợp nhiều phong cách.', N'Việt Nam'),
('SH-003', 'L03', N'Nike Revolution 7', N'Nữ', N'Giày chạy bộ Nike nhẹ và thoải mái', N'Hồng', N'Vải dệt', N'Chạy bộ', '36-40', 1200000, N'1.200.000₫', 'nike-revolution-7.jpg', 750000, 25, 35, 10, 'visible', N'Giày chạy bộ có trọng lượng nhẹ, phù hợp luyện tập và chạy bộ hằng ngày.', N'Việt Nam'),
('SH-004', 'L01', N'Puma Smash v2', N'Nam', N'Giày Puma phong cách thể thao', N'Đen', N'Da tổng hợp', N'Thể thao', '39-43', 1100000, N'1.100.000₫', 'puma-smash-v2.jpg', 700000, 20, 30, 10, 'visible', N'Puma Smash v2 có thiết kế đơn giản và dễ phối đồ.', N'Việt Nam'),
('SH-005', 'L03', N'Adidas Duramo SL', N'Nữ', N'Giày chạy bộ Adidas', N'Xanh', N'Vải dệt', N'Chạy bộ', '36-40', 1300000, N'1.300.000₫', 'adidas-duramo-sl.jpg', 800000, 18, 25, 7, 'visible', N'Giày Adidas Duramo SL phù hợp cho việc tập luyện và chạy bộ.', N'Việt Nam'),
('SH-006', 'L04', N'Converse Chuck Taylor', N'Nữ', N'Giày Converse phong cách thời trang', N'Đen', N'Canvas', N'Casual', '36-40', 1000000, N'1.000.000₫', 'converse-chuck-taylor.jpg', 650000, 22, 30, 8, 'visible', N'Converse Chuck Taylor phù hợp đi học và đi chơi.', N'Việt Nam');

-- 3. NHAN_VIEN
INSERT INTO NHAN_VIEN (maNhanVien, tenNhanVien, gioiTinh, soDienThoai, diaChi, chucVu, tenDangNhap, matKhau, trangThai) VALUES
('NV001', N'Nguyễn Văn An', N'Nam', '0901234567', N'Quận 8, TP.HCM', N'Nhân viên bán hàng', 'nguyenvanan', '123456', 'hoatdong'),
('NV002', N'Trần Thị Bình', N'Nữ', '0912345678', N'Quận 5, TP.HCM', N'Nhân viên kho', 'tranthibinh', '123456', 'hoatdong'),
('NV003', N'Lê Minh Anh', N'Nữ', '0923456789', N'Quận 10, TP.HCM', N'Nhân viên CSKH', 'leminhanh', '123456', 'hoatdong'),
('NV004', N'Phạm Quốc Huy', N'Nam', '0934567890', N'Quận 7, TP.HCM', N'Nhân viên kiểm kho', 'phamquochuy', '123456', 'khoa');

-- 4. KHACH_HANG
INSERT INTO KHACH_HANG (maKhachHang, tenDangNhap, thuDienTu, matKhau, hoTen, soDienThoai, diaChi, trangThai) VALUES
('KH001', 'nguyenthia', 'nguyenthia@gmail.com', '123456', N'Nguyễn Thị An', '0941234567', N'Quận 8, TP.HCM', 'hoatdong'),
('KH002', 'tranminh', 'tranminh@gmail.com', '123456', N'Trần Minh', '0952345678', N'Quận 5, TP.HCM', 'hoatdong'),
('KH003', 'lethuy', 'lethuy@gmail.com', '123456', N'Lê Thùy', '0963456789', N'Quận 7, TP.HCM', 'hoatdong'),
('KH004', 'phamhoang', 'phamhoang@gmail.com', '123456', N'Phạm Hoàng', '0974567890', N'Bình Thạnh, TP.HCM', 'hoatdong'),
('KH005', 'doanmai', 'doanmai@gmail.com', '123456', N'Đoàn Mai', '0985678901', N'Thủ Đức, TP.HCM', 'khoa');

-- 5. DIA_CHI_PHU
INSERT INTO DIA_CHI_PHU (maKhachHang, tenNguoiNhan, soDienThoai, thuDienTu, diaChi) VALUES
('KH001', N'Nguyễn Thị An', '0941234567', 'nguyenthia@gmail.com', N'123 Đường Dương Bá Trạc, Quận 8, TP.HCM'),
('KH001', N'Nguyễn Thị An', '0941234567', 'nguyenthia@gmail.com', N'45 Nguyễn Trãi, Quận 5, TP.HCM'),
('KH002', N'Trần Minh', '0952345678', 'tranminh@gmail.com', N'78 Nguyễn Văn Cừ, Quận 5, TP.HCM'),
('KH003', N'Lê Thùy', '0963456789', 'lethuy@gmail.com', N'100 Nguyễn Hữu Thọ, Quận 7, TP.HCM'),
('KH004', N'Phạm Hoàng', '0974567890', 'phamhoang@gmail.com', N'25 Điện Biên Phủ, Bình Thạnh, TP.HCM');

-- 6. DON_HANG
INSERT INTO DON_HANG (maDonHang, maKhachHang, tenNguoiNhan, soDienThoaiNhan, thuDienTuNguoiNhan, diaChiGiaoHang, phuongThucThanhToan, giaHienThi, tongTien, phiVanChuyen, trangThai) VALUES
('DH001', 'KH001', N'Nguyễn Thị An', '0941234567', 'nguyenthia@gmail.com', N'123 Đường Dương Bá Trạc, Quận 8, TP.HCM', 'COD', N'3.000.000₫', 3000000, N'30.000₫', 'cho-xac-nhan'),
('DH002', 'KH002', N'Trần Minh', '0952345678', 'tranminh@gmail.com', N'78 Nguyễn Văn Cừ, Quận 5, TP.HCM', 'PayBank', N'1.400.000₫', 1400000, N'30.000₫', 'dang-giao'),
('DH003', 'KH003', N'Lê Thùy', '0963456789', 'lethuy@gmail.com', N'100 Nguyễn Hữu Thọ, Quận 7, TP.HCM', 'COD', N'2.400.000₫', 2400000, N'30.000₫', 'thanh-cong'),
('DH004', 'KH004', N'Phạm Hoàng', '0974567890', 'phamhoang@gmail.com', N'25 Điện Biên Phủ, Bình Thạnh, TP.HCM', 'PayStore', N'1.100.000₫', 1100000, N'0₫', 'da-huy');

-- 7. CHI_TIET_DON_HANG
INSERT INTO CHI_TIET_DON_HANG (maDonHang, maSanPham, tenSanPham, soLuong, donGia) VALUES
('DH001', 'SH-001', N'Nike Air Force 1', 2, 1500000),
('DH002', 'SH-002', N'Adidas Superstar', 1, 1400000),
('DH003', 'SH-003', N'Nike Revolution 7', 2, 1200000),
('DH004', 'SH-004', N'Puma Smash v2', 1, 1100000);

-- 8. GIO_HANG
INSERT INTO GIO_HANG (maKhachHang, maSanPham, soLuong) VALUES
('KH001', 'SH-003', 1),
('KH001', 'SH-006', 2),
('KH002', 'SH-001', 1),
('KH003', 'SH-005', 1),
('KH004', 'SH-004', 2);

-- 9. PHIEU_NHAP_HANG
INSERT INTO PHIEU_NHAP_HANG (maPhieuNhap, tongTien, trangThai) VALUES
('PN001', 50000000, 'hoanThanh'),
('PN002', 30000000, 'hoanThanh'),
('PN003', 20000000, 'chuaHoanThanh');

-- 10. CHI_TIET_PHIEU_NHAP
INSERT INTO CHI_TIET_PHIEU_NHAP (maPhieuNhap, maSanPham, tenSanPham, soLuongNhap, giaNhap) VALUES
('PN001', 'SH-001', N'Nike Air Force 1', 50, 1000000),
('PN001', 'SH-002', N'Adidas Superstar', 40, 900000),
('PN002', 'SH-003', N'Nike Revolution 7', 35, 750000),
('PN002', 'SH-004', N'Puma Smash v2', 30, 700000),
('PN003', 'SH-005', N'Adidas Duramo SL', 25, 800000),
('PN003', 'SH-006', N'Converse Chuck Taylor', 30, 650000);
