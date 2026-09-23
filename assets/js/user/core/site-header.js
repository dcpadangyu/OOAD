// Header behavior for the shared User component.
(function () {
  "use strict";

  const DEFAULT_AVATAR = "assets/img/Avatar/avtuser.jpg";

  function safeUser() {
    return typeof window.getCurrentUser === "function"
      ? window.getCurrentUser()
      : (() => {
          try { return JSON.parse(localStorage.getItem("currentUser") || "null"); }
          catch (_) { return null; }
        })();
  }

  function updateHeaderUI() {
    const currentUser = safeUser();
    const navLogin = document.querySelector(".nav-login");
    const userAvatar = document.getElementById("userAvatar");
    const usernameDisplay = document.getElementById("usernameDisplay");
    if (!navLogin || !userAvatar) return;

    if (currentUser) {
      navLogin.hidden = true;
      userAvatar.hidden = false;
      userAvatar.style.display = "inline-flex";
      if (usernameDisplay) usernameDisplay.textContent = currentUser.userName || currentUser.email || "Người dùng";
      const img = userAvatar.querySelector("img");
      if (img) {
        img.src = currentUser.avatar || DEFAULT_AVATAR;
        img.alt = currentUser.userName || "Avatar";
      }
    } else {
      navLogin.hidden = false;
      navLogin.style.removeProperty("display");
      userAvatar.hidden = true;
      userAvatar.style.display = "none";
      if (usernameDisplay) usernameDisplay.textContent = "";
    }
  }

  function doLogout() {
    if (window.UserSession?.clearSession) window.UserSession.clearSession();
    else {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("selectedAddress");
    }
    window.location.href = "index.html";
  }

  function handleLogout() {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        title: "Đăng xuất",
        text: "Bạn có chắc chắn muốn đăng xuất?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Đăng xuất",
        cancelButtonText: "Hủy"
      }).then((result) => { if (result.isConfirmed) doLogout(); });
    } else if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      doLogout();
    }
  }

  function bindHeaderEvents() {
    const avatar = document.getElementById("userAvatar");
    const dropdown = document.getElementById("avatarDropdown");
    const logout = document.getElementById("logoutBtn");

    if (avatar && dropdown && !avatar.dataset.bound) {
      avatar.dataset.bound = "true";
      avatar.addEventListener("click", (event) => {
        event.stopPropagation();
        dropdown.classList.toggle("show");
      });
      document.addEventListener("click", (event) => {
        if (!avatar.contains(event.target)) dropdown.classList.remove("show");
      });
    }

    if (logout && !logout.dataset.bound) {
      logout.dataset.bound = "true";
      logout.addEventListener("click", (event) => {
        event.preventDefault();
        handleLogout();
      });
    }

    const searchInput = document.getElementById("searchInput");
    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = "true";
      searchInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        const value = searchInput.value.trim();
        const path = window.location.pathname.replace(/\\/g, "/");
        const isHome = /(^|\/)pages\/home\.html$/.test(path) || /(^|\/)index\.html$/.test(path);
        if (!isHome && value) window.location.href = `pages/home.html?search=${encodeURIComponent(value)}#sanpham`;
      });
    }
  }

  function init() {
    updateHeaderUI();
    bindHeaderEvents();
  }

  document.addEventListener("user-shell-ready", init, { once: true });
  document.addEventListener("DOMContentLoaded", init, { once: true });

  window.addEventListener("pageshow", updateHeaderUI);
  window.addEventListener("storage", (event) => {
    if (event.key === "currentUser") updateHeaderUI();
  });

  window.updateHeaderUI = updateHeaderUI;
  window.handleLogout = handleLogout;
})();
