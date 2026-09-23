  //lich su mua hang  
document.addEventListener("DOMContentLoaded",function(){
        // Lắng nghe sự kiện thay đổi trạng thái từ admin
        window.addEventListener('orderStatusChanged', function(e) {
            const orderId = e.orderId;
            const newStatus = e.newStatus;
            // Cập nhật UI khi có thay đổi
            updateOrderStatus(orderId, newStatus);
        });

    function updateOrderStatus(orderId, adminStatus) {
            // Chuyển đổi trạng thái từ admin sang user
            let userStatus;
            switch(adminStatus) {
                case 'moiDat':
                    userStatus = 'cho-xac-nhan';
                    break;
                case 'daXuLy':
                    userStatus = 'dang-giao';
                    break;
                case 'daGiao':
                    userStatus = 'thanh-cong';
                    break;
                case 'huy':
                    userStatus = 'da-huy';
                    break;
                default:
                    userStatus = 'cho-xac-nhan';
            }

            const thanhcong_faile = document.getElementById(`track-step-${orderId}`);
            if (thanhcong_faile) {
                if (userStatus === 'da-huy') {
                    thanhcong_faile.textContent = "=> Đã hủy";
                    thanhcong_faile.style.color = "red";
                    thanhcong_faile.style.fontWeight = "bold";
                } else if (userStatus === 'thanh-cong') {
                    thanhcong_faile.textContent = "=> Thành công";
                    thanhcong_faile.style.color = '#28a745';
                    thanhcong_faile.style.fontWeight = '';
                } else if (userStatus === 'dang-giao') {
                    // Display wording 'Đang giao' for 'dang-giao'
                    thanhcong_faile.textContent = "=> Đang giao đến bạn";
                    thanhcong_faile.style.color = '#6c757d';
                    thanhcong_faile.style.fontWeight = '';
                } else {
                    thanhcong_faile.textContent = "=> Đang xử lý";
                    thanhcong_faile.style.color = '#6c757d';
                    thanhcong_faile.style.fontWeight = '';
        }
    }

            // Cập nhật nút hủy đơn nếu trạng thái không còn là chờ xác nhận
            if (userStatus !== 'cho-xac-nhan') {
                const nuthuy = document.querySelector(`.huyDon-btn[data-id="${orderId}"]`)?.parentElement;
                if (nuthuy) {
                    nuthuy.style.display = 'none';
                }
            }

            // Cập nhật trạng thái hiển thị
            let displayText = '';
            switch (userStatus) {
                    case 'cho-xac-nhan':
                        displayText = 'Chờ xác nhận';
                        break;
                    case 'dang-giao':
                        displayText = 'Đang giao';
                        break;
                    case 'thanh-cong':
                        displayText = 'Thành công';
                        break;
                    case 'da-huy':
                        displayText = 'Đã hủy';
                        break;
                    default:
                        displayText = userStatus.replace(/-/g, ' ');
                        displayText = displayText.charAt(0).toUpperCase() + displayText.slice(1);
            }

            const statusSpan = document.querySelector(`[data-order-id="${orderId}"] .trangthai_waitting`);
            if (statusSpan) {
                statusSpan.className = `trangthai_${userStatus.replace(/-/g, '_')}`;
                statusSpan.textContent = displayText;
            } else {
                // Fallback: try to find the order block by cancel button data-id and update the displayed status there
                const btn = document.querySelector(`.huyDon-btn[data-id="${orderId}"]`);
                const altSpan = btn?.closest('.cart_LichSu')?.querySelector('.maLichSu span');
                if (altSpan) {
                    altSpan.className = `trangthai_${userStatus.replace(/-/g, '_')}`;
                    altSpan.textContent = ' ' + displayText;
                }
            }
        }

        // Đồng bộ hóa trạng thái đơn hàng từ localStorage vào định dạng hiển thị của user
        function normalizeAndSyncOrders() {
            try {
                const key = 'DanhSachDatHang';
                const ds = JSON.parse(localStorage.getItem(key) || '[]');
                let changedOrders = [];
                if (!Array.isArray(ds)) return;

                ds.forEach(o => {
                    if (!o) return;
                    // Nếu có trường admin 'status', map sang 'trangthai' user
                    if (o.status) {
                        let mapped = 'cho-xac-nhan';
                        switch(o.status) {
                            case 'moiDat': mapped = 'cho-xac-nhan'; break;
                            case 'daXuLy': mapped = 'dang-giao'; break;
                            case 'daGiao': mapped = 'thanh-cong'; break;
                            case 'huy': mapped = 'da-huy'; break;
                            default: mapped = o.trangthai || 'cho-xac-nhan';
                        }
                        if (o.trangthai !== mapped) {
                            o.trangthai = mapped;
                            changedOrders.push({ id: o.id, newStatus: o.status });
                        }
                    }

                });

                if (changedOrders.length) {
                    localStorage.setItem(key, JSON.stringify(ds));
                    // Phát event cho từng đơn đã thay đổi để các tab khác cập nhật UI ngay
                    changedOrders.forEach(ch => {
                        const ev = new Event('orderStatusChanged');
                        ev.orderId = ch.id;
                        ev.newStatus = ch.newStatus;
                        window.dispatchEvent(ev);
                    });
                }
            } catch (err) {
                console.error('normalizeAndSyncOrders error', err);
            }
        }
        // Pagination settings for order history (3 orders per page)
        let ls_currentPage = 1;
        const ls_itemsPerPage = 3;

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

            // Filter by stable user id first; keep legacy snapshots compatible by email/username fallback.
            const userId = userlogin.id || null;
            const userEmail = String(userlogin.email || '').trim().toLowerCase();
            const userName = String(userlogin.userName || userlogin.username || '').trim().toLowerCase();
            const userOrders = danhsach
                .filter((order) => {
                    if (!order?.user) return false;
                    if (userId && order.userId && order.userId === userId) return true;
                    const orderEmail = String(order.user.email || '').trim().toLowerCase();
                    const orderName = String(order.user.userName || order.user.username || order.user.name || '').trim().toLowerCase();
                    return !!((userEmail && orderEmail === userEmail) || (userName && orderName === userName));
                })
                .sort((a, b) => String(b.id || '').localeCompare(String(a.id || '')));

            // save any normalization back
            localStorage.setItem('DanhSachDatHang', JSON.stringify(danhsach));

            const container = document.querySelector('.lichsumuahanglist');
            if (!container) return;

            if (userOrders.length === 0) {
                container.innerHTML = `<h2>Bạn chưa đặt đơn hàng nào hết</h2>`;
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
                if (!order.trangthai) order.trangthai = 'cho-xac-nhan';
                let trangthaiTEXT = '', trangthaiclass = '';
                switch(order.trangthai){
                    case 'cho-xac-nhan': trangthaiTEXT='Chờ xác nhận'; trangthaiclass='trangthai_waitting'; break;
                    case 'dang-giao': trangthaiTEXT='Đang giao'; trangthaiclass='trangthai_shipping'; break;
                    case 'thanh-cong': trangthaiTEXT='Thành công'; trangthaiclass='trangthai_succes'; break;
                    case 'da-huy': trangthaiTEXT='Đã hủy'; trangthaiclass='trangthai_cancel color-red'; break;
                    default: trangthaiTEXT=order.trangthai; trangthaiclass='trangthai_waitting';
                }

                LichSuHTML += `<div class="cart_LichSu">
                    <div class="maLichSu">
                        <div>Mã đơn hàng:<span>${order.id}</span></div>
                        <div>Ngày đặt:<span>${new Date(Number(String(order.id || '').replace('DH',''))).toLocaleDateString('vi-VN')}</span></div>
                        <div> Trạng Thái: <span class="${trangthaiclass}"> ${trangthaiTEXT}</span></div>
                    </div>
                    <div>`;

                (order.product || []).forEach(item => {
                    LichSuHTML += `<div class="all-cart">
                            <img src="${item.image}" alt="${item.name}" class="item-img">
                            <div class="name-price-quantity">
                                <div class="item-name">${item.name}</div>
                                <div class="item-price">${item.price}</div>
                                <div class="item-quantity-all">
                                    <div class="quantity">${item.quantity}</div>
                                </div>
                            </div>
                        </div>`;
                });

                LichSuHTML += `
                        <div class="color-red" style="text-align:end">tổng: ${order.price}</div>
                    </div>
                    <button class="xemthembtn">Xem thêm</button>
                    <div class="diachixemthem" style="display:none">
                        <div class="address_all" disableb>
                            <div class="nguoi_nhan">
                                <div>Tên người nhận: </div>
                                <div>${order.info?.name || ''}</div>
                            </div>
                            <div class="sdt_nhan">
                                <div>Sdt người nhận:</div>
                                <div>${order.info?.phone || ''}</div>
                            </div>
                            <div class="gmail_nhan">
                                <div>Gmail người nhận: </div>
                                <div>${order.info?.email || ''}</div>
                            </div>
                            <div class="diachi_nhan">
                                <div>Địa chỉ người nhận: </div>
                                <div>${order.info?.address || ''}</div>
                            </div>
                            <div class="thanhtoanby">
                                <div>Phương thức thanh toán:${order.payment}</div>
                            </div>
                        </div>
                        <div> Trạng Thái đơn hàng</div>
                        <div class="trangThaiDonHang">
                            <div class="track-step" ${order.trangthai==='cho-xac-nhan'?'style="color:#28a745"':'style="color:#6c757d"'}>Chờ xác nhận</div>
                            <div class="track-step" ${order.trangthai==='dang-giao'?'style="color:#28a745"':'style="color:#6c757d"'}>=> Đang giao đến bạn</div>
                            <div class="track-step" id="track-step-${order.id}" style="${order.trangthai === 'thanh-cong' ? 'color:#28a745' : (order.trangthai === 'da-huy' ? 'color:red; font-weight:bold' : 'color:#6c757d')}">
                                ${order.trangthai === 'da-huy' ? '=> Đã hủy' : '=> Thành công'}
                            </div>
                        </div>
                        ${order.trangthai === 'cho-xac-nhan' ? `<div class="dkhuy"><button class="huyDon-btn" data-id="${order.id}">Hủy đơn hàng</button></div>` : ''}
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

            container.innerHTML = LichSuHTML;

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
            const donHang = danhsach.find(dh => dh.id === donhuyid);
            if(donHang && donHang.trangthai === 'cho-xac-nhan'){
                donHang.trangthai='da-huy';
                localStorage.setItem('DanhSachDatHang',JSON.stringify(danhsach));
                alert('đã hủy đơn thành công');
                const thanhcong_faile = document.getElementById(`track-step-${donhuyid}`);
                if (thanhcong_faile) {
                    thanhcong_faile.textContent = "=> Đã hủy"; 
                    thanhcong_faile.style.color = "red";      
                    thanhcong_faile.style.fontWeight = "bold"; 
                }
                const nuthuy = document.querySelector(`.huyDon-btn[data-id="${donhuyid}"]`)?.parentElement;
                if (nuthuy) {
                    nuthuy.style.display = 'none';
                }
            
            }else{
                alert("không thể hủy đơn do đơn hàng đã giao hoặc đã được vận chuyển.");
            }
        }

    });
