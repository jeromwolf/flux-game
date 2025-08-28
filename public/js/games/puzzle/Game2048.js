import { EnhancedBaseGame } from '../../core/EnhancedBaseGame.js';
import SoundManager from '../../common/utils/SoundManager.js';
import i18n from '../../common/i18n/i18n.js';

export class Game2048 extends EnhancedBaseGame {
    constructor() {
        super({
            id: 'game2048',
            name: '2048',
            description: '숫자 타일을 합쳐서 2048을 만드세요',
            category: 'puzzle',
            difficulty: 'medium',
            hasAds: true,
            adPlacements: ['start', 'gameover']
        });
        
        this.size = 4;
        this.board = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('2048-best') || 0);
        this.gameOver = false;
        this.won = false;
        this.continueAfterWin = false;
        
        // 애니메이션용 타일 추적
        this.tiles = new Map();
        this.tileId = 0;
        
        // 실행 취소
        this.previousState = null;
        this.canUndo = true;
        
        // 콤보 시스템
        this.combo = 0;
        this.lastMergeTime = 0;
        
        // 파티클
        this.particles = [];
    }

    init() {
        super.init();
        
        // 사운드 초기화
        SoundManager.init();
        SoundManager.registerDefaultSounds();
        this.registerGameSounds();
        
        // 게임 초기화
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.continueAfterWin = false;
        this.tiles.clear();
        this.tileId = 0;
        this.previousState = null;
        this.canUndo = true;
        this.combo = 0;
        this.particles = [];
        
        this.setupUI();
        this.addNewTile();
        this.addNewTile();
        this.updateDisplay();
    }
    
    registerGameSounds() {
        // 타일 이동
        SoundManager.createSound('tile-move', {
            frequency: 400,
            type: 'sine',
            duration: 0.1,
            volume: 0.2
        });
        
        // 타일 병합
        SoundManager.createSound('tile-merge', {
            frequencies: [600, 800],
            type: 'sine',
            duration: 0.15,
            volume: 0.3
        });
        
        // 새 타일
        SoundManager.createSound('new-tile', {
            frequency: 500,
            type: 'square',
            duration: 0.1,
            volume: 0.2
        });
        
        // 큰 숫자 병합
        SoundManager.createSound('big-merge', {
            frequencies: [800, 1000, 1200],
            type: 'sine',
            duration: 0.3,
            volume: 0.4
        });
        
        // 2048 달성
        SoundManager.createSound('win-2048', {
            frequencies: [523, 659, 784, 1047],
            type: 'sine',
            duration: 0.5,
            volume: 0.5
        });
        
        // 콤보
        SoundManager.createSound('combo', {
            frequencies: [700, 900, 1100],
            type: 'square',
            duration: 0.2,
            volume: 0.3
        });
    }

    setupUI() {
        this.container.innerHTML = `
            <div class="game2048-wrapper">
                <div class="game2048-header">
                    <div class="game-title">
                        <h1 data-i18n="games.2048.name">2048</h1>
                        <p class="game-subtitle" data-i18n="games.2048.description">타일을 합쳐 2048을 만드세요!</p>
                    </div>
                    <div class="scores-container">
                        <div class="score-box current-score">
                            <div class="score-label" data-i18n="ui.score">점수</div>
                            <div class="score-value" id="current-score">0</div>
                            <div class="score-add" id="score-add"></div>
                        </div>
                        <div class="score-box best-score">
                            <div class="score-label" data-i18n="ui.highScore">최고기록</div>
                            <div class="score-value" id="best-score">${this.bestScore}</div>
                        </div>
                    </div>
                </div>
                
                <div class="game-controls">
                    <button class="btn-primary" id="new-game-btn" data-i18n="ui.newGame">새 게임</button>
                    <button class="btn-secondary" id="undo-btn" data-i18n="ui.undo">되돌리기</button>
                </div>
                
                <div class="game-board-container">
                    <div class="game2048-board" id="game-board">
                        <div class="grid-container">
                            ${Array(16).fill('<div class="grid-cell"></div>').join('')}
                        </div>
                        <div class="tile-container" id="tile-container"></div>
                    </div>
                    <div id="combo-indicator" class="combo-indicator hidden"></div>
                </div>
                
                <div class="game-message" id="game-message"></div>
                
                <div class="game-instructions">
                    <p><strong data-i18n="ui.controls">조작법:</strong> <span data-i18n="games.2048.instructions.controls">화살표 키 또는 스와이프로 타일을 이동하세요</span></p>
                    <p><strong data-i18n="ui.goal">목표:</strong> <span data-i18n="games.2048.instructions.goal">같은 숫자를 합쳐 2048을 만드세요!</span></p>
                </div>
            </div>
        `;
        
        this.boardElement = document.getElementById('game-board');
        this.tileContainer = document.getElementById('tile-container');
        this.scoreElement = document.getElementById('current-score');
        this.scoreAddElement = document.getElementById('score-add');
        this.bestScoreElement = document.getElementById('best-score');
        this.messageElement = document.getElementById('game-message');
        this.comboIndicator = document.getElementById('combo-indicator');
        
        this.bindEvents();
        
        // 버튼 사운드 추가
        setTimeout(() => {
            SoundManager.addButtonSounds(this.container);
        }, 100);
        
        // i18n 업데이트
        i18n.updatePageTranslations();
    }

    bindEvents() {
        // 새 게임 버튼
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.init();
        });
        
        // 되돌리기 버튼
        document.getElementById('undo-btn').addEventListener('click', () => {
            this.undo();
        });
        
        // 키보드 이벤트
        this.handleKeyPress = (e) => {
            if (this.gameOver && !this.continueAfterWin) return;
            
            let direction = null;
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    direction = 'left';
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    direction = 'right';
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    direction = 'up';
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    direction = 'down';
                    break;
            }
            
            if (direction) {
                this.makeMove(direction);
            }
        };
        
        document.addEventListener('keydown', this.handleKeyPress);
        
        // 터치 이벤트
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.boardElement.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        this.boardElement.addEventListener('touchend', (e) => {
            if (this.gameOver && !this.continueAfterWin) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
                let direction = null;
                
                if (Math.abs(dx) > Math.abs(dy)) {
                    direction = dx > 0 ? 'right' : 'left';
                } else {
                    direction = dy > 0 ? 'down' : 'up';
                }
                
                this.makeMove(direction);
            }
        });
    }
    
    makeMove(direction) {
        // 현재 상태 저장
        this.saveState();
        
        const moved = this.move(direction);
        
        if (moved) {
            SoundManager.play('tile-move');
            
            // 콤보 체크
            const now = Date.now();
            if (now - this.lastMergeTime < 3000) {
                this.combo++;
                if (this.combo > 1) {
                    this.showCombo();
                    SoundManager.play('combo');
                }
            } else {
                this.combo = 0;
            }
            this.lastMergeTime = now;
            
            setTimeout(() => {
                this.addNewTile();
                this.updateDisplay();
                this.checkGameStatus();
            }, 150);
        }
    }
    
    saveState() {
        this.previousState = {
            board: this.board.map(row => [...row]),
            score: this.score,
            tiles: new Map(this.tiles),
            gameOver: this.gameOver,
            won: this.won
        };
        this.canUndo = true;
        document.getElementById('undo-btn').disabled = false;
    }
    
    undo() {
        if (!this.canUndo || !this.previousState) return;
        
        this.board = this.previousState.board.map(row => [...row]);
        this.score = this.previousState.score;
        this.tiles = new Map(this.previousState.tiles);
        this.gameOver = this.previousState.gameOver;
        this.won = this.previousState.won;
        
        this.canUndo = false;
        document.getElementById('undo-btn').disabled = true;
        
        this.updateDisplay();
        SoundManager.play('click');
    }

    addNewTile() {
        const emptyCells = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 0) {
                    emptyCells.push({row: i, col: j});
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            this.board[randomCell.row][randomCell.col] = value;
            
            // 새 타일 추가
            const tile = {
                id: this.tileId++,
                value: value,
                row: randomCell.row,
                col: randomCell.col,
                isNew: true,
                isMerged: false
            };
            this.tiles.set(tile.id, tile);
            
            SoundManager.play('new-tile');
        }
    }

    move(direction) {
        const oldBoard = this.board.map(row => [...row]);
        const mergedTiles = [];
        let moved = false;
        
        // 타일 이동 정보 초기화
        const movements = [];
        
        switch (direction) {
            case 'left':
                moved = this.moveLeft(movements, mergedTiles);
                break;
            case 'right':
                this.board = this.board.map(row => row.reverse());
                moved = this.moveLeft(movements, mergedTiles);
                this.board = this.board.map(row => row.reverse());
                // 좌표 조정
                movements.forEach(m => m.toCol = this.size - 1 - m.toCol);
                break;
            case 'up':
                this.board = this.transpose(this.board);
                moved = this.moveLeft(movements, mergedTiles);
                this.board = this.transpose(this.board);
                // 좌표 교환
                movements.forEach(m => {
                    [m.fromRow, m.fromCol] = [m.fromCol, m.fromRow];
                    [m.toRow, m.toCol] = [m.toCol, m.toRow];
                });
                break;
            case 'down':
                this.board = this.transpose(this.board);
                this.board = this.board.map(row => row.reverse());
                moved = this.moveLeft(movements, mergedTiles);
                this.board = this.board.map(row => row.reverse());
                this.board = this.transpose(this.board);
                // 좌표 조정 및 교환
                movements.forEach(m => {
                    m.toCol = this.size - 1 - m.toCol;
                    [m.fromRow, m.fromCol] = [m.fromCol, m.fromRow];
                    [m.toRow, m.toCol] = [m.toCol, m.toRow];
                });
                break;
        }
        
        // 애니메이션 적용
        if (moved) {
            this.animateMovements(movements, mergedTiles);
        }
        
        return moved;
    }

    moveLeft(movements, mergedTiles) {
        let moved = false;
        
        for (let row = 0; row < this.size; row++) {
            const oldRow = [...this.board[row]];
            const newRow = this.board[row].filter(val => val !== 0);
            const merged = [];
            
            for (let i = 0; i < newRow.length; i++) {
                if (i < newRow.length - 1 && newRow[i] === newRow[i + 1]) {
                    // 병합
                    const mergedValue = newRow[i] * 2;
                    merged.push(mergedValue);
                    this.score += mergedValue;
                    
                    // 병합 애니메이션 정보
                    mergedTiles.push({
                        row: row,
                        col: merged.length - 1,
                        value: mergedValue
                    });
                    
                    // 큰 숫자 병합 시 특별 사운드
                    if (mergedValue >= 128) {
                        SoundManager.play('big-merge');
                    } else {
                        SoundManager.play('tile-merge');
                    }
                    
                    // 파티클 효과
                    this.createMergeParticles(row, merged.length - 1, mergedValue);
                    
                    i++; // 다음 타일 건너뛰기
                } else {
                    merged.push(newRow[i]);
                }
            }
            
            // 빈 공간 채우기
            while (merged.length < this.size) {
                merged.push(0);
            }
            
            // 이동 정보 기록
            let newCol = 0;
            for (let oldCol = 0; oldCol < this.size; oldCol++) {
                if (oldRow[oldCol] !== 0) {
                    if (oldCol !== newCol || oldRow[oldCol] !== merged[newCol]) {
                        movements.push({
                            fromRow: row,
                            fromCol: oldCol,
                            toRow: row,
                            toCol: newCol,
                            value: oldRow[oldCol]
                        });
                        moved = true;
                    }
                    newCol++;
                }
            }
            
            this.board[row] = merged;
        }
        
        return moved;
    }
    
    transpose(board) {
        return board[0].map((_, colIndex) => board.map(row => row[colIndex]));
    }
    
    animateMovements(movements, mergedTiles) {
        // 기존 타일 모두 제거
        this.tiles.clear();
        
        // 새로운 보드 상태로 타일 재생성
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] !== 0) {
                    const tile = {
                        id: this.tileId++,
                        value: this.board[row][col],
                        row: row,
                        col: col,
                        isNew: false,
                        isMerged: mergedTiles.some(m => m.row === row && m.col === col)
                    };
                    this.tiles.set(tile.id, tile);
                }
            }
        }
    }
    
    createMergeParticles(row, col, value) {
        const rect = this.boardElement.getBoundingClientRect();
        const cellSize = rect.width / this.size;
        const x = rect.left + col * cellSize + cellSize / 2;
        const y = rect.top + row * cellSize + cellSize / 2;
        
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 1,
                color: this.getTileColor(value)
            });
        }
    }
    
    showCombo() {
        this.comboIndicator.textContent = i18n.t('games.2048.combo', { count: this.combo });
        this.comboIndicator.classList.remove('hidden');
        
        setTimeout(() => {
            this.comboIndicator.classList.add('hidden');
        }, 2000);
    }

    checkGameStatus() {
        // 2048 체크
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 2048 && !this.won && !this.continueAfterWin) {
                    this.won = true;
                    SoundManager.play('win-2048');
                    this.showWinMessage();
                }
            }
        }
        
        // 게임 오버 체크
        if (!this.hasValidMoves()) {
            this.gameOver = true;
            SoundManager.play('gameover');
            this.showGameOverMessage();
        }
        
        // 최고 점수 업데이트
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('2048-best', this.bestScore);
            this.bestScoreElement.textContent = this.bestScore;
        }
    }

    hasValidMoves() {
        // 빈 칸 체크
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 0) return true;
            }
        }
        
        // 인접한 같은 숫자 체크
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const current = this.board[i][j];
                if ((i < this.size - 1 && current === this.board[i + 1][j]) ||
                    (j < this.size - 1 && current === this.board[i][j + 1])) {
                    return true;
                }
            }
        }
        
        return false;
    }

    updateDisplay() {
        // 타일 업데이트
        this.tileContainer.innerHTML = '';
        
        this.tiles.forEach(tile => {
            const tileElement = document.createElement('div');
            tileElement.className = `tile tile-${tile.value}`;
            tileElement.textContent = tile.value;
            
            if (tile.isNew) {
                tileElement.classList.add('tile-new');
                tile.isNew = false;
            }
            
            if (tile.isMerged) {
                tileElement.classList.add('tile-merged');
                tile.isMerged = false;
            }
            
            const cellSize = window.innerWidth <= 520 ? 75 : 100; // 반응형 크기
            tileElement.style.transform = `translate(${tile.col * cellSize}px, ${tile.row * cellSize}px)`;
            
            this.tileContainer.appendChild(tileElement);
        });
        
        // 점수 업데이트
        this.scoreElement.textContent = this.score;
        
        // 파티클 업데이트
        this.updateParticles();
    }
    
    updateParticles() {
        // 파티클은 CSS 애니메이션으로 처리
        this.particles = this.particles.filter(particle => {
            particle.life -= 0.02;
            return particle.life > 0;
        });
    }
    
    showScoreAdd(points) {
        this.scoreAddElement.textContent = `+${points}`;
        this.scoreAddElement.classList.add('score-add-active');
        
        setTimeout(() => {
            this.scoreAddElement.classList.remove('score-add-active');
        }, 600);
    }
    
    showWinMessage() {
        this.messageElement.innerHTML = `
            <div class="message-content win">
                <h2>${i18n.t('games.2048.winMessage.title')}</h2>
                <p>${i18n.t('games.2048.winMessage.subtitle')}</p>
                <div class="message-buttons">
                    <button class="btn-primary" onclick="document.querySelector('.game-message').style.display='none';window.game2048.continueAfterWin=true;">${i18n.t('ui.continue')}</button>
                    <button class="btn-secondary" onclick="window.game2048.init();">${i18n.t('ui.newGame')}</button>
                </div>
            </div>
        `;
        this.messageElement.style.display = 'flex';
        window.game2048 = this; // 버튼 클릭을 위한 임시 참조
    }
    
    showGameOverMessage() {
        this.messageElement.innerHTML = `
            <div class="message-content lose">
                <h2>${i18n.t('ui.gameOver')}</h2>
                <p>${i18n.t('games.2048.finalScore', { score: this.score })}</p>
                <button class="btn-primary" onclick="window.game2048.init();">${i18n.t('ui.newGame')}</button>
            </div>
        `;
        this.messageElement.style.display = 'flex';
        window.game2048 = this;
    }
    
    getTileColor(value) {
        const colors = {
            2: '#eee4da',
            4: '#ede0c8',
            8: '#f2b179',
            16: '#f59563',
            32: '#f67c5f',
            64: '#f65e3b',
            128: '#edcf72',
            256: '#edcc61',
            512: '#edc850',
            1024: '#edc53f',
            2048: '#edc22e'
        };
        return colors[value] || '#3c3a32';
    }
    
    cleanup() {
        super.cleanup();
        if (this.handleKeyPress) {
            document.removeEventListener('keydown', this.handleKeyPress);
        }
    }
}