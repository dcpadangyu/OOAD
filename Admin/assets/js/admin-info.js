// Profile quản trị viên + quyền kiểm soát
var AdminInfo = (function () {
  var MODULE_LABELS = [
    "Quản lý sản phẩm",
    "Quản lý phiếu nhập",
    "Quản lý tồn kho",
    "Quản lý đơn hàng",
    "Quản lý khách hàng",
    "Quản lý loại sản phẩm",
    "Quản lý giá bán",
    "Báo cáo doanh thu",
    "Quản lý nhân viên"
  ];

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("vi-VN");
  }

  function openProfile() {
    if (typeof adminSession === "undefined" || !adminSession.isAdmin()) return;
    var info = adminSession.getCurrentAdmin();
    if (!info) return;

    var quyenHtml = MODULE_LABELS.map(function (m) {
      return '<span class="ADM_perm">' + escapeHtml(m) + "</span>";
    }).join("");

    document.getElementById("ADM_profileBody").innerHTML = [
      ["Vai trò", '<span class="NSV_badge NSV_badge-active">Quản trị viên</span>'],
      ["Họ và tên", escapeHtml(info.fullName || info.username || "—")],
      ["Tên đăng nhập", escapeHtml(info.username || "—")],
      ["Thời gian đăng nhập", escapeHtml(formatDate(info.loginTime))]
    ]
      .map(function (row) {
        return '<div class="NSV_infoRow"><span class="NSV_infoLabel">' + row[0] + '</span><span class="NSV_infoValue">' + row[1] + "</span></div>";
      })
      .join("") +
      '<div class="NSV_infoRow"><span class="NSV_infoLabel">Quyền kiểm soát</span><span class="NSV_infoValue"><span class="ADM_permBadge">Toàn bộ hệ thống</span></span></div>' +
      '<div class="ADM_perms"><span class="ADM_permTitle">Các phân hệ được quyền kiểm soát:</span>' + quyenHtml + "</div>";

    document.getElementById("ADM_profileModal").style.display = "flex";
  }

  function closeProfile() {
    var m = document.getElementById("ADM_profileModal");
    if (m) m.style.display = "none";
  }

  function applyVisibility() {
    var btn = document.getElementById("btnAdminInfo");
    if (!btn) return;
    var isAdmin = typeof adminSession !== "undefined" && adminSession.isAdmin();
    btn.style.display = isAdmin ? "inline-flex" : "none";
  }

  document.addEventListener("DOMContentLoaded", applyVisibility);

  return { openProfile: openProfile, closeProfile: closeProfile };
})();