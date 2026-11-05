
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
