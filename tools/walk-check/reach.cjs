// 각 층 시작점 → 방마다 길찾기 경로가 있는지, 끝점이 목표에서 얼마나 떨어졌는지
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 640, height: 400 } }); await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', 'a'); } catch (e) {} });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  const T = {
    step2: { y: 0, pts: { '로비 엘리베이터 앞': [-3.75, -14.3], '계단 문 앞': [-1.3, -14.4], '안내 데스크 앞': [-4.4, -11.5], '주차칸 사이': [-6.4, -7.2], '로비 소파 앞': [-1.6, -12.6] } },
    step6: { y: 3.65, pts: { '소그룹실 A': [-10.4, -12.6], '소그룹실 B': [-10.4, -8.6], '소그룹실 C': [-3.8, -12.0], '기도실': [-2.0, -9.8], '사무실': [-9.6, -4.4], '휴게 홀': [-2.4, -5.6] } },
    step7: { y: 10.75, pts: { '목양실 책상 앞': [-10.5, -13.6], '목양실 소파 옆': [-10.6, -12.95], '교육관·쉼터': [-5.7, -14.6], '그룹실': [-1.25, -14.0], '정원 가운데': [-6.5, -8.6], '계단실1 안': [-11.4, -3.0], '엘리베이터 앞': [-3.0, -3.1], '앞 정원 파라솔': [-6.5, -1.8] } },
  };
  for (const [st, { y, pts }] of Object.entries(T)) {
    await p.evaluate((k) => window.__dbg.goTo(k), st); await p.waitForTimeout(500);
    for (const [n, [x, z]] of Object.entries(pts)) {
      const r = await p.evaluate(([x, y, z]) => { const c = window.__dbg.character.position; const path = window.__dbg.findPath(c.clone(), c.clone().set(x, y, z));
        if (!path || !path.length) return null; const e = path[path.length - 1]; return [Math.hypot(e.x - x, e.z - z).toFixed(2), path.length]; }, [x, y, z]);
      console.log(st, n, r ? `도착 오차 ${r[0]}m, 꺾임 ${r[1]}` : '경로 없음');
    }
  }
  await b.close();
})();
