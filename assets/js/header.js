// Hàm cập nhật header dựa trên trạng thái đăng nhập 
function updateHeaderUI() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const DEFAULT_AVATAR = "./assets/img/Avatar/avtuser.jpg";

    const navLogin = document.querySelector(".nav-login");
    const navCart = document.getElementById("open-cart-btn");
    const navHistory = document.getElementById("LichSuMuaHangBTN");
    const userAvatar = document.getElementById("userAvatar");
    const usernameDisplay = document.getElementById("usernameDisplay");
    const avatarDropdown = document.getElementById("avatarDropdown");

    if (!userAvatar || !navLogin) return;

    if (currentUser) {
        // Người dùng đã đăng nhập 
        navLogin.style.display = "none";
        if (navCart) navCart.style.display = "inline-block";
        if (navHistory) navHistory.style.display = "inline-block";

        userAvatar.style.display = "inline-flex";
        usernameDisplay.textContent = currentUser.userName || currentUser.username || currentUser.name || currentUser.email || "Người dùng";

        const avatarImg = userAvatar.querySelector("img");
        if (avatarImg) {
            avatarImg.src = currentUser.avatar || DEFAULT_AVATAR;
            avatarImg.style.display = "block";
            avatarImg.alt = currentUser.userName || "Avatar";
        }

        if (avatarDropdown) avatarDropdown.classList.remove("show");

    } else {
        // Chưa đăng nhập
        navLogin.style.display = "inline-block";
        if (navCart) navCart.style.display = "inline-block";
        if (navHistory) navHistory.style.display = "inline-block";

        userAvatar.style.display = "none";
        if (avatarDropdown) avatarDropdown.classList.remove("show");
        if (usernameDisplay) usernameDisplay.textContent = "";
    }
}

//Hàm xử lý logout 
function handleLogout() {
    if (typeof Swal !== "undefined") {
        Swal.fire({
            title: "Đăng xuất",
            text: "Bạn có chắc chắn muốn đăng xuất?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#4f46e5",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Đăng xuất",
            cancelButtonText: "Hủy",
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem("currentUser");
                localStorage.removeItem("selectedAddress");
                updateHeaderUI();
                if (typeof window.navigateTo === "function") {
                    window.navigateTo("home");
                } else {
                    window.location.href = "./index.html";
                }
                Swal.fire({
                    icon: "success",
                    title: "Đã đăng xuất",
                    text: "Bạn đã đăng xuất thành công!",
                    timer: 1200,
                    showConfirmButton: false
                });
            }
        });
    } else {
        if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
            localStorage.removeItem("currentUser");
            localStorage.removeItem("selectedAddress");
            updateHeaderUI();
            if (typeof window.navigateTo === "function") {
                window.navigateTo("home");
            } else {
                window.location.href = "./index.html";
            }
        }
    }
}

// Event listener DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    updateHeaderUI();

    const userAvatar = document.getElementById("userAvatar");
    const avatarDropdown = document.getElementById("avatarDropdown");
    const logoutBtn = document.getElementById("logoutBtn");

    // Hiển thị/ẩn dropdown
    if (userAvatar && avatarDropdown) {
        userAvatar.addEventListener("click", (e) => {
            avatarDropdown.classList.toggle("show");
        });

        // Ẩn dropdown khi click ngoài
        document.addEventListener("click", (e) => {
            if (!userAvatar.contains(e.target) && avatarDropdown.classList.contains("show")) {
                avatarDropdown.classList.remove("show");
            }
        });
    }

    // Gán sự kiện logout
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
});

window.updateHeaderUI = updateHeaderUI;
window.handleLogout = handleLogout;
