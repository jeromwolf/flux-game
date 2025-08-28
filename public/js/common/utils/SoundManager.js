/**
 * 사운드 매니저 - 게임 사운드 효과 관리
 */
export class SoundManager {
    constructor() {
        if (SoundManager.instance) {
            return SoundManager.instance;
        }
        
        this.sounds = new Map();
        this.enabled = true;
        this.volume = 0.5;
        this.context = null;
        
        // 사용자 설정 로드
        this.loadSettings();
        
        SoundManager.instance = this;
    }
    
    /**
     * AudioContext 초기화 (사용자 인터랙션 필요)
     */
    async init() {
        if (this.context) return;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            console.log('SoundManager initialized');
        } catch (error) {
            console.error('Failed to initialize AudioContext:', error);
        }
    }
    
    /**
     * 사운드 생성 및 등록
     */
    createSound(id, options = {}) {
        const sound = {
            id,
            frequency: options.frequency || 440,
            type: options.type || 'sine',
            duration: options.duration || 0.2,
            volume: options.volume || 1,
            attack: options.attack || 0.01,
            decay: options.decay || 0.1,
            ...options
        };
        
        this.sounds.set(id, sound);
        return sound;
    }
    
    /**
     * 미리 정의된 사운드 효과들
     */
    registerDefaultSounds() {
        // 클릭 사운드
        this.createSound('click', {
            frequency: 600,
            type: 'sine',
            duration: 0.1,
            volume: 0.3
        });
        
        // 성공 사운드
        this.createSound('success', {
            frequencies: [523, 659, 784], // C, E, G
            type: 'sine',
            duration: 0.3,
            volume: 0.4
        });
        
        // 실패 사운드
        this.createSound('fail', {
            frequency: 200,
            type: 'sawtooth',
            duration: 0.3,
            volume: 0.3
        });
        
        // 코인 사운드
        this.createSound('coin', {
            frequencies: [1047, 1319], // High C, E
            type: 'square',
            duration: 0.15,
            volume: 0.2
        });
        
        // 상자 흔들기
        this.createSound('shake', {
            frequency: 150,
            type: 'triangle',
            duration: 0.1,
            volume: 0.2,
            vibrato: true
        });
        
        // 상자 열기
        this.createSound('open', {
            frequencies: [400, 600, 800, 1000],
            type: 'sine',
            duration: 0.5,
            volume: 0.3
        });
        
        // 잭팟
        this.createSound('jackpot', {
            frequencies: [523, 659, 784, 1047], // C major arpeggio
            type: 'sine',
            duration: 1,
            volume: 0.5,
            repeat: 2
        });
        
        // 레벨업
        this.createSound('levelup', {
            frequencies: [523, 587, 659, 698, 784], // C D E F G
            type: 'sine',
            duration: 0.8,
            volume: 0.4
        });
        
        // 경고
        this.createSound('warning', {
            frequency: 440,
            type: 'sawtooth',
            duration: 0.2,
            volume: 0.3,
            repeat: 2
        });
        
        // 버튼 호버
        this.createSound('hover', {
            frequency: 800,
            type: 'sine',
            duration: 0.05,
            volume: 0.1
        });
    }
    
    /**
     * 사운드 재생
     */
    play(soundId, options = {}) {
        if (!this.enabled || !this.context) return;
        
        const sound = this.sounds.get(soundId);
        if (!sound) {
            console.warn(`Sound '${soundId}' not found`);
            return;
        }
        
        // 다중 주파수 처리
        if (sound.frequencies) {
            this.playChord(sound, options);
        } else {
            this.playNote(sound, options);
        }
    }
    
    /**
     * 단일 음 재생
     */
    playNote(sound, options = {}) {
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.type = sound.type;
        oscillator.frequency.value = options.frequency || sound.frequency;
        
        // 볼륨 설정
        const volume = (options.volume || sound.volume) * this.volume;
        gainNode.gain.value = 0;
        
        // ADSR 엔벨로프
        const now = this.context.currentTime;
        const attack = sound.attack;
        const duration = options.duration || sound.duration;
        
        gainNode.gain.linearRampToValueAtTime(volume, now + attack);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        // 비브라토 효과
        if (sound.vibrato) {
            const vibrato = this.context.createOscillator();
            const vibratoGain = this.context.createGain();
            vibrato.frequency.value = 5;
            vibratoGain.gain.value = 10;
            vibrato.connect(vibratoGain);
            vibratoGain.connect(oscillator.frequency);
            vibrato.start(now);
            vibrato.stop(now + duration);
        }
        
        // 연결
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        // 재생
        oscillator.start(now);
        oscillator.stop(now + duration);
        
        // 반복
        if (sound.repeat && sound.repeat > 1) {
            for (let i = 1; i < sound.repeat; i++) {
                setTimeout(() => {
                    this.playNote(sound, options);
                }, i * (duration * 1000 + 50));
            }
        }
    }
    
    /**
     * 화음 재생
     */
    playChord(sound, options = {}) {
        const duration = options.duration || sound.duration;
        const delay = duration / sound.frequencies.length;
        
        sound.frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playNote({
                    ...sound,
                    frequency: freq,
                    duration: duration - (delay * index)
                }, options);
            }, index * delay * 1000 * 0.5);
        });
    }
    
    /**
     * 커스텀 멜로디 재생
     */
    playMelody(notes, tempo = 120) {
        if (!this.enabled || !this.context) return;
        
        const beatDuration = 60 / tempo;
        let currentTime = 0;
        
        notes.forEach(note => {
            setTimeout(() => {
                if (note.frequency) {
                    this.playNote({
                        frequency: note.frequency,
                        type: note.type || 'sine',
                        duration: note.duration * beatDuration || beatDuration,
                        volume: note.volume || 0.3
                    });
                }
            }, currentTime * 1000);
            
            currentTime += note.duration || 1;
        });
    }
    
    /**
     * 사운드 활성화/비활성화
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        this.saveSettings();
    }
    
    /**
     * 볼륨 설정
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }
    
    /**
     * 설정 저장
     */
    saveSettings() {
        localStorage.setItem('sound_settings', JSON.stringify({
            enabled: this.enabled,
            volume: this.volume
        }));
    }
    
    /**
     * 설정 불러오기
     */
    loadSettings() {
        const saved = localStorage.getItem('sound_settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.enabled = settings.enabled !== false;
                this.volume = settings.volume || 0.5;
            } catch (err) {
                console.error('Failed to load sound settings:', err);
            }
        }
    }
    
    /**
     * 버튼에 사운드 자동 추가
     */
    addButtonSounds(container = document) {
        // 클릭 사운드
        container.querySelectorAll('button, .btn, .game-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.play('click');
            });
            
            btn.addEventListener('mouseenter', () => {
                this.play('hover');
            });
        });
    }
}

// 싱글톤 인스턴스
export default new SoundManager();