// GENERATED FILE — source of truth: components/header.html + components/footer.html
// Run: node tools/build-user-shell.js
// Do not edit generated markup here; update component HTML and regenerate.
(function () {
  "use strict";

  const COMPONENTS = Object.freeze({
    header: "<header>\n  <div class=\"top-nav\">\n    <div class=\"logo\">SHOE STORE</div>\n    <div class=\"search-box\">\n      <input type=\"text\" id=\"searchInput\" placeholder=\"Tìm kiếm sản phẩm...:\" autocomplete=\"off\">\n      <div id=\"searchSuggestions\" class=\"search-suggestions\" role=\"listbox\" aria-label=\"Gợi ý và lịch sử tìm kiếm\"></div>\n    </div>\n    <nav class=\"category-nav\" aria-label=\"Danh mục sản phẩm\">\n      <a href=\"pages/home.html?category=Nike#sanpham\" data-catalog=\"Nike\">Nike</a>\n      <a href=\"pages/home.html?category=Adidas#sanpham\" data-catalog=\"Adidas\">Adidas</a>\n      <a href=\"pages/home.html?category=Converse#sanpham\" data-catalog=\"Converse\">Converse</a>\n      <a href=\"pages/home.html?category=MLB#sanpham\" data-catalog=\"MLB\">MLB</a>\n      <a href=\"pages/home.html?category=Vans#sanpham\" data-catalog=\"Vans\">Vans</a>\n    </nav>\n    <div class=\"menu\">\n      <a href=\"pages/home.html\" class=\"nav-home\">Trang chủ</a>\n      <a href=\"pages/login.html\" class=\"nav-login\">Đăng nhập</a>\n      <a href=\"pages/cart.html\" id=\"open-cart-btn\">Giỏ hàng🛒</a>\n      <a href=\"pages/order-history.html\" id=\"LichSuMuaHangBTN\">Lịch sử</a>\n      <div class=\"user-avatar\" id=\"userAvatar\" hidden>\n        <img src=\"assets/img/Avatar/avtuser.jpg\" alt=\"avatar\">\n        <div class=\"dropdown\" id=\"avatarDropdown\">\n          <a href=\"pages/profile.html\"><p>Tài khoản: <b id=\"usernameDisplay\"></b></p></a>\n          <button id=\"logoutBtn\">Đăng xuất</button>\n        </div>\n      </div>\n    </div>\n  </div>\n</header>\n",
    footer: "<footer>\n<div class=\"footer-container\">\n<div class=\"footer-col\">\n<h3>Showroom</h3>\n<ul>\n<li>📍 170 Xã Đàn, Đống Đa, TP. Hà Nội <br/>☎️ <span>0943.72.3388</span></li>\n<li>📍 04 Trần Đăng Ninh, Cầu Giấy, TP. Hà Nội <br/>☎️ <span>0941.82.3388</span></li>\n<li>📍 10 Bế Văn Đàn, Thanh Khê, TP. Đà Nẵng <br/>☎️ <span>0942.27.3388</span></li>\n<li>📍 431 Cách Mạng Tháng 8, Quận 10, TP.HCM <br/>☎️ <span>0941.82.3388</span></li>\n<li>📍 274 Chu Văn An, Bình Thạnh, TP.HCM <br/>☎️ <span>0941.82.3388</span></li>\n</ul>\n</div>\n<div class=\"footer-col\">\n<h3>Hỗ trợ – Chính sách</h3>\n<ul>\n<li>Chính sách giao hàng</li>\n<li>Chính sách kiểm hàng</li>\n<li>Chính sách đổi hàng</li>\n<li>Chính sách thanh toán</li>\n<li>Chính sách bảo hành</li>\n<li>Chính sách bảo mật</li>\n<li>Cửa hàng trực tuyến</li>\n<li>Mua hàng trả góp</li>\n</ul>\n</div>\n<div class=\"footer-col\">\n<h3>Danh mục sản phẩm</h3>\n<ul id=\"catalog-list\">\n<li data-catalog=\"Nike\"><a href=\"pages/home.html?category=Nike#sanpham\">Nike</a></li>\n<li data-catalog=\"Adidas\"><a href=\"pages/home.html?category=Adidas#sanpham\">Adidas</a></li>\n<li data-catalog=\"Converse\"><a href=\"pages/home.html?category=Converse#sanpham\">Converse</a></li>\n<li data-catalog=\"MLB\"><a href=\"pages/home.html?category=MLB#sanpham\">MLB</a></li>\n<li data-catalog=\"Vans\"><a href=\"pages/home.html?category=Vans#sanpham\">Vans</a></li>\n</ul>\n</div>\n<div class=\"footer-col\">\n<h3>Kết nối với chúng tôi</h3>\n<p>SHOE STORE® Official Online Website</p>\n<p>Kết nối qua Facebook / cập nhật sản phẩm mới nhất</p>\n</div>\n</div>\n</footer>\n"
  });

  function inject(name, selector) {
    const targets = document.querySelectorAll(selector);
    if (!targets.length) return;
    targets.forEach((target) => {
      target.innerHTML = COMPONENTS[name];
      target.classList.add(`user-component-${name}`);
    });
  }

  function mount() {
    inject("header", "[data-user-component=\"header\"]");
    inject("footer", "[data-user-component=\"footer\"]");
    document.dispatchEvent(new CustomEvent("user-shell-ready"));
  }

  mount();
  window.mountUserShell = mount;
})();
