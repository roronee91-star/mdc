// 실제 휴대폰(크롬 계열)에만 있는 "셰이더 뒤에서 만들기" 기능을 흉내 내어, 미리 만들기 코드가 얼마나 자주 물어보는지 재기. 사용: [PAGE=..] [DONE=10000] node pollsim.cjs
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 200, height: 360 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const cdp = await ctx.newCDPSession(p);
  await p.addInitScript((DONE) => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_bgm_off', '1');
    window.__q = 0; window.__qt = 0; window.__links = 0; window.__cb = 0;
    const P = WebGL2RenderingContext.prototype; const born = new WeakMap();
    const oe = P.getExtension; P.getExtension = function (n) { if (n === 'KHR_parallel_shader_compile') return { COMPLETION_STATUS_KHR: 0x91B1 }; return oe.call(this, n); };
    const ol = P.linkProgram; P.linkProgram = function (pr) { window.__links++; born.set(pr, performance.now()); return ol.call(this, pr); };
    const og = P.getProgramParameter; P.getProgramParameter = function (pr, pn) { if (pn === 0x91B1) { const a = performance.now(); window.__q++; og.call(this, pr, 0x8B82); const r = a - (born.get(pr) || 0) > DONE; window.__qt += performance.now() - a; return r; } return og.call(this, pr, pn); };
    const o = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (cb) => o((t) => { cb(t); window.__cb++; });
  }, +(process.env.DONE || 10000));
  await p.goto('http://127.0.0.1:8008/' + (process.env.PAGE || 'index.html') + '?net=local&room=perf&time=day', { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__dbg.furn, null, { timeout: 400000, polling: 200 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: +(process.env.SLOW || 4) });
  let prev = { q: 0, cb: 0 };
  for (let i = 1; i <= 8; i++) { await p.waitForTimeout(3000); const r = await p.evaluate(() => ({ q: window.__q, qt: Math.round(window.__qt), links: window.__links, cb: window.__cb })); console.log('t=' + i * 3 + 's', 'status questions in last 3s:', r.q - prev.q, '| frames drawn in last 3s:', r.cb - prev.cb, '| programs:', r.links); prev = r; }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
