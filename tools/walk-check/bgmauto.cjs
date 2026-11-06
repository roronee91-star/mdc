// 첫 누름에 찬송 반주가 자동으로 켜지는지, 직접 끄면 다음 방문엔 안 켜지는지
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=user-gesture-required'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=bg&time=day', { waitUntil:'domcontentloaded', timeout:120000 }); await p.evaluate(() => { localStorage.setItem('mdc_name','혜연'); localStorage.setItem('mdc_gender','f'); localStorage.removeItem('mdc_bgm_off'); }); await p.reload({ waitUntil:'domcontentloaded' }); await p.waitForTimeout(7000);
  const st = () => p.evaluate(() => document.getElementById('bgmToggle').innerHTML);
  console.log('누르기 전:', await st());
  await p.mouse.click(450, 400); await p.waitForTimeout(800);
  console.log('화면 한 번 누른 뒤:', await st());
  await p.click('#bgmToggle'); await p.waitForTimeout(500);
  console.log('직접 끈 뒤:', await st(), 'off 기억:', await p.evaluate(() => localStorage.getItem('mdc_bgm_off')));
  await p.reload({ waitUntil:'domcontentloaded' }); await p.waitForTimeout(7000);
  await p.mouse.click(450, 400); await p.waitForTimeout(800);
  console.log('다시 들어와 누른 뒤(끈 사람):', await st());
  await p.click('#bgmToggle'); await p.waitForTimeout(500);
  console.log('다시 켠 뒤:', await st(), 'off 기억:', await p.evaluate(() => localStorage.getItem('mdc_bgm_off')));
  console.log(errs.join('\n')||'no errors'); await b.close();
})();
