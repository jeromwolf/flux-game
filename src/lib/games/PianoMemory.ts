import { BaseGame } from '../core/BaseGame';
import { leaderboardSystem } from '../leaderboard/LeaderboardSystem';
import { tutorialSystem, TutorialConfig } from '../tutorial/TutorialSystem';
import { achievementSystem } from '../achievements/AchievementSystem';

interface PianoKey {
  note: string;
  frequency: number;
  keyNumber: number;
  isBlack: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  isPressed: boolean;
}

interface Song {
  id: string;
  name: string;
  nameEn: string;
  difficulty: 'easy' | 'medium' | 'hard';
  notes: number[]; // Array of key numbers
  tempo: number; // ms between notes
  requiredLevel: number;
}

export default class PianoMemory extends BaseGame {
  // Piano state
  private keys: PianoKey[] = [];
  private whiteKeyWidth = 50;
  private blackKeyWidth = 30;
  private keyHeight = 200;
  private blackKeyHeight = 120;
  
  // Game state
  private currentSong: Song | null = null;
  private songIndex: number = 0;
  private playerNotes: number[] = [];
  private isShowingPattern: boolean = false;
  private isPlayerTurn: boolean = false;
  private currentLevel: number = 1;
  private songsCompleted: number = 0;
  private mistakes: number = 0;
  private maxMistakes: number = 3;
  private combo: number = 0;
  private hintsRemaining: number = 3;
  private isShowingHint: boolean = false;
  
  // Audio
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  
  // Visual feedback
  private keyAnimations: Map<number, number> = new Map();
  private particleNotes: string[] = ['♪', '♫', '♬', '♩'];
  
  // Language
  private language: 'ko' | 'en' = 'ko';
  private texts = {
    ko: {
      listen: '멜로디를 들어보세요',
      yourTurn: '따라 연주하세요!',
      perfect: '완벽해요!',
      good: '잘했어요!',
      tryAgain: '다시 들어보세요',
      songComplete: '곡 완성!',
      gameOver: '게임 오버',
      level: '레벨',
      song: '곡',
      mistakes: '실수',
      combo: '콤보',
      hint: '힌트',
      replay: '다시 듣기'
    },
    en: {
      listen: 'Listen to the melody',
      yourTurn: 'Your turn to play!',
      perfect: 'Perfect!',
      good: 'Good job!',
      tryAgain: 'Listen again',
      songComplete: 'Song Complete!',
      gameOver: 'Game Over',
      level: 'Level',
      song: 'Song',
      mistakes: 'Mistakes',
      combo: 'Combo',
      hint: 'Hint',
      replay: 'Replay'
    }
  };
  
