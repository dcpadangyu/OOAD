// Admin Dashboard JavaScript
document.addEventListener("DOMContentLoaded", function() {
    // Khởi tạo dashboard
    initializeDashboard();

    // Cập nhật thông tin admin
    updateAdminInfo();

    // Khởi tạo các sự kiện
    initializeEvents();
});

// Khởi tạo dashboard
function initializeDashboard() {
    console.log("Admin Dashboard initialized");

    // Kiểm tra session
    if (typeof adminSession !== "undefined" && adminSession.isLoggedIn()) {
        console.log("Admin is logged in");
    } else {
        console.log("Admin not logged in");
    }
}

// Compute and render dashboard metrics (customers, products, orders, revenue)
function updateDashboardMetrics() {
    try {
        // Customers
        let customersCount = 0;
        if (typeof getCustomersFromStorage === 'function') {
            customersCount = getCustomersFromStorage().length;
        } else if (localStorage.getItem('userList')) {
            customersCount = JSON.parse(localStorage.getItem('userList')).length || 0;
        }

        // Products
        let productsCount = 0;
        if (typeof getLocalProducts === 'function') {
            productsCount = getLocalProducts().length;
        } else if (typeof products !== 'undefined' && Array.isArray(products)) {
            productsCount = products.length;
        } else if (localStorage.getItem('productsLocal')) {
            productsCount = JSON.parse(localStorage.getItem('productsLocal')).length || 0;
        }

        // Orders
        let ordersCount = 0;
        if (typeof getLocalOrders === 'function') {
            ordersCount = getLocalOrders().length;
        } else if (localStorage.getItem('ordersLocal')) {
            ordersCount = JSON.parse(localStorage.getItem('ordersLocal')).length || 0;
        }

        // Revenue: prefer actual sales orders (ordersLocal / getLocalOrders) first.
        // Fallback to phieuNhapHang receipts (dsPhieuNhapHang) only if no orders found.
        let revenue = 0;

        // helper to safely parse numeric values (strip currency symbols/commas)
        const toNumber = (v) => {
            if (v == null) return 0;
            if (typeof v === 'number') return v;
            const cleaned = String(v).replace(/[^0-9.-]+/g, '');
            const n = Number(cleaned);
            return isFinite(n) ? n : 0;
        };

        // Try orders from API/helper or localStorage first
        let orders = [];
        if (typeof getLocalOrders === 'function') {
            try { orders = getLocalOrders() || []; } catch (e) { orders = []; }
        }
        if ((!orders || orders.length === 0) && localStorage.getItem('ordersLocal')) {
            try { orders = JSON.parse(localStorage.getItem('ordersLocal')) || []; } catch (e) { orders = []; }
        }

        if (orders && orders.length) {
            revenue = orders.reduce((s, o) => s + toNumber(o.total), 0);
        } else if (typeof dsPhieuNhapHang !== 'undefined' && Array.isArray(dsPhieuNhapHang)) {
            // fallback: sum purchase receipts (tongTien)
            revenue = dsPhieuNhapHang.reduce((s, r) => s + toNumber(r.tongTien), 0);
        }

        // Update DOM (if elements exist)
        const cEl = document.getElementById('dashboardCustomersCount');
        if (cEl) cEl.textContent = formatNumber(customersCount);

        const pEl = document.getElementById('dashboardProductsCount');
        if (pEl) pEl.textContent = formatNumber(productsCount);

        const oEl = document.getElementById('dashboardOrdersCount');
        if (oEl) oEl.textContent = formatNumber(ordersCount);

        const rEl = document.getElementById('dashboardRevenueAmount');
        if (rEl) rEl.textContent = formatCurrency(revenue);

        return { customersCount, productsCount, ordersCount, revenue };
    } catch (err) {
        console.error('updateDashboardMetrics error', err);
        return null;
    }
}

// Cập nhật thông tin admin
function updateAdminInfo() {
    if (typeof adminSession !== "undefined" && adminSession.isLoggedIn()) {
        const adminInfo = adminSession.getCurrentAdmin();
        if (adminInfo && adminInfo.username) {
            const adminNameElement = document.getElementById("adminName");
            if (adminNameElement) {
                adminNameElement.textContent = adminInfo.fullName || adminInfo.username;
            }
        }
    }
}

// Khởi tạo các sự kiện
function initializeEvents() {
    // Sự kiện cho sidebar
    initializeSidebar();

    // Sự kiện cho responsive
    initializeResponsive();

    // Sự kiện cho stats cards
    initializeStatsCards();
}

// Khởi tạo sidebar
function initializeSidebar() {
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach((link) => {
        link.addEventListener("click", function(e) {
            // Xóa active class từ tất cả nav items
            document.querySelectorAll(".menu-item").forEach((item) => {
                item.classList.remove("active");
            });

            // Thêm active class cho nav item hiện tại
            const menuItem = this.closest(".menu-item");
            if (menuItem) menuItem.classList.add("active");
        });
    });
}

