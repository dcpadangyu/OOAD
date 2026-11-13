const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function setup() {
  const data = new Map();
  const sandbox = { console: { error() {} }, Date, Event, alert() {}, document: { addEventListener(_, cb) { this.ready = cb; }, querySelectorAll() { return []; } } };
  sandbox.window = sandbox;
  sandbox.localStorage = { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,String(v)), removeItem: k => data.delete(k) };
  sandbox.UserSession = { getCurrentUser: () => ({ maKhachHang: 'A', diaChi: 'Test' }) };
  sandbox.dispatchEvent = () => {};
  sandbox.ShopCore = { esc: String, shippingFee: () => 30000, deductOrderStock: () => ({ok:true}), orderLines: () => [] };
  sandbox.getCheckoutCart = () => [{ maSanPham:'P', giaBan:600000, soLuong:1 }];
  sandbox.getLocalProducts = () => [];
  sandbox.saveLocalProducts = () => true;
  const ctx = vm.createContext(sandbox);
  for (const name of ['voucher','payment']) vm.runInContext(fs.readFileSync(`assets/js/user/payment/${name}.js`,'utf8'),ctx);
  sandbox.document.ready();
  const set = (k,v) => sandbox.localStorage.setItem(k,JSON.stringify(v));
  const read = k => JSON.parse(sandbox.localStorage.getItem(k)||'[]');
  return { s:sandbox, v:sandbox.ShopVoucher, set, read, data };
}
test('one copy: selecting repeatedly does not consume; COD consumes and blocks next use', () => {
 const {s,v}=setup(); assert.equal(v.apply(' freeship ',600000,30000).discount,30000);
 assert.equal(v.apply('FREESHIP',600000,30000).ok,true);
 assert.equal(v.soLuongConLai(v.find('FREESHIP')),1);
 assert.equal(s.thanhtoan('COD'),true);
 assert.equal(v.soLuongConLai(v.find('FREESHIP')),0);
 assert.equal(v.apply('FREESHIP',600000,30000).ok,false);
});
test('two copies are isolated per account and survive reload of applied selection', () => {
 const {s,v,set}=setup(); set('voucherWallet',[{maKhachHang:'A',maVoucher:'FREESHIP',soLuongDuocCap:2}]);
 for(let i=0;i<2;i++) { assert.equal(v.apply('FREESHIP',600000,30000).ok,true); assert.equal(s.thanhtoan('COD'),true); }
 assert.equal(v.soLuongConLai(v.find('FREESHIP')),0);
 s.UserSession.getCurrentUser=()=>({maKhachHang:'B'});
 assert.equal(v.getApplied(),null); assert.equal(v.soLuongConLai(v.find('FREESHIP')),1);
});
test('expiry, future dates, disabled, minimum, no shipping fee and global quota rejected', () => {
 const {v,set}=setup(); const list=v.list(); const update=changes=>set('shopVouchers',list.map(x=>x.maVoucher==='FREESHIP'?{...x,...changes}:x));
 update({thoiGianKetThuc:'2000-01-01'}); assert.equal(v.apply('FREESHIP',600000,30000).ok,false);
 update({thoiGianBatDau:'2099-01-01'}); assert.equal(v.apply('FREESHIP',600000,30000).ok,false);
 update({trangThai:'inactive'}); assert.equal(v.apply('FREESHIP',600000,30000).ok,false);
 update({soLuongToiDa:0}); assert.equal(v.apply('FREESHIP',600000,30000).ok,false);
 update({}); assert.equal(v.apply('FREESHIP',600000,0).ok,false);
 assert.equal(v.apply('GIAY200K',600000,30000).ok,false);
 assert.equal(v.discount(v.find('GIAYMOI10'),2000000,30000),150000);
});
test('bank pending does not consume; confirmation rechecks expiry; success is idempotent', () => {
 const {s,v,set,read}=setup(); v.apply('FREESHIP',600000,30000);
 assert.equal(s.thanhtoan('PayBank'),true); assert.equal(v.soLuongConLai(v.find('FREESHIP')),1);
 const pending=read('CurrDanhSachDatHang'); const list=v.list();
 set('shopVouchers',list.map(x=>({...x,thoiGianKetThuc:'2000-01-01'})));
 assert.equal(s.confirmBankOrder().ok,false); assert.equal(read('DanhSachDatHang').length,0);
 set('shopVouchers',list); assert.equal(s.confirmBankOrder().ok,true);
 assert.equal(v.soLuongConLai(v.find('FREESHIP')),0);
 set('CurrDanhSachDatHang',pending); assert.equal(s.confirmBankOrder().ok,true);
 assert.equal(read('DanhSachDatHang').length,1);
});
test('storage failure while persisting order does not consume voucher', () => {
 const {s,v,data}=setup(); v.apply('FREESHIP',600000,30000);
 s.localStorage.setItem=(k,val)=>{if(k==='DanhSachDatHang')throw Error('quota');data.set(k,String(val));};
 assert.equal(s.thanhtoan('COD'),false); assert.equal(v.soLuongConLai(v.find('FREESHIP')),1);
});

