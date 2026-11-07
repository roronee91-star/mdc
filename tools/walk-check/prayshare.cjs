// 기도제목 함께 보기: Supabase 대신 가짜 서버(같은 규칙)를 끼워서 시험
//  - 다른 사람 글이 보이는지, 내 글 올리기·지우기, 함께 기도 +1/-1, 예전 '나만 보임' 글 모두와 나누기,
//    다른 기기(B)에도 신호를 받아 새 글이 보이는지, 표가 없을 때(404)는 이 휴대폰에만 저장되는지
const { chromium } = require('playwright');
const crypto = require('crypto');
const md5 = (s) => crypto.createHash('md5').update(s).digest('hex');
(async () => {
  const out = process.argv[2];
  const store = [{ id: 'aaaaaaaa-0000-4000-8000-000000000001', body: '어머니 무릎 수술이 잘 회복되도록 기도해 주세요', cat: '건강', name: '은혜', prays: 2, owner_hash: md5('someone-else-key-123456'), created_at: new Date(Date.now() - 3600e3).toISOString() }];
  let missing = false, calls = [];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 900, height: 700 } });
  await ctx.route('https://slpqownhiafmiuyisxuo.supabase.co/rest/v1/**', async (route) => {
    const req = route.request(), url = new URL(req.url()), path = url.pathname.replace('/rest/v1/', '');
    calls.push(req.method() + ' ' + path + (req.headers()['authorization'] ? ' (AUTH!)' : ''));
    if (missing) return route.fulfill({ status: 404, contentType: 'application/json', body: '{"message":"relation \\"public.prayers\\" does not exist"}' });
    const body = req.postDataJSON ? req.postDataJSON() : null;
    const json = (o) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(o) });
    if (path === 'prayers') return json(store.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)).map(({ owner_hash, ...r }) => r));
    if (path === 'rpc/add_prayer') { const id = crypto.randomUUID(); store.push({ id, body: body.p_body, cat: body.p_cat, name: body.p_name, prays: 0, owner_hash: md5(body.p_owner), created_at: new Date().toISOString() }); return json(id); }
    if (path === 'rpc/delete_prayer') { const i = store.findIndex((p) => p.id === body.p_id && p.owner_hash === md5(body.p_owner)); if (i >= 0) store.splice(i, 1); return json(i >= 0); }
    if (path === 'rpc/pray_prayer') { const p = store.find((x) => x.id === body.p_id); if (!p) return json(null); p.prays = Math.max(0, p.prays + (body.p_delta < 0 ? -1 : 1)); return json(p.prays); }
    return route.fulfill({ status: 404, body: '{}' });
  });
  const errs = [];
  const open = async (name, dev, legacy) => {
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); p.on('dialog', (d) => d.accept());
    await p.addInitScript(([n, d, lg]) => { if (sessionStorage.getItem('init')) return; sessionStorage.setItem('init', '1');
      localStorage.setItem('mdc_name', n); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_device', JSON.stringify(d)); localStorage.setItem('mdc_bgm_off', '1');
      if (lg) localStorage.setItem('mdc_prayers', JSON.stringify([{ id: 'plegacy1', text: '예전에 이 휴대폰에만 적어 둔 기도제목', cat: '가정', name: n, at: Date.now() - 86400e3, prays: 0, owner: d }])); }, [name, dev, legacy]);
    await p.goto('http://127.0.0.1:8008/index.html?net=local&room=pr', { waitUntil: 'commit', timeout: 120000 });
    await p.waitForFunction(() => window.__prayers && window.__dbg, null, { timeout: 400000, polling: 2000 }); await p.waitForTimeout(2500); return p;
  };
  const items = (p) => p.evaluate(() => [...document.querySelectorAll('#ppItems .pp-item')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()));
  const A = await open('혜연', 'devA', true);
  await A.click('#prayerBtn'); await A.waitForTimeout(1200);
  console.log('1) 처음 목록:', JSON.stringify(await items(A)));
  console.log('   안내:', await A.textContent('#ppNote'));
  if (out) await A.screenshot({ path: `${out}/pray-1-list.png` });
  // 함께 기도 (다른 사람 글)
  await A.click('[data-pray="aaaaaaaa-0000-4000-8000-000000000001"]'); await A.waitForTimeout(800);
  console.log('2) 함께 기도 누른 뒤 서버 수:', store[0].prays, '/ 화면:', (await items(A))[1]);
  await A.click('[data-pray="aaaaaaaa-0000-4000-8000-000000000001"]'); await A.waitForTimeout(800);
  console.log('   한 번 더 누르면(취소) 서버 수:', store[0].prays);
  // 새로 올리기
  await A.click('.pp-tab[data-tab="write"]'); await A.fill('#ppText', '이번 주 셀 모임에 새 가족이 함께하도록'); await A.click('#ppSubmit'); await A.waitForTimeout(1500);
  console.log('3) 올린 뒤 서버 글 수:', store.length, '/ 첫 글:', (await items(A))[0]);
  // B 기기: 들어오면 A의 새 글이 보임. A가 글을 지우면 신호를 받아 B에서도 사라짐
  const B = await open('철수', 'devB', false);
  console.log('   B 단추 있음:', await B.evaluate(() => !!document.getElementById('prayerBtn')), await B.evaluate(() => location.href)); await B.evaluate(() => document.getElementById('prayerBtn').click()); await B.waitForTimeout(1500);
  console.log('4) B 목록:', JSON.stringify((await items(B)).map((t) => t.slice(0, 30))), '/ B에서 A 글 지우기 단추:', await B.evaluate(() => document.querySelectorAll('#ppItems .pp-del').length));
  // 예전 '나만 보임' 글 모두와 나누기
  await A.bringToFront(); await A.click('[data-share="plegacy1"]'); await A.waitForTimeout(1500);
  console.log('5) 나누기 뒤 서버 글 수:', store.length, '/ A 로컬에 남은 예전 글:', await A.evaluate(() => JSON.parse(localStorage.getItem('mdc_prayers') || '[]').length));
  await B.waitForTimeout(2500);
  console.log('   B에 신호로 새로 보인 글 수:', (await items(B)).length);
  // 내 글 지우기
  const before = store.length; await A.click('#ppItems .pp-del'); await A.waitForTimeout(1500);
  console.log('6) 지운 뒤 서버 글 수:', before, '→', store.length);
  await B.waitForTimeout(2500); console.log('   B 목록 수:', (await items(B)).length);
  if (out) await A.screenshot({ path: `${out}/pray-2-after.png` });
  // 게시판(3D) 글씨에도 반영되는지: 게시판 그림 캔버스에 "모두 N개"
  console.log('7) 게시판 목록 수:', await A.evaluate(() => window.__prayers.all().length), '/ Authorization 헤더 보낸 요청:', calls.filter((c) => c.includes('AUTH')).length, '/ 요청들:', [...new Set(calls.map((c) => c.split(' ').slice(0, 2).join(' ')))].join(', '));
  // 표가 없을 때: 새 기기 C는 이 휴대폰에만 저장
  missing = true;
  const C = await open('민지', 'devC', false); await C.bringToFront();
  await C.evaluate(() => document.getElementById('prayerBtn').click()); await C.waitForTimeout(1500);
  console.log('8) 표 없을 때 안내:', await C.evaluate(() => document.getElementById('ppNote').textContent));
  await C.evaluate(() => { document.querySelector('.pp-tab[data-tab="write"]').click(); const t = document.getElementById('ppText'); t.value = '연결 안 될 때 시험'; t.dispatchEvent(new Event('input')); document.getElementById('ppSubmit').click(); }); await C.waitForTimeout(1200);
  console.log('   이 휴대폰 저장:', await C.evaluate(() => JSON.parse(localStorage.getItem('mdc_prayers') || '[]').map((p) => p.text).join('|')));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
