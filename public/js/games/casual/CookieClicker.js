import { EnhancedBaseGame } from '../../core/EnhancedBaseGame.js';
import SoundManager from '../../common/utils/SoundManager.js';

export class CookieClicker extends EnhancedBaseGame {
    constructor() {
        super({
            id: 'cookieclicker',
            name: '쿠키 클리커',
            description: '쿠키를 클릭해서 포인트를 모으세요!',
            category: 'casual',
            difficulty: 'easy',
            hasAds: true,
            adPlacements: ['start', 'gameover', 'reward']
        });
        
        // 게임 상태
        this.cookies = 0;
        this.cookiesPerClick = 1;
        this.cookiesPerSecond = 0;
        this.totalCookies = 0;
        
        // 업그레이드
        this.upgrades = [
            {
                id: 'cursor',
                name: '커서',
                baseCost: 15,
                cost: 15,
                cps: 0.1,
                owned: 0,
                icon: '👆'
            },
            {
                id: 'grandma',
                name: '할머니',
                baseCost: 100,
                cost: 100,
                cps: 1,
                owned: 0,
                icon: '👵'
            },
            {
                id: 'farm',
                name: '농장',
                baseCost: 1100,
                cost: 1100,
                cps: 8,
                owned: 0,
                icon: '🌾'
            },
            {
                id: 'mine',
                name: '광산',
                baseCost: 12000,
                cost: 12000,
                cps: 47,
                owned: 0,
                icon: '⛏️'
            },
            {
                id: 'factory',
                name: '공장',
                baseCost: 130000,
                cost: 130000,
                cps: 260,
                owned: 0,
                icon: '🏭'
            }
        ];
        
        // 클릭 업그레이드
        this.clickUpgrades = [
            {
                id: 'reinforced',
                name: '강화된 클릭',
                cost: 100,
                multiplier: 2,
                owned: false,
                description: '클릭당 쿠키 2배'
            },
            {
                id: 'golden',
                name: '황금 클릭',
                cost: 1000,
                multiplier: 2,
                owned: false,
                description: '클릭당 쿠키 추가 2배'
            },
            {
                id: 'diamond',
                name: '다이아몬드 클릭',
                cost: 10000,
                multiplier: 3,
                owned: false,
                description: '클릭당 쿠키 추가 3배'
            }
        ];
        
        // 부스터
        this.booster = {
            active: false,
            multiplier: 1,
            duration: 0
        };
        
        // 타이머
        this.lastUpdate = Date.now();
        this.saveTimer = 0;
    }
    
    init() {
        super.init();
        
        // 사운드 초기화
        SoundManager.init();
        SoundManager.registerDefaultSounds();
        
        // 쿠키 클리커 전용 사운드 추가
        this.registerGameSounds();
        
        this.loadGame();
        this.setupUI();
        this.startGameLoop();
    }
    
    registerGameSounds() {
        // 쿠키 클릭 사운드
        SoundManager.createSound('cookie-click', {
            frequencies: [400, 500, 600],
            type: 'sine',
            duration: 0.1,
            volume: 0.2
        });
        
        // 업그레이드 구매
        SoundManager.createSound('upgrade', {
            frequencies: [523, 659, 784, 1047], // C E G C
            type: 'square',
            duration: 0.3,
            volume: 0.3
        });
        
        // 쿠키 생산
        SoundManager.createSound('cookie-produce', {
            frequency: 880,
            type: 'sine',
            duration: 0.05,
            volume: 0.1
        });
    }
    
