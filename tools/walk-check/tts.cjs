// 대화를 치면 목소리로 읽어 주는지 (가짜 음성 합성으로 기록): 남녀 목소리, 사람마다 다른 높낮이, 다른 층은 안 읽음, 끄기
// 기기 목소리 두 경우: 아이폰처럼 한국어 여자 목소리 1개뿐 / 엣지처럼 남녀 목소리가 다 있음
const { chromium } = require('playwright');
const IPHONE = [{ name: 'Yuna', lang: 'ko-KR' }];
const EDGE = [{ name: 'Microsoft InJoon Online (Natural) - Korean (Korea)', lang: 'ko-KR' }, { name: 'Microsoft SunHi Online (Natural) - Korean (Korea)', lang: 'ko-KR' }, { name: 'Google US English', lang: 'en-US' }];
const FAKE = `(() => {
  let V = ${JSON.stringify(IPHONE)};
  window.__setVoices = (v) => { V = v; };
  window.__said = [];
  const ss = { speaking: false, paused: false, getVoices: () => V.map((v) => Object.assign({ default: false, localService: true, voiceURI: v.name }, v)), addEventListener() {}, cancel() {}, resume() {},
    speak(u) { if (u.text.trim()) window.__said.push({ text: u.text, pitch: u.pitch, rate: u.rate, voice: u.voice ? u.voice.name.replace(/Microsoft | Online.*$/g, '') : '(기본)' }); setTimeout(() => { u.onstart && u.onstart(); setTimeout(() => u.onend && u.onend(), 300); }, 10); } };
  Object.defineProperty(window, 'speechSynthesis', { value: ss, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
})();`;
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 640, height: 420 } }); await ctx.addInitScript(FAKE);
  const errs = [];
  const open = async (name, g, dev) => { const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(name + ': ' + e.message));
    await p.addInitScript(([n, g, d]) => { localStorage.setItem('mdc_name', n); localStorage.setItem('mdc_gender', g); localStorage.setItem('mdc_device', JSON.stringify(d)); localStorage.removeItem('mdc_tts_off'); }, [name, g, dev]);
    await p.goto('http://127.0.0.1:8008/index.html?net=local&room=tts', { waitUntil: 'commit', timeout: 120000 });
    await p.waitForFunction(() => window.__dbg && window.__speak, null, { timeout: 400000, polling: 2000 });
    await p.evaluate(() => window.__dbg.goTo('step6')); await p.mouse.click(320, 200); console.log(name, '준비됨'); return p; };
  const A = await open('혜연', 'f', 'tA'), B = await open('은혜', 'f', 'tB'), C = await open('철수', 'm', 'tC');
  await A.waitForTimeout(6000);
  const chat = async (p, t) => { await p.evaluate(() => document.getElementById('chatOpen').click()); await p.fill('#chatInput', t); await p.press('#chatInput', 'Enter'); await p.waitForTimeout(2500); };
  const said = (p) => p.evaluate(() => window.__said);
  for (const [label, V] of [['아이폰처럼 여자 목소리 1개', IPHONE], ['엣지처럼 남녀 목소리', EDGE]]) {
    console.log('==== ' + label);
    for (const p of [A, B, C]) await p.evaluate((v) => { window.__setVoices(v); window.__speak.load(); window.__said = []; }, V);
    await chat(A, '안녕하세요 😊 반가워요'); await chat(B, '어서 오세요'); await chat(C, '할렐루야 ㅎㅎ');
    console.log('혜연 화면에서 들린 말:'); (await said(A)).forEach((x) => console.log('   ', JSON.stringify(x)));
  }
  // 다른 층이면 안 읽음
  await C.evaluate(() => window.__dbg.goTo('step5')); await C.waitForTimeout(3000);
  const n0 = (await said(C)).length; await chat(A, '3층에는 안 들려야 해요');
  console.log('3층 철수에게 새로 읽힘:', (await said(C)).length > n0);
  // 끄기
  await B.click('#voiceBtn'); await B.waitForTimeout(300); const n1 = (await said(B)).length; await chat(A, '끈 사람한테는 조용히');
  console.log('은혜가 끈 뒤 새로 읽힘:', (await said(B)).length > n1, '/ 버튼:', await B.textContent('#voiceBtn'), '/ 기억:', await B.evaluate(() => localStorage.getItem('mdc_tts_off')));
  await B.click('#voiceBtn'); await B.waitForTimeout(300);
  console.log('은혜 대화 기록:', (await B.textContent('#chatLog')).slice(-120));
  if (out) await A.screenshot({ path: `${out}/tts.png` });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
