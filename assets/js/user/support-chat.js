(function () {
  "use strict";

  const THREADS_KEY = "supportThreads";
  const currentUser = () => window.UserSession?.getCurrentUser?.() || null;
  const readThreads = () => {
    try {
      const value = JSON.parse(localStorage.getItem(THREADS_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  };
  const writeThreads = (threads) => localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const id = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

  function getThread(user) {
    const threads = readThreads();
    let thread = threads.find((item) => item.customerId === user.maKhachHang && item.status !== "closed");
    if (!thread) {
      thread = { id: id("CHAT"), customerId: user.maKhachHang, customerName: user.hoTen, status: "open", assignedTo: null, messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      threads.push(thread);
      writeThreads(threads);
    }
    return thread;
  }

  function addMessage(threadId, message) {
    const threads = readThreads();
    const thread = threads.find((item) => item.id === threadId);
    if (!thread) return;
    thread.messages = Array.isArray(thread.messages) ? thread.messages : [];
    thread.messages.push({ id: id("MSG"), createdAt: new Date().toISOString(), ...message });
    thread.updatedAt = new Date().toISOString();
    writeThreads(threads);
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
          <div class="support-call-head"><strong>Gọi âm thanh với nhân viên</strong><button type="button" id="supportCallClose" aria-label="Đóng">×</button></div>
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
        userInfo: { displayName: displayName || "Khách hàng" },
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
    if (document.getElementById("supportChatPanel")) return;
    const user = currentUser();
    if (!user) return;
    const thread = getThread(user);
    document.body.insertAdjacentHTML("beforeend", `
      <button class="support-chat-launcher" id="supportChatLauncher">💬 Hỗ trợ</button>
      <section class="support-chat-panel" id="supportChatPanel" aria-label="Chat hỗ trợ">
        <div class="support-chat-head"><strong>Hỗ trợ khách hàng</strong><button id="supportChatClose" style=" background: none; border: none; color: #000; font-size: 1.5em; cursor: pointer;" aria-label="Đóng">×</button></div>
        <div class="support-chat-status" id="supportChatStatus">Đang chờ nhân viên tiếp nhận</div>
        <div class="support-chat-messages" id="supportChatMessages"></div>
        <div class="support-chat-tools">
          <button type="button" id="supportChatImage">Ảnh</button>
          <button type="button" id="supportChatProduct">Mã sản phẩm</button>
          <button type="button" id="supportChatCall">Gọi miễn phí</button>
          <input type="file" id="supportChatFile" accept="image/*" hidden>
        </div>
        <form class="support-chat-compose" id="supportChatForm">
          <input id="supportChatInput" placeholder="Nhập tin nhắn..." maxlength="1000" autocomplete="off">
          <button type="submit">Gửi</button>
        </form>
      </section>
    `);
    const panel = document.getElementById("supportChatPanel");
    const messages = document.getElementById("supportChatMessages");
    const render = () => {
      const fresh = readThreads().find((item) => item.id === thread.id) || thread;
      document.getElementById("supportChatStatus").textContent = fresh.assignedTo
        ? `Đang hỗ trợ: ${fresh.assignedTo}`
        : "Đang chờ nhân viên tiếp nhận";
      messages.innerHTML = (fresh.messages || []).map((item) => {
        const content = item.type === "image"
          ? `<img src="${esc(item.data)}" alt="Ảnh khách gửi">`
          : item.type === "product"
            ? `<a class="support-chat-product" href="${esc(item.url)}" target="_blank" rel="noopener">🛍️ ${esc(item.name)}</a>`
            : esc(item.text);
        return `<div class="support-chat-message ${item.senderType === "customer" ? "mine" : ""}"><small>${esc(item.senderName || "Hỗ trợ")}</small>${content}</div>`;
      }).join("") || "<p>Xin chào! Shop sẽ hỗ trợ bạn sớm nhất.</p>";
      messages.scrollTop = messages.scrollHeight;
    };
    document.getElementById("supportChatLauncher").onclick = () => panel.classList.add("is-open");
    document.getElementById("supportChatClose").onclick = () => panel.classList.remove("is-open");
    document.getElementById("supportChatForm").onsubmit = (event) => {
      event.preventDefault();
      const input = document.getElementById("supportChatInput");
      if (!input.value.trim()) return;
      addMessage(thread.id, { senderType: "customer", senderId: user.maKhachHang, senderName: user.hoTen, type: "text", text: input.value.trim() });
      input.value = ""; render();
    };
    document.getElementById("supportChatImage").onclick = () => document.getElementById("supportChatFile").click();
    document.getElementById("supportChatFile").onchange = () => {
      const file = document.getElementById("supportChatFile").files[0];
      if (!file || file.size > 2 * 1024 * 1024) { alert("Ảnh phải nhỏ hơn 2MB."); return; }
      const reader = new FileReader();
      reader.onload = () => { addMessage(thread.id, { senderType: "customer", senderId: user.maKhachHang, senderName: user.hoTen, type: "image", data: reader.result, text: file.name }); render(); };
      reader.readAsDataURL(file);
    };
    document.getElementById("supportChatProduct").onclick = () => {
      const code = prompt("Nhập mã sản phẩm cần gửi (ví dụ SH-001):");
      if (!code) return;
      let products = []; try { products = JSON.parse(localStorage.getItem("productsLocal") || "[]"); } catch (_) {}
      const product = products.find((item) => item.maSanPham === code.trim());
      if (!product) { alert("Không tìm thấy sản phẩm."); return; }
      addMessage(thread.id, { senderType: "customer", senderId: user.maKhachHang, senderName: user.hoTen, type: "product", productId: product.maSanPham, name: product.tenSanPham, url: `pages/home.html?search=${encodeURIComponent(product.tenSanPham)}#sanpham` });
      render();
    };
    document.getElementById("supportChatCall").onclick = () => openCall(thread, user.hoTen);
    window.addEventListener("storage", (event) => { if (event.key === THREADS_KEY) render(); });
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
