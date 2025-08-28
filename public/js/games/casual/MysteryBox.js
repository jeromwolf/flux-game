import { EnhancedBaseGame } from '../../core/EnhancedBaseGame.js';
import SoundManager from '../../common/utils/SoundManager.js';

export class MysteryBox extends EnhancedBaseGame {
    constructor() {
        super({
            id: 'mysterybox',
            name: '미스터리 박스',
            description: '무엇이 들어있을까? 호기심을 참을 수 없다면 열어보세요!',
            category: 'casual',
            difficulty: 'easy',
            hasAds: true,
            adPlacements: ['start', 'reward']
        });
        
        // 게임 상태
        this.coins = 100; // 시작 코인
        this.keys = 3; // 시작 열쇠
        this.totalOpened = 0;
        this.streak = 0;
        this.multiplier = 1;
        
        // 박스 타입과 확률
        this.boxTypes = [
            {
                id: 'common',
                name: '일반 상자',
                color: '#95a5a6',
                cost: 10,
                keyRequired: false,
                minReward: 5,
                maxReward: 30,
                probability: 1
            },
            {
                id: 'rare',
                name: '희귀 상자',
                color: '#3498db',
                cost: 50,
                keyRequired: false,
                minReward: 40,
                maxReward: 150,
                probability: 0.7
            },
            {
                id: 'epic',
                name: '에픽 상자',
                color: '#9b59b6',
                cost: 200,
                keyRequired: false,
                minReward: 180,
                maxReward: 600,
                probability: 0.4
            },
            {
                id: 'legendary',
                name: '전설 상자',
                color: '#f39c12',
                cost: 1000,
                keyRequired: true,
                minReward: 1500,
                maxReward: 5000,
                probability: 0.1
            },
            {
                id: 'mystery',
                name: '??? 상자',
                color: '#e74c3c',
                cost: '???',
                keyRequired: true,
                special: true,
                probability: 0.05
            }
        ];
        
        // 특별 보상
        this.specialRewards = [
            { type: 'multiplier', value: 2, duration: 60, name: '2배 보너스' },
            { type: 'key', value: 1, name: '황금 열쇠' },
            { type: 'key', value: 3, name: '열쇠 묶음' },
            { type: 'jackpot', value: 10000, name: '잭팟!' },
            { type: 'box_rain', value: 5, name: '상자 비' },
            { type: 'nothing', value: 0, name: '꽝...' },
            { type: 'steal', value: -100, name: '도둑이다!' },
            { type: 'mystery_egg', value: '?', name: '신비한 알' }
        ];
        
        // 상자 애니메이션 상태
        this.currentBoxes = [];
        this.shakingBox = null;
        this.openingBox = null;
        this.particles = [];
        
        // 업적
        this.achievements = {
            firstOpen: { name: '첫 상자', desc: '첫 번째 상자를 열었습니다', unlocked: false },
            lucky7: { name: '럭키 7', desc: '7번 연속으로 이익을 봤습니다', unlocked: false },
            millionaire: { name: '백만장자', desc: '100만 코인을 모았습니다', unlocked: false },
            boxAddict: { name: '상자 중독', desc: '100개의 상자를 열었습니다', unlocked: false },
            mysteryHunter: { name: '미스터리 헌터', desc: '??? 상자를 열었습니다', unlocked: false }
        };
        
        // 사운드 (나중에 추가)
        this.sounds = {
            shake: null,
            open: null,
            coin: null,
            special: null
        };
    }
    
    init() {
        super.init();
        
        // 사운드 초기화
        SoundManager.init();
        SoundManager.registerDefaultSounds();
        
        this.loadGameData();
        this.setupUI();
        this.spawnBoxes();
        this.startAnimationLoop();
    }
    
