const fs = require("fs");
const files = {
  "Admin/TrangChu_Admin.html": ["reviews", "danhgia", "DanhGia", "page-reviews", "/reviews", "QuanLyDanhGia"],
  "Admin/assets/js/admin-spa-nav.js": ["reviews", "/reviews", "page-reviews"],
  "assets/js/user/product/products.js": ["review", "Review", "rv-", "ProductReviews", "product/reviews"],
  "assets/css/user/products.css": ["rv-", "review", "Review"],
  "pages/home.html": ["reviews", "reviews.js", "ReviewDB"],
  "Admin/assets/js/nhanvien-info.js": ["reviews", "/reviews"],
};
for (const [f, needles] of Object.entries(files)) {
  console.log("===== " + f + " =====");
  let t;
  try { t = fs.readFileSync(f, "utf8"); } catch (e) { console.log("  (khong doc duoc: " + e.code + ")"); continue; }
  const lines = t.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (needles.some((n) => lines[i].toLowerCase().includes(n.toLowerCase()))) {
      console.log((i + 1) + ": " + lines[i].replace(/\s+/g, " ").slice(0, 150));
    }
  }
}