test('suggestions hide exhausted, expired, inactive and unassigned vouchers', () => {
 const {v,set}=setup(); const original=v.list()[0];
 set('shopVouchers',[
   {...original,maVoucher:'VISIBLE'},
   {...original,maVoucher:'EXPIRED',thoiGianKetThuc:'2000-01-01'},
   {...original,maVoucher:'INACTIVE',trangThai:'inactive'},
   {...original,maVoucher:'EMPTY',soLuongMoiTaiKhoan:0},
   {...original,maVoucher:'OTHER',danhSachTaiKhoanApDung:['B']},
   {...original,maVoucher:'USED'},
   {...original,maVoucher:'GLOBAL',soLuongToiDa:0}
 ]);
 set('DanhSachDatHang',[{maKhachHang:'A',maVoucher:'USED'}]);
 assert.deepEqual(Array.from(v.goiYVoucher(600000,30000),x=>x.voucher.maVoucher),['VISIBLE']);
 assert.equal(v.apply('OTHER',600000,30000).ok,false);
});

test('available first; both groups rank by savings, considering caps and minimum spend', () => {
 const {v,set}=setup(); const base=v.list()[0];
 set('shopVouchers',[
   {...base,maVoucher:'SMALL',loaiGiamGia:'fixed',giaTriGiam:20000},
   {...base,maVoucher:'SHIP',loaiGiamGia:'shipping',giaTriGiam:0},
   {...base,maVoucher:'CAPPED',giaTriGiam:50,giamToiDa:40000},
   {...base,maVoucher:'LOCKED_BIG',donHangToiThieu:1000000,giaTriGiam:20,giamToiDa:150000},
   {...base,maVoucher:'LOCKED_SMALL',donHangToiThieu:800000,loaiGiamGia:'fixed',giaTriGiam:70000}
 ]);
 const list=v.goiYVoucher(600000,30000);
 assert.deepEqual(Array.from(list,x=>x.voucher.maVoucher),['CAPPED','SHIP','SMALL','LOCKED_BIG','LOCKED_SMALL']);
 assert.equal(list[3].soTienGiam,150000); assert.equal(list[3].canMuaThem,400000);
 assert.equal(v.discount(v.find('LOCKED_BIG'),600000,30000),0);
});

test('future vouchers stay conditional; used voucher disappears immediately', () => {
 const {s,v,set}=setup(); const list=v.list();
 set('shopVouchers',list.map(x=>x.maVoucher==='GIAY200K'?{...x,thoiGianBatDau:'2099-01-01',thoiGianKetThuc:'2100-01-01'}:x));
 assert.ok(v.goiYVoucher(2000000,30000).find(x=>x.voucher.maVoucher==='GIAY200K').reason);
 v.apply('FREESHIP',600000,30000); assert.equal(s.thanhtoan('COD'),true);
 assert.equal(v.goiYVoucher(600000,30000).some(x=>x.voucher.maVoucher==='FREESHIP'),false);
});
