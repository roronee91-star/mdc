const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 640 } });
  const errs = [];
  const open = async (name, dev) => { const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(name + ': ' + e.message));
    await p.goto('http://127.0.0.1:8008/index.html?net=local&room=lt&time=night', { waitUntil: 'domcontentloaded', timeout: 120000 }); await p.evaluate(([n, d]) => { localStorage.setItem('mdc_name', n); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_device', JSON.stringify(d)); }, [name, dev]); await p.reload({ waitUntil: 'domcontentloaded', timeout: 120000 }); await p.waitForTimeout(6500); return p; };
  const A = await open('혜연', 'lA');
  // 바깥 나무 조명 (밤)
  await A.evaluate(() => { document.getElementById('ui-overlay').style.display = 'none'; window.__dbg.character.visible = false; window.__dbg.setCam([8, 5, 20], [-10, 4, -6]); }); 
  
  await A.evaluate(() => { document.getElementById('ui-overlay').style.display = ''; window.__dbg.character.visible = true; window.__dbg.goTo('step5'); });
  const B = await open('은혜', 'lB'); await B.evaluate(() => window.__dbg.goTo('step5'));
  await A.waitForTimeout(2500);
  // A: 소그룹실 1 안으로
  await A.evaluate(() => { const c = window.__dbg.character; c.position.set(-1.6, 7.25, -13.6); }); await A.waitForTimeout(800);
  console.log('A 버튼:', await A.isVisible('#btnLight'), await A.textContent('#btnLight'));
  await A.evaluate(() => { document.getElementById('ui-overlay').style.display = 'none'; window.__dbg.setCam([-2.9, 9.6, -11.6], [-1.1, 7.6, -13.8]); }); await A.waitForTimeout(1800); await A.screenshot({ path: `${out}/3_off.png` });
  await A.evaluate(() => document.getElementById('ui-overlay').style.display = ''); await A.click('#btnLight'); await A.waitForTimeout(400);
  console.log('켠 뒤 A 버튼:', await A.textContent('#btnLight'));
  await A.evaluate(() => { document.getElementById('ui-overlay').style.display = 'none'; window.__dbg.setCam([-2.9, 9.6, -11.6], [-1.1, 7.6, -13.8]); }); await A.waitForTimeout(1800); await A.screenshot({ path: `${out}/4_on.png` });
  await B.waitForTimeout(1500);
  console.log('B에서도 켜짐:', await B.evaluate(() => window.__rooms.find(r => r.id === 'f3g1').on));
  // 새로 들어온 C도 켜진 상태를 받는지
  const C = await open("민수", "lC"); await C.evaluate(() => window.__dbg.goTo("step5")); await C.waitForTimeout(9000);
  console.log('나중에 들어온 C에서도 켜짐:', await C.evaluate(() => window.__rooms.find(r => r.id === 'f3g1').on));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
