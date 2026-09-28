// GENERATED FILE — source of truth: components/header.html + components/footer.html
// Run: node tools/build-user-shell.js
// Do not edit generated markup here; update component HTML and regenerate.
(function () {
  "use strict";

  const COMPONENTS = Object.freeze({
    header: "<header class=\"store-header\">\r\n  <div class=\"store-notice\"><span>MIỄN PHÍ VẬN CHUYỂN</span> cho đơn từ 10.000.000₫ <span>•</span> Đổi size trong 7 ngày</div>\r\n  <div class=\"top-nav\">\r\n    <a class=\"logo\" href=\"pages/home.html\" aria-label=\"OOAD trang chủ\"><span>OOAD</span><small>STUDIO</small></a>\r\n    <div class=\"search-box\">\r\n      <span class=\"search-icon\" aria-hidden=\"true\">⌕</span>\r\n      <input type=\"text\" id=\"searchInput\" placeholder=\"Tìm kiếm giày, thương hiệu...\" autocomplete=\"off\">\r\n      <div id=\"searchSuggestions\" class=\"search-suggestions\" role=\"listbox\" aria-label=\"Gợi ý và lịch sử tìm kiếm\"></div>\r\n    </div>\r\n    <nav class=\"category-nav\" aria-label=\"Danh mục sản phẩm\">\r\n      <a href=\"pages/home.html?category=Nike#sanpham\" data-catalog=\"Nike\">Nike</a>\r\n      <a href=\"pages/home.html?category=Adidas#sanpham\" data-catalog=\"Adidas\">Adidas</a>\r\n      <a href=\"pages/home.html?category=Converse#sanpham\" data-catalog=\"Converse\">Converse</a>\r\n      <a href=\"pages/home.html?category=MLB#sanpham\" data-catalog=\"MLB\">MLB</a>\r\n      <a href=\"pages/home.html?category=Vans#sanpham\" data-catalog=\"Vans\">Vans</a>\r\n    </nav>\r\n    <div class=\"menu\">\r\n      <a href=\"pages/home.html\" class=\"nav-home\">Trang chủ</a>\r\n      <a href=\"pages/login.html\" class=\"nav-login\">Đăng nhập</a>\r\n      <a href=\"pages/cart.html\" id=\"open-cart-btn\" class=\"cart-link\"><span aria-hidden=\"true\">□</span> Giỏ hàng</a>\r\n      <a href=\"pages/order-history.html\" id=\"LichSuMuaHangBTN\">Đơn hàng</a>\r\n      <div class=\"user-avatar\" id=\"userAvatar\" hidden>\r\n        <img src=\"assets/img/Avatar/avtuser.jpg\" alt=\"avatar\">\r\n        <div class=\"dropdown\" id=\"avatarDropdown\">\r\n          <a class=\"nav-profile-header\" href=\"pages/profile.html\">\r\n            <span class=\"dropdown-label\">Tài khoản</span>\r\n            <strong id=\"usernameDisplay\"></strong>\r\n            <span class=\"dropdown-link\">Xem hồ sơ</span>\r\n          </a>\r\n          <button id=\"logoutBtn\">Đăng xuất</button>\r\n        </div>\r\n      </div>\r\n    </div>\r\n  </div>\r\n</header>\n",
    footer: "<footer class=\"store-footer\">\r\n<div class=\"footer-container\">\r\n<div class=\"footer-col\">\r\n<div class=\"footer-brand\">OOAD<span>.</span></div>\r\n<p class=\"footer-intro\">Những đôi giày tốt cho nhịp sống năng động mỗi ngày.</p>\r\n<h3>Showroom</h3>\r\n<ul>\r\n<li>📍 170 Xã Đàn, Đống Đa, TP. Hà Nội <br/>☎️ <span>0943.72.3388</span></li>\r\n<li>📍 04 Trần Đăng Ninh, Cầu Giấy, TP. Hà Nội <br/>☎️ <span>0941.82.3388</span></li>\r\n<li>📍 10 Bế Văn Đàn, Thanh Khê, TP. Đà Nẵng <br/>☎️ <span>0942.27.3388</span></li>\r\n<li>📍 431 Cách Mạng Tháng 8, Quận 10, TP.HCM <br/>☎️ <span>0941.82.3388</span></li>\r\n<li>📍 274 Chu Văn An, Bình Thạnh, TP.HCM <br/>☎️ <span>0941.82.3388</span></li>\r\n</ul>\r\n</div>\r\n<div class=\"footer-col\">\r\n<h3>Hỗ trợ</h3>\r\n<ul>\r\n<li>Chính sách giao hàng</li>\r\n<li>Chính sách kiểm hàng</li>\r\n<li>Chính sách đổi hàng</li>\r\n<li>Chính sách thanh toán</li>\r\n<li>Chính sách bảo hành</li>\r\n<li>Chính sách bảo mật</li>\r\n<li>Cửa hàng trực tuyến</li>\r\n<li>Mua hàng trả góp</li>\r\n</ul>\r\n</div>\r\n<div class=\"footer-col\">\r\n<h3>Danh mục sản phẩm</h3>\r\n<ul id=\"catalog-list\">\r\n<li data-catalog=\"Nike\"><a href=\"pages/home.html?category=Nike#sanpham\">Nike</a></li>\r\n<li data-catalog=\"Adidas\"><a href=\"pages/home.html?category=Adidas#sanpham\">Adidas</a></li>\r\n<li data-catalog=\"Converse\"><a href=\"pages/home.html?category=Converse#sanpham\">Converse</a></li>\r\n<li data-catalog=\"MLB\"><a href=\"pages/home.html?category=MLB#sanpham\">MLB</a></li>\r\n<li data-catalog=\"Vans\"><a href=\"pages/home.html?category=Vans#sanpham\">Vans</a></li>\r\n</ul>\r\n</div>\r\n<div class=\"footer-col\">\r\n<h3>Kết nối</h3>\r\n<p>OOAD® Official Online Store</p>\r\n<p>Instagram · Facebook · TikTok</p>\r\n</div>\r\n</div>\r\n</footer>\n"
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
    if (!document.querySelector('link[data-ooda-redesign]')) {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = 'assets/css/user/redesign.css?v=20260923-2317';
      style.dataset.oodaRedesign = 'true';
      document.head.appendChild(style);
    }
    inject("header", "[data-user-component=\"header\"]");
    inject("footer", "[data-user-component=\"footer\"]");
    document.dispatchEvent(new CustomEvent("user-shell-ready"));
  }

  mount();
  window.mountUserShell = mount;
})();
