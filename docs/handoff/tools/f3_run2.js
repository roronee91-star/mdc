
const out=[];
class V{set(x,y,z){this.x=x;this.y=y;this.z=z}}
const THREE={
 Group:class{constructor(){this.children=[];}add(c){this.children.push(c);}},
 Mesh:class{constructor(g,m){this.geometry=g;this.material=m;this.position=new V();this.rotation=new V();out.push(this);}},
 BoxGeometry:class{constructor(w,h,d){this.t='box';this.w=w;this.h=h;this.d=d}},
 CylinderGeometry:class{constructor(r){this.t='cyl';this.r=r}},
 MeshStandardMaterial:class{constructor(o){this.c=o.color}},
 PointLight:class{constructor(){this.position=new V()}},
 Sprite:class{constructor(m){this.position=new V();this.scale=new V();this.tag='label';this.m=m;out.push(this)}},
 SpriteMaterial:class{constructor(o){this.o=o}},
 CanvasTexture:class{constructor(c){this.text=c.text}},
 SRGBColorSpace:'srgb'
};
global.document={createElement:()=>{const c={getContext:()=>new Proxy({},{get:(t,k)=>k==='fillText'?((tx)=>{c.text=tx}):()=>{},set:()=>true})};return c;}};
const scene={add(){}};
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
    wallSeg(kitchenE, planZ(3.4), kitchenE, -12.9, 2.2);          // (배식구 옆 아래쪽)
    wallSeg(kitchenE, -11.9, kitchenE, kitchenS, 2.2);            // 주방 출입문(-12.9 ~ -11.9) 비움
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
    
const res=out.map(o=>o.tag?{t:'label',x:o.position.x,y:o.position.y,z:o.position.z,text:o.m.o.map.text}:{t:o.geometry.t,x:o.position.x,y:o.position.y,z:o.position.z,w:o.geometry.w,h:o.geometry.h,d:o.geometry.d,r:o.geometry.r,c:o.material.c});
require('fs').writeFileSync('f3_out.json',JSON.stringify(res));
console.log(res.length,'objects');
