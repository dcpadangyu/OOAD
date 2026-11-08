const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const header = fs.readFileSync(path.join(root, 'components', 'header.html'), 'utf8').trim() + '\n';
const footer = fs.readFileSync(path.join(root, 'components', 'footer.html'), 'utf8').trim() + '\n';

const output = `// GENERATED FILE — source of truth: components/header.html + components/footer.html
// Run: node tools/build-user-shell.js
// Do not edit generated markup here; update component HTML and regenerate.
(function () {
  "use strict";

  const COMPONENTS = Object.freeze({
    header: ${JSON.stringify(header)},
    footer: ${JSON.stringify(footer)}
  });

  function inject(name, selector) {
    const targets = document.querySelectorAll(selector);
    if (!targets.length) return;
    targets.forEach((target) => {
      target.innerHTML = COMPONENTS[name];
      target.classList.add(\`user-component-\${name}\`);
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch];
    });
  }

  // Menu / footer / dai thuong hieu duoc dong bo tu danh muc Admin (key "categories") neu da co.
  function applyCategories() {
    var list = null;
    try { list = JSON.parse(localStorage.getItem('categories') || 'null'); } catch (error) { list = null; }
    if (!Array.isArray(list) || !list.length) return;
    var names = list.filter(function (c) { return c && c.tenLoai && c.trangThai === 'active'; }).map(function (c) { return String(c.tenLoai); });
    var lower = names.map(function (n) { return n.toLowerCase(); });

    document.querySelectorAll('.category-nav').forEach(function (nav) {
      nav.innerHTML = names.map(function (n) {
        return '<a href="pages/home.html?category=' + encodeURIComponent(n) + '#sanpham" data-catalog="' + escapeHtml(n) + '">' + escapeHtml(n) + '</a>';
      }).join('');
    });
    document.querySelectorAll('#catalog-list').forEach(function (ul) {
      ul.innerHTML = names.map(function (n) {
        return '<li data-catalog="' + escapeHtml(n) + '"><a href="pages/home.html?category=' + encodeURIComponent(n) + '#sanpham">' + escapeHtml(n) + '</a></li>';
      }).join('');
    });
    document.querySelectorAll('.brand-strip-list').forEach(function (strip) {
      var present = [];
      strip.querySelectorAll('.brand-link').forEach(function (link) {
        var key = String(link.dataset.catalog || '').toLowerCase();
        if (lower.indexOf(key) === -1) link.remove(); else present.push(key);
      });
      names.forEach(function (n) {
        if (present.indexOf(n.toLowerCase()) !== -1) return;
        var a = document.createElement('a');
        a.className = 'brand-link';
        a.href = 'pages/home.html#sanpham';
        a.dataset.catalog = n;
        a.innerHTML = '<span>' + escapeHtml(n) + '</span>';
        strip.appendChild(a);
      });
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
    inject("header", "[data-user-component=\\"header\\"]");
    inject("footer", "[data-user-component=\\"footer\\"]");
    applyCategories();
    document.dispatchEvent(new CustomEvent("user-shell-ready"));
  }

  mount();
  window.mountUserShell = mount;
})();
`;

fs.writeFileSync(path.join(root, 'assets', 'js', 'user', 'core', 'site-shell.js'), output);
console.log('Generated assets/js/user/core/site-shell.js');
