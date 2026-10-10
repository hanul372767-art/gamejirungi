/**
 * 지렁이 영양소 탐험 (Nutrient Worm Adventure)
 * 지렁이(스네이크) 물리, 조작 및 렌더링 엔진
 */

class Worm {
  constructor(gridWidth, gridHeight, cellSize) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.cellSize = cellSize;
    this.reset();
  }

  reset() {
    const startX = Math.floor(this.gridWidth / 2);
    const startY = Math.floor(this.gridHeight / 2);

    // 초기 몸체 (머리 -> 꼬리)
    this.body = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
      { x: startX - 3, y: startY }
    ];

    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.growPending = 0;
    this.isFlashing = false;
    this.flashTimer = 0;
    this.eyeBlinkTimer = 0;
    this.isBlinking = false;
    this.mouthOpen = false;
    this.colorTheme = {
      head: '#22C55E',      // 산뜻한 연두/에메랄드
      headAccent: '#16A34A',
      body1: '#4ADE80',
      body2: '#86EFAC',
      belly: '#BBF7D0',
      blush: '#F472B6'      // 핑크 볼터치
    };
  }

  setDirection(dx, dy) {
    // 180도 역주행 방지
    if (this.direction.x !== 0 && dx === -this.direction.x) return;
    if (this.direction.y !== 0 && dy === -this.direction.y) return;
    this.nextDirection = { x: dx, y: dy };
  }

  // 매 틱마다 이동 업데이트
  update(wallsWrap = true) {
    this.direction = { ...this.nextDirection };

    const head = this.body[0];
    let newX = head.x + this.direction.x;
    let newY = head.y + this.direction.y;

    if (wallsWrap) {
      if (newX < 0) newX = this.gridWidth - 1;
      else if (newX >= this.gridWidth) newX = 0;

      if (newY < 0) newY = this.gridHeight - 1;
      else if (newY >= this.gridHeight) newY = 0;
    } else {
      // 벽 충돌 체크
      if (newX < 0 || newX >= this.gridWidth || newY < 0 || newY >= this.gridHeight) {
        return { wallCollision: true };
      }
    }

    // 자기 몸통 충돌 체크 (단, 꼬리가 줄어드는 중이면 꼬리 끝은 제외)
    const checkLength = this.growPending > 0 ? this.body.length : this.body.length - 1;
    for (let i = 1; i < checkLength; i++) {
      if (this.body[i].x === newX && this.body[i].y === newY) {
        return { selfCollision: true };
      }
    }

    const newHead = { x: newX, y: newY };
    this.body.unshift(newHead);

    if (this.growPending > 0) {
      this.growPending--;
    } else {
      this.body.pop();
    }

    // 깜빡임 타이머 갱신
    if (this.flashTimer > 0) {
      this.flashTimer--;
      this.isFlashing = Math.floor(this.flashTimer / 3) % 2 === 1;
    } else {
      this.isFlashing = false;
    }

    // 눈 깜빡임 타이머
    this.eyeBlinkTimer++;
    if (this.eyeBlinkTimer > 35) {
      this.isBlinking = true;
      if (this.eyeBlinkTimer > 40) {
        this.eyeBlinkTimer = 0;
        this.isBlinking = false;
      }
    }

    return { success: true };
  }

  grow(amount = 1) {
    this.growPending += amount;
  }

  shrink(amount = 1) {
    for (let i = 0; i < amount; i++) {
      if (this.body.length > 3) {
        this.body.pop();
      }
    }
  }

  flash() {
    this.flashTimer = 18; // 약 18프레임 동안 점멸 효과
  }

  // 지렁이 그리기 (Canvas API)
  draw(ctx, foodList = []) {
    if (this.isFlashing) {
      ctx.globalAlpha = 0.45;
    } else {
      ctx.globalAlpha = 1.0;
    }

    const cs = this.cellSize;
    const head = this.body[0];

    // 주변에 음식이 가까이 있으면 입을 벌리는 귀여운 모션
    this.mouthOpen = foodList.some(f => {
      const dist = Math.hypot(f.x - head.x, f.y - head.y);
      return dist <= 2.2;
    });

    // 1. 몸통 그리기 (꼬리부터 머리 방향으로)
    for (let i = this.body.length - 1; i >= 1; i--) {
      const seg = this.body[i];
      const centerX = seg.x * cs + cs / 2;
      const centerY = seg.y * cs + cs / 2;

      // 꼬리로 갈수록 살짝 얇아지는 앙증맞은 볼륨감
      const progress = 1 - (i / this.body.length) * 0.35;
      const radius = (cs * 0.42) * progress;

      // 그라데이션 몸통 컬러
      const isAlt = i % 2 === 0;
      ctx.fillStyle = isAlt ? this.colorTheme.body1 : this.colorTheme.body2;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // 마디 하이라이트/배 무늬
      ctx.fillStyle = this.colorTheme.belly;
      ctx.beginPath();
      ctx.arc(centerX, centerY + radius * 0.2, radius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // 테두리
      ctx.strokeStyle = '#15803D';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. 머리 그리기
    const headX = head.x * cs + cs / 2;
    const headY = head.y * cs + cs / 2;
    const headRadius = cs * 0.48;

    // 머리 구체
    ctx.fillStyle = this.colorTheme.head;
    ctx.beginPath();
    ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = this.colorTheme.headAccent;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 방향에 따른 머리 회전 각도 계산
    let angle = 0;
    if (this.direction.x === 1) angle = 0;
    else if (this.direction.x === -1) angle = Math.PI;
    else if (this.direction.y === 1) angle = Math.PI / 2;
    else if (this.direction.y === -1) angle = -Math.PI / 2;

    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(angle);

    // 귀여운 더듬이 2개
    ctx.strokeStyle = '#15803D';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-headRadius * 0.2, -headRadius * 0.6);
    ctx.lineTo(-headRadius * 0.35, -headRadius * 1.0);
    ctx.moveTo(headRadius * 0.2, -headRadius * 0.6);
    ctx.lineTo(headRadius * 0.35, -headRadius * 1.0);
    ctx.stroke();

    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(-headRadius * 0.35, -headRadius * 1.05, 3.5, 0, Math.PI * 2);
    ctx.arc(headRadius * 0.35, -headRadius * 1.05, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 핑크빛 볼터치
    ctx.fillStyle = this.colorTheme.blush;
    ctx.beginPath();
    ctx.arc(headRadius * 0.15, -headRadius * 0.55, 3.5, 0, Math.PI * 2);
    ctx.arc(headRadius * 0.15, headRadius * 0.55, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 귀여운 눈 (깜빡임 반영)
    const eyeDistX = headRadius * 0.25;
    const eyeDistY = headRadius * 0.35;
    const eyeRadius = headRadius * 0.24;

    if (this.isBlinking) {
      // 감은 눈 (- 모양)
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(eyeDistX - 2, -eyeDistY - 4);
      ctx.lineTo(eyeDistX + 2, -eyeDistY + 4);
      ctx.moveTo(eyeDistX - 2, eyeDistY - 4);
      ctx.lineTo(eyeDistX + 2, eyeDistY + 4);
      ctx.stroke();
    } else {
      // 뜬 눈 (흰자위)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(eyeDistX, -eyeDistY, eyeRadius, 0, Math.PI * 2);
      ctx.arc(eyeDistX, eyeDistY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();

      // 눈동자 (앞쪽을 바라봄)
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(eyeDistX + 2, -eyeDistY, eyeRadius * 0.55, 0, Math.PI * 2);
      ctx.arc(eyeDistX + 2, eyeDistY, eyeRadius * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // 초롱초롱 하이라이트
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(eyeDistX + 3, -eyeDistY - 1.5, eyeRadius * 0.25, 0, Math.PI * 2);
      ctx.arc(eyeDistX + 3, eyeDistY - 1.5, eyeRadius * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    // 입 (음식 가까우면 😮 열림, 평소엔 😊 미소)
    if (this.mouthOpen) {
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.ellipse(headRadius * 0.65, 0, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(headRadius * 0.5, 0, 4.5, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
    }

    ctx.restore();
    ctx.globalAlpha = 1.0;
  }
}

window.Worm = Worm;
