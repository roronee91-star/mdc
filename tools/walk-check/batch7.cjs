const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 640 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); } catch (e) {} });
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (/실패/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6500);
  const view = async (n, st, cam, tgt, hideUi = true) => {
    await p.evaluate(([st, h]) => { window.__dbg.goTo(st); document.getElementById('ui-overlay').style.display = h ? 'none' : ''; }, [st, hideUi]); await p.waitForTimeout(400);
    await p.evaluate(([c, t]) => window.__dbg.setCam(c, t), [cam, tgt]); await p.waitForTimeout(2200);
    await p.screenshot({ path: `${out}/${n}.png` });
  };
  await view('1_stage', 'step4', [-6.5, -4.6, -9.5], [-10.8, -5.6, -14.2]);
  await view('2_mother', 'step4', [-4.5, -3.6, -9.0], [-0.2, -6.2, -13.5]);
  await view('3_engineer', 'step4', [-6.2, -3.9, -5.4], [-6.2, -6.0, -0.9]);
  await view('4_cars', 'step1', [-2.0, 1.6, -3.0], [-7.0, 0.3, -7.2]);
  await view('5_crosswalk', 'step1', [6, 9, 24], [-1.4, 0, 12]);
  await view('6_f1_far', 'step1', [14, 22, 32], [-5, 4, -8]);
  // 기도제목: 쓰기 → 목록
  await p.evaluate(() => { document.getElementById('ui-overlay').style.display = ''; window.__dbg.goTo('step4'); }); await p.waitForTimeout(600);
  await p.click('#prayerBtn'); await p.waitForTimeout(300);
  await p.click('.pp-tab[data-tab="write"]'); await p.click('.pp-chip[data-c="가정"]');
  await p.fill('#ppText', '아버지 건강이 회복되도록 함께 기도해 주세요.'); await p.click('#ppSubmit'); await p.waitForTimeout(200);
  await p.click('.pp-tab[data-tab="write"]'); await p.click('.pp-chip[data-c="교회"]'); await p.check('#ppAnon');
  await p.fill('#ppText', '새 성전 건축이 은혜 가운데 잘 마무리되도록'); await p.click('#ppSubmit'); await p.waitForTimeout(200);
  await p.click('.pp-pray'); await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/7_prayer_list.png` });
  await p.click('#ppClose');
  await view('8_board_b1', 'step4', [-2.0, -5.3, -6.0], [0.6, -5.2, -6.0], false);
  console.log('저장된 기도제목 수:', await p.evaluate(() => JSON.parse(localStorage.getItem('mdc_prayers')).length));
  console.log(errs.join('\n')||'no errors'); await b.close();
})();
