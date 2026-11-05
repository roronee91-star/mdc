// 가짜 Supabase로 들어옴·나감 알림 규칙 확인
const { chromium } = require('playwright');
const MOCK = `
window.supabase = { createClient() { return { channel() {
  const h = { sync: [], join: [], leave: [], bc: {} }; let state = {};
  const ch = {
    on(type, f, cb) { if (type === 'presence') h[f.event].push(cb); else h.bc[f.event] = cb; return ch; },
    subscribe(cb) { setTimeout(() => { cb('SUBSCRIBED'); setTimeout(() => window.__mock.join('early', '먼저온분'), 300); }, 50); return ch; },   // 실제처럼 접속 직후 이미 있던 분 정보가 옴
    track() { return Promise.resolve('ok'); }, send() {}, presenceState() { return state; },
  };
  window.__mock = {
    join(key, n) { state[key] = [{ n, lv: 'B1', x: -3, y: -6.6, z: -6, r: 0 }]; h.join.forEach(c => c({ key, newPresences: state[key] })); h.sync.forEach(c => c()); },
    retrack(key, n) { const old = state[key]; delete state[key]; h.leave.forEach(c => c({ key, leftPresences: old })); state[key] = [{ n, lv: 'F3' }]; h.join.forEach(c => c({ key, newPresences: state[key] })); h.sync.forEach(c => c()); },
    leave(key) { const old = state[key]; delete state[key]; h.leave.forEach(c => c({ key, leftPresences: old })); h.sync.forEach(c => c()); },
  };
  return ch; } }; } };`;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader'] });
  const ctx = await b.newContext(); await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); } catch (e) {} });
  await ctx.route('**/vendor/supabase/supabase.js', (r) => r.fulfill({ contentType: 'application/javascript', body: MOCK }));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(100);
  await p.waitForTimeout(6000);
  const log = () => p.evaluate(() => [...document.querySelectorAll('.chat-line')].map(e => e.textContent));
  console.log('1) 들어왔을 때 이미 있던 분:', JSON.stringify(await log()), '/', await p.textContent('#onlineCount'));
  await p.evaluate(() => window.__mock.join('b', '은혜')); await p.waitForTimeout(300);
  console.log('2) 새로 들어옴:', JSON.stringify(await log()), '/', await p.textContent('#onlineCount'));
  await p.evaluate(() => window.__mock.retrack('b', '은혜')); await p.waitForTimeout(2600);
  console.log('3) 다시 등록(층 이동 등):', JSON.stringify(await log()), '/', await p.textContent('#onlineCount'));
  await p.evaluate(() => window.__mock.leave('b')); await p.waitForTimeout(2600);
  console.log('4) 진짜 나감:', JSON.stringify(await log()), '/', await p.textContent('#onlineCount'));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
