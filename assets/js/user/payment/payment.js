document.addEventListener('DOMContentLoaded',function(){
    const PENDING_KEY = 'CurrDanhSachDatHang';
    // Don chuyen khoan cho xac nhan chi giu 30 phut (thuoc tinh hetHanLuc = moc thoi gian ms).
    const PENDING_TTL_MS = 30 * 60 * 1000;
    const esc = ShopCore.esc;

    function getaddres() {
    const currentUser = getlogin();
    let selected = null;
    try {
        selected = JSON.parse(localStorage.getItem("selectedAddress")) || null;
    } catch (e) {
        selected = null;
    }

    if (selected?.diaChi) return selected;

    const addresses = Array.isArray(currentUser?.diaChiPhu) ? currentUser.diaChiPhu : [];
    const fallback = addresses.find((address) => address.macDinh) || addresses[0];
    if (fallback?.diaChi) {
        safeSet("selectedAddress", JSON.stringify(fallback));
        return fallback;
    }

    if (currentUser?.diaChi) {
        const profileAddress = {
            tenNguoiNhan: currentUser.hoTen || "",
            soDienThoai: currentUser.soDienThoai || "",
            thuDienTu: currentUser.thuDienTu || "",
            diaChi: currentUser.diaChi
        };
        safeSet("selectedAddress", JSON.stringify(profileAddress));
        return profileAddress;
    }

    return null;
}
    // Ghi localStorage, tra ve false neu that bai (vd. QuotaExceededError).
    function safeSet(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error("Khong the luu " + key + ":", error);
            return false;
        }
    }
    function notify(title, text, icon) {
        if (typeof Swal !== "undefined") {
            Swal.fire({ icon: icon || "warning", title: title, text: text, confirmButtonText: "Đã hiểu" });
        } else {
            alert(text);
        }
    }
    window.getDanhSachDatHang=function(){
        try {
            const list = JSON.parse(localStorage.getItem("DanhSachDatHang"));
            return Array.isArray(list) ? list : [];
        } catch (error) {
            return [];
        }
    }
    function getlogin(){
        return window.UserSession?.getCurrentUser?.() || null;
    }
    function getproduct(){
        try {
            return JSON.parse(localStorage.getItem("productsLocal"))||[];
        } catch (error) {
            return [];
        }
    }
    // Phi van chuyen: dung ShopCore.shippingFee (30.000d, mien phi tu 10.000.000d, nhan tai cua hang = 0).
    function calcShipping(subtotal, paymentfs) {
        if (typeof ShopCore.shippingFee === "function") return ShopCore.shippingFee(subtotal, paymentfs);
        return (paymentfs === "COD" || paymentfs === "PayBank") && subtotal < 10000000 ? 30000 : 0;
    }
    window.calcShippingFee = calcShipping;
    function orderLineKey(line) {
        // Cung khoa voi cartKey trong cart.js.
        return `${line.maSanPham}::${line.kichCoDaChon || ""}`;
    }
    // Chi nguoi dat moi duoc xem/xac nhan don: so khop maKhachHang (neu tai khoan cu khong co ma thi so khop email).
    function ownsOrder(user, order) {
        if (!user || !order) return false;
        if (user.maKhachHang) return order.maKhachHang === user.maKhachHang;
        return !!(user.thuDienTu && order.khachHang?.thuDienTu === user.thuDienTu);
    }
    function addressRowsHtml(data, labels) {
        return `<div class="address_all">
                <div class="nguoi_nhan">
                    <div>${labels[0]}</div>
                    <div>${esc(data.tenNguoiNhan)}</div>
                </div>
                <div class="sdt_nhan">
                    <div>${labels[1]}</div>
                    <div>${esc(data.soDienThoai)}</div>
                </div>
                <div class="gmail_nhan">
                    <div>${labels[2]}</div>
                    <div>${esc(data.thuDienTu)}</div>
                </div>
                <div class="diachi_nhan">
                    <div>${labels[3]}</div>
                    <div>${esc(data.diaChi)}</div>
                </div>
            </div>
            `;
    }
    window.renderaddres=function(){
        const diachi=document.querySelectorAll(".diachi");
        const addres=getaddres();
        let addreshtml='';
       if (!addres || !addres.diaChi) {
    alert("Vui lòng chọn địa chỉ giao hàng trước khi thanh toán");
    window.location.href = new URL(
        "address.html",
        window.location.href
    ).href;
    return;
} else {
            addreshtml=addressRowsHtml(addres, ["Tên người nhận: ", "Sdt người nhận:", "Gmail người nhận: ", "Địa chỉ người nhận: "]);
        }
        diachi.forEach(element => {
            element.innerHTML=addreshtml;
        });
    }
    // Hien dia chi nguoi nhan lay tu CHINH DON HANG (khong dung selectedAddress hien tai).
    window.renderOrderAddress=function(order){
        const html = addressRowsHtml({
            tenNguoiNhan: order?.tenNguoiNhan,
            soDienThoai: order?.soDienThoaiNhan,
            thuDienTu: order?.thuDienTuNguoiNhan,
            diaChi: order?.diaChiGiaoHang
        }, ["Tên người nhận: ", "Sdt người nhận:", "Gmail người nhận: ", "Địa chỉ người nhận: "]);
        document.querySelectorAll(".diachi").forEach(element => {
            element.innerHTML = html;
        });
    }
    // Khong co don hang de hien: thay noi dung trang bang thong bao nhe nhang.
    window.renderNoOrder=function(containerId){
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `<div class="no-order" style="text-align:center;padding:48px 20px;">
            <p>Không tìm thấy đơn hàng.</p>
            <p><a href="pages/home.html">Quay về trang chủ</a></p>
        </div>`;
    }

    window.ktsoluong=function(){
        const product=getproduct();
        const cart=window.getCheckoutCart ? window.getCheckoutCart() : [];
        if (!cart.length) {
            notify("Chưa chọn sản phẩm", "Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
            return false;
        }
        let isValid = true; 
        cart.forEach(element => {
           const item=product.find(p=>p.maSanPham===element.maSanPham);
            const selectedSize = String(element.kichCoDaChon || "");
            const available = item?.tonKhoTheoSize && selectedSize
                ? Math.max(0, Number(item.tonKhoTheoSize[selectedSize]) || 0)
                : Math.max(0, Number(item?.soLuongTon) || 0);
            if(!item || available < Number(element.soLuong)){
                const message = `Sản phẩm "${element.tenSanPham}" không đủ. Size ${selectedSize || "này"} chỉ còn ${available}.`;
                notify("Sản phẩm không đủ", message);
                isValid=false;
                return; 
        } 
    });
    return isValid;
    }
    // Chi luu cac truong can thiet (khong luu mat khau, gia nhap, ton kho cua san pham).
    function slimItem(item) {
        const entry = {
            maSanPham: item.maSanPham,
            tenSanPham: item.tenSanPham,
            maLoai: item.maLoai,
            hinhAnh: item.hinhAnh,
            giaHienThi: item.giaHienThi,
            donGia: Number(item.giaBan),
            soLuong: item.soLuong
        };
        if (item.kichCoDaChon) entry.kichCoDaChon = item.kichCoDaChon;
        return entry;
    }
    function slimUser(user) {
        return {
            maKhachHang: user.maKhachHang || null,
            hoTen: user.hoTen || "",
            thuDienTu: user.thuDienTu || "",
            soDienThoai: user.soDienThoai || ""
        };
    }
    // Don moi nhat cua NGUOI DANG DANG NHAP; chua dang nhap thi khong tra don cua ai ca.
    window.getLatestUserOrder = function () {
        const user = getlogin();
        if (!user || Array.isArray(user)) return null;
        const mine = getDanhSachDatHang().filter((order) => ownsOrder(user, order));
        return mine.length ? mine[mine.length - 1] : null;
    };

    function readPending() {
        try {
            const list = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
            return (Array.isArray(list) ? list[0] : null) || null;
        } catch (error) {
            return null;
        }
    }
    function clearPending() {
        localStorage.removeItem(PENDING_KEY);
    }
    function isPendingExpired(pending) {
        const expireAt = Number(pending?.hetHanLuc);
        // Don cu khong co hetHanLuc coi nhu da het han.
        return !expireAt || Date.now() > expireAt;
    }
    // Tra ve { order, message }. Don khong hop le (khac nguoi dung / het han / hong) se bi xoa.
    window.getPendingBankOrder = function () {
        const user = getlogin();
        const pending = readPending();
        if (!pending) return { order: null, message: 'Không tìm thấy đơn hàng đang chờ thanh toán.' };
        if (!user || Array.isArray(user)) {
            clearPending();
            return { order: null, message: 'Vui lòng đăng nhập để thanh toán.' };
        }
        if (!ownsOrder(user, pending)) {
            clearPending();
            return { order: null, message: 'Đơn hàng đang chờ thanh toán không thuộc tài khoản hiện tại. Vui lòng đặt hàng lại.' };
        }
        if (isPendingExpired(pending)) {
            clearPending();
            return { order: null, message: 'Đơn hàng chuyển khoản đã hết hạn (quá 30 phút). Vui lòng đặt hàng lại.' };
        }
        return { order: pending, message: '' };
    };

    // Xoa khoi gio dung cac dong cua don (khop maSanPham::kichCoDaChon) va bo chon cac dong do.
    function removeOrderLinesFromCart(order) {
        const keys = new Set((Array.isArray(order?.chiTiet) ? order.chiTiet : []).map(orderLineKey));
        if (!keys.size) return true;
        let ok = true;
        try {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const remaining = (Array.isArray(cart) ? cart : []).filter((item) => !keys.has(orderLineKey(item)));
            ok = safeSet('cart', JSON.stringify(remaining));
        } catch (error) {
            ok = false;
        }
        try {
            const selected = JSON.parse(localStorage.getItem('selectedCartItems') || '[]');
            const left = (Array.isArray(selected) ? selected : []).filter((key) => !keys.has(key));
            if (left.length) safeSet('selectedCartItems', JSON.stringify(left));
            else localStorage.removeItem('selectedCartItems');
        } catch (error) {
            localStorage.removeItem('selectedCartItems');
        }
        return ok;
    }
    // Ghi don vao DanhSachDatHang; false neu khong ghi duoc (vd. het dung luong).
    function persistOrder(order) {
        try {
            const danhsach = getDanhSachDatHang();
            danhsach.push(order);
            localStorage.setItem('DanhSachDatHang', JSON.stringify(danhsach));
            return true;
        } catch (error) {
            console.error('Khong the luu don hang:', error);
            return false;
        }
    }
    // Hoan lai ton kho da tru (khi khong ghi duoc don). snapshot = chuoi productsLocal truoc khi tru, dung neu hoan kho that bai.
    function rollbackStock(order, snapshot) {
        let restored = false;
        try {
            const products = getLocalProducts();
            ShopCore.orderLines(order).forEach((line) => {
                ShopCore.adjustStock(products.find((item) => item.maSanPham === line.id), line.size, line.qty);
            });
            restored = saveLocalProducts(products) !== false;
        } catch (error) {
            console.error('Khong the hoan kho:', error);
        }
        if (!restored && typeof snapshot === 'string') safeSet('productsLocal', snapshot);
        delete order.daTruKho;
    }
    // Tru kho + luu don; neu khong luu duoc don thi hoan kho. Tra ve { ok, message }.
    function finalizeOrder(order) {
        const snapshot = localStorage.getItem('productsLocal');
        const stock = ShopCore.deductOrderStock(order);
        if (!stock.ok) return stock;
        if (!persistOrder(order)) {
            rollbackStock(order, snapshot);
            return { ok: false, message: 'Không thể lưu đơn hàng (bộ nhớ trình duyệt đã đầy). Đơn hàng chưa được tạo và giỏ hàng được giữ nguyên.', storage: true };
        }
        removeOrderLinesFromCart(order);
        window.dispatchEvent(new Event('userOrdersUpdated'));
        return { ok: true };
    }

    // Tao don hang. COD/Shop: tru kho va luu don ngay. PayBank: chi luu tam, don chinh thuc duoc tao khi xac nhan chuyen khoan.
    // Tra ve true neu thanh cong.
    window.thanhtoan=function(paymentfs){
        // Moi lan dat hang moi deu bo don chuyen khoan dang cho cu (tranh dung lai don cu).
        clearPending();
        if (paymentfs !== "COD" && paymentfs !== "PayBank" && paymentfs !== "Shop") {
            notify('Thanh toán', 'Phương thức thanh toán không hợp lệ.');
            return false;
        }
        const userLogin=getlogin();
        if (!userLogin || Array.isArray(userLogin)) {
            alert('Vui lòng đăng nhập trước khi đặt hàng.');
            return false;
        }
        const address=getaddres();
        if (!address || !address.diaChi) {
            alert('Vui lòng chọn địa chỉ giao hàng trước khi thanh toán.');
            return false;
        }
        const cart=window.getCheckoutCart ? window.getCheckoutCart() : [];
        if (!cart.length) {
            alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán.');
            return false;
        }
        let subtotal=0;
        cart.forEach(item=>{
            subtotal+=Number(item.giaBan)*Number(item.soLuong);
        });
        const shippingFee=calcShipping(subtotal, paymentfs);
        const tongtien=subtotal+shippingFee;
        const neworder={
            maDonHang:"DH"+Date.now(),
            maKhachHang: userLogin.maKhachHang || null,
            tenNguoiNhan: address.tenNguoiNhan,
            soDienThoaiNhan: address.soDienThoai,
            thuDienTuNguoiNhan: address.thuDienTu,
            diaChiGiaoHang: address.diaChi,
            khachHang:slimUser(userLogin),
            chiTiet:cart.map(slimItem),
            phuongThucThanhToan:paymentfs,
            giaHienThi:tongtien.toLocaleString('vi-VN') + 'đ',
            tongTien:tongtien,
            tamTinh:subtotal,
            tienVanChuyen:shippingFee,
            phiVanChuyen:shippingFee.toLocaleString('vi-VN') + 'đ',
            ngayDat: new Date().toISOString(),
            trangThai: 'cho-xac-nhan',
            trangThaiQuanTri: 'moiDat',
            trangThaiThanhToan: paymentfs === "PayBank" ? 'pending' : 'unpaid'
        };

        if (paymentfs === "PayBank") {
            // Chua thanh toan: khong tru kho, khong dua vao danh sach don cua Admin.
            neworder.hetHanLuc = Date.now() + PENDING_TTL_MS;
            if (!safeSet(PENDING_KEY, JSON.stringify([neworder]))) {
                clearPending();
                notify('Không thể tạo đơn', 'Không thể lưu đơn hàng chuyển khoản (bộ nhớ trình duyệt đã đầy). Giỏ hàng được giữ nguyên.', 'error');
                return false;
            }
            window.SumCartEnd(1);
            return true;
        }

        const result = finalizeOrder(neworder);
        if (!result.ok) {
            const storageError = result.storage || /Không thể lưu/.test(result.message || '');
            notify(storageError ? 'Không thể đặt hàng' : 'Sản phẩm không đủ', result.message, storageError ? 'error' : 'warning');
            return false;
        }
        window.SumCartEnd(0);
        return true;
    }

    // Xac nhan da chuyen khoan: kiem tra don cua dung nguoi dung / con han, kiem tra ton kho, tru kho va chinh thuc tao don.
    window.confirmBankOrder=function(){
        const checked = window.getPendingBankOrder();
        const pending = checked.order;
        if (!pending) return { ok: false, message: checked.message || 'Không tìm thấy đơn hàng đang chờ thanh toán.' };
        const danhsach = getDanhSachDatHang();
        if (danhsach.some((order) => order.maDonHang === pending.maDonHang)) {
            clearPending();
            removeOrderLinesFromCart(pending);
            return { ok: true };
        }
        const order = { ...pending, trangThaiThanhToan: 'paid' };
        delete order.hetHanLuc;
        const result = finalizeOrder(order);
        if (!result.ok) return result;
        clearPending();
        return { ok: true };
    }
    window.cancelBankOrder=function(){
        clearPending();
    }

    window.SumCartEnd=function(num){
        let danhsach = [];
        if(num===1) {
            const pending = readPending();
            danhsach = pending ? [pending] : [];
        }
        if(num===0) {
            const latest = window.getLatestUserOrder();
            danhsach = latest ? [latest] : [];
        }
        if (danhsach.length === 0) return;
        const last = danhsach[danhsach.length - 1];
        document.querySelectorAll(".SumCartEnd").forEach(el => {
            el.textContent = last.giaHienThi;
        });
        document.querySelectorAll(".madhck").forEach(el=>{
            el.textContent = last.maDonHang;
        });
        document.querySelectorAll(".Ship_money").forEach(el => {
            el.textContent = last.phiVanChuyen;
        });
    }
});
