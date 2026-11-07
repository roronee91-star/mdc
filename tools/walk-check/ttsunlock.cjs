// 아직 화면을 누르지 않은 사람에게 남의 말이 오면: 바로 못 읽으니 "화면을 한 번 눌러 주세요" 안내 → 누르면(손 뗄 때) 그 말을 읽어 줌
// 그다음부터는 바로 읽음. 다른 층 사람 말은 글에 층이 붙고 소리는 안 남
const { chromium } = require('playwright');
const FAKE = `(() => { window.__said = []; const ss = { speaking: false, paused: false, getVoices: () => [{ name: 'Yuna', lang: 'ko-KR', default: false, localService: true, voiceURI: 'Yuna' }], addEventListener() {}, cancel() {}, resume() {},
  speak(u) { window.__said.push(u.text.trim() ? u.text : '(깨우기)'); setTimeout(() => { u.onstart && u.onstart(); setTimeout(() => u.onend && u.onend(), 200); }, 10); } };
  Object.defineProperty(window, 'speechSynthesis', { value: ss, configurable: true }); window.SpeechSynthesisUtterance = function (t) { this.text = t; }; })();`;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 900, height: 600 } }); await ctx.addInitScript(FAKE);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_device', JSON.stringify('tA')); localStorage.setItem('mdc_bgm_off', '1'); localStorage.removeItem('mdc_tts_off'); });
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=tu', { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__speak, null, { timeout: 400000, polling: 2000 }); await p.waitForTimeout(3000);
  const recv = (n, g, text, lv) => p.evaluate((c) => window.mdcNet.onChat(c), { id: 't' + n, n, g, lv: lv || 'F1', text });
  console.log('처음 층:', await p.evaluate(() => window.__dbg && document.getElementById('onlineCount') && 'ok'), '/ 깨움:', await p.evaluate(() => window.__speak.unlocked));
  await recv('철수', 'm', '안녕하세요 반가워요');
  await p.waitForTimeout(500);
  console.log('1) 누르기 전 읽은 말:', JSON.stringify(await p.evaluate(() => window.__said)), '/ 안내:', (await p.textContent('#chatLog')).includes('화면을 한 번 눌러'));
  await p.mouse.click(450, 300); await p.waitForTimeout(800);
  console.log('2) 화면 한 번 누른 뒤:', JSON.stringify(await p.evaluate(() => window.__said)), '/ 깨움:', await p.evaluate(() => window.__speak.unlocked));
  await recv('은혜', 'f', '어서 오세요'); await p.waitForTimeout(500);
  console.log('3) 그다음 남의 말:', JSON.stringify(await p.evaluate(() => window.__said)));
  await recv('민준', 'm', '3층에서 한 말', 'F3'); await p.waitForTimeout(500);
  console.log('4) 다른 층 말 소리:', (await p.evaluate(() => window.__said)).includes('3층에서 한 말'), '/ 글:', (await p.textContent('#chatLog')).match(/민준[^가-힣]*\(3층\)/) ? '민준 (3층) 표시됨' : '층 표시 없음');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
