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
