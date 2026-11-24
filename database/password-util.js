// =========================================================
// TIỆN ÍCH MẬT KHẨU DÙNG CHUNG (User + Admin)
// Mật khẩu KHÔNG lưu dạng chữ thường: lưu "sha256$<muối>$<băm>" (băm 5000 vòng, có muối riêng).
// Dữ liệu cũ còn là chữ thường vẫn đăng nhập được, và được nâng cấp lên dạng băm ngay lần đăng nhập đầu tiên.
// Lưu ý: đây là biện pháp giảm rủi ro cho bản demo chạy hoàn toàn trên trình duyệt; hệ thống thật phải băm ở máy chủ.
// =========================================================
(function () {
  "use strict";

  const PREFIX = "sha256$";
  const ROUNDS = 5000;

  // ---- SHA-256 đồng bộ (không phụ thuộc crypto.subtle nên chạy cả khi mở bằng file://) ----
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);

  function utf8(str) {
    return new TextEncoder().encode(str);
  }

  // Trả về Uint8Array 32 byte
  function sha256Bytes(bytes) {
    const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
    const len = bytes.length;
    const total = (((len + 9 + 63) >> 6) << 6);
    const buf = new Uint8Array(total);
    buf.set(bytes);
    buf[len] = 0x80;
    const view = new DataView(buf.buffer);
    view.setUint32(total - 8, Math.floor((len * 8) / 0x100000000));
    view.setUint32(total - 4, (len * 8) >>> 0);
    const w = new Uint32Array(64);
    for (let off = 0; off < total; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const a = w[i - 15], b = w[i - 2];
        const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
        const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i++) {
        const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        const ch = (e & f) ^ (~e & g);
        const t1 = (hh + S1 + ch + K[i] + w[i]) | 0;
        const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
      h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
    }
    const out = new Uint8Array(32);
    const ov = new DataView(out.buffer);
    for (let i = 0; i < 8; i++) ov.setUint32(i * 4, h[i]);
    return out;
  }

  const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

  function derive(plain, salt) {
    let digest = sha256Bytes(utf8(salt + ":" + String(plain)));
    for (let i = 1; i < ROUNDS; i++) {
      const next = new Uint8Array(digest.length + 4);
      next.set(digest);
      next.set(utf8(salt).subarray(0, 4), digest.length);
      digest = sha256Bytes(next);
    }
    return toHex(digest);
  }

  function randomSalt() {
    const bytes = new Uint8Array(8);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return toHex(bytes);
  }

  function isHashed(stored) {
    return typeof stored === "string" && stored.startsWith(PREFIX) && stored.split("$").length === 3;
  }

  function hash(plain) {
    const salt = randomSalt();
    return PREFIX + salt + "$" + derive(plain, salt);
  }

  // So khớp mật khẩu nhập vào với giá trị đã lưu (dạng băm hoặc dạng chữ thường cũ).
  function verify(plain, stored) {
    if (stored === undefined || stored === null || stored === "") return false;
    if (!isHashed(stored)) return String(stored) === String(plain);
    const [, salt, digest] = stored.split("$");
    return derive(plain, salt) === digest;
  }

  // Mật khẩu tạm ngẫu nhiên (không dùng ký tự dễ nhầm: 0/O, 1/l/I).
  function generateTemporary(length) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const bytes = new Uint8Array(length || 10);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return Array.from(bytes, (b) => chars[b % chars.length]).join("");
  }

  window.PasswordUtil = { hash, verify, isHashed, generateTemporary, _sha256Hex: (s) => toHex(sha256Bytes(utf8(s))) };
})();
