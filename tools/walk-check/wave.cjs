// 인사하기: 창 두 개(같은 브라우저, ?net=local)에서 서로 가까이 → 버튼 보임 → A가 인사 → B 화면에 A가 손 흔듦
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 760 } }); const errs = [];
  await ctx.addInitScript(() => { try { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); } } catch (e) {} });
  const open = async (name, g) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 4).join(' / ')));
    await p.goto('http://127.0.0.1:8008/index.html?net=local&room=wave&time=day', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await p.evaluate(([n, g]) => { localStorage.setItem('mdc_name', n); localStorage.setItem('mdc_gender', g); localStorage.setItem('mdc_device', JSON.stringify('d' + n)); }, [name, g]);
    await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(7000); return p; };   // 같은 브라우저라 기기 번호를 창마다 다르게
  const A = await open('A', 'f'); const B = await open('B', 'm');
  for (const p of [A, B]) { await p.evaluate(() => window.__dbg.goTo('step5')); }
  await A.waitForTimeout(3000);
  // B를 A 앞 1.5m에 세우고 서로 마주 보게
  await B.evaluate(() => { const c = window.__dbg.character; c.position.x += 1.2; c.position.z += 0.8; c.rotation.y = Math.atan2(-1.2, -0.8); });
  await A.evaluate(() => { const c = window.__dbg.character; c.rotation.y = Math.atan2(1.2, 0.8); });
  await A.waitForTimeout(3000);
  const vis = async (p) => p.evaluate(() => { const e = document.getElementById('btnWave'); return !e.hidden && e.dataset.want === '1'; });
  console.log('버튼 보임 A/B:', await vis(A), await vis(B));
  console.log('A가 보는 사람:', await A.evaluate(() => JSON.stringify([...window.__remotes.values()].map(r => [r.group.visible, r.group.position.toArray().map(v => +v.toFixed(2)), r.target && r.target.lv])) + ' 나: ' + JSON.stringify(window.__dbg.character.position.toArray().map(v => +v.toFixed(2)))));
  if (!(await vis(A))) { console.log(errs.join('\n')); await b.close(); return; }
  await A.click('#btnWave'); await B.waitForTimeout(700);
  console.log('B가 본 A의 w 신호:', await B.evaluate(() => [...window.__remotes.values()].map(r => r.target && r.target.w)));
  // 앞에서 본 모습: A의 정면 1.4m 앞에서 A를 바라봄
  const front = () => { const r = [...window.__remotes.values()][0]; const g = r ? r.group : window.__dbg.character; const q = g.position, a = g.rotation.y;
    window.__dbg.setCam([q.x + Math.sin(a) * 1.5, q.y + 1.0, q.z + Math.cos(a) * 1.5], [q.x, q.y + 0.6, q.z]); };
  await B.evaluate(front); await B.waitForTimeout(400); await B.screenshot({ path: 'docs/verification/2026-11-05/wave-other.png' });
  await A.evaluate(() => { const g = window.__dbg.character, q = g.position, a = g.rotation.y; window.__dbg.setCam([q.x + Math.sin(a) * 1.5, q.y + 1.0, q.z + Math.cos(a) * 1.5], [q.x, q.y + 0.6, q.z]); });
  await A.waitForTimeout(300); await A.screenshot({ path: 'docs/verification/2026-11-05/wave-me.png' });
  await A.waitForTimeout(3000);
  console.log('3초 뒤 B가 본 A의 w 신호:', await B.evaluate(() => [...window.__remotes.values()].map(r => r.target && r.target.w)));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
