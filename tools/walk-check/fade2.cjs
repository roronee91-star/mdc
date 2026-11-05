const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 640 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); } catch (e) {} });
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  const shot = async (n, st, x, y, z, off) => {
    await p.evaluate((k) => { window.__dbg.goTo(k); document.getElementById('ui-overlay').style.display = 'none'; }, st); await p.waitForTimeout(400);
    await p.evaluate(([x, y, z, off]) => { const { character: c } = window.__dbg; c.position.set(x, y, z); window.__dbg.setCam([x + off[0], y + 0.62 + off[1], z + off[2]], [x, y + 0.62, z]); }, [x, y, z, off]);
    await p.waitForTimeout(2500); await p.screenshot({ path: `${out}/${n}.png` });
    console.log(n, JSON.stringify(await p.evaluate(() => window.__dbg.faded.map(f => f[0] + ':' + f[1]))));
  };
  await shot('1_f2_roomB_from_corridor', 'step6', -10.4, 3.65, -8.6, [4.2, 1.6, 0.6]);    // 복도에서 소그룹실 B 안을 (칸막이 너머)
  await shot('2_f3_room_from_dining', 'step5', -1.0, 7.25, -12.3, [-3.6, 1.5, 1.5]);       // 식당에서 소그룹실 안을
  await shot('3_b1_mother_from_hall', 'step4', -0.2, -6.6, -13.5, [-4.0, 1.8, 1.0]);       // 본당에서 자모실 안을
  await shot('4_f4_pastor_from_garden', 'step7', -10.5, 10.75, -13.0, [1.0, 1.8, 4.2]);    // 정원에서 목양실 안을
  console.log(errs.join('\n')||'no errors'); await b.close();
})();
