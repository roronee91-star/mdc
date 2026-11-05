// 층별 이동성 검사: 장애물(GLB+가구) 박스를 캐릭터 반경만큼 키워 격자 BFS
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [,, step, floorY, out] = process.argv;
  const FY = +floorY;
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  await p.click('#' + step); await p.waitForTimeout(500);
  const data = await p.evaluate((FY) => {
    const { scene, furn } = window.__dbg; scene.updateMatrixWorld(true);
    const obs = [];
    scene.traverse(o => {
      if (!o.isMesh || !o.visible) return;
      for (let q = o.parent; q; q = q.parent) if (!q.visible) return;
      if (o.name === '' && o.geometry.type === 'RingGeometry') return;
      o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
      // 캐릭터 몸통 높이대(바닥+0.05 ~ +0.9)에 걸치는 것만
      if (!(bb.max.y > FY + 0.05 && bb.min.y < FY + 0.9)) return;
      const ours = (() => { for (let q = o; q; q = q.parent) if (q === furn) return true; return false; })();
      const area = (bb.max.x - bb.min.x) * (bb.max.z - bb.min.z);
      if (area > 40) return; // 바닥판·지형 등 넓은 면 제외
      const lb = o.geometry.boundingBox; const V = o.position.constructor; const q = [];
      [[lb.min.x, lb.min.z], [lb.max.x, lb.min.z], [lb.max.x, lb.max.z], [lb.min.x, lb.max.z]].forEach(([x, z]) => { const v = new V(x, lb.min.y, z).applyMatrix4(o.matrixWorld); q.push([v.x, v.z]); });
      obs.push({ n: o.name || (ours ? 'furn' : 'anon'), ours, a: [bb.min.x, bb.min.z, bb.max.x, bb.max.z], y: [bb.min.y, bb.max.y], q });
    });
    return obs;
  }, FY);
  const seats = await p.evaluate(() => window.__dbg.b1Seats);
  fs.writeFileSync(out, JSON.stringify(data)); fs.writeFileSync(out + '.seats.json', JSON.stringify(seats));
  console.log('obstacles', data.length);
  await b.close();
})();
