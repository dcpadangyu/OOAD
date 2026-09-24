document.addEventListener("DOMContentLoaded", () => {
    if (typeof window.renderallcart === "function") {
        window.renderallcart();
    }

    document.querySelectorAll(".tienhanhthanhtoanBtn").forEach((btn) => {
        btn.addEventListener("click", (event) => {
            event.preventDefault();

            const cart = window.getCheckoutCart
                ? window.getCheckoutCart()
                : [];

            if (!cart.length) {
                alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
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