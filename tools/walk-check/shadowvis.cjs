// 캐릭터의 해 그림자가 그 자리에서 실제로 보이는지: 그림자 기둥 안 여러 자리에서 "매 화면 다시 그리기"와 "층 바뀔 때만 그리기"를 견줌. 사용: node shadowvis.cjs <그림 폴더> [장소들]
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2], steps = (process.argv[3] || 'step6,step5,step7,step4,step1').split(',');
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 420, height: 800 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_bgm_off', '1'); });
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=shvis&time=' + (process.env.T || 'day'), { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__dbg.furn, null, { timeout: 400000, polling: 2000 }); await p.waitForTimeout(4000);
  await p.evaluate(() => { document.getElementById('ui-overlay').style.display = 'none'; });
  for (const st of steps) {
    await p.evaluate((s) => { window.__dbg.shadow('static'); window.__dbg.goTo(s); }, st); await p.waitForTimeout(5000);
    const pos = await p.evaluate(() => window.__dbg.character.position.toArray().map((v) => +v.toFixed(2)));
    // 걸어서 갈 수 있는 자리 가운데 그림자 기둥 안에 드는 곳을 골라 봄 (시작 자리에서 사방으로)
    const spots = await p.evaluate((a) => { const r = []; for (const [dx, dz] of [[0, 0], [1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5], [3, 0], [-3, 0], [0, 3], [0, -3], [2.5, 2.5], [-2.5, -2.5], [-4.5, -2], [-3, 3]]) { const q = [a[0] + dx, a[1], a[2] + dz]; if (window.__dbg.inSunBox(...q)) { const path = window.__dbg.findPath({ x: a[0], y: a[1], z: a[2] }, { x: q[0], y: q[1], z: q[2] }); if (dx === 0 && dz === 0 || (path && path.length)) r.push(q.map((v) => +v.toFixed(2))); } } return r; }, pos);
    let i = 0; const names = [];
    for (const q of spots.slice(0, 7)) {
      await p.evaluate(() => window.__dbg.shadow('static')); await p.waitForTimeout(1200);
      await p.evaluate((m) => { window.__dbg.character.position.set(...m); }, q); await p.waitForTimeout(3200); await p.screenshot({ path: `${out}/${st}-${i}-static.png` });   // 자리만 옮김 (지도는 그대로)
      await p.evaluate(() => window.__dbg.shadow('always')); await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/${st}-${i}-always.png` });
      names.push(`${st}-${i}`); i++;
    }
    console.log(st, 'start', JSON.stringify(pos), 'spots in column:', JSON.stringify(spots.slice(0, 7)), '| pairs:', names.join(','));
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
