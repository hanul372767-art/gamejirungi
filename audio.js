/**
 * 지렁이 영양소 탐험 (Nutrient Worm Adventure)
 * Web Audio API 기반 오디오 엔진 (별도 외부 음원 파일 없이 100% 브라우저 자체 합성)
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
  }

  // 브라우저 정책상 사용자 인터랙션 후 초기화
  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
    return this.isMuted;
  }

  // 1) 정답 식품 섭취 효과음 (경쾌한 2화음 띵동/퐁!)
  playCorrect() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    // 523.25Hz (C5) -> 659.25Hz (E5) -> 783.99Hz (G5)
    osc1.frequency.setValueAtTime(523.25, now);
    osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.12);

    osc2.frequency.setValueAtTime(659.25, now + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.18);

    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.05);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  // 2) 오답 식품 섭취 효과음 (짧은 뾱/버저음)
  playWrong() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(130, now + 0.22);

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // 3) 미션 달성 / 레벨업 팡파레
  playMissionClear() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C - E - G - High C
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.38);
    });
  }

  // 4) 게임 오버 사운드
  playGameOver() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [440, 392, 349.23, 293.66]; // A - G - F - D 하강
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      gain.gain.setValueAtTime(0.18, now + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.26);
    });
  }

  // 5) UI 버튼 클릭음
  playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // 6) 밝고 경쾌한 8-bit 스타일 BGM 멜로디 루프
  startBgm() {
    if (this.isMuted || this.bgmPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    this.bgmPlaying = true;
    this.bgmStep = 0;

    // 밝고 산뜻한 마이너/메이저 펜타토닉 16스텝 멜로디
    const melody = [
      523.25, 0, 659.25, 0, 783.99, 659.25, 880.00, 0,
      783.99, 0, 659.25, 523.25, 587.33, 0, 523.25, 0
    ];
    const bass = [
      261.63, 261.63, 329.63, 329.63, 392.00, 392.00, 440.00, 440.00,
      392.00, 392.00, 329.63, 329.63, 293.66, 293.66, 261.63, 261.63
    ];

    const stepInterval = 200; // 120 BPM 느낌 (ms)

    const tick = () => {
      if (!this.bgmPlaying || this.isMuted) return;

      const note = melody[this.bgmStep % melody.length];
      const bassNote = bass[this.bgmStep % bass.length];
      const now = this.ctx.currentTime;

      // 멜로디 노트
      if (note > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      }

      // 베이스 노트
      if (this.bgmStep % 2 === 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sine';
        bOsc.frequency.setValueAtTime(bassNote / 2, now);
        bGain.gain.setValueAtTime(0.05, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        bOsc.connect(bGain);
        bGain.connect(this.ctx.destination);
        bOsc.start(now);
        bOsc.stop(now + 0.3);
      }

      this.bgmStep++;
      this.bgmTimer = setTimeout(tick, stepInterval);
    };

    tick();
  }

  stopBgm() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

// 전역 오디오 인스턴스
window.soundManager = new SoundManager();