  // Song database
  private songs: Song[] = [
    // Easy songs (Level 1-5)
    {
      id: 'jingle-bells-intro',
      name: '징글벨 (인트로)',
      nameEn: 'Jingle Bells (Intro)',
      difficulty: 'easy',
      notes: [4, 4, 4, 4, 4, 4, 4, 7, 0, 2, 4],
      tempo: 350,
      requiredLevel: 1
    },
    {
      id: 'twinkle',
      name: '반짝반짝 작은별',
      nameEn: 'Twinkle Twinkle',
      difficulty: 'easy',
      notes: [0, 0, 7, 7, 9, 9, 7, 5, 5, 4, 4, 2, 2, 0],
      tempo: 400,
      requiredLevel: 2
    },
    {
      id: 'butterfly',
      name: '나비야',
      nameEn: 'Butterfly',
      difficulty: 'easy',
      notes: [4, 2, 2, 5, 4, 4, 0, 2, 4, 5, 7, 7],
      tempo: 350,
      requiredLevel: 3
    },
    {
      id: 'school-bell',
      name: '학교종',
      nameEn: 'School Bell',
      difficulty: 'easy',
      notes: [7, 7, 9, 9, 7, 7, 5, 7, 7, 5, 5, 4],
      tempo: 400,
      requiredLevel: 4
    },
    {
      id: 'happy-birthday',
      name: '생일 축하',
      nameEn: 'Happy Birthday',
      difficulty: 'easy',
      notes: [0, 0, 2, 0, 5, 4, 0, 0, 2, 0, 7, 5],
      tempo: 450,
      requiredLevel: 5
    },
    // Medium songs (Level 6-10)
    {
      id: 'mary-lamb',
      name: '메리의 어린양',
      nameEn: 'Mary Had a Little Lamb',
      difficulty: 'medium',
      notes: [4, 2, 0, 2, 4, 4, 4, 2, 2, 2, 4, 7, 7],
      tempo: 350,
      requiredLevel: 6
    },
    {
      id: 'ode-to-joy',
      name: '환희의 송가',
      nameEn: 'Ode to Joy',
      difficulty: 'medium',
      notes: [4, 4, 5, 7, 7, 5, 4, 2, 0, 0, 2, 4, 4, 2, 2],
      tempo: 400,
      requiredLevel: 7
    },
    {
      id: 'spring',
      name: '봄 (비발디)',
      nameEn: 'Spring (Vivaldi)',
      difficulty: 'medium',
      notes: [12, 11, 12, 11, 12, 9, 11, 9, 7, 4, 7, 9, 11, 12],
      tempo: 300,
      requiredLevel: 8
    },
    {
      id: 'canon',
      name: '캐논 (파헬벨)',
      nameEn: 'Canon (Pachelbel)',
      difficulty: 'medium',
      notes: [12, 11, 9, 11, 12, 16, 14, 12, 11, 9, 7, 9, 11, 7, 4],
      tempo: 350,
      requiredLevel: 9
    },
    {
      id: 'elise',
      name: '엘리제를 위하여',
      nameEn: 'Für Elise',
      difficulty: 'medium',
      notes: [16, 15, 16, 15, 16, 11, 14, 12, 9, 0, 4, 9, 11, 4, 8, 11, 12],
      tempo: 250,
      requiredLevel: 10
    },
    // Hard songs (Level 11+)
    {
      id: 'turkish-march',
      name: '터키 행진곡',
      nameEn: 'Turkish March',
      difficulty: 'hard',
      notes: [11, 9, 8, 9, 12, 11, 9, 8, 9, 16, 15, 14, 13, 12, 11, 9],
      tempo: 200,
      requiredLevel: 11
    },
    {
      id: 'moonlight',
      name: '월광 소나타',
      nameEn: 'Moonlight Sonata',
      difficulty: 'hard',
      notes: [8, 11, 16, 11, 16, 11, 16, 11, 16, 11, 16, 11, 8, 11, 16],
      tempo: 300,
      requiredLevel: 12
    },
    {
      id: 'river-flows',
      name: 'River Flows in You',
      nameEn: 'River Flows in You',
      difficulty: 'hard',
      notes: [16, 14, 12, 14, 16, 19, 16, 14, 12, 11, 12, 14, 16, 14, 12],
      tempo: 250,
      requiredLevel: 13
    },
    {
      id: 'spring-day',
      name: '봄날 (BTS)',
      nameEn: 'Spring Day (BTS)',
      difficulty: 'hard',
      notes: [7, 9, 11, 12, 11, 9, 7, 4, 7, 9, 11, 9, 7, 4, 2, 0],
      tempo: 350,
      requiredLevel: 14
    },
    {
      id: 'stay',
      name: 'Stay (BLACKPINK)',
      nameEn: 'Stay (BLACKPINK)',
      difficulty: 'hard',
      notes: [12, 11, 9, 11, 12, 14, 12, 11, 9, 7, 9, 11, 12, 14, 16],
      tempo: 300,
      requiredLevel: 15
    }
  ];

  constructor() {
    super({
      canvasWidth: 800,
      canvasHeight: 400,
      backgroundColor: '#1a1a1a',
      gameName: 'Piano Memory',
      gameId: 'piano-memory'
    });
    
    (window as any).currentGame = this;
  }

  protected setupGame(): void {
    if (!this.container) return;
    
    // Load language
    const savedLanguage = localStorage.getItem('flux-game-language');
    if (savedLanguage === 'ko' || savedLanguage === 'en') {
      this.language = savedLanguage;
    }
    
    // Setup HTML
    this.container.innerHTML = this.createGameHTML();
    
    // Setup canvas
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.canvas.width = this.config.canvasWidth;
      this.canvas.height = this.config.canvasHeight;
      this.ctx = this.canvas.getContext('2d');
      
      // Mouse events
      this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
      this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
      this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    }
    
