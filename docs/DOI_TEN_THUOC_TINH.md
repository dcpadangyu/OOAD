# Đổi tên thuộc tính dữ liệu sang tiếng Việt (đồng bộ với `database/CuaHangGiay.sql`)

Mọi thuộc tính của đối tượng dữ liệu lưu trong localStorage / IndexedDB dùng **tên tiếng Việt** giống tên cột trong file `database/CuaHangGiay.sql`. Giá trị (value) **không đổi** (ví dụ `"visible"`, `"hidden"`, `"active"`, `"COD"`, `"cho-xac-nhan"`, `"moiDat"` giữ nguyên).

Dữ liệu cũ trong trình duyệt được tự chuyển sang tên mới bởi `database/migrate-schema.js` (chạy 1 lần, cờ `schemaVersion = "vi-1"`).

Chỉ đổi **thuộc tính của đối tượng dữ liệu**. Không đổi: thuộc tính DOM/CSS (`element.id`, `element.style`, `file.name`, `input.value`, `dataset.*`...), tên hàm, tên biến cục bộ, tên key localStorage, body gửi lên OTP server (`email`, `purpose`).

## Sản phẩm (`productsLocal`) — SAN_PHAM
| Cũ | Mới |
|---|---|
| id | maSanPham |
| catalog | maLoai (giá trị là tên hãng, vd "Nike", dùng như khóa tự nhiên của loại) |
| name | tenSanPham |
| gender | gioiTinh |
| desc | moTaNgan |
| color | mauSac |
| material | chatLieu |
| style | phongCach |
| size | kichCo |
| sizeStock | tonKhoTheoSize |
| priceValue | giaBan |
| price | giaHienThi |
| image | hinhAnh |
| importPrice | giaNhap |
| quantity | soLuongTon |
| importQuantity | tongDaNhap |
| soldQuantity | tongDaBan |
| visibility | trangThaiHienThi |
| description | moTa |
| origin | xuatXu |

## Loại sản phẩm (`categories`) — LOAI_SAN_PHAM
| Cũ | Mới |
|---|---|
| id | maLoai (= tên loại, khóa tự nhiên; khớp `maLoai` của sản phẩm) |
| name | tenLoai |
| description | moTa |
| productCount | soSanPham |
| status | trangThai |
| createdAt | ngayTao |

(Khi đổi tên loại: cập nhật cả `maLoai` lẫn `tenLoai` của loại và `maLoai` của các sản phẩm.)

## Giỏ hàng (`cart`) — GIO_HANG
| Cũ | Mới |
|---|---|
| id | maSanPham |
| name | tenSanPham |
| catalog | maLoai |
| image | hinhAnh |
| price | giaHienThi |
| priceValue | giaBan |
| selectedSize | kichCoDaChon |
| quantity | soLuong |

## Đơn hàng phía User (`DanhSachDatHang`, `CurrDanhSachDatHang`) — DON_HANG + CHI_TIET_DON_HANG
Đối tượng `info` được **làm phẳng** vào đơn; `user` → `khachHang`; `product[]` → `chiTiet[]`.

| Cũ | Mới |
|---|---|
| id | maDonHang |
| userId | maKhachHang |
| info.name | tenNguoiNhan |
| info.phone | soDienThoaiNhan |
| info.email | thuDienTuNguoiNhan |
| info.address | diaChiGiaoHang |
| user `{id,userName,name,email,phone}` | khachHang `{maKhachHang, hoTen, thuDienTu, soDienThoai}` |
| product[] | chiTiet[] |
| payment | phuongThucThanhToan |
| paymentStatus | trangThaiThanhToan |
| subtotal | tamTinh |
| shippingFee | tienVanChuyen |
| price (tổng, chuỗi) | giaHienThi |
| totalPrice | tongTien |
| priceShip | phiVanChuyen |
| orderDate | ngayDat |
| trangthai | trangThai (giá trị: cho-xac-nhan / dang-giao / thanh-cong / da-huy) |
| status | trangThaiQuanTri (giá trị: moiDat / daXuLy / daGiao / huy) |
| stockDeducted | daTruKho |
| (mới) | hetHanLuc — thời điểm hết hạn (ms) của đơn chuyển khoản tạm trong `CurrDanhSachDatHang` |

Dòng chi tiết (`chiTiet[]`, dùng chung cho cả đơn User lẫn đơn Admin):

| Cũ (user: product[]) | Cũ (admin: items[]) | Mới |
|---|---|---|
| id | productId | maSanPham |
| name | name | tenSanPham |
| catalog | — | maLoai |
| image | — | hinhAnh |
| price | — | giaHienThi |
| priceValue | price | donGia |
| selectedSize | size | kichCoDaChon |
| quantity | qty | soLuong |
| — | returned | daTra |

