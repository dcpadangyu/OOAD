// Giao dien cua hang (User). Du lieu san pham, ton kho va don hang dung chung nam o database/products-shoes.js (nap truoc file nay).

const esc = ShopCore.esc;
const FALLBACK_IMAGE = "assets/img/no-image.png";

function imgFallbackAttr() {
  return `onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'"`;
}

const PER_PAGE = 15;
let currentPage = 1;
// Tập tên loại (chữ thường) đang bị ẩn trong localStorage "categories" ({ maLoai, tenLoai, trangThai: "active" | "hidden" }).
function getHiddenCategorySet() {
  const hidden = new Set();
  try {
    const list = JSON.parse(localStorage.getItem("categories") || "[]");
    if (Array.isArray(list)) {
      list.forEach((category) => {
        if (!category || category.trangThai !== "hidden") return;
        [category.tenLoai, category.maLoai].forEach((name) => {
          if (name !== undefined && name !== null && String(name).trim()) hidden.add(String(name).trim().toLowerCase());
        });
      });
    }
  } catch (error) {
    // Dữ liệu loại hỏng: coi như không có loại nào bị ẩn.
  }
  return hidden;
}

function isStorefrontVisible(product, hiddenCategories) {
  // Chỉ hiện sản phẩm chưa ẩn, loại chưa bị ẩn, đã có giá và còn hàng (hết sạch số lượng/size thì không hiển thị).
  if (!product || product.trangThaiHienThi === "hidden" || !(Number(product.giaBan) > 0) || !(Number(product.soLuongTon) > 0)) return false;
  const hidden = hiddenCategories instanceof Set ? hiddenCategories : getHiddenCategorySet();
  return !hidden.has(String(product.maLoai ?? "").trim().toLowerCase());
}

function loadStorefrontProducts() {
  const hidden = getHiddenCategorySet();
  return getLocalProducts().filter((product) => isStorefrontVisible(product, hidden));
}

let currentList = loadStorefrontProducts();
let localproducts = loadStorefrontProducts();
let currentCatalog = null;

function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.dataset.productId = product.maSanPham;
  card.innerHTML = `<img src="${esc(product.hinhAnh)}" alt="${esc(product.tenSanPham)}" loading="lazy" ${imgFallbackAttr()}><h3 class="desc">${esc(product.tenSanPham)}</h3><p class="price">${esc(product.giaHienThi)}</p>`;
  card.addEventListener("click", () => openProductPopup(product));
  return card;
}

function renderProducts(list, page = 1) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;
  const hiddenCategories = getHiddenCategorySet();
  const visibleList = (list || getLocalProducts()).filter((product) => isStorefrontVisible(product, hiddenCategories));
  currentList = visibleList;
  const totalPages = Math.max(1, Math.ceil(visibleList.length / PER_PAGE));
  currentPage = Math.min(Math.max(page, 1), totalPages);
  grid.innerHTML = "";
  if (!visibleList.length) {
    grid.innerHTML = '<p class="no-products" style="grid-column:1/-1;text-align:center;padding:40px 12px;">Không tìm thấy sản phẩm phù hợp</p>';
    renderPagination(0, 1);
    return;
  }
  visibleList.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE).forEach((product) => grid.appendChild(createProductCard(product)));
  window.ProductReviews?.decorateCards();
  renderPagination(totalPages, currentPage);
}

