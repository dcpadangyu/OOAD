document.addEventListener("DOMContentLoaded", function () {
    window.getCurrDanhsach=function(){
        return JSON.parse(localStorage.getItem('CurrDanhSachDatHang'))||[];
    }
    const GioHangBTN = document.querySelectorAll('.ToiGioHangBtn');
    const thanhtoanBTN = document.querySelectorAll('.tienhanhthanhtoanBtn');
    const banner = document.getElementById('chitietsanpham-banner-index');
    const lichsu = document.getElementById('LichSuMuaHang');
    const thanhtoan = document.getElementById('ThanhToan');
    const thanhtoan_tb = document.getElementById('ThanhToan_ThatBai');
    const thanhtoan_tc = document.getElementById('ThanhToan_ThanhCong');
    const thanhtoan_ch = document.getElementById('ThanhToan_CuaHang');
    const thanhtoan_ck = document.getElementById('ThanhToan_ChuyenKhoan');
    const thanhtoan_cod = document.getElementById('ThanhToan_TienMat');
    const giohang = document.getElementById('GioHang');
    const indexgiohang = document.getElementById('indexGioHang');
    document.getElementById("open-cart-btn").addEventListener('click', function (event) {
        event.preventDefault();
        document.getElementById("indexGioHang").style.display = 'block';
    });
    document.getElementById("bim-left").addEventListener('click', function () {
        document.getElementById("indexGioHang").style.display = 'none';
    });
    GioHangBTN.forEach(function (btn) {
        btn.addEventListener('click', function () {
            indexgiohang.style.display = 'none';
            banner.style.display = 'none';
            thanhtoan.style.display = 'none';
            thanhtoan_tc.style.display = 'none';
            thanhtoan_tb.style.display = 'none';
            lichsu.style.display = 'none';
            thanhtoan_ch.style.display = 'none';
            thanhtoan_ck.style.display = 'none';
            thanhtoan_cod.style.display = 'none';
            giohang.style.display = 'block';
        });
    });
    thanhtoanBTN.forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (!ktlogin()) {
                indexgiohang.style.display = 'none';
                banner.style.display = 'none';
                thanhtoan.style.display = 'none';
                lichsu.style.display = 'none';
                thanhtoan_ck.style.display = 'none';
                thanhtoan_cod.style.display = 'none';
                giohang.style.display = 'none';
                thanhtoan_ch.style.display = 'none';
                thanhtoan_tc.style.display = 'none';
                thanhtoan_tb.style.display = 'none';
                window.navigateTo("login");
                return;
            }
            if(!ktgiohang())return ;
            indexgiohang.style.display = 'none';
            banner.style.display = 'none';
            thanhtoan.style.display = 'block';
            lichsu.style.display = 'none';
            thanhtoan_ck.style.display = 'none';
            thanhtoan_tc.style.display = 'none';
            thanhtoan_tb.style.display = 'none';
            thanhtoan_cod.style.display = 'none';
            giohang.style.display = 'none';
            thanhtoan_ch.style.display = 'none';
            const selectedPayment = document.querySelector('input[name="phuong-thuc-tt"]:checked');
            if (selectedPayment) selectedPayment.checked = true;
            window.renderaddres();
        });
    });
    //thanh toán thành công
    document.querySelectorAll(".chuyenqua_giaodich_thanhcong").forEach(function (btn) {
        btn.addEventListener('click', function () {
            const cur=getCurrDanhsach();
            if(cur.length!==0){
                window.trusoluong();
                window.SumCartEnd(1);
                localStorage.setItem('DanhSachDatHang',JSON.stringify(cur)); 
                localStorage.removeItem('CurrDanhSachDatHang');
            }

            indexgiohang.style.display = 'none';
            banner.style.display = 'none';
            thanhtoan.style.display = 'none';
            thanhtoan_tc.style.display = 'block';
            thanhtoan_tb.style.display = 'none';
            lichsu.style.display = 'none';
            thanhtoan_ck.style.display = 'none';
            thanhtoan_cod.style.display = 'none';
            giohang.style.display = 'none';
            thanhtoan_ch.style.display = 'none';
            setTimeout(() => {
                localStorage.removeItem('cart');
            }, 1500);

        });
    });
    document.querySelector(".chuyenqua_giaodich_thatbai").addEventListener('click', function () {
        localStorage.removeItem('CurrDanhSachDatHang');
        indexgiohang.style.display = 'none';
        banner.style.display = 'none';
        thanhtoan.style.display = 'none';
        thanhtoan_tc.style.display = 'none';
        thanhtoan_tb.style.display = 'block';
        lichsu.style.display = 'none';
        thanhtoan_ck.style.display = 'none';
        thanhtoan_cod.style.display = 'none';
        giohang.style.display = 'none';
        thanhtoan_ch.style.display = 'none';
    });
    document.querySelector(".CH_BTN").addEventListener('click', function () {
        const kt=window.ktsoluong();
        if(!kt)return;
        else window.trusoluong();
        window.thanhtoan("Shop");
        renderallcart();
        indexgiohang.style.display = 'none';
        banner.style.display = 'none';
        thanhtoan.style.display = 'none';
        lichsu.style.display = 'none';
        thanhtoan_ck.style.display = 'none';
        thanhtoan_cod.style.display = 'none';
        thanhtoan_ch.style.display = 'block';
        giohang.style.display = 'none';
        setTimeout(() => {
            localStorage.removeItem('cart');
        }, 1500);

    });
    document.querySelector(".TM_BTN").addEventListener('click', function () {
        const kt=window.ktsoluong();
        if(!kt)return; 
        else window.trusoluong();
        window.thanhtoan("COD");
        renderallcart();
        indexgiohang.style.display = 'none';
        banner.style.display = 'none';
        thanhtoan.style.display = 'none';
        lichsu.style.display = 'none';
        thanhtoan_ck.style.display = 'none';
        thanhtoan_cod.style.display = 'block';
        thanhtoan_ch.style.display = 'none';
        giohang.style.display = 'none';
        setTimeout(() => {
            localStorage.removeItem('cart');
        }, 1500);
    });
    document.querySelector(".CK_BTN").addEventListener('click', function () {
        const kt=window.ktsoluong();
        if(!kt)return;
        window.thanhtoan("PayBank");
        renderallcart();
        indexgiohang.style.display = 'none';
        banner.style.display = 'none';
        thanhtoan.style.display = 'none';
        lichsu.style.display = 'none';
        thanhtoan_ck.style.display = 'block';
        thanhtoan_cod.style.display = 'none';
        thanhtoan_ch.style.display = 'none';
        giohang.style.display = 'none';
    });
    document.getElementById('LichSuMuaHangBTN').addEventListener('click', function () {
        if (!ktlogin()) {
            indexgiohang.style.display = 'none';
            banner.style.display = 'none';
            thanhtoan.style.display = 'none';
            lichsu.style.display = 'none';
            thanhtoan_ck.style.display = 'none';
            thanhtoan_cod.style.display = 'none';
            giohang.style.display = 'none';
            thanhtoan_tc.style.display = 'none';
            thanhtoan_tb.style.display = 'none';
            thanhtoan_ch.style.display = 'none';
            window.navigateTo("login");
        }
        indexgiohang.style.display = 'none';
        banner.style.display = 'none';
        thanhtoan_tc.style.display = 'none';
        thanhtoan_tb.style.display = 'none';
        thanhtoan.style.display = 'none';
        lichsu.style.display = 'block';
        thanhtoan_ck.style.display = 'none';
        thanhtoan_cod.style.display = 'none';
        thanhtoan_ch.style.display = 'none';
        giohang.style.display = 'none';
        window.lichsumuahang();

    });
    const moreAddress = document.querySelector('.more_address');
    if (moreAddress) moreAddress.addEventListener('click', function () {
        window.navigateTo("diachi");
    });
    window.getlogin=function() {
        return JSON.parse(localStorage.getItem("currentUser")) || [];
    }
    function ktlogin() {
        const userLogin = getlogin();
        if (!userLogin || Array.isArray(userLogin) || !userLogin.userName && !userLogin.username && !userLogin.name && !userLogin.email) {
            alert('Vui lòng đăng nhập trước khi thanh toán');
            return false;
        }
        else {
            return true;
        }
    }
    function ktgiohang(){
        const cart= window.getcart();
            if(cart.length==0){
            alert("bạn cần có sản phẩm trong giỏ hàng mới được thanh toán");
            return false ;
            }
            else return true;
    }


});