    setupUI() {
        this.container.innerHTML = `
            <div class="mystery-box-game">
                <div class="game-header">
                    <div class="stats">
                        <div class="stat">
                            <span class="stat-icon">💰</span>
                            <span class="stat-value" id="coin-count">${this.coins}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-icon">🔑</span>
                            <span class="stat-value" id="key-count">${this.keys}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-icon">🔥</span>
                            <span class="stat-value" id="streak-count">${this.streak}</span>
                        </div>
                    </div>
                    
                    <div class="actions">
                        <button class="action-btn" id="shop-btn">
                            🏪 상점
                        </button>
                        <button class="action-btn" id="free-key-btn">
                            🎁 무료 열쇠 (광고)
                        </button>
                    </div>
                </div>
                
                <div class="game-area">
                    <div id="box-container" class="box-container">
                        <!-- 상자들이 여기에 표시됩니다 -->
                    </div>
                    
                    <div id="reward-popup" class="reward-popup hidden">
                        <div class="reward-content">
                            <h2 id="reward-title">보상!</h2>
                            <div id="reward-icon" class="reward-icon">🎁</div>
                            <p id="reward-text">+100 코인</p>
                            <button id="reward-ok" class="btn-primary">확인</button>
                        </div>
                    </div>
                    
                    <div id="hint-area" class="hint-area">
                        <p id="hint-text">상자를 클릭해서 흔들어보세요. 뭔가 들어있을지도?</p>
                    </div>
                </div>
                
                <div class="bottom-panel">
                    <div class="achievements">
                        <h3>🏆 업적</h3>
                        <div id="achievement-list" class="achievement-list"></div>
                    </div>
                    
                    <div class="shop hidden" id="shop-panel">
                        <h3>🏪 상점</h3>
                        <div class="shop-items">
                            <div class="shop-item" data-item="key">
                                <span class="item-icon">🔑</span>
                                <span class="item-name">열쇠</span>
                                <span class="item-cost">100 💰</span>
                                <button class="buy-btn">구매</button>
                            </div>
                            <div class="shop-item" data-item="key-pack">
                                <span class="item-icon">🔑x5</span>
                                <span class="item-name">열쇠 팩</span>
                                <span class="item-cost">400 💰</span>
                                <button class="buy-btn">구매</button>
                            </div>
                            <div class="shop-item" data-item="magnet">
                                <span class="item-icon">🧲</span>
                                <span class="item-name">행운의 자석</span>
                                <span class="item-cost">1000 💰</span>
                                <button class="buy-btn">구매</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.bindEvents();
        this.updateDisplay();
        this.renderAchievements();
        
        // 버튼 사운드 추가
        setTimeout(() => {
            SoundManager.addButtonSounds(this.container);
        }, 100);
    }
    
    bindEvents() {
        // 상점 토글
        document.getElementById('shop-btn').addEventListener('click', () => {
            document.getElementById('shop-panel').classList.toggle('hidden');
        });
        
        // 무료 열쇠 (광고)
        document.getElementById('free-key-btn').addEventListener('click', async () => {
            try {
                await this.showRewardAd('열쇠 1개');
                this.keys++;
                this.updateDisplay();
                this.showReward('key', 1, '무료 열쇠 획득!');
            } catch (err) {
                console.log('광고 시청 취소');
            }
        });
        
        // 보상 팝업 확인
        document.getElementById('reward-ok').addEventListener('click', () => {
            document.getElementById('reward-popup').classList.add('hidden');
        });
        
        // 상점 구매
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.shop-item').dataset.item;
                this.buyItem(item);
            });
        });
    }
    
    spawnBoxes() {
        const container = document.getElementById('box-container');
        container.innerHTML = '';
        this.currentBoxes = [];
        
        // 3-5개의 랜덤 상자 생성
        const boxCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < boxCount; i++) {
            const boxType = this.selectRandomBox();
            const box = this.createBox(boxType);
            container.appendChild(box.element);
            this.currentBoxes.push(box);
        }
    }
    
    selectRandomBox() {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const box of this.boxTypes) {
            cumulative += box.probability / 3; // 확률 조정
            if (rand < cumulative) {
                return box;
            }
        }
        
        return this.boxTypes[0]; // 기본값
    }
    
    createBox(type) {
        const element = document.createElement('div');
        element.className = 'mystery-box';
        element.style.backgroundColor = type.color;
        
        // 랜덤 위치
        const x = 10 + Math.random() * 80;
        const y = 10 + Math.random() * 60;
        element.style.left = `${x}%`;
        element.style.top = `${y}%`;
        
        // 상자 내용
        element.innerHTML = `
            <div class="box-glow"></div>
            <div class="box-content">
                <div class="box-icon">📦</div>
                <div class="box-info">
                    <p class="box-name">${type.name}</p>
                    <p class="box-cost">${type.cost} 💰${type.keyRequired ? ' + 🔑' : ''}</p>
                </div>
            </div>
            <div class="box-shake-hint">클릭!</div>
        `;
        
        const box = {
            element,
            type,
            x,
            y,
            shakeCount: 0,
            isShaking: false,
            isOpening: false
        };
        
        // 클릭 이벤트
        element.addEventListener('click', () => this.handleBoxClick(box));
        
        // 호버 효과
        element.addEventListener('mouseenter', () => {
            if (!box.isOpening) {
                element.classList.add('hover');
            }
        });
        
        element.addEventListener('mouseleave', () => {
            element.classList.remove('hover');
        });
        
        return box;
    }
    
    handleBoxClick(box) {
        if (box.isOpening) return;
        
        if (!box.isShaking) {
            // 첫 클릭 - 흔들기 시작
            SoundManager.play('click');
            this.startShaking(box);
        } else if (box.shakeCount >= 3) {
            // 충분히 흔들었으면 열기 시도
            this.tryOpenBox(box);
        }
    }
    
    startShaking(box) {
        box.isShaking = true;
        box.element.classList.add('shaking');
        this.shakingBox = box;
        
        // 흔들 때마다 카운트 증가
        const shakeInterval = setInterval(() => {
            box.shakeCount++;
            SoundManager.play('shake');
            
            // 힌트 업데이트
            this.updateHint(box);
            
            // 파티클 효과
            if (box.shakeCount % 2 === 0) {
                this.createShakeParticles(box);
            }
            
            if (box.shakeCount >= 5) {
                clearInterval(shakeInterval);
                box.element.classList.add('ready');
                box.element.querySelector('.box-shake-hint').textContent = '열기!';
            }
        }, 500);
    }
    
    updateHint(box) {
        const hints = [
            '뭔가 들어있는 것 같아요...',
            '무거운 것 같기도 하고...',
            '소리가 나는 것 같기도?',
            '거의 다 됐어요!',
            '이제 열 수 있을 것 같아요!'
        ];
        
        document.getElementById('hint-text').textContent = hints[Math.min(box.shakeCount - 1, hints.length - 1)];
    }
    
    tryOpenBox(box) {
        const cost = typeof box.type.cost === 'number' ? box.type.cost : 500;
        
        // 비용 확인
        if (this.coins < cost) {
            SoundManager.play('fail');
            this.showMessage('코인이 부족합니다!', 'error');
            return;
        }
        
        // 열쇠 확인
        if (box.type.keyRequired && this.keys < 1) {
            SoundManager.play('fail');
            this.showMessage('열쇠가 필요합니다!', 'error');
            return;
        }
        
        // 비용 차감
        this.coins -= cost;
        if (box.type.keyRequired) {
            this.keys--;
        }
        
        // 상자 열기
        this.openBox(box);
    }
    
    openBox(box) {
        box.isOpening = true;
        box.element.classList.add('opening');
        this.openingBox = box;
        
        // 열기 사운드
        SoundManager.play('open');
        
        // 열기 애니메이션
        setTimeout(() => {
            // 보상 결정
            const reward = this.calculateReward(box);
            
            // 폭발 효과
            this.createExplosionParticles(box, reward);
            
            // 보상 표시
            this.showReward(reward.type, reward.value, reward.text);
            
            // 상자 제거
            setTimeout(() => {
                box.element.remove();
                this.currentBoxes = this.currentBoxes.filter(b => b !== box);
                
                // 모든 상자를 열었으면 새로 생성
                if (this.currentBoxes.length === 0) {
                    setTimeout(() => {
                        SoundManager.play('success');
                        this.spawnBoxes();
                    }, 1000);
                }
            }, 500);
            
            // 통계 업데이트
            this.totalOpened++;
            this.checkAchievements();
            this.updateDisplay();
            this.saveGameData();
        }, 1000);
    }
    
    calculateReward(box) {
        if (box.type.special) {
            // 특별 상자는 랜덤 특별 보상
            const special = this.specialRewards[Math.floor(Math.random() * this.specialRewards.length)];
            return this.processSpecialReward(special);
        } else {
            // 일반 보상 (코인)
            const min = box.type.minReward;
            const max = box.type.maxReward;
            const baseReward = Math.floor(min + Math.random() * (max - min));
            const finalReward = Math.floor(baseReward * this.multiplier);
            
            this.coins += finalReward;
            
            // 연속 보상 체크
            if (finalReward > box.type.cost) {
                this.streak++;
            } else {
                this.streak = 0;
            }
            
            return {
                type: 'coin',
                value: finalReward,
                text: `+${finalReward} 코인`
            };
        }
    }
    
    processSpecialReward(special) {
        switch (special.type) {
            case 'multiplier':
                this.multiplier = special.value;
                setTimeout(() => {
                    this.multiplier = 1;
                    this.updateDisplay();
                }, special.duration * 1000);
                return {
                    type: 'special',
                    value: special.value,
                    text: `${special.name} (${special.duration}초)`
                };
                
            case 'key':
                this.keys += special.value;
                return {
                    type: 'key',
                    value: special.value,
                    text: special.name
                };
                
            case 'jackpot':
                this.coins += special.value;
                return {
                    type: 'jackpot',
                    value: special.value,
                    text: `💰 ${special.name} +${special.value} 🪙`
                };
                
            case 'box_rain':
                setTimeout(() => {
                    for (let i = 0; i < special.value; i++) {
                        setTimeout(() => {
                            const freeBox = this.createBox(this.boxTypes[0]);
                            freeBox.type.cost = 0; // 무료!
                            document.getElementById('box-container').appendChild(freeBox.element);
                            this.currentBoxes.push(freeBox);
                        }, i * 200);
                    }
                }, 500);
                return {
                    type: 'special',
                    value: special.value,
                    text: `${special.name} - ${special.value}개의 무료 상자!`
                };
                
            case 'nothing':
                return {
                    type: 'nothing',
                    value: 0,
                    text: '😅 ' + special.name
                };
                
            case 'steal':
                this.coins = Math.max(0, this.coins + special.value);
                return {
                    type: 'bad',
                    value: special.value,
                    text: `😱 ${special.name} ${special.value} 🪙`
                };
                
            case 'mystery_egg':
                // 미스터리 알은 나중에 부화
                this.showMessage('신비한 알을 발견했습니다! 무엇이 나올까요?', 'mystery');
                return {
                    type: 'mystery',
                    value: '?',
                    text: '🥚 ' + special.name
                };
                
            default:
                return {
                    type: 'coin',
                    value: 100,
                    text: '+100 코인'
                };
        }
    }
    
    showReward(type, value, text) {
        const popup = document.getElementById('reward-popup');
        const title = document.getElementById('reward-title');
        const icon = document.getElementById('reward-icon');
        const rewardText = document.getElementById('reward-text');
        
        // 타입별 표시
        switch (type) {
            case 'coin':
                title.textContent = '코인 획득!';
                icon.textContent = '💰';
                SoundManager.play('coin');
                break;
            case 'key':
                title.textContent = '열쇠 획득!';
                icon.textContent = '🔑';
                SoundManager.play('success');
                break;
            case 'jackpot':
                title.textContent = '대박!!!';
                icon.textContent = '💰';
                icon.classList.add('jackpot-animation');
                SoundManager.play('jackpot');
                break;
            case 'special':
                title.textContent = '특별 보상!';
                icon.textContent = '✨';
                SoundManager.play('levelup');
                break;
            case 'mystery':
                title.textContent = '미스터리!';
                icon.textContent = '❓';
                SoundManager.play('success');
                break;
            case 'bad':
                title.textContent = '이런...';
                icon.textContent = '😭';
                SoundManager.play('fail');
                break;
            case 'nothing':
                title.textContent = '꽝!';
                icon.textContent = '💨';
                SoundManager.play('fail');
                break;
        }
        
        rewardText.textContent = text;
        popup.classList.remove('hidden');
        
        // 자동으로 닫기
        setTimeout(() => {
            popup.classList.add('hidden');
            icon.classList.remove('jackpot-animation');
        }, 3000);
    }
    
    createShakeParticles(box) {
        for (let i = 0; i < 3; i++) {
            const particle = {
                x: box.x + (Math.random() - 0.5) * 10,
                y: box.y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 2,
                life: 1,
                color: box.type.color
            };
            this.particles.push(particle);
        }
    }
    
    createExplosionParticles(box, reward) {
        const colors = {
            coin: ['#FFD700', '#FFA500', '#FF6347'],
            key: ['#FFD700', '#C0C0C0', '#CD7F32'],
            jackpot: ['#FFD700', '#FF1493', '#00CED1', '#32CD32'],
            special: ['#FF69B4', '#9370DB', '#00BFFF'],
            mystery: ['#8A2BE2', '#FF1493', '#00CED1'],
            bad: ['#DC143C', '#8B0000', '#FF6347'],
            nothing: ['#708090', '#A9A9A9', '#C0C0C0']
        };
        
        const particleColors = colors[reward.type] || colors.coin;
        
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 3 + Math.random() * 3;
            const particle = {
                x: box.x,
                y: box.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: particleColors[Math.floor(Math.random() * particleColors.length)]
            };
            this.particles.push(particle);
        }
    }
    
    buyItem(item) {
        const costs = {
            key: 100,
            'key-pack': 400,
            magnet: 1000
        };
        
        const cost = costs[item];
        if (this.coins < cost) {
            this.showMessage('코인이 부족합니다!', 'error');
            return;
        }
        
        this.coins -= cost;
        
        switch (item) {
            case 'key':
                this.keys += 1;
                SoundManager.play('coin');
                this.showMessage('열쇠를 구매했습니다!', 'success');
                break;
            case 'key-pack':
                this.keys += 5;
                SoundManager.play('coin');
                this.showMessage('열쇠 5개를 구매했습니다!', 'success');
                break;
            case 'magnet':
                this.multiplier = 1.5;
                SoundManager.play('levelup');
                this.showMessage('행운의 자석 활성화! (영구 1.5배)', 'success');
                break;
        }
        
        this.updateDisplay();
        this.saveGameData();
    }
    
    showMessage(text, type = 'info') {
        const hint = document.getElementById('hint-text');
        hint.textContent = text;
        hint.className = `hint-${type}`;
        
        setTimeout(() => {
            hint.className = '';
        }, 3000);
    }
    
    updateDisplay() {
        document.getElementById('coin-count').textContent = this.coins;
        document.getElementById('key-count').textContent = this.keys;
        document.getElementById('streak-count').textContent = this.streak;
        
        if (this.multiplier > 1) {
            document.getElementById('streak-count').textContent += ` x${this.multiplier}`;
        }
    }
    
    checkAchievements() {
        // 첫 상자
        if (this.totalOpened === 1 && !this.achievements.firstOpen.unlocked) {
            this.unlockAchievement('firstOpen');
        }
        
        // 럭키 7
        if (this.streak >= 7 && !this.achievements.lucky7.unlocked) {
            this.unlockAchievement('lucky7');
        }
        
        // 백만장자
        if (this.coins >= 1000000 && !this.achievements.millionaire.unlocked) {
            this.unlockAchievement('millionaire');
        }
        
        // 상자 중독
        if (this.totalOpened >= 100 && !this.achievements.boxAddict.unlocked) {
            this.unlockAchievement('boxAddict');
        }
    }
    
    unlockAchievement(id) {
        this.achievements[id].unlocked = true;
        this.showMessage(`🏆 업적 달성: ${this.achievements[id].name}`, 'achievement');
        this.renderAchievements();
        
        // 업적 달성 사운드
        SoundManager.play('levelup');
        
        // 보상
        this.coins += 500;
        this.updateDisplay();
    }
    
    renderAchievements() {
        const list = document.getElementById('achievement-list');
        list.innerHTML = '';
        
        for (const [id, achievement] of Object.entries(this.achievements)) {
            const item = document.createElement('div');
            item.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
            item.innerHTML = `
                <span class="achievement-icon">${achievement.unlocked ? '🏆' : '🔒'}</span>
                <div class="achievement-info">
                    <p class="achievement-name">${achievement.name}</p>
                    <p class="achievement-desc">${achievement.desc}</p>
                </div>
            `;
            list.appendChild(item);
        }
    }
    
    startAnimationLoop() {
        const animate = () => {
            if (!this.isActive) return;
            
            // 파티클 업데이트
            this.particles = this.particles.filter(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.2; // 중력
                particle.life -= 0.02;
                
                return particle.life > 0;
            });
            
            // 파티클 렌더링 (CSS로 처리)
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    saveGameData() {
        const data = {
            coins: this.coins,
            keys: this.keys,
            totalOpened: this.totalOpened,
            achievements: this.achievements,
            multiplier: this.multiplier
        };
        
        localStorage.setItem('mysterybox_save', JSON.stringify(data));
    }
    
    loadGameData() {
        const saved = localStorage.getItem('mysterybox_save');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.coins = data.coins || 100;
                this.keys = data.keys || 3;
                this.totalOpened = data.totalOpened || 0;
                this.achievements = data.achievements || this.achievements;
                this.multiplier = data.multiplier || 1;
            } catch (err) {
                console.error('Failed to load save:', err);
            }
        }
    }
    
    cleanup() {
        super.cleanup();
        this.saveGameData();
    }
}