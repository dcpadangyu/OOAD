document.addEventListener("DOMContentLoaded", () => {
    const formDangNhap = document.getElementById("login-form");
    if (!formDangNhap) return;

    const inputTaiKhoan = document.getElementById("input-login");
    const inputMatKhau = document.getElementById("password-login");


    /** Hiển thị popup thông báo */
    function hienThiPopup(icon, tieuDe, noiDung, callback = null) {
        Swal.fire({
            icon,
            title: tieuDe,
            text: noiDung,
            showConfirmButton: false,
            timer: 900,
            timerProgressBar: true,
            didClose: () => { if (callback) callback(); },
        });
    }

    /** Hiển thị hoặc xóa thông báo lỗi dưới input */
    function hienThiLoi(input, thongBao) {
        const errEl = input.parentElement.querySelector(".error-message");
        if (errEl) {
            errEl.textContent = thongBao;
            errEl.style.display = thongBao ? "block" : "none";
        }
        input.classList.toggle("input-error", !!thongBao);
        input.classList.toggle("input-success", !thongBao);
    }

    /** Xác thực người dùng dựa trên username/email và password */
    function xacThucUser(taiKhoan, matKhau) {
        const danhSach = [
            ...(JSON.parse(localStorage.getItem("userList")) || []),
            ...(JSON.parse(localStorage.getItem("customers")) || [])
        ];
        return danhSach.find(u => 
            (u.email === taiKhoan || u.userName === taiKhoan) && u.password === matKhau
        ) || null;
    }

    /** Kiểm tra tài khoản có bị khóa hay không */
    function taiKhoanBiKhoa(user) {
        return user.locked === true || user.status === 'blocked';
    }

    /** Lưu thông tin user hiện tại vào localStorage */
    function luuCurrentUser(user) {
        const currentUser = {
            ...user,
            avatar: user.avatar || "./assets/img/Avatar/avtuser.jpg",
            addresses: user.addresses || [],
            address: user.address || "",
            phone: user.phone || ""
        };
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        return currentUser;
    }

    /** Xử lý đăng nhập thành công */
    function xuLyDangNhapThanhCong(user) {
        const currentUser = luuCurrentUser(user);

        hienThiPopup("success", "Đăng nhập thành công!", `Chào mừng ${user.userName}`, () => {
            if (typeof window.updateHeaderUI === "function") window.updateHeaderUI();
            if (typeof window.navigateTo === "function") window.navigateTo("home");
        });

        formDangNhap.reset();
    }

    /** Xử lý đăng nhập thất bại */
    function xuLyDangNhapThatBai(msg = "Tên đăng nhập/Email hoặc mật khẩu không đúng.") {
        hienThiLoi(inputTaiKhoan, msg);
        hienThiLoi(inputMatKhau, msg);
        hienThiPopup("error", "Đăng nhập thất bại!", "Vui lòng kiểm tra lại thông tin.");
    }

    //  XỬ LÝ FORM
    formDangNhap.addEventListener("submit", e => {
        e.preventDefault();

        // Xóa lỗi cũ
        hienThiLoi(inputTaiKhoan, "");
        hienThiLoi(inputMatKhau, "");

        const taiKhoan = inputTaiKhoan.value.trim();
        const matKhau = inputMatKhau.value;

        if (!taiKhoan) { hienThiLoi(inputTaiKhoan, "Vui lòng nhập tên đăng nhập hoặc email."); return; }
        if (!matKhau) { hienThiLoi(inputMatKhau, "Vui lòng nhập mật khẩu."); return; }

        const user = xacThucUser(taiKhoan, matKhau);

        if (user) {
            if (taiKhoanBiKhoa(user)) {
                hienThiPopup('warning', 'Tài khoản bị khóa', 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị.');
                return;
            }
            xuLyDangNhapThanhCong(user);
        } else {
            xuLyDangNhapThatBai();
        }
    });

    // Xóa lỗi khi nhập lại
    inputTaiKhoan.addEventListener("input", () => hienThiLoi(inputTaiKhoan, ""));
    inputMatKhau.addEventListener("input", () => hienThiLoi(inputMatKhau, ""));
});
