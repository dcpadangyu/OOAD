from pathlib import Path
import re
import xml.etree.ElementTree as ET
import zipfile
import textwrap
from PIL import Image, ImageDraw, ImageFont

BASE = Path(__file__).resolve().parents[2]
OUT = BASE / 'output'
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with zipfile.ZipFile(BASE / 'docs/Dac_ta_use_case.docx') as z:
    doc = ET.fromstring(z.read('word/document.xml'))
paragraphs = [''.join(t.text or '' for t in p.findall('.//w:t', NS)) for p in doc.findall('.//w:p', NS)]
titles = {}
for p in paragraphs:
    match = re.match(r'^1\.\d+\.\d+\. UC(\d+)\s*[–-]\s*(.+)', p)
    if match:
        titles[int(match[1])] = match[2]

# A: tác nhân, U: giao diện, C: xử lý, D: CSDL. Chỉ có kịch bản thành công.
cases = {}
def put(n, actor, scenario, messages):
    cases[n] = dict(actor=actor, scenario=scenario, messages=messages)

def read(n, actor, action, query, result, display, extra=(), scenario='Xem thông tin thành công'):
    put(n, actor, scenario, [
        ('AU', action), ('UC', 'Yêu cầu dữ liệu'), ('CD', query), ('DC', result),
        ('CU', 'Trả dữ liệu hiển thị'), ('UA', display), *extra])

def save(n, actor, action, form, submit, check, persist, scenario='Lưu thông tin thành công', initial=()):
    put(n, actor, scenario, [
        ('AU', action), *initial, ('UA', form), ('AU', submit),
        ('UC', 'Gửi dữ liệu và mã tác nhân'), ('CC', check), ('CD', persist),
        ('DC', 'Xác nhận lưu thành công'), ('CU', 'Trả kết quả thành công'), ('UA', 'Thông báo thành công, cập nhật hiển thị')])

put(1, 'Người dùng', 'Đăng nhập hợp lệ trên trang theo vai trò', [
    ('AU', 'Chọn Đăng nhập trên trang phù hợp'), ('UA', 'Hiện tên đăng nhập, mật khẩu, Ghi nhớ đăng nhập'),
    ('AU', 'Nhập thông tin và nhấn Đăng nhập'), ('UC', 'Gửi thông tin đăng nhập và loại trang'),
    ('CC', 'Kiểm tra dữ liệu đầy đủ, đúng định dạng'), ('CD', 'Lấy tài khoản theo tên đăng nhập và loại trang'),
    ('DC', 'Trả tài khoản đang hoạt động'), ('CC', 'Xác thực mật khẩu và tạo phiên làm việc'),
    ('CU', 'Trả phiên và giao diện đích'), ('UA', 'Chuyển đến giao diện đúng vai trò')])
put(2, 'Người dùng', 'Đăng xuất thành công', [
    ('AU', 'Chọn Đăng xuất'), ('UC', 'Yêu cầu kết thúc phiên'), ('CC', 'Hủy phiên và xóa thông tin đăng nhập'),
    ('CU', 'Xác nhận đã đăng xuất'), ('UA', 'Chuyển về trang đăng nhập hoặc trang chủ')])
put(3, 'Khách hàng', 'Đặt lại mật khẩu bằng OTP hợp lệ', [
    ('AU', 'Chọn Quên mật khẩu'), ('UA', 'Hiển thị form nhập email đã đăng ký'),
    ('AU', 'Nhập email và yêu cầu gửi OTP'), ('UC', 'Yêu cầu OTP đặt lại mật khẩu'),
    ('CD', 'Lấy tài khoản theo email'), ('DC', 'Trả tài khoản không bị khóa'),
    ('CC', 'Tạo OTP có hạn và gửi đến email khách'), ('CU', 'Xác nhận đã gửi OTP'),
    ('UA', 'Hiển thị form OTP và mật khẩu mới'), ('AU', 'Nhập OTP, mật khẩu mới và xác nhận'),
    ('UC', 'Gửi OTP và mật khẩu mới'), ('CC', 'Xác thực OTP, mật khẩu ≥ 8 ký tự và khớp xác nhận'),
    ('CD', 'Lưu mật khẩu đã mã hóa; vô hiệu hóa OTP'), ('DC', 'Cập nhật thành công'),
    ('CU', 'Xác nhận đặt lại thành công'), ('UA', 'Thông báo và chuyển về đăng nhập')])
put(4, 'Khách hàng', 'Đăng ký và xác thực OTP thành công', [
    ('AU', 'Chọn Đăng ký'), ('UA', 'Hiện tên đăng nhập, email, SĐT, địa chỉ, mật khẩu'),
    ('AU', 'Nhập thông tin, xác nhận mật khẩu và gửi'), ('UC', 'Gửi dữ liệu đăng ký'),
    ('CC', 'Kiểm tra tên, SĐT, mật khẩu và xác nhận'), ('CD', 'Kiểm tra tên đăng nhập, email chưa được dùng'),
    ('DC', 'Xác nhận dữ liệu không trùng'), ('CC', 'Tạo OTP và gửi email xác thực'),
    ('CU', 'Yêu cầu xác thực email'), ('UA', 'Hiển thị form nhập OTP'), ('AU', 'Nhập OTP hợp lệ'),
    ('UC', 'Gửi OTP đăng ký'), ('CC', 'Xác thực OTP và mã hóa mật khẩu'),
    ('CD', 'Tạo tài khoản khách hàng'), ('DC', 'Tạo thành công'), ('CU', 'Trả kết quả đăng ký'),
    ('UA', 'Thông báo thành công và chuyển về đăng nhập')])
save(5, 'Khách hàng', 'Mở Thông tin cá nhân', 'Hiển thị thông tin cá nhân hiện tại',
     'Chỉnh sửa thông tin và nhấn Lưu', 'Kiểm tra dữ liệu cá nhân hợp lệ', 'Cập nhật thông tin của khách đang đăng nhập',
     initial=[('UC','Lấy thông tin khách hiện tại'),('CD','Truy vấn theo mã khách'),('DC','Trả thông tin cá nhân'),('CU','Trả dữ liệu form')])
put(6, 'Khách hàng', 'Đổi bằng mật khẩu hiện tại hợp lệ', [
    ('AU', 'Chọn Đổi mật khẩu'), ('UA', 'Hiện mật khẩu hiện tại, mới và xác nhận'),
    ('AU', 'Nhập thông tin và nhấn Xác nhận'), ('UC', 'Gửi dữ liệu đổi mật khẩu'),
    ('CD', 'Lấy mật khẩu đã mã hóa của tài khoản'), ('DC', 'Trả thông tin xác thực'),
    ('CC', 'Xác thực mật khẩu cũ; mới ≥ 8 ký tự, khác cũ, khớp xác nhận'),
    ('CD', 'Lưu mật khẩu mới đã mã hóa'), ('DC', 'Cập nhật thành công'), ('CC', 'Kết thúc phiên khách hàng'),
    ('CU', 'Trả kết quả và yêu cầu đăng nhập lại'), ('UA', 'Thông báo, chuyển về trang đăng nhập')])
read(7, 'Admin', 'Mở Quản lý khách hàng', 'Lấy danh sách tài khoản khách hàng', 'Trả mã, tên, SĐT, email, ngày tạo, trạng thái',
     'Hiển thị danh sách khách hàng', [('AU','Chọn khách để xem lịch sử mua hàng'),('UC','Tham chiếu UC08 — Xem lịch sử mua hàng')])
