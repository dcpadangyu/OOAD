document.addEventListener("DOMContentLoaded", () => {
   
    //  ELEMENTS 
    const form = document.getElementById("register-form");
    if (!form) return;

    const input = {
        username: document.getElementById("username-register"),
        email: document.getElementById("email-register"),
        phone: document.getElementById("phone-register"),
        password: document.getElementById("password-register"),
        confirmPassword: document.getElementById("confirmPassword-register"),
        address: document.getElementById("address-register")
    };

    const errorSpan = {
        username: document.getElementById("username-error"),
        email: document.getElementById("email-error"),
        phone: document.getElementById("phone-error"),
        password: document.getElementById("password-error"),
        confirmPassword: document.getElementById("confirmPassword-error"),
        address: document.getElementById("address-error")
    };

    const passwordRules = document.getElementById("password-rules");
    const ruleLength = document.getElementById("rule-length");

    // DATA 
    let dsUser = JSON.parse(localStorage.getItem("userList")) || [];

    // HÀM HỖ TRỢ 
    function hienThiThongBao(icon, tieuDe, noiDung, callback = null) {
        Swal.fire({
            icon,
            title: tieuDe,
            text: noiDung,
            showConfirmButton: false,
            timer: 900,
            timerProgressBar: true,
            didClose: () => { if (callback) callback(); }
        });
    }

    function hienThiLoi(inputEl, spanEl, thongBao) {
        if (!inputEl || !spanEl) return;
        inputEl.classList.add("input-error");
        inputEl.classList.remove("input-success");
        spanEl.textContent = thongBao;
        spanEl.style.display = "block";
    }

    function xoaLoi(inputEl, spanEl) {
        if (!inputEl || !spanEl) return;
        inputEl.classList.remove("input-error");
        inputEl.classList.add("input-success");
        spanEl.textContent = "";
        spanEl.style.display = "none";
    }

 
    // VALIDATORS
    const validators = {
        username: (value) => {
            if (!value) return "Tên đăng nhập không được để trống.";
            if (!/^[A-Za-zÀ-ỹ\s]+$/.test(value)) return "Tên đăng nhập chỉ được chứa chữ cái, không được chứa số hoặc ký tự đặc biệt.";
            if (value.length < 3) return "Tên đăng nhập phải có ít nhất 3 ký tự.";
            if (dsUser.some(u => u.userName.toLowerCase() === value.toLowerCase())) 
                return "Tên đăng ký đã tồn tại!";
            return null;
        },
        email: (value) => {
            if (!value) return "Email không được để trống.";
            if (dsUser.some(u => u.email === value)) return "Email đã tồn tại!";
            return null;
        },
        phone: (value) => {
            if (!value) return "Số điện thoại không được để trống.";
            if (isNaN(value)) return "Số điện thoại chỉ được chứa các chữ số.";
            if (!value.startsWith("0") || value.length !== 10) return "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.";
            if (dsUser.some(u => u.phone.toLowerCase() === value.toLowerCase())) return "Số điện thoại đã được đăng ký!";
            return null;
        },
        password: (value) => {
            if (!value) return "Mật khẩu không được để trống.";
            if (value.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
            return null;
        },
        confirmPassword: (value, passwordValue) => {
            if (!value) return "Vui lòng nhập lại mật khẩu.";
            if (value !== passwordValue) return "Mật khẩu nhập lại không khớp.";
            return null;
        },
        address: (value) => {
            if (!value) return "Địa chỉ không được để trống.";
            if (value.length < 10) return "Vui lòng nhập địa chỉ chi tiết hơn (ít nhất 10 ký tự).";
            return null;
        }
    };


    // HÀM XỬ LÝ SỰ KIỆN 
    function handleBlur(key) {
        const inputEl = input[key];
        if (!inputEl) return;

        let thongBao;
        if (key === "confirmPassword") {
            thongBao = validators[key](inputEl.value.trim(), input.password.value.trim());
        } else {
            thongBao = validators[key](inputEl.value.trim());
        }

        if (thongBao) hienThiLoi(inputEl, errorSpan[key], thongBao);
        else xoaLoi(inputEl, errorSpan[key]);
    }

    function handleFocus(key) {
        const inputEl = input[key];
        if (!inputEl) return;
        xoaLoi(inputEl, errorSpan[key]);
    }

    function ganSuKienInput() {
        Object.keys(input).forEach(key => {
            const inputEl = input[key];
            if (!inputEl) return;
            inputEl.addEventListener("blur", () => handleBlur(key));
            inputEl.addEventListener("focus", () => handleFocus(key));
        });
    }

    function kiemTraToanBo() {
        let hopLe = true;
        Object.keys(input).forEach(key => {
            const inputEl = input[key];
            if (!inputEl) return;

            let thongBao;
            if (key === "confirmPassword") {
                thongBao = validators[key](inputEl.value.trim(), input.password.value.trim());
            } else {
                thongBao = validators[key](inputEl.value.trim());
            }

            if (thongBao) {
                hienThiLoi(inputEl, errorSpan[key], thongBao);
                hopLe = false;
            } else {
                xoaLoi(inputEl, errorSpan[key]);
            }
        });
        return hopLe;
    }

    function resetForm() {
        form.reset();
        if (passwordRules) passwordRules.style.display = "none";
        if (errorSpan.confirmPassword) {
            errorSpan.confirmPassword.style.color = "";
            errorSpan.confirmPassword.style.display = "none";
        }
        Object.values(input).forEach(i => {
            if (i) i.classList.remove("input-error", "input-success");
        });
    }

    // Password rules live 
    function handlePasswordInput() {
        const value = input.password.value;
        if (!value) {
            if (passwordRules) passwordRules.style.display = "none";
            return;
        }
        if (passwordRules) passwordRules.style.display = "block";

        const hopLeDoDai = value.length >= 8;
        if (ruleLength) {
            const text = ruleLength.textContent.replace("✅ ", "").replace("❌ ", "");
            ruleLength.textContent = (hopLeDoDai ? "✅ " : "❌ ") + text;
            ruleLength.classList.toggle("valid", hopLeDoDai);
        }
    }

    function ganSuKienPassword() {
        if (!input.password) return;
        input.password.addEventListener("input", handlePasswordInput);
        input.password.addEventListener("blur", () => {
            if (input.password.value.trim() === "" && passwordRules)
                passwordRules.style.display = "none";
        });
    }

    // Confirm password live 
    function ganSuKienConfirm() {
        if (!input.confirmPassword || !input.password) return;
        const confirmEl = input.confirmPassword;
        const passEl = input.password;

        confirmEl.addEventListener("focus", () => {
            if (passEl.value.trim() === "") {
                hienThiLoi(confirmEl, errorSpan.confirmPassword, "Vui lòng nhập mật khẩu trước.");
                confirmEl.blur();
            }
        });

        confirmEl.addEventListener("input", () => {
            const passVal = passEl.value.trim();
            const confirmVal = confirmEl.value.trim();

            if (!passVal) return;
            if (!confirmVal) {
                errorSpan.confirmPassword.style.display = "none";
                confirmEl.classList.remove("input-error", "input-success");
                return;
            }

            if (passVal === confirmVal) {
                hienThiLoi(confirmEl, errorSpan.confirmPassword, "✅ Mật khẩu khớp!");
                errorSpan.confirmPassword.style.color = "green";
                confirmEl.classList.add("input-success");
                confirmEl.classList.remove("input-error");
            } else {
                hienThiLoi(confirmEl, errorSpan.confirmPassword, "Mật khẩu nhập lại không khớp.");
                errorSpan.confirmPassword.style.color = "red";
                confirmEl.classList.add("input-error");
                confirmEl.classList.remove("input-success");
            }
        });
    }

    //  SUBMIT FORM 
    function handleSubmit(e) {
        e.preventDefault();
        danhSachNguoiDung = JSON.parse(localStorage.getItem("userList")) || [];

        if (!kiemTraToanBo()) {
            hienThiThongBao("error", "Lỗi dữ liệu!", "Vui lòng kiểm tra lại các trường bị lỗi.");
            return;
        }

        const userNew = {
            userName: input.username.value.trim(),
            email: input.email.value.trim(),
            phone: input.phone.value.trim(),
            password: input.password.value.trim(),
            address: input.address.value.trim(),
            isLoggedIn: false
        };

        dsUser.push(userNew);
        localStorage.setItem("userList", JSON.stringify(dsUser));

        hienThiThongBao("success", "Đăng ký thành công!", "Chuyển đến đăng nhập...", () => {
            if (typeof window.navigateTo === 'function') window.navigateTo('login');
            else window.location.href = "#login";
        });

        resetForm();
    }
    // INIT 

    ganSuKienInput();
    ganSuKienPassword();
    ganSuKienConfirm();
    form.addEventListener("submit", handleSubmit);
});
