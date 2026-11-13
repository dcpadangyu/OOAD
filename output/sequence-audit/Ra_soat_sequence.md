# Rà soát sequence so với đặc tả

Nguồn đối chiếu: `docs/SEQUENCE Diagram.drawio` và `docs/Dac_ta_use_case.docx`, đọc ngày 13/11/2026. `docs/35.BTH5.docx` được dùng để xác định vì sao sequence còn bộ mã UC cũ.

Phạm vi: rà nội dung lifeline, message và nghiệp vụ với dòng sự kiện chính. Chỉ xét kịch bản thành công theo yêu cầu giảng viên; không yêu cầu thêm nhánh thất bại, lỗi, thử lại hoặc hủy thao tác. Việc thiếu khung alt không được coi là lỗi. Đây là rà nội dung XML, chưa kết luận về chất lượng bố cục khi render.

## Kết quả chính

- Sequence hiện có 55 tiêu đề UC, từ UC01 đến UC55. Nhận xét trước đây rằng file có 46 sơ đồ đã không còn đúng với bản hiện tại.
- Đặc tả hiện có 65 chức năng. Sequence vẫn giữ bộ số của bản cũ từ phần sản phẩm trở đi.
- Nhóm 1.11 trong sequence CHƯA đổi sang đánh giá sản phẩm: vẫn là Gửi yêu cầu, Theo dõi trạng thái yêu cầu, Tiếp nhận yêu cầu, Xem danh sách yêu cầu, Phân loại yêu cầu, Xử lý yêu cầu, Cập nhật trạng thái yêu cầu. Nội dung vẫn nói khiếu nại, mã yêu cầu và lịch sử xử lý yêu cầu.
- UC40 cũ bị sửa nhầm tiêu đề thành “Lấy danh sách yêu cầu có trạng thái Chờ tiếp nhận”; message truy vấn bên trong vẫn ghi “Chờ xác nhận”. Nếu chuyển cả nhóm sang đánh giá theo đặc tả mới thì cần thay nghiệp vụ, không chỉ sửa hai tên này.
- Các sai lệch lớn ngoài đánh giá: chuyển khoản, trạng thái đơn hàng, sửa/xóa phiếu nhập, quyền tài khoản, reset mật khẩu khách hàng và báo cáo doanh thu.

## Nhóm đánh giá cần thay nội dung

Đánh giá theo đặc tả hiện tại được lưu ở trạng thái **Hiển thị**; nhân viên phản hồi, kiểm duyệt và ẩn/hiện. Đặc tả này không sử dụng chuỗi Chờ tiếp nhận → Đang xử lý → Đã đóng cho đánh giá. State đang giữ chuỗi xử lý yêu cầu là một chỗ chưa thống nhất giữa các tài liệu. Báo cáo này lấy đặc tả làm chuẩn để kiểm tra sequence.

