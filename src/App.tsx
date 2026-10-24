/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, RotateCcw, Volume2, VolumeX, BookOpen, HelpCircle, ArrowLeft, ArrowRight, 
  Shield, Award, Sun, Droplets, Pause, Home, AlertTriangle 
} from 'lucide-react';

// --- SOUND UTILITIES (Web Audio API Procedural Audio) ---
class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playJump() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {}
  }

  playCollect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [400, 600, 800].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.01, now + i * 0.08 + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.12);
      });
    } catch {}
  }

  playHit() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {}
  }

  playVictory() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);
        gain.gain.setValueAtTime(0.2, now + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.01, now + i * 0.15 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.3);
      });
    } catch {}
  }

  playGameOver() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [300, 250, 200, 150];
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.2);
        gain.gain.setValueAtTime(0.18, now + i * 0.2);
        gain.gain.linearRampToValueAtTime(0.01, now + i * 0.2 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.2);
        osc.stop(now + i * 0.2 + 0.35);
      });
    } catch {}
  }
}

const sound = new SoundManager();

// --- GAME CONFIG & CONSTANTS ---
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 576;
const LEVEL_WIDTH = 4500;
const GROUND_Y = 480;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'karst_rock' | 'dry_thorn';
}

interface ShadeZone {
  x: number;
  width: number;
  label: string;
}

