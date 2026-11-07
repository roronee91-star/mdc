// 4층 그룹실 홈카페 구석 화면 찍기 + 걷기 길 확인 (T=night 이면 밤)
// 사용: node homecafe.cjs <저장폴더> [이름앞말] [찍을 장면들: user,high,corner,front,north,south,end,west]
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2], pre = process.argv[3] || '';
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_bgm_off', '1'); });
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=cafe&time=' + (process.env.T || 'day') + '', { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__dbg.furn, null, { timeout: 400000, polling: 2000 }); await p.waitForTimeout(4000);
  const shot = async (step, ch, c, t, n) => {
    await p.evaluate((s) => window.__dbg.goTo(s), step); await p.waitForTimeout(5000);
    await p.evaluate((ch) => { document.getElementById('ui-overlay').style.display = 'none'; if (ch) window.__dbg.character.position.set(...ch); }, ch); await p.waitForTimeout(700);
    await p.evaluate(([c, t]) => window.__dbg.setCam(c, t), [c, t]); await p.waitForTimeout(1800);
    await p.screenshot({ path: `${out}/${pre}${n}.png` });
  };
  const F4 = 10.75;
  const only = process.argv[4] ? process.argv[4].split(',') : null, want = (n) => !only || only.includes(n);
  if (want('user')) await shot('step7', [-2.0, F4, -14.6], [-1.6, F4 + 1.5, -13.0], [-2.0, F4 + 0.6, -16.8], 'user');
  if (want('high')) await shot('step7', [-1.9, F4, -12.2], [-0.4, F4 + 2.7, -11.7], [-1.7, F4 + 0.2, -15.6], 'high');
  if (want('corner')) await shot('step7', [-1.4, F4, -13.6], [-2.15, F4 + 1.75, -11.9], [-1.25, F4 + 0.75, -16.0], 'corner');
  if (want('front')) await shot('step7', [-0.5, F4, -12.5], [-2.25, F4 + 1.05, -16.21], [-1.04, F4 + 0.85, -16.21], 'front');
  if (want('north')) await shot('step7', [-0.5, F4, -12.5], [-2.2, F4 + 0.95, -16.95], [-1.04, F4 + 0.75, -16.95], 'north');
  if (want('south')) await shot('step7', [-0.5, F4, -12.5], [-2.2, F4 + 0.95, -15.55], [-1.04, F4 + 0.75, -15.55], 'south');
  if (want('end')) await shot('step7', [-0.5, F4, -12.5], [-1.75, F4 + 1.1, -15.4], [-1.85, F4 + 0.9, -17.32], 'end');
  if (want('west')) await shot('step7', [-0.5, F4, -12.5], [-1.45, F4 + 1.1, -16.0], [-2.35, F4 + 1.0, -16.45], 'west');
  const kp = await p.evaluate(() => [[-1.85, -16.75], [-1.75, -15.6], [-0.6, -14.6], [-1.25, -12.0]].map(([x, z]) => { const r = window.__dbg.findPath({ x: -1.4, z: -11.9 }, { x, z }); if (!r || !r.length) return 'none'; const e = r[r.length - 1]; return [r.length, +(e.x !== undefined ? e.x : e[0]).toFixed(2), +(e.z !== undefined ? e.z : e[1]).toFixed(2)]; }));
  console.log('그룹실 길 (카페장 앞 안쪽, 카페장 앞 남쪽, 기둥 앞, 문 앞):', JSON.stringify(kp));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
