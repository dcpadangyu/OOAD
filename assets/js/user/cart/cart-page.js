document.addEventListener("DOMContentLoaded", () => {
    if (typeof window.renderallcart === "function") {
        window.renderallcart();
    }

    document.querySelectorAll(".tienhanhthanhtoanBtn").forEach((btn) => {
        btn.addEventListener("click", (event) => {
            event.preventDefault();

            const cart = window.getcart
                ? window.getcart()
                : JSON.parse(localStorage.getItem("cart") || "[]");

            if (!cart.length) {
                alert("Bạn cần có sản phẩm trong giỏ hàng mới được đặt hàng.");
                return;
            }

            const currentUser =
                window.UserSession?.getCurrentUser?.() || null;

            if (!currentUser) {
                alert("Vui lòng đăng nhập trước khi thanh toán");

                window.location.assign(
                    new URL("login.html", window.location.href).href
                );

                return;
            }

            window.location.assign(
                new URL("checkout.html", window.location.href).href
            );
        });
    });
});