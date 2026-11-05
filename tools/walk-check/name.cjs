const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6500);
  console.log('첫 방문 이름 창 보임:', await p.isVisible('#nameModal'));
  await p.screenshot({ path: `${out}/1_modal.png` });
  await p.fill('#nameInput', '혜연'); await p.click('#nameOk'); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/2_tag.png` });
  await p.reload(); await p.waitForTimeout(6500);
  console.log('다시 방문 이름 창 보임:', await p.isVisible('#nameModal'), '/ 버튼:', await p.textContent('#nameBtn'));
  for (const [n, st] of [['3_b1', 'step4'], ['4_f2', 'step6'], ['5_f3', 'step5'], ['6_f4', 'step7']]) {
    await p.evaluate((k) => window.__dbg.goTo(k), st); await p.waitForTimeout(2200); await p.screenshot({ path: `${out}/${n}.png` });
  }
  console.log(errs.join('\n')||'no errors'); await b.close();
})();
