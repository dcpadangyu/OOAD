document.addEventListener("DOMContentLoaded", function () {
    window.removecart = removecart;
    window.addItemQuantity = addItemQuantity;
    window.removeItemQuantity = removeItemQuantity;

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
        // *** FIX: Bỏ check image.includes("assets/images/products/") để chấp nhận base64 ***
        const validCart = cart.filter(item => item && item.id && item.name && item.image && Number(item.priceValue) > 0);
        if (validCart.length !== cart.length) {
            localStorage.setItem("cart", JSON.stringify(validCart));
        }
        return validCart;
    }
    function saveCart(cart) {
        localStorage.setItem("cart", JSON.stringify(cart));
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
    window.renderallcart=function() {
        const danhsach = document.querySelectorAll('.danhsach');
        const cart = getcart();
        let modalCart = '';
        let sum = 0;

        if (cart.length === 0) {
            modalCart = "<p style='text-align: center; padding: 20px;'>Giỏ hàng của bạn đang trống.</p>";
            danhsach.forEach(list => {
                list.innerHTML = modalCart;
            });
        } else {
            modalCart = `<div class="modal_cart">
                <div class="item-info">
                        <div> Sản phẩm</div>
                        <div> Giá</div>
                        <div> Số lượng</div>
                </div>
                  `;
            cart.forEach(item => {
                let priceitem = 0;
                priceitem = item.priceValue * item.quantity;
                if (!isNaN(priceitem)) {
                    sum = sum + priceitem;
                }
                modalCart += `<div class="all-cart">
                <button class="remove_item" onclick="removecart('${item.id}')">x</button>
                <img src="${item.image}" alt="${item.name}" class="item-img">
                <div class="name-price-quantity">
                    <div class="display-flex">
                        <div class="item-name">${item.name}</div>
                        <div class="item-price">${item.price}</div>
                    </div>      
                    <div class="item-quantity-all">
                        <div class="remove-quantity" onclick="removeItemQuantity('${item.id}')">-</div>
                        <div class="quantity">${item.quantity}</div>
                        <div class="add-quantity" onclick="addItemQuantity('${item.id}')">+</div>
                    </div>
                </div>
            </div>
                     `;
            });
            modalCart += `</div>`;
            danhsach.forEach(list => {
                list.innerHTML = modalCart;
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
});