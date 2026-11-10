// 아무 자리나 찍기. 사용: [PAGE=..] node shotat.cjs <그림 폴더> <장소> <이름> cx,cy,cz tx,ty,tz [캐릭터 x,y,z]
const { chromium } = require('playwright');
(async () => {
  const [out, step, name, cs, ts, chs] = process.argv.slice(2); const c = cs.split(',').map(Number), t = ts.split(',').map(Number), ch = chs ? chs.split(',').map(Number) : null;
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_bgm_off', '1'); });
  await p.goto('http://127.0.0.1:8008/' + (process.env.PAGE || 'index.html') + '?net=local&room=shotat&time=' + (process.env.T || 'day'), { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__dbg.furn, null, { timeout: 400000, polling: 2000 }); await p.waitForTimeout(4000);
  await p.evaluate((s) => window.__dbg.goTo(s), step); await p.waitForTimeout(5000);
  await p.evaluate(([ch, t]) => { document.getElementById('ui-overlay').style.display = 'none'; const c = window.__dbg.character; if (ch) { c.position.set(...ch); c.visible = true; } else { c.position.set(t[0], c.position.y, t[2]); c.visible = false; } }, [ch, t]); await p.waitForTimeout(700);
  await p.evaluate(([c, t]) => { window.__dbg.setCam(c, t); window.__lockCam = [c, t]; window.__dbg.scene.onBeforeRender = (r, sc, cam) => { const L = window.__lockCam; if (!L) return; cam.position.set(...L[0]); cam.lookAt(...L[1]); cam.updateMatrixWorld(); }; }, [c, t]); await p.waitForTimeout(1800);
  await p.screenshot({ path: `${out}/${name}.png`, timeout: 120000 });
  console.log(name, errs.join('\n') || 'no errors'); await b.close();
})();