function getProductSizes(product) {
  if (product?.tonKhoTheoSize && typeof product.tonKhoTheoSize === "object" && !Array.isArray(product.tonKhoTheoSize)) {
    const declaredSizes = getProductSizes({ kichCo: product.kichCo });
    const stockSizes = Object.keys(product.tonKhoTheoSize).map(Number).filter(Number.isFinite);
    return [...new Set([...declaredSizes, ...stockSizes])].sort((a, b) => a - b);
  }
  const value = product?.sizes ?? product?.availableSizes ?? product?.kichCo;
  if (Array.isArray(value)) {
    return [...new Set(value.map((size) => Number(size)).filter(Number.isFinite))].sort((a, b) => a - b);
  }
  const text = String(value || "").trim();
  if (!text) return [];
  const range = text.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)$/);
  if (range) {
    const start = Number(range[1]);
    const end = Number(range[2]);
    if (end >= start && end - start <= 30) {
      return Array.from({ length: Math.floor(end - start) + 1 }, (_, index) => start + index);
    }
  }
  return [...new Set(text.split(/[,;/|]+/).map((size) => Number(size.trim())).filter(Number.isFinite))].sort((a, b) => a - b);
}

// Size còn hàng: có tonKhoTheoSize thì chỉ lấy size có tồn kho > 0; không thì dùng size khai báo.
function getInStockSizes(product) {
  const stock = product?.tonKhoTheoSize;
  if (stock && typeof stock === "object" && !Array.isArray(stock) && Object.keys(stock).length > 0) {
    return Object.keys(stock).filter((key) => Number(stock[key]) > 0).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  }
  return getProductSizes(product);
}

function renderAvailableSizeFilter() {
  const filter = document.getElementById("sizeFilter");
  const group = filter?.closest(".filter-group");
  if (!filter || !group) return;
  const previous = filter.value;
  const sizes = [...new Set(localproducts.flatMap(getInStockSizes))].sort((a, b) => a - b);
  filter.replaceChildren(new Option("Tất cả size", ""));
  sizes.forEach((size) => filter.appendChild(new Option(String(size), String(size))));
  if (previous && sizes.some((size) => String(size) === previous)) filter.value = previous;
  group.hidden = sizes.length === 0;
}