interface Collectible {
  x: number;
  y: number;
  type: 'embun' | 'butterfly';
  collected: boolean;
  floatOffset: number;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game States: 'MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAMEOVER' | 'ENCYCLOPEDIA' | 'HOWTO'
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAMEOVER' | 'ENCYCLOPEDIA' | 'HOWTO'>('MENU');
  const [waterLevel, setWaterLevel] = useState<number>(100);
  const [distance, setDistance] = useState<number>(0);
  const [starRating, setStarRating] = useState<number>(0);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);
  const [inShade, setInShade] = useState<boolean>(false);
  const [sunHeatWarning, setSunHeatWarning] = useState<boolean>(false);

  // Game mutable refs for the 60fps loop
  const gameRef = useRef({
    player: {
      x: 100,
      y: GROUND_Y - 50,
      width: 32,
      height: 52,
      vx: 0,
      vy: 0,
      speed: 4.5,
      jumpForce: -13.5,
      isGrounded: false,
      facing: 'right' as 'left' | 'right',
      isCrouching: false,
      hurtTimer: 0,
    },
    cameraX: 0,
    water: 100,
    sunTimer: 0,
    shadeCooldownTimer: 0,
    screenShake: 0,
    particles: [] as Particle[],
    keys: { left: false, right: false, jump: false, crouch: false },
    touchControls: { left: false, right: false, jump: false, crouch: false }
  });

  // Level map entities
  const obstaclesRef = useRef<Obstacle[]>([]);
  const shadeZonesRef = useRef<ShadeZone[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);

  // Initialize Level Items
  const initLevel = () => {
    obstaclesRef.current = [
      { x: 650, y: GROUND_Y - 45, width: 55, height: 45, type: 'karst_rock' },
      { x: 1100, y: GROUND_Y - 60, width: 65, height: 60, type: 'karst_rock' },
      { x: 1550, y: GROUND_Y - 40, width: 50, height: 40, type: 'dry_thorn' },
      { x: 2000, y: GROUND_Y - 70, width: 75, height: 70, type: 'karst_rock' },
      { x: 2450, y: GROUND_Y - 50, width: 60, height: 50, type: 'karst_rock' },
      { x: 2900, y: GROUND_Y - 65, width: 70, height: 65, type: 'karst_rock' },
      { x: 3400, y: GROUND_Y - 55, width: 60, height: 55, type: 'karst_rock' },
      { x: 3850, y: GROUND_Y - 50, width: 55, height: 50, type: 'karst_rock' },
    ];

    shadeZonesRef.current = [
      { x: 450, width: 160, label: 'Pohon Lontar 1' },
      { x: 900, width: 180, label: 'Pohon Lontar 2' },
      { x: 1350, width: 170, label: 'Pohon Lontar 3' },
      { x: 1800, width: 190, label: 'Pohon Lontar 4' },
      { x: 2250, width: 180, label: 'Pohon Lontar 5' },
      { x: 2700, width: 190, label: 'Pohon Lontar 6' },
      { x: 3200, width: 180, label: 'Pohon Lontar 7' },
      { x: 3650, width: 200, label: 'Pohon Lontar 8' },
    ];

    collectiblesRef.current = [
      { x: 320, y: GROUND_Y - 110, type: 'embun', collected: false, floatOffset: 0 },
      { x: 550, y: GROUND_Y - 140, type: 'butterfly', collected: false, floatOffset: 0 },
      { x: 800, y: GROUND_Y - 120, type: 'embun', collected: false, floatOffset: 0 },
      { x: 1020, y: GROUND_Y - 150, type: 'embun', collected: false, floatOffset: 0 },
      { x: 1250, y: GROUND_Y - 130, type: 'butterfly', collected: false, floatOffset: 0 },
      { x: 1500, y: GROUND_Y - 120, type: 'embun', collected: false, floatOffset: 0 },
      { x: 1720, y: GROUND_Y - 160, type: 'embun', collected: false, floatOffset: 0 },
      { x: 1950, y: GROUND_Y - 130, type: 'butterfly', collected: false, floatOffset: 0 },
      { x: 2180, y: GROUND_Y - 140, type: 'embun', collected: false, floatOffset: 0 },
      { x: 2400, y: GROUND_Y - 120, type: 'embun', collected: false, floatOffset: 0 },
      { x: 2650, y: GROUND_Y - 150, type: 'butterfly', collected: false, floatOffset: 0 },
      { x: 2950, y: GROUND_Y - 130, type: 'embun', collected: false, floatOffset: 0 },
      { x: 3300, y: GROUND_Y - 140, type: 'embun', collected: false, floatOffset: 0 },
      { x: 3550, y: GROUND_Y - 150, type: 'butterfly', collected: false, floatOffset: 0 },
      { x: 3800, y: GROUND_Y - 120, type: 'embun', collected: false, floatOffset: 0 },
    ];
  };

  const startGame = () => {
    initLevel();
    gameRef.current.player.x = 100;
    gameRef.current.player.y = GROUND_Y - 50;
    gameRef.current.player.vx = 0;
    gameRef.current.player.vy = 0;
    gameRef.current.player.hurtTimer = 0;
    gameRef.current.cameraX = 0;
    gameRef.current.water = 100;
    gameRef.current.sunTimer = 0;
    gameRef.current.shadeCooldownTimer = 0;
    gameRef.current.particles = [];
    setWaterLevel(100);
    setDistance(0);
    setGameState('PLAYING');
  };

  // Keyboard input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keys = gameRef.current.keys;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        keys.jump = true;
        e.preventDefault();
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.crouch = true;
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'PLAYING') setGameState('PAUSED');
        else if (gameState === 'PAUSED') setGameState('PLAYING');
      }
      if (e.key === 'r' || e.key === 'R') {
        if (gameState === 'GAMEOVER' || gameState === 'VICTORY' || gameState === 'PAUSED') {
          startGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = gameRef.current.keys;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') keys.jump = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.crouch = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const renderLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      if (gameState === 'PLAYING') {
        updateGame(dt);
        drawGame();
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]);

  const updateGame = (dt: number) => {
    const state = gameRef.current;
    const player = state.player;
    const keys = state.keys;
    const touch = state.touchControls;

    const moveLeft = keys.left || touch.left;
    const moveRight = keys.right || touch.right;
    const wantJump = keys.jump || touch.jump;
    const wantCrouch = keys.crouch || touch.crouch;

    // Horizontal movement
    if (moveLeft) {
      player.vx = -player.speed;
      player.facing = 'left';
    } else if (moveRight) {
      player.vx = player.speed;
      player.facing = 'right';
    } else {
      player.vx = 0;
    }

    // Gravity & Jump
    player.vy += 0.75; // gravity
    if (wantJump && player.isGrounded) {
      player.vy = player.jumpForce;
      player.isGrounded = false;
      sound.playJump();
    }

    player.x += player.vx;
    player.y += player.vy;

    // Ground collision
    if (player.y >= GROUND_Y - player.height) {
      player.y = GROUND_Y - player.height;
      player.vy = 0;
      player.isGrounded = true;
    }

    // Boundaries
    if (player.x < 20) player.x = 20;
    if (player.x > LEVEL_WIDTH - 50) {
      // Reached Village Entrance!
      if (state.water >= 30) {
        let stars = 1;
        if (state.water >= 80) stars = 3;
        else if (state.water >= 50) stars = 2;
        setStarRating(stars);
        sound.playVictory();
        setGameState('VICTORY');
      } else {
        sound.playGameOver();
        setGameState('GAMEOVER');
      }
    }

    // Camera follow
    state.cameraX = player.x - CANVAS_WIDTH / 3;
    if (state.cameraX < 0) state.cameraX = 0;
    if (state.cameraX > LEVEL_WIDTH - CANVAS_WIDTH) {
      state.cameraX = LEVEL_WIDTH - CANVAS_WIDTH;
    }

    // Check Shade Status (Pohon Lontar)
    let shaded = false;
    for (const zone of shadeZonesRef.current) {
      if (player.x + player.width / 2 >= zone.x && player.x + player.width / 2 <= zone.x + zone.width) {
        if (wantCrouch || player.isGrounded) {
          shaded = true;
          break;
        }
      }
    }
    setInShade(shaded);

    // Water System Dynamics
    if (shaded) {
      state.sunTimer = 0;
      setSunHeatWarning(false);
      state.water = Math.min(100, state.water + 2.5 * dt); // +2.5% per sec in shade
    } else {
      // Direct sunlight evaporation
      state.sunTimer += dt;
      if (state.sunTimer > 4) {
        setSunHeatWarning(true);
      }
      let decay = 2.0 * dt; // 2% per sec base
      if (state.sunTimer > 5) {
        decay += 4.0 * dt; // Extra heat stress penalty
      }
      state.water = Math.max(0, state.water - decay);
    }

    setWaterLevel(Math.round(state.water));
    setDistance(Math.round((player.x / (LEVEL_WIDTH - 200)) * 100));

    if (state.water <= 0) {
      sound.playGameOver();
      setGameState('GAMEOVER');
    }

    // Hurt timer countdown
    if (player.hurtTimer > 0) {
      player.hurtTimer -= dt;
    }

    // Check Obstacle Collisions (Batu Karst)
    if (player.hurtTimer <= 0) {
      for (const obs of obstaclesRef.current) {
        if (
          player.x < obs.x + obs.width &&
          player.x + player.width > obs.x &&
          player.y < obs.y + obs.height &&
          player.y + player.height > obs.y
        ) {
          // Collision!
          state.water = Math.max(0, state.water - 15);
          player.hurtTimer = 1.5; // 1.5s invulnerability
          state.screenShake = 15;
          sound.playHit();
          // Knockback
          player.vx = player.facing === 'right' ? -6 : 6;
          player.vy = -5;
          break;
        }
      }
    }

    // Check Collectibles (Embun / Kupu-Kupu)
    for (const col of collectiblesRef.current) {
      if (!col.collected) {
        col.floatOffset += dt * 3;
        const currentY = col.y + Math.sin(col.floatOffset) * 6;
        const dx = (player.x + player.width / 2) - col.x;
        const dy = (player.y + player.height / 2) - currentY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 35) {
          col.collected = true;
          state.water = Math.min(100, state.water + 18);
          sound.playCollect();
          // Spawn sparkle particles
          for (let i = 0; i < 12; i++) {
            state.particles.push({
              x: col.x,
              y: currentY,
              vx: (Math.random() - 0.5) * 120,
              vy: (Math.random() - 0.5) * 120,
              color: col.type === 'embun' ? '#38bdf8' : '#f43f5e',
              size: Math.random() * 5 + 3,
              alpha: 1,
              life: 0,
              maxLife: 0.6
            });
          }
        }
      }
    }

    // Update screen shake
    if (state.screenShake > 0) {
      state.screenShake -= dt * 30;
      if (state.screenShake < 0) state.screenShake = 0;
    }

    // Update particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;
      p.alpha = 1 - p.life / p.maxLife;
      if (p.life >= p.maxLife) {
        state.particles.splice(i, 1);
      }
    }
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameRef.current;
    const camX = state.cameraX;

    ctx.save();
    // Screen shake offset
    if (state.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * state.screenShake;
      const shakeY = (Math.random() - 0.5) * state.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Sky & Background Gradient (Savanna Dusk/Morning Warmth)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGrad.addColorStop(0, '#f97316'); // Warm orange sun
    skyGrad.addColorStop(0.4, '#fed7aa'); // Soft golden
    skyGrad.addColorStop(1, '#ffedd5');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Baking Sun
    ctx.save();
    ctx.fillStyle = 'rgba(254, 240, 138, 0.6)';
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH - 120, 100, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH - 120, 100, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Parallax Mutis Mountains (Far background layer)
    ctx.save();
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= CANVAS_WIDTH + 100; x += 150) {
      const worldX = x + camX * 0.3;
      const mHeight = 160 + Math.sin(worldX * 0.003) * 60 + Math.cos(worldX * 0.007) * 40;
      ctx.lineTo(x, GROUND_Y - mHeight);
    }
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. Pohon Lontar (Palmyra Palms & Shade Zones)
    shadeZonesRef.current.forEach(zone => {
      const drawX = zone.x - camX;
      if (drawX > -200 && drawX < CANVAS_WIDTH + 200) {
        // Trunk
        ctx.fillStyle = '#78350f';
        ctx.fillRect(drawX + zone.width / 2 - 12, GROUND_Y - 220, 24, 220);

        // Fan leaves crown
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(drawX + zone.width / 2, GROUND_Y - 230, 75, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.arc(drawX + zone.width / 2 - 20, GROUND_Y - 240, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(drawX + zone.width / 2 + 20, GROUND_Y - 240, 50, 0, Math.PI * 2);
        ctx.fill();

        // Shade canopy projection tint on ground
        ctx.fillStyle = 'rgba(21, 128, 61, 0.15)';
        ctx.beginPath();
        ctx.ellipse(drawX + zone.width / 2, GROUND_Y - 5, zone.width / 2, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Label indicator for shade
        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Pohon Lontar (Teduh)', drawX + zone.width / 2, GROUND_Y - 320);
      }
    });

    // 4. Ground (Savanna Karst Terrain)
    ctx.fillStyle = '#78716c';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    
    // Limestone karst texture highlights on ground
    ctx.fillStyle = '#a8a29e';
    for (let x = - (camX % 80); x < CANVAS_WIDTH; x += 80) {
      ctx.fillRect(x, GROUND_Y, 40, 10);
    }

    // Cave starting point on left
    if (camX < 300) {
      ctx.fillStyle = '#292524';
      ctx.fillRect(50 - camX, GROUND_Y - 180, 120, 180);
      ctx.fillStyle = '#44403c';
      ctx.beginPath();
      ctx.arc(110 - camX, GROUND_Y - 90, 60, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Sumber Air Gua Karst', 60 - camX, GROUND_Y - 200);
    }

    // Village Entrance & Uma Kebubu on right
    const villageWorldX = LEVEL_WIDTH - 300;
    const villageDrawX = villageWorldX - camX;
    if (villageDrawX > -300 && villageDrawX < CANVAS_WIDTH + 300) {
      // Traditional Timor House (Uma Kebubu) - Cylindrical with conical thatched roof
      ctx.fillStyle = '#b45309';
      ctx.fillRect(villageDrawX, GROUND_Y - 110, 100, 110);
      
      // Conical roof
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(villageDrawX - 20, GROUND_Y - 110);
      ctx.lineTo(villageDrawX + 50, GROUND_Y - 190);
      ctx.lineTo(villageDrawX + 120, GROUND_Y - 110);
      ctx.closePath();
      ctx.fill();

      // Doorway
      ctx.fillStyle = '#451a03';
      ctx.fillRect(villageDrawX + 35, GROUND_Y - 60, 30, 60);

      // Banner text
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Gerbang Desa Karst (Tujuan)', villageDrawX + 50, GROUND_Y - 210);
    }

    // 5. Obstacles (Batu Karst)
    obstaclesRef.current.forEach(obs => {
      const drawX = obs.x - camX;
      if (drawX > -100 && drawX < CANVAS_WIDTH + 100) {
        ctx.fillStyle = '#57534e';
        ctx.beginPath();
        ctx.moveTo(drawX, GROUND_Y);
        ctx.lineTo(drawX + obs.width * 0.3, GROUND_Y - obs.height);
        ctx.lineTo(drawX + obs.width * 0.7, GROUND_Y - obs.height * 0.9);
        ctx.lineTo(drawX + obs.width, GROUND_Y);
        ctx.closePath();
        ctx.fill();
        // Highlight crack
        ctx.strokeStyle = '#d6d3d1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(drawX + obs.width * 0.3, GROUND_Y - obs.height);
        ctx.lineTo(drawX + obs.width * 0.5, GROUND_Y - obs.height * 0.5);
        ctx.stroke();
      }
    });

    // 6. Collectibles (Embun / Kupu-Kupu)
    collectiblesRef.current.forEach(col => {
      if (!col.collected) {
        const drawX = col.x - camX;
        if (drawX > -50 && drawX < CANVAS_WIDTH + 50) {
          const currentY = col.y + Math.sin(col.floatOffset) * 6;
          ctx.save();
          if (col.type === 'embun') {
            // Dew Drop
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(drawX, currentY, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#bae6fd';
            ctx.beginPath();
            ctx.arc(drawX - 3, currentY - 3, 3, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Air Butterfly
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.ellipse(drawX - 8, currentY, 10, 6, -0.3, 0, Math.PI * 2);
            ctx.ellipse(drawX + 8, currentY, 10, 6, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fb7185';
            ctx.fillRect(drawX - 2, currentY - 6, 4, 12);
          }
          ctx.restore();
        }
      }
    });

    // 7. Player (Riri with Woven Clay Bucket)
    const player = state.player;
    const playerDrawX = player.x - camX;
    
    ctx.save();
    // Flash if hurt
    if (player.hurtTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Body (Riri wearing traditional Timor woven scarf / kain tenun motif)
    ctx.fillStyle = '#ea580c'; // Red-orange traditional top
    ctx.fillRect(playerDrawX + 4, player.y + 18, 24, 24);

    // Head
    ctx.fillStyle = '#b45309'; // Skin tone
    ctx.beginPath();
    ctx.arc(playerDrawX + 16, player.y + 10, 10, 0, Math.PI * 2);
    ctx.fill();

    // Hair / Tiara headband (ikat kepala adat)
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(playerDrawX + 4, player.y + 2, 24, 5);

    // Woven bucket held in hands
    const bucketX = player.facing === 'right' ? playerDrawX + 22 : playerDrawX - 10;
    const bucketY = player.y + 24;
    
    // Earthen bucket shape
    ctx.fillStyle = '#854d0e';
    ctx.beginPath();
    ctx.moveTo(bucketX, bucketY);
    ctx.lineTo(bucketX + 18, bucketY);
    ctx.lineTo(bucketX + 15, bucketY + 22);
    ctx.lineTo(bucketX + 3, bucketY + 22);
    ctx.closePath();
    ctx.fill();

    // Water level inside bucket
    const waterHeightPx = (state.water / 100) * 16;
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(bucketX + 4, bucketY + 22 - waterHeightPx, 10, waterHeightPx);

    ctx.restore();

    // 8. Particles
    state.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - camX, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 font-sans text-white select-none overflow-hidden p-2 md:p-4">
      {/* GAME SHELL CONTAINER */}
      <div className="relative w-full max-w-5xl aspect-[16/9] bg-stone-900 rounded-2xl shadow-2xl overflow-hidden border border-amber-600/30 flex flex-col items-center justify-center">
        
        {/* HTML5 CANVAS VIEWPORT */}
        <canvas 
          ref={canvasRef} 
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT}
          className="w-full h-full object-cover"
        />

        {/* --- IN-GAME PLAYING HUD (POINTER EVENTS NONE) --- */}
        {gameState === 'PLAYING' && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6">
            
            {/* Top Status Cluster */}
            <div className="flex items-center justify-between bg-stone-900/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-amber-500/30 shadow-lg">
              
              {/* Water Gauge */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
                  <Droplets className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between text-xs font-bold text-sky-200 mb-1">
                    <span>SISA AIR (BUCKET)</span>
                    <span className="text-sky-400 font-mono text-sm">{waterLevel}%</span>
                  </div>
                  <div className="w-36 md:w-48 h-3 bg-stone-800 rounded-full overflow-hidden p-0.5 border border-sky-500/30">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        waterLevel > 50 ? 'bg-sky-500' : waterLevel > 25 ? 'bg-amber-500' : 'bg-red-500 animate-ping'
                      }`}
                      style={{ width: `${waterLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Distance Progress */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Perjalanan Ke Desa</span>
                <span className="text-amber-400 font-mono font-bold text-sm">{distance}%</span>
              </div>

              {/* Shade / Sun Status */}
              <div className="flex items-center gap-2">
                {inShade ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-bold">
                    <Shield className="w-4 h-4" /> TEDUH (Pohon Lontar)
                  </div>
                ) : (
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                    sunHeatWarning ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    <Sun className="w-4 h-4" /> {sunHeatWarning ? 'PANAS EKSTRIM (-EVAP)' : 'TERIK MATAHARI'}
                  </div>
                )}
              </div>

              {/* Pause Button */}
              <button 
                onClick={() => setGameState('PAUSED')}
                className="pointer-events-auto p-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition border border-stone-700"
                title="Jeda (Esc)"
              >
                <Pause className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Virtual Touch HUD (Always accessible for touch or click) */}
            <div className="flex items-center justify-between w-full pointer-events-auto mt-auto">
              
              {/* D-Pad Left / Right */}
              <div className="flex items-center gap-3 bg-stone-900/60 backdrop-blur-md p-2 rounded-2xl border border-stone-800">
                <button
                  onMouseDown={() => gameRef.current.touchControls.left = true}
                  onMouseUp={() => gameRef.current.touchControls.left = false}
                  onTouchStart={() => gameRef.current.touchControls.left = true}
                  onTouchEnd={() => gameRef.current.touchControls.left = false}
                  className="w-14 h-14 bg-stone-800 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-md transition"
                >
                  <ArrowLeft className="w-7 h-7" />
                </button>
                <button
                  onMouseDown={() => gameRef.current.touchControls.right = true}
                  onMouseUp={() => gameRef.current.touchControls.right = false}
                  onTouchStart={() => gameRef.current.touchControls.right = true}
                  onTouchEnd={() => gameRef.current.touchControls.right = false}
                  className="w-14 h-14 bg-stone-800 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-md transition"
                >
                  <ArrowRight className="w-7 h-7" />
                </button>
              </div>

              {/* Action Buttons: Jump & Shade (Teduh) */}
              <div className="flex items-center gap-3 bg-stone-900/60 backdrop-blur-md p-2 rounded-2xl border border-stone-800">
                <button
                  onMouseDown={() => gameRef.current.touchControls.crouch = true}
                  onMouseUp={() => gameRef.current.touchControls.crouch = false}
                  onTouchStart={() => gameRef.current.touchControls.crouch = true}
                  onTouchEnd={() => gameRef.current.touchControls.crouch = false}
                  className={`px-4 h-14 rounded-xl flex items-center gap-2 font-bold text-sm shadow-md transition ${
                    inShade ? 'bg-emerald-600 text-white animate-bounce' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  <Shield className="w-5 h-5" /> TEDUH
                </button>
                <button
                  onMouseDown={() => gameRef.current.touchControls.jump = true}
                  onMouseUp={() => gameRef.current.touchControls.jump = false}
                  onTouchStart={() => gameRef.current.touchControls.jump = true}
                  onTouchEnd={() => gameRef.current.touchControls.jump = false}
                  className="w-20 h-14 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-xl flex items-center justify-center font-bold tracking-wider shadow-lg transition"
                >
                  LOMPAT
                </button>
              </div>

            </div>

          </div>
        )}

        {/* --- TITLE SCREEN --- */}
        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-950 via-amber-950/80 to-stone-900 flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
            
            <div className="relative z-10 flex flex-col items-center max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold mb-4 tracking-widest uppercase">
                OTN 2026 • Olimpiade TIK Nasional
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg mb-3">
                TETES TIMOR <span className="text-amber-500 block text-2xl md:text-3xl mt-1">Penjaga Air Karst</span>
              </h1>
              
              <p className="text-stone-300 text-sm md:text-base max-w-lg mb-8 leading-relaxed">
                Bantu Riri membawa seember air segar dari Gua Karst melewati teriknya savana Kupang menuju desa, memanfaatkan Pohon Lontar sebagai tempat berteduh.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={startGame}
                  className="flex items-center gap-2 px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-xl hover:scale-105 transition-all text-lg"
                >
                  <Play className="w-5 h-5 fill-current" /> Mulai Petualangan
                </button>
                <button
                  onClick={() => setGameState('ENCYCLOPEDIA')}
                  className="flex items-center gap-2 px-6 py-4 bg-stone-800 hover:bg-stone-700 text-amber-400 border border-amber-600/30 font-bold rounded-xl shadow-lg transition-all"
                >
                  <BookOpen className="w-5 h-5" /> Ensiklopedi Karst
                </button>
                <button
                  onClick={() => setGameState('HOWTO')}
                  className="flex items-center gap-2 px-6 py-4 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold rounded-xl shadow-lg transition-all"
                >
                  <HelpCircle className="w-5 h-5" /> Cara Bermain
                </button>
              </div>

              {/* Sound Toggle */}
              <button
                onClick={() => {
                  sound.enabled = !isSoundOn;
                  setIsSoundOn(!isSoundOn);
                }}
                className="absolute top-6 right-6 p-3 bg-stone-800/80 hover:bg-stone-700 text-stone-300 rounded-xl border border-stone-700 transition"
                title="Suara"
              >
                {isSoundOn ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5 text-red-400" />}
              </button>
            </div>
          </div>
        )}

        {/* --- PAUSE MODAL --- */}
        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="bg-stone-900 border border-amber-600/40 p-8 rounded-2xl shadow-2xl max-w-md w-full flex flex-col items-center">
              <h2 className="text-2xl font-black text-amber-500 mb-6">PERMAINAN DIJEDA</h2>
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => setGameState('PLAYING')}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 font-bold rounded-xl transition shadow-md"
                >
                  Lanjutkan
                </button>
                <button
                  onClick={startGame}
                  className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl transition border border-stone-700"
                >
                  Mulai Ulang (R)
                </button>
                <button
                  onClick={() => setGameState('MENU')}
                  className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-red-400 font-bold rounded-xl transition border border-stone-700"
                >
                  Keluar ke Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- VICTORY MODAL --- */}
        {gameState === 'VICTORY' && (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-stone-950/90 to-stone-900 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="bg-stone-900 border border-emerald-500/40 p-8 rounded-2xl shadow-2xl max-w-md w-full flex flex-col items-center">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-full mb-3">
                <Award className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-emerald-400 mb-1">SELAMAT!</h2>
              <p className="text-stone-300 text-sm mb-4">Riri berhasil membawa air ke Desa Karst!</p>

              {/* Star Rating */}
              <div className="flex gap-2 mb-6">
                {[1, 2, 3].map(s => (
                  <span key={s} className={`text-3xl ${s <= starRating ? 'text-amber-400 scale-110' : 'text-stone-700'} transition-transform`}>
                    ★
                  </span>
                ))}
              </div>

              <div className="bg-stone-800/80 p-4 rounded-xl border border-stone-700 w-full mb-6 text-left">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-stone-400">Sisa Air Ember:</span>
                  <span className="text-sky-400 font-bold">{waterLevel}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400">Predikat:</span>
                  <span className="text-amber-400 font-bold">
                    {starRating === 3 ? 'Pahlawan Mata Air Timor!' : starRating === 2 ? 'Penjaga Air Bijak' : 'Berhasil Melewati Kemarau'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={startGame}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Main Lagi
                </button>
                <button
                  onClick={() => setGameState('MENU')}
                  className="px-5 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl transition border border-stone-700 flex items-center justify-center"
                >
                  <Home className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- GAME OVER MODAL --- */}
        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/90 via-stone-950/90 to-stone-900 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="bg-stone-900 border border-red-500/40 p-8 rounded-2xl shadow-2xl max-w-md w-full flex flex-col items-center">
              <div className="p-3 bg-red-500/20 text-red-400 rounded-full mb-3">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-red-400 mb-2">AIR HABIS!</h2>
              <p className="text-stone-300 text-sm italic mb-6 leading-relaxed">
                "Air telah mengering di tengah sabana... Ayo jaga setiap tetes air, Timor butuh kita!"
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={startGame}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Coba Lagi (R)
                </button>
                <button
                  onClick={() => setGameState('MENU')}
                  className="px-5 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl transition border border-stone-700 flex items-center justify-center"
                >
                  <Home className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- ENCYCLOPEDIA MODAL --- */}
        {gameState === 'ENCYCLOPEDIA' && (
          <div className="absolute inset-0 bg-stone-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30 overflow-y-auto">
            <div className="bg-stone-900 border border-amber-600/40 p-6 md:p-8 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-800">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-amber-500" />
                  <h2 className="text-2xl font-black text-amber-500">Ensiklopedi Karst & Air</h2>
                </div>
                <button 
                  onClick={() => setGameState('MENU')}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-bold text-sm transition"
                >
                  Kembali
                </button>
              </div>

              <div className="space-y-4 text-stone-300 text-left text-sm max-h-[60vh] overflow-y-auto pr-2">
                <div className="bg-stone-800/60 p-4 rounded-xl border border-stone-700">
                  <h3 className="font-bold text-amber-400 mb-1">1. Mengapa Kupang & Pulau Timor Sering Kekeringan?</h3>
                  <p className="leading-relaxed">
                    Topografi Pulau Timor didominasi oleh batuan karst (gamping/limestone) yang berpori. Air hujan yang turun cepat meresap ke dalam celah bawah tanah, menyebabkan permukaan tanah cepat kering saat musim kemarau panjang.
                  </p>
                </div>

                <div className="bg-stone-800/60 p-4 rounded-xl border border-stone-700">
                  <h3 className="font-bold text-emerald-400 mb-1">2. Peran Pohon Lontar (Borassus flabellifer)</h3>
                  <p className="leading-relaxed">
                    Dikenal sebagai "Pohon Kehidupan" di NTT. Pohon Lontar tidak hanya menyediakan nira dan pelindung terik matahari, tetapi akarnya yang dalam membantu menahan cadangan air tanah dan memberikan ketahanan ekologis bagi masyarakat pedesaan.
                  </p>
                </div>

                <div className="bg-stone-800/60 p-4 rounded-xl border border-stone-700">
                  <h3 className="font-bold text-sky-400 mb-1">3. Inovasi Konservasi Air (Embun & PAH)</h3>
                  <p className="leading-relaxed">
                    Pemanfaatan embun pagi dan sistem Penampung Air Hujan (PAH) menjadi kunci kelangsungan hidup masyarakat Timor saat kemarau, mengajarkan pentingnya menghargai setiap tetes air.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- HOW TO PLAY MODAL --- */}
        {gameState === 'HOWTO' && (
          <div className="absolute inset-0 bg-stone-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30 overflow-y-auto">
            <div className="bg-stone-900 border border-stone-700 p-6 md:p-8 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-800">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-6 h-6 text-amber-500" />
                  <h2 className="text-2xl font-black text-amber-500">Cara Bermain</h2>
                </div>
                <button 
                  onClick={() => setGameState('MENU')}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-bold text-sm transition"
                >
                  Kembali
                </button>
              </div>

              <div className="space-y-4 text-stone-300 text-left text-sm">
                <div className="flex gap-3 items-start bg-stone-800/60 p-3 rounded-xl">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg"><ArrowRight className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-bold text-white">Gerak & Lompat</h4>
                    <p className="text-xs text-stone-400">Gunakan tombol Panah / WASD untuk berjalan, Spasi / Atas untuk melompat melewati batu karst.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start bg-stone-800/60 p-3 rounded-xl">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><Shield className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-bold text-white">Berteduh di Bawah Lontar</h4>
                    <p className="text-xs text-stone-400">Berdiri atau tekan tombol S / Bawah di bawah Pohon Lontar untuk menghentikan penguapan air dan mendinginkan ember.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start bg-stone-800/60 p-3 rounded-xl">
                  <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg"><Droplets className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-bold text-white">Kumpulkan Embun</h4>
                    <p className="text-xs text-stone-400">Sentuh tetesan embun pagi dan kupu-kupu air di udara untuk menambah persediaan air di ember.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
