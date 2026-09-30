import React from 'react';
import { 
  Volume2, 
  VolumeX, 
  Pause, 
  Play, 
  RotateCcw, 
  Bomb, 
  Shield, 
  Zap, 
  Flame, 
  Crosshair, 
  Heart, 
  Trophy, 
  Clock, 
  Target 
} from 'lucide-react';
import { GameMode, GameStats, Player } from '../types/game';

interface GameHUDProps {
  gameMode: GameMode;
  stats: GameStats;
  player: Player | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartGame: () => void;
  onPauseGame: () => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
  onTriggerBomb: () => void;
  isNewRecord: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  gameMode,
  stats,
  player,
  isMuted,
  onToggleMute,
  onStartGame,
  onPauseGame,
  onResumeGame,
  onRestartGame,
  onTriggerBomb,
  isNewRecord
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const accuracy = stats.shotsFired > 0 
    ? Math.min(100, Math.round((stats.shotsHit / stats.shotsFired) * 100)) 
    : 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* Active In-Game HUD */}
      {gameMode === 'PLAYING' && player && (
        <div className="absolute inset-x-0 top-0 p-4 md:p-6 flex flex-col gap-3">
          {/* Top Row: Health & Scores */}
          <div className="flex items-start justify-between gap-4">
            {/* Left: Health & Status */}
            <div className="flex flex-col gap-1 pointer-events-auto">
              <div className="flex items-center gap-2">
                <Heart 
                  className={`w-5 h-5 transition-transform ${player.health <= 30 ? 'text-red-500 animate-pulse scale-110' : 'text-emerald-400'}`} 
                />
                <div className="text-xs font-mono-tech tracking-wider uppercase text-slate-400">
                  Integrity: <span className="font-bold text-white">{Math.max(0, Math.ceil(player.health))} / {player.maxHealth}</span>
                </div>
              </div>

              {/* Health Bar */}
              <div className="w-48 md:w-64 h-3 bg-slate-900/90 border border-slate-700/80 rounded-sm overflow-hidden p-0.5 backdrop-blur-sm shadow-lg shadow-black/50">
                <div 
                  className={`h-full transition-all duration-150 rounded-xs ${
                    player.health > 50 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                      : player.health > 25 
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400' 
                      : 'bg-gradient-to-r from-red-600 to-rose-400 animate-pulse'
                  }`}
                  style={{ width: `${Math.max(0, (player.health / player.maxHealth) * 100)}%` }}
                />
              </div>

              {/* Active Powerups Row */}
              <div className="flex items-center gap-2 mt-1">
                {player.shieldTimer > 0 && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 text-xs font-mono-tech shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                    <Shield className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>SHIELD {player.shieldTimer.toFixed(1)}s</span>
                  </div>
                )}
                {player.tripleShotTimer > 0 && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-amber-300 text-xs font-mono-tech shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                    <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>TRIPLE {player.tripleShotTimer.toFixed(1)}s</span>
                  </div>
                )}
                {player.rapidFireTimer > 0 && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs font-mono-tech shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                    <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    <span>RAPID {player.rapidFireTimer.toFixed(1)}s</span>
                  </div>
                )}
              </div>
            </div>

            {/* Center: Wave & Time */}
            <div className="hidden sm:flex flex-col items-center pointer-events-auto bg-slate-900/80 border border-slate-800 px-4 py-1.5 rounded-lg backdrop-blur-md shadow-lg shadow-black/40">
              <div className="text-[11px] font-mono-tech text-cyan-400/90 tracking-widest uppercase">
                THREAT LEVEL {stats.wave}
              </div>
              <div className="text-sm font-mono-tech text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {formatTime(stats.survivalTime)}
              </div>
            </div>

            {/* Right: Score & High Score & Actions */}
            <div className="flex flex-col items-end gap-1 pointer-events-auto">
              <div className="flex items-center gap-3">
                {/* Audio and Pause controls */}
                <button
                  onClick={onToggleMute}
                  aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                  className="p-1.5 rounded-md bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors backdrop-blur-sm cursor-pointer shadow-md"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                </button>
                <button
                  onClick={onPauseGame}
                  aria-label="Pause game"
                  className="p-1.5 rounded-md bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors backdrop-blur-sm cursor-pointer shadow-md"
                >
                  <Pause className="w-4 h-4" />
                </button>

                {/* Score */}
                <div className="text-right">
                  <div className="text-xs font-mono-tech uppercase text-slate-400 tracking-wider">
                    Score
                  </div>
                  <div className="text-2xl md:text-3xl font-black font-mono-tech tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-white drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                    {stats.score.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* High Score & Combo */}
              <div className="flex items-center gap-3 text-xs font-mono-tech text-slate-400">
                <div className="flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>HI: <span className="text-slate-200">{stats.highScore.toLocaleString()}</span></span>
                </div>
                {stats.combo > 1 && (
                  <div className="flex items-center gap-1 text-amber-400 font-bold animate-bounce">
                    <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>{stats.combo}x COMBO!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Float for Mobile / Bomb trigger */}
          <div className="fixed bottom-6 right-6 pointer-events-auto flex items-center gap-3">
            <button
              onClick={onTriggerBomb}
              disabled={player.bombs <= 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border backdrop-blur-md transition-all font-mono-tech font-bold text-sm shadow-xl ${
                player.bombs > 0
                  ? 'bg-rose-950/80 border-rose-500/80 text-rose-200 hover:bg-rose-900 hover:scale-105 active:scale-95 shadow-rose-900/40 cursor-pointer animate-pulse'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Bomb className={`w-5 h-5 ${player.bombs > 0 ? 'text-rose-400' : 'text-slate-600'}`} />
              <span>EMP NOVA ({player.bombs})</span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-black/40 rounded border border-rose-500/30">
                SPACE
              </kbd>
            </button>
          </div>
        </div>
      )}

      {/* Start Screen */}
      {gameMode === 'START' && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="max-w-xl w-full bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col items-center text-center relative overflow-hidden">
            {/* Top decorative accent */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono-tech tracking-widest uppercase mb-3">
              <Crosshair className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              Tactical Vector Simulation
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase mb-2">
              Neon <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300 drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]">Strike</span>
            </h1>

            <p className="text-sm md:text-base text-slate-300 max-w-md mb-6 leading-relaxed">
              Defend the core against endless hostile drone swarms. Eliminate targets, gather powerups, chain kill combos, and survive the escalating overdrive.
            </p>

            {/* High Score Banner if exists */}
            {stats.highScore > 0 && (
              <div className="flex items-center gap-2 text-sm font-mono-tech text-amber-300 bg-amber-950/40 border border-amber-500/30 px-4 py-1.5 rounded-lg mb-6">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Sector Record: <strong className="text-white">{stats.highScore.toLocaleString()}</strong> pts</span>
              </div>
            )}

            {/* Controls Guide */}
            <div className="w-full grid grid-cols-2 gap-3 text-left mb-6 font-mono-tech text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-cyan-400 font-bold mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  PILOT MOVEMENT
                </div>
                <div className="text-slate-300"><kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-bold">W</kbd> <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-bold">A</kbd> <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-bold">S</kbd> <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-bold">D</kbd> or Arrows</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-teal-400 font-bold mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                  WEAPONS & AIM
                </div>
                <div className="text-slate-300">Aim with <strong className="text-white">Mouse</strong>, Click/Hold <strong className="text-white">Left Button</strong></div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-rose-400 font-bold mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  EMP NOVA BLAST
                </div>
                <div className="text-slate-300">Press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-bold">SPACE</kbd> or click Bomb</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-amber-400 font-bold mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  TACTICAL PAUSE
                </div>
                <div className="text-slate-300">Press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-bold">P</kbd> or <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-bold">ESC</kbd></div>
              </div>
            </div>

            {/* Launch Button */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                onClick={onStartGame}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black text-lg tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.7)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                ENGAGE SYSTEMS
              </button>

              <button
                onClick={onToggleMute}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-mono-tech border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                <span>{isMuted ? 'UNMUTE AUDIO' : 'AUDIO ON'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paused Screen */}
      {gameMode === 'PAUSED' && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="max-w-md w-full bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-6 md:p-8 text-center shadow-2xl">
            <h2 className="text-3xl font-black text-white uppercase tracking-wider mb-2">
              SIMULATION PAUSED
            </h2>
            <p className="text-slate-400 text-sm mb-6 font-mono-tech">
              Weapons on standby. Threat levels frozen.
            </p>

            <div className="space-y-3 font-mono-tech">
              <button
                onClick={onResumeGame}
                className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-base uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                RESUME COMBAT
              </button>

              <button
                onClick={onRestartGame}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                RESTART MISSION
              </button>

              <button
                onClick={onToggleMute}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                {isMuted ? 'AUDIO: MUTED' : 'AUDIO: ACTIVE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameMode === 'GAMEOVER' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="max-w-lg w-full bg-slate-900/95 border border-rose-500/40 rounded-2xl p-6 md:p-8 text-center shadow-[0_0_60px_rgba(244,63,94,0.2)] relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-400 text-xs font-mono-tech tracking-widest uppercase mb-3">
              Hull Compromised
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-1">
              MISSION <span className="text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.7)]">FAILED</span>
            </h2>

            {isNewRecord && (
              <div className="inline-block my-2 px-3 py-1 rounded bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider animate-bounce">
                ★ NEW HIGH SCORE RECORD ★
              </div>
            )}

            {/* Score Highlight Card */}
            <div className="my-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-xs font-mono-tech text-slate-400 uppercase tracking-widest mb-1">
                Final Sector Score
              </div>
              <div className="text-4xl md:text-5xl font-mono-tech font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-white">
                {stats.score.toLocaleString()}
              </div>
              <div className="mt-2 text-xs font-mono-tech text-slate-400 flex items-center justify-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Sector Best: <span className="text-slate-200 font-bold">{stats.highScore.toLocaleString()}</span></span>
              </div>
            </div>

            {/* Combat Statistics Grid */}
            <div className="grid grid-cols-3 gap-2.5 text-left mb-6 font-mono-tech">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" /> Survived
                </div>
                <div className="text-base font-bold text-white mt-0.5">
                  {formatTime(stats.survivalTime)}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                  <Target className="w-3 h-3 text-teal-400" /> Enemies
                </div>
                <div className="text-base font-bold text-white mt-0.5">
                  {stats.kills}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Accuracy
                </div>
                <div className="text-base font-bold text-white mt-0.5">
                  {accuracy}%
                </div>
              </div>
            </div>

            {/* Restart Button */}
            <button
              onClick={onRestartGame}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-lg tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(244,63,94,0.4)] hover:shadow-[0_0_40px_rgba(244,63,94,0.7)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              DEPLOY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
