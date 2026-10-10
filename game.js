/**
 * 지렁이 영양소 탐험 (Nutrient Worm Adventure)
 * 메인 게임 엔진 및 수업용 인터랙션 제어
 */

class NutrientGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // 그리드 설정
    this.gridWidth = 24;
    this.gridHeight = 16;
    this.cellSize = 40; // 36에서 40으로 확대하여 식품명과 아이콘 크기 대폭 향상

    // 캔버스 크기 세팅
    this.canvas.width = this.gridWidth * this.cellSize;
    this.canvas.height = this.gridHeight * this.cellSize;

    this.worm = new Worm(this.gridWidth, this.gridHeight, this.cellSize);
    this.foods = []; // 현재 필드에 있는 식품들
    this.particles = []; // 섭취 시 이펙트 파티클
    this.floatingTexts = []; // 점수 텍스트 플로팅

    // 게임 상태
    this.state = 'TITLE'; // 'TITLE', 'PLAYING', 'PAUSED', 'STAGE_CLEAR', 'GAMEOVER', 'ALL_CLEARED'
    this.score = 0;
    this.lives = 5;
    this.maxLives = 5;
    this.combo = 0;
    this.maxCombo = 0;
    this.correctCount = 0;
    this.wrongCount = 0;

    // 영양소 진행도
    this.currentNutrientIndex = 0;
    this.currentNutrient = null;
    this.targetQuota = 3;
    this.currentQuotaProgress = 0;
    this.selectedMode = 'ALL'; // 'ALL': 10대 영양소 순차 정복, 또는 특정 nutrientId

    // 옵션
    this.speed = 250; // 틱 간격 (ms) - 중학교 수업 최적 느린 기본 속도 (초당 4칸)
    this.wallsWrap = true; // 벽 통과 여부

    this.lastTickTime = 0;
    this.animationFrameId = null;

    // UI 요소 캐싱
    this.dom = {
      score: document.getElementById('hudScore'),
      targetName: document.getElementById('targetNutrientName'),
      targetDesc: document.getElementById('targetNutrientDesc'),
      targetIcon: document.getElementById('targetNutrientIcon'),
      targetBadge: document.getElementById('targetNutrientBadge'),
      targetProgressText: document.getElementById('targetProgressText'),
      targetProgressBar: document.getElementById('targetProgressBar'),
      livesContainer: document.getElementById('hudLives'),
      comboContainer: document.getElementById('hudCombo'),
      comboText: document.getElementById('hudComboText'),
      toast: document.getElementById('gameToast'),
      toastIcon: document.getElementById('toastIcon'),
      toastMsg: document.getElementById('toastMsg'),
      // 모달들
      startModal: document.getElementById('startModal'),
      pauseModal: document.getElementById('pauseModal'),
      resultModal: document.getElementById('resultModal'),
      encyclopediaModal: document.getElementById('encyclopediaModal')
    };

    this.initEvents();
    this.renderEncyclopedia();
    this.renderLives();
  }

  // 1. 이벤트 리스너 등록
  initEvents() {
    // 키보드 조작
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (this.state !== 'PLAYING') {
        if (e.key === ' ' || e.key === 'Enter') {
          if (this.state === 'TITLE') this.startGame();
          else if (this.state === 'PAUSED') this.togglePause();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          this.worm.setDirection(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.worm.setDirection(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.worm.setDirection(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.worm.setDirection(1, 0);
          break;
        case 'p':
        case 'P':
        case 'Escape':
          this.togglePause();
          break;
      }
    });

    // 온스크린 가상 조이스틱 버튼 (태블릿/스마트보드 터치 지원)
    const btnUp = document.getElementById('btnUp');
    const btnDown = document.getElementById('btnDown');
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');

    const bindTouch = (elem, dx, dy) => {
      if (!elem) return;
      const handler = (e) => {
        e.preventDefault();
        window.soundManager.initContext();
        if (this.state === 'PLAYING') {
          this.worm.setDirection(dx, dy);
        }
      };
      elem.addEventListener('pointerdown', handler);
    };

    bindTouch(btnUp, 0, -1);
    bindTouch(btnDown, 0, 1);
    bindTouch(btnLeft, -1, 0);
    bindTouch(btnRight, 1, 0);

    // BGM 토글
    const muteBtn = document.getElementById('btnMuteToggle');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = window.soundManager.toggleMute();
        muteBtn.textContent = isMuted ? '🔇 음소거 해제' : '🔊 사운드 ON';
        muteBtn.classList.toggle('muted', isMuted);
      });
    }

    // 도감 열기/닫기
    const btnEncyclopedia = document.getElementById('btnEncyclopedia');
    const closeEncyclopedia = document.getElementById('closeEncyclopedia');
    if (btnEncyclopedia) {
      btnEncyclopedia.addEventListener('click', () => {
        window.soundManager.playClick();
        this.openEncyclopedia();
      });
    }
    if (closeEncyclopedia) {
      closeEncyclopedia.addEventListener('click', () => {
        window.soundManager.playClick();
        this.closeEncyclopedia();
      });
    }

    // 일시정지 재개
    const btnResume = document.getElementById('btnResume');
    if (btnResume) {
      btnResume.addEventListener('click', () => {
        window.soundManager.playClick();
        this.togglePause();
      });
    }

    // 다시 시작
    const btnRestart = document.getElementById('btnRestart');
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        window.soundManager.playClick();
        this.startGame();
      });
    }

    // 상단 헤더 실시간 속도 조절
    const headerSpeedSelect = document.getElementById('headerSpeedSelect');
    const speedSelect = document.getElementById('selectSpeed');

    const updateSpeed = (val) => {
      this.speed = parseInt(val, 10);
      if (headerSpeedSelect) headerSpeedSelect.value = val;
      if (speedSelect) speedSelect.value = val;
      if (this.state === 'PLAYING') {
        const speedNames = { '320': '🐌 아주 느림', '250': '🌱 느림 (추천)', '190': '🌿 보통', '140': '⚡ 빠름' };
        this.showToast('⚡ 속도 변경', `이동 속도가 [${speedNames[val] || val + 'ms'}]으로 변경되었습니다.`, 'info', 1800);
      }
    };

    if (headerSpeedSelect) {
      headerSpeedSelect.addEventListener('change', (e) => {
        updateSpeed(e.target.value);
      });
    }

    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        updateSpeed(e.target.value);
      });
    }

    // 시작 모달 내 시작 버튼
    const btnStartGame = document.getElementById('btnStartGame');
    if (btnStartGame) {
      btnStartGame.addEventListener('click', () => {
        window.soundManager.initContext();
        window.soundManager.playClick();
        window.soundManager.startBgm();

        // 선택된 난이도 / 속도 반영
        if (speedSelect) {
          this.speed = parseInt(speedSelect.value, 10);
        }

        // 선택된 모드 (전체 순차 또는 특정 영양소)
        const modeSelect = document.getElementById('selectMode');
        if (modeSelect) {
          this.selectedMode = modeSelect.value;
        }

        // 벽 통과 옵션
        const wallCheck = document.getElementById('checkWallWrap');
        if (wallCheck) {
          this.wallsWrap = wallCheck.checked;
        }

        this.startGame();
      });
    }
  }

  // 2. 게임 시작
  startGame() {
    this.score = 0;
    this.lives = this.maxLives;
    this.combo = 0;
    this.maxCombo = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.particles = [];
    this.floatingTexts = [];

    this.worm.reset();

    // 시작 영양소 결정
    if (this.selectedMode === 'ALL') {
      this.currentNutrientIndex = 0;
      this.currentNutrient = NUTRIENTS[NUTRIENT_ORDER[0]];
    } else {
      this.currentNutrient = NUTRIENTS[this.selectedMode];
      this.currentNutrientIndex = NUTRIENT_ORDER.indexOf(this.selectedMode);
    }

    this.targetQuota = this.currentNutrient.targetQuota || 3;
    this.currentQuotaProgress = 0;

    // 모달 숨기기
    this.dom.startModal.classList.add('hidden');
    this.dom.pauseModal.classList.add('hidden');
    this.dom.resultModal.classList.add('hidden');

    this.updateHUD();
    this.spawnFoods();

    this.state = 'PLAYING';
    this.lastTickTime = performance.now();

    if (!this.animationFrameId) {
      this.gameLoop(performance.now());
    }

    this.showToast('🚀 게임 시작!', `첫 번째 목표: ${this.currentNutrient.name} 함유 식품을 찾으세요!`, 'info');
  }

  // 3. 목표 영양소 교체 (다음 단계)
  advanceNutrient() {
    window.soundManager.playMissionClear();

    // 전체 정복 모드인 경우
    if (this.selectedMode === 'ALL') {
      this.currentNutrientIndex++;
      if (this.currentNutrientIndex >= NUTRIENT_ORDER.length) {
        // 모든 10대 영양소 클리어!
        this.gameWin();
        return;
      }
      this.currentNutrient = NUTRIENTS[NUTRIENT_ORDER[this.currentNutrientIndex]];
    } else {
      // 단일 영양소 집중 모드인 경우 연속 회차 진행
      this.currentQuotaProgress = 0;
    }

    this.targetQuota = this.currentNutrient.targetQuota || 3;
    this.currentQuotaProgress = 0;

    this.showToast(
      '🌟 미션 클리어!',
      `다음 목표: [${this.currentNutrient.name}] 함유 식품을 섭취하세요!`,
      'success',
      3000
    );

    // 필드 식품 전면 재스폰
    this.spawnFoods();
    this.updateHUD();
  }

  // 4. 식품 스폰 알고리즘
  spawnFoods() {
    this.foods = [];
    const targetNutrientId = this.currentNutrient.id;

    // 정답 식품 후보군 필터링
    const correctCandidates = FOOD_ITEMS.filter(f => f.nutrients.includes(targetNutrientId));
    // 오답 식품 후보군 필터링
    const wrongCandidates = FOOD_ITEMS.filter(f => !f.nutrients.includes(targetNutrientId));

    // 화면에 정답 2~3개, 오답 3~4개 스폰
    const numCorrect = 3;
    const numWrong = 4;

    const selectedFoods = [];

    // 정답 랜덤 선택
    for (let i = 0; i < numCorrect; i++) {
      const item = correctCandidates[Math.floor(Math.random() * correctCandidates.length)];
      selectedFoods.push(item);
    }

    // 오답 랜덤 선택
    for (let i = 0; i < numWrong; i++) {
      const item = wrongCandidates[Math.floor(Math.random() * wrongCandidates.length)];
      selectedFoods.push(item);
    }

    // 좌표 배치
    selectedFoods.forEach(food => {
      const pos = this.getRandomEmptyPosition();
      if (pos) {
        this.foods.push({
          ...food,
          x: pos.x,
          y: pos.y,
          pulse: Math.random() * Math.PI * 2
        });
      }
    });
  }

  // 단일 식품 보충 스폰
  respawnSingleFood(consumedIndex) {
    this.foods.splice(consumedIndex, 1);

    const targetNutrientId = this.currentNutrient.id;
    const correctCount = this.foods.filter(f => f.nutrients.includes(targetNutrientId)).length;

    let candidatePool = [];
    // 정답이 2개 미만이면 무조건 정답 보충, 아니면 50% 확률로 정답/오답
    if (correctCount < 2 || Math.random() < 0.45) {
      candidatePool = FOOD_ITEMS.filter(f => f.nutrients.includes(targetNutrientId));
    } else {
      candidatePool = FOOD_ITEMS.filter(f => !f.nutrients.includes(targetNutrientId));
    }

    const item = candidatePool[Math.floor(Math.random() * candidatePool.length)];
    const pos = this.getRandomEmptyPosition();
    if (pos) {
      this.foods.push({
        ...item,
        x: pos.x,
        y: pos.y,
        pulse: Math.random() * Math.PI * 2
      });
    }
  }

  getRandomEmptyPosition() {
    let attempts = 0;
    while (attempts < 200) {
      const x = Math.floor(Math.random() * this.gridWidth);
      const y = Math.floor(Math.random() * this.gridHeight);

      // 지렁이 몸체와 겹치는지 체크
      const hitsWorm = this.worm.body.some(seg => seg.x === x && seg.y === y);
      // 이미 스폰된 음식과 최소 1칸 이상 떨어뜨려 큰 뱃지가 서로 겹치지 않도록 보호 (초기 시도 시)
      const hitsFood = this.foods.some(food => {
        if (attempts < 120) {
          return Math.abs(food.x - x) <= 1 && Math.abs(food.y - y) <= 1;
        }
        return food.x === x && food.y === y;
      });

      if (!hitsWorm && !hitsFood) {
        return { x, y };
      }
      attempts++;
    }
    return null;
  }

  // 5. 게임 틱 및 물리 업데이트
  tick() {
    if (this.state !== 'PLAYING') return;

    const result = this.worm.update(this.wallsWrap);

    // 충돌 체크 (벽 또는 자기 몸통)
    if (result.wallCollision || result.selfCollision) {
      this.handleWormCrash(result.wallCollision ? '벽 충돌' : '몸통 충돌');
      return;
    }

    // 머리 좌표
    const head = this.worm.body[0];

    // 음식 충돌 검사
    for (let i = 0; i < this.foods.length; i++) {
      const food = this.foods[i];
      if (head.x === food.x && head.y === food.y) {
        this.handleFoodEaten(food, i);
        break;
      }
    }
  }

  // 음식 섭취 핸들러
  handleFoodEaten(food, index) {
    const isCorrect = food.nutrients.includes(this.currentNutrient.id);

    if (isCorrect) {
      // [정답 섭취]
      window.soundManager.playCorrect();
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      const comboBonus = Math.min((this.combo - 1) * 20, 100);
      const earnedScore = 100 + comboBonus;
      this.score += earnedScore;
      this.correctCount++;

      this.currentQuotaProgress++;
      this.worm.grow(1);

      // 시각적 피드백
      this.spawnParticles(food.x, food.y, '#22C55E', 15);
      this.addFloatingText(`+${earnedScore}`, food.x, food.y, '#22C55E');

      this.showToast(
        `🎉 정답! [${food.name}]`,
        `[${this.currentNutrient.name}] 섭취 성공! ${this.currentNutrient.description}`,
        'success',
        2200
      );

      // 목표 수량 달성 검사
      if (this.currentQuotaProgress >= this.targetQuota) {
        this.advanceNutrient();
        return;
      }
    } else {
      // [오답 섭취]
      window.soundManager.playWrong();
      this.combo = 0;
      this.score = Math.max(0, this.score - 50);
      this.wrongCount++;
      this.lives--;

      this.worm.flash();
      this.worm.shrink(1);

      // 해당 식품의 실제 주요 영양소 이름 가져오기
      const actualNutrientNames = food.nutrients
        .map(nId => NUTRIENTS[nId] ? NUTRIENTS[nId].name : nId)
        .join(', ');

      this.spawnParticles(food.x, food.y, '#EF4444', 12);
      this.addFloatingText('-50점 & ❤️-1', food.x, food.y, '#EF4444');

      this.showToast(
        `⚠️ 오답! [${food.name}]`,
        `[${food.name}]은(는) [${actualNutrientNames}] 함유 식품이에요! (목표: ${this.currentNutrient.name})`,
        'error',
        3500
      );

      if (this.lives <= 0) {
        this.gameOver();
        return;
      }
    }

    this.renderLives();
    this.updateHUD();
    this.respawnSingleFood(index);
  }

  // 지렁이 벽/몸통 충돌 시
  handleWormCrash(reason) {
    window.soundManager.playWrong();
    this.lives--;
    this.combo = 0;
    this.worm.flash();

    this.renderLives();
    this.updateHUD();

    this.showToast('💥 충돌 주의!', `${reason}로 하트를 1개 잃었습니다!`, 'error', 2000);

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  // 6. 게임 오버 / 게임 승리 처리
  gameOver() {
    this.state = 'GAMEOVER';
    window.soundManager.playGameOver();
    this.showResultModal(false);
  }

  gameWin() {
    this.state = 'ALL_CLEARED';
    window.soundManager.playMissionClear();
    this.showResultModal(true);
  }

  showResultModal(isWin) {
    const titleElem = document.getElementById('resultTitle');
    const badgeElem = document.getElementById('resultBadge');
    const scoreElem = document.getElementById('resultFinalScore');
    const correctElem = document.getElementById('resultCorrect');
    const wrongElem = document.getElementById('resultWrong');
    const maxComboElem = document.getElementById('resultMaxCombo');
    const commentElem = document.getElementById('resultComment');

    if (isWin) {
      titleElem.textContent = '🏆 10대 영양소 완전 정복!';
      badgeElem.textContent = '🌟 영양 탐험 마스터 🌟';
      badgeElem.className = 'result-badge win';
      commentElem.innerHTML = `
        축하합니다! 탄수화물부터 나트륨까지 <strong>10대 핵심 영양소</strong>를 모두 균형 있게 섭취했습니다.<br>
        실생활 식단에서도 다양한 음식을 골고루 섭취하는 영양 전문가가 되어보세요!
      `;
    } else {
      titleElem.textContent = '😢 탐험 종료';
      badgeElem.textContent = '아쉬운 완주 실패';
      badgeElem.className = 'result-badge lose';
      commentElem.innerHTML = `
        영양소에 맞지 않는 음식을 먹거나 충돌하여 체력이 소진되었습니다.<br>
        <strong>영양소 도감</strong>을 다시 살펴보고 올바른 식품을 찾아 도전해 보세요!
      `;
    }

    scoreElem.textContent = `${this.score}점`;
    correctElem.textContent = `${this.correctCount}개`;
    wrongElem.textContent = `${this.wrongCount}개`;
    maxComboElem.textContent = `${this.maxCombo}연속`;

    this.dom.resultModal.classList.remove('hidden');
  }

  // 7. 파티클 & 플로팅 텍스트
  spawnParticles(gridX, gridY, color, count = 10) {
    const cs = this.cellSize;
    const px = gridX * cs + cs / 2;
    const py = gridY * cs + cs / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        radius: Math.random() * 4 + 2,
        life: 1.0,
        decay: Math.random() * 0.04 + 0.03
      });
    }
  }

  addFloatingText(text, gridX, gridY, color) {
    const cs = this.cellSize;
    this.floatingTexts.push({
      text: text,
      x: gridX * cs + cs / 2,
      y: gridY * cs - 5,
      vy: -1.2,
      color: color,
      life: 1.0,
      decay: 0.025
    });
  }

  // 8. 렌더링 루프
  gameLoop(now) {
    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));

    // 틱 주기에 맞추어 업데이트
    if (now - this.lastTickTime >= this.speed) {
      this.tick();
      this.lastTickTime = now;
    }

    // 화면 그리기 (초당 60fps 부드러운 애니메이션)
    this.draw();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1) 잔잔하고 세련된 모안 그리드 배경
    this.drawGrid();

    // 2) 필드 위 식품 렌더링
    this.drawFoods();

    // 3) 지렁이 렌더링
    this.worm.draw(this.ctx, this.foods);

    // 4) 파티클 렌더링
    this.drawParticles();

    // 5) 플로팅 점수 텍스트 렌더링
    this.drawFloatingTexts();
  }

  drawGrid() {
    const cs = this.cellSize;
    // 밝고 산뜻한 노란색 캔버스 배경
    this.ctx.fillStyle = '#FEF08A';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 노란 배경과 어우러지는 따뜻한 골드/앰버 격자선
    this.ctx.strokeStyle = 'rgba(217, 119, 6, 0.14)';
    this.ctx.lineWidth = 1;

    for (let x = 0; x <= this.canvas.width; x += cs) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.canvas.height; y += cs) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  drawFoods() {
    const cs = this.cellSize;

    this.foods.forEach(food => {
      food.pulse = (food.pulse || 0) + 0.05;
      const floatOffset = Math.sin(food.pulse) * 2.5;

      const centerX = food.x * cs + cs / 2;
      const centerY = food.y * cs + cs / 2 + floatOffset;

      // 음식 바닥 그림자
      this.ctx.fillStyle = 'rgba(180, 83, 9, 0.22)';
      this.ctx.beginPath();
      this.ctx.ellipse(centerX, food.y * cs + cs - 2, cs * 0.4, 4.5, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // 식품 이모지 아이콘 (크기 확대: 0.65 -> 0.72)
      this.ctx.font = `${cs * 0.72}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(food.icon, centerX, food.y * cs + cs * 0.35 + floatOffset);

      // 식품명 뱃지 (글꼴 크기를 10.5px에서 14.5px로 대폭 확대!)
      this.ctx.font = 'bold 14.5px "Noto Sans KR", sans-serif';
      const textMetrics = this.ctx.measureText(food.name);
      const badgeWidth = textMetrics.width + 16;
      const badgeHeight = 23;
      const badgeX = centerX - badgeWidth / 2;
      const badgeY = food.y * cs + cs * 0.68 + floatOffset;

      // 뱃지 배경 (선명한 다크 네이비 캡슐)
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      if (this.ctx.roundRect) {
        this.ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 6);
      } else {
        this.ctx.rect(badgeX, badgeY, badgeWidth, badgeHeight);
      }
      this.ctx.fill();
      this.ctx.stroke();

      // 뱃지 텍스트 (화이트 볼드 한글 라벨)
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText(food.name, centerX, badgeY + badgeHeight / 2 + 0.5);
    });
  }

  drawParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.life);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1.0;
  }

  drawFloatingTexts() {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life -= ft.decay;

      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }

      this.ctx.font = 'bold 16px "Noto Sans KR", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.globalAlpha = Math.max(0, ft.life);
      this.ctx.strokeStyle = '#0F172A';
      this.ctx.lineWidth = 3;
      this.ctx.strokeText(ft.text, ft.x, ft.y);
      this.ctx.fillStyle = ft.color;
      this.ctx.fillText(ft.text, ft.x, ft.y);
    }
    this.ctx.globalAlpha = 1.0;
  }

  // 9. HUD 및 UI 갱신
  updateHUD() {
    if (!this.currentNutrient) return;

    this.dom.score.textContent = this.score.toLocaleString();

    // 현재 목표 영양소 배너
    this.dom.targetName.textContent = this.currentNutrient.name;
    this.dom.targetDesc.textContent = this.currentNutrient.description;
    this.dom.targetIcon.textContent = this.currentNutrient.icon;
    this.dom.targetBadge.style.backgroundColor = this.currentNutrient.color;

    // 미션 진행률
    this.dom.targetProgressText.textContent = `${this.currentQuotaProgress} / ${this.targetQuota}`;
    const percent = Math.min(100, (this.currentQuotaProgress / this.targetQuota) * 100);
    this.dom.targetProgressBar.style.width = `${percent}%`;

    // 콤보 표시
    if (this.combo >= 2) {
      this.dom.comboContainer.classList.remove('hidden');
      this.dom.comboText.textContent = `${this.combo} 콤보! 🔥`;
    } else {
      this.dom.comboContainer.classList.add('hidden');
    }
  }

  renderLives() {
    this.dom.livesContainer.innerHTML = '';
    for (let i = 0; i < this.maxLives; i++) {
      const heart = document.createElement('span');
      heart.className = `heart-icon ${i < this.lives ? 'active' : 'empty'}`;
      heart.textContent = i < this.lives ? '❤️' : '🖤';
      this.dom.livesContainer.appendChild(heart);
    }
  }

  showToast(title, message, type = 'info', duration = 3000) {
    if (!this.dom.toast) return;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    else if (type === 'error') icon = '⚠️';

    this.dom.toastIcon.textContent = icon;
    this.dom.toastMsg.innerHTML = `<strong>${title}</strong> ${message}`;

    this.dom.toast.className = `game-toast show toast-${type}`;

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.dom.toast.classList.remove('show');
    }, duration);
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.dom.pauseModal.classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.dom.pauseModal.classList.add('hidden');
      this.lastTickTime = performance.now();
    }
  }

  // 10. 영양소 도감 모달 렌더링
  renderEncyclopedia() {
    const listContainer = document.getElementById('encyclopediaList');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    NUTRIENT_ORDER.forEach(nId => {
      const nutrient = NUTRIENTS[nId];
      // 해당 영양소를 포함하는 모든 식품 추출
      const matchedFoods = FOOD_ITEMS.filter(f => f.nutrients.includes(nId));

      const card = document.createElement('div');
      card.className = 'encyclopedia-card';
      card.style.borderColor = nutrient.color;

      const foodBadges = matchedFoods.map(f => `
        <span class="enc-food-tag">
          ${f.icon} ${f.name}
        </span>
      `).join('');

      card.innerHTML = `
        <div class="enc-header" style="background:${nutrient.bgColor}">
          <span class="enc-icon">${nutrient.icon}</span>
          <div class="enc-title-group">
            <h4 style="color:${nutrient.color}">${nutrient.name}</h4>
            <p>${nutrient.description}</p>
          </div>
        </div>
        <div class="enc-body">
          <div class="enc-foods-label">함유 식품 (${matchedFoods.length}종):</div>
          <div class="enc-foods-list">
            ${foodBadges}
          </div>
        </div>
      `;

      listContainer.appendChild(card);
    });
  }

  openEncyclopedia() {
    this.dom.encyclopediaModal.classList.remove('hidden');
  }

  closeEncyclopedia() {
    this.dom.encyclopediaModal.classList.add('hidden');
  }
}

// 윈도우 로드 시 게임 초기화
window.addEventListener('DOMContentLoaded', () => {
  window.nutrientGame = new NutrientGame();
});
