// Du lieu san pham giay dung chung cho cua hang va khu vuc admin.
const shoeImagePaths = [
  "Adidas/adidas-samba-og-black-white.jpg", "Adidas/adidas-samba-og-white-black.jpg", "Adidas/adidas-campus-00s-black-white.jpg", "Adidas/adidas-campus-00s-grey.jpg", "Adidas/adidas-gazelle-bold-pink.jpg", "Adidas/adidas-gazelle-indoor-blue.jpg", "Adidas/adidas-forum-low-white-black.jpg", "Adidas/adidas-superstar-black-white.jpg", "Adidas/adidas-ultraboost-light-black.jpg", "Adidas/adidas-duramo-sl-white.jpg",
  "Converse/converse-chuck-70-high-black.jpg", "Converse/converse-chuck-70-high-red.jpg", "Converse/converse-chuck-70-high-white.jpg", "Converse/converse-chuck-70-low-black.jpg", "Converse/converse-chuck-70-low-white.jpg", "Converse/converse-one-star-black.jpg", "Converse/converse-one-star-white.jpg", "Converse/converse-run-star-hike-black.jpg", "Converse/converse-run-star-motion-white.jpg", "Converse/converse-pro-leather-black.jpg",
  "Mlb/mlb-big-ball-chunky-black.jpg", "Mlb/mlb-big-ball-chunky-white.jpg", "Mlb/mlb-big-ball-chunky-beige.jpg", "Mlb/mlb-big-ball-chunky-pink.jpg", "Mlb/mlb-big-ball-chunky-green.jpg", "Mlb/mlb-chunky-classic-los-angeles-black.jpg", "Mlb/mlb-chunky-classic-los-angeles-white.jpg", "Mlb/mlb-chunky-classic-new-york-black.jpg", "Mlb/mlb-playball-origin-new-york-black.jpg", "Mlb/mlb-playball-origin-los-angeles-white.jpg",
  "Nike/nike-air-force-1-black.jpg", "Nike/nike-air-force-1-white.jpg", "Nike/nike-air-jordan-1-low-black.jpg", "Nike/nike-air-jordan-1-low-white.jpg", "Nike/nike-air-jordan-1-mid-black.jpg", "Nike/nike-air-jordan-1-mid-red.jpg", "Nike/nike-air-max-270-black.jpg", "Nike/nike-air-max-90-white.jpg", "Nike/nike-dunk-low-grey.jpg", "Nike/nike-pegasus-41-black.jpg",
  "Vans/vans-authentic-black.jpg", "Vans/vans-authentic-white.jpg", "Vans/vans-authentic-red.jpg", "Vans/vans-era-black-white.jpg", "Vans/vans-era-white-black.jpg", "Vans/vans-knu-skool-black.jpg", "Vans/vans-old-skool-navy.jpg", "Vans/vans-old-skool-red.jpg", "Vans/vans-sk8-hi-black-white.jpg", "Vans/vans-slip-on-checkerboard.jpg",
  // Cac mau bo sung (them tu thu muc anh)
  "Adidas/adidas-adizero-sl-black.jpg", "Adidas/adidas-alphabounce-black.jpg", "Adidas/adidas-forum-low-white-blue.jpg", "Adidas/adidas-gazelle-indoor-green.jpg", "Adidas/adidas-handball-spezial-black.jpg",
  "Adidas/adidas-handball-spezial-brown.jpg", "Adidas/adidas-response-super-black.jpg", "Adidas/adidas-stan-smith-white-green.jpg", "Adidas/adidas-superstar-white-black.jpg", "Adidas/adidas-ultraboost-light-white.jpg",
  "Adidas/adidasnew.jpg", "Converse/converse-chuck-taylor-high-black.jpg", "Converse/converse-chuck-taylor-high-navy.jpg", "Converse/converse-chuck-taylor-high-red.jpg", "Converse/converse-chuck-taylor-high-white.jpg",
  "Converse/converse-chuck-taylor-low-black.jpg", "Converse/converse-chuck-taylor-low-navy.jpg", "Converse/converse-chuck-taylor-low-red.jpg", "Converse/converse-chuck-taylor-low-white.jpg", "Converse/converse-run-star-hike-white.jpg",
  "Converse/converse-run-star-motion-black.jpg", "Mlb/mlb-big-ball-chunky-new-york-red.jpg", "Mlb/mlb-chunky-classic-new-york-white.jpg", "Mlb/mlb-chunky-liner-los-angeles-black.jpg", "Mlb/mlb-chunky-liner-los-angeles-pink.jpg",
  "Mlb/mlb-chunky-liner-los-angeles-white.jpg", "Mlb/mlb-chunky-liner-new-york-beige.jpg", "Mlb/mlb-chunky-liner-new-york-black.jpg", "Mlb/mlb-chunky-liner-new-york-white.jpg", "Mlb/mlb-playball-origin-los-angeles-black.jpg",
  "Mlb/mlb-playball-origin-new-york-white.jpg", "Nike/nike-air-max-270-white.jpg", "Nike/nike-air-max-90-black.jpg", "Nike/nike-blazer-mid-black.jpg", "Nike/nike-blazer-mid-white.jpg",
  "Nike/nike-court-vision-low-black.jpg", "Nike/nike-court-vision-low-white.jpg", "Nike/nike-dunk-low-black.jpg", "Nike/nike-dunk-low-white.jpg", "Nike/nike-initiator-white.jpg",
  "Nike/nike-revolution-7-white.jpg", "Vans/vans-knu-skool-white.jpg", "Vans/vans-old-skool-black-white.jpg", "Vans/vans-old-skool-white-black.jpg", "Vans/vans-sk8-hi-navy.jpg",
  "Vans/vans-sk8-hi-white-black.jpg", "Vans/vans-slip-on-black-white.jpg", "Vans/vans-slip-on-white-black.jpg", "Vans/vans-ultrarange-exo-black.jpg", "Vans/vans-ultrarange-exo-white.jpg",
  "Vans/vans-ward-platform-black.jpg"
];

