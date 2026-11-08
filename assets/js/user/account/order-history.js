  //lich su mua hang  
document.addEventListener("DOMContentLoaded",function(){
        // Dong bo trang thai: moi thay doi (Admin/User) di qua ShopCore.setOrderStatus nen 2 kho luu tru luon khop.
        // Chi can xu ly don cu: user da huy (da-huy) nhung ban admin chua cap nhat.
        function normalizeAndSyncOrders() {
            try {
                const ds = window.getDanhSachDatHang();
                ds.forEach(o => {
                    if (!o || !o.maDonHang) return;
                    if (o.trangThai === 'da-huy' && o.trangThaiQuanTri !== 'huy' && window.ShopCore) {
                        // Dong bo du lieu cu (legacy): bo qua kiem tra chuyen trang thai.
                        window.ShopCore.setOrderStatus(o.maDonHang, 'huy', { force: true });
                    } else if (o.trangThaiQuanTri && window.ShopCore) {
                        const mapped = window.ShopCore.mapUserStatus(o.trangThaiQuanTri);
                        if (o.trangThai !== mapped) {
                            const all = window.getDanhSachDatHang();
                            const target = all.find(x => x.maDonHang === o.maDonHang);
                            if (target) {
                                target.trangThai = mapped;
                                localStorage.setItem('DanhSachDatHang', JSON.stringify(all));
                            }
                        }
                    }
                });
            } catch (err) {
                console.error('normalizeAndSyncOrders error', err);
            }
        }

        // Admin doi trang thai (cung cua so hoac tab khac) => ve lai danh sach.
        window.addEventListener('orderStatusChanged', function () { window.lichsumuahang && window.lichsumuahang(); });
        window.addEventListener('storage', function (e) {
            if (e.key === 'DanhSachDatHang') window.lichsumuahang && window.lichsumuahang();
        });
        // Pagination settings for order history (3 orders per page)
        let ls_currentPage = 1;
        const ls_itemsPerPage = 3;

        // Thoat HTML cho moi gia tri chen vao innerHTML (ShopCore.esc, co ban du phong).
        function esc(value) {
            if (window.ShopCore && typeof window.ShopCore.esc === 'function') return window.ShopCore.esc(value);
            return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
        }

        // Ngay dat: uu tien order.ngayDat; chi dung moc thoi gian trong ma don khi ngayDat thieu/khong hop le.
        function formatOrderDate(order) {
            const fromField = order.ngayDat ? new Date(order.ngayDat) : null;
            if (fromField && !Number.isNaN(fromField.getTime())) return fromField.toLocaleDateString('vi-VN');
            const fromId = new Date(Number(String(order.maDonHang || '').replace('DH', '')));
            return Number.isNaN(fromId.getTime()) ? '' : fromId.toLocaleDateString('vi-VN');
        }

        function containerOrRedirectToLogin() {
            if (typeof Swal !== 'undefined') {
                Swal.fire({ icon: 'warning', title: 'Cần đăng nhập', text: 'Bạn phải đăng nhập để xem lịch sử mua hàng.', confirmButtonText: 'Đăng nhập' }).then(() => { window.location.href = 'pages/login.html'; });
            } else { window.location.href = 'pages/login.html'; }
        }

        window.lichsumuahang = function(page){
            if (page && Number.isInteger(page)) ls_currentPage = page;

            const danhsach = window.getDanhSachDatHang();
            const userlogin = window.UserSession?.getCurrentUser?.() || window.getlogin?.() || null;
            if (!userlogin || Array.isArray(userlogin)) {
                containerOrRedirectToLogin();
                return;
            }

            // Chi khop don hang theo maKhachHang (khong yeu cau order.khachHang).
            const userId = userlogin.maKhachHang || null;
            const userOrders = danhsach
                .filter((order) => {
                    if (!order) return false;
                    if (userId && order.maKhachHang === userId) return true;
                    // Don cu/da doi ma khach: khop them theo email cua khach da luu cung don (email la duy nhat).
                    const emailDon = String((order.khachHang && order.khachHang.thuDienTu) || order.thuDienTuNguoiNhan || '').trim().toLowerCase();
                    const emailKhach = String(userlogin.thuDienTu || '').trim().toLowerCase();
                    return !!emailKhach && !!order.khachHang && emailDon === emailKhach;
                })
                .sort((a, b) => String(b.maDonHang || '').localeCompare(String(a.maDonHang || '')));

            const container = document.querySelector('.lichsumuahanglist');
            if (!container) return;

            // Don chuyen khoan chua xac nhan (chua tao don chinh thuc, chua tru kho): nhac khach tiep tuc thanh toan.
            let thongBaoChoThanhToan = '';
            try {
                const cho = JSON.parse(localStorage.getItem('CurrDanhSachDatHang') || '[]')[0];
                if (cho && cho.maKhachHang === userId && Number(cho.hetHanLuc) > Date.now()) {
                    thongBaoChoThanhToan = `<div class="fb-wait" style="margin:0 0 14px;padding:12px 16px;border:1px solid #fde68a;background:#fffbeb;border-radius:10px;font-style:normal">Bạn có đơn chuyển khoản <b>${esc(cho.maDonHang)}</b> (${esc(cho.giaHienThi)}) chưa xác nhận thanh toán nên chưa được ghi nhận. <a href="pages/payment-bank.html">Tiếp tục thanh toán</a></div>`;
                }
            } catch (_) {}

            if (userOrders.length === 0) {
                container.innerHTML = thongBaoChoThanhToan + `<h2>Bạn chưa đặt đơn hàng nào hết</h2>`;
                return;
            }

            const totalPages = Math.max(1, Math.ceil(userOrders.length / ls_itemsPerPage));
            if (ls_currentPage < 1) ls_currentPage = 1;
            if (ls_currentPage > totalPages) ls_currentPage = totalPages;

            const start = (ls_currentPage - 1) * ls_itemsPerPage;
            const pageItems = userOrders.slice(start, start + ls_itemsPerPage);

            // render HTML for page items
            let LichSuHTML = '';
            pageItems.forEach(order => {
                if (!order.trangThai) order.trangThai = 'cho-xac-nhan';
                let trangthaiTEXT = '', trangthaiclass = '';
                switch(order.trangThai){
                    case 'cho-xac-nhan': trangthaiTEXT='Chờ xác nhận'; trangthaiclass='trangthai_waitting'; break;
                    case 'dang-giao': trangthaiTEXT='Đang giao'; trangthaiclass='trangthai_shipping'; break;
                    case 'thanh-cong': trangthaiTEXT='Thành công'; trangthaiclass='trangthai_succes'; break;
                    case 'da-huy': trangthaiTEXT='Đã hủy'; trangthaiclass='trangthai_cancel color-red'; break;
                    default: trangthaiTEXT=esc(order.trangThai); trangthaiclass='trangthai_waitting';
                }

                LichSuHTML += `<div class="cart_LichSu">
                    <div class="maLichSu">
                        <div>Mã đơn hàng:<span>${esc(order.maDonHang)}</span></div>
                        <div>Ngày đặt:<span>${esc(formatOrderDate(order))}</span></div>
                        <div> Trạng Thái: <span class="${trangthaiclass}"> ${trangthaiTEXT}</span></div>
                    </div>
                    <div>`;

                (order.chiTiet || []).forEach(item => {
                    LichSuHTML += `<div class="all-cart">
                            <img src="${esc(item.hinhAnh)}" alt="${esc(item.tenSanPham)}" class="item-img">
                            <div class="name-price-quantity">
                                <div class="item-name">${esc(item.tenSanPham)}</div>
                                <div class="item-price">${esc(item.giaHienThi)}</div>
                                <div class="item-quantity-all">
                                    <div class="quantity">${esc(item.soLuong)}</div>
                                </div>
                            </div>
                        </div>`;
                    if (order.trangThai === 'thanh-cong') {
                        LichSuHTML += `<div class="fb-slot" data-order="${esc(order.maDonHang)}" data-product="${esc(item.maSanPham)}" data-size="${esc(item.kichCoDaChon || '')}"></div>`;
                    }
                });

                LichSuHTML += `
                        ${order.trangThai === 'dang-giao' || order.trangThai === 'cho-xac-nhan' ? `<div class="fb-wait">Bạn có thể đánh giá sản phẩm sau khi đơn hàng được giao thành công.</div>` : ''}
                        <div class="color-red" style="text-align:end">tổng: ${esc(order.giaHienThi)}</div>
                    </div>
                    <button class="xemthembtn">Xem thêm</button>
                    <div class="diachixemthem" style="display:none">
                        <div class="address_all" disableb>
                            <div class="nguoi_nhan">
                                <div>Tên người nhận: </div>
                                <div>${esc(order.tenNguoiNhan || '')}</div>
                            </div>
                            <div class="sdt_nhan">
                                <div>Sdt người nhận:</div>
                                <div>${esc(order.soDienThoaiNhan || '')}</div>
                            </div>
                            <div class="gmail_nhan">
                                <div>Gmail người nhận: </div>
                                <div>${esc(order.thuDienTuNguoiNhan || '')}</div>
                            </div>
                            <div class="diachi_nhan">
                                <div>Địa chỉ người nhận: </div>
                                <div>${esc(order.diaChiGiaoHang || '')}</div>
                            </div>
                            <div class="thanhtoanby">
                                <div>Phương thức thanh toán: ${esc(({ COD: "Thanh toán khi nhận hàng", PayBank: "Chuyển khoản ngân hàng", Shop: "Nhận tại cửa hàng" })[order.phuongThucThanhToan] || order.phuongThucThanhToan || "")}</div>
                            </div>
                        </div>
                        <div> Trạng Thái đơn hàng</div>
                        <div class="trangThaiDonHang">
                            <div class="track-step" ${order.trangThai==='cho-xac-nhan'?'style="color:#28a745"':'style="color:#6c757d"'}>Chờ xác nhận</div>
                            <div class="track-step" ${order.trangThai==='dang-giao'?'style="color:#28a745"':'style="color:#6c757d"'}>=> Đang giao đến bạn</div>
                            <div class="track-step" id="track-step-${esc(order.maDonHang)}" style="${order.trangThai === 'thanh-cong' ? 'color:#28a745' : (order.trangThai === 'da-huy' ? 'color:red; font-weight:bold' : 'color:#6c757d')}">
                                ${order.trangThai === 'da-huy' ? '=> Đã hủy' : '=> Thành công'}
                            </div>
                        </div>
                        ${order.trangThai === 'cho-xac-nhan' ? `<div class="dkhuy"><button class="huyDon-btn" data-id="${esc(order.maDonHang)}">Hủy đơn hàng</button></div>` : ''}
                    </div>
                `;
            });

            // pagination controls
            LichSuHTML += `<div class="lichsu-pagination" style="text-align:center; margin-top:12px;">
                <button class="ls-prev" ${ls_currentPage===1?'disabled':''}>‹</button>
                <span class="ls-pages">`;

            for (let p = 1; p <= totalPages; p++) {
                LichSuHTML += `<button class="ls-page" data-page="${p}" ${p===ls_currentPage?'style="font-weight:bold;"':''}>${p}</button>`;
            }

            LichSuHTML += `</span>
                <button class="ls-next" ${ls_currentPage===totalPages?'disabled':''}>›</button>
            </div>`;

            container.innerHTML = thongBaoChoThanhToan + LichSuHTML;
            if (window.UserFeedback) window.UserFeedback.decorate(container);

            // bind toggle xem them
            container.querySelectorAll('.xemthembtn').forEach(btn => {
                btn.addEventListener('click', function(){
                    const ndthem = this.nextElementSibling;
                    if (ndthem.style.display === 'none' || ndthem.style.display === '') {
                        ndthem.style.display = 'block';
                        this.textContent = 'Ẩn bớt';
                    } else {
                        ndthem.style.display = 'none';
                        this.textContent = 'Xem thêm';
                    }
                });
            });

            // bind huy buttons
            container.querySelectorAll('.huyDon-btn').forEach(btn => {
                btn.addEventListener('click', function(){
                    const huydonid = this.getAttribute('data-id');
                    if (confirm('bạn có chắc chắn muốn hủy đơn hàng này không?')){
                        huydonhang(huydonid);
                        // re-render current page after cancel
                        window.lichsumuahang(ls_currentPage);
                    }
                });
            });

            // bind pagination controls
            const prev = container.querySelector('.ls-prev');
            const next = container.querySelector('.ls-next');
            const pages = container.querySelectorAll('.ls-page');
            if (prev) prev.addEventListener('click', () => { if (ls_currentPage>1) { ls_currentPage--; window.lichsumuahang(ls_currentPage); } });
            if (next) next.addEventListener('click', () => { if (ls_currentPage<totalPages) { ls_currentPage++; window.lichsumuahang(ls_currentPage); } });
            pages.forEach(pbtn => pbtn.addEventListener('click', (e) => { const p = parseInt(e.target.dataset.page); if (p && p!==ls_currentPage) { ls_currentPage = p; window.lichsumuahang(ls_currentPage); } }));
        }

        // Chuẩn hóa + đồng bộ trạng thái khi load trang để không cần thao tác thủ công
        normalizeAndSyncOrders();
        // Render lại danh sách sau khi chuẩn hóa
        window.lichsumuahang && window.lichsumuahang();

        function huydonhang(donhuyid){
            const danhsach = window.getDanhSachDatHang();
            const donHang = danhsach.find(dh => dh.maDonHang === donhuyid);
            if(donHang && donHang.trangThai === 'cho-xac-nhan'){
                // Doi trang thai o ca 2 kho luu tru (User + Admin) va hoan lai ton kho.
                const result = window.ShopCore.setOrderStatus(donhuyid, 'huy');
                if (!result || result.ok === false) { alert((result && result.message) || 'Không thể hủy đơn hàng.'); return false; }
                alert('đã hủy đơn thành công');
                return true;
            }else{
                alert("không thể hủy đơn do đơn hàng đã giao hoặc đã được vận chuyển.");
            }
        }
    });
