// Shared storage adapters for User pages.
window.getDanhSachDatHang = function () {
  try {
    const value = JSON.parse(localStorage.getItem("DanhSachDatHang") || "[]");
    return Array.isArray(value) ? value : [];
  } catch (_) { return []; }
};
window.getlogin = function () {
  return window.UserSession?.getCurrentUser?.() || null;
};
window.getCurrDanhsach = function () {
  try {
    const value = JSON.parse(localStorage.getItem("CurrDanhSachDatHang") || "[]");
    return Array.isArray(value) ? value : [];
  } catch (_) { return []; }
};
