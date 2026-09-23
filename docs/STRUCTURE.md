# User Structure

```text
DoAnWeb1/
├── index.html                       # Entry point User
├── components/
│   ├── header.html                  # Source of truth Header
│   └── footer.html                  # Source of truth Footer
├── pages/                           # User pages; chỉ chứa placeholder component
├── assets/
│   ├── css/user/
│   │   ├── variables.css            # Design tokens
│   │   ├── base.css                 # Shared base
│   │   ├── common.css               # Existing shared storefront styles, cleaned legacy prefix
│   │   ├── header.css
│   │   ├── footer.css
│   │   └── theme.css                # Final conflict-resolution layer
│   └── js/user/
│       ├── core/
│       │   ├── site-shell.js        # Generated runtime component mount
│       │   ├── account-session.js   # Shared identity/session layer
│       │   ├── site-header.js
│       │   └── storage.js
│       ├── account/
│       ├── cart/
│       ├── payment/
│       └── product/
├── tools/
│   └── build-user-shell.js           # Regenerate site-shell.js from components/*.html
└── docs/
```

`Admin/` không thuộc phạm vi chỉnh sửa và được giữ nguyên.