// Khởi tạo responsive
function initializeResponsive() {
    // Toggle sidebar trên mobile
    const sidebarToggle = document.createElement("button");
    sidebarToggle.className = "sidebar-toggle";
    // Use Font Awesome bars icon for the sidebar toggle
    sidebarToggle.innerHTML = `<i class="fa-solid fa-bars" aria-hidden="true"></i>`;

    // Thêm CSS cho toggle button
    const style = document.createElement("style");
    style.textContent = `
        .sidebar-toggle {
            display: none;
            position: fixed;
            top: 15px;
            left: 15px;
            z-index: 1001;
            background: rgba(255, 255, 255, 0.9);
            border: none;
            border-radius: 6px;
            padding: 8px;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        @media (max-width: 768px) {
            .sidebar-toggle {
                display: block;
            }
        }
    `;

    // Make sure the FA icon sits nicely inside the button
    const faStyle = document.createElement('style');
    faStyle.textContent = `.sidebar-toggle i { font-size: 18px; color: #333; }`;
    document.head.appendChild(faStyle);

    document.head.appendChild(style);
    document.body.appendChild(sidebarToggle);

    sidebarToggle.addEventListener("click", function() {
        const sidebar = document.querySelector(".admin-sidebar");
        sidebar.classList.toggle("open");
    });

    // Đóng sidebar khi click bên ngoài
    document.addEventListener("click", function(e) {
        const sidebar = document.querySelector(".admin-sidebar");
        const toggle = document.querySelector(".sidebar-toggle");

        if (
            window.innerWidth <= 768 &&
            !sidebar.contains(e.target) &&
            !toggle.contains(e.target)
        ) {
            sidebar.classList.remove("open");
        }
    });
}

// Khởi tạo stats cards
function initializeStatsCards() {
    const statCards = document.querySelectorAll(".stat-card");

    statCards.forEach((card) => {
        card.addEventListener("mouseenter", function() {
            this.style.transform = "translateY(-4px)";
        });

        card.addEventListener("mouseleave", function() {
            this.style.transform = "translateY(0)";
        });
    });
}

// Hàm utility để format số
function formatNumber(num) {
    return new Intl.NumberFormat("vi-VN").format(num);
}

// Hàm utility để format tiền tệ
function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
}

// Hàm utility để format ngày
function formatDate(date) {
    return new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(new Date(date));
}

// Hàm hiển thị thông báo
function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `admin-notification admin-notification-${type}`;

    // choose Font Awesome icon html for each type
    const iconHtml =
        type === "success" ?
        '<i class="fa-solid fa-circle-check" aria-hidden="true"></i>' :
        type === "error" ?
        '<i class="fa-solid fa-circle-xmark" aria-hidden="true"></i>' :
        type === "warning" ?
        '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>' :
        '<i class="fa-solid fa-circle-info" aria-hidden="true"></i>';

    notification.innerHTML = `
            <div class="admin-notification-content">
            <div class="admin-notification-icon">${iconHtml}</div>
            <div class="admin-notification-message">${message}</div>
            <button class="admin-notification-close" aria-label="Đóng">
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
            </div>
    `; // Thêm CSS cho notification
    const style = document.createElement("style");
    style.textContent = `
        .admin-notification {
            position: fixed;
            top: 80px;
            right: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
        }
        
        .admin-notification-content {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 20px;
        }
        
        .admin-notification-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
        }
        
        .admin-notification-success .admin-notification-icon {
            background: #d4edda;
            color: #155724;
        }
        
        .admin-notification-error .admin-notification-icon {
            background: #f8d7da;
            color: #721c24;
        }
        
        .admin-notification-warning .admin-notification-icon {
            background: #fff3cd;
            color: #856404;
        }
        
        .admin-notification-info .admin-notification-icon {
            background: #d1ecf1;
            color: #0c5460;
        }
        
        .admin-notification-message {
            flex: 1;
            font-size: 14px;
            color: #333;
            padding-right: 24px;
        }

        .admin-notification-close {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            padding: 4px;
            cursor: pointer;
            color: #666;
            opacity: 0.7;
            border-radius: 4px;
            transition: all 0.2s ease;
        }

        .admin-notification-close:hover {
            opacity: 1;
            background: rgba(0,0,0,0.05);
        }
        
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
    `;

    if (!document.querySelector("style[data-notification]")) {
        style.setAttribute("data-notification", "true");
        document.head.appendChild(style);
    }

    // Remove any existing notifications
    const existingNotification = document.querySelector(".admin-notification");
    if (existingNotification) {
        existingNotification.remove();
    }

    document.body.appendChild(notification);

    // Add close button handler
    const closeBtn = notification.querySelector(".admin-notification-close");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            notification.style.animation = "slideOutRight 0.3s ease";
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }
}

// Hàm loading
function showLoading(element) {
    if (typeof element === "string") {
        element = document.querySelector(element);
    }

    if (element) {
        element.style.position = "relative";
        element.style.pointerEvents = "none";

        const loader = document.createElement("div");
        loader.className = "loading-overlay";
        loader.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <div class="loading-text">Đang tải...</div>
            </div>
        `;

        // Thêm CSS cho loading
        const style = document.createElement("style");
        style.textContent = `
            .loading-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            
            .loading-spinner {
                text-align: center;
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 10px;
            }
            
            .loading-text {
                color: #666;
                font-size: 14px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;

        if (!document.querySelector("style[data-loading]")) {
            style.setAttribute("data-loading", "true");
            document.head.appendChild(style);
        }

        element.appendChild(loader);
    }
}

function hideLoading(element) {
    if (typeof element === "string") {
        element = document.querySelector(element);
    }

    if (element) {
        const loader = element.querySelector(".loading-overlay");
        if (loader) {
            loader.remove();
        }
        element.style.pointerEvents = "auto";
    }
}

// Export functions để sử dụng trong các file khác
window.AdminDashboard = {
    showNotification,
    showLoading,
    hideLoading,
    formatNumber,
    formatCurrency,
    formatDate,
    updateMetrics: updateDashboardMetrics
};