read(8, 'Admin', 'Chọn khách và mở Lịch sử mua hàng', 'Lấy đơn theo mã khách, mới nhất trước', 'Trả mã đơn, ngày, tổng tiền, trạng thái',
     'Hiển thị lịch sử của khách đã chọn', [('AU','Chọn đơn xem chi tiết'),('UC','Tham chiếu UC34 — Xem chi tiết đơn hàng')])
save(9, 'Admin', 'Chọn Thêm nhân viên', 'Hiện họ tên, giới tính, SĐT, địa chỉ, chức vụ, tên đăng nhập, mật khẩu',
     'Nhập thông tin, chọn chức vụ và Lưu', 'Kiểm tra SĐT, mật khẩu chữ và số ≥ 8 ký tự; mã hóa mật khẩu',
     'Kiểm tra không trùng và tạo nhân viên theo chức vụ')
save(10, 'Admin', 'Chọn nhân viên cần sửa', 'Hiện thông tin; tên đăng nhập chỉ đọc', 'Sửa thông tin và nhấn Lưu',
     'Kiểm tra hợp lệ; mã hóa mật khẩu mới nếu có', 'Cập nhật thông tin nhân viên',
     scenario='Sửa thông tin nhân viên thành công',
     initial=[('UC','Lấy thông tin nhân viên'),('CD','Truy vấn nhân viên đã chọn'),('DC','Trả thông tin hiện tại'),('CU','Trả dữ liệu form')])
put(11, 'Admin', 'Thay chức vụ nhân viên thành công', [
    ('AU','Chọn nhân viên cần phân quyền'),('UC','Lấy chức vụ hiện tại'),('CD','Truy vấn chức vụ nhân viên'),
    ('DC','Trả chức vụ hiện tại'),('CU','Trả chức vụ và các lựa chọn'),('UA','Hiện bán hàng, kho, kiểm kho, CSKH'),
    ('AU','Chọn chức vụ mới và nhấn Lưu'),('UC','Gửi mã nhân viên và chức vụ mới'),('CC','Kiểm tra chức vụ hợp lệ'),
    ('CD','Cập nhật chức vụ và quyền theo chức vụ'),('DC','Cập nhật thành công'),('CC','Kết thúc phiên nhân viên để áp dụng quyền mới'),
    ('CU','Trả kết quả phân quyền'),('UA','Thông báo phân quyền thành công')])
put(12, 'Khách hàng', 'Tìm kiếm sản phẩm có kết quả', [
    ('AU','Nhập từ khóa tìm kiếm'),('UC','Gửi từ khóa gợi ý'),('CD','Tìm tối đa 6 sản phẩm phù hợp'),('DC','Trả danh sách gợi ý'),
    ('CU','Trả gợi ý sản phẩm'),('UA','Hiển thị gợi ý'),('AU','Nhấn Enter để tìm kiếm'),('UC','Tìm sản phẩm theo từ khóa'),
    ('CD','Lưu tối đa 6 từ khóa gần nhất; truy vấn sản phẩm'),('DC','Trả ảnh, tên, giá, điểm đánh giá'),
    ('CU','Trả danh sách kết quả'),('UA','Hiển thị các sản phẩm phù hợp'),('AU','Chọn một sản phẩm'),('UC','Tham chiếu UC14 — Chi tiết sản phẩm')])
read(13,'Khách hàng','Chọn tiêu chí giá, màu, chất liệu, phong cách, giới tính, size',
     'Lọc sản phẩm thỏa tất cả tiêu chí; phân trang 15 dòng','Trả sản phẩm phù hợp và tổng số trang',
     'Hiển thị ngay danh sách sau khi thay đổi tiêu chí')
read(14,'Khách hàng','Chọn một sản phẩm','Lấy sản phẩm, tồn theo size và đánh giá Hiển thị',
     'Trả ảnh, tên, mô tả, giá, màu, chất liệu, phong cách, giới tính, size, đánh giá',
     'Hiện chi tiết; khóa size hết hàng, báo số đôi sắp hết')
read(15,'Khách hàng','Chọn Sản phẩm khuyến mãi','Lấy sản phẩm thuộc khuyến mãi còn hiệu lực',
     'Trả ảnh, tên, giá gốc, giá giảm, mức giảm','Hiển thị danh sách sản phẩm khuyến mãi',
     [('AU','Chọn sản phẩm xem chi tiết'),('UC','Tham chiếu UC14 — Chi tiết sản phẩm')])
save(16,'Nhân viên bán hàng','Chọn Thêm sản phẩm',
     'Hiện mã, hãng, danh mục, tên, thuộc tính, giá nhập, size, mô tả, ảnh',
     'Nhập thông tin và nhấn Lưu','Kiểm tra giá nhập > 0, ảnh, size và mã không trùng',
     'Lưu sản phẩm; khởi tạo tồn bằng 0 ở mọi size')
put(17,'Nhân viên bán hàng','Xóa sản phẩm không có ràng buộc',[('AU','Chọn sản phẩm và nhấn Xóa'),('UA','Hiển thị hộp thoại xác nhận'),
    ('AU','Xác nhận xóa'),('UC','Gửi mã sản phẩm cần xóa'),('CD','Lấy thông tin ràng buộc sản phẩm'),('DC','Trả kết quả không có ràng buộc'),
    ('CC','Xác nhận đủ điều kiện xóa'),('CD','Xóa sản phẩm'),('DC','Xóa thành công'),('CU','Trả kết quả và danh sách mới'),('UA','Thông báo, cập nhật danh sách')])
save(18,'Nhân viên bán hàng','Chọn sản phẩm cần sửa','Hiện dữ liệu; mã sản phẩm không đổi, tồn không sửa tay',
     'Sửa thuộc tính hoặc thêm size và Lưu','Kiểm tra dữ liệu, điều kiện ẩn/hiện và size',
     'Cập nhật thông tin sản phẩm; giữ nguyên số lượng tồn',initial=[('UC','Lấy thông tin sản phẩm'),('CD','Truy vấn sản phẩm và size'),('DC','Trả thông tin'),('CU','Trả form hiện tại')])
save(19,'Admin','Mở Quản lý danh mục, chọn Thêm','Hiện danh sách và form tên, mô tả',
     'Nhập danh mục mới và nhấn Lưu','Kiểm tra dữ liệu danh mục hợp lệ','Lưu danh mục, cập nhật dữ liệu hiển thị',
     scenario='Thêm danh mục thành công',initial=[('UC','Lấy danh sách danh mục'),('CD','Truy vấn danh mục'),('DC','Trả tên, mô tả, số sản phẩm, trạng thái'),('CU','Trả danh sách')])
save(20,'Admin','Mở Quản lý thương hiệu, chọn Thêm','Hiện danh sách và form thông tin thương hiệu',
     'Nhập thương hiệu mới và nhấn Lưu','Kiểm tra dữ liệu thương hiệu hợp lệ','Lưu thương hiệu, cập nhật dữ liệu hiển thị',
     scenario='Thêm thương hiệu thành công',initial=[('UC','Lấy danh sách thương hiệu'),('CD','Truy vấn thương hiệu'),('DC','Trả tên, mô tả và số sản phẩm'),('CU','Trả danh sách')])
