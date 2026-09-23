// Ẩn hiện các trang SPA trong trang quản trị và xử lý điều hướng giữa chúng
(function() {
    const routeToId = {
        '/': 'page-dashboard',
        '/customers': 'page-customers',
        '/categories': 'page-categories',
        '/products': 'page-products',
        '/import': 'page-import',
        '/inventory': 'page-inventory',
        '/prices': 'page-prices',
        '/orders': 'page-orders',
        '/reviews': 'page-reviews',
        '/reports': 'page-reports',
        '/employees': 'page-employees',
        '/order-detail': 'page-order-detail',
        '/orders-list': 'page-orders-list',
        '/customers-list': 'page-customers-list'
    };

    const ROLE_ROUTES = {
        'Nhân viên bán hàng': ['/', '/products', '/orders'],
        'Nhân viên kho': ['/', '/products', '/import', '/inventory'],
        'Nhân viên CSKH': ['/', '/orders', '/reviews'],
        'Nhân viên kiểm kho': ['/', '/products', '/inventory']
    };

    const ROLE_HOME = {
        'Nhân viên bán hàng': '/',
        'Nhân viên kho': '/',
        'Nhân viên CSKH': '/',
        'Nhân viên kiểm kho': '/'
    };

    function isStaff() {
        if (typeof adminSession === 'undefined') return false;
        const admin = adminSession.getCurrentAdmin();
        return !!admin && admin.isNhanVien === true;
    }

    function getStaffRoutes() {
        if (!isStaff()) return Object.keys(routeToId);
        const role = adminSession.getCurrentRole();
        return ROLE_ROUTES[role] || ['/'];
    }

    function getStaffHome() {
        if (!isStaff()) return '/';
        const role = adminSession.getCurrentRole();
        return ROLE_HOME[role] || '/';
    }

    function applyRoleFilter() {
        if (!isStaff()) return;
        const allowed = {};
        getStaffRoutes().forEach(r => { allowed[r] = true; });
        document.querySelectorAll('a[data-route]').forEach(a => {
            const route = a.getAttribute('data-route');
            if (a.getAttribute('data-role') === 'admin' || !allowed[route]) {
                a.style.display = 'none';
            }
        });
        document.querySelectorAll('.nav-section').forEach(section => {
            const links = section.querySelectorAll('a.nav-link');
            if (!links.length) return;
            let anyVisible = false;
            links.forEach(l => { if (l.style.display !== 'none') anyVisible = true; });
            if (!anyVisible) section.style.display = 'none';
        });
    }

    function hideAllPages() {
        document.querySelectorAll('.spa-page').forEach(p => p.classList.remove('active'));
    }

    function setActiveMenu(route) {
        document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('active'));
        const link = document.querySelector(`a[data-route="${route}"]`);
        if (link) {
            const li = link.closest('.menu-item');
            if (li) li.classList.add('active');
        }
    }

    function showRoute(route) {
        if (isStaff() && getStaffRoutes().indexOf(route) === -1) {
            route = '/';
        }
        const id = routeToId[route] || routeToId['/'];
        hideAllPages();
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
        setActiveMenu(route);
        // Cập nhật hash cho việc đánh dấu/bắt lại trang hiện tại
        if (location.hash !== route) {
            location.hash = route;
        }
        // Nếu trang tổng quan được hiển thị, làm mới các chỉ số của nó (nếu có)
        if ((route === '/' || route === '') && window.AdminDashboard && typeof window.AdminDashboard.updateMetrics === 'function') {
            try { window.AdminDashboard.updateMetrics(); } catch (e) { console.warn('updateMetrics failed', e); }
        }
    }

    function handleLinkClick(e) {
        const a = e.target.closest('a[data-route]');
        if (!a) return;
        e.preventDefault();
        const route = a.getAttribute('data-route');
        showRoute(route);
    }

    document.addEventListener('click', handleLinkClick);

    window.addEventListener('hashchange', function() {
        const route = location.hash ? location.hash.slice(1) : '/';
        showRoute(route);
    });

    document.addEventListener('DOMContentLoaded', function() {
        applyRoleFilter();
        const fromHash = location.hash ? location.hash.slice(1) : null;
        const params = new URLSearchParams(location.search);
        const fromQuery = params.get('page');

        const initial = fromHash || (fromQuery ? fromQuery : (isStaff() ? getStaffHome() : '/'));
        showRoute(initial);
    });

    window.adminSpa = {
        showRoute,
        routeToId,
        isStaff,
        getStaffRoutes,
        getStaffHome
    };
})();