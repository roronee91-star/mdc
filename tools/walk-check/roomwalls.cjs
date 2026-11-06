// 방 안 벽: 벽지 + 원목 한 면 (2층 소예배실·사무실, 3층 소그룹실, 4층 목양실·아동부 예배실·그룹실)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=rw&time=day', { waitUntil:'domcontentloaded', timeout:120000 }); await p.evaluate(() => { localStorage.setItem('mdc_name','혜연'); localStorage.setItem('mdc_gender','f'); }); await p.reload({ waitUntil:'domcontentloaded' }); await p.waitForTimeout(7000);
  const shots = [
    ['step6', [-9.6, 3.65, -10.0], [-9.4, 3.65 + 2.0, -9.0], [-9.6, 3.65 + 1.0, -15.4], 'room-f2chapel.png'],
    ['step6', [-9.6, 3.65, -5.0], [-8.0, 3.65 + 2.0, -3.4], [-11.5, 3.65 + 0.9, -7.6], 'room-f2office.png'],
    ['step5', [-1.5, 7.25, -11.0], [-0.6, 7.25 + 1.8, -10.7], [-1.9, 7.25 + 0.9, -12.8], 'room-f3group.png'],
    ['step7', [-10.5, 10.75, -12.4], [-9.6, 12.4, -11.9], [-11.2, 11.6, -16.5], 'room-f4pastor.png'],
    ['step7', [-5.7, 10.75, -12.6], [-5.2, 10.75 + 2.1, -11.9], [-6.0, 10.75 + 0.6, -16.6], 'room-f4kids.png'],
    ['step7', [-1.2, 10.75, -12.2], [-0.4, 10.75 + 2.0, -11.8], [-2.2, 10.75 + 0.9, -15.6], 'room-f4group.png'],
  ];
  for (const [st, ch, cam, look, f] of shots) {
    await p.evaluate((st) => window.__dbg.goTo(st), st); await p.waitForTimeout(5000);
    await p.evaluate(([ch, cam, look]) => { document.getElementById('ui-overlay').style.display='none'; window.__dbg.character.position.set(...ch); }, [ch, cam, look]); await p.waitForTimeout(600); await p.evaluate(([ch, cam, look]) => { window.__dbg.setCam(cam, look); }, [ch, cam, look]); await p.waitForTimeout(2200);
    await p.screenshot({ path: 'docs/verification/2026-11-05/' + f });
  }
  console.log(errs.join('\n')||'no errors'); await b.close();
})();
