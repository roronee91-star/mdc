// 앞 도로: 겹친 도로판(판자처럼 보이던 턱) 확인. node road.cjs <접두어>
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://127.0.0.1:8008/index.html?net=local&time=day', { waitUntil:'domcontentloaded', timeout:120000 }); await p.evaluate(() => { localStorage.setItem('mdc_name','혜연'); localStorage.setItem('mdc_gender','f'); }); await p.reload({ waitUntil:'domcontentloaded' }); await p.waitForTimeout(8000);
await p.evaluate(() => window.__dbg.goTo('step1')); await p.waitForTimeout(2500);
const pre = process.argv[2] || 'road';
const shot = async (c, t, n) => { await p.evaluate(([c, t]) => { document.getElementById('ui-overlay').style.display='none'; window.__dbg.setCam(c, t); }, [c, t]); await p.waitForTimeout(1800); await p.screenshot({ path: `docs/verification/2026-11-05/${pre}-${n}.png` }); };
await shot([-6, 1.3, 20.5], [-6, -0.2, 9], 'front');
await shot([4, 1.3, 20.5], [9, -0.2, 8], 'corner');
console.log(errs.join('\n') || 'no errors'); await b.close(); })();
