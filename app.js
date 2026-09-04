/* app.js - Interactive Security Systems for LaZarus */
(function() {
  'use strict';

  /* ==========================================================
     1. TACTICAL WEB AUDIO SYNTHESIZER (ZERO EXTERNAL FILES)
     ========================================================== */
  class TacticalAudio {
    constructor() {
      this.ctx = null;
      this.enabled = false;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.init();
      this.enabled = !this.enabled;
      return this.enabled;
    }

    playHover() {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(820, now);
        osc.frequency.exponentialRampToValueAtTime(1240, now + 0.04);

        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
      } catch (e) {}
    }

    playClick() {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.07);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
      } catch (e) {}
    }

    playHammer() {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const chime = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(1450, now);
        chime.frequency.exponentialRampToValueAtTime(750, now + 0.25);
        chimeGain.gain.setValueAtTime(0.2, now);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        chime.connect(chimeGain);
        chimeGain.connect(this.ctx.destination);
        chime.start(now);
        chime.stop(now + 0.25);

        const thud = this.ctx.createOscillator();
        const thudGain = this.ctx.createGain();
        thud.type = 'triangle';
        thud.frequency.setValueAtTime(110, now);
        thud.frequency.exponentialRampToValueAtTime(36, now + 0.2);
        thudGain.gain.setValueAtTime(0.25, now);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        thud.connect(thudGain);
        thudGain.connect(this.ctx.destination);
        thud.start(now);
        thud.stop(now + 0.2);
      } catch (e) {}
    }

    playShield() {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.35);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(500, now);
        filter.Q.value = 4;

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
      } catch (e) {}
    }

    playAlert() {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(440, now + 0.08);
        osc.frequency.setValueAtTime(880, now + 0.16);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.28);
      } catch (e) {}
    }
  }

  const audio = new TacticalAudio();

  /* ==========================================================
     2. ATMOSPHERIC PARTICLE & SHIMMER CANVAS
     ========================================================== */
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let width = window.innerWidth;
  let height = window.innerHeight;
  let particles = [];
  let mouse = { x: -1000, y: -1000, timer: null };

  function resizeCanvas() {
    if (!canvas) return;
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const colors = [
    'rgba(255, 76, 168, ',
    'rgba(84, 233, 255, ',
    'rgba(195, 255, 97, ',
    'rgba(125, 89, 255, ',
    'rgba(245, 196, 105, '
  ];

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 10;
      this.size = Math.random() * 2.8 + 0.8;
      this.speedY = -(Math.random() * 0.7 + 0.2);
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.baseAlpha = Math.random() * 0.6 + 0.2;
      this.alpha = this.baseAlpha;
      this.colorBase = colors[Math.floor(Math.random() * colors.length)];
      this.pulseSpeed = Math.random() * 0.03 + 0.01;
      this.pulse = Math.random() * Math.PI * 2;
    }

    update() {
      this.y += this.speedY;
      this.x += this.speedX;
      this.pulse += this.pulseSpeed;
      this.alpha = this.baseAlpha * (0.6 + Math.sin(this.pulse) * 0.4);

      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120;
        this.x -= (dx / dist) * force * 3;
        this.y -= (dy / dist) * force * 3;
        this.alpha = Math.min(1, this.alpha + 0.4);
      }

      if (this.y < -10 || this.x < -10 || this.x > width + 10) {
        this.reset();
      }
    }

    draw() {
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.colorBase + this.alpha + ')';
      ctx.shadowColor = this.colorBase + '0.8)';
      ctx.shadowBlur = this.size * 3;
      ctx.fill();
    }
  }

  const particleCount = Math.min(80, Math.floor(window.innerWidth / 18));
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animateParticles() {
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
      ctx.shadowBlur = 0;
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
    }
    requestAnimationFrame(animateParticles);
  }
  requestAnimationFrame(animateParticles);

  window.addEventListener('pointermove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    clearTimeout(mouse.timer);
    mouse.timer = setTimeout(() => {
      mouse.x = -1000;
      mouse.y = -1000;
    }, 1500);
  });

  /* ==========================================================
     3. LIVE RED-TEAM SANDBOX: ATTACK & DEFENSE SIMULATOR
     ========================================================== */
  const vectorList = [
    {
      id: 'vec-1',
      title: 'PROMPT_INJECTION // RECURSIVE',
      desc: 'Token-smuggling bypass using nested semantic roleplay payloads.',
      severity: 'HIGH',
      sevClass: 'high',
      target: 'SYSTEM_PROMPT_LAYER',
      mitigation: 'Recursive AST & Invariant Boundary Filter'
    },
    {
      id: 'vec-2',
      title: 'ADVERSARIAL_WEIGHT_DRIFT',
      desc: 'Gradient poison vectors attacking low-rank adaptation matrix.',
      severity: 'CRITICAL',
      sevClass: 'critical',
      target: 'WEIGHT_LATENT_SPACE',
      mitigation: 'Spectral Density Anomaly & Checkpoint Rollback'
    },
    {
      id: 'vec-3',
      title: 'MODEL_EXTRACTION // SHADOW PROBE',
      desc: 'High-frequency query divergence probing token prediction boundaries.',
      severity: 'MED',
      sevClass: 'normal',
      target: 'API_INFERENCE_ENGINE',
      mitigation: 'Adaptive Entropy Perturbation & Rate Shaping'
    },
    {
      id: 'vec-4',
      title: 'JAILBREAK_GUARDRAIL_BYPASS',
      desc: 'Multi-turn dialectic jailbreak targeting safety alignment layer.',
      severity: 'CRITICAL',
      sevClass: 'critical',
      target: 'ALIGNMENT_GUARDRAILS',
      mitigation: 'Model-to-Model Sentinel Cross-Validation'
    }
  ];

  let activeVector = vectorList[0];
  let isSimRunning = false;

  const vectorContainer = document.getElementById('attackVectorList');
  function renderVectors() {
    if (!vectorContainer) return;
    vectorContainer.innerHTML = '';
    vectorList.forEach((vec) => {
      const el = document.createElement('div');
      el.className = 'attack-vector-item' + (vec.id === activeVector.id ? ' active' : '');
      el.innerHTML = '<div class="vector-info"><h4>// ' + vec.title + '</h4><p>' + vec.desc + '</p></div><span class="vector-severity ' + vec.sevClass + '">' + vec.severity + '</span>';
      el.addEventListener('click', () => {
        if (isSimRunning) return;
        activeVector = vec;
        renderVectors();
        audio.playHover();
        addTerminalLog('SELECT_VECTOR', 'Loaded target vector: ' + vec.title, 'info');
      });
      vectorContainer.appendChild(el);
    });
  }
  renderVectors();

  const logContainer = document.getElementById('terminalLogs');
  function addTerminalLog(tag, msg, type = 'info') {
    if (!logContainer) return;
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    const row = document.createElement('div');
    row.className = 'log-entry ' + type;
    row.innerHTML = '<span class="log-prompt">[' + timeStr + '] [' + tag + ']</span> <span>' + msg + '</span>';
    logContainer.appendChild(row);

    const term = document.getElementById('simTerminal');
    if (term) term.scrollTop = term.scrollHeight;
  }

  const simCanvas = document.getElementById('simGraphCanvas');
  const sCtx = simCanvas ? simCanvas.getContext('2d') : null;
  let simPackets = [];
  let shieldHit = 0;

  function resizeSimCanvas() {
    if (!simCanvas) return;
    simCanvas.width = simCanvas.offsetWidth;
    simCanvas.height = simCanvas.offsetHeight;
  }
  window.addEventListener('resize', resizeSimCanvas);
  setTimeout(resizeSimCanvas, 100);

  function drawSimScene() {
    if (!sCtx || !simCanvas) return;
    const w = simCanvas.width;
    const h = simCanvas.height;
    sCtx.clearRect(0, 0, w, h);

    sCtx.strokeStyle = 'rgba(84, 233, 255, 0.05)';
    sCtx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      sCtx.beginPath(); sCtx.moveTo(x, 0); sCtx.lineTo(x, h); sCtx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      sCtx.beginPath(); sCtx.moveTo(0, y); sCtx.lineTo(w, y); sCtx.stroke();
    }

    const attackerX = 80;
    const attackerY = h / 2;
    const targetX = w - 90;
    const targetY = h / 2;
    const shieldX = w / 2 + 30;

    // Attacker
    sCtx.beginPath();
    sCtx.arc(attackerX, attackerY, 18, 0, Math.PI * 2);
    sCtx.fillStyle = 'rgba(255, 76, 168, 0.2)';
    sCtx.strokeStyle = '#ff4ca8';
    sCtx.lineWidth = 2;
    sCtx.shadowColor = '#ff4ca8';
    sCtx.shadowBlur = 15;
    sCtx.fill();
    sCtx.stroke();
    sCtx.shadowBlur = 0;

    sCtx.fillStyle = '#eef3ff';
    sCtx.font = '800 9px monospace';
    sCtx.textAlign = 'center';
    sCtx.fillText('EXPLOIT', attackerX, attackerY + 3);

    // Target
    sCtx.beginPath();
    sCtx.arc(targetX, targetY, 22, 0, Math.PI * 2);
    sCtx.fillStyle = 'rgba(84, 233, 255, 0.15)';
    sCtx.strokeStyle = '#54e9ff';
    sCtx.lineWidth = 2.5;
    sCtx.shadowColor = '#54e9ff';
    sCtx.shadowBlur = 18;
    sCtx.fill();
    sCtx.stroke();
    sCtx.shadowBlur = 0;

    sCtx.fillStyle = '#54e9ff';
    sCtx.fillText('SENTINEL', targetX, targetY - 4);
    sCtx.fillStyle = '#9ea8bd';
    sCtx.font = '700 8px monospace';
    sCtx.fillText('MODEL', targetX, targetY + 7);

    // Shield
    const shieldAlpha = Math.min(1, 0.3 + shieldHit * 0.7);
    sCtx.beginPath();
    sCtx.ellipse(shieldX, h / 2, 24, h * 0.38, 0, -Math.PI / 2, Math.PI / 2);
    sCtx.strokeStyle = 'rgba(84, 233, 255, ' + shieldAlpha + ')';
    sCtx.lineWidth = 4 + shieldHit * 3;
    sCtx.shadowColor = '#54e9ff';
    sCtx.shadowBlur = 12 + shieldHit * 20;
    sCtx.stroke();
    sCtx.shadowBlur = 0;

    if (shieldHit > 0) {
      shieldHit *= 0.92;
      if (shieldHit < 0.01) shieldHit = 0;
    }

    for (let i = simPackets.length - 1; i >= 0; i--) {
      const p = simPackets[i];
      p.x += p.speed;

      if (p.x >= shieldX - 5 && p.type === 'exploit') {
        p.intercepted = true;
        shieldHit = 1;
        audio.playShield();
        simPackets.splice(i, 1);
        continue;
      }

      sCtx.beginPath();
      sCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      sCtx.fillStyle = p.color;
      sCtx.shadowColor = p.color;
      sCtx.shadowBlur = 8;
      sCtx.fill();
      sCtx.shadowBlur = 0;

      if (p.x > w + 20) {
        simPackets.splice(i, 1);
      }
    }

    requestAnimationFrame(drawSimScene);
  }
  drawSimScene();

  const runBtn = document.getElementById('runSimBtn');
  const resetBtn = document.getElementById('resetSimBtn');

  if (runBtn) {
    runBtn.addEventListener('click', () => {
      if (isSimRunning) return;
      isSimRunning = true;
      runBtn.disabled = true;
      runBtn.style.opacity = '0.5';
      audio.playClick();
      audio.playAlert();

      addTerminalLog('BREACH_ATTEMPT', 'Executing exploit: ' + activeVector.title, 'warn');

      let count = 0;
      const interval = setInterval(() => {
        if (!simCanvas) return;
        const h = simCanvas.height;
        simPackets.push({
          x: 95,
          y: h / 2 + (Math.random() - 0.5) * 45,
          speed: 4 + Math.random() * 2,
          size: 3.5,
          color: '#ff4ca8',
          type: 'exploit'
        });
        count++;

        if (count === 3) {
          addTerminalLog('TELEMETRY', 'Target Layer [' + activeVector.target + '] under probe', 'info');
        }

        if (count >= 12) {
          clearInterval(interval);
          setTimeout(() => {
            addTerminalLog('SENTINEL_DEFENSE', 'Mitigation triggered: ' + activeVector.mitigation, 'defense');
            audio.playShield();
            setTimeout(() => {
              addTerminalLog('STATUS_OK', 'Exploit neutralized. Latent parameters verified 100% stable.', 'success');
              isSimRunning = false;
              runBtn.disabled = false;
              runBtn.style.opacity = '1';
            }, 600);
          }, 500);
        }
      }, 120);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      audio.playClick();
      simPackets = [];
      shieldHit = 0;
      if (logContainer) {
        logContainer.innerHTML = '';
      }
      addTerminalLog('SYSTEM_READY', 'Simulator reset. Awaiting red-team injection vector.', 'info');
    });
  }

  /* ==========================================================
     4. INTERACTIVE FORGE & HAMMER
     ========================================================== */
  const hammerBox = document.getElementById('hammerBox');
  if (hammerBox) {
    hammerBox.addEventListener('click', () => {
      audio.playHammer();
      const pivot = document.querySelector('.hammer-pivot');
      const burst = document.querySelector('.spark-burst');
      const anvil = document.querySelector('.anvil-vibe');

      if (pivot) {
        pivot.style.animation = 'none';
        void pivot.offsetWidth;
        pivot.style.animation = 'hammer-hit 0.8s cubic-bezier(0.3, 0, 0.2, 1)';
      }
      if (burst) {
        burst.style.animation = 'none';
        void burst.offsetWidth;
        burst.style.animation = 'sparks-fire 0.8s cubic-bezier(0.3, 0, 0.2, 1)';
      }
      if (anvil) {
        anvil.style.animation = 'none';
        void anvil.offsetWidth;
        anvil.style.animation = 'anvil-shake 0.8s cubic-bezier(0.3, 0, 0.2, 1)';
      }
    });
  }

  /* ==========================================================
     5. 3D TILT & PARALLAX ON HERO ART AND CARDS
     ========================================================== */
  const heroArt = document.querySelector('.hero-art');
  const panelArt = document.querySelector('.panel-art');

  window.addEventListener('pointermove', (e) => {
    if (window.innerWidth < 900) return;
    const xRatio = (e.clientX / window.innerWidth) - 0.5;
    const yRatio = (e.clientY / window.innerHeight) - 0.5;

    if (heroArt) {
      heroArt.style.transform = 'translate(' + (xRatio * 14) + 'px, ' + (yRatio * 10 - 16) + 'px)';
    }
    if (panelArt) {
      const rotY = xRatio * 18;
      const rotX = -yRatio * 18;
      panelArt.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) scale(1.02)';
    }
  });

  document.querySelectorAll('.btn, .nav a').forEach(btn => {
    btn.addEventListener('mouseenter', () => audio.playHover());
    btn.addEventListener('click', () => audio.playClick());
  });

  const sfxBtn = document.getElementById('sfxToggleBtn');
  if (sfxBtn) {
    sfxBtn.addEventListener('click', () => {
      const isAudioOn = audio.toggle();
      sfxBtn.classList.toggle('active', isAudioOn);
      sfxBtn.innerHTML = isAudioOn ? '<span>SFX: [ON]</span>' : '<span>SFX: [OFF]</span>';
      if (isAudioOn) {
        audio.playShield();
      }
    });
  }

  /* ==========================================================
     6. LIVE TACTICAL HUD TELEMETRY
     ========================================================== */
  const hudTime = document.getElementById('hudTime');
  const hudPing = document.getElementById('hudPing');

  function updateHud() {
    if (hudTime) {
      const now = new Date();
      hudTime.textContent = now.toTimeString().split(' ')[0] + ' UTC';
    }
    if (hudPing) {
      const simulatedPing = Math.floor(18 + Math.random() * 8);
      hudPing.textContent = simulatedPing + 'ms';
    }
  }
  setInterval(updateHud, 1000);
  updateHud();

  console.log('%c[LAZARUS SYSTEM LOADED] %cAI Red-Team Platform Active.', 'color: #ff4ca8; font-weight: bold;', 'color: #54e9ff;');
})();
