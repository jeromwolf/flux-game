import { EnhancedBaseGame } from '../../core/EnhancedBaseGame.js';
import SoundManager from '../../common/utils/SoundManager.js';

export class Minesweeper extends EnhancedBaseGame {
    constructor() {
        super({
            id: 'minesweeper',
            name: '지뢰찾기',
            description: '숨겨진 지뢰를 피해 모든 안전한 칸을 찾으세요',
            category: 'puzzle',
            difficulty: 'medium',
            hasAds: true,
            adPlacements: ['start', 'gameover']
        });
        
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10, name: '초급' },
            medium: { rows: 16, cols: 16, mines: 40, name: '중급' },
            hard: { rows: 16, cols: 30, mines: 99, name: '고급' }
        };
        
        this.currentDifficulty = 'easy';
        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.minesLeft = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.animatingCells = new Set();
        this.particles = [];
        
        // 사운드 초기화
        this.soundManager = SoundManager;
        this.registerSounds();
    }

    registerSounds() {
        // 지뢰찾기 전용 사운드 등록
        this.soundManager.createSound('mine_click', {
            frequency: 500,
            type: 'sine',
            duration: 0.1,
            volume: 0.3
        });
        
        this.soundManager.createSound('mine_flag', {
            frequency: 700,
            type: 'triangle',
            duration: 0.15,
            volume: 0.3
        });
        
        this.soundManager.createSound('mine_reveal', {
            frequencies: [400, 500, 600],
            type: 'sine',
            duration: 0.2,
            volume: 0.2
        });
        
        this.soundManager.createSound('mine_explode', {
            frequency: 150,
            type: 'sawtooth',
            duration: 0.5,
            volume: 0.4,
            vibrato: true
        });
        
        this.soundManager.createSound('mine_win', {
            frequencies: [523, 659, 784, 1047],
            type: 'sine',
            duration: 1,
            volume: 0.4
        });
        
        this.soundManager.createSound('mine_chord', {
            frequencies: [261, 329, 392],
            type: 'sine',
            duration: 0.3,
            volume: 0.2
        });
    }

    async init() {
        super.init();
        
        // 사운드 매니저 초기화
        await this.soundManager.init();
        
        const config = this.difficulties[this.currentDifficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.totalMines = config.mines;
        this.minesLeft = this.totalMines;
        
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.revealed = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
        this.flagged = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
        
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.timer = 0;
        this.particles = [];
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // 최고 기록 로드
        this.loadBestTime();
    }

    loadBestTime() {
        const key = `minesweeper_best_${this.currentDifficulty}`;
        this.bestTime = parseInt(localStorage.getItem(key)) || null;
    }

    saveBestTime() {
        if (!this.bestTime || this.timer < this.bestTime) {
            this.bestTime = this.timer;
            const key = `minesweeper_best_${this.currentDifficulty}`;
            localStorage.setItem(key, this.timer);
            return true;
        }
        return false;
    }

    render() {
        this.container.innerHTML = `
            <div class="minesweeper-wrapper">
                <div class="minesweeper-header">
                    <div class="mines-counter">
                        <span class="counter-icon">💣</span>
                        <span id="mines-count" class="counter-value">${String(this.minesLeft).padStart(3, '0')}</span>
                    </div>
                    <button class="game-face-btn" id="new-game-btn">
                        <span class="face-icon">😊</span>
                    </button>
                    <div class="timer-display">
                        <span class="timer-icon">⏱️</span>
                        <span id="timer" class="timer-value">${String(this.timer).padStart(3, '0')}</span>
                    </div>
                </div>
                
                <div class="difficulty-selector">
                    ${Object.entries(this.difficulties).map(([level, config]) => `
                        <button class="diff-btn ${this.currentDifficulty === level ? 'active' : ''}" 
                                data-level="${level}">
                            ${config.name}
                            <span class="diff-info">${config.rows}×${config.cols} (${config.mines})</span>
                        </button>
                    `).join('')}
                </div>
                
                ${this.bestTime ? `
                    <div class="best-time">
                        🏆 최고 기록: ${this.bestTime}초
                    </div>
                ` : ''}
                
                <div class="sound-notice">
                    🔊 사운드 효과가 활성화되어 있습니다
                </div>
                
                <div class="minesweeper-board ${this.currentDifficulty}" id="mines-board"></div>
                
                <canvas id="particle-canvas" class="particle-canvas"></canvas>
            </div>
        `;
        
        this.boardElement = document.getElementById('mines-board');
        this.minesCountElement = document.getElementById('mines-count');
        this.timerElement = document.getElementById('timer');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.particleCanvas = document.getElementById('particle-canvas');
        this.particleCtx = this.particleCanvas.getContext('2d');
        
        // 캔버스 크기 설정
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.bindEvents();
        this.updateDisplay();
        this.startParticleAnimation();
    }

    resizeCanvas() {
        const rect = this.container.getBoundingClientRect();
        this.particleCanvas.width = rect.width;
        this.particleCanvas.height = rect.height;
    }

    bindEvents() {
        // 새 게임 버튼
        this.newGameBtn.addEventListener('click', () => {
            this.soundManager.play('click');
            this.init();
            this.updateDisplay();
            this.updateFaceIcon('😊');
        });
        
        // 난이도 선택
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.soundManager.play('click');
                const newLevel = e.target.closest('.diff-btn').dataset.level;
                if (newLevel !== this.currentDifficulty) {
                    this.currentDifficulty = newLevel;
                    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                    e.target.closest('.diff-btn').classList.add('active');
                    this.init();
                    this.render();
                }
            });
        });
        
        // 보드 이벤트
        this.boardElement.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('cell') && !this.gameOver) {
                if (e.button === 0) {
                    this.updateFaceIcon('😮');
                }
            }
        });
        
        this.boardElement.addEventListener('mouseup', (e) => {
            if (!this.gameOver && e.button === 0) {
                this.updateFaceIcon('😊');
            }
        });
        
        this.boardElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell') && !this.gameOver) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                
                if (this.revealed[row][col] && !this.flagged[row][col]) {
                    // 숫자 클릭 시 코드 로직
                    this.handleChordClick(row, col);
                } else {
                    this.handleClick(row, col);
                }
            }
        });
        
        this.boardElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('cell') && !this.gameOver) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.handleRightClick(row, col);
            }
        });
        
        // 더블클릭으로도 코드 가능
        this.boardElement.addEventListener('dblclick', (e) => {
            if (e.target.classList.contains('cell') && !this.gameOver) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                if (this.revealed[row][col]) {
                    this.handleChordClick(row, col);
                }
            }
        });
    }

    updateFaceIcon(face) {
        const faceIcon = this.newGameBtn.querySelector('.face-icon');
        if (faceIcon) {
            faceIcon.textContent = face;
        }
    }

    placeMines(excludeRow, excludeCol) {
        let minesPlaced = 0;
        
        // 첫 클릭 주변은 안전 지역으로 보장
        const safeZone = new Set();
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = excludeRow + dr;
                const c = excludeCol + dc;
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    safeZone.add(`${r},${c}`);
                }
            }
        }
        
        while (minesPlaced < this.totalMines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            if (this.board[row][col] !== -1 && !safeZone.has(`${row},${col}`)) {
                this.board[row][col] = -1;
                minesPlaced++;
                
                // 주변 칸 숫자 증가
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const newRow = row + dr;
                        const newCol = col + dc;
                        
                        if (newRow >= 0 && newRow < this.rows && 
                            newCol >= 0 && newCol < this.cols && 
                            this.board[newRow][newCol] !== -1) {
                            this.board[newRow][newCol]++;
                        }
                    }
                }
            }
        }
    }

    handleClick(row, col) {
        if (this.revealed[row][col] || this.flagged[row][col]) return;
        
        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.startTimer();
            this.onGameStart();
        }
        
        this.reveal(row, col);
        this.checkWin();
        this.updateDisplay();
    }

    handleRightClick(row, col) {
        if (this.revealed[row][col] || this.firstClick) return;
        
        this.flagged[row][col] = !this.flagged[row][col];
        
        if (this.flagged[row][col]) {
            this.soundManager.play('mine_flag');
            this.createFlagParticles(row, col);
        } else {
            this.soundManager.play('click');
        }
        
        this.minesLeft = this.totalMines - this.flagged.flat().filter(f => f).length;
        this.updateMinesCount();
        this.updateDisplay();
    }

    handleChordClick(row, col) {
        if (!this.revealed[row][col] || this.board[row][col] <= 0) return;
        
        // 주변 깃발 수 계산
        let flagCount = 0;
        let unrevealed = [];
        
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const r = row + dr;
                const c = col + dc;
                
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    if (this.flagged[r][c]) {
                        flagCount++;
                    } else if (!this.revealed[r][c]) {
                        unrevealed.push([r, c]);
                    }
                }
            }
        }
        
        // 깃발 수가 숫자와 같으면 나머지 칸 열기
        if (flagCount === this.board[row][col]) {
            this.soundManager.play('mine_chord');
            unrevealed.forEach(([r, c]) => {
                this.reveal(r, c);
            });
            this.checkWin();
            this.updateDisplay();
        }
    }

    reveal(row, col, isChain = false) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
        if (this.revealed[row][col] || this.flagged[row][col]) return;
        
        this.revealed[row][col] = true;
        
        if (!isChain) {
            this.soundManager.play('mine_click');
        }
        
        // 애니메이션 효과
        this.animateReveal(row, col);
        
        if (this.board[row][col] === -1) {
            this.gameOver = true;
            this.updateFaceIcon('😵');
            this.soundManager.play('mine_explode');
            this.createExplosionParticles(row, col);
            this.revealAllMines();
            this.stopTimer();
            setTimeout(() => this.gameOver(), 1000);
            return;
        }
        
        if (this.board[row][col] === 0) {
            // 빈 칸이면 주변 칸도 열기
            this.soundManager.play('mine_reveal');
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr !== 0 || dc !== 0) {
                        setTimeout(() => {
                            this.reveal(row + dr, col + dc, true);
                        }, 50);
                    }
                }
            }
        }
    }

    animateReveal(row, col) {
        const cellKey = `${row},${col}`;
        this.animatingCells.add(cellKey);
        
        setTimeout(() => {
            this.animatingCells.delete(cellKey);
        }, 300);
    }

    revealAllMines() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.board[i][j] === -1) {
                    setTimeout(() => {
                        this.revealed[i][j] = true;
                        this.updateDisplay();
                    }, Math.random() * 500);
                }
            }
        }
    }

    checkWin() {
        let revealedCount = 0;
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.revealed[i][j]) revealedCount++;
            }
        }
        
        if (revealedCount === this.rows * this.cols - this.totalMines) {
            this.gameWon = true;
            this.gameOver = true;
            this.updateFaceIcon('😎');
            this.stopTimer();
            
            // 모든 지뢰에 깃발 표시
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    if (this.board[i][j] === -1 && !this.flagged[i][j]) {
                        this.flagged[i][j] = true;
                    }
                }
            }
            this.minesLeft = 0;
            this.updateMinesCount();
            
            // 승리 효과
            this.soundManager.play('mine_win');
            this.createWinParticles();
            
            // 최고 기록 저장
            const isNewRecord = this.saveBestTime();
            
            // 점수 계산 (난이도별 가중치 적용)
            const difficultyMultiplier = {
                easy: 1,
                medium: 2,
                hard: 3
            };
            const baseScore = 1000 * difficultyMultiplier[this.currentDifficulty];
            const timeBonus = Math.max(0, 1000 - this.timer * 10);
            const finalScore = baseScore + timeBonus;
            
            this.updateScore(finalScore);
            
            setTimeout(() => {
                if (isNewRecord) {
                    alert(`🎉 축하합니다! 새로운 최고 기록: ${this.timer}초`);
                }
                this.gameOver();
            }, 1500);
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimer();
            
            if (this.timer >= 999) {
                this.stopTimer();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        if (this.timerElement) {
            this.timerElement.textContent = String(Math.min(this.timer, 999)).padStart(3, '0');
        }
    }

    updateMinesCount() {
        if (this.minesCountElement) {
            const displayCount = Math.max(0, Math.min(999, this.minesLeft));
            this.minesCountElement.textContent = String(displayCount).padStart(3, '0');
        }
    }

    updateDisplay() {
        if (!this.boardElement) return;
        
        this.boardElement.innerHTML = '';
        this.boardElement.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                const cellKey = `${i},${j}`;
                if (this.animatingCells.has(cellKey)) {
                    cell.classList.add('revealing');
                }
                
                if (this.revealed[i][j]) {
                    cell.classList.add('revealed');
                    if (this.board[i][j] === -1) {
                        cell.innerHTML = '<span class="mine-icon">💣</span>';
                        if (!this.gameWon) {
                            cell.classList.add('mine');
                        }
                    } else if (this.board[i][j] > 0) {
                        cell.innerHTML = `<span class="cell-number">${this.board[i][j]}</span>`;
                        cell.classList.add(`number-${this.board[i][j]}`);
                    }
                } else if (this.flagged[i][j]) {
                    cell.innerHTML = '<span class="flag-icon">🚩</span>';
                    cell.classList.add('flagged');
                } else {
                    cell.classList.add('hidden');
                }
                
                this.boardElement.appendChild(cell);
            }
        }
    }

    // 파티클 효과
    createFlagParticles(row, col) {
        const cell = this.boardElement.children[row * this.cols + col];
        const rect = cell.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top + rect.height / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 5 - 2,
                life: 1,
                color: '#ff0000',
                size: Math.random() * 3 + 2
            });
        }
    }

    createExplosionParticles(row, col) {
        const cell = this.boardElement.children[row * this.cols + col];
        const rect = cell.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = Math.random() * 5 + 3;
            this.particles.push({
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top + rect.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: ['#ff0000', '#ff6600', '#ffff00'][Math.floor(Math.random() * 3)],
                size: Math.random() * 5 + 3
            });
        }
    }

    createWinParticles() {
        const containerRect = this.container.getBoundingClientRect();
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.particles.push({
                    x: Math.random() * containerRect.width,
                    y: containerRect.height,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 8 - 4,
                    life: 1,
                    color: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][Math.floor(Math.random() * 5)],
                    size: Math.random() * 4 + 2,
                    gravity: 0.2
                });
            }, i * 50);
        }
    }

    startParticleAnimation() {
        const animate = () => {
            if (!this.particleCtx) return;
            
            this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
            
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
                
                if (p.gravity) {
                    p.vy += p.gravity;
                }
                
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }
                
                this.particleCtx.save();
                this.particleCtx.globalAlpha = p.life;
                this.particleCtx.fillStyle = p.color;
                this.particleCtx.beginPath();
                this.particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.particleCtx.fill();
                this.particleCtx.restore();
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    cleanup() {
        super.cleanup();
        this.stopTimer();
        this.particles = [];
        window.removeEventListener('resize', () => this.resizeCanvas());
    }
}