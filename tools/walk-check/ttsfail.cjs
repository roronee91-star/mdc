// 소리가 안 나는 경우 안내: (1) 음성 기능이 없는 앱 안 브라우저(카카오톡 안드로이드처럼) (2) 말이 시작되지 않음 (3) 정상
const { chromium } = require('playwright');
const KAKAO_UA = 'Mozilla/5.0 (Linux; Android 14; SM-S918N Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.0.0 Mobile Safari/537.36 KAKAOTALK 10.8.0';
const NO_TTS = `delete window.speechSynthesis; delete window.SpeechSynthesisUtterance; Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });`;
const STUCK = `(() => { window.__spoke = 0; const ss = { speaking: false, paused: false, getVoices: () => [{ name: 'Yuna', lang: 'ko-KR' }], addEventListener() {}, cancel() {}, resume() {}, speak(u) { window.__spoke++; } };
  Object.defineProperty(window, 'speechSynthesis', { value: ss, configurable: true }); window.SpeechSynthesisUtterance = function (t) { this.text = t; }; })();`;
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  for (const [label, init, ua] of [['카카오톡(안드로이드) 앱 안: 음성 기능 없음', NO_TTS, KAKAO_UA], ['말이 시작되지 않음', STUCK, null]]) {
    console.log('==== ' + label);
    const ctx = await b.newContext(Object.assign({ viewport: { width: 900, height: 600 } }, ua ? { userAgent: ua } : {})); await ctx.addInitScript(init);
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.removeItem('mdc_tts_off'); });
    await p.goto('http://127.0.0.1:8008/index.html?net=local&room=ttsf', { waitUntil: 'commit', timeout: 120000 });
    await p.waitForFunction(() => window.__dbg && window.__speak, null, { timeout: 400000, polling: 2000 });
    await p.evaluate(() => window.__dbg.goTo('step6')); await p.mouse.click(450, 300); await p.waitForTimeout(5000);
    console.log('음성 기능:', await p.evaluate(() => window.__speak.ok), '/ 버튼:', await p.textContent('#voiceBtn'), '/ 보임:', await p.isVisible('#voiceBtn'));
    await p.evaluate(() => document.getElementById('chatOpen').click()); await p.fill('#chatInput', '안녕하세요'); await p.press('#chatInput', 'Enter');
    await p.waitForTimeout(5000);
    console.log('안내:', await p.textContent('#chatLog'));
    const nBtn = await p.evaluate(() => document.querySelectorAll('#chatLog button').length); console.log('브라우저로 열기 단추:', nBtn);
    if (nBtn) {
      const nav = []; p.on('request', (r) => nav.push(r.url())); p.on('framenavigated', (f) => nav.push(f.url()));
      await p.screenshot({ path: `${out}/ttsfail-${label.length}.png` }); await p.evaluate(() => document.querySelector('#chatLog button').click()); await p.waitForTimeout(800);
      console.log('바깥으로 여는 주소:', await p.evaluate(() => window.__speak.outsideUrl())); console.log('누른 뒤 페이지:', await p.evaluate(() => location.href).catch(() => '?'), nav.filter((u) => !/127\.0\.0\.1/.test(u)).slice(0, 2));
    }
    if (out) await p.screenshot({ path: `${out}/ttsfail-${label.length}.png` });
    console.log(errs.join('\n') || 'no errors'); await ctx.close();
  }
  await b.close();
})();
