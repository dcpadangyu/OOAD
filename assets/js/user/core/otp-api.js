(function () {
  "use strict";

  const API_BASE = window.USER_API_BASE || "http://localhost:3000/api";

  async function request(path, body) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Máy chủ OTP trả về lỗi ${response.status}.`);
      return result;
    } catch (error) {
      if (error.name === "AbortError") throw new Error("Máy chủ OTP phản hồi quá lâu. Hãy kiểm tra server rồi thử lại.");
      if (error instanceof TypeError) throw new Error("Không kết nối được máy chủ gửi Gmail. Hãy chạy server bằng npm start.");
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  window.UserOtp = Object.freeze({
    request(email, purpose, data) {
      return request("/otp/request", { email, purpose, data });
    },
    verify(email, purpose, code) {
      return request("/otp/verify", { email, purpose, code });
    }
  });
})();