function shoeColor(path) {
  const value = path.split("/").pop().replace(/\.jpg$/i, "");
  if (value.includes("white")) return "Trắng";
  if (value.includes("black")) return "Đen";
  if (value.includes("red")) return "Đỏ";
  if (value.includes("blue") || value.includes("navy")) return "Xanh dương";
  if (value.includes("green")) return "Xanh lá";
  if (value.includes("pink")) return "Hồng";
  if (value.includes("beige")) return "Be";
  if (value.includes("grey")) return "Xám";
  return "Đen";
}

const shoeNameOverrides = {
  "Adidas/adidasnew.jpg": "Adidas Golf Boa Black"
};

function shoeName(path) {
  if (shoeNameOverrides[path]) return shoeNameOverrides[path];
  const file = path.split("/").pop().replace(/\.jpg$/i, "");
  return file.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function createSizeStock(total, start = 36, end = 50) {
  const count = end - start + 1;
  const base = Math.floor(Math.max(0, Number(total) || 0) / count);
  let remainder = Math.max(0, Number(total) || 0) % count;
  return Object.fromEntries(
    Array.from({ length: count }, (_, index) => [String(start + index), base + (remainder-- > 0 ? 1 : 0)])
  );
}

const products = shoeImagePaths.map((imagePath, index) => {
  const thuMucLoai = imagePath.split("/")[0];
  const maLoai = thuMucLoai.toLowerCase() === "mlb" ? "MLB" : thuMucLoai;
  const tenSanPham = shoeName(imagePath);
  const giaBan = 1290000 + (index % 10) * 270000;
  const chatLieu = maLoai === "Converse" || maLoai === "Vans" ? "Vải" : index % 3 === 0 ? "Da" : "Da tổng hợp";
  const soLuongTon = 20 + (index % 6) * 5;
  return {
    maSanPham: `SH-${String(index + 1).padStart(3, "0")}`,
    maLoai,
    tenSanPham,
    gioiTinh: index % 5 === 0 ? "Unisex" : index % 3 === 0 ? "Nữ" : "Nam",
    moTaNgan: `Giày ${maLoai} chính hãng, thiết kế thời trang và bền bỉ`,
    mauSac: shoeColor(imagePath),
    chatLieu,
    phongCach: index % 3 === 0 ? "Thời trang" : index % 3 === 1 ? "Thể thao" : "Casual",
    kichCo: "36 - 50",
    tonKhoTheoSize: createSizeStock(soLuongTon),
    giaBan,
    giaHienThi: `${giaBan.toLocaleString("vi-VN")}₫`,
    hinhAnh: `assets/images/products/${imagePath}`,
    giaNhap: Math.round(giaBan * 0.7),
    soLuongTon,
    tongDaNhap: soLuongTon,
    tongDaBan: 0,
    trangThaiHienThi: "visible",
    moTa: `Mẫu ${tenSanPham} mang lại cảm giác thoải mái khi di chuyển, phù hợp cho phong cách hằng ngày và các hoạt động năng động.`,
    xuatXu: "Việt Nam"
  };
});

function isUsableImagePath(hinhAnh) {
  return typeof hinhAnh === "string" && (/^(data:image|https?:)/i.test(hinhAnh) || hinhAnh.startsWith("assets/images/products/"));
}

function normalizeLocalProduct(sanPham) {
  if (!sanPham || typeof sanPham !== "object") return sanPham;
  const chuanHoa = { ...sanPham };
  if (!isUsableImagePath(chuanHoa.hinhAnh)) {
    const mau = products.find((item) => item.maSanPham === chuanHoa.maSanPham);
    if (mau) chuanHoa.hinhAnh = mau.hinhAnh;
  }
  if (!chuanHoa.tonKhoTheoSize && chuanHoa.kichCo) {
    const khoang = String(chuanHoa.kichCo).match(/(\d+)\s*[-–]\s*(\d+)/);
    if (khoang) {
      const dau = Number(khoang[1]);
      const cuoi = Number(khoang[2]);
      if (cuoi >= dau && cuoi - dau <= 30) {
        chuanHoa.tonKhoTheoSize = createSizeStock(chuanHoa.soLuongTon, dau, cuoi);
      }
    }
  }
  if (chuanHoa.tonKhoTheoSize && typeof chuanHoa.tonKhoTheoSize === "object" && !Array.isArray(chuanHoa.tonKhoTheoSize)) {
    const tonKho = {};
    Object.entries(chuanHoa.tonKhoTheoSize).forEach(([size, soLuong]) => {
      if (/^\d+(?:\.\d+)?$/.test(size) && Number.isFinite(Number(soLuong))) {
        tonKho[size] = Math.max(0, Math.floor(Number(soLuong)));
      }
    });
    if (Object.keys(tonKho).length) {
      chuanHoa.tonKhoTheoSize = tonKho;
      chuanHoa.soLuongTon = Object.values(tonKho).reduce((tong, soLuong) => tong + soLuong, 0);
    } else {
      delete chuanHoa.tonKhoTheoSize;
    }
  }
  return chuanHoa;
}

// Ghi localStorage an toan (tranh vo trang khi day dung luong).
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error("Khong the luu " + key + ":", error);
    return false;
  }
}

