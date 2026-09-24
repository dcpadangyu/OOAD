// Du lieu san pham giay dung chung cho cua hang va khu vuc admin.
const shoeImagePaths = [
  "Adidas/adidas-samba-og-black-white.jpg", "Adidas/adidas-samba-og-white-black.jpg", "Adidas/adidas-campus-00s-black-white.jpg", "Adidas/adidas-campus-00s-grey.jpg", "Adidas/adidas-gazelle-bold-pink.jpg", "Adidas/adidas-gazelle-indoor-blue.jpg", "Adidas/adidas-forum-low-white-black.jpg", "Adidas/adidas-superstar-black-white.jpg", "Adidas/adidas-ultraboost-light-black.jpg", "Adidas/adidas-duramo-sl-white.jpg",
  "Converse/converse-chuck-70-high-black.jpg", "Converse/converse-chuck-70-high-red.jpg", "Converse/converse-chuck-70-high-white.jpg", "Converse/converse-chuck-70-low-black.jpg", "Converse/converse-chuck-70-low-white.jpg", "Converse/converse-one-star-black.jpg", "Converse/converse-one-star-white.jpg", "Converse/converse-run-star-hike-black.jpg", "Converse/converse-run-star-motion-white.jpg", "Converse/converse-pro-leather-black.jpg",
  "Mlb/mlb-big-ball-chunky-black.jpg", "Mlb/mlb-big-ball-chunky-white.jpg", "Mlb/mlb-big-ball-chunky-beige.jpg", "Mlb/mlb-big-ball-chunky-pink.jpg", "Mlb/mlb-big-ball-chunky-green.jpg", "Mlb/mlb-chunky-classic-los-angeles-black.jpg", "Mlb/mlb-chunky-classic-los-angeles-white.jpg", "Mlb/mlb-chunky-classic-new-york-black.jpg", "Mlb/mlb-playball-origin-new-york-black.jpg", "Mlb/mlb-playball-origin-los-angeles-white.jpg",
  "Nike/nike-air-force-1-black.jpg", "Nike/nike-air-force-1-white.jpg", "Nike/nike-air-jordan-1-low-black.jpg", "Nike/nike-air-jordan-1-low-white.jpg", "Nike/nike-air-jordan-1-mid-black.jpg", "Nike/nike-air-jordan-1-mid-red.jpg", "Nike/nike-air-max-270-black.jpg", "Nike/nike-air-max-90-white.jpg", "Nike/nike-dunk-low-grey.jpg", "Nike/nike-pegasus-41-black.jpg",
  "Vans/vans-authentic-black.jpg", "Vans/vans-authentic-white.jpg", "Vans/vans-authentic-red.jpg", "Vans/vans-era-black-white.jpg", "Vans/vans-era-white-black.jpg", "Vans/vans-knu-skool-black.jpg", "Vans/vans-old-skool-navy.jpg", "Vans/vans-old-skool-red.jpg", "Vans/vans-sk8-hi-black-white.jpg", "Vans/vans-slip-on-checkerboard.jpg"
];

function shoeColor(path) {
  const value = path.split("/").pop().replace(/\.jpg$/i, "");
  if (value.includes("white")) return "Trắng";
  if (value.includes("black")) return "Đen";
  if (value.includes("red")) return "Đỏ";
  if (value.includes("blue") || value.includes("navy")) return "Xanh dương";
  if (value.includes("green")) return "Xanh lá";
  if (value.includes("pink")) return "Hồng";
  if (value.includes("beige")) return "Be";
  if (value.includes("grey")) return "Xám";
  return "Đen";
}

function shoeName(path) {
  const file = path.split("/").pop().replace(/\.jpg$/i, "");
  return file.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

const products = shoeImagePaths.map((imagePath, index) => {
  const catalogFolder = imagePath.split("/")[0];
  const catalog = catalogFolder.toLowerCase() === "mlb" ? "MLB" : catalogFolder;
  const name = shoeName(imagePath);
  const priceValue = 1290000 + (index % 10) * 270000;
  const material = catalog === "Converse" || catalog === "Vans" ? "Vải" : index % 3 === 0 ? "Da" : "Da tổng hợp";
  return {
    id: `SH-${String(index + 1).padStart(3, "0")}`,
    catalog,
    name,
    gender: index % 5 === 0 ? "Unisex" : index % 3 === 0 ? "Nữ" : "Nam",
    desc: `Giày ${catalog} chính hãng, thiết kế thời trang và bền bỉ`,
    color: shoeColor(imagePath),
    material,
    style: index % 3 === 0 ? "Thời trang" : index % 3 === 1 ? "Thể thao" : "Casual",
    size: "36 - 44",
    priceValue,
    price: `${priceValue.toLocaleString("vi-VN")}₫`,
    image: `assets/images/products/${imagePath}`,
    importPrice: Math.round(priceValue * 0.7),
    quantity: 20 + (index % 6) * 5,
    importQuantity: 20 + (index % 6) * 5,
    soldQuantity: 0,
    visibility: "visible",
    description: `Mẫu ${name} mang lại cảm giác thoải mái khi di chuyển, phù hợp cho phong cách hằng ngày và các hoạt động năng động.`,
    origin: "Việt Nam"
  };
});

function getLocalProducts() {
  try {
    const stored = JSON.parse(localStorage.getItem("productsLocal") || "null");
    const isShoeCatalog = Array.isArray(stored) && stored.length > 0 && stored.every((product) => product.image && product.image.includes("assets/images/products"));
    if (isShoeCatalog) return stored;
  } catch (error) {
    console.error("Loi khi doc san pham:", error);
  }
  localStorage.setItem("productsLocal", JSON.stringify(products));
  return products;
}

const PER_PAGE = 15;
let currentPage = 1;
let currentList = getLocalProducts();
let localproducts = getLocalProducts();
let currentCatalog = null;

function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.innerHTML = `<img src="${product.image}" alt="${product.name}"><h3 class="desc">${product.name}</h3><p class="price">${product.price}</p>`;
  card.addEventListener("click", () => openProductPopup(product));
  return card;
}

