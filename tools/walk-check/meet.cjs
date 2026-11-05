// 연습 모드(?net=local)로 같은 브라우저의 두 화면이 서로 보이고 대화되는지
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 900, height: 600 } });
  const errs = [];
  const open = async (name, dev) => {
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(name + ' console: ' + m.text()); });
    await p.addInitScript(([n, d]) => { sessionStorage.setItem('x', '1'); }, [name, dev]);
    await p.goto('http://127.0.0.1:8008/index.html?net=local&room=test');
    await p.evaluate(([n, d]) => { localStorage.setItem('mdc_name', n); localStorage.setItem('mdc_device', JSON.stringify(d)); }, [name, dev]);
    await p.reload(); await p.waitForTimeout(6500);
    return p;
  };
  const A = await open('혜연', 'dA'), B = await open('은혜', 'dB');
  await A.evaluate(() => window.__dbg.goTo('step4')); await B.evaluate(() => window.__dbg.goTo('step4'));
  await A.waitForTimeout(3500);
  console.log('A 접속 표시:', await A.textContent('#onlineCount'), '/ B:', await B.textContent('#onlineCount'));
  // B를 A 앞으로 옮기고 앉아서 기도
  await B.evaluate(() => { const c = window.__dbg.character; c.position.set(-4.0, -6.6, -6.5); c.rotation.y = Math.PI; });
  await B.click('#btnActionPray');
  await A.waitForTimeout(2500);
  console.log('A가 본 B:', await A.evaluate(() => { const r = [...window.__remotes.values()][0]; return r ? { name: r.name, vis: r.group.visible, pos: r.group.position.toArray().map(v => +v.toFixed(2)) } : null; }));
  // 대화
  await B.click('#chatOpen'); await B.fill('#chatInput', '안녕하세요! 반가워요 🙏'); await B.press('#chatInput', 'Enter');
  await A.waitForTimeout(1500);
  console.log('A 대화 기록:', await A.textContent('#chatLog'));
  await A.evaluate(() => { const c = window.__dbg.character; c.position.set(-2.4, -6.6, -3.6); c.rotation.y = Math.atan2(-1.6, -2.9); window.__dbg.setCam([-1.2, -4.4, -1.6], [-3.4, -5.9, -5.6]); });
  await A.waitForTimeout(1500); await A.screenshot({ path: `${out}/A_sees_B.png` });
  // B가 다른 층으로 가면 A에서 안 보임
  await B.evaluate(() => window.__dbg.goTo('step5')); await A.waitForTimeout(2500);
  console.log('B가 3층 간 뒤 A에서 보임?', await A.evaluate(() => { const r = [...window.__remotes.values()][0]; return r && r.group.visible; }));
  await B.close(); await A.waitForTimeout(14500);
  console.log('B 나간 뒤 A:', await A.textContent('#onlineCount'), '| remotes', await A.evaluate(() => window.__remotes.size));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
