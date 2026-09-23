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
  };
  const errors = {
    username: document.getElementById("username-error"),
    email: document.getElementById("email-error"),
    phone: document.getElementById("phone-error"),
    password: document.getElementById("password-error"),
    confirmPassword: document.getElementById("confirmPassword-error"),
    address: document.getElementById("address-error")
  };
  const passwordRules = document.getElementById("password-rules");
  const ruleLength = document.getElementById("rule-length");

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
    if (!value) return `${key === "username" ? "Tên đăng nhập" : key === "email" ? "Email" : key === "phone" ? "Số điện thoại" : key === "address" ? "Địa chỉ" : "Mật khẩu"} không được để trống.`;
    if (key === "username") {
      if (!/^[A-Za-zÀ-ỹ\s]+$/.test(value)) return "Tên đăng nhập chỉ được chứa chữ cái và khoảng trắng.";
      if (value.length < 3) return "Tên đăng nhập phải có ít nhất 3 ký tự.";
      if (users.some((u) => String(u.userName || "").toLowerCase() === value.toLowerCase())) return "Tên đăng ký đã tồn tại!";
    }
    if (key === "email") {
      if (!/^\S+@\S+\.\S+$/.test(value)) return "Email không hợp lệ.";
      if (users.some((u) => String(u.email || "").toLowerCase() === value.toLowerCase())) return "Email đã tồn tại!";
    }
    if (key === "phone") {
      if (!/^0\d{9}$/.test(value)) return "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.";
      if (users.some((u) => String(u.phone || "") === value)) return "Số điện thoại đã được đăng ký!";
    }
    if (key === "password" && value.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
    if (key === "confirmPassword" && value !== input.password.value.trim()) return "Mật khẩu nhập lại không khớp.";
    if (key === "address" && value.length < 10) return "Vui lòng nhập địa chỉ chi tiết hơn (ít nhất 10 ký tự).";
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

  function nextCustomerCode(users) {
    let maxNum = 0;
    (users || []).forEach((u) => {
      const m = /KH(\d+)/i.exec(String(u.customerCode || ""));
      if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
    });
    return "KH" + String(maxNum + 1).padStart(3, "0");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateAll()) {
      Swal?.fire?.({ icon: "error", title: "Lỗi dữ liệu!", text: "Vui lòng kiểm tra lại các trường bị lỗi." });
      return;
    }

    const users = getUsers();
    const user = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      customerCode: nextCustomerCode(users),
      userName: input.username.value.trim(),
      email: input.email.value.trim(),
      phone: input.phone.value.trim(),
      password: input.password.value,
      address: input.address.value.trim(),
      addresses: [],
      avatar: "assets/img/Avatar/avtuser.jpg",
      isLoggedIn: false
    };
    users.push(user);
    localStorage.setItem("userList", JSON.stringify(users));
    form.reset();
    if (passwordRules) passwordRules.style.display = "none";
    Object.keys(input).forEach((key) => setError(key, ""));

    Swal?.fire?.({ icon: "success", title: "Đăng ký thành công!", text: "Chuyển đến đăng nhập...", showConfirmButton: false, timer: 900 })
      .then(() => { window.location.href = "pages/login.html"; });
  });
});
