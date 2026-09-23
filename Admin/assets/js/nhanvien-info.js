var NhanVienInfo = (function () {
  const ROLE_LABELS = {
      "/products": "Quản lý sản phẩm",
      "/import": "Quản lý phiếu nhập",
      "/inventory": "Quản lý tồn kho",
      "/orders": "Quản lý đơn hàng",
      "/reviews": "Phản hồi đánh giá"
    };

  function openProfile() {
    if (typeof adminSession === "undefined" || !adminSession.isNhanVien()) return;
    const emp = employeeSession.getCurrentEmployee();
    const full = emp ? findNhanVienByUsername(emp.username) : null;
    const d = full || emp || {};
    const trangThai = (full && full.trangThai === "khoa") ? "Đã khóa" : "Hoạt động";
    const isKhoa = (full && full.trangThai === "khoa");
    const routes = (window.adminSpa && adminSpa.getStaffRoutes()) || [];
    const quyen = routes
      .filter(function (r) { return r !== "/" && ROLE_LABELS[r]; })
      .map(function (r) { return ROLE_LABELS[r]; })
      .join(" · ") || "Không có phân quyền";
    document.getElementById("NSV_profileBody").innerHTML = [
      ["Mã nhân viên", d.maNhanVien || "—"],
      ["Họ và tên", d.tenNhanVien || emp.fullName || "—"],
      ["Giới tính", d.gioiTinh || "—"],
      ["Số điện thoại", d.sdt || "—"],
      ["Địa chỉ", d.diaChi || "—"],
      ["Chức vụ", d.chucVu || emp.chucVu || "—"],
      ["Tên đăng nhập", d.username || emp.username || "—"],
      ["Ngày tạo", d.ngayTao || "—"],
      ["Trạng thái", '<span class="NSV_badge ' + (isKhoa ? "NSV_badge-khoa" : "NSV_badge-active") + '">' + trangThai + "</span>"],
      ["Phân quyền", quyen]
    ]
      .map(function (row) {
        return '<div class="NSV_infoRow"><span class="NSV_infoLabel">' + row[0] + '</span><span class="NSV_infoValue">' + row[1] + "</span></div>";
      })
      .join("");
    document.getElementById("NSV_profileModal").style.display = "flex";
  }

  function closeProfile() {
    const m = document.getElementById("NSV_profileModal");
    if (m) m.style.display = "none";
  }

  function applyVisibility() {
    const btn = document.getElementById("btnNhanVienInfo");
    if (!btn) return;
    var isNV = typeof adminSession !== "undefined" && adminSession.isNhanVien();
    btn.style.display = isNV ? "inline-flex" : "none";
  }

  document.addEventListener("DOMContentLoaded", applyVisibility);

  return { openProfile: openProfile, closeProfile: closeProfile };
})();