| Sequence cũ | Chức năng theo đặc tả mới | Hướng thay |
|---|---|---|
| UC38 – Gửi yêu cầu | UC44 – Đánh giá sản phẩm | Khách mở sản phẩm trong đơn đã giao → nhập 1–5 sao, nhận xét, ảnh nếu có → kiểm tra điều kiện mua hàng và chưa đánh giá → lưu Hiển thị → tính lại điểm trung bình → thông báo thành công. |
| UC39 – Theo dõi trạng thái yêu cầu | UC45 – Xem đánh giá | Mở chi tiết sản phẩm → lấy đánh giá Hiển thị → lấy/tính điểm trung bình và số lượng theo sao → trả danh sách mới nhất, ảnh và phản hồi cửa hàng → hiển thị. |
| UC40 – Tiếp nhận yêu cầu, hiện đã đổi nhầm tên | UC46 – Phản hồi đánh giá | Nhân viên CSKH/Admin chọn đánh giá → lấy nội dung, khách, sản phẩm, đơn liên quan → nhập phản hồi → kiểm tra → lưu nội dung, người phản hồi, thời điểm → hiển thị dưới đánh giá. |
| UC41 – Xem danh sách yêu cầu | UC47 – Xem danh sách đánh giá | Lấy danh sách đánh giá và hiển thị theo đặc tả. Đổi dữ liệu mã yêu cầu/loại yêu cầu thành thông tin đánh giá, sản phẩm, sao, trạng thái và phản hồi tương ứng. |
| UC42 – Phân loại yêu cầu | UC48 – Lọc đánh giá | Chọn số sao, sản phẩm, trạng thái Hiển thị/Đã ẩn, tình trạng phản hồi → gửi tiêu chí → truy vấn đồng thời các điều kiện → trả danh sách mới nhất trước. Đây là thao tác đọc, không cập nhật phân loại vào CSDL. |
| UC43 – Xử lý yêu cầu | UC49 – Kiểm duyệt đánh giá | Chọn đánh giá → lấy nội dung, ảnh, người đánh giá, đơn liên quan → nhân viên quyết định giữ hiển thị hoặc ẩn → thực hiện UC50 → lưu người duyệt, thời điểm, lý do → thông báo. Có thể chọn một trường hợp duyệt thành công để vẽ. |
| UC44 – Cập nhật trạng thái yêu cầu | UC50 – Ẩn/hiện đánh giá | Lấy trạng thái hiện tại → nhân viên chọn Ẩn hoặc Hiện và xác nhận → lưu trạng thái → tính lại điểm trung bình và số lượng đánh giá, loại đánh giá ẩn khỏi phép tính → trả thành công. |

Đổi đồng thời tên tiêu đề, lifeline giao diện, lifeline xử lý, tham số, message truy vấn/lưu và kết quả hiển thị. Actor quản trị nhóm đánh giá là Nhân viên CSKH hoặc Admin. CSDL chỉ thực hiện truy xuất/lưu; thông báo và phản hồi giao diện do bộ xử lý điều phối.

## Các sequence còn lại

Số trong cột đầu là số đang có trong sequence; số sau mũi tên là số tương ứng trong đặc tả mới.