save(21,'Admin','Mở Quản lý khuyến mãi, chọn Thêm','Hiện form tên, mô tả, giảm %, ngày bắt đầu/kết thúc',
     'Nhập chương trình, chọn sản phẩm áp dụng và Lưu','Kiểm tra mức giảm, thời gian, sản phẩm áp dụng',
     'Lưu chương trình và sản phẩm áp dụng; cập nhật giá hiển thị',scenario='Tạo chương trình khuyến mãi thành công')
put(22,'Khách hàng','Thêm sản phẩm còn hàng vào giỏ',[('AU','Chọn size và nhấn Thêm vào giỏ hàng'),('UC','Gửi mã sản phẩm và size'),
    ('CD','Lấy tồn kho đúng size'),('DC','Trả số lượng còn hàng'),('CC','Kiểm tra size và số lượng khả dụng'),
    ('CD','Thêm hoặc tăng 1 sản phẩm cùng size trong giỏ'),('DC','Cập nhật giỏ thành công'),('CU','Trả giỏ hàng mới'),('UA','Thông báo thêm vào giỏ thành công')])
put(23,'Khách hàng','Mua ngay khi khách đã đăng nhập',[('AU','Chọn size và nhấn Mua ngay'),('UC','Gửi mã sản phẩm, size'),
    ('CD','Lấy tồn kho đúng size'),('DC','Trả số lượng khả dụng'),('CC','Kiểm tra size và tồn kho'),
    ('CD','Thêm vào giỏ, chỉ chọn dòng vừa thêm để thanh toán'),('DC','Cập nhật giỏ thành công'),
    ('CU','Trả dòng được chọn và chuyển checkout'),('UA','Mở trang đặt hàng — UC30')])
read(24,'Khách hàng','Mở Giỏ hàng','Lấy giỏ và đối chiếu dữ liệu sản phẩm mới nhất',
     'Trả ảnh, tên, size, đơn giá, số lượng, thành tiền','Hiển thị các dòng trong giỏ',
     [('AU','Tích chọn các dòng cần thanh toán'),('UC','Gửi danh sách dòng đã chọn'),('CC','Tính tổng theo các dòng đã chọn'),('CU','Trả tổng tiền được chọn'),('UA','Hiển thị tổng tiền thanh toán')])
put(25,'Khách hàng','Tăng số lượng còn đủ tồn kho',[('AU','Tăng số lượng một dòng trong giỏ'),('UC','Gửi mã sản phẩm, size, số lượng mới'),
    ('CD','Lấy tồn kho đúng size'),('DC','Trả số lượng khả dụng'),('CC','Kiểm tra số lượng mới không vượt tồn'),
    ('CD','Cập nhật số lượng trong giỏ'),('DC','Cập nhật thành công'),('CC','Tính lại thành tiền và tổng tiền đã chọn'),
    ('CU','Trả giỏ và tổng tiền mới'),('UA','Hiển thị giỏ sau khi cập nhật')])
put(26,'Khách hàng','Chọn phương thức COD thành công',[('AU','Chọn Thanh toán tại bước đặt hàng'),('UC','Yêu cầu tóm tắt thanh toán'),
    ('CD','Lấy giá sản phẩm và voucher hợp lệ'),('DC','Trả dữ liệu tính tiền'),
    ('CC','Tính giảm voucher, ship 30.000đ; miễn ship từ 10.000.000đ'),('CU','Trả tạm tính, giảm, ship và tổng tiền'),
    ('UA','Hiện tóm tắt và hai phương thức COD/chuyển khoản'),('AU','Chọn COD'),('UC','Tham chiếu UC27 — Thanh toán khi nhận hàng')])
put(27,'Khách hàng','Đặt COD thành công',[('AU','Chọn Thanh toán khi nhận hàng'),('UC','Yêu cầu tóm tắt thanh toán'),
    ('CD','Lấy giỏ đã chọn, giá, voucher và tồn đúng size'),('DC','Trả dữ liệu thanh toán'),
    ('CC','Tính tạm tính, giảm voucher, ship và tổng tiền'),('CU','Trả tóm tắt đơn'),('UA','Hiện tạm tính, giảm giá, phí ship, tổng phải trả'),
    ('AU','Xác nhận đặt hàng'),('UC','Gửi dữ liệu đặt hàng COD'),('CC','Kiểm tra tồn và dữ liệu đơn hợp lệ'),
    ('CD','Tạo đơn Chờ xác nhận; COD/Chưa thanh toán; trừ tồn đúng size; xóa dòng giỏ đã đặt'),
    ('DC','Trả mã đơn chính thức'),('CU','Trả kết quả đặt hàng'),('UA','Thông báo thành công kèm mã đơn'),
    ('CC','Khi giao thành công: thực hiện cập nhật thanh toán trong UC36')])
put(28,'Khách hàng','Chuyển khoản hoàn tất thành công',[('AU','Chọn Thanh toán chuyển khoản'),('UC','Gửi thông tin checkout'),
    ('CC','Tính tổng sau voucher và phí vận chuyển'),('CD','Lưu đơn tạm hạn 30 phút, chưa trừ tồn'),('DC','Trả mã đơn tạm và dữ liệu QR'),
    ('CU','Trả QR ngân hàng, số tiền, nội dung chuyển khoản'),('UA','Hiển thị QR và hướng dẫn thanh toán'),
    ('AU','Chuyển khoản và nhấn Đã hoàn tất chuyển khoản'),('UC','Gửi xác nhận hoàn tất và mã đơn tạm'),
    ('CD','Lấy lại tồn đúng size và dữ liệu voucher hiện tại'),('DC','Trả tồn và voucher còn hợp lệ'),
    ('CC','Kiểm tra lại tồn, voucher và tổng tiền'),
    ('CD','Tạo đơn chính thức Chờ xác nhận/Đã thanh toán; trừ kho, ghi nhận voucher, xóa dòng giỏ và đơn tạm'),
    ('DC','Trả mã đơn chính thức'),('CU','Trả kết quả đặt hàng'),('UA','Thông báo đặt hàng thành công kèm mã đơn')])
put(29,'Nhân viên bán hàng','Đối chiếu chuyển khoản nhận đủ tiền',[('AU','Mở chi tiết đơn chuyển khoản'),('UC','Yêu cầu thông tin thanh toán'),
    ('CD','Lấy số tiền, phương thức, trạng thái, thời điểm khách xác nhận'),('DC','Trả dữ liệu thanh toán'),
    ('CU','Trả thông tin đối chiếu'),('UA','Hiện số phải trả sau voucher, ship và trạng thái'),
    ('AU','Đối chiếu nhận đủ tiền và chọn Xác nhận đã nhận tiền'),('UC','Gửi kết quả đối chiếu và mã nhân viên'),
    ('CD','Lưu kết quả, người xác nhận và thời điểm'),('DC','Lưu thành công'),('CU','Trả kết quả xác nhận'),('UA','Thông báo xác nhận thành công')])