function openProductPopup(product) {
  const popup = document.getElementById("product-popup");
  const detail = document.getElementById("popup-details");
  if (!popup || !detail) return;
  const sizeOptions = getProductSizes(product);
  const stockForSize = (size) => product.tonKhoTheoSize && typeof product.tonKhoTheoSize === "object"
    ? Math.max(0, Number(product.tonKhoTheoSize[String(size)]) || 0)
    : null;
  const firstAvailableSize = sizeOptions.find((size) => stockForSize(size) === null || stockForSize(size) > 0);
  const sizePicker = sizeOptions.length
    ? `<div class="size-picker"><strong>Chọn size:</strong><div class="size-options" role="radiogroup" aria-label="Chọn size">${sizeOptions.map((size) => {
      const stock = stockForSize(size);
      const available = stock === null || stock > 0;
      const selected = available && size === firstAvailableSize;
      return `<button type="button" class="size-option${selected ? " active" : ""}${available ? "" : " sold-out"}" data-size="${size}" aria-pressed="${selected}"${available ? "" : " disabled"}>${size}${available ? "" : " (Hết hàng)"}</button>`;
    }).join("")}</div></div>`
    : "";
  const sizeDescription = sizeOptions.length ? `<p><strong>Kích thước:</strong> ${sizeOptions.join(", ")}</p>` : "";
  detail.innerHTML = `<div class="product-info"><div class="left"><img src="${esc(product.hinhAnh)}" alt="${esc(product.tenSanPham)}" ${imgFallbackAttr()}></div><div class="right"><p class="desc">${esc(product.moTaNgan)}</p><h2>${esc(product.tenSanPham)}</h2><p><strong>Màu sắc:</strong> ${esc(product.mauSac)}</p><p><strong>Chất liệu:</strong> ${esc(product.chatLieu)}</p><p><strong>Phong cách:</strong> ${esc(product.phongCach)}</p><p><strong>Giới tính:</strong> ${esc(product.gioiTinh)}</p>${sizePicker}<p class="price">${esc(product.giaHienThi)}</p><div class="actions"><button id="add-to-cart">Thêm vào giỏ hàng</button><button id="buy-now">Mua ngay</button></div></div></div><div class="description"><h3>Mô tả sản phẩm</h3><p>${esc(product.moTa)}</p><h3>Thông số giày</h3><p><strong>Chất liệu:</strong> ${esc(product.chatLieu)}</p><p><strong>Phong cách:</strong> ${esc(product.phongCach)}</p>${sizeDescription}<p><strong>Xuất xứ:</strong> ${esc(product.xuatXu)}</p></div><div class="product-reviews" data-product="${esc(product.maSanPham)}"></div>`;
  window.ProductReviews?.render(detail.querySelector(".product-reviews"), product.maSanPham);
  popup.style.display = "flex";
  document.body.style.overflow = "hidden";
  let selectedSize = firstAvailableSize == null ? "" : String(firstAvailableSize);
  detail.querySelectorAll(".size-option").forEach((button) => {
    button.addEventListener("click", () => {
      selectedSize = button.dataset.size || selectedSize;
      detail.querySelectorAll(".size-option").forEach((option) => {
        const isSelected = option === button;
        option.classList.toggle("active", isSelected);
        option.setAttribute("aria-pressed", String(isSelected));
      });
    });
  });
  const addToCart = (options) => {
    const latestProduct = getLocalProducts().find((item) => item.maSanPham === product.maSanPham);
    // Kiểm tra lại sản phẩm mới nhất: chưa ẩn, loại chưa ẩn, có giá và còn hàng.
    if (!latestProduct || !isStorefrontVisible(latestProduct)) {
      alert("Sản phẩm này hiện không còn được bán.");
      return false;
    }
    if (sizeOptions.length && !selectedSize) {
      alert("Sản phẩm hiện đã hết hàng ở tất cả size.");
      return false;
    }
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item) => item.maSanPham === product.maSanPham && String(item.kichCoDaChon || "") === selectedSize);
    const requestedQuantity = options && options.keepExisting && existing ? Number(existing.soLuong) : Number(existing?.soLuong || 0) + 1;
    const availableQuantity = selectedSize && latestProduct.tonKhoTheoSize
      ? Math.max(0, Number(latestProduct.tonKhoTheoSize[selectedSize]) || 0)
      : Math.max(0, Number(latestProduct.soLuongTon) || 0);
    if (requestedQuantity > availableQuantity) {
      const trongGio = Number(existing?.soLuong || 0);
      alert(`Sản phẩm không đủ. Size ${selectedSize || "này"} chỉ còn ${availableQuantity}` + (trongGio ? ` (bạn đã có ${trongGio} trong giỏ hàng).` : "."));
      return false;
    }
    if (existing) existing.soLuong = requestedQuantity;
    else cart.push({ maSanPham: latestProduct.maSanPham, tenSanPham: latestProduct.tenSanPham, maLoai: latestProduct.maLoai, hinhAnh: latestProduct.hinhAnh, giaHienThi: latestProduct.giaHienThi, giaBan: latestProduct.giaBan, ...(selectedSize ? { kichCoDaChon: selectedSize } : {}), soLuong: 1 });
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (error) {
      alert("Không thể lưu giỏ hàng (bộ nhớ trình duyệt đã đầy).");
      return false;
    }
    if (!(options && options.silent === true)) alert("Đã thêm giày vào giỏ hàng!");
    return true;
  };
  document.getElementById("add-to-cart").addEventListener("click", () => addToCart());
  // Mua ngay: thêm vào giỏ, chỉ chọn đúng dòng vừa thêm rồi chuyển sang trang thanh toán (checkout.js tự chuyển đến đăng nhập nếu cần).
  document.getElementById("buy-now").addEventListener("click", () => {
    if (!addToCart({ silent: true, keepExisting: true })) return;
    localStorage.setItem("selectedCartItems", JSON.stringify([`${product.maSanPham}::${selectedSize}`]));
    popup.style.display = "none";
    document.body.style.overflow = "auto";
    window.location.href = "pages/checkout.html";
  });
}

// Phân trang: chỉ hiện 4 số trang mỗi nhóm; ">" / "<" chuyển từng trang, có "Trang đầu" và "Trang cuối".
const PAGE_WINDOW = 4;