const SEED_VERSION = "2";

function getLocalProducts() {
  let daLuu = null;
  let docDuoc = false;
  try {
    daLuu = JSON.parse(localStorage.getItem("productsLocal") || "null");
    docDuoc = true;
  } catch (error) {
    console.error("Loi khi doc san pham:", error);
  }
  if (docDuoc && Array.isArray(daLuu) && daLuu.length > 0) {
    // Sua/loai TUNG san pham thay vi nap lai ca danh muc: bo san pham thieu ma/ten; anh sai duong dan thi lay lai anh mau
    // (neu khong co mau thi loai san pham do - du lieu khong hop le/cu).
    const chuanHoa = daLuu
      .filter((sp) => sp && sp.maSanPham && sp.tenSanPham)
      .map(normalizeLocalProduct)
      .filter((sp) => isUsableImagePath(sp.hinhAnh));
    if (chuanHoa.length) {
      let ketQua = chuanHoa;
      // Phien ban du lieu mau moi (them mau giay): bo sung cac mau chua co, chi lam 1 lan de khong "hoi sinh" san pham da xoa.
      if (localStorage.getItem("productsSeedVersion") !== SEED_VERSION) {
        const daCo = new Set(ketQua.map((item) => item.maSanPham));
        ketQua = ketQua.concat(products.filter((item) => !daCo.has(item.maSanPham)));
        safeSetItem("productsSeedVersion", SEED_VERSION);
      }
      // Chi ghi lai khi du lieu that su thay doi.
      const chuoi = JSON.stringify(ketQua);
      if (chuoi !== localStorage.getItem("productsLocal")) safeSetItem("productsLocal", chuoi);
      return ketQua;
    }
  }
  safeSetItem("productsLocal", JSON.stringify(products));
  safeSetItem("productsSeedVersion", SEED_VERSION);
  return products;
}

