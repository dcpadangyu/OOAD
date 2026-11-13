from pathlib import Path
from zipfile import ZipFile
from copy import deepcopy
from lxml import etree as E

path = Path('docs/Dac_ta_use_case.docx')
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
w = '{' + ns['w'] + '}'
updates = {
53: [
 ['Khách hàng chọn hoặc nhập một mã voucher khi thanh toán; hệ thống kiểm tra điều kiện và gợi ý mã giảm nhiều tiền nhất.'],
 [
 '1. Khách hàng mở trang thanh toán với các sản phẩm đã chọn trong giỏ hàng.',
 '2. Hệ thống xác định tài khoản, tạm tính tiền hàng, phí vận chuyển và số lượt voucher còn lại của khách hàng.',
 '3. Hệ thống ẩn voucher không được cấp cho tài khoản, đã hết lượt, hết hạn, bị vô hiệu hóa hoặc hết số lượt phát hành; voucher chưa đủ điều kiện sử dụng được hiển thị màu xám kèm lý do.',
 '4. Hệ thống xếp voucher dùng được trước, voucher màu xám sau; mỗi nhóm được sắp theo số tiền giảm từ cao xuống thấp. Với mã chưa đạt mức đơn tối thiểu, mức giảm gợi ý được tính khi đạt mức tối thiểu và hiển thị số tiền cần mua thêm.',
 '5. Hệ thống hiển thị mã, nội dung ưu đãi, hạn dùng, số lượng còn lại và nhãn gợi ý giảm nhiều nhất; chỉ hiển thị khoảng ba voucher, khách cuộn để xem tiếp.',
 '6. Khách hàng chọn voucher hoặc nhập mã rồi nhấn Áp dụng. Hệ thống kiểm tra tài khoản được cấp, trạng thái, thời hạn, số lượt còn lại và giá trị đơn tối thiểu.',
 '7. Hệ thống tính mức giảm theo số tiền, phần trăm hoặc phí vận chuyển; áp dụng giới hạn giảm tối đa nếu có và cập nhật tổng thanh toán. Mỗi đơn chỉ áp dụng một mã voucher.',
 '8. Khách hàng xác nhận đặt hàng. Hệ thống kiểm tra lại voucher trước khi lưu đơn; với chuyển khoản, kiểm tra lại khi khách xác nhận thanh toán.',
 '9. Khi đơn được lưu thành công, hệ thống ghi nhận mã và số tiền giảm trên đơn, tính một lượt sử dụng vào tài khoản và cập nhật số lượng còn lại. Chỉ nhập mã hoặc tạo đơn chuyển khoản đang chờ chưa làm mất lượt.'
 ],
 [
 '1. Mã không tồn tại, tài khoản không được dùng, mã hết hạn, bị vô hiệu hóa hoặc hết lượt: từ chối áp dụng và thông báo lý do.',
 '2. Chưa đạt giá trị đơn tối thiểu: voucher hiển thị màu xám và số tiền cần mua thêm. Chưa đến ngày bắt đầu: hiển thị màu xám và thông báo thời gian chưa hiệu lực.',
 '3. Đơn đã miễn phí vận chuyển: không áp dụng voucher freeship vì không phát sinh khoản giảm.',
 '4. Voucher hết hạn, hết lượt hoặc đổi giá trị giảm trong lúc chờ chuyển khoản: từ chối xác nhận đơn và yêu cầu quay lại trang thanh toán để chọn lại.',
 '5. Không lưu được đơn hoặc khách hủy bước chuyển khoản đang chờ: không tính lượt dùng. Đơn đã lưu rồi bị hủy không tự động hoàn lượt voucher theo chính sách hiện tại.'
 ],
 ['Khách hàng đã đăng nhập, đã chọn sản phẩm để thanh toán và có thông tin giao hàng hợp lệ khi đặt hàng.'],
 ['Đơn thành công lưu mã voucher, tạm tính, tiền giảm, phí vận chuyển và tổng thanh toán. Mỗi đơn dùng một lượt của mã đã chọn; voucher hết lượt không còn xuất hiện trong danh sách của tài khoản.']
],
54: [
 ['Admin tạo, tìm kiếm, sửa, xóa hoặc vô hiệu hóa voucher; phân voucher cho danh sách tài khoản và theo dõi cảnh báo số lượng, thời hạn. Đây là yêu cầu dành cho phần quản trị cần triển khai.'],
 [
 '1. Admin mở chức năng Quản lý voucher. Hệ thống hiển thị danh sách mã, loại giảm, giá trị giảm, thời hạn, trạng thái và số lượng còn lại.',
 '2. Admin nhập từ khóa theo mã hoặc tên voucher để tìm kiếm và chọn voucher cần quản lý, hoặc chọn Thêm voucher.',
 '3. Khi thêm hoặc sửa, Admin nhập mã, tên, loại giảm (số tiền, phần trăm hoặc phí vận chuyển), giá trị giảm, mức giảm tối đa nếu có và giá trị đơn hàng tối thiểu.',
 '4. Admin thiết lập ngày phát hành, ngày bắt đầu sử dụng, ngày hết hạn, trạng thái, tổng số lượng voucher và số lượt mỗi tài khoản được sử dụng.',
 '5. Admin chọn danh sách tài khoản được nhận voucher. Hệ thống kiểm tra tài khoản hợp lệ và số lượng phân bổ so với tổng số lượng voucher.',
 '6. Admin đặt mức cảnh báo số lượng còn lại và số ngày cảnh báo trước khi hết hạn, sau đó nhấn Lưu.',
 '7. Hệ thống kiểm tra tính duy nhất của mã, giá trị giảm, điều kiện đơn hàng, thứ tự thời gian, số lượng và mức cảnh báo; nếu hợp lệ thì lưu voucher và danh sách tài khoản được phân.',
 '8. Khi Admin yêu cầu xóa, hệ thống kiểm tra lịch sử sử dụng và yêu cầu xác nhận; chỉ xóa mã chưa được sử dụng. Mã đã có đơn sử dụng được giữ lại và có thể vô hiệu hóa.',
 '9. Hệ thống theo dõi số lượt đã dùng và thời hạn, hiển thị cảnh báo khi số lượng còn lại nhỏ hơn hoặc bằng mức cảnh báo, hoặc thời gian còn lại nằm trong số ngày cảnh báo hết hạn.',
 '10. Hệ thống cập nhật danh sách quản lý; phía khách hàng chỉ hiển thị và cho áp dụng voucher theo tài khoản, số lượt và điều kiện đã thiết lập.'
 ],
 [
 '1. Mã trùng, giá trị giảm hoặc điều kiện đơn không hợp lệ, ngày hết hạn trước ngày bắt đầu: không lưu và thông báo trường cần sửa.',
 '2. Số lượng hoặc mức cảnh báo không hợp lệ; danh sách tài khoản trùng hoặc không tồn tại; tổng phân bổ vượt số lượng phát hành: không lưu phân bổ và yêu cầu điều chỉnh.',
 '3. Voucher đã được sử dụng: từ chối xóa, cho phép vô hiệu hóa để giữ lịch sử. Không sửa mã định danh của voucher đã có lượt dùng hoặc giảm hạn mức xuống dưới số lượt đã sử dụng.',
 '4. Admin hủy thao tác hoặc không có quyền quản lý voucher: không thay đổi dữ liệu.'
 ],
 ['Admin đã đăng nhập và có quyền quản lý voucher; hệ thống có danh sách tài khoản khách hàng để phân voucher.'],
 ['Voucher và cấu hình phân bổ được lưu nếu hợp lệ; cảnh báo phản ánh số lượng và thời hạn. Lịch sử sử dụng được bảo toàn; thao tác thất bại hoặc bị hủy không thay đổi dữ liệu.']
]
}

