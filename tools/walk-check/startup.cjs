// 처음 열 때·층 옮길 때 화면이 얼마나 멈추는지 재기: 화면이 그려진 시각들, 만든 셰이더 수. 사용: [PAGE=_old.html] node startup.cjs step6
const { chromium } = require('playwright');
(async () => {
  const steps = (process.argv[2] || '').split(',').filter(Boolean);
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 200, height: 360 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_bgm_off', '1');
    window.__ends = []; window.__links = 0; const o = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => o((t) => { cb(t); window.__ends.push(performance.now()); });
    const P = WebGL2RenderingContext.prototype; const ol = P.linkProgram; P.linkProgram = function (pr) { window.__links++; return ol.call(this, pr); }; });
  await p.goto('http://127.0.0.1:8008/' + (process.env.PAGE || 'index.html') + '?net=local&room=perf&time=' + (process.env.T || 'day'), { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__dbg.furn, null, { timeout: 400000, polling: 200 });
  const gaps = async (label, since) => { const r = await p.evaluate((since) => { const e = window.__ends.filter((t) => t >= since); const g = []; let prev = since; e.forEach((t) => { g.push(Math.round(t - prev)); prev = t; });
      const big = g.filter((x) => x > 400); return { frames: e.length, firstFrameAfter: g[0], stallsOver400ms: big, stallSum: big.reduce((a, c) => a + c, 0), links: window.__links, now: Math.round(performance.now() - since) }; }, since);
    console.log(label.padEnd(14), JSON.stringify(r)); };
  const tReady = await p.evaluate(() => { const e = window.__ends; return e.length ? e[e.length - 1] : performance.now(); });
  const tModel = await p.evaluate(() => performance.now());
  await p.waitForTimeout(+(process.env.WAIT || 30000)); await gaps('load', 0);
  for (const step of steps) { const t = await p.evaluate((s) => { const a = performance.now(); window.__dbg.goTo(s); return a; }, step); await p.waitForTimeout(+(process.env.WAIT || 30000)); await gaps(step, t); }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
