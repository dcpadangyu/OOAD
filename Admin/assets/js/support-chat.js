(function () {
  "use strict";
  const KEY = "supportThreads";
  let selectedId = null;
  const read = () => { try { const value = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(value) ? value : []; } catch (_) { return []; } };
  const write = (value) => localStorage.setItem(KEY, JSON.stringify(value));
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const id = () => `MSG_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const admin = () => window.adminSession?.getCurrentAdmin?.() || { username: "admin", fullName: "Admin" };
  const getProducts = () => { try { const value = JSON.parse(localStorage.getItem("productsLocal") || "[]"); return Array.isArray(value) ? value : []; } catch (_) { return []; } };
  let jitsiApi = null;

  function loadJitsiApi() {
    if (window.JitsiMeetExternalAPI) return Promise.resolve();
    if (window.__ooadJitsiApiPromise) return window.__ooadJitsiApiPromise;
    window.__ooadJitsiApiPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Không tải được Jitsi."));
      document.head.appendChild(script);
    });
    return window.__ooadJitsiApiPromise;
  }

  function closeCall() {
    if (jitsiApi) {
      jitsiApi.dispose();
      jitsiApi = null;
    }
    document.getElementById("supportCallModal")?.remove();
  }

  async function openCall(thread, displayName) {
    const room = `OOAD-Support-${thread.id.replace(/[^a-zA-Z0-9]/g, "")}`;
    closeCall();
    document.body.insertAdjacentHTML("beforeend", `
      <div class="support-call-modal" id="supportCallModal" role="dialog" aria-modal="true" aria-label="Cuộc gọi hỗ trợ">
        <div class="support-call-box">
          <div class="support-call-head"><strong>Gọi âm thanh với khách hàng</strong><button type="button" id="supportCallClose" aria-label="Đóng">×</button></div>
          <div class="support-call-frame" id="supportCallFrame"><p>Đang tải cuộc gọi...</p></div>
        </div>
      </div>
    `);
    document.getElementById("supportCallClose").onclick = closeCall;
    try {
      await loadJitsiApi();
      if (!document.getElementById("supportCallFrame")) return;
      jitsiApi = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName: room,
        parentNode: document.getElementById("supportCallFrame"),
        width: "100%",
        height: "100%",
        userInfo: { displayName: displayName || "Nhân viên hỗ trợ" },
        configOverwrite: {
          startAudioOnly: true,
          startWithVideoMuted: true,
          toolbarButtons: ["microphone", "hangup", "chat", "settings"]
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: ["microphone", "hangup", "chat", "settings"]
        }
      });
    } catch (error) {
      closeCall();
      alert("Không thể tải cuộc gọi hỗ trợ. Vui lòng thử lại.");
    }
  }

  function init() {
    const root = document.getElementById("supportAdminRoot");
    if (!root || root.dataset.bound) return;
    root.dataset.bound = "1";
    root.innerHTML = `
      <div class="support-admin-layout">
        <div class="support-thread-list" id="supportThreadList"></div>
        <div class="support-admin-chat">
          <div class="support-admin-head"><strong id="supportAdminTitle">Chọn cuộc trò chuyện</strong><button id="supportAdminCall" disabled>Gọi miễn phí</button></div>
          <div class="support-admin-messages" id="supportAdminMessages">Chưa có cuộc trò chuyện.</div>
          <div class="support-admin-tools"><button id="supportAdminImage">Ảnh</button><button id="supportAdminProduct">Link sản phẩm</button><input id="supportAdminFile" type="file" accept="image/*" hidden></div>
          <form class="support-admin-compose" id="supportAdminForm"><input id="supportAdminInput" maxlength="1000" placeholder="Trả lời khách hàng..." disabled><button type="submit">Gửi</button></form>
        </div>
      </div>`;
    const list = document.getElementById("supportThreadList");
    const messages = document.getElementById("supportAdminMessages");
    const input = document.getElementById("supportAdminInput");
    const active = () => read().find((thread) => thread.id === selectedId);
    const render = () => {
      const threads = read().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      if (!selectedId && threads[0]) selectedId = threads[0].id;
      list.innerHTML = threads.map((thread) => `<button class="${thread.id === selectedId ? "active" : ""}" data-thread="${esc(thread.id)}"><strong>${esc(thread.customerName || "Khách hàng")}</strong><small>${esc(thread.status)} · ${(thread.messages || []).length} tin nhắn</small></button>`).join("") || "<p style='padding:14px'>Chưa có yêu cầu hỗ trợ.</p>";
      const thread = active();
      const call = document.getElementById("supportAdminCall");
      input.disabled = !thread; call.disabled = !thread;
      document.getElementById("supportAdminTitle").textContent = thread ? `Chat với ${thread.customerName}` : "Chọn cuộc trò chuyện";
      messages.innerHTML = thread ? ((thread.messages || []).map((item) => {
        const content = item.type === "image" ? `<img src="${esc(item.data)}" alt="Ảnh khách gửi">` : item.type === "product" ? `<a href="${esc(item.url)}" target="_blank" rel="noopener">🛍️ ${esc(item.name)}</a>` : esc(item.text);
        return `<div class="support-admin-message ${item.senderType === "staff" ? "mine" : ""}"><small>${esc(item.senderName || "Khách hàng")}</small>${content}</div>`;
      }).join("") || "Chưa có tin nhắn.") : "Chưa có cuộc trò chuyện.";
      messages.scrollTop = messages.scrollHeight;
    };
    const add = (message) => {
      const threads = read(); const thread = threads.find((item) => item.id === selectedId); if (!thread) return;
      const staff = admin(); thread.assignedTo = staff.fullName || staff.username; thread.messages = Array.isArray(thread.messages) ? thread.messages : [];
      thread.messages.push({ id: id(), createdAt: new Date().toISOString(), senderType: "staff", senderId: staff.username, senderName: staff.fullName || staff.username, ...message });
      thread.updatedAt = new Date().toISOString(); write(threads); render();
    };
    list.onclick = (event) => { const button = event.target.closest("[data-thread]"); if (button) { selectedId = button.dataset.thread; render(); } };
    document.getElementById("supportAdminForm").onsubmit = (event) => { event.preventDefault(); if (!input.value.trim()) return; add({ type: "text", text: input.value.trim() }); input.value = ""; };
    document.getElementById("supportAdminImage").onclick = () => document.getElementById("supportAdminFile").click();
    document.getElementById("supportAdminFile").onchange = () => {
      const file = document.getElementById("supportAdminFile").files[0]; if (!file || file.size > 2 * 1024 * 1024) { alert("Ảnh phải nhỏ hơn 2MB."); return; }
      const reader = new FileReader(); reader.onload = () => add({ type: "image", data: reader.result, text: file.name }); reader.readAsDataURL(file);
    };
    document.getElementById("supportAdminProduct").onclick = () => {
      const code = prompt("Nhập mã sản phẩm cần gửi (ví dụ SH-001):"); if (!code) return;
      const product = getProducts().find((item) => item.maSanPham === code.trim()); if (!product) { alert("Không tìm thấy sản phẩm."); return; }
      add({ type: "product", productId: product.maSanPham, name: product.tenSanPham, url: `../pages/home.html?search=${encodeURIComponent(product.tenSanPham)}#sanpham` });
    };
    document.getElementById("supportAdminCall").onclick = () => { const thread = active(); if (thread) { const staff = admin(); openCall(thread, staff.fullName || staff.username); } };
    window.addEventListener("storage", (event) => { if (event.key === KEY) render(); });
    render();
  }
  document.addEventListener("DOMContentLoaded", init);
  window.SupportChatAdmin = { init };
})();
