// 4층 아동부실(책장·장난감장, 낮은 풍선) · 2층 소예배실 강대상 높이 · 3층 주방 화면 찍기
// 사용: node rooms1107.cjs <저장폴더> [이름앞말]
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2], pre = process.argv[3] || '';
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_bgm_off', '1'); });
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=r7&time=day', { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__dbg.furn, null, { timeout: 400000, polling: 2000 }); await p.waitForTimeout(4000);
  const shot = async (step, ch, c, t, n) => {
    await p.evaluate((s) => window.__dbg.goTo(s), step); await p.waitForTimeout(5000);
    await p.evaluate((ch) => { document.getElementById('ui-overlay').style.display = 'none'; if (ch) window.__dbg.character.position.set(...ch); }, ch); await p.waitForTimeout(700);
    await p.evaluate(([c, t]) => window.__dbg.setCam(c, t), [c, t]); await p.waitForTimeout(1800);
    await p.screenshot({ path: `${out}/${pre}${n}.png` });
  };
  const F4 = 10.75, F2 = 3.65, F3 = 7.25;
  await shot('step7', [-5.7, F4, -13.0], [-5.7, F4 + 1.9, -11.9], [-5.7, F4 + 0.6, -15.6], 'kids');
  await shot('step7', [-5.2, F4, -14.2], [-4.6, F4 + 1.5, -12.6], [-7.6, F4 + 0.4, -15.2], 'kids-west');
  await shot('step7', [-6.2, F4, -14.2], [-6.9, F4 + 1.5, -12.6], [-3.8, F4 + 0.4, -15.2], 'kids-east');
  await shot('step6', [-10.1, F2 + 0.1, -14.4], [-9.0, F2 + 1.3, -12.6], [-9.7, F2 + 0.45, -14.6], 'pulpit');
  await shot('step5', [-10.0, F3, -11.9], [-9.4, F3 + 1.7, -11.6], [-10.8, F3 + 0.4, -15.0], 'kitchen');
  await shot('step5', [-10.0, F3, -11.9], [-9.6, F3 + 1.1, -14.4], [-10.7, F3 + 0.5, -15.2], 'kitchen-stove');
  await shot('step5', [-9.3, F3, -12.4], [-9.0, F3 + 2.05, -11.55], [-10.7, F3 + 0.4, -14.9], 'kitchen-all');
  // 주방 안 걷기: 문 앞 → 개수대 앞 / 냉장고 앞 / 선반 앞 길이 있는지, 끝점이 가구 안이 아닌지
  const paths = await p.evaluate(() => [[-11.7, -14.6], [-9.55, -16.6], [-9.35, -16.2], [-10.55, -11.75]].map(([x, z]) => { const r = window.__dbg.findPath({ x: -9.2, z: -12.4 }, { x, z }); if (!r || !r.length) return 'none'; const e = r[r.length - 1]; return [r.length, +(e.x !== undefined ? e.x : e[0]).toFixed(2), +(e.z !== undefined ? e.z : e[1]).toFixed(2)]; }));
  console.log('주방 길 (개수대 앞, 냉장고 앞, 선반 앞, 조리대 남쪽):', JSON.stringify(paths));
  // 아동부실: 문 앞 → 양쪽 책장 앞
  await p.evaluate(() => window.__dbg.goTo('step7')); await p.waitForTimeout(5000);
  const kp = await p.evaluate(() => [[-7.5, -16.4], [-3.9, -16.4], [-7.5, -12.7], [-3.9, -12.7]].map(([x, z]) => { const r = window.__dbg.findPath({ x: -5.7, z: -12.0 }, { x, z }); if (!r || !r.length) return 'none'; const e = r[r.length - 1]; return [r.length, +(e.x !== undefined ? e.x : e[0]).toFixed(2), +(e.z !== undefined ? e.z : e[1]).toFixed(2)]; }));
  console.log('아동부실 길 (서북, 동북, 서남, 동남 책장 앞):', JSON.stringify(kp));
  await shot('step5', [-9.3, F3, -13.0], [-10.6, F3 + 1.0, -13.3], [-12.2, F3 + 0.6, -14.4], 'kitchen-sink');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
