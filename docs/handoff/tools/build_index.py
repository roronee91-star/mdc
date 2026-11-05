import sys
sp = '/tmp/claude-0/-home-claude/3cebc179-b39c-543d-9cec-40bb8e74b996/scratchpad'
orig = '/mnt/user-data/attachments/3cebc179-b39c-543d-9cec-40bb8e74b996/81bc30d3-church_tour.html'
src = open(orig, encoding='utf-8').read()
f3 = open(sp + '/f3_builder.js', encoding='utf-8').read()
pew = open(sp + '/pew_layout.js', encoding='utf-8').read()
b1 = open(sp + '/b1_fixes_tail.js', encoding='utf-8').read()
buttons = open(sp + '/f3_buttons.js', encoding='utf-8').read()


def rep(old, new, count=1):
    global src
    assert src.count(old) == count, (old, src.count(old))
    src = src.replace(old, new)


rep("우리교회", "물댄동산교회", src.count("우리교회"))

# --- 로딩 부분 ---
rep("    const b1ObstructingMeshes = [];", "    const b1ObstructingMeshes = [];\n    const topMeshes = []; // 4층·지붕 (3층 내부를 위에서 볼 때 숨김)")
rep("            // 본당 시야를 가리는 지상 바닥 슬래브",
    "            if (child.name.startsWith('F4_') || child.name.startsWith('ROOF')) topMeshes.push(child);\n\n            // 본당 시야를 가리는 지상 바닥 슬래브")
# 벽 재질이 자모실·방송실 벽과 같이 쓰이던 문제: 투명 처리할 메시는 재질을 따로 복사
rep("              b1ObstructingMeshes.push(child);",
    "              child.material = child.material.clone(); // 다른 벽(자모실·방송실)까지 같이 투명해지지 않게 따로 복사\n              b1ObstructingMeshes.push(child);")
rep("        loadedModel.position.set(0, 0, 0);\n        scene.add(loadedModel);\n",
    "        loadedModel.position.set(0, 0, 0);\n        scene.add(loadedModel);\n        try { applyB1Fixes(loadedModel); } catch (e) { console.warn('본당 보정 실패', e); }\n")

# --- 3층 + 본당 코드 ---
rep("    // -------------------------------------------------------------------------\n    // 4. 건축 진입 동선 4단계",
    f3 + pew + b1 + "\n    // -------------------------------------------------------------------------\n    // 4. 건축 진입 동선 4단계")

# --- 투어 지점 ---
rep("        charPos: new THREE.Vector3(-5.5, -6.6, -2.8),", "        charPos: new THREE.Vector3(-5.5, -6.6, -3.3),")
rep("        charRot: Math.PI * 0.78, // 강단을 향해 대각선 45도로 응시", "        charRot: -Math.PI * 0.86, // 무대(왼쪽 위 모서리)를 향해 바라봄")
rep("        floorY: -6.6,\n        isB1: true\n      }\n    };",
    """        floorY: -6.6,
        isB1: true
      },
      step5: {
        name: '3층 식당 · 소그룹실',
        charPos: new THREE.Vector3(-6.2, 7.25, -3.0),
        charRot: Math.PI,
        // 4층·지붕을 숨기고 위에서 내려다보는 시점
        camPos: new THREE.Vector3(-6.2, 17.0, 5.5),
        camLook: new THREE.Vector3(-6.2, 7.3, -9.5),
        floorY: 7.25,
        isB1: false,
        hideTop: true
      }
    };""")
rep("      isPraying = false;\n      isSitting = false;\n\n      // 지하 1층 모드일 때",
    "      isPraying = false;\n      isSitting = false;\n      isEating = false;\n      topMeshes.forEach(m => { m.visible = !wp.hideTop; });\n\n      // 지하 1층 모드일 때")
rep("    let isSitting = false;\n    const targetPos", "    let isSitting = false;\n    let isEating = false;\n    const targetPos")
rep("    document.getElementById('step4').addEventListener('click', () => goToTourStep('step4'));",
    "    document.getElementById('step4').addEventListener('click', () => goToTourStep('step4'));\n    document.getElementById('step5').addEventListener('click', () => goToTourStep('step5'));")
rep('        <button class="step-btn" id="step4">4. 지하 본당 입구</button>',
    '        <button class="step-btn" id="step4">4. 지하 본당 입구</button>\n        <button class="step-btn" id="step5">5. 3층 식당·소그룹실</button>')
rep("""          if (currentFloorY < -3.0) {
            if (p.y <= -5.0 && p.y >= -7.0) { hit = p; break; }
          } else {""", """          if (currentFloorY < -3.0) {
            if (p.y <= -5.0 && p.y >= -7.0) { hit = p; break; }
          } else if (currentFloorY > 5.0) {
            if (p.y >= 7.0 && p.y <= 7.6) { hit = p; break; }
          } else {""")
rep("        isMoving = true;\n        isPraying = false;\n        isSitting = false;\n\n        targetRing",
    "        isMoving = true;\n        isPraying = false;\n        isSitting = false;\n        isEating = false;\n\n        targetRing")