function saveLocalProducts(data) {
  const ok = safeSetItem("productsLocal", JSON.stringify(data));
  if (!ok) alert("Không thể lưu dữ liệu sản phẩm (bộ nhớ trình duyệt đã đầy). Hãy xóa bớt dữ liệu hoặc ảnh cũ.");
  window.dispatchEvent(new Event("productsUpdated"));
  return ok;
}

function formatProductPrice(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")}₫`;
}

// ===================== ShopCore: ton kho + don hang dung chung Admin/User =====================
// Quy tac:
//  - Ton kho luon duoc ghi vao tonKhoTheoSize (neu co) va soLuongTon = tong tonKhoTheoSize.
//  - Moi don co co `daTruKho` de tru/hoan kho dung 1 lan (don cu khong co co => coi nhu da tru).
//  - Trang thai don luu dong thoi o DanhSachDatHang (trangThai + trangThaiQuanTri) va ordersLocal (trangThaiQuanTri).
//  - Dong hang cua don o ca 2 kho luu tru deu nam trong `chiTiet[]` { maSanPham, tenSanPham, kichCoDaChon, soLuong, donGia, ... }.
const ShopCore = (function () {
  const ADMIN_TO_USER = { moiDat: "cho-xac-nhan", daXuLy: "dang-giao", daGiao: "thanh-cong", huy: "da-huy" };
  const USER_TO_ADMIN = { "cho-xac-nhan": "moiDat", "dang-giao": "daXuLy", "thanh-cong": "daGiao", "da-huy": "huy" };

  function readList(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function sizeTotal(tonKho) {
    return Object.values(tonKho).reduce((total, value) => total + (Number(value) || 0), 0);
  }

  function hasSizeStock(sanPham) {
    return !!sanPham && sanPham.tonKhoTheoSize && typeof sanPham.tonKhoTheoSize === "object" && !Array.isArray(sanPham.tonKhoTheoSize) && Object.keys(sanPham.tonKhoTheoSize).length > 0;
  }

  // Cong/tru ton kho. size rong => chia deu (cong) hoac lay tu size nhieu nhat (tru).
  function adjustStock(sanPham, size, delta) {
    if (!sanPham) return;
    delta = Math.trunc(Number(delta) || 0);
    if (!delta) return;
    const khoaSize = String(size || "");
    if (hasSizeStock(sanPham)) {
      const tonKho = sanPham.tonKhoTheoSize;
      if (khoaSize) {
        tonKho[khoaSize] = Math.max(0, (Number(tonKho[khoaSize]) || 0) + delta);
      } else if (delta > 0) {
        const cacSize = Object.keys(tonKho);
        const phanDeu = Math.floor(delta / cacSize.length);
        let du = delta % cacSize.length;
        cacSize.forEach((key) => { tonKho[key] = (Number(tonKho[key]) || 0) + phanDeu + (du-- > 0 ? 1 : 0); });
      } else {
        let conLai = -delta;
        while (conLai > 0) {
          const key = Object.keys(tonKho).sort((a, b) => (Number(tonKho[b]) || 0) - (Number(tonKho[a]) || 0))[0];
          if (!key || !(Number(tonKho[key]) > 0)) break;
          tonKho[key] -= 1;
          conLai -= 1;
        }
      }
      sanPham.soLuongTon = sizeTotal(tonKho);
    } else {
      sanPham.soLuongTon = Math.max(0, (Number(sanPham.soLuongTon) || 0) + delta);
    }
  }

  function availableStock(sanPham, size) {
    if (!sanPham) return 0;
    const khoaSize = String(size || "");
    if (hasSizeStock(sanPham) && khoaSize) return Math.max(0, Number(sanPham.tonKhoTheoSize[khoaSize]) || 0);
    return Math.max(0, Number(sanPham.soLuongTon) || 0);
  }

  // Dong hang cua don (don User va don Admin deu dung `chiTiet[]`). Tra ve [{ id, size, qty }] (cau truc noi bo).
  function orderLines(order) {
    if (!order || !Array.isArray(order.chiTiet)) return [];
    return order.chiTiet.map((dong) => ({ id: dong.maSanPham, size: dong.kichCoDaChon || "", qty: Number(dong.soLuong) || 0 }));
  }

  // Kiem tra du hang. Cac dong cung san pham (cung size) duoc GOP truoc khi so sanh; san pham khong chia size thi gop theo ma.
  function checkStock(lines, danhSachSanPham) {
    const list = danhSachSanPham || getLocalProducts();
    const gop = new Map();
    for (const line of lines) {
      const sanPham = list.find((item) => item.maSanPham === line.id);
      const theoSize = hasSizeStock(sanPham) && line.size;
      const khoa = theoSize ? line.id + "::" + line.size : line.id + "::*";
      const cu = gop.get(khoa) || { sanPham, id: line.id, size: theoSize ? line.size : "", qty: 0 };
      cu.qty += line.qty;
      gop.set(khoa, cu);
    }
    for (const dong of gop.values()) {
      const available = availableStock(dong.sanPham, dong.size);
      if (!dong.sanPham || available < dong.qty) {
        const label = dong.sanPham ? dong.sanPham.tenSanPham : dong.id;
        return { ok: false, message: `Sản phẩm "${label}" không đủ hàng${dong.size ? " (size " + dong.size + ")" : ""}. Còn ${available}.` };
      }
    }
    return { ok: true };
  }

  function cloneProducts() {
    return getLocalProducts().map((item) => ({ ...item, tonKhoTheoSize: item.tonKhoTheoSize ? { ...item.tonKhoTheoSize } : item.tonKhoTheoSize }));
  }

  // Tru kho cho don moi (goi 1 lan khi don duoc xac nhan). Gan co daTruKho len don.
  function deductOrderStock(order) {
    const danhSach = cloneProducts();
    const lines = orderLines(order);
    const check = checkStock(lines, danhSach);
    if (!check.ok) return check;
    lines.forEach((line) => adjustStock(danhSach.find((item) => item.maSanPham === line.id), line.size, -line.qty));
    if (!saveLocalProducts(danhSach)) return { ok: false, message: "Không thể lưu tồn kho (bộ nhớ trình duyệt đã đầy). Đơn hàng chưa được tạo." };
    order.daTruKho = true;
    return { ok: true };
  }

  // Chuyen trang thai hop le: moiDat -> daXuLy | huy ; daXuLy -> daGiao | huy ; daGiao, huy la trang thai cuoi.
  const TRANSITIONS = { moiDat: ["daXuLy", "huy"], daXuLy: ["daGiao", "huy"], daGiao: [], huy: [] };
  function nextStatuses(status) { return (TRANSITIONS[status] || []).slice(); }

  // Phi van chuyen: COD / chuyen khoan 30.000d, mien phi tu 10.000.000d; nhan tai cua hang 0d.
  const FREE_SHIP_FROM = 10000000;
  const SHIP_FEE = 30000;
  function shippingFee(subtotal, phuongThuc) {
    if (phuongThuc !== "COD" && phuongThuc !== "PayBank") return 0;
    return Number(subtotal) >= FREE_SHIP_FROM ? 0 : SHIP_FEE;
  }

  function mapUserStatus(adminStatus) {
    return ADMIN_TO_USER[adminStatus] || "cho-xac-nhan";
  }

  function currentAdminStatus(donUser, donAdmin) {
    if ((donUser && (donUser.trangThaiQuanTri === "huy" || donUser.trangThai === "da-huy")) || (donAdmin && donAdmin.trangThaiQuanTri === "huy")) return "huy";
    return (donAdmin && donAdmin.trangThaiQuanTri) || (donUser && (donUser.trangThaiQuanTri || USER_TO_ADMIN[donUser.trangThai])) || "moiDat";
  }

  // Doi trang thai don o ca 2 kho luu tru, dong thoi tru/hoan ton kho va tongDaBan.
  // options.force = true: bo qua kiem tra chuyen trang thai (chi dung de dong bo don cu).
  function setOrderStatus(orderId, newStatus, options) {
    const force = !!(options && options.force);
    if (!ADMIN_TO_USER[newStatus]) return { ok: false, message: "Trạng thái không hợp lệ." };
    const donUserList = readList("DanhSachDatHang");
    const donAdminList = readList("ordersLocal");
    const donUser = donUserList.find((item) => item && item.maDonHang === orderId);
    const donAdmin = donAdminList.find((item) => item && item.maDonHang === orderId);
    const don = donUser || donAdmin;
    if (!don) return { ok: false, message: "Không tìm thấy đơn hàng." };

    const oldStatus = currentAdminStatus(donUser, donAdmin);
    const nguonCo = donUser || donAdmin;
    const daTruTruoc = nguonCo.daTruKho !== false;
    if (!force && oldStatus !== newStatus && !(TRANSITIONS[oldStatus] || []).includes(newStatus)) {
      const ten = { moiDat: "Mới đặt", daXuLy: "Đã xử lý", daGiao: "Đã giao", huy: "Hủy" };
      return { ok: false, message: `Không thể chuyển đơn từ "${ten[oldStatus] || oldStatus}" sang "${ten[newStatus] || newStatus}".` };
    }
    if (oldStatus === newStatus && !(newStatus === "huy" && daTruTruoc)) return { ok: true, unchanged: true };
    let daTruSau = daTruTruoc;
    const lines = orderLines(don);
    const danhSach = cloneProducts();
    let spThayDoi = false;

    if (newStatus === "huy" && daTruTruoc) {
      lines.forEach((line) => adjustStock(danhSach.find((item) => item.maSanPham === line.id), line.size, line.qty));
      daTruSau = false;
      spThayDoi = true;
    } else if (oldStatus === "huy" && newStatus !== "huy" && !daTruTruoc) {
      const check = checkStock(lines, danhSach);
      if (!check.ok) return check;
      lines.forEach((line) => adjustStock(danhSach.find((item) => item.maSanPham === line.id), line.size, -line.qty));
      daTruSau = true;
      spThayDoi = true;
    }

    if (newStatus === "daGiao" && oldStatus !== "daGiao") {
      lines.forEach((line) => {
        const sanPham = danhSach.find((item) => item.maSanPham === line.id);
        if (sanPham) sanPham.tongDaBan = (Number(sanPham.tongDaBan) || 0) + line.qty;
      });
      spThayDoi = true;
    } else if (oldStatus === "daGiao" && newStatus !== "daGiao") {
      lines.forEach((line) => {
        const sanPham = danhSach.find((item) => item.maSanPham === line.id);
        if (sanPham) sanPham.tongDaBan = Math.max(0, (Number(sanPham.tongDaBan) || 0) - line.qty);
      });
      spThayDoi = true;
    }

    // Giao thanh cong => da thu tien (COD/nhan tai cua hang); huy don da thanh toan => can hoan tien.
    const capNhatThanhToan = (d) => {
      if (newStatus === "daGiao") d.trangThaiThanhToan = "paid";
      else if (newStatus === "huy" && d.trangThaiThanhToan === "paid") d.trangThaiThanhToan = "refund";
    };
    if (spThayDoi && !saveLocalProducts(danhSach)) {
      return { ok: false, message: "Không thể lưu tồn kho (bộ nhớ trình duyệt đã đầy)." };
    }
    if (donUser) {
      donUser.trangThaiQuanTri = newStatus;
      donUser.trangThai = ADMIN_TO_USER[newStatus];
      donUser.daTruKho = daTruSau;
      capNhatThanhToan(donUser);
      safeSetItem("DanhSachDatHang", JSON.stringify(donUserList));
    }
    if (donAdmin) {
      donAdmin.trangThaiQuanTri = newStatus;
      donAdmin.daTruKho = daTruSau;
      capNhatThanhToan(donAdmin);
      safeSetItem("ordersLocal", JSON.stringify(donAdminList));
    }

    const event = new Event("orderStatusChanged");
    event.orderId = orderId;
    event.newStatus = newStatus;
    window.dispatchEvent(event);
    return { ok: true };
  }

  // Escape HTML khi chen du lieu nguoi dung/admin vao innerHTML (chong XSS).
  function esc(value) {
    return String(value === undefined || value === null ? "" : value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[ch]);
  }

  return { adjustStock, availableStock, orderLines, checkStock, deductOrderStock, setOrderStatus, mapUserStatus, nextStatuses, shippingFee, FREE_SHIP_FROM, SHIP_FEE, ADMIN_TO_USER, USER_TO_ADMIN, readList, esc };
})();
window.ShopCore = ShopCore;
