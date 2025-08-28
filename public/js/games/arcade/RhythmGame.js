import { BaseGame } from '../../core/BaseGame.js';

export class RhythmGame extends BaseGame {
  constructor(canvasId) {
    super(canvasId);
    
    this.lanes = 4;
    this.notes = [];
    this.currentSong = null;
    this.startTime = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectHits = 0;
    this.goodHits = 0;
    this.missedNotes = 0;
    this.laneWidth = 100;
    this.noteHeight = 20;
    this.noteSpeed = 300;
    this.hitLineY = 500;
    this.judgmentWindow = {
      perfect: 50,
      good: 100,
      miss: 150
    };
    this.nextNoteId = 0;
    this.songEnded = false;
    this.lastNoteTime = 0;
    this.keysPressed = new Set();
    this.laneKeys = ['d', 'f', 'j', 'k'];
    this.particles = [];
    this.hitEffects = [];
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  handleKeyDown(e) {
    if (!this.isRunning || this.isPaused) return;
    
    const key = e.key.toLowerCase();
    if (this.laneKeys.includes(key) && !this.keysPressed.has(key)) {
      this.keysPressed.add(key);
      const lane = this.laneKeys.indexOf(key);
      this.checkHit(lane);
    }
  }

  handleKeyUp(e) {
    const key = e.key.toLowerCase();
    this.keysPressed.delete(key);
  }

  loadSong() {
    const notesPattern = [];
    const bpm = 120;
    const beatInterval = 60000 / bpm;
    
    for (let i = 0; i < 30; i++) {
      const lane = Math.floor(Math.random() * this.lanes);
      const time = i * beatInterval;
      notesPattern.push({ lane, time });
    }
    
    this.currentSong = {
      name: 'Test Song',
      bpm: bpm,
      duration: 30000,
      notes: notesPattern
    };
    
    this.lastNoteTime = Math.max(...notesPattern.map(n => n.time));
  }

  update(deltaTime) {
    if (!this.currentSong || !this.isRunning || this.isPaused) return;
    
    const currentTime = Date.now() - this.startTime;
    
    // Generate notes
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
    
    // Update notes
    this.notes = this.notes.filter(note => {
      const timeDiff = currentTime - note.time;
      note.y = this.hitLineY - (note.time - currentTime) * this.noteSpeed / 1000;
      
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
      
      return note.y < this.canvas.height + 50;
    });
    
    // Update effects
    this.particles = this.particles.filter(p => Date.now() - p.time < 1000);
    this.hitEffects = this.hitEffects.filter(e => Date.now() - e.time < 500);
    
    // Check song end
    if (currentTime > this.lastNoteTime + 3000 && !this.songEnded) {
      this.songEnded = true;
      this.endGame();
    }
  }

  checkHit(lane) {
    const currentTime = Date.now() - this.startTime;
    let hitNote = null;
    let minTimeDiff = Infinity;
    
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
      
      this.hitEffects.push({
        lane: lane,
        time: Date.now(),
        judgment: judgment
      });
      
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

  getLaneX(lane) {
    const totalWidth = this.laneWidth * this.lanes;
    const startX = (this.canvas.width - totalWidth) / 2;
    return startX + lane * this.laneWidth;
  }

  render() {
    // Clear
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw lanes
    for (let i = 0; i < this.lanes; i++) {
      const x = this.getLaneX(i);
      
      this.ctx.fillStyle = i % 2 === 0 ? '#16213e' : '#0f3460';
      this.ctx.fillRect(x, 0, this.laneWidth, this.canvas.height);
      
      this.ctx.strokeStyle = '#e94560';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, 0, this.laneWidth, this.canvas.height);
    }
    
    // Hit line
    this.ctx.fillStyle = '#e94560';
    this.ctx.fillRect(this.getLaneX(0), this.hitLineY - 2, this.laneWidth * this.lanes, 4);
    
    // Hit zones and keys
    for (let i = 0; i < this.lanes; i++) {
      const x = this.getLaneX(i);
      this.ctx.fillStyle = this.keysPressed.has(this.laneKeys[i]) ? 'rgba(233, 69, 96, 0.3)' : 'rgba(233, 69, 96, 0.1)';
      this.ctx.fillRect(x, this.hitLineY - 40, this.laneWidth, 80);
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.laneKeys[i].toUpperCase(), x + this.laneWidth / 2, this.hitLineY + 50);
    }
    
    // Draw notes
    this.notes.forEach(note => {
      if (!note.hit) {
        const x = this.getLaneX(note.lane);
        
        const gradient = this.ctx.createRadialGradient(
          x + this.laneWidth / 2, note.y + this.noteHeight / 2, 0,
          x + this.laneWidth / 2, note.y + this.noteHeight / 2, this.laneWidth / 2
        );
        gradient.addColorStop(0, note.missed ? '#ff4444' : '#00ff88');
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, note.y - 20, this.laneWidth, this.noteHeight + 40);
        
        this.ctx.fillStyle = note.missed ? '#ff4444' : '#00ff88';
        this.ctx.fillRect(x + 10, note.y, this.laneWidth - 20, this.noteHeight);
      }
    });
    
    // Particles
    this.particles.forEach(particle => {
      const age = (Date.now() - particle.time) / 1000;
      const alpha = 1 - age;
      
      this.ctx.fillStyle = particle.type === 'PERFECT' ? `rgba(255, 215, 0, ${alpha})` :
                           particle.type === 'GOOD' ? `rgba(0, 255, 136, ${alpha})` :
                           `rgba(255, 136, 0, ${alpha})`;
      
      const size = 4 * (1 - age);
      this.ctx.fillRect(particle.x - size/2, particle.y - size/2 - age * 100, size, size);
    });
    
    // Hit effects
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
    
    // UI
    this.drawUI();
  }

  drawUI() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.score}`, 20, 40);
    
    if (this.combo > 0) {
      this.ctx.font = 'bold 32px Arial';
      this.ctx.fillStyle = this.combo > 10 ? '#ffd700' : '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${this.combo} COMBO`, this.canvas.width / 2, 100);
    }
    
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Perfect: ${this.perfectHits}`, this.canvas.width - 20, 30);
    this.ctx.fillText(`Good: ${this.goodHits}`, this.canvas.width - 20, 50);
    this.ctx.fillText(`Miss: ${this.missedNotes}`, this.canvas.width - 20, 70);
  }

  start() {
    super.start();
    this.loadSong();
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

  endGame() {
    const accuracy = this.perfectHits + this.goodHits > 0 ? 
      ((this.perfectHits * 100 + this.goodHits * 50) / ((this.perfectHits + this.goodHits + this.missedNotes) * 100) * 100).toFixed(2) : 
      '0';
    
    alert(`Game Over!\n\nScore: ${this.score}\nMax Combo: ${this.maxCombo}\nAccuracy: ${accuracy}%\n\nPerfect: ${this.perfectHits}\nGood: ${this.goodHits}\nMiss: ${this.missedNotes}`);
    
    this.stop();
  }

  stop() {
    super.stop();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}