    setupUI() {
        this.container.innerHTML = `
            <div class="cookie-clicker-game">
                <div class="game-header">
                    <div class="cookie-stats">
                        <div class="stat-item">
                            <span class="stat-label">쿠키</span>
                            <span class="stat-value" id="cookie-count">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">초당</span>
                            <span class="stat-value" id="cps-count">0</span>
                        </div>
                    </div>
                    <button id="booster-btn" class="booster-btn">
                        🚀 부스터 (광고)
                    </button>
                </div>
                
                <div class="game-content">
                    <div class="cookie-area">
                        <div class="cookie-container">
                            <div id="cookie" class="cookie">
                                🍪
                            </div>
                            <div id="click-effects" class="click-effects"></div>
                        </div>
                        <div class="cookie-info">
                            <p>클릭당: <span id="cookies-per-click">1</span> 쿠키</p>
                        </div>
                    </div>
                    
                    <div class="upgrades-area">
                        <div class="upgrades-section">
                            <h3>자동 생산</h3>
                            <div id="auto-upgrades" class="upgrade-list"></div>
                        </div>
                        
                        <div class="upgrades-section">
                            <h3>클릭 강화</h3>
                            <div id="click-upgrades" class="upgrade-list"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.bindEvents();
        this.updateDisplay();
        this.renderUpgrades();
        
        // 버튼 사운드 추가
        setTimeout(() => {
            SoundManager.addButtonSounds(this.container);
        }, 100);
    }
    
    bindEvents() {
        // 쿠키 클릭
        const cookie = document.getElementById('cookie');
        cookie.addEventListener('click', (e) => this.clickCookie(e));
        cookie.addEventListener('mousedown', () => cookie.classList.add('clicked'));
        cookie.addEventListener('mouseup', () => cookie.classList.remove('clicked'));
        cookie.addEventListener('touchstart', (e) => {
            e.preventDefault();
            cookie.classList.add('clicked');
            this.clickCookie(e);
        });
        cookie.addEventListener('touchend', () => cookie.classList.remove('clicked'));
        
        // 부스터 버튼
        document.getElementById('booster-btn').addEventListener('click', () => {
            this.activateBooster();
        });
    }
    
    clickCookie(event) {
        const earned = this.cookiesPerClick * this.booster.multiplier;
        this.cookies += earned;
        this.totalCookies += earned;
        
        // 클릭 효과
        this.showClickEffect(event, earned);
        
        // 사운드 효과
        SoundManager.play('cookie-click');
        
        this.updateDisplay();
    }
    
    showClickEffect(event, amount) {
        const effectsContainer = document.getElementById('click-effects');
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.textContent = `+${this.formatNumber(amount)}`;
        
        // 클릭 위치에 효과 표시
        const rect = event.target.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        
        effectsContainer.appendChild(effect);
        
        // 애니메이션 후 제거
        setTimeout(() => effect.remove(), 1000);
    }
    
    renderUpgrades() {
        // 자동 생산 업그레이드
        const autoContainer = document.getElementById('auto-upgrades');
        autoContainer.innerHTML = this.upgrades.map(upgrade => `
            <div class="upgrade-item ${this.cookies >= upgrade.cost ? 'affordable' : 'locked'}" 
                 data-upgrade-id="${upgrade.id}">
                <div class="upgrade-icon">${upgrade.icon}</div>
                <div class="upgrade-info">
                    <h4>${upgrade.name} (${upgrade.owned})</h4>
                    <p>비용: ${this.formatNumber(upgrade.cost)} 🍪</p>
                    <p>초당 +${upgrade.cps} 쿠키</p>
                </div>
            </div>
        `).join('');
        
        // 클릭 강화 업그레이드
        const clickContainer = document.getElementById('click-upgrades');
        clickContainer.innerHTML = this.clickUpgrades
            .filter(upgrade => !upgrade.owned)
            .map(upgrade => `
                <div class="upgrade-item ${this.cookies >= upgrade.cost ? 'affordable' : 'locked'}" 
                     data-click-upgrade-id="${upgrade.id}">
                    <div class="upgrade-info">
                        <h4>${upgrade.name}</h4>
                        <p>비용: ${this.formatNumber(upgrade.cost)} 🍪</p>
                        <p>${upgrade.description}</p>
                    </div>
                </div>
            `).join('');
        
        // 업그레이드 클릭 이벤트
        autoContainer.querySelectorAll('.upgrade-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.upgradeId;
                this.buyUpgrade(id);
            });
        });
        
        clickContainer.querySelectorAll('.upgrade-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.clickUpgradeId;
                this.buyClickUpgrade(id);
            });
        });
    }
    
    buyUpgrade(id) {
        const upgrade = this.upgrades.find(u => u.id === id);
        if (upgrade && this.cookies >= upgrade.cost) {
            this.cookies -= upgrade.cost;
            upgrade.owned++;
            upgrade.cost = Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.owned));
            
            this.calculateCPS();
            this.updateDisplay();
            this.renderUpgrades();
            
            // 효과음
            this.showPurchaseEffect();
            SoundManager.play('upgrade');
        } else {
            SoundManager.play('fail');
        }
    }
    
    buyClickUpgrade(id) {
        const upgrade = this.clickUpgrades.find(u => u.id === id);
        if (upgrade && !upgrade.owned && this.cookies >= upgrade.cost) {
            this.cookies -= upgrade.cost;
            upgrade.owned = true;
            this.cookiesPerClick *= upgrade.multiplier;
            
            this.updateDisplay();
            this.renderUpgrades();
            
            // 효과음
            this.showPurchaseEffect();
            SoundManager.play('upgrade');
        } else if (upgrade && this.cookies < upgrade.cost) {
            SoundManager.play('fail');
        }
    }
    
    showPurchaseEffect() {
        const cookie = document.getElementById('cookie');
        cookie.classList.add('purchase-effect');
        setTimeout(() => cookie.classList.remove('purchase-effect'), 500);
    }
    
    calculateCPS() {
        this.cookiesPerSecond = this.upgrades.reduce((total, upgrade) => {
            return total + (upgrade.cps * upgrade.owned);
        }, 0);
    }
    
    async activateBooster() {
        if (this.booster.active) return;
        
        try {
            const result = await this.showRewardAd('30초 동안 생산량 5배');
            if (result) {
                this.booster.active = true;
                this.booster.multiplier = 5;
                this.booster.duration = 30;
                
                document.getElementById('booster-btn').disabled = true;
                document.getElementById('booster-btn').textContent = `부스터 활성 (${this.booster.duration}초)`;
            }
        } catch (err) {
            console.log('Booster ad cancelled');
        }
    }
    
    updateDisplay() {
        document.getElementById('cookie-count').textContent = this.formatNumber(Math.floor(this.cookies));
        document.getElementById('cps-count').textContent = this.formatNumber(this.cookiesPerSecond) + '/초';
        document.getElementById('cookies-per-click').textContent = this.formatNumber(this.cookiesPerClick);
    }
    
    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return Math.floor(num).toString();
    }
    
    gameLoop() {
        const now = Date.now();
        const delta = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        
        // 쿠키 자동 생산
        if (this.cookiesPerSecond > 0) {
            const production = this.cookiesPerSecond * delta * this.booster.multiplier;
            this.cookies += production;
            this.totalCookies += production;
        }
        
        // 부스터 업데이트
        if (this.booster.active) {
            this.booster.duration -= delta;
            if (this.booster.duration <= 0) {
                this.booster.active = false;
                this.booster.multiplier = 1;
                document.getElementById('booster-btn').disabled = false;
                document.getElementById('booster-btn').textContent = '🚀 부스터 (광고)';
            } else {
                document.getElementById('booster-btn').textContent = 
                    `부스터 활성 (${Math.ceil(this.booster.duration)}초)`;
            }
        }
        
        // 자동 저장 (5초마다)
        this.saveTimer += delta;
        if (this.saveTimer >= 5) {
            this.saveGame();
            this.saveTimer = 0;
        }
        
        this.updateDisplay();
    }
    
    startGameLoop() {
        const loop = () => {
            if (this.isActive) {
                this.gameLoop();
                requestAnimationFrame(loop);
            }
        };
        loop();
    }
    
    saveGame() {
        const saveData = {
            cookies: this.cookies,
            cookiesPerClick: this.cookiesPerClick,
            totalCookies: this.totalCookies,
            upgrades: this.upgrades,
            clickUpgrades: this.clickUpgrades,
            timestamp: Date.now()
        };
        
        localStorage.setItem('cookieclicker_save', JSON.stringify(saveData));
    }
    
    loadGame() {
        const saved = localStorage.getItem('cookieclicker_save');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.cookies = data.cookies || 0;
                this.cookiesPerClick = data.cookiesPerClick || 1;
                this.totalCookies = data.totalCookies || 0;
                
                if (data.upgrades) {
                    data.upgrades.forEach((saved, i) => {
                        if (this.upgrades[i]) {
                            this.upgrades[i].owned = saved.owned;
                            this.upgrades[i].cost = saved.cost;
                        }
                    });
                }
                
                if (data.clickUpgrades) {
                    data.clickUpgrades.forEach((saved, i) => {
                        if (this.clickUpgrades[i]) {
                            this.clickUpgrades[i].owned = saved.owned;
                        }
                    });
                }
                
                this.calculateCPS();
                
                // 오프라인 보상 계산
                if (data.timestamp) {
                    const offlineTime = (Date.now() - data.timestamp) / 1000;
                    const offlineProduction = Math.min(offlineTime * this.cookiesPerSecond * 0.1, this.cookiesPerSecond * 3600);
                    if (offlineProduction > 0) {
                        this.cookies += offlineProduction;
                        this.showOfflineReward(offlineProduction);
                    }
                }
            } catch (err) {
                console.error('Failed to load save:', err);
            }
        }
    }
    
    showOfflineReward(amount) {
        setTimeout(() => {
            alert(`오프라인 보상: ${this.formatNumber(amount)} 쿠키를 획득했습니다!`);
        }, 1000);
    }
    
    cleanup() {
        super.cleanup();
        this.saveGame();
    }
}