## Đơn hàng phía Admin (`ordersLocal`)
| Cũ | Mới |
|---|---|
| id | maDonHang |
| date | ngayDat |
| customerName | tenNguoiNhan |
| phone | soDienThoaiNhan |
| address.street | diaChiGiaoHang (chuỗi) |
| address.email | thuDienTuNguoiNhan |
| items[] | chiTiet[] |
| total | tongTien |
| status | trangThaiQuanTri |
| paymentMethod | phuongThucThanhToan |
| paymentStatus | trangThaiThanhToan |
| stockDeducted | daTruKho |
| shippingFee | tienVanChuyen |
| userId | maKhachHang |
| userName | hoTen |
| note | ghiChu |

## Thuộc tính bổ sung cho đơn hàng Admin (`ordersLocal` / `DanhSachDatHang`)
Do Admin ghi khi đổi trạng thái đơn (không có tên cũ): `ngayGiao` (khi giao, doanh thu tính theo ngày này), `ngayHuy`, `ngayHoanTien`; `chiTiet[].giaVon` (giá nhập chốt lúc giao, dùng tính lợi nhuận gộp); `trangThaiThanhToan` có thêm giá trị `refunded` (đã hoàn tiền) sau `refund` (cần hoàn tiền).

## Khách hàng (`userList`, `currentUser`) — KHACH_HANG
| Cũ | Mới |
|---|---|
| id | maKhachHang |
| username / loginUsername | tenDangNhap |
| userName / displayName / name | hoTen |
| email | thuDienTu |
| password | matKhau |
| phone | soDienThoai |
| address | diaChi |
| avatar | anhDaiDien |
| addresses | diaChiPhu |
| createdAt / registeredAt | ngayTao |
| status | trangThai (giá trị giữ nguyên: active / blocked ...) |
| locked | biKhoa |
| lockDate | ngayKhoa |
| customerCode | maKH (mã hiển thị KH001, KH002...) |
| passwordReset | daDatLaiMatKhau |
| resetDate | ngayDatLaiMatKhau |

Địa chỉ (`diaChiPhu[]` và `selectedAddress`) — DIA_CHI_PHU:

| Cũ | Mới |
|---|---|
| id | maDiaChi |
| name | tenNguoiNhan |
| phone | soDienThoai |
| email | thuDienTu |
| address | diaChi |
| default | macDinh |

## Nhân viên (`employeeList`) — NHAN_VIEN
| Cũ | Mới |
|---|---|
| sdt | soDienThoai |
| username | tenDangNhap |
| password | matKhau |
| maNhanVien, tenNhanVien, gioiTinh, diaChi, chucVu, ngayTao, trangThai | giữ nguyên |

## Phiếu nhập (`phieuNhapLocal`) — PHIEU_NHAP_HANG + CHI_TIET_PHIEU_NHAP
Đã là tiếng Việt: `maPhieuNhap, ngayNhap, chiTiet[{maSanPham, kichCo, tenSanPham, soLuongNhap, giaNhap, thanhTien}], tongTien, trangThai (hoanThanh/chuaHoanThanh/daHuy)`. Thuộc tính mới: `nhaCungCap, nguoiLap, nguoiDuyet, ngayHoanThanh, ngayHuy, nguoiHuy` và `kichCo` ở dòng chi tiết (phiếu mẫu cũ không có `kichCo` → khi hoàn thành số lượng được chia đều các size).

## Đánh giá (IndexedDB `ooad_feedback`)
| Cũ | Mới |
|---|---|
| id | maDanhGia |
| orderId | maDonHang |
| productId | maSanPham |
| productName | tenSanPham |
| catalog | maLoai |
| size | kichCoDaChon |
| userId | maKhachHang |
| userName | hoTen |
| rating | soSao |
| comment | binhLuan |
| media[] `{type,name,blob}` | tepDinhKem[] `{loai, ten, tep}` |
| createdAt | ngayTao |
| status | trangThai (moi / dangXuLy / daXuLy) |
| assignedTo `{username,name}` | nguoiXuLy `{tenDangNhap, hoTen}` |
| receivedAt | ngayTiepNhan |
| reply `{text,by,username,at}` | phanHoi `{noiDung, nguoiGui, tenDangNhap, thoiGian, capNhatLuc}` (thoiGian = lần trả lời đầu, capNhatLuc = lần sửa gần nhất) |
| hidden | daAn |

Chỉ mục IndexedDB: `maSanPham`, `maKhachHang`, `ngayTao` (DB version 2, tự nâng cấp bản ghi cũ).
