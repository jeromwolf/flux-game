export class MusicGenerator {
  private audioContext: AudioContext;
  private isPlaying: boolean = false;
  private scheduledNotes: Array<OscillatorNode> = [];

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  private createOscillator(frequency: number, startTime: number, duration: number): OscillatorNode {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'square';
    
    // Envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
    
    return oscillator;
  }

  playTutorialTrack(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    const bpm = 120;
    const beatLength = 60 / bpm;
    const startTime = this.audioContext.currentTime;
    
    // C major scale frequencies
    const notes = {
      C4: 261.63,
      D4: 293.66,
      E4: 329.63,
      F4: 349.23,
      G4: 392.00,
      A4: 440.00,
      B4: 493.88,
      C5: 523.25
    };
    
    // Simple melody pattern
    const pattern = [
      { note: notes.C4, time: 0, duration: 0.2 },
      { note: notes.E4, time: 0.5, duration: 0.2 },
      { note: notes.G4, time: 1, duration: 0.2 },
      { note: notes.E4, time: 1.5, duration: 0.2 },
      { note: notes.C4, time: 2, duration: 0.2 },
      { note: notes.E4, time: 2.5, duration: 0.2 },
      { note: notes.G4, time: 3, duration: 0.2 },
      { note: notes.C5, time: 3.5, duration: 0.4 },
    ];
    
    // Play pattern for 60 seconds
    for (let measure = 0; measure < 15; measure++) {
      pattern.forEach(({ note, time, duration }) => {
        const osc = this.createOscillator(
          note,
          startTime + measure * 4 * beatLength + time * beatLength,
          duration
        );
        this.scheduledNotes.push(osc);
      });
    }
  }

  playElectronicBeats(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    const bpm = 140;
    const beatLength = 60 / bpm;
    const startTime = this.audioContext.currentTime;
    
    // Bass and lead frequencies
    const bass = [65.41, 82.41, 98.00, 82.41]; // C2, E2, G2, E2
    const lead = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    // Electronic pattern
    for (let beat = 0; beat < 280; beat++) { // 140 BPM * 2 minutes
      // Bass drum on every beat
      if (beat % 4 === 0) {
        const kick = this.createKick(startTime + beat * beatLength);
      }
      
      // Hi-hat on off-beats
      if (beat % 2 === 1) {
        const hihat = this.createHiHat(startTime + beat * beatLength);
      }
      
      // Bass line
      const bassNote = bass[Math.floor(beat / 4) % bass.length];
      const bassOsc = this.createOscillator(bassNote, startTime + beat * beatLength, beatLength * 0.8);
      this.scheduledNotes.push(bassOsc);
      
      // Lead melody every 8 beats
      if (beat % 8 === 0) {
        const leadNote = lead[Math.floor(beat / 8) % lead.length];
        const leadOsc = this.createOscillator(leadNote, startTime + beat * beatLength, beatLength * 2);
        this.scheduledNotes.push(leadOsc);
      }
    }
  }

  playPopFusion(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    const bpm = 128;
    const beatLength = 60 / bpm;
    const startTime = this.audioContext.currentTime;
    
    // Pop chord progression (C-G-Am-F)
    const chords = [
      [261.63, 329.63, 392.00], // C major
      [392.00, 493.88, 587.33], // G major
      [440.00, 523.25, 659.25], // A minor
      [349.23, 440.00, 523.25]  // F major
    ];
    
    // Play for 90 seconds
    for (let measure = 0; measure < 45; measure++) {
      const chord = chords[measure % 4];
      
      // Play chord
      chord.forEach((frequency, index) => {
        const osc = this.createOscillator(
          frequency,
          startTime + measure * 2 * beatLength + index * 0.05,
          beatLength * 1.5
        );
        this.scheduledNotes.push(osc);
      });
      
      // Add rhythm
      for (let beat = 0; beat < 2; beat++) {
        if (beat === 0) {
          this.createKick(startTime + measure * 2 * beatLength + beat * beatLength);
        }
        this.createHiHat(startTime + measure * 2 * beatLength + beat * beatLength + beatLength * 0.5);
      }
    }
  }

  private createKick(time: number): void {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    osc.start(time);
    osc.stop(time + 0.5);
  }

  private createHiHat(time: number): void {
    const noise = this.audioContext.createBufferSource();
    const noiseBuffer = this.audioContext.createBuffer(1, 4096, this.audioContext.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < 4096; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    noise.buffer = noiseBuffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);
    
    noise.start(time);
    noise.stop(time + 0.05);
  }

  stop(): void {
    this.isPlaying = false;
    this.scheduledNotes.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.scheduledNotes = [];
  }

  getAudioContext(): AudioContext {
    return this.audioContext;
  }
}