const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 640 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); } catch (e) {} });
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  const op = (sel) => p.evaluate((s) => { const e = document.querySelector(s); return e.hidden ? 'hidden' : (+getComputedStyle(e).opacity).toFixed(2); }, sel);
  await p.evaluate(() => window.__dbg.goTo('step4'));
  const seq = []; for (const t of [0, 60, 140, 400]) { await p.waitForTimeout(t ? t - (seq.length ? [0, 60, 140, 400][seq.length - 1] : 0) : 0); seq.push(t + 'ms:' + await op('#btnActionPew')); }
  console.log('의자 착석 버튼 나타남', seq.join(' '));
  await p.evaluate(() => window.__dbg.goTo('step5'));
  const seq2 = []; for (const t of [30, 120, 300]) { await p.waitForTimeout(t === 30 ? 30 : t === 120 ? 90 : 180); seq2.push(t + 'ms:' + await op('#btnActionPew')); }
  console.log('의자 착석 버튼 사라짐', seq2.join(' '));
  await p.click('#prayerBtn'); await p.waitForTimeout(90); await p.screenshot({ path: `${out}/panel_mid.png` });
  console.log('기도제목 창 90ms', await op('#prayerPanel')); await p.waitForTimeout(400); console.log('기도제목 창 500ms', await op('#prayerPanel'));
  await p.click('#ppClose'); await p.waitForTimeout(100); console.log('닫는 중 100ms', await op('#prayerPanel')); await p.waitForTimeout(300); console.log('닫힌 뒤', await op('#prayerPanel'));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