put(30,'Khách hàng','Đặt hàng COD; chuyển khoản xem UC28',[('AU','Chọn Đặt hàng từ các dòng giỏ đã chọn'),('UC','Lấy dữ liệu checkout'),
    ('CD','Lấy sản phẩm, địa chỉ chọn và voucher dùng được'),('DC','Trả dữ liệu checkout'),('CC','Tính tạm tính, giảm voucher, ship và tổng tiền'),
    ('CU','Trả thông tin đặt hàng'),('UA','Hiện sản phẩm, địa chỉ, voucher, tạm tính, ship và tổng'),
    ('AU','Chọn địa chỉ, voucher và phương thức COD'),('UC','Cập nhật lựa chọn checkout'),('CC','Áp dụng địa chỉ UC31 và voucher UC60'),
    ('CU','Trả tổng tiền và thông tin cuối'),('UA','Hiển thị đơn để xác nhận'),('AU','Xác nhận đặt hàng'),
    ('UC','Tham chiếu UC27 — Tạo đơn COD và trừ kho đúng size'),('CU','Trả mã đơn đã tạo một lần tại UC27'),('UA','Hiển thị mã đơn và đặt hàng thành công')])
put(31,'Khách hàng','Chọn một địa chỉ đã lưu',[('AU','Chọn Đổi địa chỉ tại checkout'),('UC','Lấy danh sách địa chỉ của khách'),
    ('CD','Truy vấn địa chỉ và địa chỉ mặc định'),('DC','Trả danh sách địa chỉ'),('CU','Trả dữ liệu chọn địa chỉ'),('UA','Hiển thị các địa chỉ đã lưu'),
    ('AU','Chọn địa chỉ nhận hàng'),('UC','Gửi mã địa chỉ đã chọn'),('CC','Kiểm tra địa chỉ thuộc khách; gán cho đơn đang đặt'),
    ('CU','Trả địa chỉ nhận hàng'),('UA','Hiển thị địa chỉ mới trên checkout')])
read(32,'Nhân viên bán hàng','Mở Quản lý đơn hàng','Lấy đơn mới nhất, 10 dòng/trang và tổng theo trạng thái',
     'Trả danh sách và thẻ tổng quan','Hiển thị danh sách đơn hàng',
     [('AU','Đổi bộ lọc ngày, trạng thái đơn và thanh toán'),('UC','Gửi các tiêu chí lọc'),('CD','Lọc đơn theo tất cả tiêu chí'),('DC','Trả danh sách đã lọc'),('CU','Trả kết quả lọc'),('UA','Hiển thị ngay danh sách phù hợp')])
read(33,'Nhân viên bán hàng','Nhập mã đơn trong Quản lý đơn hàng','Tìm đơn theo mã đã nhập','Trả danh sách đơn phù hợp',
     'Hiển thị kết quả tìm kiếm',[('AU','Chọn một đơn'),('UC','Tham chiếu UC34 — Chi tiết đơn hàng')])
read(34,'Khách hàng','Chọn một đơn hàng của mình','Lấy đơn, sản phẩm theo size, nhận hàng và thanh toán',
     'Trả mã, ngày, trạng thái, dòng hàng, voucher, phí ship, tổng',
     'Hiển thị đầy đủ thông tin chi tiết đơn')
read(35,'Khách hàng','Chọn đơn cần theo dõi','Lấy trạng thái hiện tại và thời điểm giao/hủy',
     'Trả Chờ xác nhận, Đang giao, Thành công hoặc Đã hủy',
     'Hiển thị tiến trình và thời điểm tương ứng',
     [('UC','Tải lại trạng thái khi nhân viên cập nhật'),('CD','Lấy trạng thái mới nhất của đơn'),('DC','Trả trạng thái mới nhất'),('CU','Trả tiến trình mới'),('UA','Cập nhật tiến trình đơn hàng')])
put(36,'Nhân viên bán hàng','Cập nhật giao thành công',[('AU','Chọn đơn đang giao cần cập nhật'),('UC','Yêu cầu trạng thái và lựa chọn chuyển'),
    ('CD','Lấy đơn và trạng thái hiện tại'),('DC','Trả dữ liệu đơn'),('CC','Xác định các trạng thái hợp lệ'),('CU','Trả trạng thái và lựa chọn'),
    ('UA','Hiện trạng thái hiện tại và lựa chọn Đã giao'),('AU','Chọn Đã giao và nhấn Cập nhật'),('UA','Hiển thị hộp thoại xác nhận'),
    ('AU','Xác nhận cập nhật'),('UC','Gửi yêu cầu giao thành công'),('CC','Kiểm tra quyền và điều kiện chuyển trạng thái'),
    ('CD','Lưu giao thành công, thời điểm, giá vốn; cộng đã bán; thanh toán Đã thanh toán; lưu tin cảm ơn'),
    ('DC','Cập nhật thành công'),('CU','Trả kết quả và trạng thái mới'),('UA','Thông báo; đồng bộ trạng thái phía khách')])
put(37,'Khách hàng','Hủy đơn COD còn Chờ xác nhận thành công',[('AU','Mở đơn của mình và chọn Hủy đơn hàng'),('UC','Yêu cầu hủy và mã đơn'),
    ('CD','Lấy chủ đơn, trạng thái đơn và các size đã đặt'),('DC','Trả đơn COD đang Chờ xác nhận'),('CC','Kiểm tra quyền sở hữu và điều kiện hủy'),
    ('CU','Cho phép xác nhận hủy'),('UA','Hiển thị hộp thoại xác nhận'),('AU','Xác nhận hủy'),('UC','Gửi xác nhận hủy'),
    ('CD','Lưu Đã hủy và thời điểm; hoàn lại tồn đúng size'),('DC','Hủy đơn thành công'),('CU','Trả kết quả hủy'),('UA','Thông báo hủy thành công')])
read(38,'Nhân viên kho','Mở Quản lý tồn kho','Tổng hợp tồn tổng/theo size, nhập, bán, chờ giao, giá trị',
     'Trả thẻ tổng quan và danh sách tồn kho','Hiển thị tồn, đã nhập, đã bán, chờ giao, giá bán, giá trị',
     [('AU','Chọn bộ lọc danh mục, size, mã, tình trạng, ngày'),('UC','Gửi tiêu chí tồn kho'),('CD','Truy vấn tồn theo bộ lọc'),('DC','Trả danh sách phù hợp'),('CU','Trả kết quả lọc'),('UA','Hiển thị kết quả; cho phép xuất CSV')])
put(39,'Nhân viên kiểm kho','Kiểm tra và lọc tình trạng hàng',[('AU','Mở Quản lý tồn kho — UC38'),('UC','Yêu cầu phân loại tình trạng hàng'),
    ('CD','Lấy tồn từng size và ngưỡng cảnh báo, mặc định 10 đôi'),('DC','Trả tồn và ngưỡng hiện tại'),
    ('CC','Phân loại tổng tồn; màu size: ≥3 đôi, 1–2 đôi, hết'),('CU','Trả tình trạng và số sản phẩm mỗi tab'),('UA','Hiện Bình thường, Sắp hết, Hết hàng và màu size'),
    ('AU','Chọn tab Sắp hết hàng'),('UC','Lọc theo tình trạng Sắp hết'),('CC','Lọc dữ liệu đã phân loại'),('CU','Trả danh sách sắp hết'),('UA','Hiển thị mặt hàng cần nhập thêm')])
save(40,'Nhân viên kho','Chọn Thêm phiếu nhập','Hiện ngày, nhà cung cấp, trạng thái, mặt hàng; mã tự sinh',
     'Nhập sản phẩm, size, lượng, giá; chọn Hoàn thành và Lưu',
     'Kiểm tra phiếu, sản phẩm, size, số lượng và giá nhập',
     'Sinh mã, lưu phiếu và người lập; cộng tồn đúng size, tổng nhập, giá vốn',scenario='Tạo phiếu Hoàn thành và cộng kho thành công')
