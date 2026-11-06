// 대화를 치면 목소리로 읽어 주는지 (가짜 음성 합성으로 기록): 남녀 목소리, 사람마다 다른 높낮이, 다른 층은 안 읽음, 끄기
// 기기 목소리 두 경우: 아이폰처럼 한국어 여자 목소리 1개뿐 / 엣지처럼 남녀 목소리가 다 있음
// (이 컴퓨터는 3D 창 여러 개를 동시에 못 돌려서, 다른 성도님 대화는 받은 신호를 직접 넣어 시험)
const { chromium } = require('playwright');
const IPHONE = [{ name: 'Yuna', lang: 'ko-KR' }];
const EDGE = [{ name: 'Microsoft InJoon Online (Natural) - Korean (Korea)', lang: 'ko-KR' }, { name: 'Microsoft SunHi Online (Natural) - Korean (Korea)', lang: 'ko-KR' }, { name: 'Google US English', lang: 'en-US' }];
const ANDROID = [{ name: '한국어 대한민국', lang: 'ko-KR' }];
const FAKE = `(() => {
  let V = [];
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
  const ctx = await b.newContext({ viewport: { width: 900, height: 600 } }); await ctx.addInitScript(FAKE);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_device', JSON.stringify('tA')); localStorage.removeItem('mdc_tts_off'); });
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=tts', { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__speak, null, { timeout: 400000, polling: 2000 });
  await p.evaluate(() => window.__dbg.goTo('step6')); await p.mouse.click(450, 300); await p.waitForTimeout(6000);
  const lv = await p.evaluate(() => JSON.parse(JSON.stringify(window.mdcNet)) && 'F2');
  const people = [['tB', '은혜', 'f'], ['tC', '철수', 'm'], ['tD', '민준', 'm'], ['tE', '지은', 'f']];
  const recv = (id, n, g, text, level = 'F2') => p.evaluate((c) => window.mdcNet.onChat(c), { id, n, g, lv: level, text });
  for (const [label, V] of [['아이폰처럼 여자 목소리 1개(Yuna)', IPHONE], ['안드로이드처럼 이름 모를 목소리 1개', ANDROID], ['엣지처럼 남녀 목소리(InJoon·SunHi)', EDGE]]) {
    console.log('==== ' + label);
    await p.evaluate((v) => { window.__setVoices(v); window.__speak.load(); window.__said = []; }, V);
    await p.evaluate(() => document.getElementById('chatOpen').click()); await p.fill('#chatInput', '안녕하세요 😊 반가워요'); await p.press('#chatInput', 'Enter'); await p.waitForTimeout(300);
    for (const [id, n, g] of people) await recv(id, n, g, n === '철수' ? '할렐루야 ㅎㅎ' : '반가워요');
    const s = await p.evaluate(() => window.__said);
    ['혜연(나·여)', '은혜(여)', '철수(남)', '민준(남)', '지은(여)'].forEach((w, i) => console.log('   ', w.padEnd(8), JSON.stringify(s[i])));
  }
  const n0 = (await p.evaluate(() => window.__said.length)); await recv('tC', '철수', 'm', '3층에서 한 말', 'F3');
  console.log('다른 층(3층) 사람 말 읽힘:', (await p.evaluate(() => window.__said.length)) > n0);
  await p.click('#voiceBtn'); await p.waitForTimeout(300); const n1 = await p.evaluate(() => window.__said.length); await recv('tB', '은혜', 'f', '끈 뒤에 한 말');
  console.log('끈 뒤 읽힘:', (await p.evaluate(() => window.__said.length)) > n1, '/ 버튼:', await p.textContent('#voiceBtn'), '/ 기억:', await p.evaluate(() => localStorage.getItem('mdc_tts_off')));
  await p.click('#voiceBtn'); await p.waitForTimeout(300);
  console.log('다시 켠 뒤 버튼:', await p.textContent('#voiceBtn'));
  await p.evaluate(() => document.getElementById('chatOpen').click()); await p.fill('#chatInput', '모두 반가워요'); await p.press('#chatInput', 'Enter'); await p.waitForTimeout(800);
  if (out) await p.screenshot({ path: `${out}/tts.png` });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
