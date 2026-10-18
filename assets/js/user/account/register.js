document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");
  if (!form) return;

  const input = {
    username: document.getElementById("username-register"),
    email: document.getElementById("email-register"),
    phone: document.getElementById("phone-register"),
    password: document.getElementById("password-register"),
    confirmPassword: document.getElementById("confirmPassword-register"),
    address: document.getElementById("address-register")
    ,otp: document.getElementById("otp-register")
  };
  const errors = {
    username: document.getElementById("username-error"),
    email: document.getElementById("email-error"),
    phone: document.getElementById("phone-error"),
    password: document.getElementById("password-error"),
    confirmPassword: document.getElementById("confirmPassword-error"),
    address: document.getElementById("address-error")
    ,otp: document.getElementById("otp-register-error")
  };
  const passwordRules = document.getElementById("password-rules");
  const ruleLength = document.getElementById("rule-length");

  // SweetAlert2 có thể bị chặn (CDN): dự phòng bằng alert, luôn trả về Promise.
  function popup(options) {
    if (window.Swal?.fire) return Promise.resolve(window.Swal.fire(options));
    if (!options.timer) alert(`${options.title || ""}\n${options.text || ""}`);
    return Promise.resolve();
  }
  function getUsers() { return window.UserSession?.getUserList?.() || []; }
  function setError(key, message) {
    const field = input[key]; const error = errors[key];
    if (!field || !error) return;
    field.classList.toggle("input-error", !!message);
    field.classList.toggle("input-success", !message);
    error.textContent = message;
    error.style.display = message ? "block" : "none";
  }
  function validate(key) {
    const value = input[key]?.value.trim() || "";
    const users = getUsers();
    if (!value && key === "otp") return "Vui lòng nhập mã OTP";
    if (!value) return `${key === "username" ? "Tên đăng nhập" : key === "email" ? "Email" : key === "phone" ? "Số điện thoại" : key === "address" ? "Địa chỉ" : "Mật khẩu"} không được để trống.`;
    if (key === "username") {
      if (!/^[A-Za-zÀ-ỹ\s]+$/.test(value)) return "Tên đăng nhập chỉ được chứa chữ cái và khoảng trắng.";
      if (value.length < 3) return "Tên đăng nhập phải có ít nhất 3 ký tự.";
      if (users.some((u) => String(u.tenDangNhap || "").toLowerCase() === value.toLowerCase())) return "Tên đăng ký đã tồn tại!";
    }
    if (key === "email") {
      if (!/^\S+@\S+\.\S+$/.test(value)) return "Email không hợp lệ.";
      if (users.some((u) => String(u.thuDienTu || "").toLowerCase() === value.toLowerCase())) return "Email đã tồn tại!";
    }
    if (key === "phone") {
      if (!/^0\d{9}$/.test(value)) return "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.";
      if (users.some((u) => String(u.soDienThoai || "") === value)) return "Số điện thoại đã được đăng ký!";
    }
    if (key === "password" && value.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
    if (key === "confirmPassword" && value !== input.password.value.trim()) return "Mật khẩu nhập lại không khớp.";
    if (key === "address" && value.length < 10) return "Vui lòng nhập địa chỉ chi tiết hơn (ít nhất 10 ký tự).";
    if (key === "otp" && !/^\d{6}$/.test(value)) return "Vui lòng nhập mã OTP gồm 6 chữ số.";
    return null;
  }
  function validateAll() {
    let valid = true;
    Object.keys(input).forEach((key) => {
      const error = validate(key);
      setError(key, error);
      if (error) valid = false;
    });
    return valid;
  }
  function livePassword() {
    const value = input.password.value;
    if (!passwordRules) return;
    passwordRules.style.display = value ? "block" : "none";
    if (ruleLength) {
      ruleLength.textContent = `${value.length >= 8 ? "✅" : "❌"} Đủ 8 ký tự`;
      ruleLength.classList.toggle("valid", value.length >= 8);
    }
  }

  Object.keys(input).forEach((key) => {
    input[key]?.addEventListener("blur", () => setError(key, validate(key)));
    input[key]?.addEventListener("focus", () => setError(key, ""));
  });
  input.password?.addEventListener("input", livePassword);
  input.confirmPassword?.addEventListener("input", () => {
    if (input.confirmPassword.value) setError("confirmPassword", validate("confirmPassword"));
  });

  document.getElementById("send-register-otp")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const emailError = validate("email");
    setError("email", emailError);
    if (emailError) return;
    button.disabled = true;
    button.textContent = "ĐANG GỬI...";
    try {
      await window.UserOtp.request(input.email.value.trim(), "register");
      popup({ icon: "success", title: "Đã gửi OTP", text: "Kiểm tra Gmail để lấy mã xác thực." });
    } catch (error) {
      popup({ icon: "error", title: "Không gửi được OTP", text: error.message });
    } finally {
      button.disabled = false;
      button.textContent = "GỬI MÃ OTP";
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateAll()) {
      popup({ icon: "error", title: "Lỗi dữ liệu!", text: "Vui lòng kiểm tra lại các trường bị lỗi." });
      return;
    }
    try {
      await window.UserOtp.verify(input.email.value.trim(), "register", input.otp.value.trim());
    } catch (error) {
      setError("otp", error.message);
      popup({ icon: "error", title: "OTP không hợp lệ", text: error.message });
      return;
    }

    const user = {
      maKhachHang: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ngayTao: new Date().toISOString(),
      tenDangNhap: input.username.value.trim(),
      hoTen: input.username.value.trim(),
      thuDienTu: input.email.value.trim(),
      soDienThoai: input.phone.value.trim(),
      matKhau: input.password.value,
      diaChi: input.address.value.trim(),
      diaChiPhu: [],
      anhDaiDien: "assets/img/Avatar/avtuser.jpg",
      isLoggedIn: false
    };
    const users = getUsers();
    users.push(user);
    localStorage.setItem("userList", JSON.stringify(users));
    form.reset();
    if (passwordRules) passwordRules.style.display = "none";
    Object.keys(input).forEach((key) => setError(key, ""));

    popup({ icon: "success", title: "Đăng ký thành công!", text: "Chuyển đến đăng nhập...", showConfirmButton: false, timer: 900 })
      .then(() => { window.location.href = "pages/login.html"; });
  });
});
