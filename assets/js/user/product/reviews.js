// ==================== ĐÁNH GIÁ SẢN PHẨM (TRANG CHỦ) ====================
// - Popup chi tiết sản phẩm: điểm trung bình, phân bố sao, danh sách đánh giá (kèm ảnh/video, phản hồi của cửa hàng).
// - Thẻ sản phẩm: hiện điểm trung bình nếu đã có đánh giá.
(function () {
  "use strict";

  const FS = window.FeedbackStore;
  if (!FS) return;
  const esc = FS.escapeHtml;
  const PAGE = 5;
  const urls = [];

  function visible(list, productId) {
    return list.filter((item) => item.maSanPham === productId && !item.daAn);
  }

  function mediaHtml(record) {
    return (record.tepDinhKem || []).map((m) => {
      const url = URL.createObjectURL(m.tep);
      urls.push(url);
      return m.loai === "video"
        ? `<video class="pr-thumb" src="${url}" controls preload="metadata"></video>`
        : `<img class="pr-thumb" src="${url}" alt="" data-full="${url}">`;
    }).join("");
  }

  function reviewHtml(record) {
    const reply = record.phanHoi
      ? `<div class="pr-reply"><strong>Phản hồi từ OOAD:</strong> ${esc(record.phanHoi.noiDung).replace(/\n/g, "<br>")}</div>`
      : "";
    return `<article class="pr-item">
      <div class="pr-head"><span class="pr-stars">${FS.stars(record.soSao)}</span><strong>${esc(FS.maskName(record.hoTen))}</strong><small>${esc(FS.formatDateTime(record.ngayTao))}</small></div>
      ${record.binhLuan ? `<p class="pr-comment">${esc(record.binhLuan).replace(/\n/g, "<br>")}</p>` : ""}
      ${(record.tepDinhKem || []).length ? `<div class="pr-media">${mediaHtml(record)}</div>` : ""}
      ${reply}
    </article>`;
  }

  async function render(container, productId) {
    if (!container) return;
    container.innerHTML = `<h3>Đánh giá từ khách hàng</h3><p class="pr-empty">Đang tải đánh giá...</p>`;
    let list;
    try { list = visible(await FS.getAll(), productId); } catch (error) {
      container.innerHTML = `<h3>Đánh giá từ khách hàng</h3><p class="pr-empty">Không tải được đánh giá.</p>`;
      return;
    }
    urls.splice(0).forEach((url) => URL.revokeObjectURL(url));
    if (!list.length) {
      container.innerHTML = `<h3>Đánh giá từ khách hàng</h3><p class="pr-empty">Chưa có đánh giá nào. Hãy mua và là người đầu tiên đánh giá sản phẩm này!</p>`;
      return;
    }
    const stats = FS.summarize(list);
    let filter = "all";
    let shown = PAGE;

    function paint() {
      const filtered = list.filter((item) => filter === "all" || (filter === "media" ? (item.tepDinhKem || []).length : Number(item.soSao) === Number(filter)));
      container.innerHTML = `<h3>Đánh giá từ khách hàng</h3>
        <div class="pr-summary">
          <div class="pr-score"><strong>${stats.avg.toFixed(1)}</strong><span class="pr-stars">${FS.stars(stats.avg)}</span><small>${stats.total} đánh giá</small></div>
          <div class="pr-bars">${[5, 4, 3, 2, 1].map((n) => `<div class="pr-bar"><span>${n}★</span><i><b style="width:${(stats.dist[n] / stats.total) * 100}%"></b></i><em>${stats.dist[n]}</em></div>`).join("")}</div>
        </div>
        <div class="pr-filters">${[["all", "Tất cả"], ["media", `Có ảnh/video (${stats.withMedia})`], ["5", "5★"], ["4", "4★"], ["3", "3★"], ["2", "2★"], ["1", "1★"]].map(([value, label]) => `<button type="button" class="pr-filter${filter === value ? " active" : ""}" data-filter="${value}">${label}</button>`).join("")}</div>
        <div class="pr-list">${filtered.slice(0, shown).map(reviewHtml).join("") || `<p class="pr-empty">Không có đánh giá phù hợp.</p>`}</div>
        ${filtered.length > shown ? `<button type="button" class="pr-more">Xem thêm ${filtered.length - shown} đánh giá</button>` : ""}`;
      container.querySelectorAll(".pr-filter").forEach((button) => button.addEventListener("click", () => { filter = button.dataset.filter; shown = PAGE; paint(); }));
      const more = container.querySelector(".pr-more");
      if (more) more.addEventListener("click", () => { shown += PAGE; paint(); });
    }
    paint();
  }

  // Điểm trung bình trên thẻ sản phẩm.
  async function decorateCards() {
    const cards = Array.from(document.querySelectorAll(".product-card[data-product-id]"));
    if (!cards.length) return;
    let list = [];
    try { list = (await FS.getAll()).filter((item) => !item.daAn); } catch (_) { return; }
    const byProduct = {};
    list.forEach((item) => {
      const entry = byProduct[item.maSanPham] || (byProduct[item.maSanPham] = { sum: 0, count: 0 });
      entry.sum += Number(item.soSao) || 0;
      entry.count += 1;
    });
    cards.forEach((card) => {
      card.querySelector(".card-rating")?.remove();
      const entry = byProduct[card.dataset.productId];
      if (!entry) return;
      const badge = document.createElement("div");
      badge.className = "card-rating";
      badge.innerHTML = `<span>★</span> ${(entry.sum / entry.count).toFixed(1)} <small>(${entry.count})</small>`;
      card.appendChild(badge);
    });
  }

  document.addEventListener("click", (event) => {
    const img = event.target.closest && event.target.closest("img.pr-thumb");
    if (!img) return;
    const box = document.createElement("div");
    box.className = "fb-lightbox";
    box.innerHTML = `<img src="${img.dataset.full || img.src}" alt="">`;
    box.addEventListener("click", () => box.remove());
    document.body.appendChild(box);
  });

  FS.onChange(() => {
    decorateCards();
    document.querySelectorAll(".product-reviews[data-product]").forEach((node) => render(node, node.dataset.product));
  });

  window.ProductReviews = { render, decorateCards };
})();