put(41,'Nhân viên kho','Xóa phiếu chưa hoàn thành; không đổi tồn',[('AU','Chọn phiếu chưa hoàn thành và nhấn Xóa'),('UA','Hiển thị hộp thoại xác nhận'),
    ('AU','Xác nhận xóa'),('UC','Gửi mã phiếu cần xóa'),('CD','Lấy trạng thái phiếu'),('DC','Trả phiếu Chưa hoàn thành'),
    ('CC','Kiểm tra quyền và phiếu chưa hoàn thành'),('CD','Xóa phiếu; không thay đổi tồn kho'),('DC','Xóa thành công'),('CU','Trả kết quả và danh sách mới'),('UA','Thông báo xóa thành công')])
save(42,'Nhân viên kho','Chọn Sửa phiếu chưa hoàn thành','Hiện thông tin phiếu chưa hoàn thành',
     'Sửa ngày, nhà cung cấp, mặt hàng, lượng, giá và Lưu','Kiểm tra phiếu chưa hoàn thành và dữ liệu hợp lệ',
     'Cập nhật phiếu chưa hoàn thành; không thay đổi tồn kho',scenario='Sửa phiếu chưa hoàn thành thành công',
     initial=[('UC','Lấy thông tin phiếu'),('CD','Truy vấn phiếu và mặt hàng'),('DC','Trả dữ liệu hiện tại'),('CU','Trả dữ liệu form')])
read(43,'Nhân viên kho','Chọn một phiếu nhập','Lấy phiếu và chi tiết từng mặt hàng',
     'Trả mã, ngày, NCC, trạng thái, người lập, size, lượng, giá, tổng',
     'Hiển thị chi tiết phiếu và các thao tác theo trạng thái')
put(44,'Khách hàng','Đánh giá sản phẩm đã mua thành công',[('AU','Mở đơn đã giao, chọn Đánh giá sản phẩm'),('UA','Hiện form 1–5 sao, nhận xét và ảnh tối đa 2MB'),
    ('AU','Chọn sao, nhập nhận xét, đính kèm ảnh và Gửi'),('UC','Gửi mã đơn, sản phẩm, sao, nội dung và ảnh'),
    ('CD','Lấy đơn đã giao và kiểm tra đánh giá trùng'),('DC','Xác nhận đúng khách, đã giao, chưa đánh giá'),
    ('CC','Kiểm tra sao, nội dung, định dạng và kích thước ảnh'),('CD','Lưu đánh giá Hiển thị và cập nhật điểm trung bình'),
    ('DC','Lưu thành công'),('CU','Trả kết quả đánh giá'),('UA','Thông báo đánh giá thành công')])
read(45,'Khách hàng','Mở đánh giá trong chi tiết sản phẩm','Lấy đánh giá Hiển thị mới nhất, ảnh, phản hồi, thống kê sao',
     'Trả điểm trung bình, số lượng theo sao và danh sách',
     'Hiện tên, sao, nhận xét, ảnh, ngày và phản hồi',
     [('AU','Lọc theo số sao hoặc đánh giá có ảnh'),('UC','Gửi tiêu chí xem đánh giá'),('CD','Lấy đánh giá Hiển thị phù hợp'),('DC','Trả kết quả đã lọc'),('CU','Trả danh sách phù hợp'),('UA','Hiển thị đánh giá sau lọc')])
save(46,'Nhân viên CSKH','Chọn đánh giá cần phản hồi từ UC47','Hiện đánh giá, sản phẩm, đơn và thông tin khách',
     'Nhập hoặc chọn mẫu phản hồi và nhấn Gửi','Kiểm tra nội dung phản hồi hợp lệ',
     'Lưu phản hồi, người gửi và thời điểm để hiện dưới đánh giá',scenario='Phản hồi một đánh giá Hiển thị thành công',
     initial=[('UC','Lấy chi tiết đánh giá'),('CD','Truy vấn đánh giá và dữ liệu liên quan'),('DC','Trả dữ liệu đánh giá'),('CU','Trả dữ liệu phản hồi')])
read(47,'Nhân viên CSKH','Mở Quản lý đánh giá','Lấy danh sách đánh giá và thông tin sản phẩm, khách, phản hồi',
     'Trả danh sách đánh giá, số sao, trạng thái, tình trạng phản hồi',
     'Hiển thị danh sách đánh giá và các thao tác quản trị')
read(48,'Nhân viên CSKH','Chọn bộ lọc sao, sản phẩm, trạng thái, phản hồi trong UC47',
     'Lấy đánh giá thỏa tất cả tiêu chí, mới nhất trước',
     'Trả danh sách đánh giá đã lọc','Hiển thị ngay danh sách khi đổi tiêu chí')
put(49,'Nhân viên CSKH','Kiểm duyệt và ẩn một đánh giá thành công',[('AU','Mở đánh giá cần kiểm duyệt từ UC47'),('UC','Yêu cầu chi tiết kiểm duyệt'),
    ('CD','Lấy nội dung, ảnh, người viết và đơn liên quan'),('DC','Trả thông tin đánh giá'),('CU','Trả dữ liệu kiểm duyệt'),('UA','Hiện nội dung để nhân viên xem xét'),
    ('AU','Chọn Ẩn đánh giá và nhập lý do'),('UC','Gửi kết quả kiểm duyệt'),('CC','Kiểm tra lý do; thực hiện đổi trạng thái theo UC50'),
    ('CD','Lưu Đã ẩn, người duyệt, thời điểm, lý do; tính lại thống kê sao'),('DC','Cập nhật thành công'),('CU','Trả kết quả kiểm duyệt'),('UA','Thông báo kiểm duyệt thành công')])
put(50,'Nhân viên CSKH','Ẩn đánh giá thành công, không xóa dữ liệu',[('AU','Chọn đánh giá cần ẩn'),('UC','Lấy trạng thái đánh giá'),
    ('CD','Truy vấn trạng thái hiện tại'),('DC','Trả trạng thái Hiển thị'),('CU','Trả trạng thái hiện tại'),('UA','Hiện trạng thái và nút Ẩn/Hiện'),
    ('AU','Chọn Ẩn'),('UA','Hiển thị hộp thoại xác nhận'),('AU','Xác nhận ẩn đánh giá'),('UC','Gửi yêu cầu ẩn'),
    ('CD','Cập nhật Đã ẩn; tính lại điểm trung bình và số lượng, bỏ đánh giá ẩn'),('DC','Cập nhật thành công'),('CU','Trả trạng thái và thống kê mới'),('UA','Thông báo ẩn thành công')])
read(51,'Admin','Chọn từ ngày, đến ngày, chu kỳ và nhấn Áp dụng',
     'Tổng hợp đơn đã giao; lấy Top 8 theo số lượng bán',
     'Trả Top 8 và doanh thu, lợi nhuận theo sản phẩm',
     'Hiển thị Top 8 cố định và bảng chi tiết doanh thu',scenario='Xem báo cáo bán chạy có dữ liệu')
read(52,'Admin','Mở Báo cáo doanh thu, chọn ngày/tuần/tháng/năm và Áp dụng',
     'Tổng hợp đơn đã giao theo ngày giao: tiền hàng sau voucher, không ship',
     'Trả doanh thu, đơn, số lượng, voucher, giá vốn, lợi nhuận',
     'Hiện thẻ tổng quan, biểu đồ thời gian, bảng theo sản phẩm',scenario='Xem báo cáo doanh thu có dữ liệu')