| Sequence | Kết quả và sửa cần thiết trong luồng thành công |
|---|---|
| UC01 | Form đang ghi tên đăng nhập hoặc email; đặc tả ghi tên đăng nhập, mật khẩu, Ghi nhớ đăng nhập. Message tự xác định vai trò từ một form chung không khớp mô tả hai trang đăng nhập Admin/Nhân viên. Đổi thành xác thực theo trang đăng nhập và tạo phiên. |
| UC02 | Các bước kết thúc phiên và trở về trang đăng nhập/trang chủ phù hợp dòng chính. |
| UC03 | Bỏ cách viết “liên kết hoặc mã” và “email hoặc tên đăng nhập”: đặc tả chọn email và OTP. Bổ sung kiểm tra tài khoản không bị khóa, kiểm tra OTP cùng mật khẩu mới, lưu mật khẩu mã hóa. Giữ kết thúc ở trang đăng nhập. |
| UC04 | Thiếu tên đăng nhập, địa chỉ theo form mới và toàn bộ bước gửi OTP → khách nhập OTP → xác thực OTP trước khi tạo tài khoản. Đây là bước thành công, cần bổ sung. |
| UC05 | Khung lấy dữ liệu hiện tại → sửa → kiểm tra → cập nhật phù hợp dòng chính. |
| UC06 | Có thể dùng kịch bản OTP thành công hiện có. Bổ sung kiểm tra mật khẩu ít nhất 8 ký tự, khác mật khẩu cũ, khớp xác nhận; lưu mã hóa; kết thúc phiên và chuyển về đăng nhập. |
| UC07 | Actor đang là Nhân viên, đặc tả là Admin. Bổ sung mã khách và ngày tạo trong dữ liệu hiển thị. |
| UC08 | Đổi actor Nhân viên thành Admin; bổ sung sắp xếp đơn mới nhất trước. Tham chiếu UC34 khi chọn xem chi tiết. |
| UC09 | Form cần theo đặc tả: họ tên, giới tính, số điện thoại, địa chỉ, chức vụ, tên đăng nhập, mật khẩu ban đầu. Thêm mã hóa mật khẩu trước khi lưu và gán chức vụ. |
| UC10 | Luồng sửa thành công cơ bản phù hợp. Ghi rõ tên đăng nhập không đổi; mật khẩu mới được mã hóa nếu thay. Nếu chỉ vẽ kịch bản sửa thông tin thì đặt tên kịch bản cho rõ, không bắt buộc vẽ thêm lỗi hay mọi thao tác khóa/xóa. |
| UC11 | Đặc tả phân quyền bằng chức vụ cố định, không cấu hình từng quyền tự do. Đổi các message lấy/chỉnh danh sách quyền thành lấy/chọn chức vụ. Sau lưu, thêm kết thúc phiên nhân viên để áp dụng quyền mới. |
| UC12 | Chưa thể hiện gợi ý tối đa 6 sản phẩm và lưu 6 từ khóa gần nhất của khách. Kết quả cần điểm đánh giá trung bình. Có thể chọn kịch bản khách tìm kiếm thành công và bổ sung các message này. |
| UC13 | Đặc tả lọc ngay khi đổi tiêu chí, sequence còn nhấn Áp dụng. Sửa sự kiện thành thay đổi bộ lọc; kết quả phân trang 15 sản phẩm và thỏa tất cả tiêu chí. |
| UC14 | Kết quả thiếu chất liệu, phong cách, giới tính, đánh giá và biểu diễn size hết/sắp hết. Có thể gộp vào một message trả dữ liệu chi tiết, không cần một message cho mỗi thuộc tính. |
| UC15 → UC16, Thêm sản phẩm | Form cũ nhập giá bán và số lượng. Đặc tả mới nhập giá nhập, các size sẽ bán và lưu tồn kho ban đầu bằng 0 ở mọi size. Đổi message lưu để thể hiện điều này; không cộng tồn khi thêm sản phẩm. |
| UC16 → UC17, Xóa sản phẩm | Luồng xác nhận, kiểm tra ràng buộc, xóa phù hợp. Lifeline còn “Giao diện thêm sản phẩm”, “Xử lý thêm sản phẩm”: đổi thành giao diện/xử lý xóa sản phẩm. |
| UC17 → UC18, Sửa sản phẩm | Khung xử lý phù hợp; ghi rõ mã sản phẩm không đổi và không sửa tay số lượng tồn. |
| UC18 → UC22, Thêm vào giỏ | Đặc tả chọn size và thêm số lượng 1. Sequence còn lựa chọn màu/số lượng như bản cũ. Chỉnh tham số và message thêm đúng sản phẩm + size, số lượng 1. |
| UC19 → UC23, Mua ngay | Thiếu thao tác thêm vào giỏ và chỉ chọn dòng vừa thêm trước khi chuyển checkout. Thêm lưu/cập nhật giỏ, nhận thành công, rồi chuyển UC30. |
| UC20 → UC24, Xem giỏ | Thiếu đối chiếu dữ liệu sản phẩm mới nhất và chọn các dòng cần thanh toán. Tính tổng theo các dòng đã chọn. |
| UC21 → UC25, Cập nhật giỏ | Đặc tả tăng/giảm số lượng hoặc xóa dòng; sequence còn đổi size/màu. Sửa về số lượng/xóa và kiểm tra tồn đúng size. |
| UC22 → UC27, COD | Bổ sung tạm tính, voucher, phí vận chuyển, tổng tiền vào phần tóm tắt. Ghi nhận Chưa thanh toán là đúng; bổ sung hoặc tham chiếu cập nhật Đã thanh toán khi giao thành công. Không cần thất bại thanh toán. |
| UC23 → UC28, Chuyển khoản | Cần sửa lớn: lưu đơn tạm 30 phút, chưa trừ kho → hiển thị QR và tổng tiền → khách chuyển khoản, nhấn Đã hoàn tất chuyển khoản → kiểm tra lại tồn/voucher → trừ kho đúng size, tạo đơn chính thức Chờ xác nhận và thanh toán Đã thanh toán → xóa dòng giỏ đã đặt → báo mã đơn. Hiện sequence vẫn lưu thanh toán Chờ xác nhận, chưa có chuỗi đơn tạm/đơn chính thức. |
| UC24 → UC29, Xác nhận thanh toán | Đặc tả bắt đầu ở chi tiết đơn chuyển khoản và ghi nhận đối chiếu, người xác nhận, thời điểm. Sequence còn lấy danh sách đơn chưa hoàn tất thanh toán và bao gồm tiền COD. Chọn kịch bản nhận đủ tiền chuyển khoản; thêm thao tác nhân viên Xác nhận đã nhận tiền và lưu kết quả đối chiếu. Không cần vẽ Báo sai lệch. |
| UC25 → UC30, Đặt hàng | Đổi Chờ xử lý thành Chờ xác nhận theo đặc tả; hiển thị địa chỉ chọn, voucher, tạm tính, giảm giá, ship, tổng tiền; trừ đúng size. Với kịch bản chuyển khoản, chỉ trừ sau khi khách xác nhận đã chuyển khoản. Có thể dùng ref đến UC27/UC28; mỗi sơ đồ là một kịch bản riêng nên việc đều mô tả lưu đơn không tự chứng minh bị tạo hai lần. |
| UC26 → UC32, Lọc đơn | Đổi sự kiện nhấn Áp dụng thành đổi bộ lọc; chỉ rõ ngày, trạng thái đơn và thanh toán. Bổ sung thẻ theo trạng thái, mới nhất trước, 10 đơn/trang trong kết quả. |
| UC27 → UC33, Tìm đơn | Đặc tả mới tìm theo mã đơn. Đổi message từ khóa mã/tên/số điện thoại về mã đơn cho đồng nhất. |
| UC28 → UC34, Chi tiết đơn | Bổ sung voucher, phí vận chuyển và tiền hàng trong thông tin trả về. Các bước lấy/hiển thị cơ bản phù hợp. |
| UC29 → UC35, Theo dõi đơn | Đổi bộ trạng thái hiển thị theo đặc tả: Chờ xác nhận, Đang giao, Thành công, Đã hủy; kèm thời điểm giao/hủy. Lifeline vẫn ghi tìm kiếm: đổi thành giao diện/xử lý theo dõi đơn. |
| UC30 → UC36, Cập nhật đơn | Bổ sung xác nhận ở hộp thoại. Chọn kịch bản giao thành công: cập nhật giao, chốt giá vốn, cộng đã bán, cập nhật thanh toán Đã thanh toán và gửi tin cảm ơn. Lifeline đang gắn với chức năng hủy: đổi tên cho đúng cập nhật trạng thái. |
| UC31 → UC37, Hủy đơn | Actor trong phần này đang là Nhân viên, trong khi dòng chính là Khách hàng. Đổi actor, giao diện và xử lý hủy. Điều kiện đầu vào là đơn Chờ xác nhận; hoàn đúng size. Có thể chọn kịch bản hủy đơn COD để không phải mở thêm tình huống hoàn tiền. |
| UC32 → UC38, Theo dõi tồn | Nội dung mới có tồn tổng/theo size, tổng quan, đã nhập/đã bán/chờ giao/giá trị tồn và xuất CSV. Sequence còn đơn giản, lifeline vẫn tìm kiếm đơn hàng. Đổi tên và bổ sung dữ liệu/ thao tác đọc theo kịch bản đã chọn. |
| UC33 → UC39, Tình trạng hàng | Đổi lifeline đang ghi thêm phiếu nhập. Thể hiện phân loại theo ngưỡng mặc định 10 đôi có thể điều chỉnh và chọn tab Bình thường/Sắp hết/Hết hàng. |
| UC34 → UC40, Thêm phiếu nhập | Đổi lifeline đang ghi xóa phiếu nhập. Form có trạng thái phiếu; ghi mã tự sinh và người lập. Nếu chỉ vẽ thành công có cộng kho, ghi rõ kịch bản phiếu Hoàn thành; cộng đúng size, tổng đã nhập và giá vốn. |
| UC35 → UC41, Xóa phiếu nhập | Đặc tả phân biệt xóa phiếu chưa hoàn thành (không đổi tồn) và Admin hủy phiếu hoàn thành (trừ tồn, giữ phiếu Đã hủy). Message hiện “Xóa phiếu nhập và hoàn lại tồn” không phù hợp. Chọn một kịch bản thành công để vẽ và ghi rõ trạng thái phiếu. |
| UC36 → UC42, Sửa phiếu nhập | Sai nghiệp vụ: đặc tả chỉ sửa phiếu chưa hoàn thành và KHÔNG đổi tồn. Bỏ “điều chỉnh tồn kho theo phần chênh lệch”, thay bằng “Lưu thông tin phiếu nhập chưa hoàn thành”. |
| UC37 → UC43, Chi tiết phiếu nhập | Giữ khung đọc/hiển thị; bổ sung trạng thái phiếu và người lập vào dữ liệu hiển thị. |
| UC45 → UC51, Bán chạy | Đặc tả là Top 8 cố định, không chọn số lượng. Đổi mốc thời gian ngày/tuần/tháng/năm; lấy đơn đã giao theo thời gian; bổ sung doanh thu, lợi nhuận gộp theo sản phẩm. |
| UC46 → UC52, Doanh thu | Self-message đang sao chép “Tổng hợp số lượng bán” từ báo cáo bán chạy. Đổi thành tổng hợp doanh thu tiền hàng sau voucher, không gồm ship, số đơn, số lượng, giá vốn, lợi nhuận gộp từ đơn đã giao theo ngày giao. Bỏ chọn số lượng, đổi quý thành tuần. |
| UC47 → UC55, Lịch sử cá nhân | Sequence kết thúc ở khách chọn đơn. Thêm ref UC34 hoặc chuỗi yêu cầu chi tiết → truy vấn → trả thông tin → hiển thị để hoàn tất dòng chính. |
| UC48 → UC56, Loại sản phẩm | Khung thêm/sửa cơ bản phù hợp; thiếu message kiểm tra dữ liệu trước lưu. Nếu chọn kịch bản thêm loại thành công thì ghi rõ kịch bản thay vì gộp mọi hành động vào một message. Sửa lỗi chữ categories/categoties nếu dùng tên dữ liệu. |
| UC49 → UC57, Giá bán | Cơ bản phù hợp luồng chọn giá/ tỷ lệ, tính và kiểm tra, lưu giá và cập nhật hiển thị. |
| UC50 → UC58, Trạng thái KH | Message cho phép Xóa là sai: đặc tả không xóa tài khoản khách hàng. Thay Xóa bằng Reset mật khẩu; kịch bản reset cần sinh mật khẩu ngẫu nhiên, lưu mã hóa, hiển thị một lần cho Admin và buộc khách đổi khi đăng nhập tiếp. Có thể chỉ chọn khóa thành công để vẽ. |
| UC51 → UC59, Tồn theo size | Khung kiểm tra và cộng đúng size khi hoàn thành cơ bản phù hợp. Nên ref UC40 cho phần lập phiếu để rõ tồn thay đổi qua phiếu nhập. |
| UC52 → UC60, Áp dụng voucher | Thiếu bước lấy/hiển thị danh sách voucher. Kiểm tra mới cần cả tổng lượt, lượt tài khoản, khách mới và voucher riêng đã phát. Bổ sung tham số mã khách/tổng tiền hàng, giữ tính giảm và tổng sau giảm. |
| UC53 → UC61, Quản lý voucher | Hiện chỉ mở/thêm, gửi và lưu. Thiếu lấy/hiển thị danh sách và biểu mẫu trước khi nhập. Bổ sung phạm vi Công khai/Riêng khách, giới hạn lượt, đối tượng. Actor có thể là Admin hoặc Nhân viên bán hàng. Chọn kịch bản tạo voucher thành công là đủ cho sơ đồ đó. |
| UC54 → UC64, Khách chat | Khung gửi/lưu tin phù hợp một phần; thêm kiểm tra dữ liệu và tạo hội thoại Chờ tiếp nhận nếu chưa có, hiển thị trạng thái và lịch sử. |
| UC55 → UC65, Quản lý hỗ trợ | Hiện mới lấy hội thoại và gửi tin. Thiếu Tiếp nhận → ghi phụ trách/Đang xử lý và Kết thúc → Đã đóng/người đóng/thời điểm/tin cảm ơn. Actor ghi rõ Nhân viên CSKH hoặc Admin. |

