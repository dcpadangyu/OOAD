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
        if (!Array.isArray(cart)) cart = [];
        // Doi chieu voi danh muc hien tai de gia/ten/anh luon moi nhat; bo san pham bi an hoac da xoa.
        let catalog = [];
        try {
            catalog = JSON.parse(localStorage.getItem("productsLocal") || "[]");
        } catch (error) {
            catalog = [];
        }
        const useCatalog = Array.isArray(catalog) && catalog.length > 0;
        const imageOk = (image) => typeof image === "string" && (/^(data:image|https?:)/i.test(image) || image.startsWith("assets/images/products/"));
        const validCart = [];
        cart.forEach(item => {
            if (!item || !item.maSanPham) return;
            let entry = item;
            if (useCatalog) {
                const product = catalog.find(p => p && p.maSanPham === item.maSanPham);
                if (!product || product.trangThaiHienThi === "hidden") return;
                entry = {
                    maSanPham: product.maSanPham,
                    tenSanPham: product.tenSanPham,
                    maLoai: product.maLoai,
                    hinhAnh: product.hinhAnh,
                    giaHienThi: product.giaHienThi,
                    giaBan: product.giaBan,
                    soLuong: item.soLuong
                };
                if (item.kichCoDaChon) entry.kichCoDaChon = item.kichCoDaChon;
            }
            if (!entry.tenSanPham || !imageOk(entry.hinhAnh) || !(Number(entry.giaBan) > 0) || !(Number(entry.soLuong) > 0)) return;
            validCart.push(entry);
        });
        if (JSON.stringify(validCart) !== JSON.stringify(cart)) {
            localStorage.setItem("cart", JSON.stringify(validCart));
        }
        return validCart;
    }
    function saveCart(cart) {
        localStorage.setItem("cart", JSON.stringify(cart));
        renderallcart();
    }
    function cartKey(item) {
        return `${item.maSanPham}::${item.kichCoDaChon || ""}`;
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
    function updateSelection(key, checked) {
        const keys = getSelectedCartKeys().filter((k) => k !== key);
        if (checked) keys.push(key);
        localStorage.setItem("selectedCartItems", JSON.stringify(keys));
        renderallcart();
    }
    // Xu ly nut x / + / - va o chon bang event delegation (data-ma, data-size) de ma san pham co dau nhay khong pha HTML.
    function handleCartClick(event) {
        const control = event.target.closest("[data-action]");
        if (!control || !event.currentTarget.contains(control)) return;
        const productId = control.dataset.ma || "";
        const size = control.dataset.size || "";
        if (control.dataset.action === "remove") removecart(productId, size);
        else if (control.dataset.action === "increase") addItemQuantity(productId, size);
        else if (control.dataset.action === "decrease") removeItemQuantity(productId, size);
    }
    function handleCartChange(event) {
        const checkbox = event.target.closest(".cart-select");
        if (!checkbox || !event.currentTarget.contains(checkbox)) return;
        updateSelection(checkbox.dataset.cartKey || "", checkbox.checked);
    }
    function addItemQuantity(productid, selectedSize = "") {
        const cart = getcart();
        const item = cart.find(p => p.maSanPham === productid && String(p.kichCoDaChon || "") === String(selectedSize || ""));
        if (item) {
            const products = JSON.parse(localStorage.getItem("productsLocal") || "[]");
            const product = products.find((p) => p.maSanPham === item.maSanPham);
            const selectedSize = String(item.kichCoDaChon || "");
            const available = product?.tonKhoTheoSize && selectedSize
                ? Number(product.tonKhoTheoSize[selectedSize]) || 0
                : Number(product?.soLuongTon) || 0;
            if (item.soLuong >= available) {
                alert(`Sản phẩm không đủ. Size ${selectedSize || "này"} chỉ còn ${available}.`);
                return;
            }
            item.soLuong++;
            saveCart(cart);
        }
    }
    // Neu truyen selectedSize thi chi xoa dong cua size do; neu bo trong thi xoa moi size cua san pham.
    function removecart(productId, selectedSize) {
        const cart = getcart();
        const matches = (p) => p.maSanPham === productId && (selectedSize === undefined || String(p.kichCoDaChon || "") === String(selectedSize || ""));
        const item = cart.filter(p => !matches(p));
        const removedKeys = new Set(cart.filter(matches).map(cartKey));
        const selected = getSelectedCartKeys().filter((key) => !removedKeys.has(key));
        localStorage.setItem("selectedCartItems", JSON.stringify(selected));
        saveCart(item);
    }
    function removeItemQuantity(productid, selectedSize = "") {
        const cart = getcart();
        const item = cart.find(p => p.maSanPham === productid && String(p.kichCoDaChon || "") === String(selectedSize || ""));
        if (item) {
            if (item.soLuong > 1) {
                item.soLuong--;
                saveCart(cart);
            }
            else {
                removecart(productid, selectedSize);
            }
        }
    }
    // renderallcart(displayCart, { readOnly: true }): readOnly chi hien anh, ten + size, gia, so luong (khong checkbox / x / + / -).
    // Che do readOnly cong don tien cua tat ca dong dang hien (tam tinh); che do thuong chi cong dong duoc chon.
    window.renderallcart=function(displayCart, options) {
        const readOnly = !!(options && options.readOnly);
        const esc = ShopCore.esc;
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
            modalCart = readOnly
                ? `<div class="modal_cart readonly-cart">
                <div class="item-info">
                        <div class="cart-col-select" aria-hidden="true"></div>
                        <div> Sản phẩm</div>
                        <div> Giá</div>
                        <div> Số lượng</div>
                </div>
                  `
                : `<div class="modal_cart">
                <div class="item-info">
                        <div> Chọn</div>
                        <div> Sản phẩm</div>
                        <div> Giá</div>
                        <div> Số lượng</div>
                </div>
                  `;
            cart.forEach(item => {
                const key = cartKey(item);
                const isSelected = readOnly || selectedKeys.includes(key);
                const unitPrice = Number(item.giaBan !== undefined ? item.giaBan : item.donGia);
                const priceitem = unitPrice * Number(item.soLuong);
                if (isSelected && !isNaN(priceitem)) sum += priceitem;
                const name = esc(item.tenSanPham);
                const ma = esc(item.maSanPham);
                const size = esc(item.kichCoDaChon || "");
                const product = `<div class="cart-product">
                    <img src="${esc(item.hinhAnh)}" alt="${name}" class="item-img">
                    <div class="item-name">${name} - Size ${size || "Chưa chọn"}</div>
                </div>`;
                if (readOnly) {
                    modalCart += `<div class="all-cart">
                ${product}
                <div class="item-price">${esc(item.giaHienThi)}</div>
                <div class="item-quantity-all">
                    <div class="quantity">${esc(item.soLuong)}</div>
                </div>
            </div>
                     `;
                    return;
                }
                modalCart += `<div class="all-cart">
                <input type="checkbox" class="cart-select" data-cart-key="${esc(key)}" ${isSelected ? "checked" : ""} aria-label="Chọn ${name}">
                <button type="button" class="remove_item" data-action="remove" data-ma="${ma}" data-size="${size}" aria-label="Xóa ${name}">x</button>
                ${product}
                <div class="item-price">${esc(item.giaHienThi)}</div>
                <div class="item-quantity-all">
                    <div class="remove-quantity" data-action="decrease" data-ma="${ma}" data-size="${size}">-</div>
                    <div class="quantity">${esc(item.soLuong)}</div>
                    <div class="add-quantity" data-action="increase" data-ma="${ma}" data-size="${size}">+</div>
                </div>
            </div>
                     `;
            });
            modalCart += `</div>`;
            danhsach.forEach(list => {
                list.innerHTML = modalCart;
                if (!list.dataset.cartBound) {
                    list.dataset.cartBound = "1";
                    list.addEventListener("click", handleCartClick);
                    list.addEventListener("change", handleCartChange);
                }
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
        const products = Array.isArray(order?.chiTiet) ? order.chiTiet : [];
        if (!products.length) {
            lists.forEach((list) => {
                list.innerHTML = "<p class='invoice-empty'>Không tìm thấy sản phẩm trong đơn hàng.</p>";
            });
            return;
        }

        const esc = ShopCore.esc;
        const html = `<div class="modal_cart invoice_cart">
            ${products.map((item) => `<div class="all-cart">
                <div class="cart-product">
                    <img src="${esc(item.hinhAnh)}" alt="${esc(item.tenSanPham)}" class="item-img">
                    <div class="item-name">${esc(item.tenSanPham)} - Size ${esc(item.kichCoDaChon || "Chưa chọn")}</div>
                </div>
                <div class="invoice-price-quantity">
                    <div class="item-price">${esc(item.giaHienThi)}</div>
                    <div class="item-quantity-all">
                        <div class="quantity">Số lượng: ${esc(item.soLuong)}</div>
                    </div>
                </div>
            </div>`).join("")}
        </div>`;
        lists.forEach((list) => { list.innerHTML = html; });
    };


});
