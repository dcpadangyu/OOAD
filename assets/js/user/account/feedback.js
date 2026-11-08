// ==================== ĐÁNH GIÁ SẢN PHẨM (USER) ====================
// - Nút "Đánh giá" xuất hiện dưới từng sản phẩm của đơn đã giao thành công (order-history).
// - Khách chấm 1-5 sao, viết bình luận, đính kèm ảnh/video. Dữ liệu lưu qua FeedbackStore (IndexedDB).
// - Sau khi nhân viên CSKH phản hồi, nội dung phản hồi hiện ngay dưới đánh giá của khách.
(function () {
  "use strict";

  const FS = window.FeedbackStore;
  if (!FS) return;
  const esc = FS.escapeHtml;
  const LABELS = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Tuyệt vời"];

  function notifyUser(icon, title, text) {
    if (window.Swal && typeof window.Swal.fire === "function") return window.Swal.fire({ icon, title, text, confirmButtonText: "Đóng" });
    alert(text ? `${title}\n${text}` : title);
    return Promise.resolve();
  }

  function findOrderItem(orderId, productId, size) {
    const orders = typeof window.getDanhSachDatHang === "function" ? window.getDanhSachDatHang() : [];
    const order = orders.find((o) => o && o.maDonHang === orderId);
    if (!order) return null;
    const item = (order.chiTiet || []).find((p) => p.maSanPham === productId && String(p.kichCoDaChon || "") === String(size || ""));
    return item ? { order, item } : null;
  }

  // ---------------- Form đánh giá ----------------
  function openForm(slot) {
    const user = window.UserSession?.getCurrentUser?.();
    if (!user) { window.location.href = "pages/login.html"; return; }
    const { order: orderId, product: productId, size = "" } = slot.dataset;
    const found = findOrderItem(orderId, productId, size);
    if (!found) return notifyUser("error", "Không tìm thấy sản phẩm trong đơn hàng");
    const { item } = found;

    closeForm();
    const overlay = document.createElement("div");
    overlay.className = "fb-overlay";
    overlay.innerHTML = `
      <div class="fb-modal" role="dialog" aria-modal="true" aria-label="Đánh giá sản phẩm">
        <button type="button" class="fb-close" aria-label="Đóng">&times;</button>
        <h3>Đánh giá sản phẩm</h3>
        <div class="fb-product">
          <img src="${esc(item.hinhAnh)}" alt="" onerror="this.onerror=null;this.src='assets/img/no-image.png'">
          <div><strong>${esc(item.tenSanPham)}</strong>${size ? `<span>Size ${esc(size)}</span>` : ""}<span>Đơn ${esc(orderId)}</span></div>
        </div>
        <div class="fb-rate">
          <div class="fb-stars" role="radiogroup" aria-label="Chọn số sao">
            ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="fb-star" data-value="${n}" role="radio" aria-checked="false" aria-label="${n} sao">★</button>`).join("")}
          </div>
          <span class="fb-rate-label">Chạm vào sao để chấm điểm</span>
        </div>
        <label class="fb-field">Nhận xét của bạn <small>(không bắt buộc)</small>
          <textarea class="fb-text" rows="4" maxlength="${esc(FS.LIMITS.maxComment)}" placeholder="Chất lượng, form giày, độ êm, giao hàng... bạn cảm thấy thế nào?"></textarea>
          <span class="fb-counter">0/${esc(FS.LIMITS.maxComment)}</span>
        </label>
        <div class="fb-field">Hình ảnh / video <small>(tối đa ${esc(FS.LIMITS.maxFiles)} tệp, video ≤ ${esc(FS.LIMITS.maxVideoMB)}MB)</small>
          <label class="fb-upload"><input type="file" class="fb-file" accept="image/*,video/*" multiple hidden>＋ Thêm ảnh hoặc video</label>
          <div class="fb-previews"></div>
        </div>
        <div class="fb-error" role="alert" hidden></div>
        <div class="fb-actions">
          <button type="button" class="fb-btn fb-btn-ghost fb-cancel">Hủy</button>
          <button type="button" class="fb-btn fb-submit">Gửi đánh giá</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.body.classList.add("fb-lock");

    const $ = (selector) => overlay.querySelector(selector);
    const stars = Array.from(overlay.querySelectorAll(".fb-star"));
    const errorBox = $(".fb-error");
    const previews = $(".fb-previews");
    const textarea = $(".fb-text");
    let rating = 0;
    let files = []; // { file, kind, url }

    function paintStars(value) {
      stars.forEach((star) => {
        const on = Number(star.dataset.value) <= value;
        star.classList.toggle("on", on);
        star.setAttribute("aria-checked", String(Number(star.dataset.value) === rating));
      });
      $(".fb-rate-label").textContent = value ? `${value}/5 · ${LABELS[value]}` : "Chạm vào sao để chấm điểm";
    }
    function showError(message) { errorBox.textContent = message || ""; errorBox.hidden = !message; }

    stars.forEach((star) => {
      star.addEventListener("mouseenter", () => paintStars(Number(star.dataset.value)));
      star.addEventListener("click", () => { rating = Number(star.dataset.value); paintStars(rating); showError(""); });
    });
    $(".fb-stars").addEventListener("mouseleave", () => paintStars(rating));

    textarea.addEventListener("input", () => { $(".fb-counter").textContent = `${textarea.value.length}/${FS.LIMITS.maxComment}`; });

    function renderPreviews() {
      previews.innerHTML = "";
      files.forEach((entry, index) => {
        const box = document.createElement("div");
        box.className = "fb-preview";
        const media = document.createElement(entry.kind === "image" ? "img" : "video");
        media.src = entry.url;
        if (entry.kind === "video") { media.muted = true; media.preload = "metadata"; }
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "fb-preview-remove";
        remove.textContent = "×";
        remove.setAttribute("aria-label", "Xóa tệp");
        remove.addEventListener("click", () => { URL.revokeObjectURL(entry.url); files.splice(index, 1); renderPreviews(); });
        box.append(media, remove);
        if (entry.kind === "video") { const tag = document.createElement("span"); tag.className = "fb-preview-tag"; tag.textContent = "VIDEO"; box.appendChild(tag); }
        previews.appendChild(box);
      });
    }

    $(".fb-file").addEventListener("change", (event) => {
      showError("");
      Array.from(event.target.files || []).forEach((file) => {
        const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "";
        if (!kind) return showError(`"${file.name}" không phải ảnh hoặc video.`);
        if (files.length >= FS.LIMITS.maxFiles) return showError(`Chỉ đính kèm tối đa ${FS.LIMITS.maxFiles} tệp.`);
        const maxMB = kind === "image" ? FS.LIMITS.maxImageMB : FS.LIMITS.maxVideoMB;
        if (file.size > maxMB * 1024 * 1024) return showError(`"${file.name}" vượt quá ${maxMB}MB.`);
        files.push({ file, kind, url: URL.createObjectURL(file) });
      });
      event.target.value = "";
      renderPreviews();
    });

    function cleanup() {
      files.forEach((entry) => URL.revokeObjectURL(entry.url));
      closeForm();
    }
    overlay.addEventListener("click", (event) => { if (event.target === overlay) cleanup(); });
    $(".fb-close").addEventListener("click", cleanup);
    $(".fb-cancel").addEventListener("click", cleanup);
    document.addEventListener("keydown", function onKey(event) {
      if (!document.body.contains(overlay)) return document.removeEventListener("keydown", onKey);
      if (event.key === "Escape") { document.removeEventListener("keydown", onKey); cleanup(); }
    });

    $(".fb-submit").addEventListener("click", async () => {
      if (!rating) return showError("Vui lòng chọn số sao đánh giá.");
      const submit = $(".fb-submit");
      submit.disabled = true;
      submit.textContent = "Đang gửi...";
      try {
        const media = [];
        for (const entry of files) {
          if (entry.kind === "image") {
            const blob = await FS.compressImage(entry.file);
            media.push({ loai: "image", ten: entry.file.name.replace(/\.[^.]+$/, "") + ".jpg", tep: blob });
          } else {
            media.push({ loai: "video", ten: entry.file.name, tep: entry.file });
          }
        }
        const maLoai = (typeof getLocalProducts === "function" ? getLocalProducts().find((p) => p.maSanPham === productId)?.maLoai : "") || item.maLoai || "";
        await FS.add({
          maDanhGia: FS.recordId(orderId, productId, size),
          maDonHang: orderId,
          maSanPham: productId,
          kichCoDaChon: size,
          tenSanPham: item.tenSanPham,
          hinhAnh: item.hinhAnh || "",
          maLoai,
          maKhachHang: user.maKhachHang || null,
          hoTen: user.hoTen || user.tenDangNhap || user.thuDienTu || "",
          soSao: rating,
          binhLuan: textarea.value.trim(),
          tepDinhKem: media,
          ngayTao: new Date().toISOString(),
          trangThai: "moi",
          nguoiXuLy: null,
          ngayTiepNhan: null,
          phanHoi: null,
          daAn: false,
        });
        files.forEach((entry) => URL.revokeObjectURL(entry.url));
        closeForm();
        notifyUser("success", "Cảm ơn bạn đã đánh giá!", "Đánh giá của bạn đã được gửi tới bộ phận chăm sóc khách hàng.");
      } catch (error) {
        submit.disabled = false;
        submit.textContent = "Gửi đánh giá";
        const errorName = (error && (error.name || (error.target && error.target.error && error.target.error.name))) || "";
        showError(errorName === "ConstraintError" ? "Bạn đã đánh giá sản phẩm này rồi." : (error && error.message) || "Không gửi được đánh giá, vui lòng thử lại.");
      }
    });
  }

  function closeForm() {
    document.querySelectorAll(".fb-overlay").forEach((node) => node.remove());
    document.body.classList.remove("fb-lock");
  }

  // ---------------- Hiển thị trong lịch sử đơn hàng ----------------
  const objectUrls = [];
  function mediaThumbs(record) {
    return (record.tepDinhKem || []).map((m) => {
      const url = URL.createObjectURL(m.tep);
      objectUrls.push(url);
      return m.loai === "video"
        ? `<video class="fb-thumb" src="${esc(url)}" controls preload="metadata"></video>`
        : `<img class="fb-thumb" src="${esc(url)}" alt="${esc(m.ten || "")}" data-full="${esc(url)}">`;
    }).join("");
  }

  function renderDone(record) {
    const reply = record.phanHoi
      ? `<div class="fb-reply"><strong>Phản hồi từ cửa hàng</strong><p>${esc(record.phanHoi.noiDung).replace(/\n/g, "<br>")}</p><small>${esc(record.phanHoi.nguoiGui || "CSKH")} · ${esc(FS.formatDateTime(record.phanHoi.thoiGian))}</small></div>`
      : `<p class="fb-wait">${record.trangThai === "dangXuLy" ? `Nhân viên ${esc(record.nguoiXuLy?.hoTen || "CSKH")} đang xem xét đánh giá của bạn.` : "Đánh giá đã được ghi nhận, cửa hàng sẽ sớm phản hồi."}</p>`;
    return `<div class="fb-done">
      <div class="fb-done-head"><span class="fb-stars-static">${esc(FS.stars(record.soSao))}</span>
      <span class="fb-badge fb-st-${esc(record.trangThai)}">${esc(FS.STATUS_LABEL[record.trangThai] || record.trangThai)}</span>
      <small>${esc(FS.formatDateTime(record.ngayTao))}</small></div>
      ${record.binhLuan ? `<p class="fb-comment">${esc(record.binhLuan).replace(/\n/g, "<br>")}</p>` : ""}
      ${(record.tepDinhKem || []).length ? `<div class="fb-thumbs">${mediaThumbs(record)}</div>` : ""}
      ${reply}
    </div>`;
  }

  async function decorate(root) {
    const scope = root || document;
    const slots = Array.from(scope.querySelectorAll(".fb-slot"));
    if (!slots.length) return;
    objectUrls.splice(0).forEach((url) => URL.revokeObjectURL(url));
    let list = [];
    try { list = await FS.getAll(); } catch (error) {
      slots.forEach((slot) => { slot.innerHTML = `<span class="fb-wait">Không tải được đánh giá: ${esc(error.message)}</span>`; });
      return;
    }
    const map = new Map(list.map((record) => [record.maDanhGia, record]));
    slots.forEach((slot) => {
      const record = map.get(FS.recordId(slot.dataset.order, slot.dataset.product, slot.dataset.size || ""));
      if (record) {
        slot.innerHTML = renderDone(record);
      } else {
        slot.innerHTML = `<button type="button" class="fb-open-btn">☆ Đánh giá sản phẩm này</button>`;
        slot.querySelector(".fb-open-btn").addEventListener("click", () => openForm(slot));
      }
    });
  }

  // Phóng to ảnh khi bấm vào ảnh đính kèm.
  document.addEventListener("click", (event) => {
    const img = event.target.closest && event.target.closest("img.fb-thumb");
    if (!img) return;
    const box = document.createElement("div");
    box.className = "fb-lightbox";
    const full = document.createElement("img");
    full.src = img.dataset.full || img.src;
    full.alt = "";
    box.appendChild(full);
    box.addEventListener("click", () => box.remove());
    document.body.appendChild(box);
  });

  FS.onChange(() => { if (document.querySelector(".fb-slot")) decorate(document); });

  window.UserFeedback = { decorate, openForm };
})();
