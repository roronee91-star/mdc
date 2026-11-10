// "바뀔 때만 그리기(auto)"와 "매 화면 다시 그리기(always)"가 같은 화면인지: 같은 순서로 두 자리(A→B)를 옮겨 다니며 찍어 견줌 (카메라가 자리 잡도록 5초씩 기다림). 사용: node shadoweq.cjs <그림 폴더>
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const CASES = { step1: [[-1.5, 0, 4.5], [0, 0, 7.5], [-1.5, 0, 6]], stepF1: [[-0.93, 0, -1.6], [0.57, 0, -3.1]], step6: [[0.57, 3.65, -3.1], [-2.43, 3.65, -3.1]], step5: [[0.57, 7.25, -3.1], [-0.93, 7.25, -0.1]], step7: [[-4, 10.75, -8], [-4, 10.75, -6.4]], step4: [[-3.93, -6.6, -3.1], [-0.93, -6.6, -6.1]] };
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 420, height: 800 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_bgm_off', '1'); });
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=sheq&time=' + (process.env.T || 'day'), { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__dbg.furn, null, { timeout: 400000, polling: 2000 }); await p.waitForTimeout(4000);
  await p.evaluate(() => { document.getElementById('ui-overlay').style.display = 'none'; });
  for (const [st, spots] of Object.entries(CASES)) {
    for (const mode of ['auto', 'always']) {
      await p.evaluate(([s, m]) => { window.__dbg.shadow(m); window.__dbg.goTo(s); }, [st, mode]); await p.waitForTimeout(5000);
      await p.screenshot({ path: `${out}/${st}-arrive-${mode}.png` });
      let i = 0; for (const q of spots) { await p.evaluate((m) => { window.__dbg.character.position.set(...m); }, q); await p.waitForTimeout(5000); await p.screenshot({ path: `${out}/${st}-s${i++}-${mode}.png` }); }
    }
    console.log(st, 'done');
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
