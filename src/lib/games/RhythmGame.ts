import { BaseGame } from '../core/BaseGame';
import type { GameData, GameDifficulty } from '../core/BaseGame';

interface Note {
  id: number;
  lane: number;
  time: number;
  y: number;
  hit: boolean;
  missed: boolean;
}

interface Song {
  name: string;
  bpm: number;
  duration: number;
  notes: Array<{lane: number, time: number}>;
}

export class RhythmGame extends BaseGame {
  private lanes: number = 4;
  private notes: Note[] = [];
  private currentSong: Song | null = null;
  private startTime: number = 0;
  private combo: number = 0;
  private maxCombo: number = 0;
  private perfectHits: number = 0;
  private goodHits: number = 0;
  private missedNotes: number = 0;
  private laneWidth: number = 100;
  private noteHeight: number = 20;
  private noteSpeed: number = 300;
  private hitLineY: number = 500;
  private judgmentWindow = {
    perfect: 50,
    good: 100,
    miss: 150
  };
  private audioContext: AudioContext | null = null;
  private nextNoteId: number = 0;
  private songEnded: boolean = false;
  private lastNoteTime: number = 0;
  private keysPressed: Set<string> = new Set();
  private laneKeys: string[] = ['d', 'f', 'j', 'k'];
  private particles: Array<{x: number, y: number, time: number, type: string}> = [];
  private hitEffects: Array<{lane: number, time: number, judgment: string}> = [];

  constructor(canvasId: string) {
    super(canvasId, {
      width: 600,
      height: 600,
      name: 'rhythm',
      version: '1.0.0',
      difficulty: 'medium' as GameDifficulty
    });
    
    // 모바일 지원을 위한 터치 영역 설정
    if ('ontouchstart' in window) {
      this.setupTouchControls();
    }
  }

  async init(): Promise<void> {
    await super.init();
    this.setupEventListeners();
    this.loadSong();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }
  
