    // -------------------------------------------------------------------------
    // 3층 버튼: 식당에서 밥먹기 / 소그룹실 앉기
    // -------------------------------------------------------------------------
    function sitAt(x, z, rotY) {
      isMoving = false;
      isPraying = false;
      isSitting = true;
      characterGroup.position.set(x, F3_Y + 0.26, z);
      characterGroup.rotation.y = rotY;
      targetPos.copy(characterGroup.position);
      controls.target.set(x, F3_Y + 0.85, z);
    }

    document.getElementById('btnActionEat').addEventListener('click', () => {
      if (currentStepKey !== 'step5') goToTourStep('step5');
      sitAt(-5.85, DINING_ROWS[1], Math.PI / 2);   // 가운데 열 · 가운데 줄 서쪽 의자, 동쪽을 보고 앉음
      isEating = true;
      camera.position.set(-3.6, F3_Y + 1.7, DINING_ROWS[1] + 2.0);
    });

    document.getElementById('btnActionGroup').addEventListener('click', () => {
      if (currentStepKey !== 'step5') goToTourStep('step5');
      sitAt(-1.62, (roomZ[0] + roomZ[1]) / 2 - 0.4, Math.PI / 2); // 소그룹실 1 서쪽 의자
      camera.position.set(-3.2, F3_Y + 1.9, (roomZ[0] + roomZ[1]) / 2 + 1.6);
    });

