const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

loadEnv();

const PORT = Number(process.env.PORT || 3000);
const OTP_TTL_SECONDS = Number(process.env.OTP_TTL_SECONDS || 300);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const pendingOtps = new Map();

function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function json(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100_000) request.destroy(new Error("Request too large"));
    });
    request.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (_) { reject(new Error("Invalid JSON")); }
    });
    request.on("error", reject);
  });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function createOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

async function sendOtpEmail(email, code, purpose) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error("Email service is not configured. Create server/.env first.");
  }
  const purposeText = purpose === "register"
    ? "xác thực đăng ký tài khoản"
    : purpose === "forgot-password"
      ? "đặt lại mật khẩu"
      : "xác thực đổi mật khẩu";
  const result = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: `${code} - Mã xác thực Shoe Store`,
      html: `
        <!doctype html>
        <html lang="vi">
          <body style="margin:0;background:#f4f6f8;color:#1f2937;font-family:Arial,Helvetica,sans-serif;">
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
              Mã xác thực Shoe Store của bạn là ${code}.
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:32px 16px;">
              <tr>
                <td align="center">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,.08);">
                    <tr>
                      <td style="background:#111827;padding:28px 32px;text-align:center;">
                        <div style="color:#ffffff;font-size:25px;font-weight:700;letter-spacing:.5px;">SHOE STORE</div>
                        <div style="color:#cbd5e1;font-size:13px;margin-top:7px;">Phong cách của bạn, dấu ấn của bạn</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:36px 32px 32px;">
                        <p style="margin:0 0 12px;font-size:16px;">Xin chào,</p>
                        <p style="margin:0;color:#4b5563;font-size:15px;line-height:1.7;">
                          Bạn đang yêu cầu mã OTP để <strong>${purposeText}</strong>.
                        </p>
                        <div style="margin:28px 0;text-align:center;background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:22px 16px;">
                          <div style="color:#6b7280;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">Mã xác thực</div>
                          <div style="margin-top:10px;color:#111827;font-size:36px;font-weight:700;letter-spacing:9px;">${code}</div>
                        </div>
                        <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;text-align:center;">
                          Mã có hiệu lực trong <strong>${Math.ceil(OTP_TTL_SECONDS / 60)} phút</strong>.
                          Vui lòng không chia sẻ mã này với bất kỳ ai.
                        </p>
                        <hr style="border:0;border-top:1px solid #e5e7eb;margin:28px 0 20px;">
                        <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;text-align:center;">
                          Nếu bạn không yêu cầu mã này, hãy bỏ qua email. Đây là email tự động, vui lòng không trả lời.
                        </p>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:18px 0 0;color:#9ca3af;font-size:12px;">© Shoe Store</p>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `
    })
  });
  if (!result.ok) {
    const detail = await result.json().catch(() => ({}));
    const providerMessage = detail.message || detail.name || `HTTP ${result.status}`;
    throw new Error(`Không gửi được email OTP: ${providerMessage}. Kiểm tra RESEND_API_KEY và EMAIL_FROM trong server/.env.`);
  }
}

async function requestOtp(payload) {
  const email = normalizeEmail(payload.email);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Email không hợp lệ.");
  const purpose = String(payload.purpose || "");
  if (!["register", "forgot-password", "change-password"].includes(purpose)) {
    throw new Error("OTP purpose không hợp lệ.");
  }
  const code = createOtp();
  pendingOtps.set(`${purpose}:${email}`, {
    email,
    purpose,
    codeHash: hash(code),
    expiresAt: Date.now() + OTP_TTL_SECONDS * 1000,
    attempts: 0,
    data: payload.data || null
  });
  await sendOtpEmail(email, code, purpose);
}

function verifyOtp(email, purpose, code) {
  const key = `${purpose}:${normalizeEmail(email)}`;
  const record = pendingOtps.get(key);
  if (!record || record.expiresAt < Date.now()) {
    pendingOtps.delete(key);
    throw new Error("Mã OTP đã hết hạn hoặc không tồn tại.");
  }
  record.attempts += 1;
  if (record.attempts > OTP_MAX_ATTEMPTS) {
    pendingOtps.delete(key);
    throw new Error("Bạn đã nhập sai OTP quá số lần cho phép.");
  }
  if (hash(code) !== record.codeHash) throw new Error("Mã OTP không đúng.");
  pendingOtps.delete(key);
  return record;
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") return json(response, 204, {});
  if (request.method === "GET" && request.url === "/api/health") {
    return json(response, 200, {
      ok: true,
      emailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
    });
  }
  if (request.method !== "POST" || !request.url.startsWith("/api/otp/")) {
    return json(response, 404, { error: "Not found" });
  }
  try {
    const body = await readBody(request);
    if (request.url === "/api/otp/request") {
      await requestOtp(body);
      return json(response, 200, { ok: true, message: "OTP đã được gửi." });
    }
    if (request.url === "/api/otp/verify") {
      const record = verifyOtp(body.email, body.purpose, body.code);
      return json(response, 200, { ok: true, data: record.data });
    }
    return json(response, 404, { error: "Not found" });
  } catch (error) {
    return json(response, 400, { error: error.message || "OTP request failed" });
  }
});

server.listen(PORT, () => {
  console.log(`User OTP server listening on http://localhost:${PORT}`);
});