read(53,'Admin','Chọn Thống kê đơn hàng, khoảng ngày, chu kỳ và Áp dụng',
     'Đếm đơn theo trạng thái và mốc thời gian; tính tỷ lệ hủy',
     'Trả số đơn Chờ xác nhận, Đang giao, Thành công, Đã hủy',
     'Hiển thị thẻ, biểu đồ và bảng thống kê đơn hàng')
read(54,'Admin','Mở Thống kê tồn kho','Tổng hợp tồn, giá trị tồn, sắp hết/hết theo UC38, UC39',
     'Trả số sản phẩm, số đôi, giá trị, sắp hết, hết hàng',
     'Hiện thẻ tổng quan và bảng theo danh mục hoặc size',
     [('AU','Chọn bộ lọc danh mục, size hoặc tình trạng'),('UC','Gửi tiêu chí thống kê tồn'),('CD','Tổng hợp tồn phù hợp bộ lọc'),('DC','Trả số liệu chi tiết'),('CU','Trả kết quả thống kê'),('UA','Hiển thị thống kê sau lọc')])
read(55,'Khách hàng','Mở Lịch sử mua hàng trong tài khoản','Lấy đơn của chính khách hàng, mới nhất trước',
     'Trả mã đơn, ngày, tổng tiền, trạng thái','Hiển thị lịch sử mua hàng cá nhân',
     [('AU','Chọn đơn xem chi tiết'),('UC','Yêu cầu chi tiết đơn của khách'),('CD','Lấy sản phẩm, size, lượng, voucher, ship, thanh toán'),('DC','Trả chi tiết đơn'),('CU','Trả thông tin chi tiết'),('UA','Hiển thị chi tiết mua hàng')])
save(56,'Admin','Mở Quản lý loại sản phẩm, chọn Thêm','Hiện danh sách loại và form thông tin',
     'Nhập tên, mô tả và Lưu','Kiểm tra dữ liệu loại sản phẩm hợp lệ','Lưu loại sản phẩm và cập nhật danh mục phía khách',
     scenario='Thêm loại sản phẩm thành công',initial=[('UC','Lấy danh sách loại'),('CD','Truy vấn loại và số sản phẩm'),('DC','Trả tên, mô tả, số sản phẩm, trạng thái'),('CU','Trả danh sách loại')])
save(57,'Admin','Mở Quản lý giá bán','Hiện sản phẩm, giá nhập và giá bán hiện tại',
     'Chọn sản phẩm, nhập tỷ lệ lợi nhuận và Lưu','Tính giá bán theo tỷ lệ; kiểm tra không thấp hơn giá nhập',
     'Lưu giá bán mới và cập nhật giá hiển thị phía khách',scenario='Cập nhật giá theo tỷ lệ lợi nhuận thành công',
     initial=[('UC','Lấy thông tin giá sản phẩm'),('CD','Truy vấn giá nhập và giá bán'),('DC','Trả dữ liệu giá'),('CU','Trả danh sách giá')])
put(58,'Admin','Reset mật khẩu khách hàng thành công',[('AU','Mở Quản lý khách hàng'),('UC','Lấy danh sách tài khoản'),('CD','Truy vấn tài khoản và trạng thái'),
    ('DC','Trả danh sách tài khoản'),('CU','Trả dữ liệu danh sách'),('UA','Hiển thị tài khoản khách hàng'),('AU','Chọn khách và Reset mật khẩu'),
    ('UA','Hiển thị hộp thoại xác nhận'),('AU','Xác nhận reset'),('UC','Gửi mã khách và yêu cầu reset'),('CC','Sinh mật khẩu ngẫu nhiên và mã hóa'),
    ('CD','Lưu mật khẩu tạm; buộc đổi ở lần đăng nhập tiếp'),('DC','Cập nhật thành công'),('CU','Trả mật khẩu tạm để Admin xem một lần'),('UA','Hiện mật khẩu tạm một lần và thông báo thành công')])
put(59,'Nhân viên kho','Bổ sung tồn một size qua phiếu hoàn thành',[('AU','Mở Quản lý tồn kho'),('UC','Yêu cầu tồn tổng và từng size'),
    ('CD','Lấy dữ liệu tồn và size sản phẩm'),('DC','Trả tồn tổng/theo size'),('CU','Trả danh sách tồn'),('UA','Hiện tồn và bộ lọc size/tình trạng'),
    ('AU','Chọn size cần bổ sung và lập phiếu nhập'),('UC','Tham chiếu UC40 — Phiếu nhập Hoàn thành'),
    ('CD','Lấy lại tồn và tổng đã nhập sau UC40'),('DC','Trả tồn mới; tồn tổng bằng tổng các size'),('CU','Trả kết quả bổ sung tồn'),('UA','Hiển thị tồn tổng và size đã cập nhật')])
put(60,'Khách hàng','Áp dụng voucher hợp lệ thành công',[('AU','Mở phần voucher tại checkout'),('UC','Lấy voucher theo tài khoản và đơn'),
    ('CD','Lấy voucher công khai, riêng đã phát, lịch sử dùng'),('DC','Trả voucher và điều kiện'),('CU','Trả thẻ voucher và mức tiền còn thiếu'),
    ('UA','Hiện voucher dùng được và thẻ thiếu đơn tối thiểu'),('AU','Chọn voucher hoặc nhập mã'),('UC','Gửi mã khách, voucher, tiền hàng'),
    ('CC','Kiểm tra hiệu lực, lượt tổng/tài khoản, khách mới, phát riêng, đơn tối thiểu'),
    ('CC','Tính tiền giảm trên tiền hàng, phí ship và tổng sau giảm'),('CU','Trả tạm tính, giảm, ship, tổng'),('UA','Hiển thị giá sau giảm; tiếp tục đặt hàng UC30')])
save(61,'Nhân viên bán hàng','Mở Quản lý voucher và chọn Thêm','Hiện form mã, tên, loại giảm, mức giảm, giới hạn, thời gian, phạm vi',
     'Nhập voucher công khai, điều kiện, lượt dùng và nhấn Lưu','Kiểm tra mã không trùng, mức giảm, giới hạn, thời gian và quyền',
     'Lưu voucher cùng phạm vi và điều kiện sử dụng',scenario='Tạo voucher công khai thành công',
     initial=[('UC','Lấy danh sách và tổng quan voucher'),('CD','Truy vấn voucher, lượt dùng, lượt phát'),('DC','Trả danh sách voucher'),('CU','Trả dữ liệu quản lý')])
put(62,'Nhân viên bán hàng','Phát voucher riêng cho khách hợp lệ',[('AU','Mở Quản lý voucher, tab Phân phát'),('UC','Lấy dữ liệu phân phát'),
    ('CD','Lấy voucher riêng được phép phát, khách hoạt động, lịch sử'),('DC','Trả dữ liệu biểu mẫu'),('CU','Trả danh sách voucher và khách'),('UA','Hiện form phân phát và lịch sử'),
    ('AU','Chọn voucher, khách nhận, nhập lý do và Phát'),('UC','Gửi voucher, danh sách khách và lý do'),
    ('CC','Kiểm tra quyền, hiệu lực, lượt phát; bỏ khách đang có mã chưa dùng'),
    ('CD','Lưu lần phát: voucher, khách, người phát, chức vụ, thời gian, lý do, Chưa dùng'),('DC','Trả số nhận, số bỏ qua và lịch sử mới'),
    ('CU','Trả kết quả phát voucher'),('UA','Hiển thị số khách đã nhận và lịch sử phát')])