function renderProducts(list, page = 1) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;
  const visibleList = (list || getLocalProducts()).filter((product) => product.visibility !== "hidden");
  currentList = visibleList;
  const totalPages = Math.max(1, Math.ceil(visibleList.length / PER_PAGE));
  currentPage = Math.min(Math.max(page, 1), totalPages);
  grid.innerHTML = "";
  visibleList.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE).forEach((product) => grid.appendChild(createProductCard(product)));
  renderPagination(totalPages, currentPage);
}

function openProductPopup(product) {
  const popup = document.getElementById("product-popup");
  const detail = document.getElementById("popup-details");
  if (!popup || !detail) return;
  const sizes = String(product.size || "36 - 44").split("-").map((size) => size.trim()).filter(Boolean);
  const sizeOptions = sizes.length > 1
    ? Array.from({ length: Number(sizes[1]) - Number(sizes[0]) + 1 }, (_, index) => Number(sizes[0]) + index)
    : sizes;
  detail.innerHTML = `<div class="product-info"><div class="left"><img src="${product.image}" alt="${product.name}"></div><div class="right"><p class="desc">${product.desc}</p><h2>${product.name}</h2><p><strong>Màu sắc:</strong> ${product.color}</p><p><strong>Chất liệu:</strong> ${product.material}</p><p><strong>Phong cách:</strong> ${product.style}</p><p><strong>Giới tính:</strong> ${product.gender}</p><label for="product-size"><strong>Chọn size:</strong></label><select id="product-size">${sizeOptions.map((size) => `<option value="${size}">${size}</option>`).join("")}</select><p class="price">${product.price}</p><div class="actions"><button id="add-to-cart">Thêm vào giỏ hàng</button><button id="buy-now">Mua ngay</button></div></div></div><div class="description"><h3>Mô tả sản phẩm</h3><p>${product.description}</p><h3>Thông số giày</h3><p><strong>Chất liệu:</strong> ${product.material}</p><p><strong>Phong cách:</strong> ${product.style}</p><p><strong>Kích thước:</strong> ${product.size}</p><p><strong>Xuất xứ:</strong> ${product.origin}</p></div>`;
  popup.style.display = "flex";
  document.body.style.overflow = "hidden";
  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const size = document.getElementById("product-size")?.value || product.size;
    const existing = cart.find((item) => item.id === product.id && String(item.selectedSize) === String(size));
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, selectedSize: size, quantity: 1 });
    localStorage.setItem("cart", JSON.stringify(cart));
    alert("Đã thêm giày vào giỏ hàng!");
  };
  document.getElementById("add-to-cart").addEventListener("click", addToCart);
  document.getElementById("buy-now").addEventListener("click", () => { addToCart(); popup.style.display = "none"; document.body.style.overflow = "auto"; document.getElementById("open-cart-btn")?.click(); });
}

function renderPagination(totalPages, page) {
  const container = document.getElementById("pagination");
  if (!container) return;
  container.innerHTML = "";
  for (let index = 1; index <= totalPages; index += 1) {
    const button = document.createElement("button");
    button.textContent = index;
    button.classList.toggle("active", index === page);
    button.addEventListener("click", () => renderProducts(currentList, index));
    container.appendChild(button);
  }
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
    const matchesPrice = !price || (price === "duoi1" ? product.priceValue < 1000000 : price === "tren4" ? product.priceValue > 4000000 : product.priceValue >= Number(price.split("-")[0]) * 1000000 && product.priceValue <= Number(price.split("-")[1]) * 1000000);
    const productSizes = String(product.size || "").split("-").map((value) => Number(value.trim())).filter(Boolean);
    const matchesSize = !size || (productSizes.length === 2 && Number(size) >= productSizes[0] && Number(size) <= productSizes[1]) || productSizes.includes(Number(size));
    return (!currentCatalog || String(product.catalog).toLowerCase() === String(currentCatalog).toLowerCase()) && (!search || `${product.name} ${product.catalog}`.toLowerCase().includes(search)) && matchesPrice && (!color || product.color.toLowerCase() === color) && (!material || product.material.toLowerCase() === material) && (!style || product.style.toLowerCase() === style) && (!gender || product.gender.toLowerCase() === gender) && matchesSize;
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
  const matches = query ? localproducts.filter(product => `${product.name} ${product.catalog}`.toLowerCase().includes(query)).slice(0, 6).map(product => product.name) : [];
  const items = query ? matches : history;
  if (!items.length) { container.innerHTML = ""; container.style.display = "none"; return; }
  container.innerHTML = `${query ? "<div class=\"search-suggestion-label\">Gợi ý tìm kiếm</div>" : "<div class=\"search-suggestion-label\">Lịch sử tìm kiếm</div>"}${items.map(item => `<button type="button" class="search-suggestion" data-query="${item.replace(/"/g, "&quot;")}">${query ? "⌕" : "↻"}<span>${item}</span></button>`).join("")}${!query ? '<button type="button" class="search-history-clear">Xóa lịch sử</button>' : ""}`;
  container.style.display = "block";
}

function searchProducts() { applyAllFilters(); renderSearchSuggestions(); }
function renderProductsByCatalog(catalog) { currentCatalog = catalog; applyAllFilters(); }

window.addEventListener("productsUpdated", () => { localproducts = getLocalProducts(); renderProducts(localproducts, 1); });
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
});
