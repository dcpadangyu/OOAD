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

  function mount() {
    inject("header", "[data-user-component=\\"header\\"]");
    inject("footer", "[data-user-component=\\"footer\\"]");
    document.dispatchEvent(new CustomEvent("user-shell-ready"));
  }

  mount();
  window.mountUserShell = mount;
})();
`;

fs.writeFileSync(path.join(root, 'assets', 'js', 'user', 'core', 'site-shell.js'), output);
console.log('Generated assets/js/user/core/site-shell.js');