put(63,'Khách hàng','Xem voucher và dùng một mã hợp lệ',[('AU','Chọn Voucher hoặc Voucher của tôi'),('UC','Lấy voucher theo khách đang đăng nhập'),
    ('CD','Lấy voucher, lượt dùng và lần phát cho khách'),('DC','Trả dữ liệu voucher'),
    ('CC','Kiểm tra hiệu lực, đối tượng, lượt dùng và phát riêng'),('CU','Trả nhóm Dùng được/Không dùng được, số lượng và lý do'),
    ('UA','Hiện mức giảm, đơn tối thiểu, hạn, mã; nhãn riêng và lý do'),('AU','Chọn Dùng ngay ở voucher hợp lệ'),
    ('UC','Ghi nhận voucher chọn sẵn cho checkout'),('CU','Trả mã voucher đã chọn'),('UA','Chuyển đến giỏ hàng; áp dụng theo UC60')])
put(64,'Khách hàng','Gửi tin hỗ trợ thành công',[('AU','Mở Chat hỗ trợ'),('UC','Lấy hội thoại của khách'),('CD','Lấy lịch sử hội thoại nếu có'),('DC','Trả dữ liệu hội thoại'),
    ('CU','Trả khung chat và lịch sử'),('UA','Hiển thị chat hỗ trợ'),('AU','Nhập tin, ảnh ≤2MB hoặc link mã sản phẩm và Gửi'),
    ('UC','Gửi nội dung tin hỗ trợ'),('CC','Kiểm tra nội dung và ảnh hợp lệ'),
    ('CD','Lưu tin; tạo hội thoại Chờ tiếp nhận nếu chưa có luồng mở'),('DC','Trả tin đã lưu và trạng thái hội thoại'),
    ('CU','Trả tin và trạng thái mới'),('UA','Hiển thị tin nhắn và trạng thái yêu cầu')])
put(65,'Nhân viên CSKH','Tiếp nhận, phản hồi và đóng hội thoại thành công',[('AU','Mở Hỗ trợ khách hàng'),('UC','Yêu cầu danh sách hội thoại'),
    ('CD','Lấy hội thoại, số chưa đọc và khách cần ưu tiên'),('DC','Trả danh sách theo trạng thái'),('CU','Trả danh sách hội thoại'),('UA','Hiện bộ lọc, tìm kiếm, tin chưa đọc'),
    ('AU','Chọn hội thoại và nhấn Tiếp nhận'),('UC','Gửi mã hội thoại và nhân viên'),
    ('CD','Lấy tin, khách, 3 đơn gần nhất; đánh dấu đã đọc; lưu phụ trách, Đang xử lý, tin tiếp nhận'),('DC','Trả nội dung hội thoại và thông tin khách'),
    ('CU','Trả hội thoại đã tiếp nhận'),('UA','Hiện tin, khách và trạng thái Đang xử lý'),('AU','Nhập phản hồi, ảnh hoặc link sản phẩm và Gửi'),
    ('UC','Gửi tin phản hồi'),('CD','Lưu tin phản hồi và thời điểm'),('DC','Trả tin đã lưu'),
    ('CU','Trả tin mới, chuyển tới phía khách'),('UA','Hiển thị phản hồi trong hội thoại'),('AU','Chọn Kết thúc hội thoại'),('UA','Hiển thị xác nhận kết thúc'),
    ('AU','Xác nhận kết thúc'),('UC','Gửi yêu cầu đóng hội thoại'),
    ('CD','Lưu Đã đóng, người đóng, thời điểm và tin cảm ơn'),('DC','Đóng thành công'),('CU','Trả trạng thái và tin hệ thống'),('UA','Hiển thị Đã đóng; khách nhận tin cảm ơn')])

assert set(cases) == set(titles) == set(range(1,66))

X = {'A':100, 'U':430, 'C':790, 'D':1150}
FONT = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 14)
FONT_B = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 21)
FONT_H = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 14)
mxfile = ET.Element('mxfile', host='app.diagrams.net', type='device')
previews = OUT/'sequence-audit'/'preview'
previews.mkdir(parents=True, exist_ok=True)

def cell(root, id, value='', style='', **attrs):
    return ET.SubElement(root,'mxCell',id=id,parent='1',value=value,style=style,**attrs)
def geom(c,x,y,w,h):
    return ET.SubElement(c,'mxGeometry',x=str(x),y=str(y),width=str(w),height=str(h), attrib={'as':'geometry'})
def label(root,id,value,x,y,w,h,size=14,bold=False,align='center'):
    c=cell(root,id,value,'text;html=0;whiteSpace=wrap;overflow=hidden;fillColor=#ffffff;strokeColor=none;align='+align+';verticalAlign=middle;fontFamily=Arial;fontSize='+str(size)+';fontStyle='+('1' if bold else '0')+';',vertex='1')
    geom(c,x,y,w,h)
    return c
def wrap(text,width):
    return '\n'.join(textwrap.wrap(text,width=width,break_long_words=False,break_on_hyphens=False))
def pixel_wrap(text, width):
    lines=[]
    line=''
    for word in text.split():
        candidate=(line+' '+word).strip()
        if FONT.getlength(candidate)>width and line:
            lines.append(line)
            line=word
        else:
            line=candidate
    if line:lines.append(line)
    return '\n'.join(lines)
def draw_text(draw,box,text,font):
    x,y,w,h=box
    b=draw.multiline_textbbox((0,0),text,font=font,spacing=3,align='center')
    draw.multiline_text((x+(w-(b[2]-b[0]))/2,y+(h-(b[3]-b[1]))/2-b[1]),text,font=font,fill='#111111',spacing=3,align='center')

