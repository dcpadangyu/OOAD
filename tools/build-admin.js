// Sinh Admin/assets/js/admin-shell.js từ Admin/components/*.html và Admin/sections/*.html
// Chạy:  node tools/build-admin.js
//
// Admin/TrangChu_Admin.html chỉ còn khung ngắn với các chỗ giữ chỗ:
//   <div data-admin-component="header|sidebar|sections|modals"></div>
// admin-shell.js (file sinh ra) thay mỗi chỗ giữ chỗ bằng nội dung tương ứng ngay khi tải trang,
// trước các script khác, nên DOM kết quả giống hệt khi viết trực tiếp trong HTML.
// Sửa giao diện: sửa file HTML trong Admin/components hoặc Admin/sections rồi chạy lại lệnh trên.
const fs = require("fs");
const path = require("path");

const adminDir = path.resolve(__dirname, "..", "Admin");
const read = (rel) => fs.readFileSync(path.join(adminDir, rel), "utf8").replace(/\s+$/, "") + "\n";

// Thứ tự các mục trong vùng nội dung (mỗi mục là 1 file trong Admin/sections/)
const SECTIONS = [
  "dashboard", "customers", "categories", "products", "import", "inventory",
  "prices", "orders", "reviews", "support", "reports", "employees",
  "order-detail", "orders-list", "customers-list",
];
// Các khối khung (mỗi khối là 1 file trong Admin/components/)
const COMPONENTS = ["header", "sidebar", "modals"];

const sectionsDir = path.join(adminDir, "sections");
fs.readdirSync(sectionsDir)
  .filter((f) => f.endsWith(".html") && !SECTIONS.includes(f.replace(/\.html$/, "")))
  .forEach((f) => console.warn("Cảnh báo: sections/" + f + " chưa nằm trong danh sách SECTIONS của tools/build-admin.js"));

const map = {};
COMPONENTS.forEach((name) => { map[name] = read("components/" + name + ".html"); });
map.sections = SECTIONS.map((name) => read("sections/" + name + ".html")).join("\n");

const output = `// GENERATED FILE — nguồn: Admin/components/*.html + Admin/sections/*.html
// Chạy: node tools/build-admin.js
// Không sửa phần HTML ở đây; sửa file nguồn rồi sinh lại.
(function () {
  "use strict";

  const COMPONENTS = Object.freeze(${JSON.stringify(map, null, 2)});

  // Thay mỗi <div data-admin-component="..."> bằng nội dung của nó (không thêm thẻ bao quanh).
  function mount() {
    document.querySelectorAll("[data-admin-component]").forEach(function (placeholder) {
      const html = COMPONENTS[placeholder.getAttribute("data-admin-component")];
      if (html === undefined) return;
      placeholder.insertAdjacentHTML("beforebegin", html);
      placeholder.remove();
    });
    document.dispatchEvent(new CustomEvent("admin-shell-ready"));
  }

  mount();
  window.mountAdminShell = mount;
})();
`;

const out = path.join(adminDir, "assets", "js", "admin-shell.js");
fs.writeFileSync(out, output);
console.log("Đã sinh Admin/assets/js/admin-shell.js (" + COMPONENTS.length + " khối khung + " + SECTIONS.length + " mục)");
