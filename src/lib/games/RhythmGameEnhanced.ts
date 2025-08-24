import { BaseGame } from '../core/BaseGame';
import type { GameData, GameDifficulty } from '../core/BaseGame';
import { MusicGenerator } from '../utils/MusicGenerator';

interface Note {
  id: number;
  lane: number;
  time: number;
  y: number;
  hit: boolean;
  missed: boolean;
  type?: 'normal' | 'hold' | 'slide';
  duration?: number;
}

interface Song {
  id: string;
  name: string;
  artist: string;
  bpm: number;
  duration: number;
  audioUrl?: string;
  previewUrl?: string;
  difficulty: {
    easy: SongChart;
    normal: SongChart;
    hard: SongChart;
    expert?: SongChart;
  };
}

interface SongChart {
  notes: Array<{lane: number, time: number, type?: string, duration?: number}>;
  speed: number;
}

interface LeaderboardEntry {
  name: string;
  score: number;
  combo: number;
  accuracy: number;
  date: string;
}

export class RhythmGameEnhanced extends BaseGame {
  private lanes: number = 4;
  private notes: Note[] = [];
  private currentSong: Song | null = null;
  private currentChart: SongChart | null = null;
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
    perfect: 30,
    good: 60,
    bad: 90,
    miss: 120
  };
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private audioSource: AudioBufferSourceNode | null = null;
  private nextNoteId: number = 0;
  private songEnded: boolean = false;
  private lastNoteTime: number = 0;
  private keysPressed: Set<string> = new Set();
  private laneKeys: string[] = ['d', 'f', 'j', 'k'];
  private particles: Array<{x: number, y: number, time: number, type: string}> = [];
  private hitEffects: Array<{lane: number, time: number, judgment: string}> = [];
  private selectedDifficulty: 'easy' | 'normal' | 'hard' | 'expert' = 'normal';
  private leaderboard: LeaderboardEntry[] = [];
  private songList: Song[] = [];
  private isLoading: boolean = false;
  private loadingProgress: number = 0;
  private musicGenerator: MusicGenerator | null = null;

  constructor(canvasId: string) {
    super(canvasId, {
      width: 600,
      height: 600,
      name: 'rhythm-enhanced',
      version: '2.0.0',
      difficulty: 'medium' as GameDifficulty
    });
    
    this.initializeSongs();
    this.loadLeaderboard();
    
    if ('ontouchstart' in window) {
      this.setupTouchControls();
    }
  }

  private initializeSongs(): void {
    this.songList = [
      {
        id: 'tutorial',
        name: 'Tutorial Track',
        artist: 'Flux Games',
        bpm: 120,
        duration: 60000,
        audioUrl: '/audio/tutorial.mp3',
        previewUrl: '/audio/tutorial-preview.mp3',
        difficulty: {
          easy: {
            speed: 200,
            notes: this.generateTutorialNotes('easy')
          },
          normal: {
            speed: 300,
            notes: this.generateTutorialNotes('normal')
          },
          hard: {
            speed: 400,
            notes: this.generateTutorialNotes('hard')
          }
        }
      },
      {
        id: 'electronic-beats',
        name: 'Electronic Beats',
        artist: 'DJ Flux',
        bpm: 140,
        duration: 120000,
        audioUrl: '/audio/electronic-beats.mp3',
        previewUrl: '/audio/electronic-beats-preview.mp3',
        difficulty: {
          easy: {
            speed: 250,
            notes: this.generateElectronicBeatsNotes('easy')
          },
          normal: {
            speed: 350,
            notes: this.generateElectronicBeatsNotes('normal')
          },
          hard: {
            speed: 450,
            notes: this.generateElectronicBeatsNotes('hard')
          },
          expert: {
            speed: 550,
            notes: this.generateElectronicBeatsNotes('expert')
          }
        }
      },
      {
        id: 'pop-fusion',
        name: 'Pop Fusion',
        artist: 'Kelly & The Fluxers',
        bpm: 128,
        duration: 90000,
        audioUrl: '/audio/pop-fusion.mp3',
        previewUrl: '/audio/pop-fusion-preview.mp3',
        difficulty: {
          easy: {
            speed: 220,
            notes: this.generatePopFusionNotes('easy')
          },
          normal: {
            speed: 320,
            notes: this.generatePopFusionNotes('normal')
          },
          hard: {
            speed: 420,
            notes: this.generatePopFusionNotes('hard')
          }
        }
      }
    ];
  }

  private generateTutorialNotes(difficulty: string): Array<{lane: number, time: number, type?: string}> {
    const notes: Array<{lane: number, time: number, type?: string}> = [];
    const beatInterval = 500; // 120 BPM
    
    if (difficulty === 'easy') {
      // Simple 4/4 pattern
      for (let i = 0; i < 30; i++) {
        notes.push({ lane: i % 4, time: i * beatInterval });
      }
    } else if (difficulty === 'normal') {
      // More complex pattern
      for (let i = 0; i < 40; i++) {
        notes.push({ lane: i % 4, time: i * beatInterval });
        if (i % 2 === 0) {
          notes.push({ lane: (i + 2) % 4, time: i * beatInterval + beatInterval/2 });
        }
      }
    } else if (difficulty === 'hard') {
      // Complex pattern with holds
      for (let i = 0; i < 50; i++) {
        notes.push({ lane: i % 4, time: i * beatInterval });
        if (i % 4 === 0) {
          notes.push({ 
            lane: (i + 1) % 4, 
            time: i * beatInterval + beatInterval/4,
            type: 'hold',
            duration: beatInterval
          });
        }
        if (i % 2 === 0) {
          notes.push({ lane: (i + 2) % 4, time: i * beatInterval + beatInterval/2 });
        }
      }
    }
    
    return notes;
  }

  private generateElectronicBeatsNotes(difficulty: string): Array<{lane: number, time: number, type?: string}> {
    const notes: Array<{lane: number, time: number, type?: string}> = [];
    const beatInterval = 428; // 140 BPM
    
    // Different patterns for different difficulties
    const patterns = {
      easy: [
        [0, 0], [1, 0.5], [2, 1], [3, 1.5]
      ],
      normal: [
        [0, 0], [1, 0.25], [2, 0.5], [3, 0.75],
        [1, 1], [2, 1.25], [3, 1.5], [0, 1.75]
      ],
      hard: [
        [0, 0], [1, 0.125], [2, 0.25], [3, 0.375],
        [1, 0.5], [0, 0.625], [3, 0.75], [2, 0.875],
        [0, 1], [3, 1.125], [1, 1.25], [2, 1.375]
      ],
      expert: [
        [0, 0], [1, 0.0625], [2, 0.125], [3, 0.1875],
        [2, 0.25], [1, 0.3125], [0, 0.375], [3, 0.4375],
        [0, 0.5], [1, 0.5625], [3, 0.625], [2, 0.6875],
        [1, 0.75], [0, 0.8125], [2, 0.875], [3, 0.9375]
      ]
    };
    
    const pattern = patterns[difficulty as keyof typeof patterns] || patterns.normal;
    
    for (let measure = 0; measure < 30; measure++) {
      pattern.forEach(([lane, offset]) => {
        notes.push({
          lane,
          time: measure * beatInterval * 2 + offset * beatInterval,
          type: Math.random() > 0.9 && difficulty !== 'easy' ? 'hold' : 'normal'
        });
      });
    }
    
    return notes;
  }

  private generatePopFusionNotes(difficulty: string): Array<{lane: number, time: number, type?: string}> {
    const notes: Array<{lane: number, time: number, type?: string}> = [];
    const beatInterval = 468; // 128 BPM
    
    // Pop rhythm patterns
    if (difficulty === 'easy') {
      for (let i = 0; i < 40; i++) {
        if (i % 4 === 0) notes.push({ lane: 0, time: i * beatInterval });
        if (i % 4 === 2) notes.push({ lane: 2, time: i * beatInterval });
        if (i % 8 === 6) notes.push({ lane: 1, time: i * beatInterval });
      }
    } else if (difficulty === 'normal') {
      for (let i = 0; i < 50; i++) {
        if (i % 2 === 0) notes.push({ lane: i % 4, time: i * beatInterval });
        if (i % 4 === 1) notes.push({ lane: (i + 1) % 4, time: i * beatInterval + beatInterval/2 });
        if (i % 8 === 3) notes.push({ lane: 2, time: i * beatInterval + beatInterval/4 });
      }
    } else if (difficulty === 'hard') {
      for (let i = 0; i < 60; i++) {
        notes.push({ lane: i % 4, time: i * beatInterval });
        if (i % 2 === 0) {
          notes.push({ lane: (i + 2) % 4, time: i * beatInterval + beatInterval/3 });
          notes.push({ lane: (i + 1) % 4, time: i * beatInterval + beatInterval*2/3 });
        }
        if (i % 8 === 0) {
          notes.push({ 
            lane: 3, 
            time: i * beatInterval + beatInterval/4,
            type: 'slide'
          });
        }
      }
    }
    
    return notes;
  }

  async init(): Promise<void> {
    await super.init();
    this.setupEventListeners();
    this.initAudioContext();
  }

  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.musicGenerator = new MusicGenerator();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
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

  async loadSong(songId: string, difficulty: 'easy' | 'normal' | 'hard' | 'expert'): Promise<void> {
    this.isLoading = true;
    this.loadingProgress = 0;
    
    const song = this.songList.find(s => s.id === songId);
    if (!song) {
      console.error('Song not found:', songId);
      this.isLoading = false;
      return;
    }
    
    this.currentSong = song;
    this.selectedDifficulty = difficulty;
    this.currentChart = song.difficulty[difficulty] || song.difficulty.normal;
    this.noteSpeed = this.currentChart.speed;
    
    // Load audio if available
    if (song.audioUrl && this.audioContext) {
      try {
        this.loadingProgress = 0.3;
        const response = await fetch(song.audioUrl);
        this.loadingProgress = 0.6;
        const arrayBuffer = await response.arrayBuffer();
        this.loadingProgress = 0.9;
        this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.loadingProgress = 1;
      } catch (e) {
        console.warn('Could not load audio:', e);
        // Continue without audio
      }
    }
    
    this.lastNoteTime = Math.max(...this.currentChart.notes.map(n => n.time));
    this.isLoading = false;
  }

  private async playAudio(): Promise<void> {
    // Try to load real audio first
    if (this.audioContext && this.audioBuffer) {
      // Stop any existing audio
      if (this.audioSource) {
        this.audioSource.stop();
        this.audioSource.disconnect();
      }
      
      this.audioSource = this.audioContext.createBufferSource();
      this.audioSource.buffer = this.audioBuffer;
      this.audioSource.connect(this.audioContext.destination);
      this.audioSource.start(0);
    } else if (this.musicGenerator && this.currentSong) {
      // Use music generator as fallback
      if (this.currentSong.id === 'tutorial') {
        this.musicGenerator.playTutorialTrack();
      } else if (this.currentSong.id === 'electronic-beats') {
        this.musicGenerator.playElectronicBeats();
      } else if (this.currentSong.id === 'pop-fusion') {
        this.musicGenerator.playPopFusion();
      }
    }
  }

  protected update(deltaTime: number): void {
    if (!this.currentSong || !this.currentChart || !this.isRunning || this.isPaused) return;
    
    const currentTime = Date.now() - this.startTime;
    
    // Generate notes based on chart data
    this.currentChart.notes.forEach(noteData => {
      if (noteData.time >= currentTime - 2000 && noteData.time <= currentTime + 100) {
        if (!this.notes.some(n => n.time === noteData.time && n.lane === noteData.lane)) {
          this.notes.push({
            id: this.nextNoteId++,
            lane: noteData.lane,
            time: noteData.time,
            y: -this.noteHeight,
            hit: false,
            missed: false,
            type: noteData.type as 'normal' | 'hold' | 'slide' || 'normal',
            duration: noteData.duration
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
      let scoreGain = 0;
      
      if (minTimeDiff < this.judgmentWindow.perfect) {
        judgment = 'PERFECT';
        this.perfectHits++;
        scoreGain = 300;
        this.combo++;
      } else if (minTimeDiff < this.judgmentWindow.good) {
        judgment = 'GOOD';
        this.goodHits++;
        scoreGain = 100;
        this.combo++;
      } else if (minTimeDiff < this.judgmentWindow.bad) {
        judgment = 'BAD';
        scoreGain = 50;
        this.combo = 0;
      } else {
        judgment = 'MISS';
        this.missedNotes++;
        this.combo = 0;
      }
      
      // Apply combo multiplier
      if (this.combo > 0) {
        scoreGain = Math.floor(scoreGain * (1 + this.combo * 0.01));
      }
      
      this.score += scoreGain;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      
      // Add visual effects
      this.hitEffects.push({
        lane: lane,
        time: Date.now(),
        judgment: judgment
      });
      
      // Add particles
      const particleCount = judgment === 'PERFECT' ? 10 : judgment === 'GOOD' ? 5 : 3;
      for (let i = 0; i < particleCount; i++) {
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
    
    // Draw loading screen if loading
    if (this.isLoading) {
      this.renderLoadingScreen();
      return;
    }
    
    // Draw lanes
    for (let i = 0; i < this.lanes; i++) {
      const x = this.getLaneX(i);
      
      // Lane background with gradient
      const gradient = this.ctx.createLinearGradient(x, 0, x, this.canvas.height);
      gradient.addColorStop(0, i % 2 === 0 ? '#16213e' : '#0f3460');
      gradient.addColorStop(1, i % 2 === 0 ? '#1a2844' : '#133a6a');
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x, 0, this.laneWidth, this.canvas.height);
      
      // Lane borders
      this.ctx.strokeStyle = '#e94560';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, 0, this.laneWidth, this.canvas.height);
    }
    
    // Draw hit line with glow effect
    const hitLineGradient = this.ctx.createLinearGradient(0, this.hitLineY - 10, 0, this.hitLineY + 10);
    hitLineGradient.addColorStop(0, 'rgba(233, 69, 96, 0)');
    hitLineGradient.addColorStop(0.5, 'rgba(233, 69, 96, 0.8)');
    hitLineGradient.addColorStop(1, 'rgba(233, 69, 96, 0)');
    
    this.ctx.fillStyle = hitLineGradient;
    this.ctx.fillRect(this.getLaneX(0), this.hitLineY - 10, this.laneWidth * this.lanes, 20);
    
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
        
        // Different rendering for different note types
        if (note.type === 'hold' && note.duration) {
          // Draw hold note
          const holdLength = note.duration * this.noteSpeed / 1000;
          
          this.ctx.fillStyle = note.missed ? 'rgba(255, 68, 68, 0.3)' : 'rgba(0, 255, 136, 0.3)';
          this.ctx.fillRect(x + 10, note.y, this.laneWidth - 20, holdLength);
          
          this.ctx.strokeStyle = note.missed ? '#ff4444' : '#00ff88';
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(x + 10, note.y, this.laneWidth - 20, holdLength);
        }
        
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
        
        // Special effect for slide notes
        if (note.type === 'slide') {
          this.ctx.strokeStyle = '#ffd700';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(x + 10, note.y, this.laneWidth - 20, this.noteHeight);
        }
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

  private renderLoadingScreen(): void {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Loading...', this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    // Progress bar
    const barWidth = 300;
    const barHeight = 20;
    const barX = (this.canvas.width - barWidth) / 2;
    const barY = this.canvas.height / 2;
    
    this.ctx.strokeStyle = '#e94560';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    this.ctx.fillStyle = '#00ff88';
    this.ctx.fillRect(barX, barY, barWidth * this.loadingProgress, barHeight);
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
      this.ctx.fillStyle = this.combo > 50 ? '#ff0000' : 
                           this.combo > 20 ? '#ffd700' : 
                           this.combo > 10 ? '#00ff88' : '#ffffff';
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
    
    // Song info
    if (this.currentSong) {
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#cccccc';
      this.ctx.fillText(`${this.currentSong.name} - ${this.currentSong.artist}`, this.canvas.width / 2, 20);
      this.ctx.fillText(`[${this.selectedDifficulty.toUpperCase()}]`, this.canvas.width / 2, 40);
    }
  }

  async start(): Promise<void> {
    if (!this.currentSong || !this.currentChart) {
      console.error('No song loaded');
      return;
    }
    
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
    
    // Start audio playback
    await this.playAudio();
  }

  protected endGame(): void {
    const totalNotes = this.perfectHits + this.goodHits + this.missedNotes;
    const accuracy = totalNotes > 0 ? 
      ((this.perfectHits * 100 + this.goodHits * 70) / (totalNotes * 100) * 100).toFixed(2) : 
      '0';
    
    // Save to leaderboard
    this.addToLeaderboard({
      name: 'Player',
      score: this.score,
      combo: this.maxCombo,
      accuracy: parseFloat(accuracy),
      date: new Date().toISOString()
    });
    
    // Show results
    alert(`Game Over!\n\nScore: ${this.score}\nMax Combo: ${this.maxCombo}\nAccuracy: ${accuracy}%\n\nPerfect: ${this.perfectHits}\nGood: ${this.goodHits}\nMiss: ${this.missedNotes}\n\nRank: ${this.getRank(parseFloat(accuracy))}`);
    
    this.stop();
  }

  private getRank(accuracy: number): string {
    if (accuracy >= 98) return 'SSS';
    if (accuracy >= 95) return 'SS';
    if (accuracy >= 90) return 'S';
    if (accuracy >= 85) return 'A';
    if (accuracy >= 80) return 'B';
    if (accuracy >= 70) return 'C';
    if (accuracy >= 60) return 'D';
    return 'F';
  }

  stop(): void {
    super.stop();
    
    // Stop audio
    if (this.audioSource) {
      this.audioSource.stop();
      this.audioSource.disconnect();
      this.audioSource = null;
    }
    
    // Stop music generator
    if (this.musicGenerator) {
      this.musicGenerator.stop();
    }
    
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private loadLeaderboard(): void {
    const saved = localStorage.getItem('rhythmGameLeaderboard');
    if (saved) {
      this.leaderboard = JSON.parse(saved);
    }
  }

  private saveLeaderboard(): void {
    localStorage.setItem('rhythmGameLeaderboard', JSON.stringify(this.leaderboard));
  }

  private addToLeaderboard(entry: LeaderboardEntry): void {
    this.leaderboard.push(entry);
    this.leaderboard.sort((a, b) => b.score - a.score);
    this.leaderboard = this.leaderboard.slice(0, 10); // Keep top 10
    this.saveLeaderboard();
  }

  getLeaderboard(): LeaderboardEntry[] {
    return this.leaderboard;
  }

  getSongList(): Song[] {
    return this.songList;
  }

  getGameData(): GameData {
    return {
      name: 'Rhythm Game Enhanced',
      description: 'Hit the notes to the beat with multiple songs and difficulties!',
      thumbnail: '/images/games/rhythm.png',
      category: 'arcade',
      difficulty: this.difficulty,
      tags: ['music', 'rhythm', 'timing', 'arcade'],
      controls: {
        'D, F, J, K': 'Hit notes in lanes 1-4',
        'Space': 'Pause game',
        'Touch': 'Tap lanes on mobile'
      },
      howToPlay: [
        'Select a song and difficulty level',
        'Press the correct keys when notes reach the hit line',
        'Perfect timing gives more points',
        'Keep your combo going for higher scores!',
        'Different note types require different actions',
        'Compete for the top spot on the leaderboard!'
      ]
    };
  }
}