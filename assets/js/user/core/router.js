// Router JavaScript - Điều hướng giữa các sections không reload trang
(function() {
  'use strict';

  // Map routes với sections
  const routes = {
    'home': '#chitietsanpham-banner-index',
    'login': '#section-login',
    'register': '#section-register',
    'hoso': '#section-hoso',
    'diachi': '#section-diachi',
    'thongtincanhan': '#section-thongtincanhan',
    'doimatkhau': '#section-doimatkhau'
  };

  // Các sections chính cần ẩn khi hiển thị sections khác
  const mainSections = [
    '#chitietsanpham-banner-index',
    '#Code-Quest-3-4',
    '#LichSuMuaHang',
    '#ThanhToan_ThatBai',
    '#ThanhToan_ThanhCong',
    '#ThanhToan_CuaHang',
    '#ThanhToan_ChuyenKhoan',
    '#ThanhToan_TienMat',  
    '#GioHang',
    '#ThanhToan'
  ];

  // Sections được hiển thị khi ở trang chủ
  const homeSections = [
    '#chitietsanpham-banner-index',
    '#Code-Quest-3-4'
  ];

  // Hàm ẩn tất cả sections
  function hideAllSections() {
    // Ẩn tất cả page-sections
    document.querySelectorAll('.page-section').forEach(section => {
      section.style.display = 'none';
      // Pause video trong sections bị ẩn
      const videos = section.querySelectorAll('video');
      videos.forEach(video => {
        video.pause();
      });
    });

    // Ẩn các sections chính
    mainSections.forEach(selector => {
      const section = document.querySelector(selector);
      if (section) {
        section.style.display = 'none';
        // Pause video trong sections bị ẩn
        const videos = section.querySelectorAll('video');
        videos.forEach(video => {
          video.pause();
        });
      }
    });
  }

  // Hàm hiển thị section theo route
  function showSection(route) {
    hideAllSections();
    
    const footer = document.querySelector('footer');
    const profileRoutes = ['hoso', 'diachi', 'thongtincanhan', 'doimatkhau', 'login', 'register'];

    if (route === 'home') {
      // Hiển thị trang chủ - hiển thị cả banner và các sections chính
      const homeSection = document.querySelector('#chitietsanpham-banner-index');
      const codeQuestSection = document.querySelector('#Code-Quest-3-4');
      if (homeSection) {
        homeSection.style.display = 'block';
        // Play lại video banner khi hiển thị trang chủ
        setTimeout(() => {
          const bannerVideo = homeSection.querySelector('.banner-video');
          if (bannerVideo) {
            bannerVideo.currentTime = 0; // Reset về đầu
            bannerVideo.play().catch(e => console.log('Video autoplay prevented:', e));
          }
        }, 100);
      }
      if (codeQuestSection) {
        codeQuestSection.style.display = 'block';
      }
      // Hiển thị footer ở trang chủ
      if (footer) footer.style.setProperty('display', 'block', 'important');
    } else {
      const sectionSelector = routes[route];
      if (sectionSelector) {
        const section = document.querySelector(sectionSelector);
        if (section) {
          section.style.display = 'block';
          // Scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      // Ẩn footer ở các sections profile và auth
      if (footer && profileRoutes.includes(route)) {
        footer.style.setProperty('display', 'none', 'important');
      } else if (footer) {
        footer.style.setProperty('display', 'block', 'important');
      }
    }
  }

  // Hàm xử lý navigation
  function navigate(route) {
    if (!route) return;
    
    // Update URL hash (optional, để có thể bookmark)
    window.location.hash = route;
    
    // Show section
    showSection(route);
  }

  // Xử lý click trên các link có data-route
  document.addEventListener('DOMContentLoaded', function() {
    // Lắng nghe click trên tất cả link có data-route
    document.addEventListener('click', function(e) {
      const link = e.target.closest('[data-route]');
      // Chỉ xử lý nếu là link (<a> tag) hoặc element có data-route
      if (link && (link.tagName === 'A' || link.hasAttribute('data-route'))) {
        e.preventDefault();
        const route = link.getAttribute('data-route');
        if (route) {
          navigate(route);
        }
        // Không stopPropagation để các handler khác có thể đóng dropdown
      }
    }, true); // Use capture phase để xử lý trước

    // Đảm bảo header và footer luôn hiển thị
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    if (header) {
      header.style.display = 'block';
      header.style.position = 'fixed';
      header.style.top = '0';
      header.style.left = '0';
      header.style.width = '100%';
      header.style.zIndex = '9999';
    }
    if (footer) {
      footer.style.setProperty('display', 'block', 'important');
      footer.style.position = 'relative';
      footer.style.width = '100%';
    }

    // Đảm bảo video banner tự động play khi load trang chủ
    const bannerVideo = document.querySelector('.banner-video');
    if (bannerVideo && !window.location.hash) {
      setTimeout(() => {
        bannerVideo.play().catch(e => console.log('Video autoplay prevented:', e));
      }, 300);
    }

    // Xử lý hash URL khi load trang
    if (window.location.hash) {
      const route = window.location.hash.substring(1);
      if (routes[route] || route === 'home') {
        navigate(route);
      } else {
        // Route không hợp lệ, về trang chủ
        showSection('home');
      }
    } else {
      // Mặc định hiển thị trang chủ
      showSection('home');
    }

    // Lắng nghe sự kiện hashchange
    window.addEventListener('hashchange', function() {
      const route = window.location.hash.substring(1);
      navigate(route);
    });
  });

  // Export navigate function để có thể gọi từ các file JS khác
  window.navigateTo = navigate;
  window.showSection = showSection;
})();