  private setupTouchControls(): void {
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touches = e.touches;
      
      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const x = touch.clientX - rect.left;
        const lane = Math.floor(x / (this.canvas.width / this.lanes));
        
        if (lane >= 0 && lane < this.lanes) {
          this.checkHit(lane);
        }
      }
    });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.isRunning || this.isPaused) return;
    
    const key = e.key.toLowerCase();
    if (this.laneKeys.includes(key) && !this.keysPressed.has(key)) {
      this.keysPressed.add(key);
      const lane = this.laneKeys.indexOf(key);
      this.checkHit(lane);
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    this.keysPressed.delete(key);
  }

  private loadSong(): void {
    // Simple song pattern for testing
    const notesPattern: Array<{lane: number, time: number}> = [];
    const bpm = 120;
    const beatInterval = 60000 / bpm; // ms per beat
    
    // Generate a simple pattern
    for (let i = 0; i < 30; i++) {
      const lane = Math.floor(Math.random() * this.lanes);
      const time = i * beatInterval;
      notesPattern.push({ lane, time });
    }
    
    this.currentSong = {
      name: 'Test Song',
      bpm: bpm,
      duration: 30000, // 30 seconds
      notes: notesPattern
    };
    
    this.lastNoteTime = Math.max(...notesPattern.map(n => n.time));
  }

  protected update(deltaTime: number): void {
    if (!this.currentSong || !this.isRunning || this.isPaused) return;
    
    const currentTime = Date.now() - this.startTime;
    
    // Generate notes based on song data
    this.currentSong.notes.forEach(noteData => {
      if (noteData.time >= currentTime - 2000 && noteData.time <= currentTime + 100) {
        if (!this.notes.some(n => n.time === noteData.time && n.lane === noteData.lane)) {
          this.notes.push({
            id: this.nextNoteId++,
            lane: noteData.lane,
            time: noteData.time,
            y: -this.noteHeight,
            hit: false,
            missed: false
          });
        }
      }
    });
    
    // Update note positions
    this.notes = this.notes.filter(note => {
      const noteTime = note.time;
      const timeDiff = currentTime - noteTime;
      note.y = this.hitLineY - (noteTime - currentTime) * this.noteSpeed / 1000;
      
      // Check if note is missed
      if (note.y > this.hitLineY + this.judgmentWindow.miss && !note.hit && !note.missed) {
        note.missed = true;
        this.missedNotes++;
        this.combo = 0;
        this.hitEffects.push({
          lane: note.lane,
          time: Date.now(),
          judgment: 'MISS'
        });
      }
      
      // Remove notes that are off screen
      return note.y < this.canvas.height + 50;
    });
    
    // Update particles and effects
    this.particles = this.particles.filter(p => Date.now() - p.time < 1000);
    this.hitEffects = this.hitEffects.filter(e => Date.now() - e.time < 500);
    
    // Check if song ended
    if (currentTime > this.lastNoteTime + 3000 && !this.songEnded) {
      this.songEnded = true;
      this.endGame();
    }
  }

  private checkHit(lane: number): void {
    const currentTime = Date.now() - this.startTime;
    let hitNote: Note | null = null;
    let minTimeDiff = Infinity;
    
    // Find the closest note in the lane
    this.notes.forEach(note => {
      if (note.lane === lane && !note.hit && !note.missed) {
        const timeDiff = Math.abs(note.y - this.hitLineY);
        if (timeDiff < minTimeDiff && timeDiff < this.judgmentWindow.miss) {
          minTimeDiff = timeDiff;
          hitNote = note;
        }
      }
    });
    
    if (hitNote) {
      hitNote.hit = true;
      let judgment = '';
      
      if (minTimeDiff < this.judgmentWindow.perfect) {
        judgment = 'PERFECT';
        this.perfectHits++;
        this.score += 300;
        this.combo++;
      } else if (minTimeDiff < this.judgmentWindow.good) {
        judgment = 'GOOD';
        this.goodHits++;
        this.score += 100;
        this.combo++;
      } else {
        judgment = 'BAD';
        this.score += 50;
        this.combo = 0;
      }
      
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      
      // Add visual effects
      this.hitEffects.push({
        lane: lane,
        time: Date.now(),
        judgment: judgment
      });
      
      // Add particles
      for (let i = 0; i < 5; i++) {
        this.particles.push({
          x: this.getLaneX(lane) + this.laneWidth / 2 + (Math.random() - 0.5) * 40,
          y: this.hitLineY + (Math.random() - 0.5) * 20,
          time: Date.now(),
          type: judgment
        });
      }
    }
  }

  private getLaneX(lane: number): number {
    const totalWidth = this.laneWidth * this.lanes;
    const startX = (this.canvas.width - totalWidth) / 2;
    return startX + lane * this.laneWidth;
  }

  protected render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw lanes
    for (let i = 0; i < this.lanes; i++) {
      const x = this.getLaneX(i);
      
      // Lane background
      this.ctx.fillStyle = i % 2 === 0 ? '#16213e' : '#0f3460';
      this.ctx.fillRect(x, 0, this.laneWidth, this.canvas.height);
      
      // Lane borders
      this.ctx.strokeStyle = '#e94560';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, 0, this.laneWidth, this.canvas.height);
    }
    
    // Draw hit line
    this.ctx.fillStyle = '#e94560';
    this.ctx.fillRect(this.getLaneX(0), this.hitLineY - 2, this.laneWidth * this.lanes, 4);
    
    // Draw hit zones
    for (let i = 0; i < this.lanes; i++) {
      const x = this.getLaneX(i);
      this.ctx.fillStyle = this.keysPressed.has(this.laneKeys[i]) ? 'rgba(233, 69, 96, 0.3)' : 'rgba(233, 69, 96, 0.1)';
      this.ctx.fillRect(x, this.hitLineY - 40, this.laneWidth, 80);
      
      // Draw key hints
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.laneKeys[i].toUpperCase(), x + this.laneWidth / 2, this.hitLineY + 50);
    }
    
    // Draw notes
    this.notes.forEach(note => {
      if (!note.hit) {
        const x = this.getLaneX(note.lane);
        
        // Note glow effect
        const gradient = this.ctx.createRadialGradient(
          x + this.laneWidth / 2, note.y + this.noteHeight / 2, 0,
          x + this.laneWidth / 2, note.y + this.noteHeight / 2, this.laneWidth / 2
        );
        gradient.addColorStop(0, note.missed ? '#ff4444' : '#00ff88');
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, note.y - 20, this.laneWidth, this.noteHeight + 40);
        
        // Note body
        this.ctx.fillStyle = note.missed ? '#ff4444' : '#00ff88';
        this.ctx.fillRect(x + 10, note.y, this.laneWidth - 20, this.noteHeight);
      }
    });
    
    // Draw particles
    this.particles.forEach(particle => {
      const age = (Date.now() - particle.time) / 1000;
      const alpha = 1 - age;
      
      this.ctx.fillStyle = particle.type === 'PERFECT' ? `rgba(255, 215, 0, ${alpha})` :
                           particle.type === 'GOOD' ? `rgba(0, 255, 136, ${alpha})` :
                           `rgba(255, 136, 0, ${alpha})`;
      
      const size = 4 * (1 - age);
      this.ctx.fillRect(particle.x - size/2, particle.y - size/2 - age * 100, size, size);
    });
    
    // Draw hit effects
    this.hitEffects.forEach(effect => {
      const age = (Date.now() - effect.time) / 500;
      const alpha = 1 - age;
      const x = this.getLaneX(effect.lane) + this.laneWidth / 2;
      
      this.ctx.font = `bold ${20 + age * 10}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = effect.judgment === 'PERFECT' ? `rgba(255, 215, 0, ${alpha})` :
                           effect.judgment === 'GOOD' ? `rgba(0, 255, 136, ${alpha})` :
                           effect.judgment === 'MISS' ? `rgba(255, 68, 68, ${alpha})` :
                           `rgba(255, 136, 0, ${alpha})`;
      
      this.ctx.fillText(effect.judgment, x, this.hitLineY - 60 - age * 30);
    });
    
    // Draw UI
    this.drawUI();
  }

  private drawUI(): void {
    // Score
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.score}`, 20, 40);
    
    // Combo
    if (this.combo > 0) {
      this.ctx.font = 'bold 32px Arial';
      this.ctx.fillStyle = this.combo > 10 ? '#ffd700' : '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${this.combo} COMBO`, this.canvas.width / 2, 100);
    }
    
    // Stats
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Perfect: ${this.perfectHits}`, this.canvas.width - 20, 30);
    this.ctx.fillText(`Good: ${this.goodHits}`, this.canvas.width - 20, 50);
    this.ctx.fillText(`Miss: ${this.missedNotes}`, this.canvas.width - 20, 70);
  }

  start(): void {
    super.start();
    this.startTime = Date.now();
    this.notes = [];
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectHits = 0;
    this.goodHits = 0;
    this.missedNotes = 0;
    this.songEnded = false;
    this.particles = [];
    this.hitEffects = [];
  }

  protected endGame(): void {
    const accuracy = this.perfectHits + this.goodHits > 0 ? 
      ((this.perfectHits * 100 + this.goodHits * 50) / ((this.perfectHits + this.goodHits + this.missedNotes) * 100) * 100).toFixed(2) : 
      '0';
    
    alert(`Game Over!\n\nScore: ${this.score}\nMax Combo: ${this.maxCombo}\nAccuracy: ${accuracy}%\n\nPerfect: ${this.perfectHits}\nGood: ${this.goodHits}\nMiss: ${this.missedNotes}`);
    
    this.stop();
  }

  stop(): void {
    super.stop();
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }

  getGameData(): GameData {
    return {
      name: 'Rhythm Game',
      description: 'Hit the notes to the beat!',
      thumbnail: '/images/games/rhythm.png',
      category: 'arcade',
      difficulty: this.difficulty,
      tags: ['music', 'rhythm', 'timing'],
      controls: {
        'D, F, J, K': 'Hit notes in lanes 1-4',
        'Space': 'Pause game'
      },
      howToPlay: [
        'Press the correct keys when notes reach the hit line',
        'D, F, J, K keys correspond to lanes 1-4',
        'Perfect timing gives more points',
        'Keep your combo going for higher scores!',
        'Miss too many notes and the game ends'
      ]
    };
  }
}