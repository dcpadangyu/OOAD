# Test Round 2 — Regression sau lần sửa đầu

## Kịch bản

- Seed demo users.
- Login User A.
- Cập nhật email User A.
- Lưu và đọc lại `currentUser` + `userList`.
- Login User B.
- Xác nhận session chuyển sang User B.
- Logout.
- Kiểm tra `userList` vẫn còn dữ liệu.

## Kết quả tự động
`ACCOUNT SESSION TESTS: PASS`

Ngoài ra:
- `ADMIN IMMUTABILITY: PASS`
- `USER SHELL USAGE: PASS`
- `PER-PAGE ASSET DEDUP: PASS`
- All User JS syntax: PASS

**Trạng thái: PASS**
