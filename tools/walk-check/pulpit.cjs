const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 640 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); } catch (e) {} });
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  await p.evaluate(() => window.__dbg.goTo('step4')); await p.waitForTimeout(600);
  // 강대상 뒤(설교자 자리)·앞으로 길이 있는지
  const C = [-13.03, -17.58];
  for (const [n, dd] of [['강대상 뒤(설교자 자리)', 3.85], ['강대상 앞', 5.4]]) {
    const x = C[0] + dd / Math.SQRT2, z = C[1] + dd / Math.SQRT2;
    const r = await p.evaluate(([x, z]) => { const c = window.__dbg.character.position; const path = window.__dbg.findPath(c.clone(), c.clone().set(x, -6.6, z)); if (!path || !path.length) return 'none'; const e = path[path.length - 1]; return Math.hypot(e.x - x, e.z - z).toFixed(2); }, [x, z]);
    console.log(n, '도착 오차', r);
  }
  // 강대상 앞까지 걸어가기 → 버튼
  const fx = C[0] + 5.4 / Math.SQRT2, fz = C[1] + 5.4 / Math.SQRT2;
  await p.evaluate(([x, z]) => { const c = window.__dbg.character; const path = window.__dbg.findPath(c.position.clone(), c.position.clone().set(x, -6.6, z)); c.position.copy(path[path.length - 1]); c.position.y = -6.38; }, [fx, fz]);
  await p.waitForTimeout(800);
  console.log('기도제목 쓰기 버튼 보임:', await p.isVisible('#btnPrayerWrite'));
  await p.evaluate(() => { const c = window.__dbg.character.position; window.__dbg.setCam([c.x + 2.6, c.y + 2.4, c.z + 2.6], [c.x - 0.9, c.y + 0.5, c.z - 0.9]); });
  await p.waitForTimeout(2000); await p.screenshot({ path: `${out}/1_pulpit_btn.png` });
  await p.click('#btnPrayerWrite'); await p.waitForTimeout(400);
  await p.fill('#ppText', '이번 주 수련회를 위해 기도해 주세요'); await p.waitForTimeout(200);
  await p.screenshot({ path: `${out}/2_write.png` });
  await p.click('#ppSubmitAnon'); await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/3_list.png` });
  console.log('저장:', await p.evaluate(() => JSON.parse(localStorage.getItem('mdc_prayers')).map(x => [x.name || '익명', x.text])));
  await p.click('#ppClose');
  await p.evaluate(() => { document.getElementById('ui-overlay').style.display = 'none'; window.__dbg.character.visible = false; window.__dbg.setCam([-6.0, -4.9, -9.0], [-11.0, -6.0, -14.6]); }); await p.waitForTimeout(2000); await p.screenshot({ path: `${out}/4_stage.png` });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