for n in range(1,66):
    case=cases[n];title=f'UC{n:02d} – {titles[n]}'
    msgs=case['messages']; planned=[];y=220
    for i,(route,text) in enumerate(msgs,1):
        assert route in ['AU','UA','UC','CU','CD','DC','CC'], (n,route)
        available=280 if route=='CC' else abs(X[route[0]]-X[route[1]])-32
        lab=pixel_wrap(f'{i}. {text}',available-12)
        lh=20*len(lab.splitlines())+8
        y+=lh
        planned.append((route,lab,y,lh))
        y+=64 if route=='CC' else 40
    height=max(800,y+70)
    diagram=ET.SubElement(mxfile,'diagram',id=f'corrected-uc{n:02d}',name=f'UC{n:02d} {titles[n]}'[:100])
    model=ET.SubElement(diagram,'mxGraphModel',dx='1400',dy=str(height),grid='1',gridSize='10',guides='1',tooltips='1',connect='1',arrows='1',fold='1',page='1',pageScale='1',pageWidth='1300',pageHeight=str(height),math='0',shadow='0',background='#ffffff')
    root=ET.SubElement(model,'root');ET.SubElement(root,'mxCell',id='0');ET.SubElement(root,'mxCell',id='1',parent='0')
    label(root,'title',title,35,18,1230,44,22,True)
    subtitle=wrap('Kịch bản thành công: '+case['scenario'],115)
    label(root,'scenario',subtitle,35,65,1230,45,14)
    label(root,'source','Theo Dac_ta_use_case.docx • Actor → Giao diện → Xử lý → CSDL',35,height-40,1230,25,11)
    canvas=Image.new('RGB',(1300,height),'white');draw=ImageDraw.Draw(canvas)
    draw_text(draw,(35,18,1230,44),title,FONT_B);draw_text(draw,(35,65,1230,45),subtitle,FONT)
    headers={'A':case['actor'],'U':'Giao diện\n'+titles[n],'C':'Xử lý\n'+titles[n],'D':'CSDL'}
    for key,x in X.items():
        # Four editable UML lifelines follow the original diagram's convention.
        if key=='A':
            c=cell(root,'life'+key,'','shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=0;container=1;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;participant=umlActor;strokeColor=#222222;fillColor=#ffffff;',vertex='1')
            geom(c,x-10,142,20,height-210)
            label(root,'actorLabel',wrap(headers[key],23),x-90,114,180,27,14,True)
            draw_text(draw,(x-90,114,180,27),wrap(headers[key],23),FONT_H)
            draw.ellipse((x-9,146,x+9,164),outline='#222222',width=2)
            draw.line((x,164,x,185),fill='#222222',width=2);draw.line((x-16,172,x+16,172),fill='#222222',width=2)
            draw.line((x,185,x-14,201),fill='#222222',width=2);draw.line((x,185,x+14,201),fill='#222222',width=2)
            life_start=205
        else:
            header=wrap(headers[key].replace('\n',' '),27)
            c=cell(root,'head'+key,header,'rounded=0;whiteSpace=wrap;html=0;fillColor=#ffffff;strokeColor=#222222;fontFamily=Arial;fontSize=14;fontStyle=1;',vertex='1')
            geom(c,x-125,125,250,72)
            draw.rectangle((x-125,125,x+125,197),outline='#222222',width=2)
            draw_text(draw,(x-125,125,250,72),header,FONT_H)
            c=cell(root,'life'+key,'','endArrow=none;dashed=1;dashPattern=4 4;strokeColor=#777777;',edge='1')
            g=ET.SubElement(c,'mxGeometry',relative='1',attrib={'as':'geometry'})
            ET.SubElement(g,'mxPoint',x=str(x),y='197',attrib={'as':'sourcePoint'})
            ET.SubElement(g,'mxPoint',x=str(x),y=str(height-65),attrib={'as':'targetPoint'})
            life_start=197
        for yy in range(life_start,height-65,12):draw.line((x,yy,x,min(yy+6,height-65)),fill='#888888',width=1)
    # Activation bars span each participant's interval of interaction.
    intervals={k:[] for k in X}
    for route,lab,yy,lh in planned:
        for k in set(route):intervals[k].append(yy)
    for k,ys in intervals.items():
        if k=='A' or not ys:continue
        c=cell(root,'activation'+k,'','rounded=0;fillColor=#ffffff;strokeColor=#222222;',vertex='1')
        geom(c,X[k]-5,min(ys)-7,10,max(ys)-min(ys)+25)
        draw.rectangle((X[k]-5,min(ys)-7,X[k]+5,max(ys)+18),fill='white',outline='#222222')
    for i,(route,lab,yy,lh) in enumerate(planned,1):
        a,b=route;is_return=route in ['UA','CU','DC'];xa=X[a];xb=X[b]
        style='html=0;rounded=0;strokeColor=#222222;strokeWidth=1;endArrow='+('open' if is_return else 'block')+';endFill='+('0' if is_return else '1')+';endSize=8;'
        if is_return:style+='dashed=1;dashPattern=5 3;'
        c=cell(root,f'm{i}','',style,edge='1')
        g=ET.SubElement(c,'mxGeometry',relative='1',attrib={'as':'geometry'})
        if a==b:
            points=[(xa+5,yy),(xa+150,yy),(xa+150,yy+30),(xa+5,yy+30)]
            arr=ET.SubElement(g,'Array',attrib={'as':'points'})
            for px,py in points[1:-1]:ET.SubElement(arr,'mxPoint',x=str(px),y=str(py))
            lx,ly,lw=xa+12,yy-lh-3,280
        else:
            points=[(xa+(5 if xb>xa else -5),yy),(xb+(-5 if xb>xa else 5),yy)]
            lx,ly,lw=min(xa,xb)+16,yy-lh-3,abs(xb-xa)-32
        ET.SubElement(g,'mxPoint',x=str(points[0][0]),y=str(points[0][1]),attrib={'as':'sourcePoint'})
        ET.SubElement(g,'mxPoint',x=str(points[-1][0]),y=str(points[-1][1]),attrib={'as':'targetPoint'})
        c.set('value',lab)
        # Edge value is kept for editability/search; dedicated text geometry prevents overlap.
        c.set('value','')
        label(root,f'message{i}',lab,lx,ly,lw,lh,14)
        for (px,py),(qx,qy) in zip(points,points[1:]):
            if is_return and py==qy:
                left,right=sorted([px,qx])
                for xx in range(left,right,12):draw.line((xx,py,min(xx+7,right),py),fill='#222222',width=1)
            else:draw.line((px,py,qx,qy),fill='#222222',width=1)
        ex,ey=points[-1];direction=1 if ex>points[-2][0] else -1
        arrow=[(ex-direction*9,ey-4),(ex,ey),(ex-direction*9,ey+4)]
        if is_return:draw.line(arrow,fill='#222222',width=1)
        else:draw.polygon(arrow,fill='#222222')
        draw.rectangle((lx,ly,lx+lw,ly+lh),fill='white')
        draw_text(draw,(lx,ly,lw,lh),lab,FONT)
        # Each label has enough space for the selected font and column width.
        for line in lab.splitlines():
            assert draw.textlength(line,font=FONT) <= lw-4, (n,i,line,lw)
    canvas.save(previews/f'UC{n:02d}.png')

ET.indent(mxfile,space='  ')
target=OUT/'SEQUENCE_Diagram_da_sua.drawio'
ET.ElementTree(mxfile).write(target,encoding='utf-8',xml_declaration=True)

# Structural checks verify that each expected use case can be opened as an independent page.
check=ET.parse(target).getroot()
assert len(check.findall('diagram'))==65
for diagram in check.findall('diagram'):
    cells=diagram.findall('.//mxCell'); ids=[c.get('id') for c in cells]
    assert len(ids)==len(set(ids)),diagram.get('name')
    for c in cells:
        assert c.find('mxGeometry') is not None or c.get('id') in ['0','1']
    assert sum(c.get('id','').startswith('message') for c in cells)>0

# Contact sheets for visual inspection; delivery stays focused on the editable draw.io file.
for start in range(1,66,12):
    nums=list(range(start,min(start+12,66)))
    sheet=Image.new('RGB',(1440,420*((len(nums)+3)//4)), '#dddddd');sd=ImageDraw.Draw(sheet)
    for j,num in enumerate(nums):
        im=Image.open(previews/f'UC{num:02d}.png');im.thumbnail((350,380))
        xx=(j%4)*360+(360-im.width)//2;yy=(j//4)*420+30
        sheet.paste(im,(xx,yy));sd.text(((j%4)*360+10,(j//4)*420+5),f'UC{num:02d}',font=FONT_H,fill='black')
    sheet.save(previews/f'contact-{start:02d}.png')

print(f'Created {target}; 65 pages, {sum(len(c["messages"]) for c in cases.values())} numbered messages.')