    // Setup audio
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Web Audio API not supported');
    }
    
    // Setup piano keys
    this.setupPianoKeys();
    
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Button events
    setTimeout(() => {
      const replayBtn = document.getElementById('replay-btn');
      const hintBtn = document.getElementById('hint-btn');
      
      if (replayBtn) {
        replayBtn.addEventListener('click', () => this.handleReplay());
      }
      
      if (hintBtn) {
        hintBtn.addEventListener('click', () => this.handleHint());
      }
    }, 100);
    
    // Show tutorial
    this.showTutorial();
  }

  private setupPianoKeys(): void {
    // C4 to C6 (2 octaves)
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const baseFrequency = 261.63; // C4
    
    let whiteKeyX = 50;
    let keyNumber = 0;
    
    for (let octave = 0; octave < 2; octave++) {
      for (let i = 0; i < 12; i++) {
        const note = noteNames[i] + (4 + octave);
        const frequency = baseFrequency * Math.pow(2, (keyNumber / 12));
        const isBlack = note.includes('#');
        
        if (!isBlack) {
          this.keys.push({
            note,
            frequency,
            keyNumber,
            isBlack: false,
            x: whiteKeyX,
            y: 100,
            width: this.whiteKeyWidth,
            height: this.keyHeight,
            isPressed: false
          });
          whiteKeyX += this.whiteKeyWidth;
        }
        
        keyNumber++;
      }
    }
    
    // Add black keys
    keyNumber = 0;
    whiteKeyX = 50;
    
    for (let octave = 0; octave < 2; octave++) {
      for (let i = 0; i < 12; i++) {
        const note = noteNames[i] + (4 + octave);
        const frequency = baseFrequency * Math.pow(2, (keyNumber / 12));
        const isBlack = note.includes('#');
        
        if (isBlack) {
          const prevWhiteKeyX = whiteKeyX - this.whiteKeyWidth;
          this.keys.push({
            note,
            frequency,
            keyNumber,
            isBlack: true,
            x: prevWhiteKeyX + this.whiteKeyWidth - this.blackKeyWidth / 2,
            y: 100,
            width: this.blackKeyWidth,
            height: this.blackKeyHeight,
            isPressed: false
          });
        } else {
          whiteKeyX += this.whiteKeyWidth;
        }
        
        keyNumber++;
      }
    }
    
    // Sort keys so black keys are drawn last
    this.keys.sort((a, b) => (a.isBlack ? 1 : 0) - (b.isBlack ? 1 : 0));
  }

  protected initialize(): void {
    this.currentLevel = 1;
    this.score = 0;
    this.songsCompleted = 0;
    this.mistakes = 0;
    this.combo = 0;
    this.gameOver = false;
    this.particles = [];
    this.hintsRemaining = 3;
    this.isShowingHint = false;
    
    // Load custom songs if any
    this.loadCustomSongs();
    
    // Start with first available song
    this.selectNextSong();
    this.startSong();
  }

  private selectNextSong(): void {
    // Find songs available for current level
    const availableSongs = this.songs.filter(song => song.requiredLevel <= this.currentLevel);
    
    if (availableSongs.length === 0) {
      this.endGame();
      return;
    }
    
    // Select a random song from available ones
    this.currentSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
    this.songIndex = 0;
    this.playerNotes = [];
  }

  private async startSong(): Promise<void> {
    if (!this.currentSong || this.gameOver) return;
    
    this.isShowingPattern = true;
    this.isPlayerTurn = false;
    
    // Start with small segments that gradually increase
    if (this.songIndex === 0) {
      // First time playing this song - start with 2-3 notes for level 1, more for higher levels
      const initialNotes = Math.min(2 + Math.floor(this.currentLevel / 2), 5);
      this.songIndex = Math.min(initialNotes - 1, this.currentSong.notes.length - 1);
    }
    
    // Update UI with song name
    this.updateUI();
    
    // Play the melody
    await this.delay(1000);
    await this.playMelody();
    
    this.isShowingPattern = false;
    this.isPlayerTurn = true;
  }

  private async playMelody(): Promise<void> {
    if (!this.currentSong) return;
    
    for (let i = 0; i <= this.songIndex; i++) {
      if (this.gameOver) return;
      
      const keyNumber = this.currentSong.notes[i];
      await this.playKey(keyNumber, true);
      await this.delay(this.currentSong.tempo);
    }
  }

  private async playKey(keyNumber: number, isAutoPlay: boolean = false): Promise<void> {
    const key = this.keys.find(k => k.keyNumber === keyNumber);
    if (!key) return;
    
    // Visual feedback
    key.isPressed = true;
    this.keyAnimations.set(keyNumber, 1);
    
    // Create particles
    if (isAutoPlay) {
      this.createMusicParticles(key.x + key.width / 2, key.y);
    }
    
    // Play sound
    this.playNote(key.frequency);
    
    // Release key after short duration
    setTimeout(() => {
      key.isPressed = false;
    }, 200);
  }

  private playNote(frequency: number): void {
    if (!this.audioContext || !this.masterGain) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'triangle'; // Softer sound for piano
    
    // ADSR envelope - extended sustain for better clarity
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.1); // Decay/Sustain
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.7); // Extended Release
    
    oscillator.start(now);
    oscillator.stop(now + 0.7); // Extended duration
  }

  private handleMouseDown(event: MouseEvent): void {
    if (!this.canvas || !this.isPlayerTurn || this.gameOver) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check black keys first (they're on top)
    for (let i = this.keys.length - 1; i >= 0; i--) {
      const key = this.keys[i];
      if (x >= key.x && x <= key.x + key.width &&
          y >= key.y && y <= key.y + key.height) {
        this.handleKeyPress(key.keyNumber);
        break;
      }
    }
  }

  private handleMouseUp(): void {
    // Release all keys
    this.keys.forEach(key => key.isPressed = false);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isPlayerTurn || this.gameOver) return;
    
    // Map keyboard to piano keys
    const keyMap: { [key: string]: number } = {
      'a': 0, 's': 2, 'd': 4, 'f': 5, 'g': 7, 'h': 9, 'j': 11, 'k': 12,
      'w': 1, 'e': 3, 't': 6, 'y': 8, 'u': 10, 'o': 13, 'p': 15
    };
    
    const keyNumber = keyMap[event.key.toLowerCase()];
    if (keyNumber !== undefined) {
      this.handleKeyPress(keyNumber);
    }
  }

  private handleKeyUp(): void {
    this.keys.forEach(key => key.isPressed = false);
  }

  private handleKeyPress(keyNumber: number): void {
    if (!this.currentSong || !this.isPlayerTurn) return;
    
    // Play the note
    this.playKey(keyNumber);
    
    // Check if correct
    const expectedNote = this.currentSong.notes[this.playerNotes.length];
    
    if (keyNumber === expectedNote) {
      // Correct note!
      this.playerNotes.push(keyNumber);
      this.combo++;
      
      // Create success particles
      const key = this.keys.find(k => k.keyNumber === keyNumber);
      if (key) {
        this.createParticles(key.x + key.width / 2, key.y, 5, '#4ecdc4', 3);
      }
      
      // Check if completed current segment
      if (this.playerNotes.length > this.songIndex) {
        this.handleSegmentComplete();
      }
    } else {
      // Wrong note
      this.handleMistake();
    }
  }

  private handleSegmentComplete(): void {
    // Increment index more gradually - add 1-2 notes each time
    const increment = this.currentLevel < 5 ? 1 : 2;
    this.songIndex = Math.min(this.songIndex + increment, this.currentSong!.notes.length - 1);
    
    // Calculate score
    const baseScore = 100 * (this.currentSong?.difficulty === 'easy' ? 1 : 
                            this.currentSong?.difficulty === 'medium' ? 2 : 3);
    const comboBonus = this.combo > 5 ? 50 * Math.floor(this.combo / 5) : 0;
    this.updateScore(baseScore + comboBonus);
    
    // Wait a bit before playing success sound so the last note can be heard clearly
    setTimeout(() => {
      // Visual celebration for segment complete
      this.playCorrectSound();
      
      // Show encouraging message
      const messages = this.language === 'ko' ? 
        ['잘했어요!', '훌륭해요!', '완벽해요!', '대단해요!'] :
        ['Great!', 'Awesome!', 'Perfect!', 'Amazing!'];
      const message = messages[Math.floor(Math.random() * messages.length)];
      this.showFloatingText(message, this.config.canvasWidth / 2, 150, '#4ecdc4');
    }, 600); // Wait 600ms after the last note
    
    // Check if song is complete
    if (this.currentSong && this.songIndex >= this.currentSong.notes.length - 1) {
      // Wait longer before handling song complete
      setTimeout(() => this.handleSongComplete(), 1200);
    } else {
      // Continue with next segment
      this.playerNotes = [];
      this.isPlayerTurn = false;
      setTimeout(() => this.startSong(), 2000); // Increased from 1500ms
    }
  }

  private handleSongComplete(): void {
    this.songsCompleted++;
    this.currentLevel++;
    
    // Bonus points for completing song
    this.updateScore(500);
    
    // Play success sound
    this.playSuccessSound();
    
    // Create celebration particles
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const x = Math.random() * this.config.canvasWidth;
        const y = Math.random() * 200 + 100;
        this.createMusicParticles(x, y);
      }, i * 50);
    }
    
    // Check achievements
    this.checkAchievements();
    
    // Select next song
    setTimeout(() => {
      this.selectNextSong();
      this.startSong();
    }, 2000);
  }

  private handleMistake(): void {
    this.mistakes++;
    this.combo = 0;
    
    // Play error sound
    this.playErrorSound();
    
    // Visual feedback
    this.keys.forEach(key => {
      this.createParticles(key.x + key.width / 2, key.y + key.height, 3, '#ff6b6b', 2);
    });
    
    if (this.mistakes >= this.maxMistakes) {
      this.endGame();
    } else {
      // Replay the melody
      this.playerNotes = [];
      this.isPlayerTurn = false;
      setTimeout(() => this.startSong(), 1500);
    }
  }

  private createMusicParticles(x: number, y: number): void {
    const note = this.particleNotes[Math.floor(Math.random() * this.particleNotes.length)];
    const color = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3'][Math.floor(Math.random() * 4)];
    
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 3 - 2,
      life: 1,
      color,
      size: 20
    });
  }

  private checkAchievements(): void {
    // Piano Memory achievements would be added to AchievementSystem
    if (this.songsCompleted >= 5) {
      achievementSystem.checkAchievement('piano-memory-5-songs');
    }
    if (this.currentLevel >= 10) {
      achievementSystem.checkAchievement('piano-memory-level-10');
    }
    if (this.combo >= 20) {
      achievementSystem.checkAchievement('piano-memory-combo-20');
    }
  }

  private playCorrectSound(): void {
    if (!this.audioContext) return;
    
    const notes = [523.25, 659.25]; // C5, E5
    notes.forEach((freq, i) => {
      setTimeout(() => this.playNote(freq), i * 50);
    });
  }
  
  private playSuccessSound(): void {
    if (!this.audioContext) return;
    
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playNote(freq), i * 100);
    });
  }
  
  private showFloatingText(text: string, x: number, y: number, color: string): void {
    // This will be drawn in the draw method
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: -1,
      life: 1,
      color,
      size: 24,
      // Store text in metadata (we'll handle this in draw)
    });
  }

  private playErrorSound(): void {
    if (!this.audioContext || !this.masterGain) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.value = 200;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  protected update(deltaTime: number): void {
    if (this.gameOver) return;
    
    // Update particles
    this.updateParticles(deltaTime, 100);
    
    // Update key animations
    this.keyAnimations.forEach((scale, keyNumber) => {
      const newScale = scale - deltaTime * 3;
      if (newScale <= 0) {
        this.keyAnimations.delete(keyNumber);
      } else {
        this.keyAnimations.set(keyNumber, newScale);
      }
    });
  }

  protected draw(): void {
    if (!this.ctx) return;
    
    // Clear background
    this.drawThemedBackground();
    
    // Draw piano
    this.drawPiano();
    
    // Draw particles
    this.drawParticles();
    
    // Draw UI
    this.drawUI();
  }

  private drawPiano(): void {
    if (!this.ctx) return;
    
    // Draw white keys first
    this.keys.filter(key => !key.isBlack).forEach(key => {
      this.drawKey(key);
    });
    
    // Draw black keys on top
    this.keys.filter(key => key.isBlack).forEach(key => {
      this.drawKey(key);
    });
  }

  private drawKey(key: PianoKey): void {
    if (!this.ctx) return;
    
    const animation = this.keyAnimations.get(key.keyNumber) || 0;
    const yOffset = animation * 5;
    
    // Key color
    if (key.isPressed) {
      this.ctx.fillStyle = this.getThemeColor('primary');
    } else if (key.isBlack) {
      this.ctx.fillStyle = '#2d3436';
    } else {
      this.ctx.fillStyle = '#ffffff';
    }
    
    // Draw key with animation
    this.ctx.fillRect(key.x, key.y - yOffset, key.width, key.height);
    
    // Key border
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(key.x, key.y - yOffset, key.width, key.height);
    
    // Key label (only for white keys)
    if (!key.isBlack && key.keyNumber < 13) {
      this.ctx.fillStyle = key.isPressed ? '#ffffff' : '#666666';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'bottom';
      
      const labels = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K'];
      const whiteKeyIndex = this.keys.filter(k => !k.isBlack && k.keyNumber <= key.keyNumber).length - 1;
      
      if (whiteKeyIndex < labels.length) {
        this.ctx.fillText(labels[whiteKeyIndex], key.x + key.width / 2, key.y + key.height - 10);
      }
    }
  }

  private drawUI(): void {
    if (!this.ctx) return;
    
    const t = this.texts[this.language];
    
    // Song name
    if (this.currentSong) {
      this.ctx.fillStyle = this.getThemeColor('text');
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        this.language === 'ko' ? this.currentSong.name : this.currentSong.nameEn,
        this.config.canvasWidth / 2,
        50
      );
    }
    
    // Status message
    this.ctx.font = '18px Arial';
    this.ctx.fillStyle = this.getThemeColor('textSecondary');
    
    let status = '';
    if (this.isShowingPattern) {
      status = t.listen;
    } else if (this.isPlayerTurn) {
      status = t.yourTurn;
    }
    
    this.ctx.fillText(status, this.config.canvasWidth / 2, 80);
    
    // Progress indicator
    if (this.currentSong) {
      const progress = (this.songIndex + 1) / this.currentSong.notes.length;
      const barWidth = 200;
      const barX = (this.config.canvasWidth - barWidth) / 2;
      
      this.ctx.strokeStyle = this.getThemeColor('primary');
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(barX, 350, barWidth, 10);
      
      this.ctx.fillStyle = this.getThemeColor('success');
      this.ctx.fillRect(barX, 350, barWidth * progress, 10);
    }
  }

  private updateUI(): void {
    const t = this.texts[this.language];
    
    document.getElementById('score')!.textContent = this.score.toString();
    document.getElementById('highscore')!.textContent = this.highScore.toString();
    document.getElementById('level')!.textContent = this.currentLevel.toString();
    document.getElementById('mistakes')!.textContent = '❌'.repeat(this.mistakes);
  }

  private endGame(): void {
    this.gameOver = true;
    
    // Submit to leaderboard
    this.submitScoreToLeaderboard();
    
    const t = this.texts[this.language];
    this.createGameOverlay(t.gameOver, this.score);
  }

  private showTutorial(): void {
    const tutorialConfig: TutorialConfig = {
      gameId: 'piano-memory',
      showOnFirstPlay: true,
      version: 1,
      steps: [
        {
          id: 'welcome',
          title: this.language === 'ko' ? '피아노 메모리에 오신 것을 환영합니다!' : 'Welcome to Piano Memory!',
          description: this.language === 'ko' ?
            '멜로디를 듣고 따라 연주하는 게임입니다.' :
            'Listen to melodies and play them back.',
          position: 'center',
          nextTrigger: 'click'
        },
        {
          id: 'controls',
          title: this.language === 'ko' ? '조작 방법' : 'How to Play',
          description: this.language === 'ko' ?
            '키보드(A~K)나 마우스로 피아노를 연주하세요.' :
            'Use keyboard (A-K) or mouse to play the piano.',
          position: 'bottom',
          nextTrigger: 'click'
        }
      ]
    };
    
    tutorialSystem.startTutorial(tutorialConfig);
  }

  protected createGameHTML(): string {
    const t = this.texts[this.language];
    
    const additionalStats = `
      <div style="text-align: center;">
        <div style="font-size: 16px; color: #666;">${t.level}</div>
        <div id="level" style="font-size: 24px; font-weight: bold;">1</div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 16px; color: #666;">${t.mistakes}</div>
        <div id="mistakes" style="font-size: 24px; font-weight: bold;"></div>
      </div>
    `;
    
    const html = super.createGameHTML(additionalStats);
    
    // Add help buttons after canvas
    const helpButtons = `
      <div style="
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-top: 20px;
      ">
        <button id="replay-btn" style="
          padding: 10px 20px;
          font-size: 16px;
          background: linear-gradient(135deg, #4ecdc4, #44a3aa);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 5px;
        ">
          🔁 ${t.replay}
        </button>
        <button id="hint-btn" style="
          padding: 10px 20px;
          font-size: 16px;
          background: linear-gradient(135deg, #ffe66d, #ffd93d);
          color: #333;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 5px;
        ">
          💡 ${t.hint} (<span id="hints-count">3</span>)
        </button>
      </div>
    `;
    
    return html.replace('</div>', helpButtons + '</div>');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Help functions
  private async handleReplay(): Promise<void> {
    if (!this.isPlayerTurn || this.isShowingPattern || !this.currentSong) return;
    
    this.isPlayerTurn = false;
    this.isShowingPattern = true;
    
    // Play the melody again
    await this.playMelody();
    
    this.isShowingPattern = false;
    this.isPlayerTurn = true;
  }
  
  private async handleHint(): Promise<void> {
    if (!this.isPlayerTurn || this.hintsRemaining <= 0 || !this.currentSong || this.isShowingHint) return;
    
    this.hintsRemaining--;
    this.isShowingHint = true;
    
    // Update hint count display
    const hintsCount = document.getElementById('hints-count');
    if (hintsCount) hintsCount.textContent = this.hintsRemaining.toString();
    
    // Show the next note
    const nextNoteIndex = this.currentSong.notes[this.playerNotes.length];
    const hintKey = this.keys.find(k => k.keyNumber === nextNoteIndex);
    
    if (hintKey) {
      // Visual hint - highlight the key
      hintKey.isPressed = true;
      this.keyAnimations.set(nextNoteIndex, 1.5);
      
      // Create arrow pointing to the key
      this.createHintArrow(hintKey.x + hintKey.width / 2, hintKey.y - 20);
      
      // Play the note softly
      const originalGain = this.masterGain?.gain.value || 0.3;
      if (this.masterGain) this.masterGain.gain.value = 0.1;
      this.playNote(hintKey.frequency);
      if (this.masterGain) this.masterGain.gain.value = originalGain;
      
      // Remove hint after 1 second
      setTimeout(() => {
        hintKey.isPressed = false;
        this.isShowingHint = false;
      }, 1000);
    }
  }
  
  private createHintArrow(x: number, y: number): void {
    // Create downward pointing arrow particles
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: x + (i - 2) * 5,
        y: y - i * 3,
        vx: 0,
        vy: 2,
        life: 0.8,
        color: '#ffe66d',
        size: 8
      });
    }
  }
  
  // Custom songs management
  private loadCustomSongs(): void {
    const customSongsData = localStorage.getItem('piano-memory-custom-songs');
    if (customSongsData) {
      try {
        const customSongs: Song[] = JSON.parse(customSongsData);
        // Add custom songs to the list
        this.songs.push(...customSongs);
      } catch (error) {
        console.error('Failed to load custom songs:', error);
      }
    }
  }
  
  // This would be called from a song editor UI (to be implemented)
  public addCustomSong(song: Song): void {
    // Validate song
    if (!song.id || !song.name || !song.notes || song.notes.length === 0) {
      alert('Invalid song data');
      return;
    }
    
    // Add to songs list
    this.songs.push(song);
    
    // Save to localStorage
    const customSongs = this.songs.filter(s => s.id.startsWith('custom-'));
    localStorage.setItem('piano-memory-custom-songs', JSON.stringify(customSongs));
  }

  protected cleanup(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}