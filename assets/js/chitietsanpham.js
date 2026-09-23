// Cần truy cập mảng products từ products-shoes.js
// products đã được định nghĩa là biến toàn cục trong products.js
// nên không cần import nếu 2 script được tải theo thứ tự
// (products-shoes.js tải trước chitietsanpham.js trong index.html)

/**
 * Hiển thị chi tiết sản phẩm và ẩn danh sách sản phẩm.
 * @param {string} productId ID của sản phẩm cần hiển thị
 */
let CTSP_products = getLocalProducts();
window.addEventListener("productsUpdated", () => {
  CTSP_products = getLocalProducts();
});
function showProductDetail(productId) {
  const product = CTSP_products.find((p) => p.id === productId);
  const detailContainer = document.getElementById("product-detail");
  const listContainer = document.getElementById("product-list-wrapper");
  const bannerContainer = document.querySelector(".banner");
  const GioHang = document.getElementById("GioHang");
  const Index = document.querySelector("#chitietsanpham-banner-index");

}

/**
 * Quay lại giao diện danh sách sản phẩm và ẩn chi tiết sản phẩm.
 */
function showProductList() {
  const detailContainer = document.getElementById("product-detail");
  const listContainer = document.getElementById("product-list-wrapper");
  const bannerContainer = document.querySelector(".banner");

  // Ẩn/Hiện các khu vực
  detailContainer.style.display = "none";
  if (listContainer) listContainer.style.display = "block"; // Hiển thị lại danh sách
  if (bannerContainer) bannerContainer.style.display = "block"; // Hiển thị lại banner

  // Cuộn lên đầu trang
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Khởi tạo (Nếu có ID trên URL, vẫn hiển thị chi tiết cho việc chia sẻ link)
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (productId) {
    showProductDetail(productId);
  } else {
    // Đảm bảo chi tiết bị ẩn và danh sách được hiện khi không có ID
    const detailContainer = document.getElementById("product-detail");
    const listContainer = document.getElementById("product-list-wrapper");
    if (detailContainer) detailContainer.style.display = "none";
    if (listContainer) listContainer.style.display = "block";
  }
});

window.addEventListener("storage", (event) => {
  if (event.key === "productsLocal") {
    window.dispatchEvent(new Event("productsUpdated"));
  }
});