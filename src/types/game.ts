export type GameMode = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type EnemyType = 'scout' | 'chaser' | 'brute' | 'stalker';

export type PowerUpType = 'triple' | 'shield' | 'bomb' | 'heal' | 'rapid';

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  health: number;
  maxHealth: number;
  speed: number;
  invulnerableTimer: number;
  muzzleFlashTimer: number;
  fireCooldown: number;
  shieldTimer: number;
  rapidFireTimer: number;
  tripleShotTimer: number;
  bombs: number;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  damage: number;
  life: number;
  maxLife: number;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  type: EnemyType;
  color: string;
  scoreValue: number;
  hitFlashTimer: number;
  pulsePhase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'spark' | 'smoke';
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  speed: number;
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: PowerUpType;
  radius: number;
  duration: number; // For active effect duration if picked up
  life: number; // Disappears after 15s if not picked up
  angle: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
  size: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  speed: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  kills: number;
  survivalTime: number; // in seconds
  shotsFired: number;
  shotsHit: number;
  combo: number;
  comboTimer: number;
  wave: number;
}