## Chức năng trong đặc tả mới chưa có sequence tương ứng riêng

Các số sau dùng bộ mã của đặc tả mới:

1. UC15 – Xem sản phẩm đang khuyến mãi.
2. UC19 – Quản lý danh mục.
3. UC20 – Quản lý thương hiệu.
4. UC21 – Quản lý khuyến mãi.
5. UC26 – Thanh toán đơn hàng, làm luồng chọn phương thức chung.
6. UC31 – Chọn địa chỉ giao hàng.
7. UC53 – Thống kê đơn hàng.
8. UC54 – Thống kê tồn kho.
9. UC62 – Phát và thu hồi voucher cho khách hàng.
10. UC63 – Xem voucher dùng được và không dùng được.

Đây là thiếu so với phạm vi đầy đủ của đặc tả; nếu bài chỉ yêu cầu chọn một số use case để vẽ thì không tự động phải bổ sung tất cả. Nhóm UC44–UC50 tuy có bảy sơ đồ cũ ở vị trí tương ứng nhưng chưa có nội dung đánh giá đúng để thay thế.

## Đồng bộ số UC

| Số sequence hiện tại | Số theo đặc tả mới |
|---|---|
| UC01–UC14 | Giữ nguyên |
| UC15–UC17 | UC16–UC18 |
| UC18–UC21 | UC22–UC25 |
| UC22–UC24 | UC27–UC29 |
| UC25 | UC30 |
| UC26–UC37 | UC32–UC43 |
| UC38–UC44 | Thay nội dung bằng UC44–UC50 về đánh giá |
| UC45–UC46 | UC51–UC52 |
| UC47–UC53 | UC55–UC61 |
| UC54–UC55 | UC64–UC65 |