with ZipFile(path) as zin:
    original = {item.filename: (item, zin.read(item.filename)) for item in zin.infolist()}
doc = E.fromstring(original['word/document.xml'][1])
tables = doc.findall('.//w:body/w:tbl', ns)
for index, rows in updates.items():
    table = tables[index]
    for row, texts in zip(table.findall('w:tr', ns), rows):
        cell = row.findall('w:tc', ns)[1]
        old_p = cell.find('w:p', ns)
        pp = old_p.find('w:pPr', ns) if old_p is not None else None
        rp = old_p.find('w:r/w:rPr', ns) if old_p is not None else None
        for child in list(cell):
            if child.tag != w+'tcPr': cell.remove(child)
        for text in texts:
            p = E.SubElement(cell, w+'p')
            if pp is not None:
                p.append(deepcopy(pp))
                # Each numbered step is its own paragraph and may flow across pages.
                for flag in ['keepNext', 'keepLines', 'numPr']:
                    for el in p.findall('w:pPr/w:'+flag, ns): el.getparent().remove(el)
            run = E.SubElement(p, w+'r')
            if rp is not None: run.append(deepcopy(rp))
            E.SubElement(run, w+'t').text = text
    # Long flows need to split normally rather than forcing an oversized table row.
    for el in table.findall('.//w:cantSplit', ns): el.getparent().remove(el)

# Verify unrelated body blocks are identical before writing.
old = E.fromstring(original['word/document.xml'][1])
old_tables = old.findall('.//w:body/w:tbl', ns)
assert all(E.tostring(t)==E.tostring(old_tables[i]) for i,t in enumerate(tables) if i not in updates)
backup = Path('output/Dac_ta_use_case_truoc_sua_voucher.docx')
if not backup.exists(): backup.write_bytes(path.read_bytes())
payload = E.tostring(doc, xml_declaration=True, encoding='UTF-8', standalone=True)
with ZipFile(path, 'w') as zout:
    for name, (info, data) in original.items():
        zout.writestr(info, payload if name=='word/document.xml' else data)
print('Updated UC52 and UC53; all other tables unchanged.')
