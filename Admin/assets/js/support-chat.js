// ==================== HỖ TRỢ KHÁCH HÀNG (ADMIN / CSKH) ====================
// Dữ liệu: localStorage "supportThreads" (dùng chung với widget chat của khách).
// Vòng đời một cuộc hội thoại:
//   Chờ tiếp nhận (chưa có người phụ trách) -> Đang xử lý (nhân viên đã tiếp nhận) -> Đã đóng.
//   Khách nhắn lại sau khi đã đóng sẽ mở cuộc hội thoại mới (xử lý bên widget khách).
(function () {
  "use strict";
  const KEY = "supportThreads";

  const QUICK_REPLIES = [
    "Xin chào anh/chị, OOAD Shop có thể hỗ trợ gì cho mình ạ?",
    "Anh/chị vui lòng cho shop xin mã đơn hàng để kiểm tra ạ.",
    "Shop đã ghi nhận và đang kiểm tra, anh/chị vui lòng chờ trong giây lát ạ.",
    "Cảm ơn anh/chị đã liên hệ OOAD Shop. Nếu cần hỗ trợ thêm, anh/chị cứ nhắn cho shop nhé!",
  ];

  const ORDER_STATUS = {
    "cho-xac-nhan": "Chờ xác nhận",
    "dang-giao": "Đang giao",
    "thanh-cong": "Đã giao",
    "da-huy": "Đã hủy",
  };

  let selectedId = null;
  let filter = "all"; // all | waiting | handling | closed
  let keyword = "";

  // ---------- Kho dữ liệu ----------
  const readJson = (key) => {
    try { const v = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(v) ? v : []; }
    catch (_) { return []; }
  };
  const read = () => readJson(KEY);
  // Ghi localStorage; trả về false nếu lỗi (đầy quota do ảnh base64) để nơi gọi báo cho nhân viên.
  const write = (value) => {
    try { localStorage.setItem(KEY, JSON.stringify(value)); return true; }
    catch (error) { console.error("Không ghi được supportThreads:", error); return false; }
  };
  // Đọc -> sửa 1 cuộc hội thoại -> ghi lại. Trả về true nếu đã lưu.
  function mutate(threadId, fn) {
    const threads = read();
    const thread = threads.find((t) => t && t.maPhienChat === threadId);
    if (!thread) return false;
    fn(thread);
    thread.ngayCapNhat = new Date().toISOString();
    if (!write(threads)) { alert("Không lưu được (bộ nhớ trình duyệt đã đầy). Hãy dùng ảnh nhỏ hơn hoặc xóa bớt dữ liệu cũ."); return false; }
    return true;
  }

  // ---------- Tiện ích ----------
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const newId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const money = (v) => (Number(v) || 0).toLocaleString("vi-VN") + "đ";
  const pad = (n) => String(n).padStart(2, "0");
  // Hôm nay chỉ hiện giờ, hôm qua ghi "Hôm qua", còn lại hiện ngày/tháng/năm.
  function fmtTime(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return time;
    const yest = new Date(today); yest.setDate(today.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return `Hôm qua ${time}`;
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${time}`;
  }
  // Giờ ngắn cho danh sách: hôm nay -> giờ, khác -> dd/mm.
  function fmtShort(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    if (d.toDateString() === new Date().toDateString()) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  }
  const staffInfo = () => {
    const a = window.adminSession?.getCurrentAdmin?.() || {};
    const username = a.username || "admin";
    return { username, name: a.fullName || username };
  };
  const getProducts = () => readJson("productsLocal");

  // ---------- Trạng thái nghiệp vụ ----------
  const stateOf = (t) => (t.trangThai === "closed" ? "closed" : t.nhanVienXuLy ? "handling" : "waiting");
  const STATE_LABEL = { waiting: "Chờ tiếp nhận", handling: "Đang xử lý", closed: "Đã đóng" };
  // Số tin của khách mà nhân viên chưa đọc.
  function unreadOf(t) {
    if (t.trangThai === "closed") return 0; // cuộc đã kết thúc không còn việc chờ xử lý
    const msgs = t.tinNhan || [];
    const idx = t.maTinNhanNhanVienDaDoc ? msgs.findIndex((m) => m.maTinNhan === t.maTinNhanNhanVienDaDoc) : -1;
    return msgs.filter((m, i) => i > idx && m.loaiNguoiGui === "customer").length;
  }
  // Cuộc chỉ có tin hệ thống (vd. tin cảm ơn) chưa phải yêu cầu hỗ trợ -> không đưa vào hàng đợi của nhân viên.
  const hasConversation = (t) => !!t && (t.tinNhan || []).some((m) => m.loaiNguoiGui !== "system");
  const lastMessage = (t) => (t.tinNhan || [])[(t.tinNhan || []).length - 1] || null;
  function previewOf(m) {
    if (!m) return "Chưa có tin nhắn";
    const who = m.loaiNguoiGui === "customer" ? "" : "Bạn: ";
    if (m.loaiTinNhan === "image") return `${who}[Hình ảnh]`;
    if (m.loaiTinNhan === "product") return `${who}[Sản phẩm] ${m.tenSanPham || ""}`;
    if (m.loaiTinNhan === "rating") return `${who}[Đánh giá sản phẩm]`;
    return `${who}${m.noiDung || ""}`;
  }
  function visibleThreads() {
    const kw = keyword.trim().toLowerCase();
    return read()
      .filter(hasConversation)
      .filter((t) => filter === "all" || stateOf(t) === filter)
      .filter((t) => !kw || `${t.tenKhachHang || ""} ${t.maKhachHang || ""}`.toLowerCase().includes(kw))
      .sort((a, b) => {
        // Chưa đóng lên trước; trong mỗi nhóm, mới cập nhật nhất lên trước.
        const closedDiff = (stateOf(a) === "closed") - (stateOf(b) === "closed");
        return closedDiff || String(b.ngayCapNhat).localeCompare(String(a.ngayCapNhat));
      });
  }

  // ---------- Thông tin khách ----------
  function customerCard(t) {
    const user = readJson("userList").find((u) => u && u.maKhachHang === t.maKhachHang) || {};
    const orders = readJson("DanhSachDatHang")
      .filter((o) => o && (o.maKhachHang === t.maKhachHang || (o.khachHang && o.khachHang.maKhachHang === t.maKhachHang)))
      .sort((a, b) => String(b.ngayDat).localeCompare(String(a.ngayDat)));
    const info = [user.maKH || t.maKhachHang, user.soDienThoai, user.thuDienTu].filter(Boolean).map(esc).join(" · ");
    const chips = orders.slice(0, 3).map((o) => `<span class="sa-ochip" title="${esc(money(o.tongTien))}"><b>${esc(o.maDonHang)}</b> ${esc(ORDER_STATUS[o.trangThai] || o.trangThai || "")} · ${esc(money(o.tongTien))}</span>`).join("");
    return `<div class="sa-cust-line"><span>${info}</span><span class="sa-ocount">${orders.length ? orders.length + " đơn hàng" : "Chưa có đơn hàng"}</span></div>${chips ? `<div class="sa-cust-chips">${chips}</div>` : ""}`;
  }

  // ---------- Hiển thị tin nhắn ----------
  function bodyOf(item) {
    if (item.loaiTinNhan === "image") return `<img src="${esc(item.duLieuAnh)}" alt="Ảnh gửi trong chat">`;
    if (item.loaiTinNhan === "product") return `<a href="${esc(item.duongDan)}" target="_blank" rel="noopener">🛍️ ${esc(item.tenSanPham)}</a>`;
    if (item.loaiTinNhan === "rating") {
      return `<div class="sa-rating">${(item.chiTiet || []).map((r) => {
        const n = Number(r.soSao) || 0;
        return `<div>${esc(r.tenSanPham)}: <span class="sa-stars">${"★".repeat(n)}${"☆".repeat(Math.max(0, 5 - n))}</span> <small>(${n}/5)</small>${r.binhLuan ? `<div class="sa-rating-comment">${esc(r.binhLuan).replace(/\n/g, "<br>")}</div>` : ""}</div>`;
      }).join("")}</div>`;
    }
    return esc(item.noiDung).replace(/\n/g, "<br>");
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

  // ---------- Khởi tạo giao diện ----------
  function init() {
    const root = document.getElementById("supportAdminRoot");
    if (!root || root.dataset.bound) return;
    root.dataset.bound = "1";
    root.innerHTML = `
      <div class="sa-layout">
        <aside class="sa-side">
          <div class="sa-search"><input id="saSearch" type="search" placeholder="Tìm theo tên hoặc mã khách..." autocomplete="off"></div>
          <div class="sa-tabs" id="saTabs"></div>
          <div class="sa-list" id="saList"></div>
        </aside>
        <section class="sa-chat">
          <header class="sa-head">
            <div class="sa-head-info"><strong id="saTitle">Chọn một cuộc trò chuyện</strong><span id="saSub"></span></div>
            <div class="sa-head-actions" id="saActions"></div>
          </header>
          <div class="sa-cust" id="saCust" hidden></div>
          <div class="sa-messages" id="saMessages"><p class="sa-empty">Chưa có cuộc trò chuyện nào được chọn.</p></div>
          <div class="sa-notice" id="saNotice" hidden></div>
          <div class="sa-quick" id="saQuick"></div>
          <div class="sa-tools">
            <button type="button" id="saImage">🖼️ Ảnh</button>
            <button type="button" id="saProduct">🛍️ Link sản phẩm</button>
            <input id="saFile" type="file" accept="image/*" hidden>
          </div>
          <form class="sa-compose" id="saForm">
            <input id="saInput" maxlength="1000" placeholder="Nhập nội dung trả lời khách hàng..." autocomplete="off" disabled>
            <button type="submit" id="saSend" disabled>Gửi</button>
          </form>
        </section>
      </div>`;

    const $ = (id) => document.getElementById(id);
    const els = {
      tabs: $("saTabs"), list: $("saList"), title: $("saTitle"), sub: $("saSub"), actions: $("saActions"),
      cust: $("saCust"), messages: $("saMessages"), notice: $("saNotice"), quick: $("saQuick"),
      input: $("saInput"), send: $("saSend"), image: $("saImage"), product: $("saProduct"), file: $("saFile"),
    };
    const active = () => read().find((t) => t && t.maPhienChat === selectedId) || null;

    // Đánh dấu nhân viên đã đọc hết tin của khách trong cuộc đang mở.
    function markRead() {
      const t = active();
      if (!t || unreadOf(t) === 0) return;
      const msgs = t.tinNhan || [];
      const threads = read();
      const cur = threads.find((x) => x.maPhienChat === t.maPhienChat);
      if (cur && msgs.length) { cur.maTinNhanNhanVienDaDoc = msgs[msgs.length - 1].maTinNhan; write(threads); }
    }

    function renderSide() {
      const all = read().filter(hasConversation);
      const counts = { all: all.length, waiting: 0, handling: 0, closed: 0 };
      all.forEach((t) => { counts[stateOf(t)] += 1; });
      const tabDefs = [["all", "Tất cả"], ["waiting", "Chờ tiếp nhận"], ["handling", "Đang xử lý"], ["closed", "Đã đóng"]];
      els.tabs.innerHTML = tabDefs.map(([key, label]) =>
        `<button type="button" class="${filter === key ? "active" : ""}" data-filter="${key}">${label} <i>${counts[key]}</i></button>`).join("");

      const threads = visibleThreads();
      els.list.innerHTML = threads.map((t) => {
        const st = stateOf(t);
        const unread = unreadOf(t);
        const last = lastMessage(t);
        const initial = esc((t.tenKhachHang || "K").trim().charAt(0).toUpperCase() || "K");
        return `<button type="button" class="sa-item ${t.maPhienChat === selectedId ? "active" : ""} ${unread ? "has-unread" : ""}" data-thread="${esc(t.maPhienChat)}">
          <span class="sa-avatar">${initial}</span>
          <span class="sa-item-main">
            <span class="sa-item-top"><strong>${esc(t.tenKhachHang || "Khách hàng")}</strong><small>${esc(fmtShort(last && last.thoiGianGui))}</small></span>
            <span class="sa-item-preview">${esc(previewOf(last))}</span>
            <span class="sa-item-bottom"><em class="sa-chip sa-chip-${st}">${STATE_LABEL[st]}</em>${t.nhanVienXuLy && st !== "closed" ? `<small>${esc(t.nhanVienXuLy)}</small>` : ""}</span>
          </span>
          ${unread ? `<b class="sa-unread">${unread > 9 ? "9+" : unread}</b>` : ""}
        </button>`;
      }).join("") || `<p class="sa-empty">${keyword || filter !== "all" ? "Không có cuộc trò chuyện phù hợp." : "Chưa có yêu cầu hỗ trợ nào."}</p>`;
    }

    function renderChat() {
      const t = active();
      if (!t) {
        els.title.textContent = "Chọn một cuộc trò chuyện";
        els.sub.textContent = "";
        els.actions.innerHTML = "";
        els.cust.hidden = true;
        els.messages.innerHTML = '<p class="sa-empty">Chưa có cuộc trò chuyện nào được chọn.</p>';
        els.notice.hidden = true;
        els.quick.innerHTML = "";
        [els.input, els.send, els.image, els.product].forEach((el) => { el.disabled = true; });
        return;
      }
      const st = stateOf(t);
      const me = staffInfo();
      const mine = t.maNhanVienXuLy ? t.maNhanVienXuLy === me.username : t.nhanVienXuLy === me.name;
      els.title.textContent = t.tenKhachHang || "Khách hàng";
      els.sub.innerHTML = `<em class="sa-chip sa-chip-${st}">${STATE_LABEL[st]}</em>${t.nhanVienXuLy && st !== "closed" ? ` Phụ trách: ${esc(t.nhanVienXuLy)}` : ""}`;
      els.cust.innerHTML = customerCard(t);
      els.cust.hidden = false;

      // Nút thao tác theo trạng thái
      els.actions.innerHTML =
        st === "waiting" ? '<button type="button" class="sa-btn primary" data-act="claim">Tiếp nhận</button>' :
        st === "handling" && !mine ? '<button type="button" class="sa-btn" data-act="takeover">Tiếp quản</button>' : "";
      if (st !== "closed") els.actions.innerHTML += '<button type="button" class="sa-btn danger" data-act="close">Kết thúc hội thoại</button>';
      else els.actions.innerHTML = '<button type="button" class="sa-btn primary" data-act="reopen">Mở lại hội thoại</button>';

      els.messages.innerHTML = (t.tinNhan || []).length
        ? buildMessages(t.tinNhan, {
          esc,
          bodyOf,
          isMine: (m) => m.loaiNguoiGui === "staff",
          otherName: (m) => m.tenNguoiGui || "Khách hàng",
        })
        : '<p class="sa-empty">Chưa có tin nhắn.</p>';
      els.messages.scrollTop = els.messages.scrollHeight;

      // Quyền trả lời: chỉ khi chưa đóng và (chưa ai nhận hoặc chính mình đang phụ trách)
      const canReply = st === "waiting" || (st === "handling" && mine);
      [els.input, els.send, els.image, els.product].forEach((el) => { el.disabled = !canReply; });
      els.notice.hidden = canReply;
      els.notice.textContent =
        st === "closed" ? "Hội thoại đã kết thúc. Bấm \"Mở lại hội thoại\" nếu cần tiếp tục hỗ trợ khách." :
        !mine ? `Hội thoại đang do ${t.nhanVienXuLy} phụ trách. Bấm "Tiếp quản" để trả lời thay.` : "";
      els.quick.innerHTML = canReply
        ? QUICK_REPLIES.map((text, i) => `<button type="button" data-quick="${i}" title="${esc(text)}">${esc(text.length > 38 ? text.slice(0, 36) + "…" : text)}</button>`).join("")
        : "";
    }

    function render() {
      // Chưa chọn cuộc nào (hoặc cuộc đang chọn không còn): tự mở cuộc cần xử lý trước
      // (ưu tiên có tin chưa đọc, rồi cuộc chờ tiếp nhận, rồi cuộc mới cập nhật nhất).
      if (!active()) {
        const pool = read().filter(hasConversation);
        const score = (t) => (unreadOf(t) ? 4 : 0) + (stateOf(t) === "waiting" ? 2 : 0) + (stateOf(t) === "handling" ? 1 : 0);
        pool.sort((a, b) => score(b) - score(a) || String(b.ngayCapNhat).localeCompare(String(a.ngayCapNhat)));
        selectedId = pool[0] ? pool[0].maPhienChat : null;
      }
      markRead();
      renderSide();
      renderChat();
    }

    // ---------- Hành động ----------
    function systemNote(thread, text) {
      thread.tinNhan = Array.isArray(thread.tinNhan) ? thread.tinNhan : [];
      thread.tinNhan.push({ maTinNhan: newId("MSG"), thoiGianGui: new Date().toISOString(), loaiNguoiGui: "system", maNguoiGui: "shop", tenNguoiGui: "OOAD Shop", loaiTinNhan: "text", noiDung: text });
    }
    function claim(thread, takeover) {
      const me = staffInfo();
      const previous = thread.nhanVienXuLy;
      thread.nhanVienXuLy = me.name;
      thread.maNhanVienXuLy = me.username;
      thread.ngayTiepNhan = new Date().toISOString();
      systemNote(thread, takeover && previous ? `${me.name} đã tiếp quản hội thoại từ ${previous}.` : `${me.name} đã tiếp nhận hội thoại.`);
    }
    function sendMessage(message) {
      const t = active();
      if (!t || stateOf(t) === "closed") return;
      const me = staffInfo();
      mutate(t.maPhienChat, (thread) => {
        if (!thread.nhanVienXuLy) claim(thread, false); // trả lời trước = tự tiếp nhận
        thread.tinNhan.push({ maTinNhan: newId("MSG"), thoiGianGui: new Date().toISOString(), loaiNguoiGui: "staff", maNguoiGui: me.username, tenNguoiGui: me.name, ...message });
        thread.maTinNhanNhanVienDaDoc = thread.tinNhan[thread.tinNhan.length - 1].maTinNhan;
      });
      render();
    }

    els.actions.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-act]");
      const t = active();
      if (!btn || !t) return;
      const act = btn.dataset.act;
      const me = staffInfo();
      if (act === "claim") mutate(t.maPhienChat, (thread) => claim(thread, false));
      else if (act === "takeover") {
        if (!window.confirm(`Tiếp quản hội thoại đang do ${t.nhanVienXuLy} phụ trách?`)) return;
        mutate(t.maPhienChat, (thread) => claim(thread, true));
      } else if (act === "close") {
        if (!window.confirm("Kết thúc hội thoại này? Khách nhắn lại sẽ mở một cuộc hội thoại mới.")) return;
        mutate(t.maPhienChat, (thread) => {
          thread.trangThai = "closed";
          thread.ngayDong = new Date().toISOString();
          thread.nguoiDong = me.name;
          systemNote(thread, `${me.name} đã kết thúc hội thoại. Cảm ơn bạn đã liên hệ OOAD Shop!`);
          thread.maTinNhanNhanVienDaDoc = thread.tinNhan[thread.tinNhan.length - 1].maTinNhan;
        });
      } else if (act === "reopen") {
        // Không mở lại nếu khách đã có cuộc hội thoại khác đang mở.
        const other = read().find((x) => x && x.maPhienChat !== t.maPhienChat && x.maKhachHang === t.maKhachHang && x.trangThai !== "closed");
        if (other) { alert("Khách này đang có một cuộc hội thoại khác còn mở. Hãy xử lý ở cuộc đó."); selectedId = other.maPhienChat; render(); return; }
        mutate(t.maPhienChat, (thread) => {
          thread.trangThai = "open";
          thread.ngayDong = null;
          thread.nguoiDong = null;
          claim(thread, false);
        });
      }
      render();
    });

    els.list.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-thread]");
      if (btn) { selectedId = btn.dataset.thread; render(); }
    });
    els.tabs.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-filter]");
      if (btn) { filter = btn.dataset.filter; renderSide(); }
    });
    $("saSearch").addEventListener("input", (event) => { keyword = event.target.value || ""; renderSide(); });
    els.quick.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-quick]");
      if (btn) { els.input.value = QUICK_REPLIES[Number(btn.dataset.quick)] || ""; els.input.focus(); }
    });
    $("saForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const text = els.input.value.trim();
      if (!text || els.input.disabled) return;
      sendMessage({ loaiTinNhan: "text", noiDung: text });
      els.input.value = "";
    });
    els.image.addEventListener("click", () => els.file.click());
    els.file.addEventListener("change", () => {
      const file = els.file.files[0];
      els.file.value = "";
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { alert("Ảnh phải nhỏ hơn 2MB."); return; }
      const reader = new FileReader();
      reader.onload = () => sendMessage({ loaiTinNhan: "image", duLieuAnh: reader.result, noiDung: file.name });
      reader.readAsDataURL(file);
    });
    els.product.addEventListener("click", () => {
      const code = prompt("Nhập mã sản phẩm cần gửi (ví dụ SH-001):");
      if (!code) return;
      const product = getProducts().find((item) => item.maSanPham === code.trim().toUpperCase() || item.maSanPham === code.trim());
      if (!product) { alert("Không tìm thấy sản phẩm."); return; }
      sendMessage({ loaiTinNhan: "product", maSanPham: product.maSanPham, tenSanPham: product.tenSanPham, duongDan: `../pages/home.html?search=${encodeURIComponent(product.tenSanPham)}#sanpham` });
    });

    els.messages.addEventListener("load", (event) => { if (event.target && event.target.tagName === "IMG") els.messages.scrollTop = els.messages.scrollHeight; }, true);

    // Tab khác (khách nhắn tin, nhân viên khác thao tác) -> cập nhật ngay
    window.addEventListener("storage", (event) => { if (event.key === KEY || event.key === "DanhSachDatHang") render(); });
    // Bấm vào trang hỗ trợ từ menu: dữ liệu có thể đã đổi trong lúc đang ở trang khác
    window.addEventListener("hashchange", render);
    render();
  }

  // Gửi tin nhắn hệ thống vào cuộc chat của khách (vd. tin cảm ơn sau khi giao hàng).
  // Tự tạo cuộc chat nếu khách chưa có cuộc nào đang mở. Trả về true nếu đã lưu.
  function sendSystemMessage(maKhachHang, tenKhachHang, text) {
    if (!maKhachHang || !String(text || "").trim()) return false;
    try {
      const threads = read();
      let thread = threads.find((item) => item.maKhachHang === maKhachHang && item.trangThai !== "closed");
      if (!thread) {
        const now = new Date().toISOString();
        thread = { maPhienChat: newId("CHAT"), maKhachHang, tenKhachHang: tenKhachHang || "", trangThai: "open", nhanVienXuLy: null, tinNhan: [], ngayTao: now, ngayCapNhat: now };
        threads.push(thread);
      }
      thread.tinNhan = Array.isArray(thread.tinNhan) ? thread.tinNhan : [];
      thread.tinNhan.push({ maTinNhan: newId("MSG"), thoiGianGui: new Date().toISOString(), loaiNguoiGui: "system", maNguoiGui: "shop", tenNguoiGui: "OOAD Shop", loaiTinNhan: "text", noiDung: String(text).trim() });
      thread.ngayCapNhat = new Date().toISOString();
      return write(threads);
    } catch (error) {
      console.error("Không gửi được tin nhắn hệ thống vào chat:", error);
      return false;
    }
  }

  document.addEventListener("DOMContentLoaded", init);
  window.SupportChatAdmin = { init, sendSystemMessage };
})();
