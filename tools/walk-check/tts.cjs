// 대화를 치면 목소리로 읽어 주는지 (가짜 음성 합성으로 기록): 남녀 목소리, 사람마다 다른 높낮이, 다른 층은 안 읽음, 끄기
const { chromium } = require('playwright');
const FAKE = (voices) => `(() => {
  const V = ${JSON.stringify(voices)}.map((v) => Object.assign({ default: false, localService: true, voiceURI: v.name }, v));
  window.__said = [];
  const ss = { speaking: false, paused: false, getVoices: () => V, addEventListener() {}, cancel() { window.__said.push({ cancel: true }); }, resume() {},
    speak(u) { if (u.text.trim()) window.__said.push({ text: u.text, pitch: u.pitch, rate: u.rate, voice: u.voice ? u.voice.name : '', lang: u.lang }); setTimeout(() => { u.onstart && u.onstart(); setTimeout(() => u.onend && u.onend(), 300); }, 10); } };
  Object.defineProperty(window, 'speechSynthesis', { value: ss, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
})();`;
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  for (const [label, voices] of [['아이폰처럼 여자 목소리 1개(Yuna)', [{ name: 'Yuna', lang: 'ko-KR' }]],
                                  ['엣지처럼 남녀 목소리(InJoon·SunHi)', [{ name: 'Microsoft InJoon Online (Natural) - Korean (Korea)', lang: 'ko-KR' }, { name: 'Microsoft SunHi Online (Natural) - Korean (Korea)', lang: 'ko-KR' }, { name: 'Google US English', lang: 'en-US' }]]]) {
    console.log('==== ' + label);
    const ctx = await b.newContext({ viewport: { width: 900, height: 600 } }); await ctx.addInitScript(FAKE(voices));
    const errs = [];
    const open = async (name, g, dev) => { const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(name + ': ' + e.message));
      await p.goto('http://127.0.0.1:8008/index.html?net=local&room=tts' + label.length, { waitUntil: 'domcontentloaded', timeout: 120000 }); await p.evaluate(([n, g, d]) => { localStorage.setItem('mdc_name', n); localStorage.setItem('mdc_gender', g); localStorage.setItem('mdc_device', JSON.stringify(d)); }, [name, g, dev]); await p.reload({ waitUntil: 'commit', timeout: 120000 }); await p.waitForFunction(() => window.__dbg && window.__speak, null, { timeout: 180000 }); await p.waitForTimeout(3000); return p; };
    const A = await open('혜연', 'f', 'tA'), B = await open('은혜', 'f', 'tB'), C = await open('철수', 'm', 'tC'), D = await open('민준', 'm', 'tD');
    const all = [A, B, C, D];
    for (const p of all) { await p.evaluate(() => window.__dbg.goTo('step6')); await p.mouse.click(450, 300); }
    await A.waitForTimeout(3000);
    const chat = async (p, t) => { await p.evaluate(() => document.getElementById('chatOpen').click()); await p.fill('#chatInput', t); await p.press('#chatInput', 'Enter'); await p.waitForTimeout(1200); };
    await chat(A, '안녕하세요 😊 반가워요'); await chat(B, '어서 오세요'); await chat(C, '할렐루야 ㅎㅎ'); await chat(D, '오늘 예배 좋았어요');
    const said = (p) => p.evaluate(() => window.__said.filter((x) => !x.cancel));
    const sa = await said(A);
    console.log('혜연 화면에서 들린 말:'); sa.forEach((x) => console.log('  ', JSON.stringify(x)));
    // 다른 층이면 안 읽음
    await D.evaluate(() => window.__dbg.goTo('step5')); await D.waitForTimeout(1500);
    const n0 = (await said(D)).length; await chat(A, '3층에는 안 들려야 해요');
    console.log('3층 민준에게 새로 읽힘:', (await said(D)).length > n0);
    // 끄기
    await B.click('#voiceBtn'); await B.waitForTimeout(300); const n1 = (await said(B)).length; await chat(C, '끈 사람한테는 조용히');
    console.log('은혜가 끈 뒤 새로 읽힘:', (await said(B)).length > n1, '/ 버튼:', await B.textContent('#voiceBtn'), '/ 기억:', await B.evaluate(() => localStorage.getItem('mdc_tts_off')));
    await B.click('#voiceBtn'); await B.waitForTimeout(200);
    if (out) await A.screenshot({ path: `${out}/tts-${label.length}.png` });
    console.log(errs.join('\n') || 'no errors'); await ctx.close();
  }
  await b.close();
})();
