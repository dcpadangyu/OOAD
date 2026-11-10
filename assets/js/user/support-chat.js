(function () {
  "use strict";

  const THREADS_KEY = "supportThreads";
  const HOTLINE_RAW = "0354109892";
  const HOTLINE_SHOW = "0354 109 892";
  const currentUser = () => window.UserSession?.getCurrentUser?.() || null;
  const readThreads = () => {
    try {
      const value = JSON.parse(localStorage.getItem(THREADS_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  };
  // Ghi localStorage, tránh no-incomplete (đầy quota do ảnh base64): trả về false nếu lỗi để nơi gọi xử lý.
  const writeThreads = (threads) => {
    try { localStorage.setItem(THREADS_KEY, JSON.stringify(threads)); return true; }
    catch (error) { console.error("Không ghi được supportThreads:", error); return false; }
  };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const id = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const RATE_LABELS = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Tuyệt vời"];
  // Định dạng thời gian nhắn: hôm nay chỉ hiện giờ, hôm qua ghi "Hôm qua", còn lại hiện ngày/tháng.
  function fmtTime(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return time;
    const yest = new Date(today); yest.setDate(today.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return `Hôm qua ${time}`;
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${time}`;
  }
  // Gắn thời gian nhắn vào dòng người gửi (vd. "Demo User · 14:30").
  function senderLine(item, fallback) {
    const name = esc(item.tenNguoiGui || fallback);
    const when = fmtTime(item.thoiGianGui);
    return when ? `${name} · ${when}` : name;
  }


  // ---------- Dựng danh sách tin nhắn: ngày phân cách, gom theo người gửi, avatar, giờ ----------
  function hhmm(iso) {
    const d = new Date(iso);
    return isNaN(d) ? "" : `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  function dayLabel(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Hôm nay";
    const yest = new Date(today); yest.setDate(today.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return "Hôm qua";
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }
  // opts: { isMine(m), bodyOf(m), otherName(m), esc }
  function buildMessages(list, opts) {
    const esc = opts.esc;
    const keyOf = (m) => m.loaiNguoiGui + "|" + (m.maNguoiGui || m.tenNguoiGui || "");
    let html = "";
    let prevDay = "";
    let prevKey = null;
    list.forEach((m, i) => {
      const day = new Date(m.thoiGianGui).toDateString();
      if (day !== prevDay) {
        html += `<div class="chat-day"><span>${esc(dayLabel(m.thoiGianGui))}</span></div>`;
        prevDay = day;
        prevKey = null;
      }
      if (m.loaiNguoiGui === "system") {
        html += `<div class="chat-sys"><span>${esc(m.noiDung)} · ${esc(hhmm(m.thoiGianGui))}</span></div>`;
        prevKey = null;
        return;
      }
      const key = keyOf(m);
      const next = list[i + 1];
      const sameNext = next && next.loaiNguoiGui !== "system" && new Date(next.thoiGianGui).toDateString() === day && keyOf(next) === key;
      const first = prevKey !== key;
      const last = !sameNext;
      prevKey = key;
      const mine = opts.isMine(m);
      const name = mine ? "" : opts.otherName(m);
      const words = (name || "?").trim().split(/\s+/); // tên Việt: lấy chữ cái đầu của tên gọi (từ cuối)
      const initial = esc((words[words.length - 1] || "?").charAt(0).toUpperCase() || "?");
      html += `<div class="chat-row ${mine ? "mine" : "other"}${first ? " first" : ""}${last ? " last" : ""}">`
        + (mine ? "" : `<span class="chat-avatar${first ? "" : " ghost"}">${first ? initial : ""}</span>`)
        + `<div class="chat-col">`
        + (!mine && first ? `<div class="chat-name">${esc(name)}</div>` : "")
        + `<div class="chat-bubble t-${esc(m.loaiTinNhan || "text")}">${opts.bodyOf(m)}</div>`
        + (last ? `<div class="chat-time">${esc(hhmm(m.thoiGianGui))}</div>` : "")
        + `</div></div>`;
    });
    return html;
  }

  function getThread(user) {
    const threads = readThreads();
    let thread = threads.find((item) => item.maKhachHang === user.maKhachHang && item.trangThai !== "closed");
    if (!thread) {
      thread = { maPhienChat: id("CHAT"), maKhachHang: user.maKhachHang, tenKhachHang: user.hoTen, trangThai: "open", nhanVienXuLy: null, tinNhan: [], ngayTao: new Date().toISOString(), ngayCapNhat: new Date().toISOString() };
      threads.push(thread);
      writeThreads(threads);
    }
    return thread;
  }

  // Widget KHÔNG tự tạo cuộc chat khi khách chỉ xem trang: thread được tạo lười
  // (lazy) khi khách gửi tin nhắn đầu tiên, để danh sách Admin không bị ngập cuộc trống.
  // `thread` giữ bản local để không ghi lại liên tục; null tới khi khách thực sự nhắn.
  let thread = null;

  // Trả về true nếu đã lưu; false khi ghi kho thất bại (đầy quota...) để nơi gọi thông báo cho khách.
  function addMessage(threadId, message) {
    const threads = readThreads();
    const thread = threads.find((item) => item.maPhienChat === threadId);
    if (!thread) return false;
    thread.tinNhan = Array.isArray(thread.tinNhan) ? thread.tinNhan : [];
    thread.tinNhan.push({ maTinNhan: id("MSG"), thoiGianGui: new Date().toISOString(), ...message });
    thread.ngayCapNhat = new Date().toISOString();
    if (!writeThreads(threads)) { alert("Không gửi được tin nhắn (bộ nhớ trình duyệt đã đầy). Vui lòng xóa bớt tin nhắn cũ hoặc dùng ảnh nhỏ hơn."); return false; }
    return true;
  }

  function channel(cls, ico, label, inner, href) {
    const tag = href ? "a" : "button";
    const attrs = href ? ` href="${href}" target="_blank" rel="noopener"` : ` type="button"`;
    return `<${tag} class="support-channel ${cls}"${attrs} title="${esc(label)}"><span class="support-channel-label">${esc(label)}</span><span class="support-channel-ico">${ico}</span>${inner || ""}</${tag}>`;
  }

  function init() {
    if (document.getElementById("supportChatPanel")) return;
    const user = currentUser();
    if (!user) return;
    // Không tạo cuộc chat ngay khi khách mở trang: chỉ đọc thread có sẵn (nếu đã có
    // do tin cảm ơn / tin trước đó), và tạo mới khi khách gửi tin nhắn đầu tiên.
    // Tránh việc khách lướt trang cũng sinh một cuộc trống trong danh sách Admin.
    thread = null;
    function ensureThread() {
      if (!thread || thread.trangThai === "closed") thread = getThread(user);
      return thread;
    }
    // Luôn đọc lại localStorage để lấy bản thread mới nhất (tránh biến local bị stale sau khi addMessage ghi tin).
    function resolveThread() {
      const threads = readThreads();
      let resolved = null;
      if (thread && thread.maPhienChat) {
        resolved = threads.find((t) => t.maPhienChat === thread.maPhienChat);
      }
      // Cuộc đang mở luôn được ưu tiên (khách có thể vừa bắt đầu cuộc mới sau khi cuộc cũ đã đóng).
      const open = threads.find((item) => item.maKhachHang === user.maKhachHang && item.trangThai !== "closed");
      if (open) resolved = open;
      if (!resolved) {
        const mine = threads.filter((item) => item.maKhachHang === user.maKhachHang);
        resolved = mine.sort((a, b) => String(b.ngayCapNhat).localeCompare(String(a.ngayCapNhat)))[0] || null;
      }
      if (resolved) thread = resolved; // đồng bộ biến local
      return resolved;
    }

    function existingThread() {
      return resolveThread();
    }
    thread = existingThread();
    document.body.insertAdjacentHTML("beforeend", `
      <div class="support-dock" id="supportDock">
        <div class="support-channels" id="supportChannels" hidden>
          ${channel("ch-phone", "📞", `Gọi hotline: ${HOTLINE_SHOW}`, "", `tel:${HOTLINE_RAW}`)}
          ${channel("ch-chat", "💬", "Chat với nhân viên", "", "")}
        </div>
        <button class="support-chat-launcher" id="supportChatLauncher">💬 Hỗ trợ<span class="support-chat-badge" id="supportChatBadge" hidden></span></button>
      </div>
      <section class="support-chat-panel" id="supportChatPanel" aria-label="Chat hỗ trợ khách hàng">
        <div class="support-chat-head">
          <span class="support-chat-avatar">💬</span>
          <div class="support-chat-head-text"><strong>OOAD Shop</strong><span class="support-chat-status" id="supportChatStatus">Đang chờ nhân viên tiếp nhận</span></div>
          <button id="supportChatClose" aria-label="Đóng">×</button>
        </div>
        <div class="support-chat-messages" id="supportChatMessages"></div>
        <div class="support-chat-closed" id="supportChatClosed" hidden>Cuộc hội thoại đã kết thúc. Nhắn tin bên dưới để bắt đầu cuộc hội thoại mới.</div>
        <div class="support-chat-tools">
          <button type="button" id="supportChatImage" title="Gửi ảnh (tối đa 2MB)"><span>📷</span> Ảnh</button>
          <button type="button" id="supportChatProduct" title="Gửi link sản phẩm theo mã"><span>🛍️</span> Sản phẩm</button>
          <button type="button" id="supportChatRate" title="Đánh giá sản phẩm đã nhận"><span>⭐</span> Đánh giá</button>
          <input type="file" id="supportChatFile" accept="image/*" hidden>
        </div>
        <form class="support-chat-compose" id="supportChatForm">
          <input id="supportChatInput" placeholder="Nhập tin nhắn..." maxlength="1000" autocomplete="off">
          <button type="button" id="supportChatCloseForm" class="support-chat-compose-close" hidden>Đóng</button>
          <button type="submit" class="support-chat-send" aria-label="Gửi">➤</button>
        </form>
        <div class="support-rate-panel" id="supportRatePanel" hidden>
          <div class="support-rate-head"><strong>Đánh giá sản phẩm vừa mua</strong><button type="button" id="supportRateClose" aria-label="Đóng">×</button></div>
          <div class="support-rate-body" id="supportRateBody"></div>
          <div class="support-rate-foot"><button type="button" id="supportRateSubmit">Gửi đánh giá</button></div>
        </div>
      </section>
    `);
    const panel = document.getElementById("supportChatPanel");
    const dock = document.getElementById("supportDock");
    const channels = document.getElementById("supportChannels");
    const messages = document.getElementById("supportChatMessages");
    const badge = document.getElementById("supportChatBadge");
    // Chấm đỏ trên nút Hỗ trợ báo tin mới từ shop/nhân viên (vd. tin cảm ơn sau khi đặt hàng).
    // Mở panel chat là đánh dấu đã đọc và chấm đỏ biến mất.
    // Nút Đánh giá chỉ hiện khi còn sản phẩm đã giao chưa chấm; chấm xong hết thì ẩn hẳn.
    const ratedKeys = new Set();
    const rateKey = (order, it) => `${order.maDonHang}|${it.maSanPham}|${it.kichCoDaChon || ""}`;
    const getFast = (p) => Promise.race([p.catch(() => null), new Promise((r) => setTimeout(() => r(null), 2000))]);
    function refreshRateButton() {
      const btn = document.getElementById("supportChatRate");
      if (!btn) return;
      const order = getDeliveredOrder();
      if (!order) { btn.style.display = "none"; return; }
      const allDone = (order.chiTiet || []).every((it) => ratedKeys.has(rateKey(order, it)));
      btn.style.display = allDone ? "none" : "";
    }
    async function seedRatedKeys() {
      const order = getDeliveredOrder();
      if (!order) { refreshRateButton(); return; }
      const FS = await loadFeedbackStore().catch(() => null);
      if (FS) {
        await Promise.all((order.chiTiet || []).map(async (it) => {
          const rec = await getFast(FS.get(FS.recordId(order.maDonHang, it.maSanPham, it.kichCoDaChon || "")));
          if (rec) ratedKeys.add(rateKey(order, it));
        }));
      }
      refreshRateButton();
    }
    const updateBadge = () => {
      if (!badge) return;
      const threads = readThreads();
      const fresh = resolveThread();
      if (!fresh) { badge.hidden = true; return; }
      const msgs = fresh.tinNhan || [];
      const lastIdx = fresh.maTinNhanKhachDaDoc ? msgs.findIndex((m) => m.maTinNhan === fresh.maTinNhanKhachDaDoc) : -1;
      const unread = msgs.filter((m, i) => i > lastIdx && m.loaiNguoiGui !== "customer").length;
      if (panel.classList.contains("is-open")) {
        if (unread > 0 && msgs.length) {
          fresh.maTinNhanKhachDaDoc = msgs[msgs.length - 1].maTinNhan;
          writeThreads(threads);
        }
        badge.hidden = true;
        return;
      }
      badge.textContent = unread > 9 ? "9+" : String(unread);
      badge.hidden = unread === 0;
    };
    // Sau khi khách tự gửi tin (chữ/ảnh/link/đánh giá): đánh dấu đã đọc đến tin cuối cùng
    // (tin của chính khách) -> chấm đỏ biến mất ngay, không cần phải mở panel chat đọc lại.
    const markOwnLastRead = () => {
      const threads = readThreads();
      const thr = threads.find((t) => t && t.maPhienChat === ensureThread().maPhienChat);
      if (thr && thr.tinNhan && thr.tinNhan.length) {
        thr.maTinNhanKhachDaDoc = thr.tinNhan[thr.tinNhan.length - 1].maTinNhan;
        writeThreads(threads); // ghi lại toàn bộ mảng, không ghi đơn lẻ 1 object
      }
    };
    const TOPICS = ["Kiểm tra tình trạng đơn hàng", "Tư vấn chọn size giày", "Hỏi về mã giảm giá", "Đổi / trả hàng"];
    const welcomeHtml = `<div class="support-chat-welcome">
        <p>Xin chào! OOAD Shop có thể giúp gì cho bạn?</p>
        <div class="support-chat-topics">${TOPICS.map((t) => `<button type="button" data-topic="${esc(t)}">${esc(t)}</button>`).join("")}</div>
      </div>`;
    const render = () => {
      const fresh = resolveThread();
      const closed = !!fresh && fresh.trangThai === "closed";
      document.getElementById("supportChatStatus").textContent = closed
        ? "Hội thoại đã kết thúc"
        : fresh && fresh.nhanVienXuLy
          ? `Đang hỗ trợ: ${fresh.nhanVienXuLy}`
          : "Đang chờ nhân viên tiếp nhận";
      document.getElementById("supportChatClosed").hidden = !closed;
      panel.dataset.state = closed ? "closed" : (fresh && fresh.nhanVienXuLy ? "handling" : "waiting");
      const hasMessages = !!fresh && (fresh.tinNhan || []).length > 0;
      const bodyOf = (item) => item.loaiTinNhan === "image"
        ? `<img src="${esc(item.duLieuAnh)}" alt="Ảnh gửi trong chat">`
        : item.loaiTinNhan === "product"
          ? `<a class="support-chat-product" href="${esc(item.duongDan)}" target="_blank" rel="noopener">🛍️ ${esc(item.tenSanPham)}</a>`
          : item.loaiTinNhan === "rating"
            ? `<div class="support-chat-rating">${(item.chiTiet || []).map((r) => `<div>${esc(r.tenSanPham)}: <span class="support-chat-stars">${"★".repeat(Number(r.soSao) || 0)}${"☆".repeat(Math.max(0, 5 - (Number(r.soSao) || 0)))}</span> <small>(${r.soSao}/5)</small>${r.binhLuan ? `<div class="support-chat-rating-comment">${esc(r.binhLuan).replace(/\n/g, "<br>")}</div>` : ""}</div>`).join("")}</div>`
            : esc(item.noiDung).replace(/\n/g, "<br>");
      messages.innerHTML = hasMessages
        ? buildMessages(fresh.tinNhan || [], {
          esc,
          bodyOf,
          isMine: (m) => m.loaiNguoiGui === "customer",
          otherName: (m) => m.tenNguoiGui || "Hỗ trợ",
        })
        : "";
      // Chưa có tin nhắn của khách -> gợi ý chủ đề để bắt đầu nhanh
      const hasCustomerMsg = hasMessages && fresh.tinNhan.some((m) => m.loaiNguoiGui === "customer");
      if (!hasCustomerMsg && !closed) messages.insertAdjacentHTML("beforeend", welcomeHtml);
      messages.scrollTop = messages.scrollHeight;
      updateBadge();
      refreshRateButton();
    };
    messages.addEventListener("click", (event) => {
      const topic = event.target.closest("[data-topic]");
      if (!topic) return;
      addMessage(ensureThread().maPhienChat, { loaiNguoiGui: "customer", maNguoiGui: user.maKhachHang, tenNguoiGui: user.hoTen, loaiTinNhan: "text", noiDung: topic.dataset.topic });
      render(); markOwnLastRead();
    });
    document.getElementById("supportChatLauncher").onclick = () => { channels.hidden = !channels.hidden; };
    document.querySelector(".support-channel.ch-chat").onclick = () => {
      channels.hidden = true;
      panel.classList.add("is-open");
      render();
    };
    document.addEventListener("click", (event) => {
      if (!channels.hidden && !dock.contains(event.target)) channels.hidden = true;
    });
    document.getElementById("supportChatClose").onclick = () => panel.classList.remove("is-open");
    document.getElementById("supportChatCloseForm").onclick = () => panel.classList.remove("is-open");
    document.getElementById("supportChatForm").onsubmit = (event) => {
      event.preventDefault();
      const input = document.getElementById("supportChatInput");
      if (!input.value.trim()) return;
      addMessage(ensureThread().maPhienChat, { loaiNguoiGui: "customer", maNguoiGui: user.maKhachHang, tenNguoiGui: user.hoTen, loaiTinNhan: "text", noiDung: input.value.trim() });
      input.value = ""; render(); markOwnLastRead();
    };
    document.getElementById("supportChatImage").onclick = () => document.getElementById("supportChatFile").click();
    document.getElementById("supportChatRate").onclick = openRatePanel;
    document.getElementById("supportRateClose").onclick = () => { document.getElementById("supportRatePanel").hidden = true; };
    function loadFeedbackStore() {
      return new Promise((resolve) => {
        if (window.FeedbackStore) return resolve(window.FeedbackStore);
        const script = document.createElement("script");
        script.src = "database/feedback-store.js?v=vi2";
        script.onload = () => resolve(window.FeedbackStore || null);
        script.onerror = () => resolve(null);
        document.head.appendChild(script);
      });
    }
    function getDeliveredOrder() {
      let list = [];
      try { list = JSON.parse(localStorage.getItem("DanhSachDatHang") || "[]"); } catch (_) { list = []; }
      const mine = (Array.isArray(list) ? list : []).filter((o) => {
        if (!o || o.trangThai !== "thanh-cong") return false;
        if (user.maKhachHang && o.maKhachHang === user.maKhachHang) return true;
        if (o.khachHang && o.khachHang.maKhachHang === user.maKhachHang) return true;
        return !!(user.thuDienTu && o.khachHang && o.khachHang.thuDienTu === user.thuDienTu);
      });
      mine.sort((a, b) => String(b.ngayGiao || b.ngayDat || "").localeCompare(String(a.ngayGiao || a.ngayDat || "")));
      return mine[0] || null;
    }
    const RATE_TAGS_POS = ["Chất lượng sản phẩm tốt", "Phí vận chuyển thấp", "Giao hàng nhanh", "Sản phẩm chính hãng", "Đúng như mô tả", "Giá sản phẩm thấp", "Đóng gói cẩn thận", "Form giày thoải mái", "Đế êm, đi thoải mái"];
    const RATE_TAGS_NEG = ["Chất lượng sản phẩm kém", "Giao hàng chậm", "Không đúng như mô tả", "Đóng gói chưa tốt", "Giá hơi cao"];
    function tagsFor(stars) { return stars <= 2 ? RATE_TAGS_NEG : RATE_TAGS_POS; }
    async function openRatePanel() {
      const panel = document.getElementById("supportRatePanel");
      const body = document.getElementById("supportRateBody");
      panel.hidden = false;
      const order = getDeliveredOrder();
      if (!order || !(order.chiTiet || []).length) {
        body.innerHTML = `<p class="support-rate-note">Bạn chỉ có thể đánh giá sau khi đơn hàng được giao thành công.</p>`;
        document.getElementById("supportRateSubmit").disabled = true;
        return;
      }
      const items = order.chiTiet;
      const FS = await loadFeedbackStore();
      const picks = {};
      const chosenTags = {};
      const texts = {};
      // Chờ tối đa 2 giây cho kho đánh giá; quá hạn thì coi như chưa đánh giá (vẫn cho chấm sao, ghi review sẽ bỏ qua nếu trùng).
      const records = await Promise.all(items.map((it) => FS ? getFast(FS.get(FS.recordId(order.maDonHang, it.maSanPham, it.kichCoDaChon || ""))) : Promise.resolve(null)));
      records.forEach((rec, i) => { if (rec) ratedKeys.add(rateKey(order, items[i])); });
      // Sản phẩm đã đánh giá trước đó (khóa): không đưa vào lần gửi mới để khỏi trùng tin.
      const lockedIdx = new Set(records.map((rec, i) => (rec ? i : -1)).filter((i) => i >= 0));
      body.innerHTML = `<p class="support-rate-intro">Phản hồi của bạn sẽ giúp cải thiện OOAD Shop. Bạn không cần cung cấp bất kỳ thông tin cá nhân nào.</p>` + items.map((it, i) => {
        const rec = records[i];
        if (rec) picks[i] = Number(rec.soSao) || 0;
        const locked = !!rec;
        return `<div class="support-rate-item" data-i="${i}">
          <div class="support-rate-product">
            <img class="support-rate-thumb" src="${esc(it.hinhAnh || "")}" alt="" onerror="this.onerror=null;this.src='assets/img/no-image.png'">
            <div class="support-rate-product-name">${esc(it.tenSanPham)}${it.kichCoDaChon ? ` <span>· size ${esc(it.kichCoDaChon)}</span>` : ""}</div>
          </div>
          <div class="support-rate-question">${locked ? `Bạn đã đánh giá sản phẩm này ${rec.soSao}/5` : "Dựa trên trải nghiệm với sản phẩm này, bạn thấy thế nào?"}</div>
          <div class="support-rate-stars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="support-rate-star${n <= (picks[i] || 0) ? " on" : ""}" data-i="${i}" data-v="${n}"${locked ? " disabled" : ""}>★</button>`).join("")}</div>
          <div class="support-rate-scale"><span>Chắc chắn sẽ không</span><span>${picks[i] ? `${picks[i]}/5 · ${RATE_LABELS[picks[i]]}` : ""}</span><span>Chắc chắn sẽ</span></div>
          <div class="support-rate-tags" data-i="${i}"></div>
          <div class="support-rate-ask">Bạn có nhận xét gì về sản phẩm này không?</div>
          <div class="support-rate-box-wrap"><textarea class="support-rate-box" data-i="${i}" rows="2" maxlength="1000" placeholder="Chia sẻ cảm nhận của bạn..."${locked ? " disabled" : ""}></textarea><span class="support-rate-counter" data-i="${i}">0/1000</span></div>
        </div>`;
      }).join("");
      const submitBtn = document.getElementById("supportRateSubmit");
      // Chỉ tính sản phẩm CHƯA khóa (chưa đánh giá) để bật nút Gửi.
      const refreshSubmit = () => { submitBtn.disabled = !Object.keys(picks).some((k) => picks[k] > 0 && !lockedIdx.has(Number(k))); };
      const renderTags = (i) => {
        const box = body.querySelector(`.support-rate-tags[data-i="${i}"]`);
        if (!box) return;
        const v = Number(picks[i]) || 0;
        const tags = v ? tagsFor(v) : [];
        chosenTags[i] = chosenTags[i] || new Set();
        [...chosenTags[i]].forEach((t) => { if (!tags.includes(t)) chosenTags[i].delete(t); });
        box.innerHTML = tags.map((t) => `<button type="button" class="support-rate-chip${chosenTags[i].has(t) ? " on" : ""}" data-i="${i}" data-tag="${esc(t)}">${esc(t)}</button>`).join("");
        box.querySelectorAll(".support-rate-chip").forEach((chip) => {
          chip.addEventListener("click", () => {
            const tag = chip.dataset.tag;
            if (chosenTags[i].has(tag)) chosenTags[i].delete(tag); else chosenTags[i].add(tag);
            chip.classList.toggle("on");
          });
        });
      };
      body.querySelectorAll(".support-rate-star").forEach((star) => {
        star.addEventListener("click", () => {
          const i = star.dataset.i;
          const v = Number(star.dataset.v);
          picks[i] = v;
          body.querySelectorAll(`.support-rate-star[data-i="${i}"]`).forEach((s) => s.classList.toggle("on", Number(s.dataset.v) <= v));
          const item = star.closest(".support-rate-item");
          const scale = item.querySelector(".support-rate-scale");
          scale.children[1].textContent = `${v}/5 · ${RATE_LABELS[v]}`;
          renderTags(i);
          refreshSubmit();
        });
      });
      body.querySelectorAll(".support-rate-box").forEach((boxEl) => {
        boxEl.addEventListener("input", () => {
          texts[boxEl.dataset.i] = boxEl.value;
          body.querySelector(`.support-rate-counter[data-i="${boxEl.dataset.i}"]`).textContent = `${boxEl.value.length}/1000`;
        });
      });
      refreshSubmit();
      submitBtn.onclick = () => submitRating(order, picks, chosenTags, texts, lockedIdx);
    }
    async function submitRating(order, picks, chosenTags, texts, lockedIdx = new Set()) {
      const items = order.chiTiet || [];
      const ratedIdx = [];
      for (let i = 0; i < items.length; i++) {
        const v = Number(picks[i]) || 0;
        if (!v || lockedIdx.has(i)) continue; // bỏ qua sản phẩm đã đánh giá trước đó (khóa), tránh gửi trùng tin
        ratedIdx.push(i);
      }
      if (!ratedIdx.length) { alert("Vui lòng chọn số sao cho ít nhất một sản phẩm."); return; }
      const makeRating = (i) => {
        const v = Number(picks[i]) || 0;
        const tags = chosenTags[i] ? [...chosenTags[i]] : [];
        const note = String(texts[i] || "").trim();
        return { tenSanPham: items[i].tenSanPham, soSao: v, binhLuan: [tags.join(", "), note].filter(Boolean).join("\n") };
      };
      // Đánh dấu các sản phẩm vừa chấm vào ratedKeys theo đúng dòng hàng (maSP + size), không theo tên.
      ratedIdx.forEach((i) => ratedKeys.add(rateKey(order, items[i])));
      // Gửi tin đánh giá vào khung chat trước (đồng bộ, không chờ kho đánh giá).
      addMessage(ensureThread().maPhienChat, { loaiNguoiGui: "customer", maNguoiGui: user.maKhachHang, tenNguoiGui: user.hoTen, loaiTinNhan: "rating", noiDung: "Khách đã đánh giá sản phẩm vừa mua", chiTiet: ratedIdx.map(makeRating) });
      document.getElementById("supportRatePanel").hidden = true;
      render();
      markOwnLastRead();
      // Lưu review vào hệ thống đánh giá (FeedbackStore) ở nền; lỗi (đã đánh giá trước, không có IndexedDB...) không ảnh hưởng khung chat.
      loadFeedbackStore().then(async (FS) => {
        if (!FS) return;
        for (const i of ratedIdx) {
          const v = Number(picks[i]) || 0;
          const it = items[i];
          try {
            await FS.add({
              maDanhGia: FS.recordId(order.maDonHang, it.maSanPham, it.kichCoDaChon || ""),
              maDonHang: order.maDonHang,
              maSanPham: it.maSanPham,
              kichCoDaChon: it.kichCoDaChon || "",
              tenSanPham: it.tenSanPham,
              hinhAnh: it.hinhAnh || "",
              maLoai: it.maLoai || "",
              maKhachHang: user.maKhachHang || null,
              hoTen: user.hoTen || user.tenDangNhap || user.thuDienTu || "",
              soSao: v,
              binhLuan: makeRating(i).binhLuan,
              tepDinhKem: [],
              ngayTao: new Date().toISOString(),
              trangThai: "moi",
              nguoiXuLy: null,
              ngayTiepNhan: null,
              phanHoi: null,
              daAn: false,
            });
          } catch (_) { /* sản phẩm này đã được đánh giá */ }
        }
      }).catch(() => {});
    }
    document.getElementById("supportChatFile").onchange = () => {
      const file = document.getElementById("supportChatFile").files[0];
      if (!file || file.size > 2 * 1024 * 1024) { alert("Ảnh phải nhỏ hơn 2MB."); return; }
      const reader = new FileReader();
      reader.onload = () => { addMessage(ensureThread().maPhienChat, { loaiNguoiGui: "customer", maNguoiGui: user.maKhachHang, tenNguoiGui: user.hoTen, loaiTinNhan: "image", duLieuAnh: reader.result, noiDung: file.name }); render(); markOwnLastRead(); };
      reader.readAsDataURL(file);
    };
    document.getElementById("supportChatProduct").onclick = () => {
      const code = prompt("Nhập mã sản phẩm cần gửi (ví dụ SH-001):");
      if (!code) return;
      let products = []; try { products = JSON.parse(localStorage.getItem("productsLocal") || "[]"); } catch (_) {}
      const product = products.find((item) => item.maSanPham === code.trim());
      if (!product) { alert("Không tìm thấy sản phẩm."); return; }
      addMessage(ensureThread().maPhienChat, { loaiNguoiGui: "customer", maNguoiGui: user.maKhachHang, tenNguoiGui: user.hoTen, loaiTinNhan: "product", maSanPham: product.maSanPham, tenSanPham: product.tenSanPham, duongDan: `pages/home.html?search=${encodeURIComponent(product.tenSanPham)}#sanpham` });
      render(); markOwnLastRead();
    };
    // Ảnh tải xong làm nội dung cao thêm: cuộn lại xuống tin mới nhất
    messages.addEventListener("load", (event) => { if (event.target && event.target.tagName === "IMG") messages.scrollTop = messages.scrollHeight; }, true);
    window.addEventListener("storage", (event) => { if (event.key === THREADS_KEY) render(); });
    render();
    seedRatedKeys();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
