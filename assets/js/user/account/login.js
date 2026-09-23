document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  if (!form) return;

  const accountInput = document.getElementById("input-login");
  const passwordInput = document.getElementById("password-login");

  function getUsers() {
    const list = window.UserSession?.getUserList?.() || [];
    return list;
  }

  function popup(icon, title, text, callback) {
    if (typeof Swal === "undefined") {
      alert(`${title}\n${text}`);
      callback?.();
      return;
    }
    Swal.fire({ icon, title, text, showConfirmButton: false, timer: 900, timerProgressBar: true, didClose: callback });
  }

  function setError(input, message) {
    if (!input) return;
    const error = input.parentElement?.querySelector(".error-message");
    if (error) {
      error.textContent = message;
      error.style.display = message ? "block" : "none";
    }
    input.classList.toggle("input-error", !!message);
    input.classList.toggle("input-success", !message);
  }

  function authenticate(account, password) {
    const normalized = String(account || "").trim().toLowerCase();
    const users = getUsers();
    let user = users.find((item) => {
      const email = String(item.email || "").trim().toLowerCase();
      const name = String(item.userName || "").trim().toLowerCase();
      return (email === normalized || name === normalized) && String(item.password ?? "") === password;
    });

    // Legacy data source compatibility: only consult customers when there is no matching userList identity.
    if (!user) {
      try {
        const customers = JSON.parse(localStorage.getItem("customers") || "[]");
        if (Array.isArray(customers)) {
          user = customers.find((item) => {
            const email = String(item.email || "").trim().toLowerCase();
            const name = String(item.userName || item.username || item.name || "").trim().toLowerCase();
            return (email === normalized || name === normalized) && String(item.password ?? "") === password;
          }) || null;
        }
      } catch (_) {}
    }
    return user || null;
  }

  function isLocked(user) { return user?.locked === true || user?.status === "blocked"; }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    setError(accountInput, "");
    setError(passwordInput, "");

    const account = accountInput.value.trim();
    const password = passwordInput.value;
    if (!account) return setError(accountInput, "Vui lòng nhập tên đăng nhập hoặc email.");
    if (!password) return setError(passwordInput, "Vui lòng nhập mật khẩu.");

    const user = authenticate(account, password);
    if (!user) {
      setError(accountInput, "Tên đăng nhập/Email hoặc mật khẩu không đúng.");
      setError(passwordInput, "Thông tin đăng nhập không đúng.");
      popup("error", "Đăng nhập thất bại!", "Vui lòng kiểm tra lại thông tin.");
      return;
    }
    if (isLocked(user)) {
      popup("warning", "Tài khoản bị khóa", "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị.");
      return;
    }

    const currentUser = window.UserSession?.setCurrentUser?.(user);
    if (!currentUser) return;
    popup("success", "Đăng nhập thành công!", `Chào mừng ${currentUser.userName || currentUser.email}`, () => {
      window.updateHeaderUI?.();
      window.location.href = "index.html";
    });
    form.reset();
  });

  accountInput?.addEventListener("input", () => setError(accountInput, ""));
  passwordInput?.addEventListener("input", () => setError(passwordInput, ""));
});
