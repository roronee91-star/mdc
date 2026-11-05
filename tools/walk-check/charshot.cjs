const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 800 } });
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  const cam = (px,py,pz,tx,ty,tz) => p.evaluate(([a,b,c,d,e,f]) => { const {camera,controls}=window.__dbg; controls.target.set(d,e,f); camera.position.set(a,b,c); controls.update(); }, [px,py,pz,tx,ty,tz]);
  await p.evaluate(()=>document.getElementById('ui-overlay').style.display='none');
  // 캐릭터는 (-1.5,0,7.5)에서 남쪽(+z 반대? rotation PI → 얼굴 -z) 을 봄
  await cam(-1.5, 0.75, 5.6, -1.5, 0.55, 7.5); await p.waitForTimeout(800); await p.screenshot({ path: out + '/front.png' });
  await cam(0.3, 0.8, 7.0, -1.5, 0.5, 7.5); await p.waitForTimeout(800); await p.screenshot({ path: out + '/side.png' });
  // 걷기
  await p.mouse.click(500, 300); await p.waitForTimeout(350); await p.screenshot({ path: out + '/walk.png' });
  await p.evaluate(()=>document.getElementById('ui-overlay').style.display='');
  await p.click('#btnActionPew'); await p.waitForTimeout(1500);
  await p.evaluate(()=>{ const {camera,controls}=window.__dbg; const t=window.__dbg.character.position.clone(); controls.target.set(t.x,t.y+0.4,t.z); camera.position.set(t.x+1.2, t.y+0.9, t.z+1.0); controls.update(); });
  await p.waitForTimeout(800); await p.screenshot({ path: out + '/sit.png' });
  await p.click('#btnActionEat'); await p.waitForTimeout(1500); await p.screenshot({ path: out + '/eat.png' });
  console.log(errs.join('\n')||'no errors'); await b.close();
})();
