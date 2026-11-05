const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'] });
  const errs = [];
  for (const tm of ['night', 'day']) {
    const ctx = await b.newContext({ viewport: { width: 1000, height: 640 } });
    await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); } catch (e) {} });
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(tm + ': ' + e.message));
    await p.goto(`http://127.0.0.1:8008/index.html?net=local&time=${tm}`); await p.waitForTimeout(7000);
    await p.evaluate(() => { document.getElementById('ui-overlay').style.display = 'none'; });
    const cam = async (n, st, c, t) => { await p.evaluate(([st, c, t]) => { window.__dbg.goTo(st); window.__dbg.character.visible = false; window.__dbg.setCam(c, t); }, [st, c, t]); await p.waitForTimeout(2200); await p.screenshot({ path: `${out}/${tm}_${n}.png` }); };
    await cam('1_outside', 'step1', [10, 6, 22], [-6, 6, -4]);
    await cam('2_sanctuary', 'step4', [-2.6, -4.2, -3.2], [-10.8, -4.4, -13.8]);
    await cam('3_lobby', 'stepF1', [-0.8, 1.9, -10.6], [-4.0, 1.0, -14.0]);
    await cam('4_garden', 'step7', [-1.4, 12.4, -4.6], [-8.0, 10.8, -9.0]);
    if (tm === 'night') {
      await p.evaluate(() => document.getElementById('ui-overlay').style.display = '');
      await p.click('#bgmToggle'); await p.waitForTimeout(1500); console.log('토스트:', await p.textContent('#toast'));
      await p.click('#bgmToggle');
    }
    await ctx.close();
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
