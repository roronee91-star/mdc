# 물댄동산교회 3D 가상 탐방 — Codex 인계 프롬프트

아래 작업을 `/workspace/mdc` 저장소에서 이어서 진행해 줘. 기존 구현과 구조를 유지하고 처음부터 다시 만들지 마.

## 저장소와 배포

- GitHub: `roronee91-star/mdc`
- 작업 브랜치: `work`
- GitHub Pages 배포 브랜치: `main`
- 현재 배포 커밋: `662d1f2` (`Restore front glazing and refine stair transition`)
- 배포 주소: https://roronee91-star.github.io/mdc/
- 현재 GLB: `assets/church-environment-20261103.glb`

## 절대 유지할 조건

- 승인된 외관 버전3을 임의로 변경하지 말 것.
- 십자가 정면 오른쪽 끝은 건물 모서리이며 오른쪽 유리는 정면이 아니라 측면 창이다.
- 기존 GLB, 코드 구조, 층 레벨, 계단·승강기 구현을 유지하면서 보완할 것.
- B1 `-9.4m`, 1F `0m`, 2F `3.2m`, 3F `9.6m`, 4F `12.8m`.
- 테스트하지 않은 기능을 완료로 표시하지 말 것.
- 실제 Chromium에서 WASD, 충돌, 계단, 승강기, 카메라를 확인할 것.

## 현재 구현 상태

- 본당 실제 유효 높이 9m, 약 10m 공간감, 캐릭터 1.65m.
- 본당 의자 37개. 카메라 근접 시 의자를 숨기지 않음.
- 좌석 바닥은 12cm 간격의 12단 곡선형 단차.
- 강대상 10.8m × 4.4m, 전면 통로 최소 0.9m.
- 좌석 단차에서 평바닥으로 내려오는 12cm 높이의 9단 연결 계단 구현.
- 캐릭터 다리 흔들림을 0.18rad로 줄여 계단 관통을 완화.
- B1 후면에 자모실·엔지니어실이 별도 공간으로 구현됨.
- 3층 정면 `Upper_Setback_Glass`와 `FRAME_Setback0~21`을 유지해 커튼월이 연속됨.
- 3층 식탁 9개는 정면 커튼월 뒤쪽에 3열로 배치됨.
- 3층 후면은 하부 벽, 상부 유리, 멀리언으로 닫혀 있음.
- 2층 큰 소그룹실: 긴 회의 테이블 1개와 의자 8개.
- 2층 작은 기도실 2개: 좌식 방석 총 8개.
- B1~4F 계단 왕복과 전 층 승강기 이동이 동작함.

## 주요 코드

- `src/building-world.js`: 구조 보정, 본당, 후면실, 식당, 2층 가구, 승강기
- `src/third-person.js`: 1.65m 캐릭터, 이동과 카메라 가림 처리
- `src/walk_camera_v12.js`: 3인칭 카메라
- `src/app.js`: 공간 선택, 입력, UI, 테스트 훅
- `tests/`: 구조 및 실제 Chromium 회귀 검사
- `docs/verification/current/`: 최신 검증 스크린샷과 JSON

## 최근 검증 결과

- `npm test`: 구조 검사 23개 통과
- `npm run test:browser`: 실제 브라우저 검사 19개 통과
- `npm run test:camera`: 5개 통과
- `npm run test:occlusion`: 숨겨진 본당 의자 0개
- B1→4F 및 4F→B1 계단 통과
- 승강기 B1, 1F, 2F, 3F, 4F 승하차 통과
- 승인 외관·환경 메시 659개와 원본 의자 형상 100개 유지 확인

테스트 서버는 다음처럼 실행할 수 있다.

```bash
cd /workspace/mdc
python3 -m http.server 8008
```

주요 검사:

```bash
npm test
TEST_URL=http://127.0.0.1:8008/ npm run test:layout
TEST_URL=http://127.0.0.1:8008/ npm run test:browser
TEST_URL=http://127.0.0.1:8008/ npm run test:camera
TEST_URL=http://127.0.0.1:8008/ npm run test:occlusion
TEST_URL=http://127.0.0.1:8008/ npm run test:dining
TEST_URL=http://127.0.0.1:8008/ npm run test:education
TEST_URL=http://127.0.0.1:8008/ npm run test:rear-facade
TEST_URL=http://127.0.0.1:8008/ npm run test:rooms
TEST_URL=http://127.0.0.1:8008/ npm run test:roof
```

## 작업 방식

1. 먼저 `git status`, 최신 커밋, 위 주요 코드를 확인한다.
2. 사용자가 첨부하는 화면의 위치를 실제 메시 이름과 좌표로 확인한다.
3. 외관 버전3과 고정 층 레벨을 유지하면서 최소 범위로 수정한다.
4. 실제 Chromium에서 해당 동작과 전체 회귀 검사를 실행한다.
5. 검증 스크린샷을 `docs/verification/current/`에 저장한다.
6. 변경 파일, 수치, 통과한 검사와 미검증 항목을 구분해 보고한다.
7. 완료된 변경은 `work`에 커밋하고 `work:main`으로 푸시해 GitHub Pages에 배포한다.

현재 화면에서 추가로 발견되는 시각적 품질 문제를 이어서 수정해 줘. 외관, 계단, 좌석, 가구, 캐릭터 비례와 동선을 함께 보고 단순히 도형만 덧붙이지 말고 건축적으로 자연스럽게 정리해 줘.