function scrollToCatalog() {
  const heading = document.getElementById("sanpham");
  if (!heading) return;
  const header = document.querySelector(".store-header");
  const offset = header ? header.getBoundingClientRect().height : 0;
  window.scrollTo({ top: Math.max(0, heading.getBoundingClientRect().top + window.scrollY - offset - 12), behavior: "smooth" });
}

function renderPagination(totalPages, page) {
  const container = document.getElementById("pagination");
  if (!container) return;
  container.innerHTML = "";
  if (totalPages <= 1) return;

  const goTo = (target) => {
    renderProducts(currentList, target);
    scrollToCatalog();
  };
  const addButton = (label, target, options = {}) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    if (options.title) button.title = options.title;
    if (options.className) button.className = options.className;
    if (options.active) button.classList.add("active");
    if (options.disabled) button.disabled = true;
    else button.addEventListener("click", () => goTo(target));
    container.appendChild(button);
  };

  const start = Math.floor((page - 1) / PAGE_WINDOW) * PAGE_WINDOW + 1;
  const end = Math.min(totalPages, start + PAGE_WINDOW - 1);

  // Đang ở nhóm trang đầu (1-4) thì không hiện "Trang đầu" và "<".
  if (start > 1) {
    addButton("Trang đầu", 1, { className: "page-nav" });
    addButton("<", page - 1, { className: "page-nav", title: "Trang trước" });
  }
  for (let index = start; index <= end; index += 1) {
    addButton(String(index), index, { active: index === page });
  }

  addButton(">", page + 1, { className: "page-nav", title: "Trang sau", disabled: page === totalPages });
  addButton("Trang cuối", totalPages, { className: "page-nav", disabled: page === totalPages });
}
function applyAllFilters() {
  const price = document.getElementById("priceFilter")?.value || "";
  const color = document.getElementById("colorFilter")?.value.toLowerCase() || "";
  const material = document.getElementById("materialFilter")?.value.toLowerCase() || "";
  const style = document.getElementById("styleFilter")?.value.toLowerCase() || "";
  const gender = document.getElementById("genderFilter")?.value.toLowerCase() || "";
  const size = document.getElementById("sizeFilter")?.value || "";
  const search = document.getElementById("searchInput")?.value.trim().toLowerCase() || "";
  const filtered = localproducts.filter((product) => {
    // Khoảng giá không chồng lấn: [min, max) ; "tren4" là >= 4.000.000.
    const giaBan = Number(product.giaBan);
    const matchesPrice = !price || (price === "duoi1" ? giaBan < 1000000 : price === "tren4" ? giaBan >= 4000000 : giaBan >= Number(price.split("-")[0]) * 1000000 && giaBan < Number(price.split("-")[1]) * 1000000);
    const matchesSize = !size || getInStockSizes(product).includes(Number(size));
    return (!currentCatalog || String(product.maLoai).toLowerCase() === String(currentCatalog).toLowerCase()) && (!search || `${product.tenSanPham} ${product.maLoai}`.toLowerCase().includes(search)) && matchesPrice && (!color || product.mauSac.toLowerCase() === color) && (!material || product.chatLieu.toLowerCase() === material) && (!style || product.phongCach.toLowerCase() === style) && (!gender || product.gioiTinh.toLowerCase() === gender) && matchesSize;
  });
  renderProducts(filtered, 1);
}

function filterProducts() { applyAllFilters(); }
function getSearchHistory() {
  try { return JSON.parse(localStorage.getItem("shoeSearchHistory") || "[]"); }
  catch (error) { return []; }
}

function saveSearchHistory(value) {
  const query = value.trim();
  if (!query) return;
  const history = getSearchHistory().filter(item => item.toLowerCase() !== query.toLowerCase());
  history.unshift(query);
  localStorage.setItem("shoeSearchHistory", JSON.stringify(history.slice(0, 6)));
}

