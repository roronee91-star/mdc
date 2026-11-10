// 해 그림자 지도를 "바뀔 때만" 다시 그려도 화면이 같은지 확인: 장소마다 ① 가만히 있을 때 ② 그림자 기둥 안에 들어갔다 나온 뒤(잔상 없는지) 를 "매 화면 다시 그리기"와 견줌. 다시 그린 횟수도 셈.
// 사용: node shadowchk.cjs <그림 폴더> [장소들]
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2], steps = (process.argv[3] || 'step1,stepF1,step6,step5,step7,step4').split(',');
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 420, height: 800 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_bgm_off', '1');
    window.__fr = 0; const o = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (cb) => o((t) => { cb(t); window.__fr++; }); });
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=shchk&time=' + (process.env.T || 'day'), { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__dbg.furn, null, { timeout: 400000, polling: 2000 }); await p.waitForTimeout(4000);
  console.log('sun shadow camera [left,right,top,bottom,near,far]:', JSON.stringify(await p.evaluate(() => window.__dbg.sunCam)));
  await p.evaluate(() => { document.getElementById('ui-overlay').style.display = 'none'; });
  const runs = () => p.evaluate(() => [window.__dbg.shadowRuns, window.__fr]);
  const shot = async (name) => { await p.waitForTimeout(600); await p.screenshot({ path: `${out}/${name}.png` }); };
  for (const st of steps) {
    await p.evaluate((s) => { window.__dbg.shadow('auto'); window.__dbg.goTo(s); }, st); await p.waitForTimeout(5000);
    const pos = await p.evaluate(() => window.__dbg.character.position.toArray().map((v) => +v.toFixed(2)));
    const inBox = await p.evaluate((q) => window.__dbg.inSunBox(...q), pos);
    const r0 = await runs(); await p.waitForTimeout(5000); const r1 = await runs();
    await shot(`${st}-idle-auto`);
    await p.keyboard.down('KeyW'); await p.waitForTimeout(3000); await p.keyboard.up('KeyW'); const r2 = await runs();
    const pos2 = await p.evaluate(() => window.__dbg.character.position.toArray().map((v) => +v.toFixed(2)));
    // 그림자 기둥 한가운데(그 층 높이)로 순간 이동했다가 제자리로 → 잔상이 남는지
    const mid = [20 * pos[1] / 35, pos[1], 25 * pos[1] / 35];
    await p.evaluate(([a, m]) => { const c = window.__dbg.character; c.position.set(...m); }, [pos, mid]); await p.waitForTimeout(1500);
    await shot(`${st}-mid-auto`);
    await p.evaluate((a) => { window.__dbg.character.position.set(...a); }, pos); await p.waitForTimeout(3500);
    await shot(`${st}-back-auto`);
    await p.evaluate(() => window.__dbg.shadow('always')); await p.waitForTimeout(1500);
    await shot(`${st}-back-always`);
    await p.evaluate(([a, m]) => { const c = window.__dbg.character; c.position.set(...m); }, [pos, mid]); await p.waitForTimeout(1500);
    await shot(`${st}-mid-always`);
    await p.evaluate((a) => { window.__dbg.character.position.set(...a); }, pos); await p.waitForTimeout(3500);
    await shot(`${st}-idle-always`);
    console.log(st, '| start', JSON.stringify(pos), 'in shadow column:', inBox, '| idle 5s: shadow redraws', r1[0] - r0[0], 'of', r1[1] - r0[1], 'frames | walking 3s:', r2[0] - r1[0], 'of', r2[1] - r1[1], 'frames, ended at', JSON.stringify(pos2));
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