rep("      if (currentStepKey !== 'step4') goToTourStep('step4');\n      isMoving = false;",
    "      if (currentStepKey !== 'step4') goToTourStep('step4');\n      isEating = false;\n      isMoving = false;")
rep("""      characterGroup.position.set(-5.6, -6.6 + 0.22, -8.6);
      characterGroup.rotation.y = Math.PI * 0.78; // 강단 정면 응시
      targetPos.copy(characterGroup.position);

      controls.target.set(-5.6, -6.6 + 0.85, -8.6);
      camera.position.set(-3.2, -5.2, -5.8); // 캐릭터의 착석 모습을 비추는 뷰""",
    """      const seat = pickB1Seat(-6.0, -8.6);
      characterGroup.position.set(seat.x, seat.y, seat.z);
      characterGroup.rotation.y = seat.rot; // 무대(왼쪽 위 모서리)를 향해 앉음
      targetPos.copy(characterGroup.position);

      controls.target.set(seat.x, seat.y + 0.8, seat.z);
      camera.position.set(seat.x - Math.sin(seat.rot) * 2.8, seat.y + 1.6, seat.z - Math.cos(seat.rot) * 2.8); // 뒤에서 비추는 뷰""")
rep("      isMoving = false;\n      isPraying = !isPraying;", "      isMoving = false;\n      isEating = false;\n      isPraying = !isPraying;")
rep('        <button class="action-btn" id="btnActionPray">🙏 자리에서 기도</button>',
    '        <button class="action-btn" id="btnActionPray">🙏 자리에서 기도</button>\n        <button class="action-btn" id="btnActionEat">🍚 식당에서 밥먹기</button>\n        <button class="action-btn" id="btnActionGroup">💬 소그룹실 앉기</button>')
rep("    // 찬양 BGM\n", buttons + "    // 찬양 BGM\n")
rep("      // 3. 평상시 기본 차렷 자세\n      else {", """      // 3. 식사 상태 (앉아서 오른팔로 숟가락질)
      else if (isEating) {
        const lift = (Math.sin(time * 2.6) + 1) / 2;
        body.position.y = 0.22;
        headGroup.position.y = 0.65;
        headGroup.rotation.x = 0.12 + lift * 0.1;
        leftArmGroup.rotation.set(-0.5, 0, 0.15);
        rightArmGroup.rotation.set(-0.5 - lift * 0.9, 0, -0.15);
      }
      // 4. 평상시 기본 차렷 자세
      else {""")

# --- 본당(지하) 시야: 위에서 내려다보는 단면 시점. 본당 밖 건물은 숨기고 북·서쪽 벽도 반투명 ---
rep("    const topMeshes = []; // 4층·지붕 (3층 내부를 위에서 볼 때 숨김)",
    "    const topMeshes = []; // 4층·지붕 (3층 내부를 위에서 볼 때 숨김)\n    const outsideMeshes = []; // 본당(B1) 이외의 건물·주변 (본당을 위에서 볼 때 숨김)")
rep("            if (child.name.startsWith('F4_') || child.name.startsWith('ROOF')) topMeshes.push(child);",
    "            if (child.name.startsWith('F4_') || child.name.startsWith('ROOF')) topMeshes.push(child);\n"
    "            if (!child.name.startsWith('B1_FINAL')) {\n"
    "              child.userData.isTop = child.name.startsWith('F4_') || child.name.startsWith('ROOF');\n"
    "              outsideMeshes.push(child);\n"
    "            }")
rep("              child.name.includes('Wall_South') ||\n              child.name.includes('Wall_East')",
    "              child.name.includes('Wall_South') ||\n              child.name.includes('Wall_East') ||\n              child.name.includes('Wall_North') ||\n              child.name.includes('Wall_West')")
rep("      topMeshes.forEach(m => { m.visible = !wp.hideTop; });",
    "      outsideMeshes.forEach(m => { m.visible = !(wp.hideOutside || (wp.hideTop && m.userData.isTop)); });\n      furn.visible = !wp.hideOutside; // 3층 가구는 본당을 위에서 볼 때 숨김")
rep("        camPos: new THREE.Vector3(-1.5, -3.2, 4.2),\n        camLook: new THREE.Vector3(-6.5, -5.8, -7.5),\n        floorY: -6.6,\n        isB1: true\n      },",
    "        // 위에서 비스듬히 내려다보는 시점 (본당 밖 건물은 숨김)\n        camPos: new THREE.Vector3(-3.5, 9.5, 8.5),\n        camLook: new THREE.Vector3(-6.5, -5.5, -8.5),\n        floorY: -6.6,\n        isB1: true,\n        hideOutside: true\n      },")
rep("        controls.maxDistance = 25;", "        controls.maxDistance = 35;")
open('/home/claude/church-site/index.html', 'w', encoding='utf-8').write(src)
a = src.index('<script type="module">') + len('<script type="module">')
b = src.rindex('</script>')
open(sp + '/module.mjs', 'w', encoding='utf-8').write(src[a:b])
print('built', len(src))
