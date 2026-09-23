document.addEventListener('DOMContentLoaded',function(){
    // Xóa đơn hàng đồng hồ (legacy) khỏi DanhSachDatHang
    function xoaDonDongHo() {
        try {
            const ds = JSON.parse(localStorage.getItem("DanhSachDatHang")) || [];
            if (!Array.isArray(ds) || !ds.length) return;
            const catalog = JSON.parse(localStorage.getItem("productsLocal")) || [];
            const known = new Set(catalog.map(p => String(p.id)));
            const laDongHo = (o) => {
                const items = Array.isArray(o.product) ? o.product : Array.isArray(o.items) ? o.items : [];
                if (!items.length) return false;
                const hit = items.some(it => {
                    const key = String(it.productId || it.id || it.name || "");
                    return key.toUpperCase().startsWith("SH-") || known.has(key) || known.has(String(it.name || ""));
                });
                return !hit;
            };
            const kept = ds.filter(o => !laDongHo(o));
            if (kept.length !== ds.length) {
                localStorage.setItem("DanhSachDatHang", JSON.stringify(kept));
                window.dispatchEvent(new Event("userOrdersUpdated"));
            }
        } catch (e) { /* noop */ }
    }
    xoaDonDongHo();

    function getaddres() {
    try {
        return JSON.parse(localStorage.getItem("selectedAddress")) || null;
    } catch (e) {
        return null;
    }
}
    window.getDanhSachDatHang=function(){
        return JSON.parse(localStorage.getItem("DanhSachDatHang"))||[];

    } 
    function getlogin(){
        return window.UserSession?.getCurrentUser?.() || null;
    }
    function getproduct(){
        return JSON.parse(localStorage.getItem("productsLocal"))||[];
    }
    window.renderaddres=function(){
        const diachi=document.querySelectorAll(".diachi");
        const addres=getaddres();
        let addreshtml='';
       if (!addres || !addres.address) {
    alert("Vui lòng chọn địa chỉ giao hàng trước khi thanh toán");
    window.location.href = new URL(
        "address.html",
        window.location.href
    ).href;
    return;
} else {
            addreshtml=`<div class="address_all" disableb>
                <div class="nguoi_nhan">
                    <div>Tên người nhận: </div>
                    <div>${addres.name}</div>
                </div>
                <div class="sdt_nhan">
                    <div>Sdt người nhận:</div>
                    <div>${addres.phone}</div>
                </div>
                <div class="gmail_nhan">
                    <div>Gmail người nhận: </div>
                    <div>${addres.email}</div>
                </div>
                <div class="diachi_nhan">
                    <div>Địa chỉ người nhận: </div>
                    <div>${addres.address}</div>
                </div>
            </div>
            `
        }
        diachi.forEach(element => {
            element.innerHTML=addreshtml;
        });
    }

    window.ktsoluong=function(){
        const product=getproduct();
        const cart=getcart();
        let isValid = true; 
        cart.forEach(element => {
           const item=product.find(p=>p.id===element.id);
            if(item.quantity<element.quantity){
                alert(`Rất tiếc, sản phẩm "${element.name}" không đủ số lượng tồn kho.`);
                isValid=false;
                return; 
        } 
    });
    return isValid;
    }
    window.trusoluong=function(){
        const product = getproduct();
        const cart = getcart();
        cart.forEach(el=>{
            const item = product.find(p=>p.id===el.id);
            if (item) item.quantity = Math.max(0, (item.quantity || 0) - el.quantity);
        });
        localStorage.setItem("productsLocal", JSON.stringify(product));
        window.dispatchEvent(new Event("productsUpdated"));
    }
    window.thanhtoan=function(paymentfs){
        
           
        const danhsach=getDanhSachDatHang();
        const userLogin=getlogin();
        if (!userLogin || Array.isArray(userLogin)) {
            alert('Vui lòng đăng nhập trước khi đặt hàng.');
            return;
        }
        const address=getaddres();
        const cart=getcart();
        let tongtien=0;
        cart.forEach(item=>{
            tongtien+=item.priceValue*item.quantity;
        });
        let ship='0đ';
        if(paymentfs==="COD"||paymentfs==="PayBank"){
            ship='30.000đ';
            tongtien+=30000;
        }
        const TongTienString = tongtien.toLocaleString('vi-VN') + 'đ';
        const neworder={
            id:"DH"+Date.now(),
            userId: userLogin.id || null,
            info:address,
            user:userLogin,
            product:cart,
            payment:paymentfs,
            price:TongTienString,
            totalPrice:tongtien,
            priceShip:ship,
            // meta for admin/user sync
            orderDate: new Date().toISOString(),
            trangthai: 'cho-xac-nhan'
        }
        // add order to list
        danhsach.push(neworder);

        // Always persist to the main orders key so admin panel can pick it up
        localStorage.setItem('DanhSachDatHang', JSON.stringify(danhsach));

        // Keep the CurrDanhSachDatHang for payment flow (bank redirect) if used
        if (paymentfs === "PayBank") {
            localStorage.setItem('CurrDanhSachDatHang', JSON.stringify([neworder]));
            ktsoluong();
            window.SumCartEnd(1);
        } else {
            window.SumCartEnd(0);
        }

        // Notify same-window listeners (admin may be in same SPA route)
        try {
            // custom event that admin panel can listen for (works in same tab)
            window.dispatchEvent(new Event('userOrdersUpdated'));
        } catch (e) {}
    }
    
    window.SumCartEnd=function(num){
    if(num===1) danhsach = JSON.parse(localStorage.getItem('CurrDanhSachDatHang')) || [];
    if(num===0)danhsach=getDanhSachDatHang();
    
        if (danhsach.length === 0) return;
        document.querySelectorAll(".SumCartEnd").forEach(el => {
            el.textContent = danhsach[danhsach.length - 1].price;
        });
        document.querySelectorAll(".madhck").forEach(el=>{
            el.textContent = danhsach[danhsach.length - 1].id;
        });
        document.querySelectorAll(".Ship_money").forEach(el => {
            el.textContent = danhsach[danhsach.length - 1].priceShip;
        });
    }
});