// Du lieu san pham giay dung chung cho cua hang va khu vuc admin.
const shoeImagePaths = [
  "Adidas/adidas-samba-og-black-white.jpg", "Adidas/adidas-samba-og-white-black.jpg", "Adidas/adidas-campus-00s-black-white.jpg", "Adidas/adidas-campus-00s-grey.jpg", "Adidas/adidas-gazelle-bold-pink.jpg", "Adidas/adidas-gazelle-indoor-blue.jpg", "Adidas/adidas-forum-low-white-black.jpg", "Adidas/adidas-superstar-black-white.jpg", "Adidas/adidas-ultraboost-light-black.jpg", "Adidas/adidas-duramo-sl-white.jpg",
  "Converse/converse-chuck-70-high-black.jpg", "Converse/converse-chuck-70-high-red.jpg", "Converse/converse-chuck-70-high-white.jpg", "Converse/converse-chuck-70-low-black.jpg", "Converse/converse-chuck-70-low-white.jpg", "Converse/converse-one-star-black.jpg", "Converse/converse-one-star-white.jpg", "Converse/converse-pro-leather-black.jpg", "Converse/converse-run-star-hike-black.jpg", "Converse/converse-run-star-motion-white.jpg",
  "Mlb/mlb-big-ball-chunky-black.jpg", "Mlb/mlb-big-ball-chunky-white.jpg", "Mlb/mlb-big-ball-chunky-beige.jpg", "Mlb/mlb-big-ball-chunky-pink.jpg", "Mlb/mlb-big-ball-chunky-green.jpg", "Mlb/mlb-chunky-classic-los-angeles-black.jpg", "Mlb/mlb-chunky-classic-los-angeles-white.jpg", "Mlb/mlb-chunky-classic-new-york-black.jpg", "Mlb/mlb-playball-origin-new-york-black.jpg", "Mlb/mlb-playball-origin-los-angeles-white.jpg",
  "Nike/nike-air-force-1-black.jpg", "Nike/nike-air-force-1-white.jpg", "Nike/nike-air-jordan-1-low-black.jpg", "Nike/nike-air-jordan-1-low-white.jpg", "Nike/nike-air-jordan-1-mid-black.jpg", "Nike/nike-air-jordan-1-mid-red.jpg", "Nike/nike-air-max-270-black.jpg", "Nike/nike-air-max-90-white.jpg", "Nike/nike-dunk-low-grey.jpg", "Nike/nike-pegasus-41-black.jpg",
  "Vans/vans-authentic-black.jpg", "Vans/vans-authentic-white.jpg", "Vans/vans-authentic-red.jpg", "Vans/vans-era-black-white.jpg", "Vans/vans-era-white-black.jpg", "Vans/vans-knu-skool-black.jpg", "Vans/vans-old-skool-navy.jpg", "Vans/vans-old-skool-red.jpg", "Vans/vans-sk8-hi-black-white.jpg", "Vans/vans-slip-on-checkerboard.jpg",
  "Adidas/adidas-adizero-sl-black.jpg", "Adidas/adidas-alphabounce-black.jpg", "Adidas/adidas-forum-low-white-blue.jpg", "Adidas/adidas-gazelle-indoor-green.jpg", "Adidas/adidas-handball-spezial-black.jpg", "Adidas/adidas-handball-spezial-brown.jpg", "Adidas/adidas-response-super-black.jpg", "Adidas/adidas-stan-smith-white-green.jpg", "Adidas/adidas-superstar-white-black.jpg", "Adidas/adidas-ultraboost-light-white.jpg",
  "Converse/converse-chuck-taylor-high-black.jpg", "Converse/converse-chuck-taylor-high-navy.jpg", "Converse/converse-chuck-taylor-high-red.jpg", "Converse/converse-chuck-taylor-high-white.jpg", "Converse/converse-chuck-taylor-low-black.jpg", "Converse/converse-chuck-taylor-low-navy.jpg", "Converse/converse-chuck-taylor-low-red.jpg", "Converse/converse-chuck-taylor-low-white.jpg", "Converse/converse-run-star-hike-white.jpg", "Converse/converse-run-star-motion-black.jpg",
  "Mlb/mlb-big-ball-chunky-new-york-red.jpg", "Mlb/mlb-chunky-classic-new-york-white.jpg", "Mlb/mlb-chunky-liner-los-angeles-black.jpg", "Mlb/mlb-chunky-liner-los-angeles-pink.jpg", "Mlb/mlb-chunky-liner-los-angeles-white.jpg", "Mlb/mlb-chunky-liner-new-york-beige.jpg", "Mlb/mlb-chunky-liner-new-york-black.jpg", "Mlb/mlb-chunky-liner-new-york-white.jpg", "Mlb/mlb-playball-origin-los-angeles-black.jpg", "Mlb/mlb-playball-origin-new-york-white.jpg",
  "Nike/nike-air-max-270-white.jpg", "Nike/nike-air-max-90-black.jpg", "Nike/nike-blazer-mid-black.jpg", "Nike/nike-blazer-mid-white.jpg", "Nike/nike-court-vision-low-black.jpg", "Nike/nike-court-vision-low-white.jpg", "Nike/nike-dunk-low-black.jpg", "Nike/nike-dunk-low-white.jpg", "Nike/nike-initiator-white.jpg", "Nike/nike-revolution-7-white.jpg",
  "Vans/vans-knu-skool-white.jpg", "Vans/vans-old-skool-black-white.jpg", "Vans/vans-old-skool-white-black.jpg", "Vans/vans-sk8-hi-navy.jpg", "Vans/vans-sk8-hi-white-black.jpg", "Vans/vans-slip-on-black-white.jpg", "Vans/vans-slip-on-white-black.jpg", "Vans/vans-ultrarange-exo-black.jpg", "Vans/vans-ultrarange-exo-white.jpg", "Vans/vans-ward-platform-black.jpg"
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
    gender: index % 3 === 0 ? "Nữ" : "Nam",
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

// *** FIX: Chấp nhận cả ảnh base64 (data URL) và ảnh đường dẫn ***
function isProductCatalog(data) {
  return Array.isArray(data) && data.length > 0 && data.every((p) =>
    p && typeof p === "object" &&
    typeof p.id === "string" && p.id &&
    typeof p.name === "string" && p.name &&
    typeof p.image === "string" && p.image
  );
}

// Phiên bản seed: tăng lên mỗi khi đổi cấu trúc/số lượng sản phẩm seed
const PRODUCTS_SEED_VERSION = 200;

function getLocalProducts() {
  try {
    const stored = JSON.parse(localStorage.getItem("productsLocal") || "null");
    if (isProductCatalog(stored)) {
      const version = Number(localStorage.getItem("productsSeedVersion") || 0);
      if (version < PRODUCTS_SEED_VERSION) {
        const seedIds = new Set(products.map((p) => p.id));
        const custom = stored.filter((p) => !seedIds.has(p.id));
        const rebuilt = products.slice();
        rebuilt.push(...custom);
        localStorage.setItem("productsLocal", JSON.stringify(rebuilt));
        localStorage.setItem("productsSeedVersion", String(PRODUCTS_SEED_VERSION));
        return rebuilt;
      }
      return stored;
    }
  } catch (error) {
    console.error("Loi khi doc san pham:", error);
  }
  localStorage.setItem("productsLocal", JSON.stringify(products));
  localStorage.setItem("productsSeedVersion", String(PRODUCTS_SEED_VERSION));
  return products;
}

function saveLocalProducts(data) {
  try {
    localStorage.setItem("productsLocal", JSON.stringify(data));
  } catch (error) {
    alert("Lưu dữ liệu thất bại: bộ nhớ trình duyệt đã đầy. Hãy dùng ảnh nhỏ hơn hoặc xóa bớt sản phẩm!");
    console.error("Loi khi luu san pham:", error);
  }
  window.dispatchEvent(new Event("productsUpdated"));
}

function formatProductPrice(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")}₫`;
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
  detail.innerHTML = `<div class="product-info"><div class="left"><img src="${product.image}" alt="${product.name}"></div><div class="right"><p class="desc">${product.desc}</p><h2>${product.name}</h2><p><strong>Màu sắc:</strong> ${product.color}</p><p><strong>Chất liệu:</strong> ${product.material}</p><p><strong>Phong cách:</strong> ${product.style}</p><p><strong>Giới tính:</strong> ${product.gender}</p><p><strong>Size:</strong> ${product.size}</p><p class="price">${product.price}</p><div class="actions"><button id="add-to-cart">Thêm vào giỏ hàng</button><button id="buy-now">Mua ngay</button></div></div></div><div class="description"><h3>Mô tả sản phẩm</h3><p>${product.description}</p><h3>Thông số giày</h3><p><strong>Chất liệu:</strong> ${product.material}</p><p><strong>Phong cách:</strong> ${product.style}</p><p><strong>Kích thước:</strong> ${product.size}</p><p><strong>Xuất xứ:</strong> ${product.origin}</p></div>`;
  popup.style.display = "flex";
  document.body.style.overflow = "hidden";
  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item) => item.id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, quantity: 1 });
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
  const search = document.getElementById("searchInput")?.value.trim().toLowerCase() || "";
  const filtered = localproducts.filter((product) => {
    const matchesPrice = !price || (price === "duoi1" ? product.priceValue < 1000000 : price === "tren4" ? product.priceValue > 4000000 : product.priceValue >= Number(price.split("-")[0]) * 1000000 && product.priceValue <= Number(price.split("-")[1]) * 1000000);
    return (!currentCatalog || String(product.catalog).toLowerCase() === String(currentCatalog).toLowerCase()) && (!search || `${product.name} ${product.catalog}`.toLowerCase().includes(search)) && matchesPrice && (!color || product.color.toLowerCase() === color) && (!material || product.material.toLowerCase() === material) && (!style || product.style.toLowerCase() === style) && (!gender || product.gender.toLowerCase() === gender);
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
  const category = new URLSearchParams(window.location.search).get("category");
  renderProducts(category ? localproducts.filter((product) => String(product.catalog).toLowerCase() === category.toLowerCase()) : localproducts, 1);
});