## Những điểm đặc tả cần làm rõ khi đồng bộ

- UC35 của đặc tả dùng bộ Chờ xác nhận/Đang giao/Thành công/Đã hủy, nhưng phần tóm tắt UC36 lại dùng Mới đặt/Đã xử lý/Đã giao/Hủy. Không nên coi toàn bộ lệch tên này là lỗi riêng của sequence; cần thống nhất một bộ tên trong đặc tả, state và sequence.
- Đánh giá trong đặc tả dùng Hiển thị/Đã ẩn, khác state xử lý yêu cầu đang đặt tiêu đề Đánh giá sản phẩm. Nếu vẫn giữ state ấy theo yêu cầu riêng, cần ghi nhận rằng bộ tài liệu hiện chưa nhất quán về nghiệp vụ.
- Đặc tả phản hồi/kiểm duyệt đánh giá còn tham chiếu UC66 cho chat, trong khi danh sách chức năng hiện dùng UC64/UC65. Cần chỉnh tham chiếu trong đặc tả.

Ưu tiên sửa: nhóm đánh giá → chuyển khoản và đơn hàng → phiếu nhập → tài khoản → báo cáo → đồng bộ mã và tham chiếu. Giữ cách vẽ luồng thành công; các bước kiểm tra hợp lệ trong luồng thành công vẫn cần thể hiện, nhưng không phải vẽ nhánh kiểm tra thất bại.
