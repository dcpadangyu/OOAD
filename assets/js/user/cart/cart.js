document.addEventListener("DOMContentLoaded", function () {
    window.removecart = removecart;
    window.addItemQuantity = addItemQuantity;
    window.removeItemQuantity = removeItemQuantity;
    window.getCheckoutCart = getCheckoutCart;
    window.removeCheckoutCart = removeCheckoutCart;
    const SumCart = document.querySelectorAll('.SumCart');

    function getDanhSachDatHang(){
        return JSON.parse(localStorage.getItem("DanhSachDatHang"))||[];

    } 
    window.getcart=function() {
        let cart = [];
        try {
            cart = JSON.parse(localStorage.getItem("cart") || "[]");
        } catch (error) {
            cart = [];
        }
        const validCart = cart.filter(item => item && item.id && item.name && item.image && item.image.includes("assets/images/products/") && Number(item.priceValue) > 0);
        if (validCart.length !== cart.length) {
            localStorage.setItem("cart", JSON.stringify(validCart));
        }
        return validCart;
    }
    function saveCart(cart) {
        localStorage.setItem("cart", JSON.stringify(cart));
        renderallcart();
    }
    function cartKey(item) {
        return `${item.id}::${item.selectedSize || item.size || ""}`;
    }
    function getSelectedCartKeys() {
        try {
            const keys = JSON.parse(localStorage.getItem("selectedCartItems") || "[]");
            return Array.isArray(keys) ? keys : [];
        } catch (_) {
            return [];
        }
    }
    function getCheckoutCart() {
        const cart = getcart();
        const selected = getSelectedCartKeys();
        return selected.length ? cart.filter((item) => selected.includes(cartKey(item))) : [];
    }
    function removeCheckoutCart() {
        const selected = new Set(getSelectedCartKeys());
        const remaining = getcart().filter((item) => !selected.has(cartKey(item)));
        localStorage.setItem("cart", JSON.stringify(remaining));
        localStorage.removeItem("selectedCartItems");
    }
    function updateSelection(item, checked) {
        const keys = getSelectedCartKeys().filter((key) => key !== cartKey(item));
        if (checked) keys.push(cartKey(item));
        localStorage.setItem("selectedCartItems", JSON.stringify(keys));
        renderallcart();
    }
    function addItemQuantity(productid) {
        const cart = getcart();
        const item = cart.find(p => p.id === productid);
        if (item) {
            item.quantity++;
            saveCart(cart);
        }
    }
    function removecart(productId) {
        const cart = getcart();
        const item = cart.filter(p => p.id !== productId);
        saveCart(item);
        const selected = getSelectedCartKeys().filter((key) => !key.startsWith(`${productId}::`));
        localStorage.setItem("selectedCartItems", JSON.stringify(selected));
    }
    function removeItemQuantity(productid) {
        const cart = getcart();
        const item = cart.find(p => p.id === productid);
        if (item) {
            if (item.quantity > 1) {
                item.quantity--;
                saveCart(cart);
            }
            else {
                removecart(productid);
            }
        }
    }
    window.renderallcart=function(displayCart) {
        const danhsach = document.querySelectorAll('.danhsach');
        const cart = Array.isArray(displayCart) ? displayCart : getcart();
        let modalCart = '';
        let sum = 0;

        if (cart.length === 0) {
            modalCart = "<p style='text-align: center; padding: 20px;'>Giỏ hàng của bạn đang trống.</p>";
            danhsach.forEach(list => {
                list.innerHTML = modalCart;
            });
        } else {
            const selectedKeys = getSelectedCartKeys();
            modalCart = `<div class="modal_cart">
                <div class="item-info">
                        <div> Chọn</div>
                        <div> Sản phẩm</div>
                        <div> Giá</div>
                        <div> Số lượng</div>
                </div>
                  `;
            cart.forEach(item => {
                const isSelected = selectedKeys.includes(cartKey(item));
                const priceitem = item.priceValue * item.quantity;
                if (isSelected && !isNaN(priceitem)) sum += priceitem;
                modalCart += `<div class="all-cart">
                <input type="checkbox" class="cart-select" data-cart-key="${cartKey(item)}" ${isSelected ? "checked" : ""} aria-label="Chọn ${item.name}">
                <button class="remove_item" onclick="removecart('${item.id}')">x</button>
                <div class="cart-product">
                    <img src="${item.image}" alt="${item.name}" class="item-img">
                    <div class="item-name">${item.name} - Size ${item.selectedSize || item.size || "Chưa chọn"}</div>
                </div>
                <div class="item-price">${item.price}</div>
                <div class="item-quantity-all">
                    <div class="remove-quantity" onclick="removeItemQuantity('${item.id}')">-</div>
                    <div class="quantity">${item.quantity}</div>
                    <div class="add-quantity" onclick="addItemQuantity('${item.id}')">+</div>
                </div>
            </div>
                     `;
            });
            modalCart += `</div>`;
            danhsach.forEach(list => {
                list.innerHTML = modalCart;
                list.querySelectorAll(".cart-select").forEach((checkbox) => {
                    const item = cart.find((cartItem) => cartKey(cartItem) === checkbox.dataset.cartKey);
                    checkbox.addEventListener("change", () => updateSelection(item, checkbox.checked));
                });
            });
        }
        const TongTienString = sum.toLocaleString('vi-Vn') + 'đ';
        SumCart.forEach(element => {
            element.textContent = TongTienString;
        });
        
    }
    const GioHang = document.getElementById("open-cart-btn");
    if (GioHang) {
        GioHang.addEventListener('click', function () {
            renderallcart();
        });
    }

    window.renderInvoiceOrder = function (order) {
        const lists = document.querySelectorAll("#ThanhToan_ThanhCong .danhsach");
        if (!lists.length) return;
        const products = Array.isArray(order?.product) ? order.product : [];
        if (!products.length) {
            lists.forEach((list) => {
                list.innerHTML = "<p class='invoice-empty'>Không tìm thấy sản phẩm trong đơn hàng.</p>";
            });
            return;
        }

        const html = `<div class="modal_cart invoice_cart">
            ${products.map((item) => `<div class="all-cart">
                <div class="cart-product">
                    <img src="${item.image}" alt="${item.name}" class="item-img">
                    <div class="item-name">${item.name} - Size ${item.selectedSize || item.size || "Chưa chọn"}</div>
                </div>
                <div class="invoice-price-quantity">
                    <div class="item-price">${item.price}</div>
                    <div class="item-quantity-all">
                        <div class="quantity">Số lượng: ${item.quantity}</div>
                    </div>
                </div>
            </div>`).join("")}
        </div>`;
        lists.forEach((list) => { list.innerHTML = html; });
    };


});
