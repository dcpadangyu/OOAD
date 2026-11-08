// ==================== PHẢN HỒI & ĐÁNH GIÁ KHÁCH HÀNG (ADMIN / NHÂN VIÊN CSKH) ====================
// Tab 1 "Xử lý phản hồi": nhân viên CSKH tiếp nhận, phản hồi, ẩn/hiện đánh giá của khách (1-5 sao, bình luận, ảnh, video).
// Tab 2 "Thống kê": số lượng, điểm trung bình, phân bố sao, xu hướng theo thời gian, trạng thái xử lý, sản phẩm, hãng, nhân viên.
(function () {
  "use strict";

  const SECTION_ID = "page-reviews";
  const PER_PAGE = 8;
  const FS = window.FeedbackStore;
  if (!FS) return;
  const esc = FS.escapeHtml;

  const REPLY_TEMPLATES = [
    { label: "Cảm ơn (đánh giá tốt)", text: "Cảm ơn bạn đã tin tưởng và ủng hộ OOAD! Chúng mình rất vui khi sản phẩm làm bạn hài lòng. Hẹn gặp lại bạn ở những đơn hàng tiếp theo." },
    { label: "Xin lỗi (chưa hài lòng)", text: "OOAD thành thật xin lỗi vì trải nghiệm chưa tốt của bạn. Bộ phận chăm sóc khách hàng sẽ liên hệ để hỗ trợ đổi size/đổi hàng hoặc giải quyết vấn đề sớm nhất. Mong bạn thông cảm." },
    { label: "Hướng dẫn đổi trả", text: "Bạn có thể đổi size miễn phí trong 7 ngày kể từ khi nhận hàng. Vui lòng giữ nguyên tem mác và liên hệ hotline 0943.72.3388 để được hỗ trợ nhanh nhất." },
    { label: "Đã tiếp nhận góp ý", text: "Cảm ơn bạn đã góp ý. Chúng mình đã ghi nhận và chuyển cho bộ phận liên quan để cải thiện chất lượng sản phẩm/dịch vụ." },
  ];

  const state = {
    list: [],
    tab: "process",
    page: 1,
    filters: { status: "all", rating: "all", media: "all", owner: "all", q: "", sort: "newest" },
    stats: { from: "", to: "", catalog: "all" },
    openId: null,
    urls: [],
  };
  let mounted = false;

  // ---------------- Tiện ích ----------------
  function me() {
    const admin = window.adminSession && window.adminSession.getCurrentAdmin && window.adminSession.getCurrentAdmin();
    if (!admin) return { username: "admin", name: "Quản trị viên", isAdmin: true };
    return { username: admin.username || "admin", name: admin.fullName || admin.username || "Quản trị viên", isAdmin: !admin.isNhanVien };
  }

  // Duong dan anh dung duoc tu Admin: data:/http giu nguyen, duong dan tuong doi them "../".
  function duongDanAnh(hinhAnh) {
    if (typeof hinhAnh !== "string" || !hinhAnh.trim()) return "";
    return /^(data:|https?:)/i.test(hinhAnh) ? hinhAnh : "../" + hinhAnh.replace(/^\/+/, "");
  }

  // Anh san pham: lay tu san pham hien tai; neu san pham da xoa/thieu anh thi dung anh luu cung danh gia.
  // Anh trong don hang da mua (don luu anh san pham ngay luc dat) - dung khi danh gia cu chua luu anh.
  function anhTuDonHang(maDonHang, maSanPham) {
    try {
      const don = (JSON.parse(localStorage.getItem("DanhSachDatHang") || "[]") || []).find((o) => o && o.maDonHang === maDonHang);
      const dong = don && (don.chiTiet || []).find((l) => l && l.maSanPham === maSanPham && l.hinhAnh);
      return dong ? dong.hinhAnh : "";
    } catch (_) {
      return "";
    }
  }

  function productInfo(productId, anhLuuKemDanhGia, maDonHang) {
    const anhDuPhong = duongDanAnh(anhLuuKemDanhGia) || duongDanAnh(maDonHang ? anhTuDonHang(maDonHang, productId) : "");
    try {
      const product = (typeof getLocalProducts === "function" ? getLocalProducts() : []).find((p) => p.maSanPham === productId);
      const image = product ? duongDanAnh(product.hinhAnh) : "";
      if (image) return { image, exists: true, duPhong: anhDuPhong };
      return { image: anhDuPhong || "../assets/img/no-image.png", exists: !!product, duPhong: "" };
    } catch (_) {
      return { image: anhDuPhong || "../assets/img/no-image.png", exists: false, duPhong: "" };
    }
  }

  function fmtHours(hours) {
    if (hours === null || hours === undefined || !isFinite(hours)) return "—";
    if (hours < 1) return Math.max(1, Math.round(hours * 60)) + " phút";
    if (hours < 48) return hours.toFixed(1) + " giờ";
    return (hours / 24).toFixed(1) + " ngày";
  }
  const pct = (part, total) => (total ? Math.round((part / total) * 100) : 0);
  const $ = (selector, root) => (root || document.getElementById(SECTION_ID)).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document.getElementById(SECTION_ID)).querySelectorAll(selector));

  function toast(message) {
    if (window.AdminDashboard && typeof window.AdminDashboard.showNotification === "function") window.AdminDashboard.showNotification(message, "success");
    else alert(message);
  }

  // ---------------- Khung giao diện ----------------
  function buildLayout(section) {
    section.innerHTML = `
      <div class="QLDG_header">
        <div>
          <h3>Phản hồi &amp; đánh giá khách hàng</h3>
          <p>Nhân viên CSKH tiếp nhận, phản hồi và theo dõi chất lượng sản phẩm qua đánh giá của khách</p>
        </div>
        <div class="QLDG_who">Đang làm việc với tư cách: <strong id="QLDG_whoName"></strong></div>
      </div>
      <div class="QLDG_tabs">
        <button type="button" class="QLDG_tab active" data-tab="process">Xử lý phản hồi <span class="QLDG_count" id="QLDG_tabBadge"></span></button>
        <button type="button" class="QLDG_tab" data-tab="stats">Thống kê feedback</button>
      </div>

      <div class="QLDG_pane" id="QLDG_paneProcess">
        <div class="QLDG_chips" id="QLDG_chips"></div>
        <div class="QLDG_filters">
          <input type="text" id="QLDG_search" placeholder="Tìm theo sản phẩm, khách hàng, mã đơn, nội dung...">
          <select id="QLDG_fRating">
            <option value="all">Tất cả số sao</option>
            <option value="5">5 sao</option><option value="4">4 sao</option><option value="3">3 sao</option>
            <option value="2">2 sao</option><option value="1">1 sao</option><option value="low">Chưa hài lòng (1-2 sao)</option>
          </select>
          <select id="QLDG_fMedia">
            <option value="all">Có / không đính kèm</option>
            <option value="any">Có ảnh hoặc video</option><option value="image">Có ảnh</option>
            <option value="video">Có video</option><option value="none">Chỉ có chữ</option>
          </select>
          <select id="QLDG_fOwner">
            <option value="all">Mọi người xử lý</option>
            <option value="mine">Của tôi</option><option value="unassigned">Chưa ai nhận</option>
          </select>
          <select id="QLDG_fSort">
            <option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option>
            <option value="lowest">Điểm thấp trước</option><option value="highest">Điểm cao trước</option>
          </select>
        </div>
        <div id="QLDG_list" class="QLDG_list"></div>
        <div class="QLDG_pagination">
          <button type="button" id="QLDG_prev">Trang trước</button>
          <span id="QLDG_pageInfo"></span>
          <button type="button" id="QLDG_next">Trang sau</button>
        </div>
      </div>

      <div class="QLDG_pane" id="QLDG_paneStats" hidden>
        <div class="QLDG_filters QLDG_statsFilters">
          <label>Từ ngày <input type="date" id="QLDG_sFrom"></label>
          <label>Đến ngày <input type="date" id="QLDG_sTo"></label>
          <label>Hãng <select id="QLDG_sCatalog"></select></label>
          <div class="QLDG_quick">
            <button type="button" data-range="7">7 ngày</button>
            <button type="button" data-range="30">30 ngày</button>
            <button type="button" data-range="0">Tất cả</button>
          </div>
        </div>
        <div id="QLDG_statsBody"></div>
      </div>

      <div class="QLDG_modal" id="QLDG_modal" hidden>
        <div class="QLDG_modalBox" role="dialog" aria-modal="true">
          <button type="button" class="QLDG_modalClose" aria-label="Đóng">&times;</button>
          <div id="QLDG_modalBody"></div>
        </div>
      </div>`;
  }

  // ---------------- Danh sách xử lý ----------------
  function matchesFilters(item) {
    const f = state.filters;
    if (f.status !== "all" && item.trangThai !== f.status) return false;
    if (f.rating !== "all") {
      if (f.rating === "low" ? Number(item.soSao) > 2 : Number(item.soSao) !== Number(f.rating)) return false;
    }
    const media = item.tepDinhKem || [];
    if (f.media === "any" && !media.length) return false;
    if (f.media === "image" && !media.some((m) => m.loai === "image")) return false;
    if (f.media === "video" && !media.some((m) => m.loai === "video")) return false;
    if (f.media === "none" && media.length) return false;
    if (f.owner === "mine" && !(item.nguoiXuLy && item.nguoiXuLy.tenDangNhap === me().username)) return false;
    if (f.owner === "unassigned" && item.nguoiXuLy) return false;
    if (f.q) {
      const haystack = `${item.tenSanPham} ${item.maSanPham} ${item.hoTen} ${item.maDonHang} ${item.binhLuan}`.toLowerCase();
      if (!haystack.includes(f.q.toLowerCase())) return false;
    }
    return true;
  }

  function sorted(list) {
    const copy = list.slice();
    const by = { newest: (a, b) => String(b.ngayTao).localeCompare(String(a.ngayTao)), oldest: (a, b) => String(a.ngayTao).localeCompare(String(b.ngayTao)), lowest: (a, b) => a.soSao - b.soSao || String(b.ngayTao).localeCompare(String(a.ngayTao)), highest: (a, b) => b.soSao - a.soSao || String(b.ngayTao).localeCompare(String(a.ngayTao)) };
    return copy.sort(by[state.filters.sort] || by.newest);
  }

  function renderChips() {
    const counts = { all: state.list.length, moi: 0, dangXuLy: 0, daXuLy: 0 };
    state.list.forEach((item) => { counts[item.trangThai] = (counts[item.trangThai] || 0) + 1; });
    const chips = [["all", "Tất cả"], ["moi", "Mới"], ["dangXuLy", "Đang xử lý"], ["daXuLy", "Đã phản hồi"]];
    $("#QLDG_chips").innerHTML = chips.map(([key, label]) => `<button type="button" class="QLDG_chip${state.filters.status === key ? " active" : ""}" data-status="${key}">${label} <b>${counts[key] || 0}</b></button>`).join("");
    const pending = counts.moi || 0;
    const badge = $("#QLDG_tabBadge");
    badge.textContent = pending ? pending : "";
    badge.hidden = !pending;
    updateMenuBadge(pending);
  }

  function updateMenuBadge(pending) {
    const link = document.querySelector('a[data-route="/reviews"]');
    if (!link) return;
    let badge = link.querySelector(".QLDG_menuBadge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "QLDG_menuBadge";
      link.appendChild(badge);
    }
    badge.textContent = pending > 99 ? "99+" : String(pending);
    badge.style.display = pending ? "" : "none";
  }

  function renderList() {
    const filtered = sorted(state.list.filter(matchesFilters));
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    if (state.page > totalPages) state.page = totalPages;
    const pageItems = filtered.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);
    const box = $("#QLDG_list");
    if (!pageItems.length) {
      box.innerHTML = `<div class="QLDG_empty">${state.list.length ? "Không có phản hồi phù hợp bộ lọc." : "Chưa có đánh giá nào từ khách hàng. Khách có thể đánh giá sản phẩm trong trang Lịch sử đơn hàng sau khi đơn được giao thành công."}</div>`;
    } else {
      const user = me();
      box.innerHTML = pageItems.map((item) => {
        const info = productInfo(item.maSanPham, item.hinhAnh, item.maDonHang);
        const media = item.tepDinhKem || [];
        const images = media.filter((m) => m.loai === "image").length;
        const videos = media.filter((m) => m.loai === "video").length;
        const canTake = !item.nguoiXuLy;
        return `<article class="QLDG_card${item.trangThai === "moi" ? " QLDG_new" : ""}" data-id="${esc(item.maDanhGia)}">
          <img class="QLDG_pimg" src="${esc(info.image)}" alt="" onerror="this.onerror=null;this.src=this.dataset.dp||'../assets/img/no-image.png'" data-dp="${esc(info.duPhong || '')}">
          <div class="QLDG_main">
            <div class="QLDG_row1">
              <strong>${esc(item.tenSanPham || item.maSanPham)}</strong>
              <span class="QLDG_stars" title="${item.soSao}/5">${FS.stars(item.soSao)}</span>
              <span class="QLDG_badge QLDG_st_${esc(item.trangThai)}">${esc(FS.STATUS_LABEL[item.trangThai] || item.trangThai)}</span>
              ${item.daAn ? `<span class="QLDG_badge QLDG_st_hidden">Đã ẩn</span>` : ""}
            </div>
            <div class="QLDG_meta">Khách: <b>${esc(item.hoTen || "—")}</b> · Đơn ${esc(item.maDonHang)}${item.kichCoDaChon ? " · Size " + esc(item.kichCoDaChon) : ""} · ${esc(FS.formatDateTime(item.ngayTao))}</div>
            ${item.binhLuan ? `<p class="QLDG_comment">${esc(item.binhLuan)}</p>` : `<p class="QLDG_comment QLDG_dim">(Khách chỉ chấm sao, không viết nhận xét)</p>`}
            <div class="QLDG_flags">
              ${images ? `<span>📷 ${images} ảnh</span>` : ""}${videos ? `<span>🎬 ${videos} video</span>` : ""}
              <span>${item.nguoiXuLy ? `Người xử lý: <b>${esc(item.nguoiXuLy.hoTen || item.nguoiXuLy.tenDangNhap)}</b>${item.nguoiXuLy.tenDangNhap === user.username ? " (bạn)" : ""}` : "Chưa có người xử lý"}</span>
            </div>
          </div>
          <div class="QLDG_actions">
            ${canTake ? `<button type="button" class="QLDG_btn QLDG_take">Tiếp nhận</button>` : ""}
            <button type="button" class="QLDG_btn QLDG_btnLight QLDG_view">Xem &amp; xử lý</button>
          </div>
        </article>`;
      }).join("");
    }
    $("#QLDG_pageInfo").textContent = `Trang ${state.page}/${totalPages} · ${filtered.length} phản hồi`;
    $("#QLDG_prev").disabled = state.page <= 1;
    $("#QLDG_next").disabled = state.page >= totalPages;
  }

  // ---------------- Chi tiết + xử lý ----------------
  function closeModal() {
    state.openId = null;
    $("#QLDG_modal").hidden = true;
    state.urls.splice(0).forEach((url) => URL.revokeObjectURL(url));
  }

  function openModal(id) {
    const item = state.list.find((entry) => entry.maDanhGia === id);
    if (!item) return;
    state.openId = id;
    state.urls.splice(0).forEach((url) => URL.revokeObjectURL(url));
    const user = me();
    const owner = item.nguoiXuLy;
    const mine = owner && owner.tenDangNhap === user.username;
    const blocked = owner && !mine && !user.isAdmin; // nhân viên khác đang xử lý
    const info = productInfo(item.maSanPham, item.hinhAnh, item.maDonHang);
    const mediaHtml = (item.tepDinhKem || []).map((m) => {
      // Bỏ qua tệp đính kèm thiếu dữ liệu (không có Blob) để cửa sổ chi tiết vẫn mở được
      if (!m || !(m.tep instanceof Blob)) return "";
      let url;
      try {
        url = URL.createObjectURL(m.tep);
      } catch (_) {
        return "";
      }
      state.urls.push(url);
      return m.loai === "video"
        ? `<video class="QLDG_mvideo" src="${url}" controls preload="metadata"></video>`
        : `<img class="QLDG_mimg" src="${url}" alt="${esc(m.ten || "")}" data-full="${url}">`;
    }).join("");

    $("#QLDG_modalBody").innerHTML = `
      <h3>Chi tiết đánh giá</h3>
      <div class="QLDG_dgrid">
        <div class="QLDG_dprod"><img src="${esc(info.image)}" alt="" onerror="this.onerror=null;this.src=this.dataset.dp||'../assets/img/no-image.png'" data-dp="${esc(info.duPhong || '')}">
          <div><strong>${esc(item.tenSanPham || item.maSanPham)}</strong><small>${esc(item.maSanPham)}${item.maLoai ? " · " + esc(item.maLoai) : ""}${item.kichCoDaChon ? " · Size " + esc(item.kichCoDaChon) : ""}</small>
          <div class="QLDG_stars QLDG_big">${FS.stars(item.soSao)} <b>${item.soSao}/5</b></div></div></div>
        <dl class="QLDG_dinfo">
          <dt>Khách hàng</dt><dd>${esc(item.hoTen || "—")}</dd>
          <dt>Mã đơn</dt><dd>${esc(item.maDonHang)}</dd>
          <dt>Ngày gửi</dt><dd>${esc(FS.formatDateTime(item.ngayTao))}</dd>
          <dt>Trạng thái</dt><dd><span class="QLDG_badge QLDG_st_${esc(item.trangThai)}">${esc(FS.STATUS_LABEL[item.trangThai] || item.trangThai)}</span>${item.daAn ? ` <span class="QLDG_badge QLDG_st_hidden">Đã ẩn khỏi trang sản phẩm</span>` : ""}</dd>
          <dt>Người xử lý</dt><dd>${owner ? esc(owner.hoTen || owner.tenDangNhap) + (item.ngayTiepNhan ? ` <small>(nhận lúc ${esc(FS.formatDateTime(item.ngayTiepNhan))})</small>` : "") : "Chưa có"}</dd>
        </dl>
      </div>
      <h4>Nội dung nhận xét</h4>
      <div class="QLDG_text">${item.binhLuan ? esc(item.binhLuan).replace(/\n/g, "<br>") : `<span class="QLDG_dim">Khách không viết nhận xét.</span>`}</div>
      ${mediaHtml ? `<h4>Hình ảnh / video đính kèm</h4><div class="QLDG_mgrid">${mediaHtml}</div>` : ""}

      <h4>Phản hồi của cửa hàng</h4>
      ${item.phanHoi ? `<div class="QLDG_replyShown"><p>${esc(item.phanHoi.noiDung).replace(/\n/g, "<br>")}</p><small>${esc(item.phanHoi.nguoiGui || "CSKH")} · ${esc(FS.formatDateTime(item.phanHoi.thoiGian))}${item.phanHoi.capNhatLuc ? ` · cập nhật lúc ${esc(FS.formatDateTime(item.phanHoi.capNhatLuc))}` : ""}</small></div>` : ""}
      ${blocked
        ? `<div class="QLDG_notice">Phản hồi này đang do <b>${esc(owner.hoTen || owner.tenDangNhap)}</b> xử lý. Bạn chỉ có thể xem.</div>`
        : `<div class="QLDG_templates">${REPLY_TEMPLATES.map((t, i) => `<button type="button" class="QLDG_tpl" data-i="${i}">${esc(t.label)}</button>`).join("")}</div>
           <textarea id="QLDG_replyText" rows="4" maxlength="1000" placeholder="Nhập nội dung phản hồi gửi tới khách hàng...">${item.phanHoi ? esc(item.phanHoi.noiDung) : ""}</textarea>`}
      <div class="QLDG_error" id="QLDG_modalError" hidden></div>
      <div class="QLDG_mactions">
        ${blocked ? "" : `
          ${!mine ? `<button type="button" class="QLDG_btn QLDG_mTake">${owner ? "Nhận xử lý thay" : "Tiếp nhận xử lý"}</button>` : ""}
          <button type="button" class="QLDG_btn QLDG_mSend">${item.trangThai === "daXuLy" ? "Cập nhật phản hồi" : "Gửi phản hồi & hoàn tất"}</button>
          ${item.trangThai === "daXuLy" ? `<button type="button" class="QLDG_btn QLDG_btnLight QLDG_mReopen">Mở lại</button>` : ""}
          <button type="button" class="QLDG_btn QLDG_btnLight QLDG_mHide">${item.daAn ? "Hiện lại trên trang sản phẩm" : "Ẩn khỏi trang sản phẩm"}</button>`}
      </div>`;
    $("#QLDG_modal").hidden = false;
  }

  function modalError(message) {
    const box = $("#QLDG_modalError");
    if (!box) return;
    box.textContent = message || "";
    box.hidden = !message;
  }

  // Người dùng hiện tại có được thao tác trên phản hồi này không (admin luôn được; nhân viên chỉ khi chưa ai nhận hoặc là của mình)
  function canAct(item) {
    const user = me();
    if (user.isAdmin) return true;
    return !item.nguoiXuLy || item.nguoiXuLy.tenDangNhap === user.username;
  }

  async function takeOver(id) {
    const user = me();
    await FS.update(id, (current) => ({
      nguoiXuLy: { tenDangNhap: user.username, hoTen: user.name },
      ngayTiepNhan: new Date().toISOString(),
      trangThai: current.trangThai === "daXuLy" ? "daXuLy" : "dangXuLy",
    }));
  }

  async function handleModalClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const id = state.openId;
    if (target.closest(".QLDG_modalClose")) return closeModal();
    const img = target.closest("img.QLDG_mimg");
    if (img) return showLightbox(img.dataset.full || img.src);
    if (!id) return;
    const tpl = target.closest(".QLDG_tpl");
    if (tpl) {
      const area = $("#QLDG_replyText");
      if (area) area.value = REPLY_TEMPLATES[Number(tpl.dataset.i)].text;
      return;
    }
    try {
      if (target.closest(".QLDG_mTake, .QLDG_mSend, .QLDG_mReopen, .QLDG_mHide")) {
        const fresh = await FS.get(id);
        if (fresh && !canAct(fresh)) {
          return modalError("Phản hồi này đang do nhân viên khác xử lý, bạn chỉ có thể xem.");
        }
      }
      if (target.closest(".QLDG_mTake")) {
        await takeOver(id);
        toast("Đã tiếp nhận xử lý phản hồi.");
      } else if (target.closest(".QLDG_mSend")) {
        const text = ($("#QLDG_replyText").value || "").trim();
        if (!text) return modalError("Vui lòng nhập nội dung phản hồi cho khách.");
        const user = me();
        const current = (await FS.get(id)) || state.list.find((entry) => entry.maDanhGia === id);
        const nowIso = new Date().toISOString();
        // thoiGian = lần phản hồi ĐẦU TIÊN (dùng cho thống kê thời gian phản hồi); lần sau chỉ ghi thêm capNhatLuc
        const firstTime = current && current.phanHoi && current.phanHoi.thoiGian;
        const phanHoi = firstTime
          ? { noiDung: text, nguoiGui: user.name, tenDangNhap: user.username, thoiGian: firstTime, capNhatLuc: nowIso }
          : { noiDung: text, nguoiGui: user.name, tenDangNhap: user.username, thoiGian: nowIso };
        await FS.update(id, {
          nguoiXuLy: current && current.nguoiXuLy ? current.nguoiXuLy : { tenDangNhap: user.username, hoTen: user.name },
          ngayTiepNhan: (current && current.ngayTiepNhan) || nowIso,
          phanHoi,
          trangThai: "daXuLy",
        });
        toast("Đã gửi phản hồi cho khách hàng.");
      } else if (target.closest(".QLDG_mReopen")) {
        await FS.update(id, { trangThai: "dangXuLy" });
        toast("Đã mở lại phản hồi để xử lý tiếp.");
      } else if (target.closest(".QLDG_mHide")) {
        const current = state.list.find((entry) => entry.maDanhGia === id);
        await FS.update(id, { daAn: !(current && current.daAn) });
      } else {
        return;
      }
      await reload();
      if (state.openId) openModal(state.openId);
    } catch (error) {
      modalError(error.message || "Không thực hiện được thao tác.");
    }
  }

  function showLightbox(src) {
    const box = document.createElement("div");
    box.className = "QLDG_lightbox";
    box.innerHTML = `<img src="${src}" alt="">`;
    box.addEventListener("click", () => box.remove());
    document.body.appendChild(box);
  }

  // ---------------- Thống kê ----------------
  function statsRange() {
    const from = state.stats.from ? new Date(state.stats.from + "T00:00:00") : null;
    const to = state.stats.to ? new Date(state.stats.to + "T23:59:59") : null;
    return { from, to };
  }

  function statsData() {
    const { from, to } = statsRange();
    return state.list.filter((item) => {
      const date = new Date(item.ngayTao);
      if (from && date < from) return false;
      if (to && date > to) return false;
      if (state.stats.catalog !== "all" && (item.maLoai || "Khác") !== state.stats.catalog) return false;
      return true;
    });
  }

  function trendBuckets(list, from, to) {
    if (!list.length) return [];
    const dates = list.map((item) => new Date(item.ngayTao));
    const start = from || new Date(Math.min.apply(null, dates));
    const end = to || new Date(Math.max.apply(null, dates));
    const spanDays = Math.round((end - start) / 86400000) + 1;
    const monthly = spanDays > 62;
    const buckets = [];
    const index = {};
    if (monthly) {
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cursor <= end) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
        index[key] = buckets.length;
        buckets.push({ key, label: `${String(cursor.getMonth() + 1).padStart(2, "0")}/${cursor.getFullYear()}`, count: 0, sum: 0 });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    } else {
      const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      while (cursor <= end) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
        index[key] = buckets.length;
        buckets.push({ key, label: `${String(cursor.getDate()).padStart(2, "0")}/${String(cursor.getMonth() + 1).padStart(2, "0")}`, count: 0, sum: 0 });
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    list.forEach((item) => {
      const d = new Date(item.ngayTao);
      const key = monthly ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const bucket = buckets[index[key]];
      if (bucket) { bucket.count += 1; bucket.sum += Number(item.soSao) || 0; }
    });
    return buckets;
  }

  function renderStats() {
    const select = $("#QLDG_sCatalog");
    const catalogs = Array.from(new Set(state.list.map((item) => item.maLoai || "Khác"))).sort();
    select.innerHTML = `<option value="all">Tất cả hãng</option>` + catalogs.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
    select.value = catalogs.includes(state.stats.catalog) ? state.stats.catalog : "all";
    $("#QLDG_sFrom").value = state.stats.from;
    $("#QLDG_sTo").value = state.stats.to;

    const list = statsData();
    const body = $("#QLDG_statsBody");
    if (!list.length) {
      body.innerHTML = `<div class="QLDG_empty">Chưa có dữ liệu feedback trong khoảng đã chọn.</div>`;
      return;
    }
    const s = FS.summarize(list);
    const pending = s.byStatus.moi + s.byStatus.dangXuLy;
    const maxDist = Math.max.apply(null, [1, 2, 3, 4, 5].map((n) => s.dist[n]));
    const { from, to } = statsRange();
    const buckets = trendBuckets(list, from, to);
    const maxBucket = Math.max.apply(null, buckets.map((b) => b.count).concat([1]));
    // "Cao nhất"/"cần cải thiện" cần >= 2 đánh giá nếu có ít nhất một sản phẩm đạt ngưỡng đó (tránh 1 đánh giá lẻ chiếm bảng); không thì dùng tất cả
    const rankPool = s.products.some((p) => p.count >= 2) ? s.products.filter((p) => p.count >= 2) : s.products;
    const best = rankPool.slice().sort((a, b) => b.avg - a.avg || b.count - a.count).slice(0, 5);
    const worst = rankPool.slice().sort((a, b) => a.avg - b.avg || b.count - a.count).slice(0, 5);
    const most = s.products.slice().sort((a, b) => b.count - a.count || b.avg - a.avg).slice(0, 5);
    const productRows = (rows) => rows.map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p.name)}<small>${esc(p.catalog)}</small></td><td><b>${p.avg.toFixed(1)}</b> <span class="QLDG_stars">★</span></td><td>${p.count}</td></tr>`).join("");
    const statusTotal = s.total || 1;

    body.innerHTML = `
      <div class="QLDG_cards">
        <div class="QLDG_stat"><span>Tổng feedback</span><strong>${s.total}</strong><small>${s.withComment} có nhận xét · ${s.withMedia} có ảnh/video</small></div>
        <div class="QLDG_stat"><span>Điểm trung bình</span><strong>${s.avg.toFixed(2)} <i class="QLDG_stars">★</i></strong><small class="QLDG_stars">${FS.stars(s.avg)}</small></div>
        <div class="QLDG_stat QLDG_good"><span>Hài lòng (4-5 sao)</span><strong>${pct(s.positive, s.total)}%</strong><small>${s.positive} đánh giá</small></div>
        <div class="QLDG_stat QLDG_bad"><span>Chưa hài lòng (1-2 sao)</span><strong>${pct(s.negative, s.total)}%</strong><small>${s.negative} đánh giá</small></div>
        <div class="QLDG_stat QLDG_warn"><span>Chờ xử lý</span><strong>${pending}</strong><small>${s.byStatus.moi} mới · ${s.byStatus.dangXuLy} đang xử lý</small></div>
        <div class="QLDG_stat"><span>Thời gian phản hồi TB</span><strong class="QLDG_small">${fmtHours(s.avgResponseHours)}</strong><small>Đã phản hồi ${pct(s.byStatus.daXuLy, s.total)}%</small></div>
      </div>

      <div class="QLDG_grid2">
        <section class="QLDG_panel">
          <h4>Phân bố số sao</h4>
          ${[5, 4, 3, 2, 1].map((n) => `<div class="QLDG_hbar"><span>${n} ★</span><i><b class="QLDG_r${n}" style="width:${maxDist ? (s.dist[n] / maxDist) * 100 : 0}%"></b></i><em>${s.dist[n]} <small>(${pct(s.dist[n], s.total)}%)</small></em></div>`).join("")}
        </section>
        <section class="QLDG_panel">
          <h4>Trạng thái xử lý</h4>
          <div class="QLDG_stack">
            <b class="QLDG_st_moi" style="width:${(s.byStatus.moi / statusTotal) * 100}%" title="Mới"></b>
            <b class="QLDG_st_dangXuLy" style="width:${(s.byStatus.dangXuLy / statusTotal) * 100}%" title="Đang xử lý"></b>
            <b class="QLDG_st_daXuLy" style="width:${(s.byStatus.daXuLy / statusTotal) * 100}%" title="Đã phản hồi"></b>
          </div>
          <ul class="QLDG_legend">
            <li><i class="QLDG_st_moi"></i> Mới: <b>${s.byStatus.moi}</b> (${pct(s.byStatus.moi, s.total)}%)</li>
            <li><i class="QLDG_st_dangXuLy"></i> Đang xử lý: <b>${s.byStatus.dangXuLy}</b> (${pct(s.byStatus.dangXuLy, s.total)}%)</li>
            <li><i class="QLDG_st_daXuLy"></i> Đã phản hồi: <b>${s.byStatus.daXuLy}</b> (${pct(s.byStatus.daXuLy, s.total)}%)</li>
          </ul>
          <h4 class="QLDG_sub">Hình thức đánh giá</h4>
          <div class="QLDG_hbar"><span>Chữ</span><i><b class="QLDG_r4" style="width:${pct(s.withComment, s.total)}%"></b></i><em>${s.withComment} <small>(${pct(s.withComment, s.total)}%)</small></em></div>
          <div class="QLDG_hbar"><span>Ảnh</span><i><b class="QLDG_r3" style="width:${pct(s.withImage, s.total)}%"></b></i><em>${s.withImage} <small>(${pct(s.withImage, s.total)}%)</small></em></div>
          <div class="QLDG_hbar"><span>Video</span><i><b class="QLDG_r5" style="width:${pct(s.withVideo, s.total)}%"></b></i><em>${s.withVideo} <small>(${pct(s.withVideo, s.total)}%)</small></em></div>
        </section>
      </div>

      <section class="QLDG_panel">
        <h4>Số feedback theo ${buckets.length && buckets[0].key.length === 7 ? "tháng" : "ngày"} <small>(màu cột thể hiện điểm trung bình: xanh ≥ 4, vàng ≥ 3, đỏ &lt; 3)</small></h4>
        <div class="QLDG_vchart">${buckets.map((b) => {
          const avg = b.count ? b.sum / b.count : 0;
          const tone = !b.count ? "" : avg >= 4 ? "QLDG_tg" : avg >= 3 ? "QLDG_ty" : "QLDG_tr";
          return `<div class="QLDG_vcol" title="${esc(b.label)}: ${b.count} feedback${b.count ? ", TB " + avg.toFixed(1) + "★" : ""}"><em>${b.count || ""}</em><b class="${tone}" style="height:${(b.count / maxBucket) * 100}%"></b><span>${esc(b.label)}</span></div>`;
        }).join("")}</div>
      </section>

      <div class="QLDG_grid3">
        <section class="QLDG_panel"><h4>Sản phẩm được đánh giá cao nhất</h4><table class="QLDG_table"><thead><tr><th>#</th><th>Sản phẩm</th><th>Điểm</th><th>SL</th></tr></thead><tbody>${productRows(best)}</tbody></table></section>
        <section class="QLDG_panel"><h4>Sản phẩm cần cải thiện</h4><table class="QLDG_table"><thead><tr><th>#</th><th>Sản phẩm</th><th>Điểm</th><th>SL</th></tr></thead><tbody>${productRows(worst)}</tbody></table></section>
        <section class="QLDG_panel"><h4>Được đánh giá nhiều nhất</h4><table class="QLDG_table"><thead><tr><th>#</th><th>Sản phẩm</th><th>Điểm</th><th>SL</th></tr></thead><tbody>${productRows(most)}</tbody></table></section>
      </div>

      <div class="QLDG_grid2">
        <section class="QLDG_panel"><h4>Theo hãng</h4>
          ${s.catalogs.map((c) => `<div class="QLDG_hbar"><span>${esc(c.name)}</span><i><b class="QLDG_r${Math.max(1, Math.min(5, Math.round(c.avg)))}" style="width:${(c.avg / 5) * 100}%"></b></i><em>${c.avg.toFixed(1)}★ <small>(${c.count})</small></em></div>`).join("")}
        </section>
        <section class="QLDG_panel"><h4>Hiệu suất nhân viên CSKH</h4>
          ${s.staff.length ? `<table class="QLDG_table"><thead><tr><th>Nhân viên</th><th>Đã nhận</th><th>Hoàn tất</th><th>TG phản hồi TB</th></tr></thead><tbody>${s.staff.map((st) => `<tr><td>${esc(st.name)}</td><td>${st.received}</td><td>${st.done}</td><td>${fmtHours(st.avgHours)}</td></tr>`).join("")}</tbody></table>` : `<p class="QLDG_dim">Chưa có nhân viên nào tiếp nhận phản hồi.</p>`}
        </section>
      </div>`;
  }

  // ---------------- Tải dữ liệu & sự kiện ----------------
  async function reload() {
    try {
      state.list = await FS.getAll();
    } catch (error) {
      state.list = [];
      const box = $("#QLDG_list");
      if (box) box.innerHTML = `<div class="QLDG_empty">Không đọc được dữ liệu đánh giá: ${esc(error.message)}</div>`;
    }
    renderChips();
    if (state.tab === "process") renderList(); else renderStats();
  }

  function setTab(tab) {
    state.tab = tab;
    $$(".QLDG_tab").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
    $("#QLDG_paneProcess").hidden = tab !== "process";
    $("#QLDG_paneStats").hidden = tab !== "stats";
    if (tab === "process") renderList(); else renderStats();
  }

  function setRange(days) {
    if (!days) { state.stats.from = ""; state.stats.to = ""; return; }
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1));
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    state.stats.from = fmt(from);
    state.stats.to = fmt(today);
  }

  function bind(section) {
    section.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const tab = target.closest(".QLDG_tab");
      if (tab) return setTab(tab.dataset.tab);
      const chip = target.closest(".QLDG_chip");
      if (chip) { state.filters.status = chip.dataset.status; state.page = 1; renderChips(); return renderList(); }
      const quick = target.closest(".QLDG_quick button");
      if (quick) { setRange(Number(quick.dataset.range)); return renderStats(); }
      if (target.closest("#QLDG_prev")) { state.page = Math.max(1, state.page - 1); return renderList(); }
      if (target.closest("#QLDG_next")) { state.page += 1; return renderList(); }
      const card = target.closest(".QLDG_card");
      if (card) {
        const id = card.dataset.id;
        if (target.closest(".QLDG_take")) {
          takeOver(id).then(() => { toast("Đã tiếp nhận xử lý phản hồi."); return reload(); }).then(() => openModal(id)).catch((error) => alert(error.message));
          return;
        }
        if (target.closest(".QLDG_view") || !target.closest("button")) return openModal(id);
      }
    });
    section.addEventListener("click", (event) => { if (event.target.id === "QLDG_modal") closeModal(); });
    $("#QLDG_modal").addEventListener("click", handleModalClick);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && state.openId) closeModal(); });

    const onFilter = () => {
      state.filters.q = $("#QLDG_search").value.trim();
      state.filters.rating = $("#QLDG_fRating").value;
      state.filters.media = $("#QLDG_fMedia").value;
      state.filters.owner = $("#QLDG_fOwner").value;
      state.filters.sort = $("#QLDG_fSort").value;
      state.page = 1;
      renderList();
    };
    $("#QLDG_search").addEventListener("input", onFilter);
    ["#QLDG_fRating", "#QLDG_fMedia", "#QLDG_fOwner", "#QLDG_fSort"].forEach((selector) => $(selector).addEventListener("change", onFilter));

    $("#QLDG_sFrom").addEventListener("change", (e) => { state.stats.from = e.target.value; renderStats(); });
    $("#QLDG_sTo").addEventListener("change", (e) => { state.stats.to = e.target.value; renderStats(); });
    $("#QLDG_sCatalog").addEventListener("change", (e) => { state.stats.catalog = e.target.value; renderStats(); });
  }

  function mount() {
    const section = document.getElementById(SECTION_ID);
    if (!section || mounted) return;
    mounted = true;
    buildLayout(section);
    $("#QLDG_whoName").textContent = me().name;
    bind(section);
    reload();
  }

  FS.onChange(() => { if (mounted) reload(); else FS.getAll().then((list) => updateMenuBadge(list.filter((i) => i.trangThai === "moi").length)).catch(() => {}); });
  window.addEventListener("hashchange", () => { if (mounted && location.hash === "#/reviews") reload(); });
  document.addEventListener("DOMContentLoaded", mount);
  window.QuanLyDanhGia = { reload };
})();