function renderSearchSuggestions() {
  const input = document.getElementById("searchInput");
  const container = document.getElementById("searchSuggestions");
  if (!input || !container) return;
  const query = input.value.trim().toLowerCase();
  const history = getSearchHistory();
  const matches = query ? localproducts.filter(product => `${product.tenSanPham} ${product.maLoai}`.toLowerCase().includes(query)).slice(0, 6).map(product => product.tenSanPham) : [];
  const items = query ? matches : history;
  if (!items.length) { container.innerHTML = ""; container.style.display = "none"; return; }
  container.innerHTML = `${query ? "<div class=\"search-suggestion-label\">Gợi ý tìm kiếm</div>" : "<div class=\"search-suggestion-label\">Lịch sử tìm kiếm</div>"}${items.map(item => `<button type="button" class="search-suggestion" data-query="${esc(item)}">${query ? "⌕" : "↻"}<span>${esc(item)}</span></button>`).join("")}${!query ? '<button type="button" class="search-history-clear">Xóa lịch sử</button>' : ""}`;
  container.style.display = "block";
}

function searchProducts() { applyAllFilters(); renderSearchSuggestions(); }
function renderProductsByCatalog(catalog) { currentCatalog = catalog; applyAllFilters(); }

function refreshStorefront() {
  localproducts = loadStorefrontProducts();
  renderAvailableSizeFilter();
  applyAllFilters();
}
window.addEventListener("productsUpdated", refreshStorefront);
window.addEventListener("storage", (event) => { if (event.key === "productsLocal" || event.key === "categories") refreshStorefront(); });
window.addEventListener("categoriesUpdated", refreshStorefront);
document.addEventListener("DOMContentLoaded", () => {
  const heroCta = document.querySelector(".hero-cta");
  const productHeading = document.getElementById("sanpham");
  if (heroCta && productHeading) {
    heroCta.addEventListener("click", (event) => {
      event.preventDefault();
      const header = document.querySelector(".store-header");
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const top = productHeading.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      window.history.replaceState(null, "", "#sanpham");
    });
  }

  const close = document.getElementById("closePopup");
  if (close) close.addEventListener("click", () => { document.getElementById("product-popup").style.display = "none"; document.body.style.overflow = "auto"; });
  const searchInput = document.getElementById("searchInput");
  const searchSuggestions = document.getElementById("searchSuggestions");
  if (searchInput && searchSuggestions) {
    searchInput.addEventListener("focus", renderSearchSuggestions);
    searchInput.addEventListener("input", () => { applyAllFilters(); renderSearchSuggestions(); });
    searchInput.addEventListener("keydown", event => { if (event.key === "Enter") { saveSearchHistory(searchInput.value); searchSuggestions.style.display = "none"; applyAllFilters(); } });
    searchSuggestions.addEventListener("click", event => {
      const suggestion = event.target.closest(".search-suggestion");
      if (suggestion) { searchInput.value = suggestion.dataset.query; saveSearchHistory(searchInput.value); searchSuggestions.style.display = "none"; applyAllFilters(); }
      if (event.target.closest(".search-history-clear")) { localStorage.removeItem("shoeSearchHistory"); renderSearchSuggestions(); }
    });
    document.addEventListener("click", event => { if (!event.target.closest(".search-box")) searchSuggestions.style.display = "none"; });
  }
  document.querySelectorAll("#catalog-list li, .category-nav a, .brand-link").forEach((item) => item.addEventListener("click", (event) => { event.preventDefault(); renderProductsByCatalog(item.dataset.catalog); document.getElementById("product-list-wrapper")?.scrollIntoView({ behavior: "smooth" }); }));
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  const searchParam = params.get("search");
  if (searchParam && searchInput) searchInput.value = searchParam;
  if (category) { renderProductsByCatalog(category); }
  else if (searchParam) { applyAllFilters(); }
  else { renderProducts(localproducts, 1); }
  renderAvailableSizeFilter();
});
