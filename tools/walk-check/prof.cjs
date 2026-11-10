// 걷는 동안 자바스크립트가 어디에 시간을 쓰는지 재기 (함수별). 사용: [PAGE=_old.html] node prof.cjs step6
const { chromium } = require('playwright');
(async () => {
  const step = process.argv[2] || 'step1';
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 240, height: 440 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const cdp = await ctx.newCDPSession(p);
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_bgm_off', '1');
    window.__fr = 0; const tick = () => { window.__fr++; requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
  await p.goto('http://127.0.0.1:8008/' + (process.env.PAGE || 'index.html') + '?net=local&room=perf&time=' + (process.env.T || 'day'), { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__dbg.furn, null, { timeout: 400000, polling: 500 });
  await p.waitForTimeout(3000);
  if (step !== 'step1') { await p.evaluate((s) => window.__dbg.goTo(s), step); }
  await p.waitForTimeout(8000);
  const walk = async (ms) => { const seq = [['KeyW', 0.3], ['KeyD', 0.2], ['KeyS', 0.3], ['KeyA', 0.2]]; for (const [k, fr] of seq) { await p.keyboard.down(k); await p.waitForTimeout(ms * fr); await p.keyboard.up(k); } };
  await walk(6000);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Profiler.start');
  const f0 = await p.evaluate(() => window.__fr); const t0 = Date.now();
  await walk(+(process.env.MS || 16000));
  const f1 = await p.evaluate(() => window.__fr); const wall = Date.now() - t0;
  const { profile } = await cdp.send('Profiler.stop');
  const self = new Map(); const dts = profile.timeDeltas, ids = profile.samples; const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  let total = 0; ids.forEach((id, i) => { const n = byId.get(id), dt = dts[i] / 1000; total += dt; const key = (n.callFrame.functionName || '(anon)') + ':' + n.callFrame.lineNumber; self.set(key, (self.get(key) || 0) + dt); });
  const frames = f1 - f0; const idle = (self.get('(idle):-1') || 0) + (self.get('(program):-1') || 0);
  console.log(process.env.PAGE || 'index.html', step, '| frames', frames, 'in', wall, 'ms | JS busy per frame:', ((total - idle) / frames).toFixed(1), 'ms | idle+program', Math.round(idle), 'of', Math.round(total));
  [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, +(process.env.TOP || 22)).forEach(([k, v]) => console.log('  ', (v / frames).toFixed(2).padStart(7), 'ms/frame ', k));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
