// 말풍선이 이름표 바로 위에 붙는지 (한 줄 / 세 줄)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=bb&time=day', { waitUntil:'domcontentloaded', timeout:120000 }); await p.evaluate(() => { localStorage.setItem('mdc_name','혜연'); localStorage.setItem('mdc_gender','f'); }); await p.reload({ waitUntil:'domcontentloaded' }); await p.waitForTimeout(7000);
  await p.evaluate(() => window.__dbg.goTo('step2')); await p.waitForTimeout(2500);
  await p.evaluate(() => { document.getElementById('ui-overlay').style.display='none'; const c = window.__dbg.character.position; window.__dbg.setCam([c.x + 2.4, c.y + 1.4, c.z + 1.2], [c.x, c.y + 1.2, c.z]); }); await p.waitForTimeout(4000);
  for (const [t, f] of [['하이허이', 'bubble-1.png'], ['오늘 예배 정말 은혜로웠어요 다음 주에도 함께 찬양해요 모두 평안하세요', 'bubble-3.png']]) {
    await p.evaluate((t) => window.__dbg.bubble(t), t); await p.waitForTimeout(1800);
    console.log(JSON.stringify(await p.evaluate(() => window.__dbg.character.children.filter(c => c.isSprite).map(c => [+c.position.y.toFixed(2), c.material.opacity]))));
    await p.screenshot({ path: 'docs/verification/2026-11-05/' + f });
  }
  console.log(errs.join('\n')||'no errors'); await b.close();
})();
