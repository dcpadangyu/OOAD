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
│       ├── support-chat.js            # Widget chat User + gọi Jitsi audio-only
│       ├── cart/
│       ├── payment/
│       │   ├── voucher.js               # Danh sách voucher, điều kiện và tính giảm giá
│       └── product/
├── tools/
│   └── build-user-shell.js           # Regenerate site-shell.js from components/*.html
└── docs/
```

`Admin/` có thêm module hỗ trợ khách hàng:

```text
Admin/
├── TrangChu_Admin.html                # Route /support và khu vực hỗ trợ
└── assets/
    ├── css/SupportChat.css             # Giao diện chat và modal gọi âm thanh
    └── js/support-chat.js              # Chat Admin/CSKH + Jitsi External API
```

`supportThreads` dùng `localStorage` cho bản demo. User và Admin phải chạy cùng origin để nhận tin nhắn qua sự kiện `storage`. Khi chạy lại `tools/build-user-shell.js`, cần bảo đảm phần nạp module hỗ trợ trong shell User vẫn được giữ lại.
