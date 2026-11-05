
class V{constructor(){this.x=0;this.y=0;this.z=0}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}copy(o){this.x=o.x;this.y=o.y;this.z=o.z;return this}}
class O3{constructor(){this.position=new V();this.rotation=new V();this.scale=new V();this.scale.set(1,1,1);this.children=[];this.visible=true;this.name='';this.isMesh=false}
 add(c){this.children.push(c)} traverse(f){f(this);this.children.forEach(c=>c.traverse?c.traverse(f):0)}
 clone(){const m=new this.constructor(this.geometry,this.material);m.position.copy(this.position);m.rotation.copy(this.rotation);m.scale.copy(this.scale);m.name=this.name;m.visible=this.visible;return m}}
const made=[];
const THREE={Group:class extends O3{},Mesh:class extends O3{constructor(g,m){super();this.geometry=g;this.material=m;this.isMesh=true;made.push(this)}},
 BoxGeometry:class{constructor(w,h,d){this.w=w;this.h=h;this.d=d}},CylinderGeometry:class{},MeshStandardMaterial:class{constructor(o){Object.assign(this,o||{})}},
 PointLight:class extends O3{},Sprite:class extends O3{},SpriteMaterial:class{},CanvasTexture:class{},SRGBColorSpace:'s'};
global.document={createElement:()=>({getContext:()=>new Proxy({},{get:()=>()=>{},set:()=>true})})};
const scene=new O3();
const clickableObjects=[];
// ===F3-BEGIN===
    // -------------------------------------------------------------------------
    // 3층 식당 · 주방 · 소그룹실 (도면 평면을 GLB 크기에 맞춰 옮긴 배치)
    //  - 도면 가로(24.85m) → 모델 12.4m (x 0.4986배), 세로 → 모델 17.5m (0.949배)
    //  - 가구 높이/크기는 캐릭터(1m)에 맞춰 절반 크기 (의자 앉는 높이 0.22m)
    // -------------------------------------------------------------------------
    const F3_Y = 7.25;                       // 3층 바닥 윗면 높이
    const planX = (m) => -12.4 + m * 0.4986; // 도면 서쪽 끝에서 잰 거리(m) → 모델 x
    const planZ = (m) => -17.5 + m * 0.949;  // 도면 북쪽 끝에서 잰 거리(m) → 모델 z

    const furn = new THREE.Group();
    furn.name = 'F3_FURNITURE';
    scene.add(furn);

    const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 });
    const mWood = mat(0x9a6b3f), mSeat = mat(0xe0c08f), mBack = mat(0xc4975f);
    const mPlate = mat(0xf7f7f7), mSoup = mat(0xc8452d);
    const mWall = mat(0xf1ece4), mCounter = mat(0xe6dfd2), mTop = mat(0xb98a5a), mDark = mat(0x3a3a3a);

    function box(w, h, d, x, y0, z, material) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      m.position.set(x, F3_Y + y0 + h / 2, z);
      m.castShadow = true;
      m.receiveShadow = true;
      furn.add(m);
      return m;
    }
    function cyl(r, h, x, y0, z, material) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), material);
      m.position.set(x, F3_Y + y0 + h / 2, z);
      m.castShadow = true;
      furn.add(m);
      return m;
    }
    function wallSeg(xa, za, xb, zb, h) {
      const t = 0.08;
      const w = Math.abs(xb - xa) || t;
      const d = Math.abs(zb - za) || t;
      box(w, h || 2.2, d, (xa + xb) / 2, 0, (za + zb) / 2, mWall);
    }
    function chair(x, z, dir) { // dir = +1 이면 동쪽(+x)을 보고 앉는 의자
      box(0.28, 0.04, 0.28, x, 0.18, z, mSeat);          // 앉는 면 (윗면 높이 0.22)
      box(0.05, 0.18, 0.05, x, 0, z, mBack);              // 의자 다리
      box(0.03, 0.26, 0.28, x - dir * 0.125, 0.22, z, mBack); // 등받이
    }
    function table(x, z, len, wid) {
      box(wid, 0.04, len, x, 0.34, z, mWood);             // 윗면 높이 0.38
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
        box(0.04, 0.34, 0.04, x + sx * (wid / 2 - 0.03), 0, z + sz * (len / 2 - 0.05), mWood);
      });
    }
    function label(text, x, z) {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 96;
      const g = c.getContext('2d');
      g.fillStyle = 'rgba(15,23,42,0.78)';
      if (g.roundRect) { g.beginPath(); g.roundRect(4, 8, 248, 80, 18); g.fill(); } else { g.fillRect(4, 8, 248, 80); }
      g.fillStyle = '#ffffff';
      g.font = 'bold 40px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(text, 128, 50);
      const tex = new THREE.CanvasTexture(c);
      if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      s.scale.set(1.4, 0.52, 1);
      s.position.set(x, F3_Y + 2.7, z);
      s.renderOrder = 10;
      furn.add(s);
    }

    // ---- 식당: 4열 x 3줄 식탁 (한 식탁에 양쪽 3명씩) ----
    const DINING_COLS = [-7.0, -5.4, -3.8];   // 3열: 열 사이 통로 0.7m 이상
    const DINING_ROWS = [planZ(1.7), planZ(5.5), planZ(9.3)];
    DINING_COLS.forEach((tx) => {
      DINING_ROWS.forEach((tz) => {
        table(tx, tz, 2.6, 0.4);
        [-0.85, 0, 0.85].forEach((k) => {
          chair(tx - 0.30, tz + k, +1);
          chair(tx + 0.30, tz + k, -1);
          [-1, 1].forEach((side) => {                      // 식판: 밥그릇 + 국그릇
            const px = tx + side * 0.09;
            cyl(0.07, 0.012, px, 0.38, tz + k, mPlate);
            cyl(0.035, 0.03, px, 0.392, tz + k - 0.1, mPlate);
            cyl(0.035, 0.03, px, 0.392, tz + k + 0.1, mSoup);
          });
        });
      });
    });
    // 배식대: 주방 벽에 붙여서 (주방 통로 앞)
    box(0.4, 0.5, 2.5, -8.45, 0, -14.85, mCounter);
    box(0.46, 0.04, 2.56, -8.45, 0.5, -14.85, mTop);

    // ---- 주방 (서쪽 위) ----
    const kitchenE = planX(7.4);          // 주방 동쪽 벽 x
    const kitchenS = planZ(6.5);          // 주방 남쪽 벽 z
    wallSeg(kitchenE, -17.4, kitchenE, planZ(2.2), 2.2);          // 동쪽 벽 (가운데 통로 비움)
    wallSeg(kitchenE, planZ(3.4), kitchenE, kitchenS, 2.2);
    wallSeg(-12.4, kitchenS, kitchenE, kitchenS, 2.2);            // 남쪽 벽
    box(2.0, 0.45, 4.27, planX(3.7), 0, planZ(3.35), mCounter);   // 중앙 조리대 (양옆 통로 0.8m 이상)
    box(2.08, 0.04, 4.35, planX(3.7), 0.45, planZ(3.35), mTop);
    box(0.5, 0.02, 0.5, planX(3.7), 0.49, planZ(2.2), mDark);     // 가스레인지
    box(0.5, 0.02, 0.5, planX(3.7), 0.49, planZ(3.2), mDark);

    // ---- 화장실 · 창고 (주방 아래) ----
    const wcS = planZ(9.75);
    const wcSplit = planX(5.0);
    wallSeg(wcSplit, kitchenS, wcSplit, wcS, 2.2);                // 화장실|창고 칸막이
    wallSeg(kitchenE, kitchenS, kitchenE, wcS, 2.2);              // 동쪽 벽
    wallSeg(-12.4, wcS, -11.9, wcS, 2.2);                         // 남쪽 벽 (문 2곳 비움)
    wallSeg(-11.1, wcS, -9.7, wcS, 2.2);
    wallSeg(-8.95, wcS, kitchenE, wcS, 2.2);

    // ---- 소그룹실 1 · 2 · 3 (동쪽) ----
    const roomW = planX(20.25);                                   // 소그룹실 서쪽 벽 x
    const roomZ = [planZ(0), planZ(3.2), planZ(6.7), planZ(9.8)]; // 북→남 경계
    for (let i = 0; i < 3; i++) {
      const za = roomZ[i] + (i === 0 ? 0.1 : 0), zb = roomZ[i + 1];
      wallSeg(roomW, za, roomW, zb - 1.0, 2.2);                   // 서쪽 벽 (남쪽 끝에 문)
      wallSeg(roomW, roomZ[i + 1], 0, roomZ[i + 1], 2.2);         // 칸막이
      const cz = (roomZ[i] + zb) / 2;
      table(-1.09, cz, 1.5, 0.6);
      [-0.4, 0.4].forEach((k) => {
        chair(-1.09 - 0.33, cz + k, +1);
        chair(-1.09 + 0.33, cz + k, -1);
      });
      label('소그룹실 ' + (i + 1), -1.09, cz);
    }

    label('식당', -5.9, planZ(1.0) - 0.3);
    label('주방', planX(3.7), planZ(3.35));
    label('화장실', planX(2.5), planZ(8.0));

    // 3층 실내 조명
    const f3Light = new THREE.PointLight(0xfff0d8, 2.4, 24, 0.8);
    f3Light.position.set(-6, F3_Y + 2.8, -9);
    scene.add(f3Light);
    // ===F3-END===

    // ===PEW-BEGIN===
    // 본당 의자 배치: 무대 모서리(-13, -17.5)를 중심으로 부채꼴 줄을 새로 계산
    function layoutPews(opt) {
      const o = Object.assign({
        r0: 8.7, pitch: 1.2, aislesDeg: [30, 58], aisleHalfM: 0.5, offset: 0.75,
        south: -4.0, eastNear: -1.3, eastFar: 0.2
      }, opt || {});
      const C = { x: -13.0, z: -17.5 };
      const HL = 0.55, HW = 0.22, GAP = 0.03;          // 의자 반길이 / 반폭 / 의자 사이 틈
      const out = [];
      const corners = (cx, cz, yaw) => {
        const c = Math.cos(yaw), s = Math.sin(yaw), pts = [];
        [[-HW, -HL], [HW, -HL], [HW, HL], [-HW, HL]].forEach(([lx, lz]) => {
          pts.push([cx + lx * c + lz * s, cz - lx * s + lz * c]);
        });
        return pts;
      };
      const ok = (pts) => pts.every(([x, z]) => {
        if (z > o.south || z < -17.2 || x < -12.7) return false;             // 남쪽 로비 / 북쪽·서쪽 벽
        const eastLimit = (z > -16.6 && z < -10.4) ? o.eastNear : o.eastFar; // 자모실 벽 옆은 더 띄움
        return x <= eastLimit;
      }) && !pts.some(([x, z]) => x > -13.4 && x < -7.0 && z > -17.9 && z < -11.5); // 무대 + 여유
      for (let r = 0; ; r++) {
        const R = o.r0 + r * o.pitch;
        if (R > 19) break;
        const step = (2 * HL + GAP) / R;
        const aisleHalf = Math.asin(o.aisleHalfM / R);
        for (let th = (4 * Math.PI) / 180 + o.offset * step; th < (88 * Math.PI) / 180; th += step) {
          const thc = th + step / 2;
          if (o.aislesDeg.some((a) => Math.abs(thc - (a * Math.PI) / 180) < aisleHalf + step / 2)) continue;
          const cx = C.x + R * Math.cos(thc), cz = C.z + R * Math.sin(thc);
          const yaw = -thc;                                                     // 원래 모델과 같은 방향 규칙
          if (ok(corners(cx, cz, yaw))) out.push({ x: cx, z: cz, yaw, row: r, th: thc });
        }
      }
      return out;
    }
    // ===PEW-END===

    // -------------------------------------------------------------------------
    // 본당(지하 1층) 보정: 의자 새 배치 / 십자가 받침 / LED 화면 / 자모실 / 방송실
    //  ※ GLB 파일은 그대로 두고, 화면이 열릴 때 코드로 고칩니다.
    // -------------------------------------------------------------------------
    let b1Seats = [];
    function pickB1Seat(x, z) {
      let best = null, bd = 1e9;
      b1Seats.forEach((s) => { const d = Math.hypot(s.x - x, s.z - z); if (d < bd) { bd = d; best = s; } });
      return best || { x: x, z: z, y: -6.09, rot: -Math.PI * 0.86 };
    }
    function labelAt(text, x, y, z, sw) {
      const c = document.createElement('canvas');
      c.width = 384; c.height = 96;
      const g = c.getContext('2d');
      g.fillStyle = 'rgba(15,23,42,0.78)';
      if (g.roundRect) { g.beginPath(); g.roundRect(4, 8, 376, 80, 18); g.fill(); } else { g.fillRect(4, 8, 376, 80); }
      g.fillStyle = '#ffffff';
      g.font = 'bold 40px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(text, 192, 50);
      const tex = new THREE.CanvasTexture(c);
      if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      s.scale.set(sw || 2.1, (sw || 2.1) * 0.25, 1);
      s.position.set(x, y, z);
      s.renderOrder = 10;
      scene.add(s);
    }

    function applyB1Fixes(root) {
      const FLOOR = -6.6;
      const byName = {};
      root.traverse((o) => { if (o.isMesh) byName[o.name] = o; });
      const g = new THREE.Group();
      g.name = 'B1_FIXES';
      scene.add(g);
      const hide = (m) => {
        if (!m) return;
        m.visible = false;
        const i = clickableObjects.indexOf(m);
        if (i >= 0) clickableObjects.splice(i, 1);
      };
      const M = (c, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, extra || {}));
      const wm = M(0xebe6db), gm = M(0xcfe6f2, { transparent: true, opacity: 0.28, roughness: 0.1, depthWrite: false });
      const bx = (x0, x1, y0, y1, z0, z1, material) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), material);
        m.position.set((x0 + x1) / 2, FLOOR + (y0 + y1) / 2, (z0 + z1) / 2);
        m.castShadow = true;
        m.receiveShadow = true;
        g.add(m);
        return m;
      };
      const H = 3.0; // 칸막이 높이

      // 1) 의자: 줄과 간격을 새로 계산해서 다시 놓기 (겹침 · 벽 침범 없음)
      const fT = byName['B1_FINAL_Pew_Frame_0_0'], pT = byName['B1_FINAL_Pew_Pad_0_0'];
      if (fT && pT) {
        const fy = fT.position.y, py = pT.position.y;
        const frameMesh = fT.clone(), padMesh = pT.clone();
        Object.keys(byName).forEach((k) => {
          if (k.indexOf('B1_FINAL_Pew_Frame_') === 0 || k.indexOf('B1_FINAL_Pew_Pad_') === 0) hide(byName[k]);
        });
        b1Seats = [];
        layoutPews().forEach((p) => {
          const f = frameMesh.clone(); f.visible = true; f.position.set(p.x, fy, p.z); f.rotation.set(0, p.yaw, 0); g.add(f);
          const q = padMesh.clone(); q.visible = true; q.position.set(p.x, py, p.z); q.rotation.set(0, p.yaw, 0); g.add(q);
          [-0.27, 0.27].forEach((t) => {
            const sx = p.x + t * Math.sin(p.yaw), sz = p.z + t * Math.cos(p.yaw);
            b1Seats.push({ x: sx, z: sz, y: py + 0.08, rot: Math.atan2(-13.0 - sx, -17.5 - sz) });
          });
        });
      }

      // 2) LED 화면: 양 끝이 벽 밖으로 나가지 않게 폭 줄이고 모서리 중앙으로 이동
      const led = byName['B1_FINAL_LED_Screen'];
      if (led) { led.position.x = -11.915; led.position.z = -16.465; led.scale.x = 0.52; }

      // 3) 강대상: 바닥에서 9cm 뜬 것 내려놓기
      const pulpit = byName['B1_FINAL_Pulpit'];
      if (pulpit) pulpit.position.y -= 0.09;

      // 4) 십자가: 허공에 떠 있던 것을 무대 위 받침에 세우기 (LED 화면 앞)
      const cv = byName['B1_FINAL_Cross_V'], ch = byName['B1_FINAL_Cross_H'];
      if (cv && ch) {
        const stageTop = -6.16, baseH = 0.35, yaw = Math.PI / 4;
        const cx = -12.45, cz = -15.35;
        cv.position.set(cx, stageTop + baseH + 1.5, cz); cv.rotation.set(0, yaw, 0);
        ch.position.set(cx, stageTop + baseH + 2.1, cz); ch.rotation.set(0, yaw, 0);
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, baseH, 0.5), cv.material);
        base.position.set(cx, stageTop + baseH / 2, cz);
        base.rotation.y = yaw; base.castShadow = true; g.add(base);
      }

      // 5) 자모실: 칸막이를 홀 쪽으로 옮겨 방을 넓히고, 유리창 · 문 · 매트 · 아기침대 넣기
      hide(byName['B1_FINAL_Wall_BabyRoom']);
      hide(byName['B1_FINAL_BabyRoom_Glass']);
      {
        const x0 = -0.98, x1 = -0.82;
        bx(x0, x1, 0, H, -16.0, -15.6, wm);
        bx(x0, x1, 0, 0.9, -15.6, -12.3, wm);
        bx(x0, x1, 2.2, H, -15.6, -12.3, wm);
        bx(x0 + 0.05, x1 - 0.05, 0.9, 2.2, -15.6, -12.3, gm);
        bx(x0, x1, 0, H, -12.3, -12.0, wm);
        bx(x0, x1, 2.1, H, -12.0, -11.0, wm);              // 문(-12.0 ~ -11.0) 위
        bx(x0, x1, 0, H, -11.0, -10.95, wm);
        const pink = M(0xf6c6d0), white = M(0xfafafa), wood = M(0xd2b48c);
        bx(-0.78, 0.55, 0, 0.02, -15.8, -11.2, pink);       // 바닥 매트
        [-15.2, -14.3, -13.4].forEach((z) => {              // 아기 침대
          bx(0.05, 0.5, 0.02, 0.28, z - 0.3, z + 0.3, white);
          bx(0.05, 0.5, 0.28, 0.4, z - 0.3, z - 0.27, wood);
          bx(0.05, 0.5, 0.28, 0.4, z + 0.27, z + 0.3, wood);
        });
        [[-0.5, -12.6, 0xe74c3c], [-0.3, -12.3, 0x3498db], [-0.55, -12.0, 0xf1c40f]].forEach(([x, z, c]) => {
          bx(x - 0.07, x + 0.07, 0.02, 0.16, z - 0.07, z + 0.07, M(c));   // 장난감 블록
        });
        bx(-0.7, -0.35, 0, 0.22, -11.7, -11.35, wood);       // 작은 의자
        labelAt('자모실', -0.1, FLOOR + 3.3, -13.5, 1.5);
      }

      // 6) 방송실(엔지니어룸): 벽을 다시 세워 홀 쪽 유리창, 옆 벽, 문, 장비 넣기
      hide(byName['B1_FINAL_Wall_Control']);
      {
        const z0 = -2.12, z1 = -1.88;
        bx(-8.95, -3.45, 0, 1.2, z0, z1, wm);
        bx(-8.95, -3.45, 2.4, H, z0, z1, wm);
        bx(-8.95, -8.4, 1.2, 2.4, z0, z1, wm);
        bx(-4.0, -3.45, 1.2, 2.4, z0, z1, wm);
        bx(-8.4, -4.0, 1.2, 2.4, z0 + 0.05, z1 - 0.05, gm);  // 홀 쪽 유리창
        bx(-9.07, -8.95, 0, H, -1.88, 0.08, wm);              // 서쪽 벽
        bx(-3.57, -3.45, 0, H, -1.88, -1.15, wm);             // 동쪽 벽 (문 -1.15 ~ -0.3)
        bx(-3.57, -3.45, 2.1, H, -1.15, -0.3, wm);
        bx(-3.57, -3.45, 0, H, -0.3, 0.08, wm);
        const dark = M(0x3a3f4a), top = M(0x59606c), screen = M(0x3b82f6, { emissive: 0x1d4ed8, emissiveIntensity: 0.6 });
        bx(-8.0, -4.4, 0, 0.75, -1.7, -1.05, dark);           // 믹싱 데스크
        bx(-8.05, -4.35, 0.75, 0.8, -1.75, -1.0, top);
        for (let i = 0; i < 12; i++) bx(-7.9 + i * 0.29, -7.8 + i * 0.29, 0.8, 0.83, -1.45, -1.2, M(i % 3 === 0 ? 0xef4444 : 0xe5e7eb));
        [-7.4, -6.2, -5.0].forEach((x) => bx(x - 0.28, x + 0.28, 0.85, 1.25, -1.68, -1.62, screen)); // 모니터
        bx(-8.75, -8.2, 0, 1.5, -0.6, -0.1, dark);            // 장비 랙
        bx(-8.15, -7.6, 0, 1.5, -0.6, -0.1, dark);
        bx(-8.65, -8.3, 0.4, 0.46, -0.1, -0.08, screen);
        bx(-6.45, -6.0, 0.2, 0.26, -0.6, -0.15, dark);        // 의자
        bx(-6.45, -6.0, 0.26, 0.7, -0.18, -0.15, dark);
        bx(-6.27, -6.18, 0, 0.2, -0.42, -0.33, dark);
        labelAt('방송실 (엔지니어룸)', -6.2, FLOOR + 3.5, -0.9, 2.8);
      }
    }


// fake model
const root=new THREE.Group();
function addM(n,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({}));m.name=n;m.position.set(x,y,z);root.add(m);clickableObjects.push(m);return m}
addM('B1_FINAL_Pew_Frame_0_0',-6,-6.2,-15.7);addM('B1_FINAL_Pew_Pad_0_0',-6,-6.17,-15.7);addM('B1_FINAL_Pew_Frame_0_1',0,0,0);
['B1_FINAL_LED_Screen','B1_FINAL_Pulpit','B1_FINAL_Cross_V','B1_FINAL_Cross_H','B1_FINAL_Wall_BabyRoom','B1_FINAL_BabyRoom_Glass','B1_FINAL_Wall_Control'].forEach(n=>addM(n,0,-3,0));
applyB1Fixes(root);
console.log('seats',b1Seats.length,'new meshes',made.length,'sample seat',JSON.stringify(b1Seats[0]));
console.log('pick',JSON.stringify(pickB1Seat(-6,-8.6)));
const cv=root.children.find(c=>c.name==='B1_FINAL_Cross_V');console.log('cross y',cv.position.y,'visible orig pew',root.children[0].visible,'wallControl hidden',!root.children.find(c=>c.name==='B1_FINAL_Wall_Control').visible);
