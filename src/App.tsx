/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameHUD } from './components/GameHUD';
import { soundManager } from './utils/audio';
import {
  GameMode,
  Player,
  Bullet,
  Enemy,
  Particle,
  Shockwave,
  PowerUp,
  FloatingText,
  Star,
  GameStats,
  EnemyType,
  PowerUpType
} from './types/game';

const HIGH_SCORE_KEY = 'neon_strike_high_score';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // React state for HUD overlays
  const [gameMode, setGameMode] = useState<GameMode>('START');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    kills: 0,
    survivalTime: 0,
    shotsFired: 0,
    shotsHit: 0,
    combo: 1,
    comboTimer: 0,
    wave: 1
  });
  const [playerState, setPlayerState] = useState<Player | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // Mutable Game Engine references (avoids React re-render overhead inside 60FPS loop)
  const engineRef = useRef<{
    mode: GameMode;
    player: Player;
    bullets: Bullet[];
    enemies: Enemy[];
    particles: Particle[];
    shockwaves: Shockwave[];
    powerUps: PowerUp[];
    floatingTexts: FloatingText[];
    stars: Star[];
    keys: { [key: string]: boolean };
    mouse: { x: number; y: number; isDown: boolean };
    lastTime: number;
    spawnTimer: number;
    spawnInterval: number;
    stats: GameStats;
    shake: number;
    lastMuzzleAngle: number;
  }>({
    mode: 'START',
    player: {
      x: window.innerWidth / 2 || 500,
      y: window.innerHeight / 2 || 400,
      vx: 0,
      vy: 0,
      radius: 18,
      angle: 0,
      health: 100,
      maxHealth: 100,
      speed: 360, // px per sec
      invulnerableTimer: 0,
      muzzleFlashTimer: 0,
      fireCooldown: 0,
      shieldTimer: 0,
      rapidFireTimer: 0,
      tripleShotTimer: 0,
      bombs: 1
    },
    bullets: [],
    enemies: [],
    particles: [],
    shockwaves: [],
    powerUps: [],
    floatingTexts: [],
    stars: [],
    keys: {},
    mouse: { x: 0, y: 0, isDown: false },
    lastTime: 0,
    spawnTimer: 0,
    spawnInterval: 1.8,
    stats: {
      score: 0,
      highScore: 0,
      kills: 0,
      survivalTime: 0,
      shotsFired: 0,
      shotsHit: 0,
      combo: 1,
      comboTimer: 0,
      wave: 1
    },
    shake: 0,
    lastMuzzleAngle: 0
  });

  // Load high score on mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem(HIGH_SCORE_KEY);
    const initialHighScore = savedHighScore ? parseInt(savedHighScore, 10) || 0 : 0;
    engineRef.current.stats.highScore = initialHighScore;
    setStats(prev => ({ ...prev, highScore: initialHighScore }));

    // Generate background stars
    const stars: Star[] = [];
    const count = 120;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 25 + 10
      });
    }
    engineRef.current.stars = stars;
  }, []);

  // Sync React gameMode with engine
  const setMode = useCallback((mode: GameMode) => {
    engineRef.current.mode = mode;
    setGameMode(mode);
  }, []);

  // Trigger Smart Bomb
  const handleTriggerBomb = useCallback(() => {
    const engine = engineRef.current;
    if (engine.mode !== 'PLAYING' || engine.player.bombs <= 0) return;

    engine.player.bombs--;
    soundManager.playBomb();
    engine.shake = 18;

    // Create massive shockwave
    engine.shockwaves.push({
      x: engine.player.x,
      y: engine.player.y,
      radius: 10,
      maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.9,
      color: '#f43f5e',
      alpha: 1,
      speed: 1200
    });

    // Wipe out enemies
    let points = 0;
    engine.enemies.forEach(enemy => {
      points += enemy.scoreValue * engine.stats.combo;
      engine.stats.kills++;
      engine.stats.shotsHit++;

      // Create explosion particles
      for (let p = 0; p < 18; p++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 260 + 50;
        engine.particles.push({
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          size: Math.random() * 4 + 2,
          color: enemy.color,
          alpha: 1,
          decay: Math.random() * 1.5 + 1.2
        });
      }
    });

    engine.enemies = [];
    engine.stats.score += points;

    engine.floatingTexts.push({
      id: Math.random().toString(),
      x: engine.player.x,
      y: engine.player.y - 40,
      text: '★ EMP NOVA DETONATED! ★',
      color: '#f43f5e',
      alpha: 1,
      vy: -60,
      size: 20
    });
  }, []);

  // Start new game
  const handleStartGame = useCallback(() => {
    const canvas = canvasRef.current;
    const w = canvas ? canvas.width : window.innerWidth;
    const h = canvas ? canvas.height : window.innerHeight;

    const savedHighScore = localStorage.getItem(HIGH_SCORE_KEY);
    const highScore = savedHighScore ? parseInt(savedHighScore, 10) || 0 : 0;

    engineRef.current.player = {
      x: w / 2,
      y: h / 2,
      vx: 0,
      vy: 0,
      radius: 18,
      angle: 0,
      health: 100,
      maxHealth: 100,
      speed: 360,
      invulnerableTimer: 0.5,
      muzzleFlashTimer: 0,
      fireCooldown: 0,
      shieldTimer: 0,
      rapidFireTimer: 0,
      tripleShotTimer: 0,
      bombs: 1
    };

    engineRef.current.bullets = [];
    engineRef.current.enemies = [];
    engineRef.current.particles = [];
    engineRef.current.shockwaves = [];
    engineRef.current.powerUps = [];
    engineRef.current.floatingTexts = [];
    engineRef.current.spawnTimer = 0;
    engineRef.current.spawnInterval = 1.6;
    engineRef.current.shake = 0;

    engineRef.current.stats = {
      score: 0,
      highScore: highScore,
      kills: 0,
      survivalTime: 0,
      shotsFired: 0,
      shotsHit: 0,
      combo: 1,
      comboTimer: 0,
      wave: 1
    };

    setIsNewRecord(false);
    setMode('PLAYING');
  }, [setMode]);

  const handlePauseGame = useCallback(() => {
    if (engineRef.current.mode === 'PLAYING') {
      setMode('PAUSED');
    }
  }, [setMode]);

  const handleResumeGame = useCallback(() => {
    if (engineRef.current.mode === 'PAUSED') {
      engineRef.current.lastTime = performance.now();
      setMode('PLAYING');
    }
  }, [setMode]);

  const handleToggleMute = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  // Main Canvas Game Loop & Event Listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI resize
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Keyboard listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      engineRef.current.keys[e.code] = true;

      // Quick pause toggle
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (engineRef.current.mode === 'PLAYING') {
          setMode('PAUSED');
        } else if (engineRef.current.mode === 'PAUSED') {
          engineRef.current.lastTime = performance.now();
          setMode('PLAYING');
        }
      }

      // Space or B for bomb
      if (e.code === 'Space' || e.code === 'KeyB') {
        handleTriggerBomb();
      }

      // Enter to restart on gameover
      if (e.code === 'Enter' && engineRef.current.mode === 'GAMEOVER') {
        handleStartGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engineRef.current.keys[e.code] = false;
    };

    // Mouse listeners
    const handleMouseMove = (e: MouseEvent) => {
      engineRef.current.mouse.x = e.clientX;
      engineRef.current.mouse.y = e.clientY;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        engineRef.current.mouse.isDown = true;
        engineRef.current.mouse.x = e.clientX;
        engineRef.current.mouse.y = e.clientY;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        engineRef.current.mouse.isDown = false;
      }
    };

    // Touch controls support for mobile / touchpads
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        engineRef.current.mouse.x = touch.clientX;
        engineRef.current.mouse.y = touch.clientY;
        engineRef.current.mouse.isDown = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        engineRef.current.mouse.x = touch.clientX;
        engineRef.current.mouse.y = touch.clientY;
      }
    };

    const handleTouchEnd = () => {
      engineRef.current.mouse.isDown = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    // Spawn Enemy helper
    const spawnEnemy = (w: number, h: number) => {
      const engine = engineRef.current;
      // Determine enemy type based on current wave & random rolls
      const wave = engine.stats.wave;
      let type: EnemyType = 'scout';
      const roll = Math.random();

      if (wave >= 3 && roll < 0.2) {
        type = 'stalker';
      } else if (wave >= 2 && roll < 0.45) {
        type = 'brute';
      } else if (roll < 0.75) {
        type = 'chaser';
      } else {
        type = 'scout';
      }

      // Spawn off-screen perimeter
      const side = Math.floor(Math.random() * 4);
      let x = 0;
      let y = 0;
      const buffer = 40;

      switch (side) {
        case 0: // Top
          x = Math.random() * w;
          y = -buffer;
          break;
        case 1: // Right
          x = w + buffer;
          y = Math.random() * h;
          break;
        case 2: // Bottom
          x = Math.random() * w;
          y = h + buffer;
          break;
        case 3: // Left
          x = -buffer;
          y = Math.random() * h;
          break;
      }

      // Configure enemy attributes
      let radius = 14;
      let hp = 1;
      let speed = 140 + wave * 8;
      let color = '#ef4444';
      let scoreVal = 100;

      if (type === 'scout') {
        radius = 12;
        hp = 1;
        speed = 210 + wave * 10;
        color = '#f97316'; // Orange
        scoreVal = 80;
      } else if (type === 'chaser') {
        radius = 16;
        hp = 3;
        speed = 135 + wave * 7;
        color = '#ec4899'; // Pink/crimson
        scoreVal = 150;
      } else if (type === 'brute') {
        radius = 24;
        hp = 8 + Math.floor(wave * 1.5);
        speed = 85 + wave * 4;
        color = '#06b6d4'; // Cyan heavy tank
        scoreVal = 350;
      } else if (type === 'stalker') {
        radius = 15;
        hp = 2;
        speed = 280 + wave * 12;
        color = '#a855f7'; // Purple phantom
        scoreVal = 220;
      }

      engine.enemies.push({
        id: Math.random().toString(),
        x,
        y,
        vx: 0,
        vy: 0,
        radius,
        hp,
        maxHp: hp,
        speed,
        type,
        color,
        scoreValue: scoreVal,
        hitFlashTimer: 0,
        pulsePhase: Math.random() * Math.PI * 2
      });
    };

    // Helper: Spawn PowerUp Drop
    const spawnPowerUp = (x: number, y: number, forceType?: PowerUpType) => {
      const types: PowerUpType[] = ['triple', 'shield', 'bomb', 'heal', 'rapid'];
      const chosenType = forceType || types[Math.floor(Math.random() * types.length)];

      engineRef.current.powerUps.push({
        id: Math.random().toString(),
        x,
        y,
        type: chosenType,
        radius: 14,
        duration: chosenType === 'heal' ? 0 : chosenType === 'bomb' ? 0 : 8,
        life: 14,
        angle: 0
      });
    };

    let animationFrameId: number;

    // ==========================================
    // MAIN GAME LOOP (requestAnimationFrame)
    // ==========================================
    const loop = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(loop);

      const engine = engineRef.current;
      if (!engine.lastTime) {
        engine.lastTime = currentTime;
      }
      const dt = Math.min((currentTime - engine.lastTime) / 1000, 0.1); // clamp delta
      engine.lastTime = currentTime;

      const w = window.innerWidth;
      const h = window.innerHeight;

      // ----------------------------------------
      // UPDATE SIMULATION
      // ----------------------------------------
      if (engine.mode === 'PLAYING') {
        engine.stats.survivalTime += dt;
        engine.stats.wave = 1 + Math.floor(engine.stats.survivalTime / 20);

        // Player Movement (WASD / Arrows)
        let moveX = 0;
        let moveY = 0;
        if (engine.keys['KeyW'] || engine.keys['ArrowUp']) moveY -= 1;
        if (engine.keys['KeyS'] || engine.keys['ArrowDown']) moveY += 1;
        if (engine.keys['KeyA'] || engine.keys['ArrowLeft']) moveX -= 1;
        if (engine.keys['KeyD'] || engine.keys['ArrowRight']) moveX += 1;

        if (moveX !== 0 && moveY !== 0) {
          const invSqrt2 = 0.707106;
          moveX *= invSqrt2;
          moveY *= invSqrt2;
        }

        const targetVx = moveX * engine.player.speed;
        const targetVy = moveY * engine.player.speed;

        // Smooth acceleration & inertia
        engine.player.vx += (targetVx - engine.player.vx) * Math.min(dt * 15, 1);
        engine.player.vy += (targetVy - engine.player.vy) * Math.min(dt * 15, 1);

        engine.player.x += engine.player.vx * dt;
        engine.player.y += engine.player.vy * dt;

        // Clamp inside arena bounds
        const pad = engine.player.radius + 6;
        engine.player.x = Math.max(pad, Math.min(w - pad, engine.player.x));
        engine.player.y = Math.max(pad, Math.min(h - pad, engine.player.y));

        // Aiming angle towards mouse
        const dx = engine.mouse.x - engine.player.x;
        const dy = engine.mouse.y - engine.player.y;
        engine.player.angle = Math.atan2(dy, dx);

        // Thruster exhaust particles when moving
        const currentSpeed = Math.hypot(engine.player.vx, engine.player.vy);
        if (currentSpeed > 30) {
          const rearAngle = engine.player.angle + Math.PI + (Math.random() - 0.5) * 0.4;
          const thrustSpeed = Math.random() * 90 + 50;
          engine.particles.push({
            x: engine.player.x - Math.cos(engine.player.angle) * 16,
            y: engine.player.y - Math.sin(engine.player.angle) * 16,
            vx: Math.cos(rearAngle) * thrustSpeed + engine.player.vx * 0.2,
            vy: Math.sin(rearAngle) * thrustSpeed + engine.player.vy * 0.2,
            size: Math.random() * 3 + 2,
            color: Math.random() > 0.4 ? '#38bdf8' : '#818cf8',
            alpha: 0.9,
            decay: 3.5,
            shape: 'circle'
          });
        }

        // Timers tick down
        if (engine.player.invulnerableTimer > 0) engine.player.invulnerableTimer -= dt;
        if (engine.player.muzzleFlashTimer > 0) engine.player.muzzleFlashTimer -= dt;
        if (engine.player.shieldTimer > 0) engine.player.shieldTimer = Math.max(0, engine.player.shieldTimer - dt);
        if (engine.player.rapidFireTimer > 0) engine.player.rapidFireTimer = Math.max(0, engine.player.rapidFireTimer - dt);
        if (engine.player.tripleShotTimer > 0) engine.player.tripleShotTimer = Math.max(0, engine.player.tripleShotTimer - dt);

        // Combo timer tick down
        if (engine.stats.combo > 1) {
          engine.stats.comboTimer -= dt;
          if (engine.stats.comboTimer <= 0) {
            engine.stats.combo = 1;
          }
        }

        // Weapons Firing
        const fireInterval = engine.player.rapidFireTimer > 0 ? 0.08 : 0.16;
        if (engine.player.fireCooldown > 0) {
          engine.player.fireCooldown -= dt;
        }

        if (engine.mouse.isDown && engine.player.fireCooldown <= 0) {
          engine.player.fireCooldown = fireInterval;
          engine.player.muzzleFlashTimer = 0.06;
          engine.lastMuzzleAngle = engine.player.angle;
          soundManager.playShoot();

          const bulletSpeed = 950;
          const bAngle = engine.player.angle;
          const spreadAngles = engine.player.tripleShotTimer > 0 ? [-0.18, 0, 0.18] : [0];

          spreadAngles.forEach(offsetAngle => {
            const finalAngle = bAngle + offsetAngle;
            // Gun offset from player center
            const spawnDist = engine.player.radius + 8;
            const spawnX = engine.player.x + Math.cos(finalAngle) * spawnDist;
            const spawnY = engine.player.y + Math.sin(finalAngle) * spawnDist;

            engine.bullets.push({
              x: spawnX,
              y: spawnY,
              vx: Math.cos(finalAngle) * bulletSpeed,
              vy: Math.sin(finalAngle) * bulletSpeed,
              radius: engine.player.tripleShotTimer > 0 ? 3.5 : 4,
              color: engine.player.rapidFireTimer > 0 ? '#f43f5e' : '#38bdf8',
              damage: 1,
              life: 1.2,
              maxLife: 1.2
            });
            engine.stats.shotsFired++;
          });
        }

        // Enemy Spawner with dynamic difficulty
        engine.spawnInterval = Math.max(0.35, 1.7 - engine.stats.survivalTime * 0.015);
        engine.spawnTimer += dt;
        if (engine.spawnTimer >= engine.spawnInterval) {
          engine.spawnTimer = 0;
          spawnEnemy(w, h);
          // Chance for double spawn in higher waves
          if (engine.stats.wave >= 4 && Math.random() < 0.4) {
            spawnEnemy(w, h);
          }
        }

        // Update Bullets
        for (let i = engine.bullets.length - 1; i >= 0; i--) {
          const b = engine.bullets[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.life -= dt;

          // Out of screen or lifetime expired
          if (
            b.life <= 0 ||
            b.x < -20 ||
            b.x > w + 20 ||
            b.y < -20 ||
            b.y > h + 20
          ) {
            engine.bullets.splice(i, 1);
            continue;
          }

          // Bullet vs Enemy Collision
          let bulletDestroyed = false;
          for (let j = engine.enemies.length - 1; j >= 0; j--) {
            const enemy = engine.enemies[j];
            const dist = Math.hypot(enemy.x - b.x, enemy.y - b.y);

            if (dist < enemy.radius + b.radius) {
              bulletDestroyed = true;
              engine.stats.shotsHit++;
              enemy.hp -= b.damage;
              enemy.hitFlashTimer = 0.08;
              soundManager.playHit();

              // Hit spark particles
              for (let k = 0; k < 5; k++) {
                const sparkAngle = Math.atan2(b.vy, b.vx) + Math.PI + (Math.random() - 0.5) * 1.2;
                const sparkSpeed = Math.random() * 180 + 40;
                engine.particles.push({
                  x: b.x,
                  y: b.y,
                  vx: Math.cos(sparkAngle) * sparkSpeed,
                  vy: Math.sin(sparkAngle) * sparkSpeed,
                  size: Math.random() * 3 + 1,
                  color: '#facc15',
                  alpha: 1,
                  decay: 3.5,
                  shape: 'spark'
                });
              }

              // Enemy Destroyed
              if (enemy.hp <= 0) {
                const isHeavy = enemy.type === 'brute';
                soundManager.playExplosion(isHeavy);
                engine.shake = isHeavy ? 12 : 5;

                // Score with combo multiplier
                const comboPoints = enemy.scoreValue * engine.stats.combo;
                engine.stats.score += comboPoints;
                engine.stats.kills++;

                // Elevate combo
                engine.stats.combo = Math.min(8, engine.stats.combo + 1);
                engine.stats.comboTimer = 2.8;

                // Floating text for points
                engine.floatingTexts.push({
                  id: Math.random().toString(),
                  x: enemy.x,
                  y: enemy.y - 12,
                  text: `+${comboPoints}${engine.stats.combo > 1 ? ` (x${engine.stats.combo})` : ''}`,
                  color: engine.stats.combo > 2 ? '#facc15' : '#e2e8f0',
                  alpha: 1,
                  vy: -40,
                  size: engine.stats.combo > 2 ? 16 : 13
                });

                // Spawn death particles
                const partCount = isHeavy ? 35 : 18;
                for (let p = 0; p < partCount; p++) {
                  const angle = Math.random() * Math.PI * 2;
                  const speed = Math.random() * (isHeavy ? 280 : 190) + 40;
                  engine.particles.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: Math.random() * (isHeavy ? 5 : 3.5) + 1.5,
                    color: enemy.color,
                    alpha: 1,
                    decay: Math.random() * 1.5 + 1.2,
                    shape: Math.random() > 0.5 ? 'spark' : 'circle'
                  });
                }

                // Chance to drop power-up (guaranteed on Brute, 14% on others)
                if (isHeavy || Math.random() < 0.14) {
                  spawnPowerUp(enemy.x, enemy.y);
                }

                // If Brute dies, spawn 2 mini scouts
                if (enemy.type === 'brute') {
                  for (let s = 0; s < 2; s++) {
                    const offset = (s === 0 ? -1 : 1) * 20;
                    engine.enemies.push({
                      id: Math.random().toString(),
                      x: enemy.x + offset,
                      y: enemy.y + offset,
                      vx: 0,
                      vy: 0,
                      radius: 11,
                      hp: 1,
                      maxHp: 1,
                      speed: 240,
                      type: 'scout',
                      color: '#f97316',
                      scoreValue: 70,
                      hitFlashTimer: 0,
                      pulsePhase: Math.random() * Math.PI * 2
                    });
                  }
                }

                engine.enemies.splice(j, 1);
              }
              break;
            }
          }

          if (bulletDestroyed) {
            engine.bullets.splice(i, 1);
          }
        }

        // Update Enemies
        for (let i = engine.enemies.length - 1; i >= 0; i--) {
          const enemy = engine.enemies[i];
          enemy.pulsePhase += dt * 4;
          if (enemy.hitFlashTimer > 0) enemy.hitFlashTimer -= dt;

          // Direct vector toward player
          const toPlayerX = engine.player.x - enemy.x;
          const toPlayerY = engine.player.y - enemy.y;
          const distToPlayer = Math.hypot(toPlayerX, toPlayerY) || 1;

          let targetVx = (toPlayerX / distToPlayer) * enemy.speed;
          let targetVy = (toPlayerY / distToPlayer) * enemy.speed;

          // Stalker pulsing dash behavior
          if (enemy.type === 'stalker') {
            const dashFactor = Math.sin(enemy.pulsePhase * 2) > 0.4 ? 1.6 : 0.6;
            targetVx *= dashFactor;
            targetVy *= dashFactor;
          }

          // Flocking / Soft avoidance among enemies
          for (let k = 0; k < engine.enemies.length; k++) {
            if (k === i) continue;
            const other = engine.enemies[k];
            const sepX = enemy.x - other.x;
            const sepY = enemy.y - other.y;
            const sepDist = Math.hypot(sepX, sepY);
            const minDist = enemy.radius + other.radius + 6;
            if (sepDist > 0 && sepDist < minDist) {
              const pushForce = (minDist - sepDist) * 3;
              targetVx += (sepX / sepDist) * pushForce;
              targetVy += (sepY / sepDist) * pushForce;
            }
          }

          enemy.vx += (targetVx - enemy.vx) * Math.min(dt * 8, 1);
          enemy.vy += (targetVy - enemy.vy) * Math.min(dt * 8, 1);
          enemy.x += enemy.vx * dt;
          enemy.y += enemy.vy * dt;

          // Enemy vs Player Collision Check
          if (engine.player.invulnerableTimer <= 0) {
            const hitDist = Math.hypot(enemy.x - engine.player.x, enemy.y - engine.player.y);
            if (hitDist < enemy.radius + engine.player.radius) {
              // Check if player has active shield
              if (engine.player.shieldTimer > 0) {
                // Shield absorbs blow and damages enemy
                soundManager.playHit();
                enemy.hp -= 2;
                engine.player.invulnerableTimer = 0.25;
                engine.shake = 4;
                engine.floatingTexts.push({
                  id: Math.random().toString(),
                  x: engine.player.x,
                  y: engine.player.y - 20,
                  text: 'SHIELD DEFLECTION!',
                  color: '#38bdf8',
                  alpha: 1,
                  vy: -40,
                  size: 14
                });
              } else {
                // Take damage
                const damageTaken = enemy.type === 'brute' ? 30 : enemy.type === 'chaser' ? 20 : 15;
                engine.player.health -= damageTaken;
                engine.player.invulnerableTimer = 0.8; // Invulnerability frames
                engine.shake = 10;
                soundManager.playPlayerHit();

                // Knockback player slightly
                const knockAngle = Math.atan2(engine.player.y - enemy.y, engine.player.x - enemy.x);
                engine.player.vx += Math.cos(knockAngle) * 320;
                engine.player.vy += Math.sin(knockAngle) * 320;

                // Player blood/spark effect
                for (let p = 0; p < 12; p++) {
                  const angle = Math.random() * Math.PI * 2;
                  const spd = Math.random() * 160 + 30;
                  engine.particles.push({
                    x: engine.player.x,
                    y: engine.player.y,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd,
                    size: Math.random() * 3 + 2,
                    color: '#f43f5e',
                    alpha: 1,
                    decay: 2.2,
                    shape: 'spark'
                  });
                }

                // Check Game Over
                if (engine.player.health <= 0) {
                  engine.player.health = 0;
                  soundManager.playGameOver();
                  engine.shake = 20;

                  // High Score check and persistence
                  const prevRecord = engine.stats.highScore;
                  if (engine.stats.score > prevRecord) {
                    localStorage.setItem(HIGH_SCORE_KEY, engine.stats.score.toString());
                    engine.stats.highScore = engine.stats.score;
                    setIsNewRecord(true);
                  } else {
                    setIsNewRecord(false);
                  }

                  setMode('GAMEOVER');
                  break;
                }
              }
            }
          }
        }

        // Update Power-ups
        for (let i = engine.powerUps.length - 1; i >= 0; i--) {
          const p = engine.powerUps[i];
          p.life -= dt;
          p.angle += dt * 2.5;

          // Magnetic attraction to player
          const distToPlayer = Math.hypot(engine.player.x - p.x, engine.player.y - p.y);
          if (distToPlayer < 90) {
            const pullSpeed = (1 - distToPlayer / 90) * 350;
            p.x += ((engine.player.x - p.x) / distToPlayer) * pullSpeed * dt;
            p.y += ((engine.player.y - p.y) / distToPlayer) * pullSpeed * dt;
          }

          // Collection check
          if (distToPlayer < engine.player.radius + p.radius) {
            soundManager.playPowerup();
            let label = '';
            let color = '#38bdf8';

            switch (p.type) {
              case 'triple':
                engine.player.tripleShotTimer = 10;
                label = 'TRIPLE SHOT ACTIVE!';
                color = '#f59e0b';
                break;
              case 'shield':
                engine.player.shieldTimer = 10;
                label = 'PLASMA SHIELD ONLINE!';
                color = '#06b6d4';
                break;
              case 'bomb':
                engine.player.bombs = Math.min(3, engine.player.bombs + 1);
                label = '+1 EMP NOVA BOMB!';
                color = '#f43f5e';
                break;
              case 'heal':
                engine.player.health = Math.min(engine.player.maxHealth, engine.player.health + 35);
                label = '+35 HULL REPAIRED!';
                color = '#10b981';
                break;
              case 'rapid':
                engine.player.rapidFireTimer = 9;
                label = 'RAPID OVERDRIVE!';
                color = '#ec4899';
                break;
            }

            engine.floatingTexts.push({
              id: Math.random().toString(),
              x: engine.player.x,
              y: engine.player.y - 25,
              text: label,
              color,
              alpha: 1,
              vy: -45,
              size: 15
            });

            // Sparkle pickup particles
            for (let k = 0; k < 12; k++) {
              const ang = Math.random() * Math.PI * 2;
              const sp = Math.random() * 140 + 30;
              engine.particles.push({
                x: p.x,
                y: p.y,
                vx: Math.cos(ang) * sp,
                vy: Math.sin(ang) * sp,
                size: Math.random() * 3 + 1.5,
                color,
                alpha: 1,
                decay: 2.2,
                shape: 'spark'
              });
            }

            engine.powerUps.splice(i, 1);
            continue;
          }

          if (p.life <= 0) {
            engine.powerUps.splice(i, 1);
          }
        }
      }

      // Update Particles (in all modes for ongoing effects)
      for (let i = engine.particles.length - 1; i >= 0; i--) {
        const pt = engine.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vx *= 0.94; // friction
        pt.vy *= 0.94;
        pt.alpha -= pt.decay * dt;

        if (pt.alpha <= 0) {
          engine.particles.splice(i, 1);
        }
      }

      // Update Shockwaves
      for (let i = engine.shockwaves.length - 1; i >= 0; i--) {
        const sw = engine.shockwaves[i];
        sw.radius += sw.speed * dt;
        sw.alpha = 1 - sw.radius / sw.maxRadius;
        if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
          engine.shockwaves.splice(i, 1);
        }
      }

      // Update Floating Texts
      for (let i = engine.floatingTexts.length - 1; i >= 0; i--) {
        const ft = engine.floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.alpha -= dt * 1.1;
        if (ft.alpha <= 0) {
          engine.floatingTexts.splice(i, 1);
        }
      }

      // Update Starfield parallax
      const pVx = engine.mode === 'PLAYING' ? engine.player.vx : 20;
      const pVy = engine.mode === 'PLAYING' ? engine.player.vy : 15;
      engine.stars.forEach(star => {
        star.x -= pVx * 0.05 * dt + star.speed * dt * 0.1;
        star.y -= pVy * 0.05 * dt + star.speed * dt * 0.1;
        if (star.x < 0) star.x = w;
        if (star.x > w) star.x = 0;
        if (star.y < 0) star.y = h;
        if (star.y > h) star.y = 0;
      });

      // Camera screen shake decay
      if (engine.shake > 0) {
        engine.shake = Math.max(0, engine.shake - dt * 25);
      }

      // ----------------------------------------
      // RENDER CANVAS
      // ----------------------------------------
      ctx.save();

      // Screen shake translation
      if (engine.shake > 0) {
        const sx = (Math.random() - 0.5) * engine.shake;
        const sy = (Math.random() - 0.5) * engine.shake;
        ctx.translate(sx, sy);
      }

      // Clear Screen with deep cosmic tint
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      // Draw Vector Grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      const offsetX = (w / 2 - engine.player.x * 0.2) % gridSize;
      const offsetY = (h / 2 - engine.player.y * 0.2) % gridSize;

      ctx.beginPath();
      for (let x = offsetX; x < w; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = offsetY; y < h; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Draw Stars
      engine.stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Shockwaves
      engine.shockwaves.forEach(sw => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 6 * sw.alpha;
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 18;
        ctx.globalAlpha = sw.alpha;
        ctx.stroke();
        ctx.restore();
      });

      // Draw Power-ups
      engine.powerUps.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        // Pulsing glow ring
        ctx.strokeStyle =
          p.type === 'shield'
            ? '#06b6d4'
            : p.type === 'triple'
            ? '#f59e0b'
            : p.type === 'bomb'
            ? '#f43f5e'
            : p.type === 'heal'
            ? '#10b981'
            : '#ec4899';
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2;

        // Outer hexagon
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const rad = (a * Math.PI) / 3;
          const px = Math.cos(rad) * p.radius;
          const py = Math.sin(rad) * p.radius;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Inner glowing core
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // Draw Bullets
      engine.bullets.forEach(b => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 12;
        ctx.fill();

        // Bullet motion tracer line
        const speed = Math.hypot(b.vx, b.vy);
        if (speed > 0) {
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x - (b.vx / speed) * 14, b.y - (b.vy / speed) * 14);
          ctx.strokeStyle = b.color;
          ctx.lineWidth = b.radius * 1.5;
          ctx.stroke();
        }
        ctx.restore();
      });

      // Draw Enemies
      engine.enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        const aimAngle = Math.atan2(engine.player.y - enemy.y, engine.player.x - enemy.x);
        ctx.rotate(aimAngle);

        const isHit = enemy.hitFlashTimer > 0;
        const color = isHit ? '#ffffff' : enemy.color;
        ctx.strokeStyle = color;
        ctx.fillStyle = isHit ? '#ffffff' : `${enemy.color}22`;
        ctx.shadowColor = color;
        ctx.shadowBlur = isHit ? 20 : 10;
        ctx.lineWidth = 2.2;

        if (enemy.type === 'scout') {
          // Sharp dart triangle
          ctx.beginPath();
          ctx.moveTo(enemy.radius * 1.3, 0);
          ctx.lineTo(-enemy.radius, -enemy.radius * 0.9);
          ctx.lineTo(-enemy.radius * 0.5, 0);
          ctx.lineTo(-enemy.radius, enemy.radius * 0.9);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (enemy.type === 'chaser') {
          // Octagon with center core
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const rad = (i * Math.PI) / 4 + enemy.pulsePhase;
            const px = Math.cos(rad) * enemy.radius;
            const py = Math.sin(rad) * enemy.radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Core eye
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        } else if (enemy.type === 'brute') {
          // Heavy armored polygon with segmented health ring
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const rad = (i * Math.PI) / 3;
            const px = Math.cos(rad) * enemy.radius;
            const py = Math.sin(rad) * enemy.radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Inner rotating gear
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const rad = (i * Math.PI) / 3 - enemy.pulsePhase;
            const px = Math.cos(rad) * (enemy.radius * 0.55);
            const py = Math.sin(rad) * (enemy.radius * 0.55);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();

          // Health bar above brute
          ctx.restore();
          ctx.save();
          ctx.translate(enemy.x, enemy.y);
          const hpWidth = 32;
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(-hpWidth / 2, -enemy.radius - 12, hpWidth, 4);
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(-hpWidth / 2, -enemy.radius - 12, (enemy.hp / enemy.maxHp) * hpWidth, 4);
          ctx.restore();
          ctx.save();
        } else if (enemy.type === 'stalker') {
          // Pulsing phantom arrow
          const alpha = 0.5 + Math.sin(enemy.pulsePhase * 3) * 0.45;
          ctx.globalAlpha = Math.max(0.2, alpha);
          ctx.beginPath();
          ctx.moveTo(enemy.radius * 1.5, 0);
          ctx.lineTo(-enemy.radius * 0.8, -enemy.radius);
          ctx.lineTo(0, 0);
          ctx.lineTo(-enemy.radius * 0.8, enemy.radius);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      });

      // Draw Player Ship (Only if active or start/pause)
      if (engine.mode !== 'GAMEOVER') {
        const p = engine.player;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        // Invulnerability blinking
        if (p.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
          ctx.globalAlpha = 0.3;
        }

        // Plasma Shield Sphere
        if (p.shieldTimer > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, p.radius + 12, 0, Math.PI * 2);
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 18;
          ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
          ctx.fill();
          ctx.stroke();

          // Hex shield segments
          ctx.beginPath();
          for (let s = 0; s < 6; s++) {
            const rad = (s * Math.PI) / 3 + Date.now() * 0.002;
            ctx.moveTo(Math.cos(rad) * (p.radius + 6), Math.sin(rad) * (p.radius + 6));
            ctx.lineTo(Math.cos(rad) * (p.radius + 12), Math.sin(rad) * (p.radius + 12));
          }
          ctx.stroke();
          ctx.restore();
        }

        // Draw Player Fighter Craft
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#38bdf8';
        ctx.fillStyle = '#0f172a';

        // Ship hull
        ctx.beginPath();
        ctx.moveTo(p.radius * 1.3, 0); // nose tip
        ctx.lineTo(-p.radius, -p.radius * 0.9); // left wingtip
        ctx.lineTo(-p.radius * 0.4, -p.radius * 0.3); // left inner
        ctx.lineTo(-p.radius * 0.7, 0); // engine thruster
        ctx.lineTo(-p.radius * 0.4, p.radius * 0.3); // right inner
        ctx.lineTo(-p.radius, p.radius * 0.9); // right wingtip
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit canopy glow
        ctx.beginPath();
        ctx.ellipse(p.radius * 0.2, 0, p.radius * 0.4, p.radius * 0.22, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#67e8f9';
        ctx.fill();

        // Wing cannons
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.radius * 0.2, -p.radius * 0.65);
        ctx.lineTo(p.radius * 0.9, -p.radius * 0.65);
        ctx.moveTo(p.radius * 0.2, p.radius * 0.65);
        ctx.lineTo(p.radius * 0.9, p.radius * 0.65);
        ctx.stroke();

        // Muzzle Flash
        if (p.muzzleFlashTimer > 0) {
          ctx.save();
          ctx.fillStyle = '#fef08a';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 18;
          [-p.radius * 0.65, p.radius * 0.65].forEach(offsetY => {
            ctx.beginPath();
            ctx.arc(p.radius * 1.1, offsetY, 5, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.restore();
        }

        ctx.restore();
      }

      // Draw Particles
      engine.particles.forEach(pt => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 8;

        if (pt.shape === 'spark') {
          const speed = Math.hypot(pt.vx, pt.vy);
          if (speed > 10) {
            ctx.strokeStyle = pt.color;
            ctx.lineWidth = pt.size;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(pt.x - (pt.vx / speed) * 8, pt.y - (pt.vy / speed) * 8);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Draw Floating Texts
      engine.floatingTexts.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 10;
        ctx.font = `bold ${ft.size}px 'Chakra Petch', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // Aim Reticle at mouse location (during gameplay)
      if (engine.mode === 'PLAYING') {
        const mx = engine.mouse.x;
        const my = engine.mouse.y;
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mx, my, 12, 0, Math.PI * 2);
        ctx.moveTo(mx - 18, my);
        ctx.lineTo(mx - 6, my);
        ctx.moveTo(mx + 6, my);
        ctx.lineTo(mx + 18, my);
        ctx.moveTo(mx, my - 18);
        ctx.lineTo(mx, my - 6);
        ctx.moveTo(mx, my + 6);
        ctx.lineTo(mx, my + 18);
        ctx.stroke();

        // Central crosshair dot
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();

      // Synchronize stats & player state to React state periodically (~10-15 fps to avoid React thrashing)
      if (Math.random() < 0.25 || engine.mode !== 'PLAYING') {
        setStats({ ...engine.stats });
        setPlayerState({ ...engine.player });
      }
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleStartGame, handleTriggerBomb, setMode]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans cursor-crosshair">
      {/* HTML5 Canvas Rendering Surface */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full"
      />

      {/* Retro Scanlines & Vignette Shaders */}
      <div className="absolute inset-0 scanlines pointer-events-none" />
      <div className="absolute inset-0 vignette pointer-events-none" />

      {/* React HUD / UI Layer */}
      <GameHUD
        gameMode={gameMode}
        stats={stats}
        player={playerState}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onStartGame={handleStartGame}
        onPauseGame={handlePauseGame}
        onResumeGame={handleResumeGame}
        onRestartGame={handleStartGame}
        onTriggerBomb={handleTriggerBomb}
        isNewRecord={isNewRecord}
      />
    </div>
  );
}
