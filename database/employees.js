const CHUC_VU_NHAN_VIEN = [
  "Nhân viên bán hàng",
  "Nhân viên kho",
  "Nhân viên CSKH",
  "Nhân viên kiểm kho"
];

const DEFAULT_EMPLOYEES = [
  {
    maNhanVien: "NV001",
    tenNhanVien: "Nguyễn Văn An",
    gioiTinh: "Nam",
    soDienThoai: "0901234567",
    diaChi: "12 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    chucVu: "Nhân viên bán hàng",
    tenDangNhap: "nhanvien01",
    matKhau: "123456",
    ngayTao: new Date().toISOString().split("T")[0],
    trangThai: "hoatdong"
  },
  {
    maNhanVien: "NV002",
    tenNhanVien: "Trần Thị Bình",
    gioiTinh: "Nữ",
    soDienThoai: "0912345678",
    diaChi: "5 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội",
    chucVu: "Nhân viên kho",
    tenDangNhap: "nhanvien02",
    matKhau: "123456",
    ngayTao: new Date().toISOString().split("T")[0],
    trangThai: "hoatdong"
  },
  {
    maNhanVien: "NV003",
    tenNhanVien: "Lê Văn Cường",
    gioiTinh: "Nam",
    soDienThoai: "0923456789",
    diaChi: "88 Nguyễn Huệ, Quận 1, TP.HCM",
    chucVu: "Nhân viên CSKH",
    tenDangNhap: "nhanvien03",
    matKhau: "123456",
    ngayTao: new Date().toISOString().split("T")[0],
    trangThai: "hoatdong"
  }
];

function getLocalEmployees() {
  const raw = localStorage.getItem("employeeList");
  if (raw) {
    try {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    } catch (e) {}
  }
  saveLocalEmployees(DEFAULT_EMPLOYEES);
  return DEFAULT_EMPLOYEES.slice();
}

function saveLocalEmployees(list) {
  localStorage.setItem("employeeList", JSON.stringify(list));
  document.dispatchEvent(new CustomEvent("employeesUpdated"));
}

function generateMaNhanVien(list) {
  let max = 0;
  (list || []).forEach((emp) => {
    const match = /^NV(\d+)$/.exec(String(emp.maNhanVien || ""));
    if (match) max = Math.max(max, parseInt(match[1], 10));
  });
  return "NV" + String(max + 1).padStart(3, "0");
}

function findNhanVienByUsername(username) {
  if (!username) return null;
  return (getLocalEmployees() || []).find(
    (emp) => String(emp.tenDangNhap || "").toLowerCase() === String(username).toLowerCase()
  ) || null;
}

window.CHUC_VU_NHAN_VIEN = CHUC_VU_NHAN_VIEN;
window.getLocalEmployees = getLocalEmployees;
window.saveLocalEmployees = saveLocalEmployees;
window.generateMaNhanVien = generateMaNhanVien;
window.findNhanVienByUsername = findNhanVienByUsername;