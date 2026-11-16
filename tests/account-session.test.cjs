const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

function setup() {
  const data = new Map();
  const context = {
    localStorage: {
      getItem: key => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, String(value)),
      removeItem: key => data.delete(key)
    },
    document: { readyState: 'loading', addEventListener() {} }
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync('assets/js/user/core/account-session.js', 'utf8'), context);
  return { session: context.UserSession, data };
}

const shoppingKeys = ['cart', 'selectedCartItems', 'selectedAddress', 'CurrDanhSachDatHang'];
const userA = { maKhachHang: 'A', tenDangNhap: 'alice' };
const userB = { maKhachHang: 'B', tenDangNhap: 'bob' };

test('logout clears shopping state before another account logs in', () => {
  const { session, data } = setup();
  session.setCurrentUser(userA);
  shoppingKeys.forEach(key => data.set(key, '[{"maSanPham":"P1"}]'));
  data.set('DanhSachDatHang', '[]');
  session.clearSession();
  assert.equal(data.has('currentUser'), false);
  shoppingKeys.forEach(key => assert.equal(data.has(key), false));
  session.setCurrentUser(userB);
  assert.equal(data.has('cart'), false);
  assert.equal(data.get('DanhSachDatHang'), '[]');
});

test('switching accounts or logging in with stale anonymous data clears the cart', () => {
  const { session, data } = setup();
  data.set('cart', '[1]');
  session.setCurrentUser(userA);
  assert.equal(data.has('cart'), false);
  shoppingKeys.forEach(key => data.set(key, '[1]'));
  session.setCurrentUser(userB);
  shoppingKeys.forEach(key => assert.equal(data.has(key), false));
});

test('updating the same account preserves its cart; null session clears it', () => {
  const { session, data } = setup();
  session.setCurrentUser(userA);
  data.set('cart', '[1]');
  session.setCurrentUser({ ...userA, hoTen: 'New display name' });
  assert.equal(data.get('cart'), '[1]');
  session.setCurrentUser(null);
  assert.equal(data.has('cart'), false);
  assert.equal(data.has('currentUser'), false);
});
